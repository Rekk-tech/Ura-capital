# Implementation Tasks: FEAT-023 Quiz Definition & Safe Projection

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-023  
**Phase**: Phase 4 — Academy  
**Feature Type**: Backend API Read Model & Safe Projection Contract  
**Planning Status**: COMPLETE (HUMAN APPROVED)  
**Human Planning Approval**: APPROVED  
**Implementation Status**: NOT_STARTED  
**QA Status**: NOT_STARTED  
**Human Final Gate**: NOT APPROVED  
**FEAT-024**: BLOCKED  
**Phase 4 Status**: IN_PROGRESS  

---

## 1. Task Dependency Graph

```
T1 (Schema Inspection & Approved Decision Verification)
 │
 ▼
T2 (DTOs & Validation Schemas)
 │
 ├─────────────────────────┐
 ▼                         ▼
T3 (Repository Query)     T8 (Frontend API Client & Hook)
 │                         │
 ▼                         ▼
T4 (Service Layer)        T9 (Frontend Lesson Summary UI)
 │
 ▼
T5 (Controller & Routes)
 │
 ├─────────────────────────┬─────────────────────────┐
 ▼                         ▼                         ▼
T6 (Live DB Integration)  T7 (Leakage Sentinels)    T10 (Security & Auth Bounds)
 │                         │                         │
 └─────────────────────────┼─────────────────────────┘
                           │
                           ▼
                  T11 (Monorepo Regression & Implementation Report)
```

---

## 2. Detailed Task Breakdown

### Task T1: Schema Inspection & Approved Decision Verification
- **Description**: Verify existing database schema in `apps/api/prisma/schema.prisma` and migration `20260903000000_feat019_academy_foundation` against Human-approved decisions:
  1. `SINGLE_CHOICE` ONLY supported by constraint triggers and partial unique index.
  2. Primary Quiz Read Policy (lowest-order published quiz) compatible with `@@unique([lessonId, order])`.
  3. Stable opaque UUIDs for `quiz.id`, `question.id`, and `option.id`.
  4. `passingScore` classified as safe pre-submission metadata.
- **Files**:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/migrations/20260903000000_feat019_academy_foundation/migration.sql`
- **Verification**: Zero schema edits. `npx prisma validate` passes.

---

### Task T2: DTOs & Validation Schemas
- **Description**: Define safe whitelist DTO interfaces (`QuizOptionDto`, `QuizQuestionDto`, `QuizDefinitionDto`) and Zod parameter validation schemas (`getLessonQuizParamsSchema`). Explicitly include `passingScore` in `QuizDefinitionDto`. Ensure internal foreign keys and correctness flags are omitted.
- **Files**:
  - `apps/api/src/modules/academy/academy.dto.ts`
  - `apps/api/src/modules/academy/academy.types.ts`
- **Verification**: `npm run typecheck` passes cleanly.

---

### Task T3: Repository Safe Projection Query
- **Description**: Add `findPublishedQuizByLesson(courseSlug: string, lessonSlug: string)` to `IAcademyQuizRepository` and implement in `PrismaAcademyQuizRepository`.
  - Enforce `course.status = 'PUBLISHED'`, `lesson.status = 'PUBLISHED'`, `quiz.status = 'PUBLISHED'`.
  - Apply Primary Quiz Read Policy: `orderBy: { order: "asc" }`, `findFirst`.
  - Use field-level Prisma `select` strictly excluding `isCorrect` and `explanation`.
- **Files**:
  - `apps/api/src/modules/academy/academy.repository.ts`
- **Verification**: Repository compiles and passes static typecheck.

---

### Task T4: Quiz Read Service
- **Description**: Implement `AcademyQuizReadService` to orchestrate fetching the quiz record from repository and mapping strictly to `QuizDefinitionDto`. Enforce defense-in-depth whitelist mapping.
- **Files**:
  - `apps/api/src/modules/academy/academy-quiz-read.service.ts`
  - `apps/api/tests/unit/academy-quiz-read.service.test.ts`
- **Verification**: Unit tests mock repository and verify mapping without leaks.

---

### Task T5: Controller & Route Registration
- **Description**: Add `getLessonQuiz` method to `AcademyCourseController` and register canonical route `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz` and alias route `GET /academy/courses/:courseSlug/lessons/:lessonSlug/quiz`. Apply `authenticate` middleware.
- **Files**:
  - `apps/api/src/modules/academy/academy-course.controller.ts`
  - `apps/api/src/modules/academy/academy.routes.ts`
- **Verification**: Route handlers mount cleanly without duplicate paths or conflicts.

---

### Task T6: Live PostgreSQL Database Integration Tests
- **Description**: Create comprehensive database integration tests in `apps/api/tests/integration/academy-quiz-db.test.ts`. Verify published course/lesson/quiz queries, Primary Quiz Read Policy (lowest-order selection), draft/archived parent 404s, cross-course isolation, empty quiz handling, and deterministic ordering.
- **Files**:
  - `apps/api/tests/integration/academy-quiz-db.test.ts`
- **Verification**: `npm run test:db` passes with all tests green.

---

### Task T7: Correctness Leakage Sentinel & Adversarial Tests
- **Description**: Implement recursive property key denylist scanner (`assertZeroCorrectnessLeakage`) using anchored patterns (`/^is_?correct$/i`, `/^correct$/i`, `/^correct_?option/i`, `/^correct_?answer/i`, `/^answer_?key$/i`, `/^solution/i`, `/^explanation$/i`, `/^score$/i`, `/^learner_?score$/i`, `/^points/i`, `/^grading/i`, `/^pass_?fail$/i`). Ensure `passingScore` is verified as safe pre-submission quiz metadata and not falsely rejected. Seed an adversarial test database with clear true/false options and question explanation text. Assert zero correctness leakage in parsed response body and serialized HTTP response text.
- **Files**:
  - `apps/api/tests/integration/academy-quiz-db.test.ts`
- **Verification**: Sentinel test runs and confirms zero denylisted keys or secret explanation strings appear in response.

---

### Task T8: Frontend API Client & TanStack Query Hook
- **Description**: Extend existing `AcademyApiClient` in `apps/web/src/api/academy.api.ts` with `getLessonQuiz(courseSlug, lessonSlug, accessToken)`. Add TanStack Query hook `useLessonQuizQuery` with cache key `["academy", "quiz", courseSlug, lessonSlug]`.
- **Files**:
  - `apps/web/src/api/academy.api.ts`
  - `apps/web/src/features/academy/hooks/use-academy.ts`
- **Verification**: Frontend compiles cleanly with `npm run typecheck`.

---

### Task T9: Frontend Lesson Page Quiz Summary Integration
- **Description**: Add an informational Quiz Summary card to `LessonDetailPage.tsx` indicating quiz title, question count, and passing score requirement. Use product-neutral status copy (`"Quiz available"` or `"Quiz attempts are not available yet"`; zero internal roadmap jargon).
- **Files**:
  - `apps/web/src/features/academy/pages/LessonDetailPage.tsx`
  - `apps/web/src/features/academy/pages/LessonDetailPage.test.tsx`
- **Verification**: `npm run test:unit` passes with updated page tests.

---

### Task T10: Security & Boundary Verification
- **Description**: Verify authentication boundaries (missing token, malformed token, expired token return 401), input validation (malicious slugs return 400), and read-only persistence boundary (zero mutations to attempts, answers, progress, XP, or rewards).
- **Files**:
  - `apps/api/tests/integration/academy-quiz-db.test.ts`
- **Verification**: Security test suite passes.

---

### Task T11: Full Monorepo Regression & Implementation Report
- **Description**: Execute all 14 monorepo validation checks. Generate `reports/implementation/phase-4/FEAT-023.md`. Update `docs/progress-tracker.md` to `FEAT-023: IMPLEMENTED / READY FOR QA`.
- **Governance Invariant**: **Implementation Agent owns ONLY the Implementation Report. The QA Report is created strictly by the independent QA step. Do NOT self-QA.**
- **Files**:
  - `reports/implementation/phase-4/FEAT-023.md`
  - `docs/progress-tracker.md`
  - `docs/phase-4-feature-decomposition.md`
- **Verification**: All 14 checks pass with 0 errors and 0 warnings.

---

## 3. Task to Acceptance Criteria Traceability Matrix

| Task ID | Task Title | Primary AC Covered | Supporting ACs |
| :--- | :--- | :---: | :--- |
| **T1** | Schema Inspection & Approved Decision Verification | **AC-001** | AC-003, AC-009 |
| **T2** | DTOs & Validation Schemas | **AC-010** | AC-006, AC-009 |
| **T3** | Repository Safe Projection Query | **AC-003** | AC-004, AC-005, AC-006, AC-015 |
| **T4** | Quiz Read Service | **AC-015** | AC-006, AC-010 |
| **T5** | Controller & Route Registration | **AC-002** | AC-011, AC-015 |
| **T6** | Live PostgreSQL Database Integration Tests | **AC-004** | AC-003, AC-005, AC-011, AC-012 |
| **T7** | Correctness Leakage Sentinel & Adversarial Tests | **AC-006** | AC-007, AC-008 |
| **T8** | Frontend API Client & TanStack Query Hook | **AC-016** | AC-002, AC-010 |
| **T9** | Frontend Lesson Page Quiz Summary Integration | **AC-017** | AC-016 |
| **T10** | Security & Boundary Verification | **AC-013** | AC-002, AC-014 |
| **T11** | Full Monorepo Regression & Implementation Report | **AC-018** | AC-001..AC-017 |
