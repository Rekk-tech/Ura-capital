# Requirement: FEAT-020 Course & Lesson Read Model APIs

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-020  
**Phase**: Phase 4 — Academy  
**Feature Type**: Read model API implementation planning package  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex (with Human Governance)  

---

## 1. Context & Background

Phase 4 establishes the learner-facing Academy domain on the approved production architecture. FEAT-019 established the durable persistence foundation, achieving QA PASS (Emergency QA Ownership Transfer), Human Dual Review approval, and Human Final Gate approval (`feat-019-approved`).

FEAT-020 is the second feature in Phase 4. It provides the initial learner-facing read model APIs for browsing courses and reading lessons. It builds directly upon the PostgreSQL/Prisma persistence foundation established by FEAT-019 without modifying the schema or weakening any database invariant.

---

## 2. Goal

Design and implement safe, performant, learner-facing read-only REST APIs for:
1. Listing published courses with summary metadata and bounded pagination.
2. Retrieving detailed information for a specific published course, including its ordered outline of published lessons.
3. Retrieving full educational content for a specific published lesson belonging to a published course.

The APIs must enforce strict response projection (minimized whitelisted DTOs excluding internal IDs and operational timestamps), prevent unpublished/draft content leakage, enforce course-to-lesson relational hierarchy, and adhere to established architectural boundaries (controller $\rightarrow$ service $\rightarrow$ repository $\rightarrow$ PostgreSQL).

---

## 3. Human Planning Decisions

### Locked Decision: Authentication & Access Model (`APPROVED`)
- **Public Routes**:
  - `GET /api/academy/courses`: PUBLIC (allows prospective learners and guests to browse curriculum).
  - `GET /api/academy/courses/:slug`: PUBLIC (allows inspection of course outline and syllabus).
- **Authenticated Route**:
  - `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`: AUTHENTICATED (requires valid JWT via approved `authenticate` middleware).
- **Authorization**: Valid authenticated learner identity is sufficient. No role-based restrictions (e.g. ADMIN) are introduced or required for reading lessons.
- **Visibility Invariant**: For all learner-facing routes, `DRAFT` and `ARCHIVED` resources return `404 Not Found`, identical to nonexistent resources.

---

## 4. Dependencies

- **FEAT-019 (DONE / Approved)**: Implements concrete Academy PostgreSQL status constraints (`DRAFT`, `PUBLISHED`, `ARCHIVED`), canonical durable schema (`AcademyCourse`, `AcademyLesson`), Prisma client, forward-only migration, and repository container binding. FEAT-020 consumes these approved FEAT-019 persistence invariants.
- **FEAT-013 (DONE / Approved)**: Shared repository pattern, repository factory, and error sanitization.
- **FEAT-014 (DONE / Approved)**: Defines reusable database constraint standards.
- **FEAT-015 (DONE / Approved)**: Redis transient-state boundary (FEAT-020 uses direct PostgreSQL queries; Redis is NOT used as durable authority or premature cache).
- **FEAT-016 (DONE / Approved)**: Product audit governance (ordinary read operations do not emit product audit records).
- **FEAT-004 / FEAT-007 (DONE / Approved)**: Access token authentication and middleware (`authenticate` handler).

---

## 5. In Scope

1. **Course Catalog Read API (`GET /api/academy/courses`)**:
   - Lists published courses (`status = 'PUBLISHED'`).
   - Rejects or excludes non-published (`DRAFT`, `ARCHIVED`) courses directly in the database query.
   - Bounded pagination (`page`, `limit`) with standard pagination metadata (`total`, `page`, `limit`, `totalPages`).
   - Optional difficulty/level filtering (`level: BEGINNER | INTERMEDIATE | ADVANCED`).
   - Deterministic ordering: `order ASC, title ASC, id ASC`.
   - Returns minimized `CourseSummaryDto` (excludes internal UUIDs and timestamps).

2. **Course Detail Read API (`GET /api/academy/courses/:slug`)**:
   - Retrieves published course by slug using index-backed query.
   - Returns 404 if course does not exist, is in `DRAFT`, or is `ARCHIVED`.
   - Includes ordered list of published lessons belonging to the course (`order ASC`).
   - Returns minimized `CourseDetailDto` containing course metadata and array of `LessonSummaryDto`.

3. **Lesson Detail Read API (`GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`)**:
   - Requires valid JWT access token (`authenticate` middleware).
   - Single ownership-aware repository query binding `course.slug`, `course.status = 'PUBLISHED'`, `lesson.slug`, `lesson.status = 'PUBLISHED'`, and `lesson.courseId = course.id`.
   - Returns 404 if course or lesson does not exist, is not published, or if the lesson belongs to a different course.
   - Returns minimized `LessonDetailDto` with full educational markdown/text content (`content`).

4. **Layered Architecture & Boundary Guard**:
   - Express routing $\rightarrow$ `AcademyCourseController` $\rightarrow$ `AcademyCourseReadService` $\rightarrow$ `IAcademyCourseRepository` $\rightarrow$ PostgreSQL.
   - Zero direct Prisma imports in controller or service (`guard:boundary` remains green).
   - Zod validation for query parameters (`page`, `limit`, `level`) and path parameters (`slug`, `courseSlug`, `lessonSlug`).
   - Standard sanitized JSON response envelopes and error envelopes.

5. **Testing & Verification**:
   - Unit tests for controllers, services, safe DTO mappers, and Zod validators.
   - Live PostgreSQL integration tests for published filtering, ordering, pagination, and course/lesson ownership checks.
   - Negative security tests verifying DRAFT/ARCHIVED content is inaccessible and cross-course lesson IDs are rejected with 404.

---

## 6. Out of Scope & Explicit Deferrals

FEAT-020 strictly excludes:
- **Frontend UI**: Learner screens and components are owned by FEAT-021 (`Academy Learner Course/Lesson UI`).
- **Flashcards API**: Flashcard retrieval and review interactions are owned by FEAT-022 (`Flashcards Domain & Review Flow`).
- **Quiz Definition & Safe Projection**: Quiz metadata, questions, and option projections are owned by FEAT-023 (`Quiz Definition & Safe Projection`).
- **Quiz Attempts & Submission**: Attempt lifecycles and evaluation are owned by FEAT-024 and FEAT-025.
- **Learner Progress Mutation**: Course and lesson progress tracking/updates are owned by FEAT-026.
- **XP & Reward Ledger**: XP computation and idempotent rewards are owned by FEAT-027.
- **CMS / Admin Authoring**: Course creation, editing, draft preview, and status updates are excluded from Phase 4.
- **Redis Caching**: OUT OF SCOPE. Direct PostgreSQL reads are performant and authoritative.
- **Product Audit Persistence**: Read operations do not emit audit records.
- **Schema Modifications**: Zero new tables, columns, constraints, or migrations (AC-002: ZERO schema changes).

---

## 7. Business & Security Rules

1. **Published-Only Visibility**:
   - Learners must never see `DRAFT` or `ARCHIVED` courses or lessons.
   - Any query attempting to access a draft or archived resource by slug must return standard `404 Not Found` without revealing resource existence.
2. **Relational Ownership Enforcement**:
   - A lesson must strictly belong to the course specified in the route (`courseSlug`). Accessing `/courses/course-a/lessons/lesson-from-course-b` must return `404 Not Found`, even if both course-a and lesson-from-course-b are published.
3. **No Internal Entity Leakage**:
   - Responses must use explicit whitelisted DTOs.
   - Raw Prisma objects, internal UUIDs, and operational timestamps (`createdAt`, `updatedAt`) are excluded from learner projections.
4. **Input Sanitization**:
   - Slugs are validated against standard slug patterns (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
   - Pagination parameters are bounded: `page >= 1`, `1 <= limit <= 50`.
   - Unsupported `level` values are rejected with `400 Bad Request`.
