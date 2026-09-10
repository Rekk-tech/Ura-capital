# Task Decomposition: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  
**Planning Status**: COMPLETE (REWORK ITERATION 1)  
**Implementation Status**: NOT_STARTED  
**Canonical Acceptance Criteria**: AC-001 .. AC-020  

---

## Phase 1: Shared Package & Contract Definitions

- [ ] **Task 1.1**: Add error code `QUIZ_COMPLETION_REQUIRED` to `packages/shared/src/constants/index.ts` and confirm normalized Aura error codes (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `NOT_FOUND`, `INTERNAL_ERROR`). [AC-001, AC-009]
- [ ] **Task 1.2**: Implement `CompleteLessonBodySchema = z.object({}).strict()` in `packages/shared/src/schemas/index.ts` to reject any extraneous or client-asserted progress fields. [AC-003, AC-007]
- [ ] **Task 1.3**: Add progression types and DTOs to `packages/shared/src/types/index.ts`:
  - `AcademyProgressStatus` (`'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'`)
  - `LessonProgressDto` (`lessonSlug`, `status`, `completed`, `completedAt`)
  - `CourseProgressDto` (`courseSlug`, `completedLessons`, `totalLessons`, `progressPercent`, `status`, `completed`, `completedAt`, `lessons`)
  - `CourseProgressResponse` & `CompleteLessonResponse`
  - Additive extension to `LessonDetailDto` (`progress?: LessonProgressDto | null`) [AC-007, AC-011, AC-018]
- [ ] **Task 1.4**: Define frozen internal `AcademyCompletionFact` contract and canonical semantic identity:
  - `userId + "LESSON" + resourceId` for lessons
  - `userId + "COURSE" + resourceId` for courses
  - Internal deterministic key helper `getCompletionKey` [AC-019]
- [ ] **Task 1.5**: Build shared package and verify exports (`npm run build:shared`). [AC-020]

---

## Phase 2: Repository Layer & Concurrency-Safe Persistence

- [ ] **Task 2.1**: Implement `IAcademyProgressRepository` interface and Prisma implementation in `apps/api/src/modules/academy/academy.repository.ts`:
  - `findCourseProgress(userId, courseId)`
  - `findLessonProgress(userId, lessonId)`
  - `findCourseProgressBySlug(userId, courseSlug)`
  - `getPublishedLessonsForCourse(courseId, tx?)` [AC-002, AC-014]
- [ ] **Task 2.2**: Implement deterministic concurrency-safe upsert with row-level locking (`SELECT ... FOR UPDATE`) in `upsertLessonProgressSafe` and `upsertCourseProgressSafe`:
  - Guarantee that concurrent requests result in exactly one progress row.
  - Ensure exactly one execution thread receives `isFirstCompletion: true`, with competing threads receiving `false`.
  - Preserve original `completedAt` timestamp under race conditions. [AC-015, AC-016]
- [ ] **Task 2.3**: Implement strict application transactional monotonicity checks:
  - If a lesson or course is already `COMPLETED`, preserve `COMPLETED` status and original `completedAt`.
  - Prevent any downgrade from `COMPLETED` to `IN_PROGRESS` or `NOT_STARTED`. [AC-006, AC-013]
- [ ] **Task 2.4**: Implement active published lesson filtering:
  - Query active `PUBLISHED` lessons only for denominators and completion rollups.
  - Exclude `DRAFT` and `ARCHIVED` lessons from metrics while preserving historical progress rows in PostgreSQL. [AC-014, AC-017]

---

## Phase 3: Service Layer & Coordinated Progression Reconciliation

- [ ] **Task 3.1**: Create `apps/api/src/modules/academy/academy-progression.service.ts` and implement `getCourseProgress`:
  - Validate that the course exists and is published; throw generic `NOT_FOUND` ("Resource not found") if unavailable.
  - Query active published lessons in order.
  - Derive `completedLessons`, `totalLessons`, and `progressPercent` server-side.
  - Guard against division by zero when `totalLessons === 0`.
  - Return `CourseProgressDto` supporting the valid state `completed = true` with `progressPercent < 100`. [AC-002, AC-007, AC-011, AC-012, AC-013]
- [ ] **Task 3.2**: Implement `completeInformationalLesson` in `AcademyProgressionService`:
  - Validate course and lesson exist and are published (throw generic `NOT_FOUND` on mismatch).
  - Server-side assessment guard: check whether lesson has a published quiz; if present, throw `QUIZ_COMPLETION_REQUIRED`.
  - Execute atomic progress transaction (lesson upsert, course rollup, completion fact construction).
  - Return `LessonProgressDto`. [AC-003, AC-008, AC-009, AC-010]
- [ ] **Task 3.3**: Implement `reconcileProgressFromGradedAttempt(userId, attemptId)` in `AcademyProgressionService`:
  - Independent progression transaction decoupled from the FEAT-025 grading transaction.
  - If `attempt.status === 'GRADED'` and `attempt.passed === true`, update lesson progress to `COMPLETED` and sync course progress.
  - If `attempt.passed === false`, do not mark an incomplete lesson complete, and preserve existing completed status without downgrade.
  - Return internal completion facts for FEAT-027. [AC-004, AC-005, AC-006, AC-019]
- [ ] **Task 3.4**: Integrate post-grade reconciliation into attempt submission orchestration:
  - In the submit attempt workflow, invoke `reconcileProgressFromGradedAttempt` immediately after the FEAT-025 grading transaction commits.
  - Replay recovery: when an already `GRADED` passing attempt is submitted again, ensure `reconcileProgressFromGradedAttempt` is ALWAYS re-invoked before responding (never skipped on replay).
  - Partial failure recovery: if reconciliation fails, attempt remains `GRADED` and request returns sanitized `INTERNAL_ERROR`. [AC-004, AC-015]
- [ ] **Task 3.5**: Add DTO mappers in `apps/api/src/modules/academy/academy.dto.ts`:
  - Implement `toLessonProgressDto` and `toCourseProgressDto`.
  - Add additive `progress` projection to `toLessonDetailDto`.
  - Strictly omit quiz options, answers, explanations, and scores. [AC-018]

---

## Phase 4: API Controller & Route Integration

- [ ] **Task 4.1**: Create `apps/api/src/modules/academy/academy-progression.controller.ts`:
  - Implement `getCourseProgress`: authenticated endpoint extracting `req.user.id`.
  - Implement `completeLesson`: authenticated endpoint validating strict `{}` body using `CompleteLessonBodySchema`. [AC-001, AC-002, AC-003]
- [ ] **Task 4.2**: Register progression routes in `apps/api/src/modules/academy/academy.routes.ts`:
  - `GET /api/academy/courses/:courseSlug/progress` (authenticated).
  - `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete` (authenticated). [AC-001]
- [ ] **Task 4.3**: Integrate safe learner progress projection into `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` (existing FEAT-020 endpoint) as a backward-compatible additive field. [AC-007, AC-018]

---

## Phase 5: Frontend Client & Curriculum Coverage UI

- [ ] **Task 5.1**: Add progression endpoints to `apps/web/src/api/academy.api.ts`:
  - `getCourseProgress(courseSlug)`
  - `completeLesson(courseSlug, lessonSlug)` [AC-001, AC-008]
- [ ] **Task 5.2**: Add React Query progression hooks to `apps/web/src/features/academy/hooks/use-academy.ts`:
  - `useCourseProgressQuery(courseSlug)`
  - `useCompleteLessonMutation()` with cache invalidation for course and lesson progress. [AC-008]
- [ ] **Task 5.3**: Update `LessonDetailPage.tsx`:
  - For informational lessons without a quiz, render "Mark Lesson as Complete" button if not completed.
  - When lesson is completed, render "Lesson Completed" badge with completion timestamp.
  - Automatically reflect completed status after passing a quiz. [AC-004, AC-008]
- [ ] **Task 5.4**: Update `CourseDetailPage.tsx`:
  - Render progress bar displaying `progressPercent` and completed/total ratio.
  - Display checkmarks for completed lessons in curriculum list.
  - Accurately render historical completion even when `progressPercent < 100` (e.g. 5/6 lessons complete after expansion) without displaying contradictory "100% complete" copy. [AC-010, AC-011, AC-013]

---

## Phase 6: Automated Testing & Verification Suite

- [ ] **Task 6.1**: Unit tests in `apps/api/tests/unit/academy-progression.service.test.ts`:
  - Percentage calculation and division by zero guard (0 published lessons). [AC-011, AC-012]
  - Monotonicity: failing retake never downgrades completed status or alters timestamp. [AC-006, AC-013]
  - Assessment integrity guard: `QUIZ_COMPLETION_REQUIRED` thrown when lesson has published quiz. [AC-009]
  - Strict body validation: extra or client-asserted fields rejected with `VALIDATION_ERROR`. [AC-003, AC-007]
  - Historical completed status preserved with curriculum expansion (`completed = true, progressPercent = 83`). [AC-013]
- [ ] **Task 6.2**: PostgreSQL Database Integration Tests in `apps/api/tests/integration/academy-progression-db.test.ts`:
  - **Partial Workflow Failure & Retry Recovery Test**: passing attempt graded and committed -> progression forced failure -> verify attempt remains `GRADED` with zero progress -> submit retry -> verify idempotent convergence to `COMPLETED`. [AC-004, AC-015]
  - **Concurrency Test**: 5 concurrent completion requests on real PostgreSQL produce exactly 1 row, stable `completedAt`, and exactly 1 `isFirstCompletion: true`. [AC-015, AC-016]
  - **Historical vs. Current Curriculum Expansion Test**: 2 lessons completed -> 100% at T1 -> publish 3rd lesson -> 67% but remains `COMPLETED` at T1 -> complete 3rd lesson -> 100% at T1. [AC-010, AC-011, AC-013]
  - **Archive Behavior Test**: archive completed lesson -> historical progress row preserved, active denominator excludes archived lesson. [AC-014]
  - **Secrecy Regression Test**: progression endpoints expose zero quiz answers, option correctness, explanations, or scores. [AC-018]
  - **Zero Side Effects Test**: zero rows written to `AcademyUserXp`, `AcademyRewardLedger`, or `ProductAuditRecord`; zero Redis durable authority. [AC-019]
- [ ] **Task 6.3**: Frontend component tests for progression states in `LessonDetailPage.test.tsx` and `CourseDetailPage.test.tsx`. [AC-008, AC-011, AC-013]
- [ ] **Task 6.4**: Run full Monorepo Canonical 14 Validation Suite with 0 failures:
  - `clean`, `lint`, `prisma validate`, `typecheck`, `build`, `test`, `test:unit`, `test:db`, `test:redis`, `guard:persistence`, `guard:migration`, `guard:boundary`, `guard:audit-governance`, `guard:seed-safety`. [AC-020]
- [ ] **Task 6.5**: Create implementation report `reports/implementation/phase-4/FEAT-026.md`. [AC-020]
