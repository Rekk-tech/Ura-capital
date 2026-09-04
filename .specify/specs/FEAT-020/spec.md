# Specification: FEAT-020 Course & Lesson Read Model APIs

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-020  
**Phase**: Phase 4 — Academy  
**Feature Type**: Read model API specification  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  

---

## 1. User Stories & Acceptance Scenarios

### Story 1 - Public Course Catalog Discovery
As a learner or prospective student,  
I want to browse the list of published Academy courses,  
So that I can discover course titles, descriptions, difficulty levels, and lesson counts to choose what to study.

- **Endpoint**: `GET /api/academy/courses`
- **Access**: Public
- **Behavior**: Returns paginated list of published courses (`status = 'PUBLISHED'`) with deterministic ordering (`order ASC, title ASC, id ASC`). Any courses in `DRAFT` or `ARCHIVED` status are filtered out directly in the database query.

---

### Story 2 - Course Outline & Syllabus View
As a learner,  
I want to view the detailed outline of a specific published course by its slug,  
So that I can see the course structure and the ordered list of published lessons it contains.

- **Endpoint**: `GET /api/academy/courses/:slug`
- **Access**: Public
- **Behavior**: Uses index-backed lookup on course slug. Returns course metadata along with an ordered array of published lesson summaries (`order ASC, title ASC, id ASC`). If the course does not exist, is in `DRAFT`, or is `ARCHIVED`, returns `404 Not Found`. Unpublished lessons within the course are excluded by the database query.

---

### Story 3 - Lesson Content Reading
As an authenticated learner,  
I want to read the full educational content of a specific lesson within a course,  
So that I can study the lesson material.

- **Endpoint**: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`
- **Access**: Authenticated (valid JWT via `authenticate` middleware)
- **Behavior**: Executes a single ownership-aware database query binding `course.slug`, `course.status = 'PUBLISHED'`, `lesson.slug`, `lesson.status = 'PUBLISHED'`, and `lesson.courseId = course.id`. Returns full lesson content. If the lesson belongs to a different course, or if either resource is not published or missing, returns `404 Not Found`.

---

## 2. API Contract Specification

Base Route Prefix: `/api/academy`

### 2.1 Course Catalog: `GET /api/academy/courses`

- **Purpose**: Retrieve paginated list of published courses.
- **Authentication**: Public.
- **Query Parameters**:
  - `page`: integer, optional (default: `1`, minimum: `1`).
  - `limit`: integer, optional (default: `20`, minimum: `1`, maximum: `50`).
  - `level`: string, optional (allowed values: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`). Validated by API schema.
- **Pagination Semantics**:
  - `total`: number of `PUBLISHED` courses matching the optional `level` filter.
  - `totalPages`: `total === 0 ? 0 : Math.ceil(total / limit)`.
  - `page`: current page.
  - `limit`: items per page.
- **Ordering**: `order ASC, title ASC, id ASC` (stable deterministic sort).
- **Success Response**: `200 OK`
  ```json
  {
    "data": [
      {
        "slug": "introduction-to-finance",
        "title": "Introduction to Finance",
        "description": "Learn the fundamentals of modern finance.",
        "level": "BEGINNER",
        "order": 1,
        "lessonCount": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid query parameters (e.g., `page < 1`, `limit > 50`, or unsupported `level`).
  - `500 Internal Server Error`: Standard sanitized error envelope.

---

### 2.2 Course Detail: `GET /api/academy/courses/:slug`

- **Purpose**: Retrieve course metadata and its ordered lesson outline.
- **Authentication**: Public.
- **Path Parameters**:
  - `slug`: string, required (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Success Response**: `200 OK`
  ```json
  {
    "data": {
      "slug": "introduction-to-finance",
      "title": "Introduction to Finance",
      "description": "Learn the fundamentals of modern finance.",
      "level": "BEGINNER",
      "order": 1,
      "lessons": [
        {
          "slug": "what-is-money",
          "title": "What is Money?",
          "order": 1
        },
        {
          "slug": "time-value-of-money",
          "title": "Time Value of Money",
          "order": 2
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Malformed course slug format.
  - `404 Not Found`: Course does not exist, is in `DRAFT`, or is `ARCHIVED` (indistinguishable response).
  - `500 Internal Server Error`: Standard sanitized error envelope.

---

### 2.3 Lesson Detail: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`

- **Purpose**: Retrieve full educational content of a published lesson.
- **Authentication**: Authenticated (`authenticate` middleware requiring valid Bearer JWT).
- **Authorization**: Valid authenticated learner identity is sufficient.
- **Path Parameters**:
  - `courseSlug`: string, required (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
  - `lessonSlug`: string, required (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Success Response**: `200 OK`
  ```json
  {
    "data": {
      "courseSlug": "introduction-to-finance",
      "slug": "what-is-money",
      "title": "What is Money?",
      "content": "# What is Money?\n\nMoney is an agreed-upon medium of exchange...",
      "order": 1
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Malformed slug format.
  - `401 Unauthorized`: Missing, expired, or invalid access token.
  - `404 Not Found`: Course or lesson not found, course or lesson not `PUBLISHED`, or lesson belongs to a different course (`lesson.courseId !== course.id`).
  - `500 Internal Server Error`: Standard sanitized error envelope.

---

## 3. Minimized Learner Data Transfer Objects (DTOs)

All DTOs strictly exclude internal database IDs (`id`, `courseId`), audit timestamps (`createdAt`, `updatedAt`), and internal status fields.

```typescript
export interface CourseSummaryDto {
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  lessonCount: number;
}

export interface LessonSummaryDto {
  slug: string;
  title: string;
  order: number;
}

export interface CourseDetailDto {
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  lessons: LessonSummaryDto[];
}

export interface LessonDetailDto {
  courseSlug: string;
  slug: string;
  title: string;
  content: string | null;
  order: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

---

## 4. Input Validation & Parameter Schemas

Zod schemas enforce strict bounds at the HTTP boundary:

```typescript
import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const listCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
});

export const courseSlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(SLUG_REGEX, "Invalid slug format"),
});

export const lessonSlugParamSchema = z.object({
  courseSlug: z.string().trim().min(1).max(100).regex(SLUG_REGEX, "Invalid course slug format"),
  lessonSlug: z.string().trim().min(1).max(100).regex(SLUG_REGEX, "Invalid lesson slug format"),
});
```

---

## 5. Security & Invariant Enforcement

1. **Uniform 404 for Hidden Resources**:
   - `DRAFT` and `ARCHIVED` courses and lessons return `404 Not Found`. Callers cannot infer whether a draft course exists.
2. **Relational Path Traversal Guard**:
   - Lesson detail lookups strictly require `lesson.courseId = course.id`. A published lesson `lesson-1` belonging to `course-a` accessed as `/courses/course-b/lessons/lesson-1` returns `404 Not Found`.
3. **Safe Serialization**:
   - Pure mapper functions ensure zero raw Prisma models or unintended properties leave the service tier.
4. **Token Security**:
   - Authenticated route relies strictly on verified JWT claims via FEAT-004 `authenticate` middleware. No client-supplied user headers are trusted.

---

## 6. Query Strategy & Actual Available Indexes

FEAT-020 relies strictly on existing FEAT-019 database indexes:

### Actual PostgreSQL Indexes Available (from FEAT-019)
- `academy_courses`:
  - `academy_courses_pkey` on `("id")`
  - `academy_courses_slug_key` UNIQUE on `("slug")`
- `academy_lessons`:
  - `academy_lessons_pkey` on `("id")`
  - `academy_lessons_course_id_idx` on `("course_id")`
  - `academy_lessons_course_id_order_key` UNIQUE on `("course_id", "order")`
  - `academy_lessons_course_id_slug_key` UNIQUE on `("course_id", "slug")`

### Read Path Operations
1. **Course Lookup by Slug**: Index-backed lookup via `academy_courses_slug_key` on `slug`.
2. **Course Detail Lesson Outline**: Index-backed filter and sort on `("course_id", "order")` with `where: { status: 'PUBLISHED' }`.
3. **Lesson Detail Lookup**: Single query joining Course and Lesson via `course.slug` and `("course_id", "slug")` unique index with `status = 'PUBLISHED'`.
4. **Catalog List Filter**: Scans `academy_courses` where `status = 'PUBLISHED'` (and optional `level`). As `academy_courses` is a bounded catalog table, this is performant without additional indexes. Additional composite indexes on `(status, level, order)` are **DEFERRED** unless production profiling indicates need. AC-002 enforces zero schema changes.
5. **Index Verification Semantics**: Tests verify that expected FEAT-019 indexes exist in PostgreSQL and that repository query predicates and ordering align with available indexes. Optional EXPLAIN output may be recorded as informational evidence. The PostgreSQL query planner selecting a sequential scan on small QA test fixtures does not constitute a defect or failure for FEAT-020.
