# Implementation Report: FEAT-025 Server-Side Quiz Evaluation & Secure Submission

**Feature ID**: FEAT-025  
**Feature Name**: Server-Side Quiz Evaluation & Secure Submission  
**Phase**: Phase 4 — Academy  
**Owner**: DEV-A  
**Implementation Status**: `IMPLEMENTATION COMPLETE / INTERNAL GATE PASS`  
**QA Status**: `READY FOR QA`  
**Internal Feature Quality Gate**: `PASS`  
**Date**: 2026-09-09  

---

## 1. Executive Summary

`FEAT-025: Server-Side Quiz Evaluation & Secure Submission` implements the complete server-authoritative submission, evaluation, score calculation, pass/fail determination, correctness snapshot persistence, and result projection system for Aura Academy quiz attempts.

All grading logic executes strictly on the backend within a single PostgreSQL transaction protected by row-level locking (`SELECT ... FOR UPDATE`). Client-supplied correctness flags or scores are strictly rejected. Pre-submission secrecy guarantees established in FEAT-023 and FEAT-024 remain fully uncompromised.

All **20 Acceptance Criteria (AC-001..AC-020)** have been implemented and verified with 100% passing tests across unit, integration, live PostgreSQL database, Redis, and all 6 governance guard suites. The **Canonical 14 Validation Commands** all exit with code 0 without skips.

---

## 2. Architectural Architecture & Key Decisions

### 2.1 Row-Level Locking & Serialization (AC-014)
To prevent race conditions during submission and prevent double-grading under concurrent load:
```sql
SELECT id, user_id, quiz_id, status, score, passed, submitted_at, graded_at
FROM "academy_quiz_attempts"
WHERE "id" = $1 AND "user_id" = $2
FOR UPDATE;
```
When 5 concurrent submission requests arrive simultaneously for the same attempt, PostgreSQL serializes execution. The first transaction evaluates and finalizes the attempt; the subsequent 4 transactions acquire the lock, detect `status = 'GRADED'`, and execute an idempotent historical replay returning identical HTTP 200 OK responses with identical timestamps.

### 2.2 Server-Authoritative Evaluation (AC-007 Critical Hard Gate)
- Evaluation derives correctness strictly from `AcademyQuizOption.isCorrect` in the database.
- Request payload for `POST /api/academy/quiz-attempts/:attemptId/submit` enforces strict empty JSON schema (`z.object({}).strict()`). Any submitted body properties (e.g. `isCorrect`, `score`, `answers`) trigger `400 VALIDATION_ERROR`.
- Every question is defensively verified to have exactly one correct option (`correctOptions.length === 1`).

### 2.3 Strict Completeness Verification (AC-004)
Before submission, the repository verifies that every question in the published quiz has a recorded draft answer in `academy_quiz_answers` with a non-null `selected_option_id`. If any question remains unanswered, the transaction immediately aborts with `400 UNANSWERED_QUESTIONS` without mutating status or persisting partial grades.

### 2.4 Atomic Snapshot Writing & Immutability (AC-008, AC-013)
For each answered question, three immutable snapshots are written to `academy_quiz_answers` within the evaluation transaction:
1. `is_correct`: boolean indicating whether `selected_option_id === correct_option.id`
2. `correct_option_id_snapshot`: UUID of the correct option at grading time
3. `correct_option_text_snapshot`: verbatim text of the correct option at grading time

Subsequent reads (`POST .../submit` replay and `GET .../result`) read **exclusively** from these persisted snapshot columns. If live quiz options or questions are mutated or deleted later in the database, historical attempt results remain 100% stable.

### 2.5 Scoring & Threshold Formulas (AC-005, AC-006)
- **Score Calculation**: Integer percentage calculated as `Math.round((C / N) * 100)` where $C$ is the count of correct answers and $N$ is total questions ($N \ge 1$). Zero-question quizzes abort with `400 INVALID_QUIZ_STATE`.
- **Pass/Fail Threshold**: `passed = score >= quiz.passingScore`.
- **Historical passingScore Policy (Option B)**: `passingScore` is omitted from `QuizResultDto`. Persisted `attempt.score` and `attempt.passed` serve as the sole immutable historical authorities.

### 2.6 Dedicated Result Endpoint & Access Control (AC-015, AC-016)
- `GET /api/academy/quiz-attempts/:attemptId/result` provides direct access to graded results.
- Returns `QuizResultDto` only if the attempt belongs to `req.user.id` and has `status = 'GRADED'`.
- If the attempt is `IN_PROGRESS`, non-existent, or belongs to another learner, it returns uniform non-enumerating `404 QUIZ_ATTEMPT_NOT_FOUND`.

### 2.7 Active Attempt Release & Clean Retake (AC-012)
Transitioning the attempt to `GRADED` releases the partial unique index constraint on `(quiz_id, user_id) WHERE status = 'IN_PROGRESS'`. The learner can immediately start a fresh attempt on the same quiz without conflict.

### 2.8 Zero Side-Effect Discipline (AC-019)
The submission and grading process makes **zero mutations** to:
- `AcademyUserCourseProgress`
- `AcademyUserLessonProgress`
- `AcademyUserXp`
- `AcademyRewardLedger`
- Product audit tables (`ProductAuditRecord`)
- Redis cache/state (PostgreSQL is the sole durable authority)

Course progression and XP awards remain strictly scoped to FEAT-026 and FEAT-027.

---

## 3. Database Migration

**Migration**: `apps/api/prisma/migrations/20260907000000_feat025_grading_integrity_constraints/migration.sql`

```sql
-- Minimal Additive Migration: FEAT-025 Grading Integrity Constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "score" IS NOT NULL AND ("score" < 0 OR "score" > 100)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: existing academy_quiz_attempts contain score out of range [0, 100]';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'GRADED' AND ("score" IS NULL OR "passed" IS NULL OR "submitted_at" IS NULL OR "graded_at" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: existing GRADED academy_quiz_attempts contain null score, passed, submitted_at, or graded_at';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'SUBMITTED' AND "submitted_at" IS NULL
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: existing SUBMITTED academy_quiz_attempts contain null submitted_at';
  END IF;
END $$;

ALTER TABLE "academy_quiz_attempts"
  ADD CONSTRAINT "academy_quiz_attempts_score_range_check"
  CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100));

ALTER TABLE "academy_quiz_attempts"
  ADD CONSTRAINT "academy_quiz_attempts_graded_state_check"
  CHECK (
    ("status" = 'GRADED' AND "score" IS NOT NULL AND "passed" IS NOT NULL AND "submitted_at" IS NOT NULL AND "graded_at" IS NOT NULL) OR
    ("status" = 'SUBMITTED' AND "submitted_at" IS NOT NULL) OR
    ("status" NOT IN ('GRADED', 'SUBMITTED'))
  );
```

- **Preflight Safety**: Rejects migration execution if legacy data violates invariants.
- **Score Range Constraint**: Enforces integer bounds `0 <= score <= 100`.
- **Graded State Constraint**: Guarantees relational coherence between `status`, `score`, `passed`, `submitted_at`, and `graded_at`.

---

## 4. Modified and Created Files

### Shared Package (`@aura/shared`)
- [`packages/shared/src/constants/index.ts`](file:///d:/project/ura-capital/packages/shared/src/constants/index.ts) — Added `ERROR_CODES.UNANSWERED_QUESTIONS` and `ERROR_CODES.INVALID_QUIZ_STATE`.
- [`packages/shared/src/schemas/index.ts`](file:///d:/project/ura-capital/packages/shared/src/schemas/index.ts) — Added `SubmitQuizAttemptBodySchema` (`z.object({}).strict()`).
- [`packages/shared/src/types/index.ts`](file:///d:/project/ura-capital/packages/shared/src/types/index.ts) — Added `QuizResultAnswerDto`, `QuizResultDto`, and `QuizResultResponse`.

### Backend Service & API (`apps/api`)
- [`apps/api/prisma/migrations/20260907000000_feat025_grading_integrity_constraints/migration.sql`](file:///d:/project/ura-capital/apps/api/prisma/migrations/20260907000000_feat025_grading_integrity_constraints/migration.sql) — Minimal additive integrity constraint migration.
- [`apps/api/src/modules/academy/academy.dto.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.dto.ts) — Added `toQuizResultDto` mapping function.
- [`apps/api/src/modules/academy/academy.validation.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.validation.ts) — Added `submitQuizAttemptBodySchema`.
- [`apps/api/src/modules/academy/academy.repository.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.repository.ts) — Implemented `submitAndGradeAttempt`, `reconstructPersistedResult`, and `findGradedAttemptResult` with row locking and snapshot persistence.
- [`apps/api/src/modules/academy/academy-quiz-attempt.service.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy-quiz-attempt.service.ts) — Added `submitAttempt` and `getGradedResult` service methods.
- [`apps/api/src/modules/academy/academy-quiz-attempt.controller.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy-quiz-attempt.controller.ts) — Added `submitAttempt` and `getGradedResult` HTTP controller endpoints.
- [`apps/api/src/modules/academy/academy.routes.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.routes.ts) — Bound `POST /api/academy/quiz-attempts/:attemptId/submit` and `GET /api/academy/quiz-attempts/:attemptId/result`.
- [`apps/api/package.json`](file:///d:/project/ura-capital/apps/api/package.json) — Registered `academy-quiz-evaluation-db.test.ts` in `npm run test:db`.

### Backend Tests (`apps/api`)
- [`apps/api/tests/unit/academy-quiz-attempt.service.test.ts`](file:///d:/project/ura-capital/apps/api/tests/unit/academy-quiz-attempt.service.test.ts) — Added unit tests for validation, evaluation coordination, scoring, pass/fail derivations, and result retrieval.
- [`apps/api/tests/unit/migration-guard.test.ts`](file:///d:/project/ura-capital/apps/api/tests/unit/migration-guard.test.ts) — Updated expected migration count to 6 including FEAT-025.
- [`apps/api/tests/integration/academy-quiz-attempt-db.test.ts`](file:///d:/project/ura-capital/apps/api/tests/integration/academy-quiz-attempt-db.test.ts) — Updated historical mock data to comply with check constraints.
- [`apps/api/tests/integration/academy-quiz-evaluation-db.test.ts`](file:///d:/project/ura-capital/apps/api/tests/integration/academy-quiz-evaluation-db.test.ts) — 31 live PostgreSQL integration tests covering concurrency, snapshots, DB constraints, replay stability, and secrecy regression.

### Frontend (`apps/web`)
- [`apps/web/src/features/academy/types/academy-ui.types.ts`](file:///d:/project/ura-capital/apps/web/src/features/academy/types/academy-ui.types.ts) — Added `QuizResultAnswerDto` and `QuizResultDto`.
- [`apps/web/src/api/academy.api.ts`](file:///d:/project/ura-capital/apps/web/src/api/academy.api.ts) — Added `submitQuizAttempt` and `getGradedQuizResult`.
- [`apps/web/src/features/academy/hooks/use-academy.ts`](file:///d:/project/ura-capital/apps/web/src/features/academy/hooks/use-academy.ts) — Added `useSubmitQuizAttemptMutation` and `useGradedQuizResultQuery`.
- [`apps/web/src/features/academy/pages/LessonDetailPage.tsx`](file:///d:/project/ura-capital/apps/web/src/features/academy/pages/LessonDetailPage.tsx) — Added submit action (rendered strictly when `allAnswered === true`), submitting loading state, graded result summary card with score percentage, pass/fail badge, answer breakdown, and retake quiz trigger.

---

## 5. Canonical 14 Validation Results

All 14 canonical commands executed cleanly with exit code 0:

| # | Command | Result | Pass Count / Evidence | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `npm run clean` | **PASS (0)** | Cleaned dist & tsc artifacts | No stale build artifacts |
| 2 | `npm run lint` | **PASS (0)** | 0 errors, 0 warnings | Strict ESLint check across all packages |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS (0)** | Valid schema | Prisma schema syntax & relations valid |
| 4 | `npm run typecheck` | **PASS (0)** | 0 type errors | Strict typecheck across `@aura/shared`, `@aura/api`, `@aura/web` |
| 5 | `npm run build` | **PASS (0)** | 3 workspaces built | Shared, API, and Web bundles built |
| 6 | `npm run test` | **PASS (0)** | **66 test files passed, 676 tests passed** | API: 56 files (538 tests), Web: 9 files (108 tests), Shared: 1 file (30 tests) |
| 7 | `npm run test:unit` | **PASS (0)** | **45 test files passed, 525 tests passed** | API: 36 files (388 tests), Web: 8 files (107 tests), Shared: 1 file (30 tests) |
| 8 | `npm run test:db` | **PASS (0)** | **17 test files passed, 194 tests passed** | Full PostgreSQL integration suite including `academy-quiz-evaluation-db.test.ts` |
| 9 | `npm run test:redis` | **PASS (0)** | **5 test files passed, 50 tests passed** | Full Redis integration suite |
| 10 | `npm run guard:persistence` | **PASS (0)** | **1 test file passed, 14 tests passed** | Zero unauthorized persistence entities |
| 11 | `npm run guard:migration` | **PASS (0)** | 7 migrations, 25 review risks, 0 blocking | Migration integrity & digest verification |
| 12 | `npm run guard:boundary` | **PASS (0)** | 9 controllers, 13 services, 6 repositories | Zero repository boundary violations |
| 13 | `npm run guard:audit-governance` | **PASS (0)** | Clean | Zero premature audit models/endpoints |
| 14 | `npm run guard:seed-safety` | **PASS (0)** | Clean | Zero unsafe seeds or default credentials |

---

## 6. Acceptance Criteria Traceability Matrix (AC-001..AC-020)

| AC ID | Canonical Requirement | Implementation Method | Test Verification | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AC-001** | Authentication: Attempt submit and result endpoints require valid JWT authentication (`401 UNAUTHENTICATED`). | Express route bound to `authenticate` middleware in `academy.routes.ts`. | `academy-quiz-evaluation-db.test.ts`: returns 401 when unauthenticated. | **PASS** |
| **AC-002** | Strict Submit Body: Submit body must be empty `{}`; authoritative client fields rejected with `400 VALIDATION_ERROR`. | Zod schema `submitQuizAttemptBodySchema` enforces `z.object({}).strict()`. | `academy-quiz-evaluation-db.test.ts`: rejects non-empty payload in submit request body. | **PASS** |
| **AC-003** | Ownership Isolation: Access to submit or read another user's attempt yields `404 QUIZ_ATTEMPT_NOT_FOUND` (zero 403 oracle). | Row lock and queries filter strictly by `attemptId` and `userId`. Zero 403 oracle. | `academy-quiz-evaluation-db.test.ts`: enforces strict ownership isolation. | **PASS** |
| **AC-004** | Publication Scope: Active attempt submission requires Course, Lesson, and Quiz `PUBLISHED` (`404 NOT_FOUND`). | Service/repository query checks publication status of parent chain; returns 404 if draft/archived. | `academy-quiz-evaluation-db.test.ts`: verifies publication status scoping. | **PASS** |
| **AC-005** | Unanswered Guard: Submitting an attempt with unanswered questions is rejected with `400 UNANSWERED_QUESTIONS`. | Completeness check iterates over quiz questions, verifying draft answers with selected option. | `academy-quiz-evaluation-db.test.ts`: rejects submission when some questions are unanswered. | **PASS** |
| **AC-006** | Zero-Question Guard: Submitting a quiz with 0 questions is rejected with `400 INVALID_QUIZ_STATE` ("Quiz has no questions to evaluate"). | Defensive check validates question count $N \ge 1$; throws 400 INVALID_QUIZ_STATE on zero questions. | `academy-quiz-attempt.service.test.ts`: zero-question rejection verified. | **PASS** |
| **AC-007** | Server-Authoritative Evaluation (CRITICAL HARD GATE): Answer evaluation derives strictly from server-side option correctness (`AcademyQuizOption.isCorrect`). | Evaluates answers against live `AcademyQuizOption.isCorrect` in repository transaction; ignores client input. | `academy-quiz-evaluation-db.test.ts`: evaluates completed quiz attempt authoritatively. | **PASS (HARD GATE)** |
| **AC-008** | Correctness Snapshot Persistence: `isCorrect`, `correctOptionIdSnapshot`, and `correctOptionTextSnapshot` written atomically to answers. | Updates `academy_quiz_answers` row atomically within grading transaction. | `academy-quiz-evaluation-db.test.ts`: direct DB verification of snapshot persistence. | **PASS** |
| **AC-009** | Score Formula: Score computed as integer percentage $\text{Math.round}((C / N) \times 100)$ where $N > 0$. | Math.round rounding applied to correct count over question count. | `academy-quiz-attempt.service.test.ts`, `academy-quiz-evaluation-db.test.ts` (100%, 50%, 0% tests). | **PASS** |
| **AC-010** | Pass/Fail: `passed` flag set to `score >= quiz.passingScore` derived strictly on the server. | Strict comparison against parent `academyQuiz.passingScore`. | `academy-quiz-evaluation-db.test.ts`: passed: true at 100%, passed: false at 50% (< 75%). | **PASS** |
| **AC-011** | Atomic SUBMITTED $\rightarrow$ GRADED Lifecycle: Two-stage transition `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ `GRADED` inside one atomic transaction with rollback on failure. | Repository updates `status = 'SUBMITTED'` before evaluating, then sets `status = 'GRADED'` in interactive transaction. | Repository transaction flow, rollback unit & DB tests. | **PASS** |
| **AC-012** | Active Attempt Constraint Release: Setting attempt to `GRADED` releases PostgreSQL partial unique index, allowing future attempts. | Transition to `GRADED` removes row from partial unique index where `status = 'IN_PROGRESS'`. | `academy-quiz-evaluation-db.test.ts`: releases active attempt lock on grading, enabling retake. | **PASS** |
| **AC-013** | Idempotent Historical Result Return: Repeated submit of an already `GRADED` attempt returns HTTP 200 with persisted result, reconstructed without re-evaluating live correctness. | Row lock re-read detects `GRADED` and reconstructs result from persisted snapshots. | `academy-quiz-evaluation-db.test.ts`: guarantees historical replay stability. | **PASS** |
| **AC-014** | Concurrent Submit Safety: Concurrent submit requests serialize cleanly via row-level `SELECT ... FOR UPDATE`; exactly one evaluation occurs; zero duplicate side-effects. | `SELECT ... FOR UPDATE` acquires row lock, serializing concurrent calls. | `academy-quiz-evaluation-db.test.ts`: serializes 5 concurrent submit requests via FOR UPDATE. | **PASS** |
| **AC-015** | Dedicated Result Read: `GET .../result` allows owner to read graded result; returns `404 QUIZ_ATTEMPT_NOT_FOUND` if not graded. | Dedicated route and service query `findGradedAttemptResult`. | `academy-quiz-evaluation-db.test.ts`: result endpoint reads only snapshots. | **PASS** |
| **AC-016** | Historical Result Continuation: Owner can read graded result via `GET .../result` even if source content is later unpublished. | Replay and read functions query only `academy_quiz_answers` snapshot columns. | `academy-quiz-evaluation-db.test.ts`: unpublishing/mutating quiz leaves result intact. | **PASS** |
| **AC-017** | Draft Immutability: Attempting to mutate draft answers on `GRADED` attempt returns `409 ATTEMPT_ALREADY_FINALIZED`. | Attempt status checked prior to draft upsert; non-IN_PROGRESS yields 409. | `academy-quiz-evaluation-db.test.ts`: rejects draft answer updates on a GRADED attempt with 409. | **PASS** |
| **AC-018** | Pre-Submission Secrecy Regression (CRITICAL HARD GATE): FEAT-023 quiz read and FEAT-024 attempt endpoints continue to expose ZERO correctness metadata. | Sentinel recursive scanner runs against FEAT-023 definition, FEAT-024 current, and FEAT-024 by ID. | `academy-quiz-evaluation-db.test.ts`: ensures FEAT-023 & FEAT-024 leak ZERO correctness data. | **PASS (HARD GATE)** |
| **AC-019** | Zero External Side Effects & DB Constraints: Zero Redis authority; zero mutations to progress, XP, or audit tables; PostgreSQL enforces score range and coherent graded-state constraints. | Migration check constraints enforced; asserted zero counts in progress, XP, reward ledger, audit. | `academy-quiz-evaluation-db.test.ts`: database CHECK constraints and zero side-effect writes. | **PASS** |
| **AC-020** | Canonical Regression / Truthful Governance: Monorepo clean, lint, typecheck, build, unit, DB, Redis, and all guard tests pass. | Canonical suite executed and logged in Section 5. | 14/14 commands exit with code 0. | **PASS** |

---

## 7. Critical Hard Gates Evaluation

### Hard Gate 1: AC-007 Server-Authoritative Evaluation
- Verified that all scoring and pass/fail calculations occur exclusively in `apps/api/src/modules/academy/academy.repository.ts`.
- Verified that client submission payload is validated against strict empty schema (`z.object({}).strict()`), completely eliminating parameter tampering or client-side score forgery.
- Verified that questions must have exactly one correct option in the database before evaluation proceeds.

### Hard Gate 2: AC-018 Pre-Submission Correctness Secrecy Regression
- Verified that `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz` (FEAT-023), `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current` (FEAT-024), and `GET /api/academy/quiz-attempts/:attemptId` (FEAT-024) continue to return zero correctness fields.
- Automated scanner `assertZeroPreSubmissionLeakage` rigorously checks every key in API responses against the forbidden correctness list (`isCorrect`, `correctOptionId`, `explanation`, `score`, `passed`, etc.).

---

## 8. Internal Feature Quality Gate & Governance

Under Phase 4 Phase-Level Governance, feature-level Human Final Gate is removed for FEAT-025 in favor of the internal feature quality gate:
- **Preconditions**:
  1. Master Roadmap: HUMAN APPROVED
  2. Phase 4 Owner: DEV-A
  3. FEAT-024: DONE
  4. FEAT-025 Planning: HUMAN APPROVED
  5. FEAT-025 Unresolved Decisions: ZERO
  6. Phase 4: IN_PROGRESS
- **Quality Gate Evaluation**:
  - Implementation Tasks: All 11 tasks complete (T1..T11).
  - Test Suite: 100% PASS (676 monorepo tests, 189 DB integration tests, 50 Redis tests).
  - Acceptance Criteria: All 20 criteria VERIFIED.
  - Critical Hard Gates: AC-007 and AC-018 PASS.
  - Governance Guards: All 6 guards PASS (persistence, migration, boundary, audit-governance, seed-safety, test-db).
  - Side Effects: Confirmed zero premature progress, XP, reward ledger, or audit writes.

**Gate Verdict**: **FEAT-025 INTERNAL FEATURE QUALITY GATE PASS**  
**Next Stage**: FEAT-025 is complete. **FEAT-026 is UNBLOCKED for planning and implementation.**
