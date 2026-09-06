# Tasks: FEAT-024 Quiz Attempt Lifecycle

**Feature ID**: FEAT-024  
**Feature Name**: Quiz Attempt Lifecycle  
**Phase**: Phase 4 — Academy  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## 1. Task Breakdown & Dependency Ordering

```
┌────────────────────────────────────────────────────────┐
│ T1: Schema Inspection & Migration Preparation          │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ T2: VERIFY Human Decisions Lock                        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ T3: Shared DTOs & Strict Validation Schemas            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ T4: Minimal Active-Attempt Constraint Migration        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ T5: Repository Layer (StartAttemptResult & Recovery)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ T6: Domain Service & Status-Aware Continuation Policy  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ T7: API Controller & Status Code Mapping (201 vs 200)  │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
┌─────────────▼─────────────┐ ┌───────────▼─────────────┐
│ T8: Frontend API & Hooks  │ │ T10: Backend Unit & DB  │
│ (Server Authority Policy) │ │      Integration Tests  │
└─────────────┬─────────────┘ │ (P2002 & DB Bypass)     │
              │               └───────────┬─────────────┘
┌─────────────▼─────────────┐             │
│ T9: Frontend Attempt Shell│             │
│     & Component Tests     │             │
└─────────────┬─────────────┘             │
              │                           │
              └─────────────┬─────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│ T11: Full Canonical Gate & Implementation Report Sync  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Task Definitions

### [T1] Schema Inspection & Migration Preparation
- Inspect `apps/api/prisma/schema.prisma` and FEAT-019 migration `20260903000000_feat019_academy_foundation`.
- Verify physical table `academy_quiz_attempts` and columns `quiz_id`, `user_id`, `status`.
- Confirm `QUIZ_ATTEMPT_STATUS` in `apps/api/src/modules/academy/academy.constants.ts` (`CREATED`, `IN_PROGRESS`, `SUBMITTED`, `GRADED`).
- Design the minimal constraint migration adding the partial unique index.

### [T2] VERIFY Human Decisions Lock
- Verify and record the locked Human Planning Authority decisions:
  1. Active Attempt Policy: One active `IN_PROGRESS` attempt per `(user, quiz)` tuple.
  2. Database Enforcement: PostgreSQL partial unique index `UNIQUE (quiz_id, user_id) WHERE status = 'IN_PROGRESS'`.
  3. `CREATED` State Runtime Policy: Start attempt creates `IN_PROGRESS` directly; `CREATED` is schema-reserved and not treated as active.
  4. Repeated Start Behavior: Idempotent return-existing active attempt; explicit service contract `StartAttemptResult { attempt, created }` driving HTTP `200 OK` (existing) vs `201 Created` (new).
  5. Concurrency Strategy: Layered defense (DB partial unique index + transaction advisory lock + targeted P2002 race recovery).
  6. Draft Answer Persistence: Included in FEAT-024 with zero evaluation/scoring.
  7. Content Continuation & Historical Read: `IN_PROGRESS` requires active publication (`404 NOT_FOUND` if unpublished); `SUBMITTED`/`GRADED` permits owner historical read without requiring publication.
  8. Strict Start Body: Body must be `{}`; client-supplied authoritative fields rejected with `400 VALIDATION_ERROR`.
  9. Schema Migration Strategy: Minimal constraint-only migration.
- *Note*: T2 verifies these decisions; the Implementation Agent must NOT self-approve decisions.

### [T3] Shared DTOs & Validation Schemas (`packages/shared`)
- Define `QuizAttemptDto` and `QuizDraftAnswerDto` interfaces in `packages/shared/src/types/index.ts`.
- Define `StartAttemptResult` interface in shared contracts.
- Define Zod schemas `startQuizAttemptBodySchema` (`z.object({}).strict()`), `saveDraftAnswerSchema`, `quizAttemptParamSchema`, and `quizQuestionParamSchema` in `packages/shared/src/schemas/index.ts`.
- Add unit tests verifying schema validation and strict body rejection in `packages/shared/src/index.test.ts`.

### [T4] Minimal Active-Attempt Constraint Migration (`apps/api`)
- Create forward-only migration: `apps/api/prisma/migrations/<timestamp>_feat024_active_attempt_constraint/migration.sql`.
- Add preflight duplicate check to prevent corrupt migration application.
- Create partial unique index: `CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_active_key" ON "academy_quiz_attempts"("quiz_id", "user_id") WHERE "status" = 'IN_PROGRESS';`.
- Verify `npx prisma validate --schema=apps/api/prisma/schema.prisma` and `npm run guard:migration`.

### [T5] Repository Layer Implementation (`apps/api`)
- Implement `findActiveAttempt(userId, quizId)` filtering strictly on `status = 'IN_PROGRESS'`.
- Implement `startAttemptWithLock(userId, quizId, quizTitle): Promise<StartAttemptResult>`:
  - Acquire transaction advisory lock: `SELECT pg_advisory_xact_lock(hashtext('quiz_attempt:' || $1 || ':' || $2))`.
  - Check for existing active attempt; return `{ attempt: existing, created: false }` if present.
  - Calculate `nextAttemptNumber = (maxAttemptNumber ?? 0) + 1` inside advisory lock.
  - Create attempt with `status = 'IN_PROGRESS'`.
  - Targeted P2002 recovery: on unique violation, re-query `findActiveAttempt`. If found, return `{ attempt: existing, created: false }`. If no active attempt exists, rethrow error.
  - On successful insert, return `{ attempt: newAttempt, created: true }`.
- Implement `findAttemptById(id, userId)` with ownership scoping.
- Implement `upsertDraftAnswer(input)` on `@@unique([attemptId, questionId])` with `isCorrect = null`.

### [T6] Domain Service Layer & Status-Aware Policy (`apps/api`)
- Implement `AcademyQuizAttemptService` in `apps/api/src/modules/academy/academy-quiz-attempt.service.ts`:
  - `startAttempt`: validates strict body `{}`; resolves published hierarchy; calls repository `startAttemptWithLock`; maps safe DTO and propagates `created` flag.
  - `getCurrentAttempt`: checks published hierarchy; returns active attempt or throws `404 QUIZ_ATTEMPT_NOT_FOUND`.
  - `getAttemptById`: scopes ownership; inspects status:
    - If `IN_PROGRESS`: enforces current published continuation check; throws `404 NOT_FOUND` if unpublished.
    - If `SUBMITTED` or `GRADED`: permits safe historical read without publication check.
    - If `CREATED`: throws `404 QUIZ_ATTEMPT_NOT_FOUND`.
  - `recordDraftAnswer`: scopes ownership; guards finalized attempt (`SUBMITTED`/`GRADED` -> `409 ATTEMPT_ALREADY_FINALIZED`); checks published continuation for `IN_PROGRESS` attempts (`404 NOT_FOUND`); validates relational tree (`400 INVALID_OPTION_FOR_QUESTION`); upserts draft answer.
- Enforce strict whitelist DTO serialization with zero correctness or score leakage (AC-011).

### [T7] API Controller & Route Registration (`apps/api`)
- Create `AcademyQuizAttemptController`:
  - `startAttempt`: returns HTTP `201 Created` if `result.created === true`, else HTTP `200 OK`.
  - `getCurrentAttempt`: returns `200 OK`.
  - `getAttemptById`: returns `200 OK`.
  - `recordDraftAnswer`: returns `200 OK`.
- Register endpoints in `apps/api/src/modules/academy/academy.routes.ts` behind `authenticate` middleware.
- Connect DI container in `apps/api/src/infrastructure/server/app.ts`.

### [T8] Frontend API Client & Server-Authoritative Hooks (`apps/web`)
- Add `startQuizAttempt`, `getCurrentQuizAttempt`, and `saveDraftQuizAnswer` to `apps/web/src/api/academy.api.ts`.
- Add hooks to `apps/web/src/features/academy/hooks/use-academy.ts`:
  - `useCurrentQuizAttemptQuery`
  - `useStartQuizAttemptMutation`
  - `useSaveDraftQuizAnswerMutation`
- Enforce server authority: DO NOT optimistically write answer state before server response; update query cache on server success.

### [T9] Frontend Attempt Shell & Component Tests (`apps/web`)
- Update `LessonDetailPage.tsx` with minimal attempt shell:
  - "Start Quiz" button when no active attempt.
  - Single-choice option selectors when attempt is active.
  - Display server-confirmed draft selection state.
  - Suppress submit button, evaluation feedback, and score indicators.
- Update `LessonDetailPage.test.tsx` to verify learner attempt interaction.

### [T10] Comprehensive Backend Unit & DB Integration Tests
- Unit tests (`academy-quiz-attempt.service.test.ts`):
  - Start attempt: returns 201 when `created: true`, 200 when `created: false`.
  - Strict body validation: rejects unexpected/authoritative fields with `400 VALIDATION_ERROR`.
  - Targeted P2002 race recovery: returns existing attempt on race; rethrows on unrelated uniqueness violation.
  - Historical read policy: `IN_PROGRESS` unpublished returns `404 NOT_FOUND`; `GRADED`/`SUBMITTED` unpublished permits safe read.
  - Finalized mutation guard: `SUBMITTED`/`GRADED` draft answer returns `409 ATTEMPT_ALREADY_FINALIZED` regardless of content publication status.
  - Cross-user isolation: User B querying User A's attempt always receives `404 QUIZ_ATTEMPT_NOT_FOUND`.
  - Safe DTO projection and AC-011 negative leakage tests.
- DB Integration tests (`academy-quiz-attempt-db.test.ts`):
  - Concurrency race: 5 simultaneous starts resolve to exactly 1 row and identical attempt ID.
  - **Direct DB Bypass Test**: Attempting direct raw/Prisma insert of a second `IN_PROGRESS` attempt for the same user+quiz is rejected by PostgreSQL partial unique index.
  - Answer upsert replacement verification.
  - Foreign key constraint violations.
  - Read-only boundary verification (zero writes to progress, XP, rewards).
  - Redis authority verification (zero attempt keys created).

### [T11] Full Canonical Gate & Implementation Report Sync
- Execute canonical 14 validation commands.
- Generate `reports/implementation/phase-4/FEAT-024.md`.
- Update `docs/progress-tracker.md` and `docs/phase-4-feature-decomposition.md`.
- *Note*: Implementation Agent must NOT generate QA report (QA is independent).
