# Implementation Plan: FEAT-020 Course & Lesson Read Model APIs

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-020  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  

---

## 1. Architecture Design & Component Layout

FEAT-020 delivers the read-model API layer for Academy courses and lessons according to the modular monolith pattern:

```text
HTTP Request
     │
     ▼
[Express Router] (apps/api/src/modules/academy/academy.routes.ts)
     │  - Validation: Zod schemas on query and path parameters
     │  - Auth: FEAT-004 authenticate middleware on lesson detail route
     ▼
[AcademyCourseController] (apps/api/src/modules/academy/academy-course.controller.ts)
     │  - Extracts validated params, delegates to service, returns JSON envelope
     ▼
[AcademyCourseReadService] (apps/api/src/modules/academy/academy-course-read.service.ts)
     │  - Orchestrates repository calls, maps entities to minimized DTOs, throws 404
     ▼
[IAcademyCourseRepository] (apps/api/src/modules/academy/academy.repository.ts)
     │  - Enforces status = 'PUBLISHED' directly in PostgreSQL queries
     │  - Leverages FEAT-019 indexes, prevents N+1 query execution
     ▼
[PostgreSQL Database] (Tables: academy_courses, academy_lessons)
```

---

## 2. Database-Level Repository Filtering Authority

Filtering for `PUBLISHED` content occurs directly within PostgreSQL query definitions, not after loading in memory:

### 2.1 Repository Contracts (`apps/api/src/modules/academy/academy.repository.ts`)

```typescript
export interface ListPublishedCoursesParams {
  skip: number;
  take: number;
  level?: string;
}

export interface IAcademyCourseRepository {
  // Existing FEAT-019 methods retained...
  
  // FEAT-020 read model additions:
  listPublishedCourses(params: ListPublishedCoursesParams): Promise<{
    courses: Array<AcademyCourse & { _count: { lessons: number } }>;
    total: number;
  }>;

  findPublishedCourseBySlug(slug: string): Promise<
    (AcademyCourse & { lessons: Array<Pick<AcademyLesson, "slug" | "title" | "order">> }) | null
  >;

  findPublishedLessonByCourseAndSlug(
    courseSlug: string,
    lessonSlug: string,
  ): Promise<(AcademyLesson & { course: Pick<AcademyCourse, "slug"> }) | null>;
}
```

### 2.2 Query Implementation Logic
- **`listPublishedCourses`**:
  ```typescript
  const where: Prisma.AcademyCourseWhereInput = {
    status: "PUBLISHED",
    ...(params.level ? { level: params.level } : {}),
  };
  const [courses, total] = await Promise.all([
    this.prisma.academyCourse.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: { lessons: { where: { status: "PUBLISHED" } } },
        },
      },
    }),
    this.prisma.academyCourse.count({ where }),
  ]);
  ```
- **`findPublishedCourseBySlug`**:
  ```typescript
  return this.prisma.academyCourse.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      lessons: {
        where: { status: "PUBLISHED" },
        select: { slug: true, title: true, order: true },
        orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }],
      },
    },
  });
  ```
- **`findPublishedLessonByCourseAndSlug`**:
  ```typescript
  // Single ownership-aware query joining course and lesson:
  return this.prisma.academyLesson.findFirst({
    where: {
      slug: lessonSlug,
      status: "PUBLISHED",
      course: {
        slug: courseSlug,
        status: "PUBLISHED",
      },
    },
    include: {
      course: { select: { slug: true } },
    },
  });
  ```

---

## 3. Service & Controller Design

### 3.1 `AcademyCourseReadService` (`apps/api/src/modules/academy/academy-course-read.service.ts`)
- **`getCourses(query: ListCoursesQuery)`**:
  - Computes `skip = (page - 1) * limit`, `take = limit`.
  - Calls `repository.listPublishedCourses`.
  - Calculates `totalPages = total === 0 ? 0 : Math.ceil(total / limit)`.
  - Maps to `CourseSummaryDto[]` and `PaginationMeta`.
- **`getCourseBySlug(slug: string)`**:
  - Calls `repository.findPublishedCourseBySlug(slug)`.
  - If null $\rightarrow$ throws `NotFoundError("Course not found", "NOT_FOUND", 404)`.
  - Maps to `CourseDetailDto`.
- **`getLessonBySlug(courseSlug: string, lessonSlug: string)`**:
  - Calls `repository.findPublishedLessonByCourseAndSlug(courseSlug, lessonSlug)`.
  - If null $\rightarrow$ throws `NotFoundError("Lesson not found", "NOT_FOUND", 404)`.
  - Maps to `LessonDetailDto`.

### 3.2 Controller & Router (`apps/api/src/modules/academy/academy.routes.ts`)
- Mounts routes on `/api/academy`:
  - `GET /courses` $\rightarrow$ `validate(listCoursesQuerySchema, 'query')`, `controller.listCourses`. (PUBLIC)
  - `GET /courses/:slug` $\rightarrow$ `validate(courseSlugParamSchema, 'params')`, `controller.getCourse`. (PUBLIC)
  - `GET /courses/:courseSlug/lessons/:lessonSlug` $\rightarrow$ `authenticate`, `validate(lessonSlugParamSchema, 'params')`, `controller.getLesson`. (AUTHENTICATED)

---

## 4. Performance & Index Strategy

- **Available Indexes Utilized**:
  - `academy_courses_slug_key` on `academy_courses(slug)`
  - `academy_lessons_course_id_slug_key` on `academy_lessons(course_id, slug)`
  - `academy_lessons_course_id_order_key` on `academy_lessons(course_id, order)`
  - `academy_lessons_course_id_idx` on `academy_lessons(course_id)`
- **Index Optimization Deferral**:
  - No new indexes are added to `academy_courses` or `academy_lessons`.
  - Dedicated compound indexes on `(status, level, order)` are **DEFERRED** unless production performance monitoring demonstrates measurable need.
  - Zero schema modifications or migrations (AC-002 compliance).
- **Index Verification Semantics**:
  - Verification confirms that expected FEAT-019 indexes exist in PostgreSQL and that repository query predicates and ordering align with available index definitions.
  - Optional `EXPLAIN` query execution plans may be captured as informational performance evidence.
  - The PostgreSQL query planner selecting a sequential scan on small QA test fixtures does not constitute a defect or failure for FEAT-020.

---

## 5. Architectural Guard Compliance

1. **Static Boundary Guard (`guard:boundary`)**:
   - `AcademyCourseController` and `AcademyCourseReadService` import interfaces only; zero direct `@prisma/client` references.
2. **Audit Governance Guard (`guard:audit-governance`)**:
   - Catalog and lesson read endpoints do not record audit events, adhering to FEAT-016 read boundary.
3. **Persistence Guard (`guard:persistence`)**:
   - Redis is strictly unused in FEAT-020 read models.
4. **Migration & Seed Guards (`guard:migration`, `guard:seed-safety`)**:
   - Zero migrations and zero seed changes.
