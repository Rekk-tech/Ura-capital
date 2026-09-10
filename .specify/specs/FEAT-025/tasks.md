# Implementation Tasks: FEAT-025 Server-Side Quiz Evaluation & Secure Submission

**Feature ID**: FEAT-025  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  

---

## 1. Task Breakdown & Dependency Order

| Task ID | Phase | Summary | Dependencies | Output / Deliverables |
|:---|:---|:---|:---:|:---|
| **T1** | Preflight | Schema & constraint audit: verify existing constraints and define minimal additive migration | None | Audit section in spec.md |
| **T2** | Governance | Lock all 11 Human-approved decisions in specification | T1 | Approved decisions in requirement.md |
| **T3** | Migration | Create and apply minimal additive migration for score range and coherent graded-state CHECK constraints | T2 | `20260907000000_feat025_grading_integrity_constraints` |
| **T4** | Shared Contracts | Define `QuizResultDto`, `QuizResultAnswerDto`, and Zod request/response schemas | T2 | `packages/shared/src/types/index.ts`, `schemas/index.ts` |
| **T5** | Repository Logic | Implement repository row-locking (`SELECT ... FOR UPDATE`), two-stage transition, and snapshot writing | T3, T4 | `apps/api/src/modules/academy/academy.repository.ts` |
| **T6** | Service & Routing | Implement service evaluation orchestration, controller methods, and route bindings | T5 | `academy-quiz-attempt.service.ts`, `controller.ts`, `routes.ts` |
| **T7** | Result Projection | Implement replay-safe historical result reconstruction for `GET .../result` | T6 | Safe DTO projection and IDOR protection |
| **T8** | Frontend UI | Implement "Submit Quiz" button, loading state, and graded result card in learner UI | T7 | `apps/web/src/features/academy/pages/LessonDetailPage.tsx` |
| **T9** | Unit Testing | Implement unit tests for scoring rounding, passing threshold equality, and error codes | T7 | `apps/api/tests/unit/academy-quiz-attempt.service.test.ts` |
| **T10** | DB & Concurrency Tests | Live PostgreSQL tests for 5-request concurrency, rollback, historical replay, IDOR, and secrecy regression | T9 | `apps/api/tests/integration/academy-quiz-evaluation-db.test.ts` |
| **T11** | Full Validation & Report | Execute canonical 14 validation commands, generate implementation report, update progress tracker | T8, T10 | `reports/implementation/phase-4/FEAT-025.md` |

---

## 2. Detailed Task Descriptions

### Task T1: Schema & DB Constraint Capability Audit
- Audit existing database constraints on `academy_quiz_attempts`.
- Confirm missing score range check (0-100) and coherent graded-state attributes.
- Formulate minimal additive migration SQL.

### Task T2: Lock Human-Approved Decisions
- Lock all 11 Human decisions:
  1. Two-stage transition `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED` inside ONE atomic transaction.
  2. Idempotent return of persisted result on repeated submit.
  3. Strict completion requirement (all questions answered, error code `UNANSWERED_QUESTIONS`).
  4. Integer percentage via `Math.round`.
  5. 0-question quiz rejection (error code `INVALID_QUIZ_STATE`).
  6. Post-grade result visibility (explanation deferred).
  7. Dedicated `GET .../result` endpoint.
  8. Unlimited retry capability (new attempt allowed once current is graded).
  9. Current server-authoritative live definition evaluated at submission.
  10. Minimal additive check-constraint migration.
  11. `passingScore` omitted from historical `QuizResultDto` (Option B).

### Task T3: Minimal Additive Migration
- Create `apps/api/prisma/migrations/20260907000000_feat025_grading_integrity_constraints/migration.sql`.
- Add `academy_quiz_attempts_score_range_check` (`0 <= score <= 100`).
- Add `academy_quiz_attempts_graded_state_check` (coherency of score, passed, and timestamps for `GRADED`, `SUBMITTED`, and `IN_PROGRESS`).

### Task T4: Shared Contracts & Schemas
- Add `SubmitQuizAttemptRequestSchema` (strict empty object `{}`).
- Add `QuizResultAnswerDto` and `QuizResultDto` types and schemas in `@aura/shared`.

### Task T5: Repository Evaluation & Row Locking
- Implement `submitAndGradeAttempt` inside `transactionRunner.run` in `academy.repository.ts`.
- Execute `SELECT ... FOR UPDATE` scoped by `id` and `user_id`.
- Re-read attempt under lock; execute idempotent return if already `GRADED`.
- Set intermediate `status = 'SUBMITTED'`, `submittedAt = now()`.
- Compare draft answers against `AcademyQuizOption.isCorrect = true`.
- Defensively check exactly one correct option per question.
- Atomically update answer snapshots (`isCorrect`, `correctOptionIdSnapshot`, `correctOptionTextSnapshot`).
- Finalize attempt with `status = 'GRADED'`, `score`, `passed`, `gradedAt = now()`.

### Task T6: Service, Controller, and Route Bindings
- Register `POST /api/academy/quiz-attempts/:attemptId/submit`.
- Register `GET /api/academy/quiz-attempts/:attemptId/result`.
- Enforce JWT authentication, strict request body validation, and error mapping.

### Task T7: Result Projection & Idempotent Reconstruction
- Implement `findGradedAttemptResult`.
- Reconstruct result exclusively from persisted snapshot fields in attempt and answers (never re-query live correctness).
- Enforce ownership isolation (returns `404 QUIZ_ATTEMPT_NOT_FOUND` on foreign or nonexistent attempt).

### Task T8: Frontend UI Shell & Submit Action
- Update `use-academy.ts` with submit mutation and result query hooks.
- Render "Submit Quiz" button in `LessonDetailPage.tsx` when all questions answered.
- Display score and pass/fail outcome after grading.

### Task T9: Unit Tests
- Test integer rounding for fractional scores.
- Test pass/fail boundaries (`score === passingScore` vs `score < passingScore`).
- Test empty quiz rejection (`INVALID_QUIZ_STATE`).
- Test strict unanswered rejection (`UNANSWERED_QUESTIONS`).
- Test strict empty body validation (`VALIDATION_ERROR`).

### Task T10: Live PostgreSQL Integration Tests
- 5 concurrent submit requests (verifying exactly 1 evaluation and identical 200 responses).
- Direct DB validation of persisted snapshots in `academy_quiz_answers`.
- Transaction rollback on simulated failure.
- Historical result replay after live quiz option mutation.
- Ownership isolation (User B cannot submit or read User A's attempt).
- Draft answer immutability after grading (`409 ATTEMPT_ALREADY_FINALIZED`).
- Pre-submission secrecy regression (FEAT-023/024 endpoints remain 100% secret).
- Database check constraint validation (rejection of score > 100 or incomplete `GRADED` row).

### Task T11: Full Validation & Implementation Report
- Execute canonical 14 validation commands.
- Compile implementation report `reports/implementation/phase-4/FEAT-025.md`.
- Prepare for independent QA verification.
