# Requirement: FEAT-025 Server-Side Quiz Evaluation & Secure Submission

**Status**: READY FOR HUMAN PLANNING REVIEW  
**Feature ID**: FEAT-025  
**Phase**: Phase 4 — Academy  
**Feature Type**: Backend Domain Evaluation, Lifecycle Finalization & Result Projection  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Planning Status**: COMPLETE (PENDING HUMAN APPROVAL)  
**Human Planning Approval**: PENDING  
**Human Decisions (All Resolved & Locked via Planning Rework Iteration 1)**:
1. **Lifecycle Transition Strategy**:
   - **APPROVED BY HUMAN**: Two-stage transition `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED` occurs inside **ONE atomic PostgreSQL transaction**.
   - Canonical sequence: (1) acquire row lock via `SELECT ... FOR UPDATE`, (2) validate submission eligibility, (3) set intermediate state `status = 'SUBMITTED'`, `submittedAt = now()`, (4) evaluate answers against server authority, (5) persist answer correctness snapshots, (6) compute score and pass/fail, (7) finalize attempt with `status = 'GRADED'`, `gradedAt = now()`, `score`, `passed`, (8) commit.
   - `SUBMITTED` is an internal intermediate transactional state, not externally observable during synchronous completion. Any failure rolls back the transaction completely, leaving the attempt `IN_PROGRESS` with zero partial grading state.
2. **Repeated Submission Idempotency**:
   - **APPROVED BY HUMAN**: Repeated `POST .../submit` of an already `GRADED` owned attempt returns HTTP `200 OK` with the existing persisted `QuizResultDto`.
   - Does NOT re-evaluate, rewrite snapshots, re-query live correctness, or alter timestamps (`submittedAt`, `gradedAt`). Supports network-retry idempotency.
3. **Unanswered Questions Handling**:
   - **APPROVED BY HUMAN**: ALL quiz questions must have a persisted draft answer before submission.
   - If one or more questions are unanswered, the request is rejected with HTTP `400` and `error.code: "UNANSWERED_QUESTIONS"`. (Reserved domain error code; distinct from `VALIDATION_ERROR`).
4. **Score Computation & Rounding**:
   - **APPROVED BY HUMAN**: Score formula for single-choice quizzes:
     $$\text{score} = \text{Math.round}\left(\frac{\text{correctCount}}{\text{totalCount}} \times 100\right)$$
     where $\text{totalCount} > 0$. Stored as integer (0-100) in `AcademyQuizAttempt.score`.
5. **Zero-Question Quiz Guard**:
   - **APPROVED BY HUMAN**: A quiz with zero questions cannot be evaluated. Submission is rejected with HTTP `400`, `error.code: "INVALID_QUIZ_STATE"`, and message `"Quiz has no questions to evaluate"`. Prevents division by zero.
6. **Post-Grade Result Visibility & Explanation Policy**:
   - **APPROVED BY HUMAN**: Result DTO returns overall score, `passed` boolean, and per-question `{ questionId, selectedOptionId, isCorrect, correctOptionId }`. Question `explanation` is **DEFERRED / NOT RETURNED** to prevent unnecessary data exposure.
7. **Result Endpoint Architecture**:
   - **APPROVED BY HUMAN**: Dedicated `GET /api/academy/quiz-attempts/:attemptId/result` endpoint alongside `POST .../submit`.
   - Keeps FEAT-024 safe attempt DTO stable and unpolluted with evaluation metadata.
8. **Retry Policy After Grading**:
   - **APPROVED BY HUMAN**: Once an attempt reaches `GRADED`, the learner may start a new attempt through the existing FEAT-024 `POST .../quiz/attempts` endpoint (no retry limit in Phase 4 MVP).
9. **Content Mutation Evaluation Limitation**:
   - **APPROVED BY HUMAN**: Phase-4 MVP limitation: FEAT-025 evaluates draft answers using the **CURRENT server-authoritative published quiz definition** at submission time. Snapshots (`isCorrect`, `correctOptionIdSnapshot`, `correctOptionTextSnapshot`) are frozen atomically at grading time.
   - FEAT-025 does NOT implement immutable quiz-definition versioning. If options or answer keys are modified while an attempt is `IN_PROGRESS`, the current published definition at submission time controls grading. Future versioning is deferred.
10. **Database Constraint Audit & Minimal Migration**:
    - **APPROVED BY HUMAN**: Schema audit reveals that while basic status and attempt number checks exist, PostgreSQL currently lacks CHECK constraints on score range (0-100) and coherent `GRADED` state attributes.
    - Human approves a **MINIMAL ADDITIVE CHECK-CONSTRAINT MIGRATION** to enforce:
      1. `0 <= score <= 100` when score is non-null.
      2. When `status = 'GRADED'`, `score`, `passed`, `submitted_at`, and `graded_at` must all be `NOT NULL`.
      3. When `status IN ('CREATED', 'IN_PROGRESS')`, `score`, `passed`, and `graded_at` must be `NULL`.
    - Introduces zero new tables, zero destructive column changes, zero seed data, and zero automatic historical data repair.
11. **Historical `passingScore` Semantics**:
    - **APPROVED BY HUMAN (OPTION B)**: `AcademyQuizAttempt` does not snapshot `passingScore`. To prevent displaying a later-mutated `quiz.passingScore` as the historical threshold, **`passingScore` is OMITTED from the historical `QuizResultDto`**. The persisted `passed` boolean remains the sole historical authority.

**Unresolved Human Decisions**: **ZERO**  
**Implementation Status**: NOT_STARTED  
**QA Status**: NOT_STARTED  
**Human Final Gate**: NOT APPROVED  
**FEAT-026**: BLOCKED  
**Phase 4 Status**: IN_PROGRESS  

---

## 1. Context & Background

Phase 4 establishes learner-facing Academy capabilities on the approved Aura architecture:
- **FEAT-019**: Domain schema and persistence foundation (`DONE`).
- **FEAT-020**: Course & Lesson read model APIs (`DONE`).
- **FEAT-021**: Academy learner course/lesson UI (`DONE`).
- **FEAT-022**: Flashcards domain and review flow (`DONE`).
- **FEAT-023**: Quiz definition read API and safe projection contract (`DONE`).
- **FEAT-024**: Quiz Attempt lifecycle, active-attempt invariant, and draft answer persistence (`DONE`).

FEAT-025 is the seventh feature in Phase 4. It establishes the **server-authoritative evaluation and secure submission lifecycle**. It finalizes active quiz attempts by evaluating persisted draft selections against authoritative answer keys in PostgreSQL, computing scores, determining pass/fail outcomes, writing immutable historical snapshots, enforcing database integrity constraints, and projecting secure results.

---

## 2. Core Goals

1. **Authenticated Submission Endpoint**:
   - `POST /api/academy/quiz-attempts/:attemptId/submit` requiring valid JWT learner authentication.
   - Body is strictly empty `{}` (validated via strict Zod); evaluates server-persisted draft answers.
2. **Server-Authoritative Evaluation**:
   - Evaluation derives strictly from server-side option correctness (`AcademyQuizOption.isCorrect`). Client-provided scores, correctness flags, or timestamps are strictly rejected.
3. **Atomic State Transition (`IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED`)**:
   - Transactional transition executing inside a single atomic database transaction using row-level locking (`SELECT ... FOR UPDATE`).
   - Releases PostgreSQL partial unique active index upon reaching `GRADED`.
4. **Historical Correctness Snapshots**:
   - Writes `isCorrect`, `correctOptionIdSnapshot`, and `correctOptionTextSnapshot` into `AcademyQuizAnswer` records atomically at grading time.
5. **Deterministic Scoring & Pass/Fail**:
   - Score computed as integer percentage $\text{Math.round}((C / N) \times 100)$.
   - `passed = score >= quiz.passingScore`.
6. **Concurrent Submission Serialization**:
   - Row-level lock on attempt prevents duplicate evaluation, race conditions, or inconsistent scoring.
7. **Replay-Safe Idempotency**:
   - Repeated submission of a `GRADED` attempt returns the existing graded result with HTTP `200 OK`, reconstructed strictly from persisted attempt and answer snapshot records without re-evaluating.
8. **Dedicated Result Endpoint**:
   - `GET /api/academy/quiz-attempts/:attemptId/result` allowing the attempt owner to read their graded result. Returns `404 QUIZ_ATTEMPT_NOT_FOUND` if attempted by another user or if attempt is not yet graded.
9. **Strict Secrecy Regression Barrier**:
   - Pre-submission endpoints (FEAT-023 quiz read, FEAT-024 attempt read, FEAT-024 draft save) continue to expose **zero correctness metadata**.
10. **Zero External Side Effects**:
    - Zero Redis attempt authority.
    - Zero mutations to course progress, lesson progress, XP, or reward ledgers (owned by FEAT-026/027).
    - Zero product audit records.
11. **Minimal Additive Check-Constraint Migration**:
    - Adds database-enforced integrity checks on score range and state attribute coherence.

---

## 3. Scope Boundaries

### In Scope
- Minimal database migration adding score range and coherent graded-state CHECK constraints on `academy_quiz_attempts`
- `POST /api/academy/quiz-attempts/:attemptId/submit`
- `GET /api/academy/quiz-attempts/:attemptId/result`
- Row-level locking via repository `SELECT ... FOR UPDATE`
- Two-stage atomic state transition `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED`
- Server-side answer correctness check against `AcademyQuizOption.isCorrect`
- Relational integrity verification (confirming persisted answers match attempt quiz)
- Exactly-one-correct defensive check
- Score calculation and pass/fail determination
- Answer snapshot persistence (`isCorrect`, `correctOptionIdSnapshot`, `correctOptionTextSnapshot`)
- Idempotent repeated submission handling reconstructed from persisted records
- Frontend "Submit Quiz" button, submitting state, and graded result card
- Unit, live database integration, concurrency, and rollback tests

### Out of Scope (Strictly Forbidden)
- Client-side evaluation or answer key trust
- Question explanation exposure in result DTO (deferred)
- Course/lesson completion or progression updates (FEAT-026)
- XP awarding or reward ledger grants (FEAT-027)
- Product audit persistence (FEAT-029)
- Redis attempt authority or caching
- Schema column additions or destructive alterations
