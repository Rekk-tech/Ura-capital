# Implementation Plan: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  
**Planning Status**: COMPLETE (REWORK ITERATION 1)  
**Implementation Status**: NOT_STARTED  
**Canonical Acceptance Criteria**: AC-001 .. AC-020  

---

## 1. Architectural Approach & Layering

The implementation strictly follows the established Aura architectural layering while honoring boundary separation between FEAT-025 (Quiz Submission & Evaluation) and FEAT-026 (Progression & Completion):

```
[Web UI: LessonDetailPage / CourseDetailPage]
       │
       ▼ (GET .../progress or POST .../complete)
[Route: academy.routes.ts]
       │
       ▼
[Controller: academy-progression.controller.ts]
       │
       ▼
[Service: academy-progression.service.ts]
       │
       ▼ (PrismaTransactionRunner / SELECT ... FOR UPDATE)
[Repository: academy.repository.ts (IAcademyProgressRepository)]
       │
       ▼ (Atomic Upsert / Monotonic Status Check / PostgreSQL Constraints)
[PostgreSQL: academy_user_lesson_progress / academy_user_course_progress]
```

### Decoupled Post-Grade Orchestration Flow
```
[Client: POST .../attempts/:id/submit]
              │
              ▼
[FEAT-025: Submit Attempt & Grade] ───────► (Transaction 1: QuizAttempt committed as GRADED)
              │
              ▼ (Grading Transaction Committed)
[Orchestration Layer]
              │
              ▼
[FEAT-026: reconcileProgressFromGradedAttempt] ──► (Transaction 2: Independent Progression Tx)
              │
              ▼
[Response to Client]
```

### Key Architectural Tenets
1. **Zero Database Migrations (AC-017)**:
   - Tables `academy_user_lesson_progress` and `academy_user_course_progress` were provisioned in FEAT-019 with all required composite unique keys, foreign keys, and PostgreSQL check constraints (`status_check`, `completed_check`). Zero new migrations required.
2. **Server-Authoritative Derivation (CRITICAL HARD GATE: AC-007)**:
   - `progressPercent`, `completedLessons`, `totalLessons`, and `status` are derived strictly by the server from PostgreSQL persistence. Request bodies attempting to author progress fields are rejected with HTTP `400 VALIDATION_ERROR`.
3. **Decoupled Post-Grade Reconciliation & Recovery (AC-004, AC-005, AC-006)**:
   - FEAT-026 does NOT reopen or mutate the FEAT-025 grading transaction.
   - Grading is a durable, exactly-once outcome; progression reconciliation is retryable and convergent.
   - If progression reconciliation fails after grading commits, the request returns sanitized `500 INTERNAL_ERROR`. On submit retry, FEAT-025 returns the existing `GRADED` attempt, and progression reconciliation is re-executed (never skipped on replay).
4. **Historical Completion vs. Current Curriculum Coverage (AC-010, AC-011, AC-013)**:
   - `status = COMPLETED` and `completed = true` represent historical milestone achievement.
   - `progressPercent` represents current active curriculum coverage.
   - A course where 5 of 6 lessons are completed after curriculum expansion is validly represented as `status = 'COMPLETED', completed = true, progressPercent = 83`.
5. **Assessment Integrity Guard (AC-009)**:
   - Lessons containing a `PUBLISHED` quiz cannot be manually completed via `POST .../complete` (`400 QUIZ_COMPLETION_REQUIRED`). Completion requires achieving `passed = true` on a graded quiz attempt.
6. **Deterministic Concurrency & First-Completion Safety (AC-016)**:
   - Repository operations utilize row-level locking (`SELECT ... FOR UPDATE`) or conditional atomic updates so that 5 simultaneous requests produce exactly one progress row, preserve the earliest `completedAt`, and emit `isFirstCompletion = true` exactly once.
7. **Frozen Downstream Contract for FEAT-027 (AC-019)**:
   - Internal `AcademyCompletionFact` emits deterministic identity (`userId + resourceType + resourceId`) for downstream reward deduplication. FEAT-026 executes zero writes to `AcademyUserXp`, `AcademyRewardLedger`, or `ProductAuditRecord`. Zero Redis durable progress authority. In-process delivery only (no event bus/outbox).
8. **Pre-Submission Secrecy Regression Hard Gate (AC-018)**:
   - Progression endpoints and DTOs expose zero quiz question details, option correctness, explanations, or scores.

---

## 2. Component Design & Changes

### 2.1. Shared Package (`packages/shared`)
- **Constants** (`packages/shared/src/constants/index.ts`):
  - Add `ERROR_CODES.QUIZ_COMPLETION_REQUIRED = 'QUIZ_COMPLETION_REQUIRED'`.
  - Verify `ERROR_CODES.VALIDATION_ERROR`, `ERROR_CODES.UNAUTHENTICATED`, `ERROR_CODES.NOT_FOUND`, `ERROR_CODES.INTERNAL_ERROR`.
- **Schemas** (`packages/shared/src/schemas/index.ts`):
  - Add `CompleteLessonBodySchema = z.object({}).strict()`.
- **Types** (`packages/shared/src/types/index.ts`):
  - `AcademyProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'`.
  - `LessonProgressDto`: `{ lessonSlug: string; status: AcademyProgressStatus; completed: boolean; completedAt: string | null }`.
  - `CourseProgressDto`: `{ courseSlug: string; completedLessons: number; totalLessons: number; progressPercent: number; status: AcademyProgressStatus; completed: boolean; completedAt: string | null; lessons: LessonProgressDto[] }`.
  - `CourseProgressResponse = ApiResponse<CourseProgressDto>`.
  - `CompleteLessonResponse = ApiResponse<LessonProgressDto>`.
  - `AcademyCompletionFact`: `{ readonly userId: string; readonly resourceType: 'LESSON' | 'COURSE'; readonly resourceId: string; readonly isFirstCompletion: boolean; readonly completedAt: Date }`.
  - Additive extension to `LessonDetailDto`: `progress?: LessonProgressDto | null`.

### 2.2. Backend API (`apps/api`)
- **Repository** (`apps/api/src/modules/academy/academy.repository.ts`):
  - Implement `IAcademyProgressRepository` methods on `PrismaAcademyProgressRepository`:
    - `findCourseProgress(userId, courseId)`
    - `findLessonProgress(userId, lessonId)`
    - `findCourseProgressBySlug(userId, courseSlug)`
    - `upsertLessonProgressSafe(userId, lessonId, status, targetCompletedAt, tx)`: row locking, monotonicity check, returns `{ progress, isFirstCompletion }`.
    - `upsertCourseProgressSafe(userId, courseId, status, targetCompletedAt, tx)`: row locking, monotonicity check, returns `{ progress, isFirstCompletion }`.
    - `getPublishedLessonsForCourse(courseId, tx)`: queries active published lessons only.
- **Service** (`apps/api/src/modules/academy/academy-progression.service.ts`):
  - Implement `AcademyProgressionService`:
    - `getCourseProgress(userId, courseSlug)`: validates course is published; queries published lessons and learner progress; calculates coverage metrics and returns `CourseProgressDto`.
    - `completeInformationalLesson(userId, courseSlug, lessonSlug)`: validates published status and absence of published quiz; atomically updates lesson progress and recalculates course progress; returns `LessonProgressDto`.
    - `reconcileProgressFromGradedAttempt(userId, attemptId)`: reads attempt; if `status === 'GRADED'` and `passed === true`, executes progress transaction; preserves historical completion if attempt failed.
- **Orchestration Integration** (`apps/api/src/modules/academy/academy-quiz-attempt.service.ts` or controller):
  - After grading transaction commits, invoke `reconcileProgressFromGradedAttempt(userId, attemptId)`.
  - Replay handling: if an attempt is already `GRADED` (e.g. idempotent retry of submit), ensure `reconcileProgressFromGradedAttempt` is called before returning the result.
  - Partial failure handling: propagate error as `INTERNAL_ERROR` without altering the committed `QuizAttempt`.
- **Controller** (`apps/api/src/modules/academy/academy-progression.controller.ts`):
  - Implement `getCourseProgress`: authenticated endpoint returning `CourseProgressResponse`.
  - Implement `completeLesson`: authenticated endpoint validating strict body `{}` and returning `CompleteLessonResponse`.
- **Routes** (`apps/api/src/modules/academy/academy.routes.ts`):
  - Register `GET /api/academy/courses/:courseSlug/progress` (authenticated).
  - Register `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete` (authenticated).
- **Validation** (`apps/api/src/modules/academy/academy.validation.ts`):
  - Add `completeLessonBodySchema` binding to shared schema.
- **DTO Mappers** (`apps/api/src/modules/academy/academy.dto.ts`):
  - Add `toLessonProgressDto` and `toCourseProgressDto`.
  - Update `toLessonDetailDto` to additively project `progress` if available.

### 2.3. Frontend Client (`apps/web`)
- **Types** (`apps/web/src/features/academy/types/academy-ui.types.ts`):
  - Export UI types matching shared `CourseProgressDto` and `LessonProgressDto`.
- **API Client** (`apps/web/src/api/academy.api.ts`):
  - `getCourseProgress(courseSlug)`: calls `GET /api/academy/courses/:courseSlug/progress`.
  - `completeLesson(courseSlug, lessonSlug)`: calls `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete` with `{}`.
- **Hooks** (`apps/web/src/features/academy/hooks/use-academy.ts`):
  - `useCourseProgressQuery(courseSlug)`: React Query hook for course progress.
  - `useCompleteLessonMutation()`: mutation hook invalidating course and lesson progress caches on success.
- **UI Components**:
  - `LessonDetailPage.tsx`:
    - Informational lesson (no quiz): renders "Mark Lesson as Complete" button if not completed.
    - When completed: renders "Lesson Completed" badge with timestamp.
    - On quiz pass: auto-reflects completed state.
  - `CourseDetailPage.tsx`:
    - Displays progress bar with `progressPercent`.
    - Displays ratio (e.g., `5 of 6 lessons completed`).
    - Displays checkmarks on completed lessons in curriculum list.
    - Accurately renders historical completion even when `progressPercent < 100` without contradictory "100% complete" copy.

---

## 3. Concurrency, Atomicity & Error Handling

### 3.1. Single Progress Transaction in FEAT-026
When updating progression, one PostgreSQL transaction coordinates:
- Row locking / monotonic update of lesson progress.
- Evaluation of `isFirstCompletion` for lesson.
- Query of active published lessons for the course.
- Count of completed published lessons.
- Calculation of `progressPercent` (guarded against division by zero).
- Row locking / monotonic update of course progress.
- Evaluation of `isFirstCourseCompletion` for course.
- In-process generation of `AcademyCompletionFact`.
If any error occurs, the entire transaction rolls back.

### 3.2. Concurrency Control Under Real Load
- Naive `upsert` is avoided for first-completion detection.
- `SELECT ... FOR UPDATE` row-level locks or conditional updates with constraint conflict handling are used.
- Guarantees that concurrent requests for the same user and resource result in exactly one row, preserve the original `completedAt`, and emit `isFirstCompletion: true` exactly once.

---

## 4. Verification & Testing Strategy

### 4.1. Unit Tests (`apps/api/tests/unit/academy-progression.service.test.ts`)
- Progress percentage derivation and division by zero guard when published lessons is 0.
- Monotonicity: retake failure preserves completed status and original `completedAt`.
- Assessment guard: `QUIZ_COMPLETION_REQUIRED` thrown when lesson has published quiz.
- Strict request validation: rejection of extraneous fields.
- Historical completion preserved when new lesson is added.

### 4.2. Database Integration Tests (`apps/api/tests/integration/academy-progression-db.test.ts`)
1. **Critical Partial Workflow Failure & Retry Recovery Test (Section 26)**:
   - Create passing attempt.
   - FEAT-025 grading commits successfully.
   - Force FEAT-026 reconciliation failure.
   - Verify attempt remains `GRADED`, progress not partially written.
   - Retry submit -> FEAT-025 returns historical `GRADED` result.
   - Progression reconciliation retries and converges progress to `COMPLETED`.
   - Verify no duplicate completion fact.
2. **Concurrency Stress Test (Section 27)**:
   - Run 5 simultaneous completion calls on real PostgreSQL.
   - Verify exactly one row in DB, stable original `completedAt`, exactly one `isFirstCompletion = true`, zero duplicate-key errors.
3. **Historical vs. Current Curriculum Expansion Test (Section 28)**:
   - Course with 2 published lessons: complete both -> `status = COMPLETED, progress = 100, completedAt = T1`.
   - Publish 3rd lesson -> `status = COMPLETED, completedAt = T1, completedLessons = 2, totalLessons = 3, progressPercent = 67`.
   - Complete 3rd lesson -> `status = COMPLETED, completedAt = T1, progressPercent = 100`.
4. **Archive Behavior Test (Section 29)**:
   - Complete published lesson, then archive lesson.
   - Verify historical progress row remains; active denominator excludes archived lesson.
5. **Secrecy Regression Test (Section 30 / AC-018)**:
   - Verify progression endpoints expose zero quiz answers, option correctness, explanations, or scores.
6. **Zero Side Effects Test (Section 25 / AC-019)**:
   - Verify zero rows written to `AcademyUserXp`, `AcademyRewardLedger`, or `ProductAuditRecord`. Zero Redis durable authority.

### 4.3. Monorepo Canonical 14 Validation Suite (AC-020)
All 14 checks must exit with code 0:
1. `npm run clean`
2. `npm run lint`
3. `npx prisma validate --schema=apps/api/prisma/schema.prisma`
4. `npm run typecheck`
5. `npm run build`
6. `npm run test`
7. `npm run test:unit`
8. `npm run test:db`
9. `npm run test:redis`
10. `npm run guard:persistence`
11. `npm run guard:migration`
12. `npm run guard:boundary`
13. `npm run guard:audit-governance`
14. `npm run guard:seed-safety`
