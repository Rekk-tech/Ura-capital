# Implementation Report: FEAT-024 Quiz Attempt Lifecycle

**Feature ID**: FEAT-024  
**Feature Name**: Quiz Attempt Lifecycle  
**Phase**: Phase 4 — Product Foundation & Academy MVP  
**Implementation Status**: `REWORK COMPLETE / READY FOR QA`  
**QA Status**: `NOT STARTED`  
**Human Final Gate**: `NOT APPROVED`  
**Date**: 2026-09-06  
**Iteration**: Rework Iteration 1  

---

## 1. Rework Iteration 1 Summary & Defect Remediation

This iteration addresses all findings identified during the implementation review against canonical specification documents ([`acceptance.md`](file:///d:/project/ura-capital/.specify/specs/FEAT-024/acceptance.md) and [`spec.md`](file:///d:/project/ura-capital/.specify/specs/FEAT-024/spec.md)):

| Defect / Item ID | Category | Description | Status |
| :--- | :--- | :--- | :--- |
| **DEF-024-01** | Security / Projection | Unsafe learner Attempt DTO: Removed `userId`, `score`, and `completedAt` completely from `QuizAttemptDto`. Verified zero placeholder `score: null` or `score: 0`. | **FIXED / awaiting QA** |
| **DEF-024-02** | Security / IDOR | IDOR response normalization: Removed any 403 response for foreign attempts. Both non-existent and foreign attempts return identical `404 QUIZ_ATTEMPT_NOT_FOUND` ("Quiz attempt not found") with identical shape, eliminating ownership oracle. | **FIXED / awaiting QA** |
| **GOV-024-01** | Governance / Spec | Acceptance Criteria traceability matrix rebuilt strictly against canonical [`acceptance.md`](file:///d:/project/ura-capital/.specify/specs/FEAT-024/acceptance.md) (AC-001..AC-020). Zero invented or reordered AC IDs. | **FIXED / awaiting QA** |
| **CONTRACT-024-01** | API Contract | `StartAttemptResult` contract restored to canonical `{ attempt: QuizAttemptDto; created: boolean }` with `created = true` (201) and `created = false` (200 / P2002 recovery). Removed `isExisting`. | **FIXED** |
| **CONTRACT-024-02** | API Contract | Current attempt error semantics verified: `404 QUIZ_ATTEMPT_NOT_FOUND` when no `IN_PROGRESS` attempt exists vs generic `404 NOT_FOUND` when hierarchy is unavailable. | **FIXED** |
| **DOC-024-01** | Documentation | Advisory lock documentation corrected: Documented `hashtext()` as a 32-bit integer with collision safety rationale (extra serialization only, DB partial index remains final authority). | **FIXED** |
| **EVIDENCE-024-01** | Verification Evidence | Full migration integrity evidence recorded (fresh migration, existing upgrade, duplicate-preflight fail-safe, direct DB bypass, 5 concurrent starts). | **CLOSED** |

---

## 2. Endpoint Contract & Authorization Boundary

| Method | Canonical Route | Alias Route | Access Control | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts` | `/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts` | **AUTHENTICATED** (Learner) | `201 Created` / `200 OK` / `400` / `401` / `404` | Starts attempt directly in `IN_PROGRESS` (201 Created, `created: true`) or idempotently returns existing active attempt (200 OK, `created: false`). |
| `GET` | `/api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current` | `/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current` | **AUTHENTICATED** (Learner) | `200 OK` / `400` / `401` / `404` | Returns active `IN_PROGRESS` attempt (200 OK) or `404 QUIZ_ATTEMPT_NOT_FOUND`. Hierarchy unavailable returns `404 NOT_FOUND`. |
| `GET` | `/api/academy/quiz-attempts/:attemptId` | `/academy/quiz-attempts/:attemptId` | **AUTHENTICATED** (Learner) | `200 OK` / `400` / `401` / `404` | Returns attempt snapshot by ID for owning user (including historical finalized). Foreign attempts return identical `404 QUIZ_ATTEMPT_NOT_FOUND` (zero 403 oracle). |
| `PUT` | `/api/academy/quiz-attempts/:attemptId/answers/:questionId` | `/academy/quiz-attempts/:attemptId/answers/:questionId` | **AUTHENTICATED** (Learner) | `200 OK` / `400` / `401` / `404` / `409` | Upserts draft single-choice answer. Foreign attempts return identical `404 QUIZ_ATTEMPT_NOT_FOUND`. Finalized attempts return `409 ATTEMPT_ALREADY_FINALIZED`. |

### Access Control & Error Normalization
- All endpoints are protected by `authenticate` middleware ([`apps/api/src/modules/auth/auth.middleware.ts`](file:///d:/project/ura-capital/apps/api/src/modules/auth/auth.middleware.ts)).
- Enforces Bearer JWT access token validation (`typ: "access"`), HMAC-SHA256 signature, claims validation, and active user status.
- **IDOR Normalization (DEF-024-02)**: Requesting an attempt belonging to another user returns identical `404 Not Found` with `code: "QUIZ_ATTEMPT_NOT_FOUND"` and `message: "Quiz attempt not found"`, perfectly indistinguishable from a non-existent UUID. There are **zero 403 Forbidden** responses exposed to learners on attempt read or answer mutation endpoints.

---

## 3. Learner-Safe Whitelist DTO Projections (DEF-024-01 & AC-010)

All responses serialize through pure mapper functions defined in [`apps/api/src/modules/academy/academy.dto.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.dto.ts):

### `QuizDraftAnswerDto`
```typescript
export interface QuizDraftAnswerDto {
  questionId: string;
  selectedOptionId: string | null;
  updatedAt: string;
}
```

### `QuizAttemptDto`
```typescript
export interface QuizAttemptDto {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: "CREATED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  startedAt: string;
  answers: QuizDraftAnswerDto[];
}
```

### `StartAttemptResult`
```typescript
export interface StartAttemptResult {
  attempt: QuizAttemptDto;
  created: boolean;
}
```

### Whitelist Exclusion Verification (AC-011 Critical Hard Gate)
The learner DTO strictly omits:
- `userId` (prevented in DTO interface, mapper, frontend types, and HTTP JSON)
- `score` / `learnerScore` (no placeholder `score: null` or `score: 0`; FEAT-025 owns evaluation scoring)
- `completedAt` / `submittedAt` / `gradedAt`
- `passed` / `passFailResult` / `gradingResult`
- `isCorrect` / `is_correct`
- `correctOptionId` / `correctOptionIdSnapshot` / `correctOptionTextSnapshot`
- `explanation` / `solution` / `answerKey`
- `questionPromptSnapshot` / `selectedOptionTextSnapshot`
- Internal Prisma relations

---

## 4. Layered Concurrency & Advisory Lock Architecture (DOC-024-01)

### Layer 1: PostgreSQL Partial Unique Index
```sql
CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_active_key"
ON "academy_quiz_attempts"("quiz_id", "user_id")
WHERE "status" = 'IN_PROGRESS';
```
- Definitive database storage authority directly inside the PostgreSQL engine.
- Physically rejects any second `IN_PROGRESS` attempt for the same `(quiz_id, user_id)` at the storage layer.

### Layer 2: Transaction-Scoped Advisory Lock
```sql
SELECT pg_advisory_xact_lock(hashtext('quiz_attempt:' || $userId || ':' || $quizId));
```
- **32-Bit Hash Characteristics**: `hashtext()` computes a 32-bit signed integer (`int4`).
- **Collision Safety Rationale**: In the statistical event of an advisory lock hash collision between unrelated `(user, quiz)` pairs, the two transactions simply serialize momentarily.
- **Zero Cross-Tenant Risk**: No cross-tenant data leak or corruption can occur because queries inside the transaction strictly filter by `userId` and `quizId`, and the partial unique index remains the final database-level authority.

### Layer 3: Targeted P2002 Race Recovery
```typescript
try {
  const createdAttempt = await this.prisma.academyQuizAttempt.create({ ... });
  return { attempt: createdAttempt, created: true };
} catch (err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const active = await this.findActiveAttempt(userId, quizId);
    if (active) {
      return { attempt: active, created: false };
    }
  }
  throw err; // Never swallow unrelated P2002 errors
}
```

---

## 5. Migration Integrity & Concurrency Verification Evidence (EVIDENCE-024-01)

| Check | Scenario | Verification Result | Evidence |
| :--- | :--- | :--- | :--- |
| **A. Fresh DB Migration** | Full migration suite applied to clean database | **PASS** | `prisma migrate deploy` succeeded cleanly on `aura_capital_test_feat019_rework2_fresh`. |
| **B. Existing-Schema Upgrade** | Applying migration `20260906000000_feat024_active_attempt_constraint` on database with existing data | **PASS** | Migration applied cleanly without table rewrites or data loss. |
| **C. Duplicate-Preflight Fail-Safe** | Applying migration against database containing duplicate `IN_PROGRESS` rows for same user+quiz | **FAIL SAFE** | Tested in `academy-quiz-attempt-db.test.ts` Section 48: Preflight block executed with 2 duplicate rows explicitly threw `Preflight check failed: duplicate IN_PROGRESS attempts found for same quiz_id and user_id`. Zero silent repair. |
| **D. Direct DB Bypass** | Direct SQL insert of second `IN_PROGRESS` row for same `(quiz_id, user_id)` | **REJECT** | Tested in `academy-quiz-attempt-db.test.ts` Section 37: Direct insert rejected by PostgreSQL partial unique index violation. |
| **E. 5 Concurrent Starts** | 5 simultaneous `POST .../quiz/attempts` requests via `Promise.all` | **PASS** | Tested in `academy-quiz-attempt-db.test.ts` Section 38: Exactly 1 row in DB, same attempt ID across responses, exactly 1x `201 Created`, 4x `200 OK`, zero `500` errors. |

---

## 6. Modified & Created Files

### Shared (`packages/shared`)
- `packages/shared/src/constants/index.ts` — Registered `QUIZ_ATTEMPT_NOT_FOUND`, `ATTEMPT_ALREADY_FINALIZED`, `INVALID_OPTION_FOR_QUESTION`.
- `packages/shared/src/types/index.ts` — Defined `QuizDraftAnswerDto`, `QuizAttemptDto` (safe whitelist), `StartAttemptResult` (`created: boolean`), `SaveDraftAnswerRequest`, `SaveDraftAnswerResponse`.
- `packages/shared/src/schemas/index.ts` — Added `StartQuizAttemptBodySchema`, `SaveDraftAnswerBodySchema`, `QuizAttemptParamSchema`, `QuizDraftAnswerParamSchema`.
- `packages/shared/src/index.test.ts` — Unit test suite verifying schema validation.

### Backend (`apps/api`)
- `apps/api/prisma/migrations/20260906000000_feat024_active_attempt_constraint/migration.sql` — Minimal forward-only migration adding partial unique index with preflight duplicate check.
- `apps/api/scripts/guard-migration.ts` — Updated migration risk baseline to 25.
- `apps/api/src/infrastructure/database/prisma.ts` — Dynamic test database resolution for Vitest.
- `apps/api/src/infrastructure/database/repository-factory.ts` — Added `sessionRepo` alias.
- `apps/api/src/infrastructure/database/transaction-runner.ts` — Dynamic client getter.
- `apps/api/src/modules/academy/academy.dto.ts` — Pure mapper functions `toQuizAttemptDto` and `toQuizDraftAnswerDto` enforcing whitelist projection.
- `apps/api/src/modules/academy/academy.repository.ts` — Repository methods: `findActiveAttempt`, `startAttemptWithLock`, `findAttemptWithAnswersById`, `upsertDraftAnswer`, `findQuestionWithQuiz`, `findOptionWithQuestion`, `verifyPublishedHierarchyByQuizId`.
- `apps/api/src/modules/academy/academy-quiz-attempt.service.ts` — Domain service orchestrating attempt lifecycle, IDOR normalization, and draft persistence.
- `apps/api/src/modules/academy/academy-quiz-attempt.controller.ts` — Express controller with status mapping (`201` for `created: true`, `200` for `created: false`).
- `apps/api/src/modules/academy/academy.routes.ts` — Registered routes under `authenticate` middleware.
- `apps/api/src/modules/users/user.repository.ts` — Dynamic client getter.
- `apps/api/package.json` — Registered `academy-quiz-attempt-db.test.ts` in `npm run test:db`.

### Backend Tests
- `apps/api/tests/unit/academy-quiz-attempt.service.test.ts` — 20 unit tests with comprehensive whitelist assertions.
- `apps/api/tests/integration/academy-quiz-attempt-db.test.ts` — 19 live PostgreSQL tests verifying start, concurrency, bypass, duplicate preflight, IDOR equality, draft answer persistence, and secrecy sentinels.
- `apps/api/tests/unit/migration-guard.test.ts` — Updated migration count to 5.

### Frontend (`apps/web`)
- `apps/web/src/features/academy/types/academy-ui.types.ts` — Added UI types for `QuizDraftAnswerDto` and `QuizAttemptDto`.
- `apps/web/src/api/academy.api.ts` — Added API client methods: `startQuizAttempt`, `getCurrentQuizAttempt`, `getQuizAttemptById`, `saveDraftAnswer`.
- `apps/web/src/features/academy/hooks/use-academy.ts` — Added React Query hooks: `useCurrentQuizAttemptQuery`, `useStartQuizAttemptMutation`, `useSaveDraftAnswerMutation`.
- `apps/web/src/features/academy/pages/LessonDetailPage.tsx` — Built attempt runner shell with question navigation, draft option persistence, pending save indicators, and zero evaluation leakage.

### Frontend Tests
- `apps/web/src/api/academy.api.test.ts` — Client method unit tests.
- `apps/web/src/features/academy/pages/LessonDetailPage.test.tsx` — UI component tests with React Query cache leakage sentinel.

---

## 7. Canonical 14 Validation Commands Evidence

| # | Validation Command | Result | Tests / Pass Count | Evidence Details |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `npm run clean` | **PASS** | N/A | Workspaces build artifacts cleaned cleanly |
| 2 | `npm run lint` | **PASS** | 0 errors, 0 warnings | ESLint passed across all workspaces |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Valid | Prisma schema validated clean |
| 4 | `npm run typecheck` | **PASS** | 0 type errors | `tsc --noEmit` passed across `@aura/shared`, `@aura/api`, `@aura/web` |
| 5 | `npm run build` | **PASS** | 3 workspaces built | Bundles built for `@aura/shared`, `@aura/api`, and `@aura/web` |
| 6 | `npm run test` | **PASS** | **66 files passed (666 passed)** | API: 56 files (528 tests), Web: 9 files (108 tests), Shared: 1 file (30 tests) |
| 7 | `npm run test:unit` | **PASS** | **45 files passed (515 passed)** | API: 36 files (378 tests), Web: 8 files (107 tests), Shared: 1 file (30 tests) |
| 8 | `npm run test:db` | **PASS** | **16 files passed (158 passed)** | 16 test files passed on live PostgreSQL |
| 9 | `npm run test:redis` | **PASS** | **5 files passed (50 passed)** | 5 test files passed on Redis container |
| 10 | `npm run guard:persistence` | **PASS** | **1 file passed (14 passed)** | Zero unauthorized persistence detected |
| 11 | `npm run guard:migration` | **PASS** | 5 migrations, 25 review risks | Migration integrity guard passed |
| 12 | `npm run guard:boundary` | **PASS** | 9 controllers, 13 services | Zero repository boundary violations |
| 13 | `npm run guard:audit-governance` | **PASS** | Clean | Zero premature product audit schemas/models |
| 14 | `npm run guard:seed-safety` | **PASS** | Clean | Zero unsafe seeds or default backdoors |

---

## 8. Canonical Acceptance Criteria Traceability Matrix (AC-001..AC-020)

Strictly derived from [`acceptance.md`](file:///d:/project/ura-capital/.specify/specs/FEAT-024/acceptance.md):

| AC ID | Canonical Description | Implementation Evidence | Test Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AC-001** | Authentication: Attempt start, read, and draft answer endpoints require valid JWT authentication (`401 UNAUTHENTICATED`) | `authenticate` middleware attached in `academy.routes.ts` | `academy-quiz-attempt-db.test.ts` (401 tests on all routes) | **VERIFIED** |
| **AC-002** | Server Authority: Ownership derived from `req.user.id`; client-provided authoritative fields rejected with `400 VALIDATION_ERROR` | `StartQuizAttemptBodySchema` enforces `z.object({}).strict()` | `academy-quiz-attempt-db.test.ts` Section 43 (forged fields test) | **VERIFIED** |
| **AC-003** | Publication Scoping: Starting an attempt requires Course `PUBLISHED`, Lesson `PUBLISHED`, and Quiz `PUBLISHED` (`404 NOT_FOUND`) | `findPublishedQuizByLesson` checks course, lesson, quiz `PUBLISHED` | `academy-quiz-attempt-db.test.ts` (draft/archived tests) | **VERIFIED** |
| **AC-004** | Primary Quiz Policy: Attempt is bound to the lowest-order `PUBLISHED` quiz of the lesson | `findPublishedQuizByLesson` orders by `order: "asc"` | `academy-quiz-attempt-db.test.ts` (lowest-order selection test) | **VERIFIED** |
| **AC-005** | Active Attempt Invariant: User may have at most one active `IN_PROGRESS` attempt per quiz; `CREATED` is not treated as active | `findActiveAttempt` filters strictly by `status: 'IN_PROGRESS'` | `academy-quiz-attempt-db.test.ts` Section 42 (CREATED state test) | **VERIFIED** |
| **AC-006** | Idempotent Start: Repeated start while `IN_PROGRESS` attempt exists returns existing attempt with `200 OK` (new returns `201`) | `StartAttemptResult.created` controls status code (201 vs 200) | `academy-quiz-attempt-db.test.ts` Section 36 (idempotent return) | **VERIFIED** |
| **AC-007** | Concurrency & DB Guard: Concurrent starts serialize cleanly; targeted P2002 recovery; direct DB bypass rejected by partial unique index | `pg_advisory_xact_lock`, `P2002` catch-and-recover, partial unique index | `academy-quiz-attempt-db.test.ts` Section 37 (bypass) & Section 38 (5 concurrent) | **VERIFIED** |
| **AC-008** | Attempt Numbering: Each new attempt for a (user, quiz) tuple receives an incremented `attemptNumber >= 1` | `_max.attemptNumber + 1` calculated inside advisory lock | `academy-quiz-attempt-db.test.ts` (attempt number increment test) | **VERIFIED** |
| **AC-009** | Ownership Isolation: Attempt access by another user returns generic `404 QUIZ_ATTEMPT_NOT_FOUND` (non-enumerating) | `findAttemptWithAnswersById(attemptId, userId)` returns 404; zero 403 | `academy-quiz-attempt-db.test.ts` Section 39 (IDOR full body equality) | **VERIFIED** |
| **AC-010** | Safe Attempt DTO: Attempt response contains only safe fields (`id`, `quizId`, `attemptNumber`, `status`, `startedAt`, `answers`) | Pure mapper `toQuizAttemptDto` omits `userId`, `score`, `passed`, internal snapshots | `academy-quiz-attempt.service.test.ts`, `academy-quiz-attempt-db.test.ts` | **VERIFIED** |
| **AC-011** | Correctness Secrecy: Attempt and answer responses contain ZERO correctness metadata (`isCorrect`, `explanation`, `score`, etc.) | Whitelist DTOs + recursive response scanner + React Query cache scanner | `assertZeroCorrectnessLeakage`, `LessonDetailPage.test.tsx` cache scan | **VERIFIED (HARD GATE)** |
| **AC-012** | Relational Tree Check: Draft answer option must belong to question; question must belong to attempt quiz | Validates `question.quizId === attempt.quizId` and `option.questionId === question.id` | `academy-quiz-attempt-db.test.ts` (mismatched option and question tests) | **VERIFIED** |
| **AC-013** | Answer Replacement: Repeated draft answer for same question idempotently replaces previous selected option | `upsert` on `attemptId_questionId` updates `selectedOptionId` | `academy-quiz-attempt-db.test.ts` Section 45 (replace draft selection) | **VERIFIED** |
| **AC-014** | Finalized Mutation Guard: Draft answers cannot be recorded if attempt is `SUBMITTED` or `GRADED` (`409 ATTEMPT_ALREADY_FINALIZED`) | Evaluated before content check; returns 409 | `academy-quiz-attempt-db.test.ts` Section 41 (finalized mutation test) | **VERIFIED** |
| **AC-015** | Historical Read Policy: `IN_PROGRESS` unpublished returns `404 NOT_FOUND`; `SUBMITTED`/`GRADED` permits safe owner historical read | `verifyPublishedHierarchyByQuizId` checked for `IN_PROGRESS`; bypassed for finalized | `academy-quiz-attempt-db.test.ts` Section 41 (historical read test) | **VERIFIED** |
| **AC-016** | Redis Authority: Zero durable attempt authority in Redis; PostgreSQL is sole source of truth | Attempt state handled purely in PostgreSQL | `guard:boundary`, `test:redis`, `academy-quiz-attempt-db.test.ts` | **VERIFIED** |
| **AC-017** | Minimal Constraint Migration: Forward-only migration adds partial unique index on `(quiz_id, user_id) WHERE status = 'IN_PROGRESS'` | Migration `20260906000000_feat024_active_attempt_constraint` | `academy-quiz-attempt-db.test.ts` Section 48 (duplicate preflight fail-safe) | **VERIFIED** |
| **AC-018** | Frontend Attempt Shell: Learner UI renders "Start Quiz" and single-choice draft selectors without submit or score elements | `LessonDetailPage.tsx` interactive shell | `LessonDetailPage.test.tsx` (DOM and query cache tests) | **VERIFIED** |
| **AC-019** | Error Normalization: Normalized Aura errors (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `NOT_FOUND`, `QUIZ_ATTEMPT_NOT_FOUND`, `INTERNAL_ERROR`) | Centralized error envelope with standard error codes | `academy-quiz-attempt-db.test.ts` (all error tests) | **VERIFIED** |
| **AC-020** | Canonical Gate: Monorepo clean, lint, typecheck, build, unit, DB, Redis, and all guard tests pass | All 14 commands exit code 0 | Canonical 14 validation commands recorded in Section 7 | **VERIFIED** |

---

## 9. Governance & Final State

- **FEAT-024 Lifecycle State**: `REWORK COMPLETE / READY FOR QA`
- **QA Status**: `NOT STARTED` (Strict governance: QA has not started; no QA report created)
- **Human Final Gate**: `NOT APPROVED` (Pending QA pass and Human review)
- **FEAT-025**: `BLOCKED` (Strictly not started)
- **Phase 4**: `IN_PROGRESS`
