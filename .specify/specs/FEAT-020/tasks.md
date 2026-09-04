# Tasks: FEAT-020 Course & Lesson Read Model APIs

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-020  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  

---

## 1. Task Sequence

```text
[Task 1: DTOs & Validation]
        │
        ▼
[Task 2: Repository Read Methods]
        │
        ▼
[Task 3: Service Layer & Unit Tests]
        │
        ▼
[Task 4: Controller & Express Router]
        │
        ▼
[Task 5: HTTP & Security Integration Tests]
        │
        ▼
[Task 6: Live DB Integration Tests]
        │
        ▼
[Task 7: Full Validation & Implementation Report]
```

---

## 2. Detailed Task Breakdown

### Task 1: Define Minimized DTOs, Mappers, and Zod Validation Schemas
- **Files**:
  - `apps/api/src/modules/academy/academy.dto.ts`
  - `apps/api/src/modules/academy/academy.validation.ts`
- **Responsibility**:
  - Define `CourseSummaryDto`, `CourseDetailDto`, `LessonSummaryDto`, `LessonDetailDto`, `PaginationMeta`.
  - Ensure zero exposure of internal UUIDs or timestamps (`createdAt`, `updatedAt`).
  - Create Zod validation schemas for query parameters (`listCoursesQuerySchema`: `page`, `limit`, `level`) and path parameters (`courseSlugParamSchema`, `lessonSlugParamSchema`).
  - Implement pure mapper functions to map database entities to whitelisted DTOs.
- **Related ACs**: AC-001, AC-004, AC-011.
- **Verification**: Typecheck and unit tests for mapper and validation functions.

---

### Task 2: Extend Repository Read Contracts & Database Filtering Methods
- **Files**:
  - `apps/api/src/modules/academy/academy.repository.ts`
  - `apps/api/src/modules/academy/academy.types.ts`
  - `apps/api/tests/unit/academy-repository.test.ts`
- **Responsibility**:
  - Add `listPublishedCourses`, `findPublishedCourseBySlug`, and `findPublishedLessonByCourseAndSlug` to `IAcademyCourseRepository` and `PrismaAcademyCourseRepository`.
  - Enforce `status = 'PUBLISHED'` directly in PostgreSQL `where` clauses.
  - Implement single ownership-aware join query for lesson retrieval binding `course.slug`, `course.status = 'PUBLISHED'`, `lesson.slug`, `lesson.status = 'PUBLISHED'`, and `lesson.courseId = course.id`.
  - Implement stable deterministic sorting (`order ASC, title ASC, id ASC`).
  - Update unit tests with mock Prisma client for the new methods.
- **Related ACs**: AC-002, AC-003, AC-004, AC-005, AC-008, AC-009, AC-010.
- **Verification**: `npx vitest run tests/unit/academy-repository.test.ts`.

---

### Task 3: Implement `AcademyCourseReadService` with Business Rules
- **Files**:
  - `apps/api/src/modules/academy/academy-course-read.service.ts`
  - `apps/api/tests/unit/academy-course-read.service.test.ts`
- **Responsibility**:
  - Implement `getCourses`, `getCourseBySlug`, and `getLessonBySlug`.
  - Enforce pagination math: `totalPages = total === 0 ? 0 : Math.ceil(total / limit)`.
  - Throw standard `NotFoundError` (`code: 'NOT_FOUND'`, `statusCode: 404`) for missing, draft, or archived courses and lessons.
  - Create unit tests covering success paths, draft exclusions, pagination edge cases, and 404 error cases.
- **Related ACs**: AC-003, AC-004, AC-005, AC-006, AC-008, AC-009, AC-010, AC-011.
- **Verification**: `npx vitest run tests/unit/academy-course-read.service.test.ts`.

---

### Task 4: Implement Controller & Mount Express Routes
- **Files**:
  - `apps/api/src/modules/academy/academy-course.controller.ts`
  - `apps/api/src/modules/academy/academy.routes.ts`
  - `apps/api/src/server.ts` (or `apps/api/src/app.ts`)
- **Responsibility**:
  - Implement `AcademyCourseController` with methods `listCourses`, `getCourse`, `getLesson`.
  - Wire `/courses` (PUBLIC) and `/courses/:slug` (PUBLIC) routes.
  - Wire `/courses/:courseSlug/lessons/:lessonSlug` (AUTHENTICATED) with `authenticate` middleware.
  - Ensure zero direct `@prisma/client` imports in controller (`guard:boundary` compliance).
- **Related ACs**: AC-001, AC-007, AC-012, AC-013, AC-014.
- **Verification**: `npm run guard:boundary`.

---

### Task 5: HTTP API Contract & Security Integration Tests
- **Files**:
  - `apps/api/tests/integration/academy-routes.test.ts`
- **Responsibility**:
  - Test `GET /api/academy/courses`: public access, query validation (400 on invalid page/limit/level), pagination envelope.
  - Test `GET /api/academy/courses/:slug`: public access, 200 on published, 404 on draft/archived/unknown slug.
  - Test `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`:
    - 401 on missing or invalid JWT.
    - 200 on published lesson under published course with valid JWT.
    - 404 on cross-course lesson slug.
    - 404 on draft/archived course or lesson.
  - Verify zero internal fields (`id`, `courseId`, `createdAt`, `updatedAt`, quiz data) in responses.
- **Related ACs**: AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011.
- **Verification**: `npx vitest run tests/integration/academy-routes.test.ts`.

---

### Task 6: Live PostgreSQL Integration Tests for Academy Read Model
- **Files**:
  - `apps/api/tests/integration/academy-read-db.test.ts`
- **Responsibility**:
  - Execute live queries against PostgreSQL test database.
  - Verify database-level ordering (`order ASC, title ASC, id ASC`), level filtering, and pagination offsets.
  - Verify expected FEAT-019 indexes exist (`academy_courses_slug_key`, `academy_lessons_course_id_idx`, `academy_lessons_course_id_order_key`, `academy_lessons_course_id_slug_key`).
  - Verify repository query predicates and ordering align with available indexes. (Optional EXPLAIN output may be recorded as informational performance evidence; PostgreSQL planner selecting sequential scans on small QA fixture tables does not fail FEAT-020).
  - Verify published-only filtering occurs directly at the SQL level.
- **Related ACs**: AC-002, AC-003, AC-004, AC-005, AC-008, AC-009, AC-010.
- **Verification**: `npm run test:db`.

---

### Task 7: Full Validation Suite, Governance Guards & Implementation Report
- **Files**:
  - `reports/implementation/phase-4/FEAT-020.md`
  - `docs/progress-tracker.md`
- **Responsibility**:
  - Run full validation: `clean`, `lint`, `typecheck`, `build`, `test`, `test:unit`, `test:db`, `test:redis`, and all 5 guards.
  - Produce comprehensive implementation report at `reports/implementation/phase-4/FEAT-020.md`.
  - Update governance progress tracker to `IMPLEMENTED / READY FOR QA`.
- **Related ACs**: AC-012, AC-013, AC-014, AC-015, AC-016.
- **Verification**: Monorepo full validation suite.

---

## 3. Task -> AC Traceability Matrix

| Task ID | Task Description | Owning Acceptance Criteria |
| --- | --- | --- |
| **Task 1** | DTOs, Mappers, and Validation Schemas | AC-001, AC-004, AC-011 |
| **Task 2** | Repository Read Methods Extension | AC-002, AC-003, AC-004, AC-005, AC-008, AC-009, AC-010 |
| **Task 3** | Service Layer Implementation | AC-003, AC-004, AC-005, AC-006, AC-008, AC-009, AC-010, AC-011 |
| **Task 4** | Controller & Express Router Wiring | AC-001, AC-007, AC-012, AC-013, AC-014 |
| **Task 5** | HTTP & Security Integration Tests | AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011 |
| **Task 6** | Live PostgreSQL DB Integration Tests | AC-002, AC-003, AC-004, AC-005, AC-008, AC-009, AC-010 |
| **Task 7** | Full Validation Suite & Report | AC-012, AC-013, AC-014, AC-015, AC-016 |
