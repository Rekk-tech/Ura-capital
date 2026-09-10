# Acceptance Criteria: FEAT-025 Server-Side Quiz Evaluation & Secure Submission

**Feature ID**: FEAT-025  
**Feature Name**: Server-Side Quiz Evaluation & Secure Submission  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  

---

## 1. Acceptance Criteria Summary

| ID | Category | Description | Hard Gate |
|:---|:---|:---|:---:|
| **AC-001** | Authentication | Attempt submit and result endpoints require valid JWT authentication (`401 UNAUTHENTICATED`) | YES |
| **AC-002** | Strict Submit Body | Submit body must be empty `{}`; authoritative client fields rejected with `400 VALIDATION_ERROR` | YES |
| **AC-003** | Ownership Isolation | Access to submit or read another user's attempt yields `404 QUIZ_ATTEMPT_NOT_FOUND` (zero 403 oracle) | YES |
| **AC-004** | Publication Scope | Active attempt submission requires Course, Lesson, and Quiz `PUBLISHED` (`404 NOT_FOUND`) | YES |
| **AC-005** | Unanswered Guard | Submitting an attempt with unanswered questions is rejected with `400 UNANSWERED_QUESTIONS` | YES |
| **AC-006** | Zero-Question Guard | Submitting a quiz with 0 questions is rejected with `400 INVALID_QUIZ_STATE` ("Quiz has no questions to evaluate") | YES |
| **AC-007** | Server-Authoritative Evaluation | Answer evaluation derives strictly from server-side option correctness (`AcademyQuizOption.isCorrect`) | **CRITICAL HARD GATE** |
| **AC-008** | Correctness Snapshot Persistence | `isCorrect`, `correctOptionIdSnapshot`, and `correctOptionTextSnapshot` written atomically to answers | YES |
| **AC-009** | Score Formula | Score computed as integer percentage $\text{Math.round}((C / N) \times 100)$ where $N > 0$ | YES |
| **AC-010** | Pass/Fail | `passed` flag set to `score >= quiz.passingScore` derived strictly on the server | YES |
| **AC-011** | Atomic SUBMITTED $\rightarrow$ GRADED Lifecycle | Two-stage transition `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED` inside one atomic transaction with rollback on failure | YES |
| **AC-012** | Active Attempt Constraint Release | Setting attempt to `GRADED` releases PostgreSQL partial unique index, allowing future attempts | YES |
| **AC-013** | Idempotent Historical Result Return | Repeated submit of an already `GRADED` attempt returns HTTP 200 with persisted result, reconstructed without re-evaluating live correctness | YES |
| **AC-014** | Concurrent Submit Safety | Concurrent submit requests serialize cleanly via row-level `SELECT ... FOR UPDATE`; exactly one evaluation occurs; zero duplicate side-effects | YES |
| **AC-015** | Dedicated Result Read | `GET .../result` allows owner to read graded result; returns `404 QUIZ_ATTEMPT_NOT_FOUND` if not graded | YES |
| **AC-016** | Historical Result Continuation | Owner can read graded result via `GET .../result` even if source content is later unpublished | YES |
| **AC-017** | Draft Immutability | Attempting to mutate draft answers on `GRADED` attempt returns `409 ATTEMPT_ALREADY_FINALIZED` | YES |
| **AC-018** | Pre-Submission Secrecy Regression | FEAT-023 quiz read and FEAT-024 attempt endpoints continue to expose ZERO correctness metadata | **CRITICAL HARD GATE** |
| **AC-019** | Zero External Side Effects & DB Constraints | Zero Redis authority; zero mutations to progress, XP, or audit tables; PostgreSQL enforces score range and coherent graded-state constraints | YES |
| **AC-020** | Canonical Regression / Truthful Governance | Monorepo clean, lint, typecheck, build, unit, DB, Redis, and all guard tests pass | YES |

---

## 2. Deterministic Verification Details

### AC-001: Authentication Required
- Unauthenticated requests to `POST .../quiz-attempts/:id/submit` or `GET .../quiz-attempts/:id/result` return HTTP `401 Unauthorized` (`code: "UNAUTHENTICATED"`).

### AC-002: Strict Empty Submission Body
- Submitting a body containing `{ "score": 100 }`, `{ "passed": true }`, `{ "isCorrect": true }`, or `{ "userId": "..." }` returns `400 Bad Request` (`code: "VALIDATION_ERROR"`). Client has zero authority over scoring or evaluation.

### AC-003: Cross-User Ownership Isolation
- When User B calls `POST .../submit` or `GET .../result` on User A's attempt, server returns `404 Not Found` (`code: "QUIZ_ATTEMPT_NOT_FOUND"`, message: `"Quiz attempt not found"`), indistinguishable from a nonexistent UUID. Zero 403 oracle.

### AC-004: Published Content Scoping
- Submitting an active `IN_PROGRESS` attempt whose course, lesson, or quiz is `DRAFT` or `ARCHIVED` returns `404 Not Found` (`code: "NOT_FOUND"`, message: `"Resource not found"`).

### AC-005: Unanswered Questions Guard
- Submitting an attempt where 1 or more questions lack an `AcademyQuizAnswer` record returns `400 Bad Request` (`code: "UNANSWERED_QUESTIONS"`). Distinct from malformed input (`VALIDATION_ERROR`).

### AC-006: Zero-Question Guard
- Submitting an attempt for a quiz with 0 questions returns `400 Bad Request` (`code: "INVALID_QUIZ_STATE"`, message: `"Quiz has no questions to evaluate"`). Prevents division by zero.

### AC-007: Server-Authoritative Evaluation (CRITICAL HARD GATE)
- Evaluation derives strictly from `AcademyQuizOption.isCorrect = true`. Server compares `selectedOptionId` from PostgreSQL against `isCorrect` option ID. Any client attempt to inject correctness or score is rejected.

### AC-008: Snapshot Persistence
- During evaluation transaction, `AcademyQuizAnswer` is updated with `isCorrect` (boolean), `correctOptionIdSnapshot` (string UUID), and `correctOptionTextSnapshot` (string).

### AC-009: Score Formula & Rounding
- Formula: $\text{Math.round}((\text{correctCount} / \text{totalCount}) \times 100)$. Stored as integer (0-100) in `AcademyQuizAttempt.score`.

### AC-010: Pass/Fail Determination
- Server checks `score >= quiz.passingScore`. Result is persisted in `AcademyQuizAttempt.passed`.

### AC-011: Atomic SUBMITTED $\rightarrow$ GRADED Lifecycle
- Attempt transitions atomically through `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED` with `submittedAt` and `gradedAt` populated. If any operation in the transaction fails, all changes rollback, leaving the attempt `IN_PROGRESS` with zero partial snapshots.

### AC-012: Active Attempt Invariant Release
- Transition to `GRADED` satisfies `status != 'IN_PROGRESS'`, freeing the partial unique index constraint and permitting subsequent attempt creation.

### AC-013: Idempotent Historical Result Return
- Submitting an already `GRADED` attempt returns the existing persisted result with HTTP `200 OK`. The result is reconstructed strictly from persisted attempt and answer snapshot records, without re-evaluating live `isCorrect`.

### AC-014: Concurrency Safety via Row Locking
- 5 concurrent submit requests dispatched simultaneously acquire `SELECT ... FOR UPDATE` row locks; exactly 1 evaluation executes; remaining waiters observe `GRADED` and receive identical HTTP 200 responses with identical scores; zero database corruptions.

### AC-015: Dedicated Graded Result Read
- `GET .../result` returns the graded DTO for the attempt owner. If the attempt is not yet `GRADED`, returns `404 Not Found` (`code: "QUIZ_ATTEMPT_NOT_FOUND"`).

### AC-016: Historical Result Continuation
- Owner can read graded result via `GET .../result` even if course/lesson/quiz is subsequently unpublished.

### AC-017: Draft Mutation Immutability
- `PUT .../answers/:questionId` on a `GRADED` attempt continues to return `409 Conflict` (`code: "ATTEMPT_ALREADY_FINALIZED"`).

### AC-018: Pre-Submission Secrecy Regression (CRITICAL HARD GATE)
- Pre-submission endpoints (FEAT-023 quiz read, FEAT-024 attempt read, FEAT-024 draft save) continue to return ZERO correctness metadata (`isCorrect`, `explanation`, `score`, `passed`).

### AC-019: Zero External Side Effects & DB Constraints
- Zero Redis keys or attempt state; zero mutations to `AcademyUserCourseProgress`, `AcademyUserLessonProgress`, `AcademyUserXp`, or `AcademyRewardLedger`; zero product audit records.
- Database enforces `score` range (`0 <= score <= 100`) and coherent attributes for `GRADED` state via additive CHECK constraints.

### AC-020: Canonical Monorepo Validation Gate
- All 14 canonical commands exit with code 0: `clean`, `lint`, `prisma validate`, `typecheck`, `build`, `test`, `test:unit`, `test:db`, `test:redis`, `guard:persistence`, `guard:migration`, `guard:boundary`, `guard:audit-governance`, `guard:seed-safety`.
