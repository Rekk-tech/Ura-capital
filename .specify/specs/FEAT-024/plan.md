# Implementation Plan: FEAT-024 Quiz Attempt Lifecycle

**Feature ID**: FEAT-024  
**Feature Name**: Quiz Attempt Lifecycle  
**Phase**: Phase 4 — Academy  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## 1. Overview & Architecture

FEAT-024 introduces the server-owned quiz attempt lifecycle. It introduces a **minimal constraint-only PostgreSQL migration** to enforce the active attempt invariant directly at the database engine level, layered with application transaction advisory locking for idempotent, race-free start semantics and targeted P2002 race recovery.

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (apps/web)                  │
│  - LessonDetailPage (Quiz Attempt Shell)               │
│  - Server-authoritative query cache (No optimistic)    │
│  - useCurrentQuizAttemptQuery / useStartQuizAttempt     │
│  - useSaveDraftQuizAnswerMutation                      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (JWT Bearer)
┌───────────────────────────▼────────────────────────────┐
│                    API Layer (apps/api)                │
│  - POST .../lessons/:lessonSlug/quiz/attempts (Strict) │
│  - GET  .../lessons/:lessonSlug/quiz/attempts/current  │
│  - GET  /api/academy/quiz-attempts/:attemptId          │
│  - PUT  /api/academy/quiz-attempts/:id/answers/:qId    │
└───────────────────────────┬────────────────────────────┘
                            │ Service Layer
┌───────────────────────────▼────────────────────────────┐
│              AcademyQuizAttemptService                 │
│  - StartAttemptResult { attempt, created } contract    │
│  - Status-aware content continuation (IN_PROGRESS vs   │
│    SUBMITTED/GRADED historical read)                   │
│  - Finalized mutation 409 guard                        │
│  - Safe DTO whitelist serialization (AC-011 Secrecy)   │
└───────────────────────────┬────────────────────────────┘
                            │ Repository Layer
┌───────────────────────────▼────────────────────────────┐
│                AcademyRepository                       │
│  - findActiveAttemptByUserAndQuiz (status=IN_PROGRESS) │
│  - startAttemptWithLock (Advisory lock + targeted      │
│    P2002 race recovery; StartAttemptResult contract)   │
│  - findAttemptByIdWithOwnership                        │
│  - upsertDraftAnswer                                   │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma Client / PostgreSQL
┌───────────────────────────▼────────────────────────────┐
│                  PostgreSQL Database                   │
│  - academy_quiz_attempts                               │
│  - Partial unique index: (quiz_id, user_id) WHERE      │
│    status = 'IN_PROGRESS'                              │
│  - Composite FK constraints (Attempt->Quiz->Q->Opt)    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Implementation Stages

### Stage 1: Minimal Constraint Migration (`apps/api/prisma`)
1. Create a forward-only migration: `apps/api/prisma/migrations/<timestamp>_feat024_active_attempt_constraint/migration.sql`.
2. Include preflight duplicate check:
   ```sql
   DO $$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM "academy_quiz_attempts"
       WHERE "status" = 'IN_PROGRESS'
       GROUP BY "quiz_id", "user_id"
       HAVING COUNT(*) > 1
     ) THEN
       RAISE EXCEPTION 'Preflight check failed: duplicate IN_PROGRESS attempts found for same quiz_id and user_id';
     END IF;
   END $$;
   ```
3. Add partial unique index:
   ```sql
   CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_active_key"
   ON "academy_quiz_attempts"("quiz_id", "user_id")
   WHERE "status" = 'IN_PROGRESS';
   ```
4. Verify schema validity with `npx prisma validate --schema=apps/api/prisma/schema.prisma` and ensure `npm run guard:migration` passes.

### Stage 2: Shared Contracts & Schemas (`packages/shared`)
1. Define shared TypeScript interfaces in `packages/shared/src/types/index.ts`:
   - `QuizAttemptDto`
   - `QuizDraftAnswerDto`
   - `StartAttemptResult` (`{ attempt: QuizAttemptDto; created: boolean }`)
   - `SaveDraftAnswerRequest` (`{ optionId: string }`)
   - `SaveDraftAnswerResponse`
2. Define Zod validation schemas in `packages/shared/src/schemas/index.ts`:
   - `startQuizAttemptBodySchema` (`z.object({}).strict()` — strictly rejects unknown/authoritative client fields with `VALIDATION_ERROR`)
   - `saveDraftAnswerSchema` (`z.object({ optionId: z.string().uuid() }).strict()`)
   - `quizAttemptParamSchema` (`z.object({ attemptId: z.string().uuid() })`)
   - `quizQuestionParamSchema` (`z.object({ questionId: z.string().uuid() })`)
3. Add unit tests for schema validation in `packages/shared/src/index.test.ts`.

### Stage 3: Repository Layer Enhancements (`apps/api`)
1. Implement `findActiveAttempt(userId: string, quizId: string)` in `AcademyRepository`:
   - Filters on `userId`, `quizId`, and `status = 'IN_PROGRESS'` strictly (`CREATED` is ignored).
   - Includes draft answers.
2. Implement `startAttemptWithLock(userId: string, quizId: string, quizTitle: string): Promise<StartAttemptResult>`:
   - Acquires PostgreSQL transaction advisory lock: `SELECT pg_advisory_xact_lock(hashtext('quiz_attempt:' || $1 || ':' || $2))`.
   - Checks if active attempt exists. If found, returns `{ attempt: existing, created: false }`.
   - Calculates `nextAttemptNumber = (maxAttemptNumber ?? 0) + 1` within the advisory lock.
   - Attempts to insert `AcademyQuizAttempt` with `status: 'IN_PROGRESS'`.
   - **Targeted P2002 Race Recovery**:
     - If a Prisma `P2002` error occurs, re-queries `findActiveAttempt(userId, quizId)`.
     - If active attempt exists, returns `{ attempt: existing, created: false }`.
     - If no active attempt exists, rethrows the error through the database error mapper.
   - If insert succeeds, returns `{ attempt: newAttempt, created: true }`.
3. Implement `findAttemptById(id: string, userId: string)`:
   - Scopes lookup: `id === id AND userId === userId`.
4. Implement `upsertDraftAnswer(input)`:
   - Upserts into `AcademyQuizAnswer` targeting `@@unique([attemptId, questionId])`.
   - Sets `isCorrect = null`, `correctOptionIdSnapshot = null`, `correctOptionTextSnapshot = null`.

### Stage 4: Domain Service Layer (`apps/api/src/modules/academy/academy-quiz-attempt.service.ts`)
1. Implement `startAttempt(userId, courseSlug, lessonSlug): Promise<StartAttemptResult>`:
   - Validates request body strictly; rejects unexpected fields with `400 VALIDATION_ERROR`.
   - Resolves published hierarchy (`course.status = PUBLISHED`, `lesson.status = PUBLISHED`, `quiz.status = PUBLISHED`).
   - If hierarchy missing or not published: throws sanitized `404 NOT_FOUND` ("Resource not found").
   - Calls repository `startAttemptWithLock` and maps attempt to safe `QuizAttemptDto`.
2. Implement `getCurrentAttempt(userId, courseSlug, lessonSlug)`:
   - Enforces published hierarchy check.
   - Queries active attempt; if none exists, throws `404 QUIZ_ATTEMPT_NOT_FOUND` ("Quiz attempt not found").
   - Maps to safe `QuizAttemptDto`.
3. Implement `getAttemptById(userId, attemptId)`:
   - Scopes ownership check: `attempt.userId === userId`. If mismatch/missing, throws `404 QUIZ_ATTEMPT_NOT_FOUND`.
   - **Status-Aware Publication Policy**:
     - If `attempt.status === 'IN_PROGRESS'`: verifies attempt's quiz, lesson, and course are currently `PUBLISHED`. If unpublished, throws generic `404 NOT_FOUND`.
     - If `attempt.status === 'SUBMITTED'` or `attempt.status === 'GRADED'`: permits owner-safe historical read without requiring current publication.
     - If `attempt.status === 'CREATED'`: throws `404 QUIZ_ATTEMPT_NOT_FOUND`.
   - Maps to safe `QuizAttemptDto`.
4. Implement `recordDraftAnswer(userId, attemptId, questionId, optionId)`:
   - Scopes ownership check (`attempt.userId === userId`). If mismatch/missing, throws `404 QUIZ_ATTEMPT_NOT_FOUND`.
   - **Finalized Mutation Guard (Evaluated before content continuation)**:
     - If `attempt.status === 'SUBMITTED'` or `attempt.status === 'GRADED'`, throws `409 ATTEMPT_ALREADY_FINALIZED` immediately.
   - **Content Continuation Guard**:
     - For `IN_PROGRESS` attempt, verifies parent quiz, lesson, and course remain `PUBLISHED`. If not, throws `404 NOT_FOUND`.
   - Validates question and option relational tree (`question.quizId === attempt.quizId`, `option.questionId === question.id`). If mismatch, throws `400 INVALID_OPTION_FOR_QUESTION`.
   - Upserts draft answer and returns safe `QuizDraftAnswerDto`.

### Stage 5: Controller & Routes (`apps/api`)
1. Create `AcademyQuizAttemptController` handling the 4 endpoints:
   - `startAttempt`: calls service `startAttempt`; returns HTTP `201 Created` if `result.created === true`, else HTTP `200 OK`.
   - `getCurrentAttempt`: calls service `getCurrentAttempt`; returns `200 OK`.
   - `getAttemptById`: calls service `getAttemptById`; returns `200 OK`.
   - `recordDraftAnswer`: calls service `recordDraftAnswer`; returns `200 OK`.
2. Register endpoints in `apps/api/src/modules/academy/academy.routes.ts` behind `authenticate` middleware.
3. Register service in container.

### Stage 6: Frontend API Client & Query Hooks (`apps/web`)
1. Add API client functions to `apps/web/src/api/academy.api.ts`:
   - `startQuizAttempt(courseSlug, lessonSlug)`
   - `getCurrentQuizAttempt(courseSlug, lessonSlug)`
   - `saveDraftQuizAnswer(attemptId, questionId, optionId)`
2. Add hooks to `apps/web/src/features/academy/hooks/use-academy.ts`:
   - `useCurrentQuizAttemptQuery(courseSlug, lessonSlug)`
   - `useStartQuizAttemptMutation(courseSlug, lessonSlug)`
   - `useSaveDraftQuizAnswerMutation()`
   - **Enforce server authority**: Do NOT optimistically overwrite attempt answer cache before server response. Invalidate/update cache on mutation success.
3. Add attempt runner shell to `LessonDetailPage.tsx`:
   - Render "Start Quiz" button when no active attempt.
   - Render questions and single-choice option selectors when attempt is active.
   - Display draft selection state based on server-confirmed answers.
   - Suppress submit button, grading feedback, and score indicators.

### Stage 7: Test Suite & Concurrency Validation
1. Unit tests (`academy-quiz-attempt.service.test.ts`):
   - Start attempt: returns 201 when `created: true`, 200 when `created: false`.
   - Strict body validation: rejects unexpected/authoritative fields with `400 VALIDATION_ERROR`.
   - Targeted P2002 race recovery: returns existing attempt on race; rethrows on unrelated uniqueness violation.
   - Historical read policy: `IN_PROGRESS` unpublished returns `404 NOT_FOUND`; `GRADED`/`SUBMITTED` unpublished permits safe read.
   - Finalized mutation guard: `SUBMITTED`/`GRADED` draft answer returns `409 ATTEMPT_ALREADY_FINALIZED` regardless of content publication status.
   - Cross-user isolation: User B querying User A's attempt always receives `404 QUIZ_ATTEMPT_NOT_FOUND`.
   - Safe DTO whitelist projection and AC-011 negative leakage tests.
2. DB Integration tests (`academy-quiz-attempt-db.test.ts`):
   - Concurrency race test: 5 simultaneous `POST` starts resolve to exactly 1 database row and identical attempt ID.
   - **Database constraint bypass test**: Attempting direct Prisma/raw SQL insert of a second `IN_PROGRESS` attempt for the same user+quiz is rejected by PostgreSQL.
   - Answer replacement uniqueness test.
   - Relational foreign key constraint tests.
   - Read-only boundary test (zero writes to progress, XP, rewards).
   - Redis authority test (zero attempt keys created in Redis).
3. Component tests (`LessonDetailPage.test.tsx`):
   - Start quiz flow and draft selection interaction.

---

## 3. Canonical Verification Gate

The canonical verification gate commands must all pass with exit code 0:
```bash
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```
