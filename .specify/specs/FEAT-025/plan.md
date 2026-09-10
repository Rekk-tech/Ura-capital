# Implementation Plan: FEAT-025 Server-Side Quiz Evaluation & Secure Submission

**Feature ID**: FEAT-025  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  

---

## 1. Architectural Approach & Layering

The implementation strictly follows the Aura architectural layering:

```
[Web UI: LessonDetailPage]
       │
       ▼ (HTTP POST .../submit or GET .../result)
[Route: academy.routes.ts]
       │
       ▼
[Controller: academy-quiz-attempt.controller.ts]
       │
       ▼
[Service: academy-quiz-attempt.service.ts]
       │
       ▼ (transactionRunner.run)
[Repository: academy.repository.ts]
       │
       ▼ (Row Lock SELECT ... FOR UPDATE + Check Constraints)
[PostgreSQL: academy_quiz_attempts / academy_quiz_answers]
```

### Key Architectural Tenets
1. **Minimal Additive Check-Constraint Migration**:
   - `20260907000000_feat025_grading_integrity_constraints` adds score range (0-100) and coherent `GRADED` state checks on `academy_quiz_attempts`.
2. **Strict Repository Boundary for Row Locking**:
   - `SELECT ... FOR UPDATE` is executed strictly inside `academy.repository.ts`. The Controller and Service never issue raw SQL or locking queries directly.
3. **Two-Stage Atomic Transaction**:
   - Transitions `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED` in a single database transaction. Rollback on failure leaves attempt `IN_PROGRESS` with zero partial grading.
4. **Row-Level Concurrency Protection**:
   - Acquires row lock before checking status. Concurrent submit requests wait for the lock, observe `status === 'GRADED'`, and execute idempotent replay.
5. **Replay-Safe Historical Result Reconstruction**:
   - Reconstructs result exclusively from persisted snapshot fields in `AcademyQuizAttempt` and `AcademyQuizAnswer`. Never re-queries live `isCorrect`.
6. **Dedicated Result Endpoint**:
   - `GET /api/academy/quiz-attempts/:attemptId/result` keeps the FEAT-024 safe attempt DTO stable and unpolluted.
7. **Omission of `passingScore` from Historical DTO**:
   - Because `AcademyQuizAttempt` does not snapshot `passingScore`, it is omitted from `QuizResultDto` to avoid displaying a later-mutated threshold. The persisted `passed` boolean remains the sole historical authority.

---

## 2. Component Design & Changes

### 2.1. Database Migration (`apps/api/prisma/migrations/`)
- Migration `20260907000000_feat025_grading_integrity_constraints`:
  - Adds `academy_quiz_attempts_score_range_check`.
  - Adds `academy_quiz_attempts_graded_state_check`.

### 2.2. Shared Package (`packages/shared`)
- **Types**:
  - `QuizResultAnswerDto`: `{ questionId: string; selectedOptionId: string | null; isCorrect: boolean; correctOptionId: string }`
  - `QuizResultDto`: `{ attemptId: string; quizId: string; status: "GRADED"; score: number; passed: boolean; submittedAt: string; gradedAt: string; answers: QuizResultAnswerDto[] }`
- **Schemas**:
  - `SubmitQuizAttemptRequestSchema`: Strict empty object `z.object({}).strict()`
  - `QuizResultDtoSchema`: Zod schema for result validation
  - `QuizResultAnswerDtoSchema`: Zod schema for answer validation

### 2.3. API Backend (`apps/api`)
- **Repository** (`academy.repository.ts`):
  - `submitAndGradeAttempt(userId: string, attemptId: string)`:
    - Scoped `SELECT ... FOR UPDATE` on attempt.
    - Idempotent check for `status === 'GRADED'`.
    - Validation of `IN_PROGRESS` state, content publication, and complete answers.
    - Intermediate update to `status = 'SUBMITTED'`, `submittedAt = now()`.
    - Relational & defensive exactly-one-correct checks.
    - Answer snapshot writes (`isCorrect`, `correctOptionIdSnapshot`, `correctOptionTextSnapshot`).
    - Final update to `status = 'GRADED'`, `score`, `passed`, `gradedAt = now()`.
  - `findGradedAttemptResult(userId: string, attemptId: string)`:
    - Reconstructs result strictly from persisted snapshot fields.
    - Returns null if attempt does not exist, belongs to another user, or is not `GRADED`.
- **Service** (`academy-quiz-attempt.service.ts`):
  - `submitAttempt(userId: string, attemptId: string)`
  - `getAttemptResult(userId: string, attemptId: string)`
- **Controller** (`academy-quiz-attempt.controller.ts`):
  - `submit(req, res)`: Invokes service, maps result to HTTP `200 OK`.
  - `getResult(req, res)`: Invokes service, maps result to HTTP `200 OK`.
- **Routes** (`academy.routes.ts`):
  - `POST /api/academy/quiz-attempts/:attemptId/submit`
  - `GET /api/academy/quiz-attempts/:attemptId/result`

### 2.4. Frontend Client (`apps/web`)
- **API Client** (`apps/web/src/api/academy.api.ts`):
  - `submitQuizAttempt(attemptId: string): Promise<QuizResultDto>`
  - `getQuizAttemptResult(attemptId: string): Promise<QuizResultDto>`
- **Hooks** (`apps/web/src/features/academy/hooks/use-academy.ts`):
  - `useSubmitQuizAttempt()`: Mutation hook invalidating attempt queries.
  - `useQuizAttemptResult(attemptId: string)`: Query hook fetching graded result.
- **UI Shell** (`LessonDetailPage.tsx`):
  - "Submit Quiz" button rendered when all questions have draft answers.
  - Submitting state with loading indicator.
  - Graded result card displaying Score, Pass/Fail badge, and per-question checkmarks.
  - Zero XP, zero course completion, and zero client-side evaluation logic.

---

## 3. Verification & Testing Strategy

### 3.1. Unit Tests
- `academy-quiz-attempt.service.test.ts`:
  - Score rounding: tests `Math.round` on fractional percentages (e.g. 1/3 $\rightarrow$ 33, 2/3 $\rightarrow$ 67, 4/5 $\rightarrow$ 80).
  - Pass/fail threshold boundaries: threshold equality passes (`80 >= 80` $\rightarrow$ `true`); below threshold fails (`79 >= 80` $\rightarrow$ `false`).
  - Empty quiz rejection with `400 INVALID_QUIZ_STATE`.
  - Unanswered questions rejection with `400 UNANSWERED_QUESTIONS`.
  - Malformed body rejection with `400 VALIDATION_ERROR`.

### 3.2. Live Database Integration Tests
- `apps/api/tests/integration/academy-quiz-evaluation-db.test.ts`:
  - **Happy Path Evaluation**: Evaluates all questions, verifies integer score and pass/fail flag, and checks that answer snapshots are persisted.
  - **5 Concurrent Submits**: Dispatches 5 simultaneous submit requests on the same active attempt; verifies exactly 1 evaluation occurs, all 5 get HTTP `200 OK` with identical results, and zero database corruptions.
  - **Transaction Rollback**: Injects failure before final commit; confirms attempt remains `IN_PROGRESS` with zero partial snapshot writes.
  - **Idempotent Historical Replay**: Submits a `GRADED` attempt repeatedly; alters live option text/correctness in quiz and confirms the replayed result remains identical to the original evaluation.
  - **Ownership / IDOR**: User B calling submit or read result on User A's attempt receives `404 QUIZ_ATTEMPT_NOT_FOUND` (zero 403 oracle).
  - **Unpublished Scoping**: Submitting an active attempt whose course/lesson/quiz was unpublished returns `404 NOT_FOUND`. Historical graded result remains readable.
  - **Draft Immutability**: `PUT .../answers/:questionId` on a `GRADED` attempt returns `409 ATTEMPT_ALREADY_FINALIZED`.
  - **Pre-Submission Secrecy Regression (CRITICAL HARD GATE)**: Verifies FEAT-023 quiz read and FEAT-024 attempt read endpoints continue to expose ZERO correctness data before submission.
  - **Zero External Side Effects**: Confirms 0 mutations to progress, XP, reward ledger, and audit tables.
  - **Database Constraint Verification**: Confirms PostgreSQL rejects out-of-range scores (`< 0` or `> 100`) and incomplete `GRADED` rows.
