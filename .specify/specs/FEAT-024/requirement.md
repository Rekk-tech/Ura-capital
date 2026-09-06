# Requirement: FEAT-024 Quiz Attempt Lifecycle

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-024  
**Phase**: Phase 4 — Academy  
**Feature Type**: Backend Domain Lifecycle, State Foundation & Constraint Migration  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Planning Status**: COMPLETE (HUMAN APPROVED)  
**Human Planning Approval**: APPROVED  
**Human Decisions (All Resolved / Locked via Human Rework Iterations 1 & 2)**:
1. **Active Attempt Policy**: One active `IN_PROGRESS` attempt per `(user, quiz)` tuple — **APPROVED BY HUMAN**
2. **Database Enforcement**: PostgreSQL partial unique index `UNIQUE (quiz_id, user_id) WHERE status = 'IN_PROGRESS'` as final integrity authority — **APPROVED BY HUMAN**
3. **`CREATED` State Runtime Policy**: Start attempt creates `IN_PROGRESS` directly; `CREATED` is schema-reserved and NOT treated as active by FEAT-024 runtime — **APPROVED BY HUMAN**
4. **Repeated Start Behavior & Result Metadata**: Idempotent return-existing active attempt; explicit service contract `StartAttemptResult { attempt, created }` driving HTTP `200 OK` (existing) vs `201 Created` (new) — **APPROVED BY HUMAN**
5. **Concurrency Strategy & P2002 Recovery**: Layered defense: PostgreSQL partial unique index (final authority) + transaction advisory lock (coordination/idempotency) + targeted P2002 race recovery (re-queries exact active attempt; unrelated uniqueness errors rethrown) — **APPROVED BY HUMAN**
6. **Draft Answer Persistence Scope**: Included in FEAT-024 (`PUT .../answers/:questionId`) with zero evaluation/scoring — **APPROVED BY HUMAN**
7. **Content Continuation & Historical Read Policy**:
   - `IN_PROGRESS` attempt: cannot continue (GET current, GET by ID, PUT draft answer) if Course, Lesson, or Quiz becomes non-`PUBLISHED` (`404 NOT_FOUND`).
   - `SUBMITTED` / `GRADED` attempt: owner may continue to READ historical safe DTO even if hierarchy unpublishes; draft mutation is strictly rejected (`409 ATTEMPT_ALREADY_FINALIZED`) — **APPROVED BY HUMAN**
8. **Strict Start Request Body**: Body must be empty `{}`; client attempts to supply authoritative fields (`userId`, `quizId`, `status`, `score`, etc.) are rejected with `400 VALIDATION_ERROR` — **APPROVED BY HUMAN**
9. **Schema Migration Strategy**: Minimal constraint-only migration (forward-only, preflight duplicate check, zero table/column drift) — **APPROVED BY HUMAN**  
**Unresolved Human Decisions**: **ZERO**  
**Implementation Status**: NOT_STARTED  
**QA Status**: NOT_STARTED  
**Human Final Gate**: NOT APPROVED  
**FEAT-025**: BLOCKED  
**Phase 4 Status**: IN_PROGRESS  

---

## 1. Context & Background

Phase 4 establishes learner-facing Academy capabilities on the approved Aura architecture:
- **FEAT-019**: Domain schema and persistence foundation (`DONE`, `feat-019-approved`).
- **FEAT-020**: Course & Lesson read model APIs (`DONE`, `feat-020-approved`).
- **FEAT-021**: Academy learner course/lesson UI (`DONE`, `feat-021-approved`).
- **FEAT-022**: Flashcards domain and review flow (`DONE`, `feat-022-approved`).
- **FEAT-023**: Quiz definition read API and safe projection contract (`DONE`, `feat-023-approved`).

FEAT-024 is the sixth feature in Phase 4. It establishes the **durable, server-owned Quiz Attempt lifecycle**. It bridges the pre-submission quiz definition read model (FEAT-023) and server-side evaluation/grading (FEAT-025) by enabling authenticated learners to start attempts, resume active attempts, read historical finalized attempts, and record draft answer selections with mathematical relational integrity, database-enforced active attempt uniqueness, and strict answer secrecy.

---

## 2. Core Goal

Establish a server-authoritative, durable quiz attempt lifecycle in PostgreSQL:
1. Provide an authenticated API to start a quiz attempt for the primary published quiz of a published course/lesson.
2. Enforce the **Active Attempt Invariant**: at most one active (`IN_PROGRESS`) attempt per user per quiz, enforced directly by a **PostgreSQL partial unique index** as the final authority.
3. Provide replay-safe, idempotent start behavior using explicit result metadata (`StartAttemptResult { attempt, created }`) returning `200 OK` for existing attempts and `201 Created` for new attempts.
4. Prevent race conditions on concurrent start requests using a layered strategy: PostgreSQL partial unique index + transaction-scoped advisory locking + targeted P2002 race recovery.
5. Provide a draft answer selection endpoint (`PUT /api/academy/quiz-attempts/:attemptId/answers/:questionId`) enabling learners to select and replace choices during an active attempt without evaluating correctness.
6. Provide authenticated read endpoints to retrieve the learner's current active attempt for a lesson and attempt details by ID, enforcing current publication continuation for `IN_PROGRESS` attempts while allowing owner-safe historical reads for `SUBMITTED`/`GRADED` attempts.
7. Maintain **AC-011 Pre-Submission Correctness Secrecy**: zero leakage of correct answers, correctness evaluation, scores, or pass/fail flags before final submission in FEAT-025.
8. Retain read-only boundaries on progress, XP, and reward ledgers (zero mutation of `AcademyUserCourseProgress`, `AcademyUserLessonProgress`, `AcademyUserXp`, or `AcademyRewardLedger`).
9. Maintain zero Redis authority (attempt state resides strictly in PostgreSQL).
10. Execute a **minimal constraint-only database migration** to add the partial unique active index without adding tables or unrelated columns.

---

## 3. Approved Architectural Decisions

### 3.1. Active Attempt Policy & Runtime States
- **Approved Decision**: Exactly **one active `IN_PROGRESS` attempt per user per quiz**.
- **Runtime Lifecycle Boundary**:
  - `POST .../quiz/attempts` creates an attempt with `status = 'IN_PROGRESS'` directly.
  - `CREATED` is an existing schema lifecycle value but is **NOT** used as an active state by FEAT-024 runtime.
  - Active-attempt lookups filter strictly on `status = 'IN_PROGRESS'`.
  - FEAT-024 does **not** implement a `CREATED -> IN_PROGRESS` transition. If a legacy/schema-reserved `CREATED` row is encountered on read, it is treated as unavailable (`404 QUIZ_ATTEMPT_NOT_FOUND`).
  - Transitions from `IN_PROGRESS -> SUBMITTED -> GRADED` are owned strictly by FEAT-025.
  - Finalized attempts (`SUBMITTED` or `GRADED`) are immutable to draft answer mutations (`409 ATTEMPT_ALREADY_FINALIZED`).

### 3.2. Database-Enforced Active Constraint Migration
- **Approved Decision**: Production-strong database integrity via a **PostgreSQL partial unique index**:
  ```sql
  CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_active_key"
  ON "academy_quiz_attempts"("quiz_id", "user_id")
  WHERE "status" = 'IN_PROGRESS';
  ```
- **Migration Posture**:
  - Minimal, forward-only migration.
  - Zero new tables; zero new columns; zero seed data.
  - Includes preflight duplicate check (fails safely if historical data contains duplicate active attempts; does not silently rewrite/delete data).
  - Passes fresh DB migration and existing-schema upgrade gates.

### 3.3. Layered Concurrency & Targeted P2002 Race Recovery
- **Approved Strategy**:
  - **Layer 1 (Database Constraint)**: The partial unique index guarantees that two `IN_PROGRESS` rows for the same `(quiz_id, user_id)` cannot co-exist in PostgreSQL under any concurrency scenario.
  - **Layer 2 (Application Advisory Lock)**: A transaction-scoped advisory lock `SELECT pg_advisory_xact_lock(hashtext('quiz_attempt:' || $userId || ':' || $quizId))` coordinates concurrent requests so that racing starts serialize cleanly.
  - **Collision Characteristics**: `hashtext()` outputs a 32-bit integer. In the rare event of a hash collision between distinct `(user, quiz)` pairs, the two unrelated requests simply serialize momentarily behind the transaction lock; **no data corruption or cross-tenant leakage can occur**.
  - **Layer 3 (Targeted P2002 Recovery)**:
    - If a unique violation (Prisma `P2002`) occurs during attempt creation, the repository does **not** assume all `P2002` errors are active-attempt races.
    - It queries for an existing attempt with exact `(userId, quizId, status: 'IN_PROGRESS')`.
    - If an active attempt exists, it safely returns `{ attempt: existing, created: false }`.
    - If no active attempt exists (e.g. an unrelated unique violation such as an `attemptNumber` sequence collision), the error is **re-thrown** and mapped through the sanitized database error path. It is never silently converted into a fake success.

### 3.4. Explicit Start Result Contract
- **Approved Decision**: The repository and service layers return an explicit result:
  ```typescript
  export interface StartAttemptResult {
    attempt: AcademyQuizAttemptWithAnswers;
    created: boolean;
  }
  ```
- **Semantics**:
  - Newly inserted attempt: `created: true` -> Controller returns HTTP `201 Created`.
  - Existing active attempt (found before insert): `created: false` -> Controller returns HTTP `200 OK`.
  - Existing active attempt (race-recovered via P2002): `created: false` -> Controller returns HTTP `200 OK`.
  - Controller relies strictly on `created` and never infers status from timestamps or attempt numbers.

### 3.5. Draft Answer Persistence & Evaluation Boundary
- **Approved Decision**: FEAT-024 persists draft answer selections:
  - `PUT /api/academy/quiz-attempts/:attemptId/answers/:questionId` with `{ optionId: string }`.
  - Replaces previous draft selection idempotently on `@@unique([attemptId, questionId])`.
  - Populates `selectedOptionId`, `questionPromptSnapshot`, and `selectedOptionTextSnapshot` (historical display only).
  - Strictly sets `isCorrect = NULL`, `correctOptionIdSnapshot = NULL`, `correctOptionTextSnapshot = NULL`.
  - Zero scoring, zero pass/fail, zero explanation reveal.
  - Historical snapshots are display-only and NOT client-authoritative for grading; FEAT-025 evaluation will follow server-authoritative relational rules.

### 3.6. Content Continuation & Finalized Historical Read Policy
- **`IN_PROGRESS` Attempt Policy**:
  - An ongoing attempt may be continued (read or edited) only while Course, Lesson, and Quiz remain `PUBLISHED`.
  - If any entity becomes `DRAFT`, `ARCHIVED`, or deleted:
    - `POST .../quiz/attempts` -> `404 NOT_FOUND`
    - `GET .../quiz/attempts/current` -> `404 NOT_FOUND`
    - `GET /api/academy/quiz-attempts/:attemptId` -> `404 NOT_FOUND`
    - `PUT .../answers/:questionId` -> `404 NOT_FOUND`
- **`SUBMITTED` / `GRADED` Attempt Policy**:
  - The authenticated owner MAY continue to read the safe historical attempt DTO via `GET /api/academy/quiz-attempts/:attemptId` even if the parent course/lesson/quiz is no longer published.
  - Attempt history is durable learner-owned historical state.
  - However, draft mutation is strictly rejected: `PUT .../answers/:questionId` -> `409 ATTEMPT_ALREADY_FINALIZED` (checked before unpublished status).
  - Cross-user access to any attempt (active or finalized) returns generic `404 QUIZ_ATTEMPT_NOT_FOUND`.

### 3.7. Strict Start Request Body Policy
- The body for `POST .../quiz/attempts` must be an empty JSON object `{}`.
- If the client sends an authoritative property (e.g. `userId`, `quizId`, `status`, `score`, `passed`, `startedAt`, etc.), the request is rejected with `400 VALIDATION_ERROR`.
- Client-supplied authoritative fields are NEVER silently accepted or ignored.

### 3.8. Canonical Aura Error Vocabulary
FEAT-024 strictly adheres to existing Aura error codes and envelopes:
- `400`: `VALIDATION_ERROR` (malformed format, invalid UUID, or forbidden client fields).
- `400`: `INVALID_OPTION_FOR_QUESTION` (option does not belong to question or question does not belong to quiz).
- `401`: `UNAUTHENTICATED` (missing, expired, or invalid JWT token).
- `404`: `NOT_FOUND` ("Resource not found" — hierarchy missing, draft, archived, or mismatched).
- `404`: `QUIZ_ATTEMPT_NOT_FOUND` ("Quiz attempt not found" — nonexistent, inactive, or owned by another user).
- `409`: `ATTEMPT_ALREADY_FINALIZED` (attempt is `SUBMITTED` or `GRADED`).
- `500`: `INTERNAL_ERROR` (sanitized internal server error).

Envelope structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### 3.9. Frontend Cache Authority
- Server is the sole authority for quiz attempt state.
- TanStack Query hooks do **not** optimistically overwrite the attempt answer cache prior to server response.
- UI may show transient button pending state; upon server response, query cache is updated/invalidated from server data.
- On error, previous persisted selection remains displayed without split-brain state.

---

## 4. Hard Invariants & Security Boundaries

1. **Server Authority**:
   - `userId` is strictly derived from `req.user.id` (`authenticate` middleware). Never accepted from request body or query params.
   - `attemptId`, `quizId`, `attemptNumber`, `status`, `startedAt`, `createdAt`, `updatedAt` are server-generated and server-owned.
   - Client cannot send `score`, `passed`, `completedAt`, `correctness`, `isCorrect`, `points`, `xp`, or `reward`.
2. **AC-011 Pre-Submission Correct Answer Secrecy**:
   - Neither attempt creation, attempt retrieval, nor draft answer responses may reveal `isCorrect`, `correctOptionId`, `explanation`, `solution`, `answerKey`, `score`, or `passed`.
   - In `AcademyQuizAnswer`, fields `isCorrect`, `correctOptionIdSnapshot`, and `correctOptionTextSnapshot` remain `NULL` during FEAT-024.
   - Any correctness leak constitutes a **P1 Security Defect / Feature Fail**.
3. **Cross-User Isolation**:
   - Every attempt belongs to exactly one authenticated user.
   - Attempt access by another user returns generic `404 QUIZ_ATTEMPT_NOT_FOUND` (non-enumerating).
4. **Relational Hierarchy Verification**:
   - Attempt creation verifies `course (PUBLISHED) -> lesson (PUBLISHED) -> quiz (PUBLISHED)` matching FEAT-023 lowest-order published quiz policy.
   - Draft answer selection verifies that `questionId` belongs to `attempt.quizId` and `optionId` belongs to `questionId`.
5. **State Machine Authorization**:
   - Draft answers may only be recorded if attempt status is `IN_PROGRESS`.
   - Attempts in `SUBMITTED` or `GRADED` reject answer modifications with `409 ATTEMPT_ALREADY_FINALIZED`.
6. **Zero Progress / Reward Side Effects**:
   - Zero writes to progress models (`AcademyUserCourseProgress`, `AcademyUserLessonProgress`).
   - Zero writes to reward models (`AcademyUserXp`, `AcademyRewardLedger`).
   - Zero durable state in Redis.
   - Zero product audit records created.
