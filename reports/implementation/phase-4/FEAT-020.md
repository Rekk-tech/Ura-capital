# Implementation Report: FEAT-020 Course & Lesson Read Model APIs

**Feature ID**: FEAT-020  
**Feature Name**: Course & Lesson Read Model APIs  
**Phase**: Phase 4 — Product Foundation & Academy MVP  
**Implementation Status**: `DONE`  
**QA Status**: `PASS — Antigravity QA with Human Dual Review`  
**Human Dual Review**: `APPROVED`  
**Human Final Gate**: `APPROVED`  
**QA Independence Note**: Antigravity was both implementation owner and QA executor; Human Dual Review applied as compensating governance control.  
**Date**: 2026-09-03  

---

## 1. Executive Summary

FEAT-020 implements the read model HTTP APIs and underlying query pipeline for the Aura Academy course catalog, public course outlines, and authenticated lesson educational content. The implementation strictly adheres to the approved planning baseline:
- Strict layered architecture (`Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository` $\rightarrow$ `PostgreSQL`).
- Zero direct Prisma access from controllers and services (`guard:boundary` compliant).
- Whitelist-only learner DTOs ensuring zero leakage of database internals, primary keys, timestamps, or quiz data.
- Strict visibility invariant: `PUBLISHED` content is returned; `DRAFT` and `ARCHIVED` resources return standard `404 Not Found` without distinction from nonexistent resources.
- Relational ownership enforcement: cross-course lesson access returns `404 Not Found`.
- Zero schema changes, migrations, or database alterations (AC-002 compliant).
- Zero Redis caching or state usage.
- Zero durable product audit records emitted on read traffic.
- FEAT-021 has **NOT** been started.

---

## 2. Endpoint Contracts & Authorization Boundary

| Method | Path | Access Control | Description |
| --- | --- | --- | --- |
| `GET` | `/api/academy/courses` | **PUBLIC** | Course catalog with deterministic ordering and pagination. |
| `GET` | `/api/academy/courses/:slug` | **PUBLIC** | Course detail including ordered list of published lesson summaries. |
| `GET` | `/api/academy/courses/:courseSlug/lessons/:lessonSlug` | **AUTHENTICATED** | Full educational lesson detail for authenticated active learners. |

### Authentication Boundary
- Handled by existing trusted middleware `authenticate` (`apps/api/src/modules/auth/auth.middleware.ts`).
- Validates HS256 JWT access token (`typ: "access"`), claims, expiration, and active status in PostgreSQL.
- Authenticated learner identity is sufficient; no admin or elevated role is required.
- Unauthenticated or invalid token requests return `401 Unauthorized` with `ERROR_CODES.UNAUTHENTICATED`.

---

## 3. Safe Learner DTO Fields (Whitelist Projections)

All responses serialize through pure mapper functions defined in [`apps/api/src/modules/academy/academy.dto.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.dto.ts).

### `CourseSummaryDto`
```typescript
{
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  lessonCount: number; // Count of PUBLISHED lessons only
}
```

### `CourseDetailDto`
```typescript
{
  slug: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  lessons: LessonSummaryDto[]; // PUBLISHED lesson summaries ordered by (order ASC, title ASC, id ASC)
}
```

### `LessonSummaryDto`
```typescript
{
  slug: string;
  title: string;
  order: number;
}
```

### `LessonDetailDto`
```typescript
{
  courseSlug: string;
  slug: string;
  title: string;
  content: string | null;
  order: number;
}
```

### `PaginationMeta`
```typescript
{
  page: number;
  limit: number;
  total: number;
  totalPages: number; // Exactly 0 when total === 0
}
```

### Data Leakage Protections
- **Zero internal IDs**: `id` and `courseId` UUIDs are stripped.
- **Zero operational timestamps**: `createdAt` and `updatedAt` are omitted.
- **Zero internal status flags**: `status` ("DRAFT", "ARCHIVED") is never exposed.
- **Zero quiz data / answer keys**: `quizzes`, `isCorrect`, options, and attempts are excluded.
- **Zero raw Prisma entities**: No raw database objects are returned to controllers or clients.

---

## 4. Repository Queries & Visibility Invariants

All read queries are implemented in `PrismaAcademyCourseRepository` (`apps/api/src/modules/academy/academy.repository.ts`):

1. **Catalog Query (`listPublishedCourses`)**:
   - `where: { status: "PUBLISHED", ...(level ? { level } : {}) }`
   - `orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }]`
   - `include: { _count: { select: { lessons: { where: { status: "PUBLISHED" } } } } }`
   - Concurrently executes query and `count({ where })` via `Promise.all`.

2. **Course Detail Query (`findPublishedCourseBySlug`)**:
   - `where: { slug, status: "PUBLISHED" }`
   - `include: { lessons: { where: { status: "PUBLISHED" }, select: { slug: true, title: true, order: true }, orderBy: [{ order: "asc" }, { title: "asc" }, { id: "asc" }] } }`

3. **Lesson Detail Query (`findPublishedLessonByCourseAndSlug`)**:
   - Single ownership-aware relational join binding:
     - `slug: lessonSlug`
     - `status: "PUBLISHED"`
     - `course: { slug: courseSlug, status: "PUBLISHED" }`
   - Guarantees in a single query that unpublished lessons, unpublished courses, and cross-course lesson mismatches return `null` (mapped to `404 Not Found`).

---

## 5. Pagination & Filtering Semantics

- **Pagination Defaults**: `page = 1`, `limit = 20`, `limit max = 50`.
- **Pagination Calculation**:
  - `skip = (page - 1) * limit`
  - `take = limit`
  - `totalPages = total === 0 ? 0 : Math.ceil(total / limit)`
- **Filtering**: Optional query parameter `level` strictly validates against allowed enum `BEGINNER | INTERMEDIATE | ADVANCED`.
- **Validation**: Managed by Zod schemas in `academy.validation.ts`. Any non-positive page/limit, limit > 50, invalid level, or malformed slug returns `400 Bad Request` with `ERROR_CODES.VALIDATION_ERROR`.

---

## 6. Error Mapping Semantics

| HTTP Status | Error Code | Trigger Condition |
| --- | --- | --- |
| `400 Bad Request` | `VALIDATION_ERROR` | Malformed pagination, query parameters, level filter, or slug format. |
| `401 Unauthorized` | `UNAUTHENTICATED` | Missing Authorization header, non-Bearer token, invalid/expired JWT, or inactive user. |
| `404 Not Found` | `NOT_FOUND` | Nonexistent, DRAFT, or ARCHIVED course; nonexistent, DRAFT, or ARCHIVED lesson; cross-course mismatch. |
| `500 Internal Server Error` | `INTERNAL_ERROR` | Unexpected database or operational failure. Sanitized generic envelope with zero Prisma/PostgreSQL error leak. |

---

## 7. Files Changed and Created

### New Files Created
- [`apps/api/src/modules/academy/academy.dto.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.dto.ts) (DTO interfaces & pure mappers)
- [`apps/api/src/modules/academy/academy.validation.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.validation.ts) (Zod validation schemas)
- [`apps/api/src/modules/academy/academy-course-read.service.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy-course-read.service.ts) (Read service)
- [`apps/api/src/modules/academy/academy-course.controller.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy-course.controller.ts) (HTTP controller)
- [`apps/api/src/modules/academy/academy.routes.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.routes.ts) (Express router)
- [`apps/api/tests/unit/academy-course-read.service.test.ts`](file:///d:/project/ura-capital/apps/api/tests/unit/academy-course-read.service.test.ts) (Service unit tests)
- [`apps/api/tests/unit/academy-dto-validation.test.ts`](file:///d:/project/ura-capital/apps/api/tests/unit/academy-dto-validation.test.ts) (DTO & validation unit tests)
- [`apps/api/tests/integration/academy-routes.test.ts`](file:///d:/project/ura-capital/apps/api/tests/integration/academy-routes.test.ts) (HTTP contract tests)
- [`apps/api/tests/integration/academy-read-db.test.ts`](file:///d:/project/ura-capital/apps/api/tests/integration/academy-read-db.test.ts) (Live PostgreSQL integration tests)
- [`reports/implementation/phase-4/FEAT-020.md`](file:///d:/project/ura-capital/reports/implementation/phase-4/FEAT-020.md) (This implementation report)

### Files Modified
- [`apps/api/src/modules/academy/academy.types.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.types.ts) (Added `ListPublishedCoursesParams`)
- [`apps/api/src/modules/academy/academy.repository.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.repository.ts) (Added read methods to `IAcademyCourseRepository` & `PrismaAcademyCourseRepository`)
- [`apps/api/src/server.ts`](file:///d:/project/ura-capital/apps/api/src/server.ts) (Mounted `academyRouter` in `createApp()`)
- [`apps/api/package.json`](file:///d:/project/ura-capital/apps/api/package.json) (Added tests to `test` and `test:db` scripts)
- [`apps/api/tests/unit/academy-repository.test.ts`](file:///d:/project/ura-capital/apps/api/tests/unit/academy-repository.test.ts) (Added unit tests for new repository methods)
- [`docs/phase-4-feature-decomposition.md`](file:///d:/project/ura-capital/docs/phase-4-feature-decomposition.md) (Governance tracking update)
- [`docs/progress-tracker.md`](file:///d:/project/ura-capital/docs/progress-tracker.md) (Governance tracking update)

---

## 8. Acceptance Criteria Traceability Matrix (AC-001 through AC-016)

| AC ID | Acceptance Criteria Summary | Implementation / Evidence File | Status |
| --- | --- | --- | --- |
| **AC-001** | Scope boundaries respected (courses & lessons read-only; zero mutation; zero UI/quiz/XP) | `academy.routes.ts`, `academy-read-db.test.ts` (AC-001 test) | **PASS** |
| **AC-002** | Zero schema changes / migrations; verified FEAT-019 index existence | `guard:migration`, `academy-read-db.test.ts` (AC-002 index query) | **PASS** |
| **AC-003** | `GET /api/academy/courses` returns published courses with pagination metadata (`totalPages = 0` when `total = 0`) | `academy-course-read.service.ts`, `academy-read-db.test.ts` (AC-003 tests) | **PASS** |
| **AC-004** | Catalog deterministic ordering (`order ASC, title ASC, id ASC`) and level filtering; 400 on invalid query | `academy.repository.ts`, `academy.validation.ts`, `academy-read-db.test.ts` | **PASS** |
| **AC-005** | `GET /api/academy/courses/:slug` returns published course metadata + published lesson outline | `academy.repository.ts`, `academy-read-db.test.ts` (AC-005 test) | **PASS** |
| **AC-006** | Course detail returns 404 for nonexistent, DRAFT, or ARCHIVED courses indistinguishably | `academy-course-read.service.ts`, `academy-read-db.test.ts` (AC-006 tests) | **PASS** |
| **AC-007** | `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` requires valid auth (401 on missing/invalid/expired token) | `academy.routes.ts`, `auth.middleware.ts`, `academy-read-db.test.ts` | **PASS** |
| **AC-008** | Lesson detail returns 200 with full educational content for published lesson | `academy-course-read.service.ts`, `academy-read-db.test.ts` (AC-008 test) | **PASS** |
| **AC-009** | Relational ownership enforcement: cross-course lesson access returns 404 | `academy.repository.ts`, `academy-read-db.test.ts` (AC-009 test) | **PASS** |
| **AC-010** | Lesson detail returns 404 for DRAFT/ARCHIVED lesson or DRAFT/ARCHIVED parent course | `academy.repository.ts`, `academy-read-db.test.ts` (AC-010 tests) | **PASS** |
| **AC-011** | Strict learner DTO whitelist projection: zero leakage of internal IDs, timestamps, status, or quiz data | `academy.dto.ts`, `academy-dto-validation.test.ts`, `academy-read-db.test.ts` | **PASS** |
| **AC-012** | Layered architecture maintained: zero Prisma access in controllers/services (`guard:boundary` PASS) | `scripts/guard-repository-boundary.ts`, `npm run guard:boundary` | **PASS** |
| **AC-013** | Zero Redis state / caching introduced in FEAT-020 (`guard:persistence` PASS) | `tests/unit/persistence-guard.test.ts`, `academy-read-db.test.ts` | **PASS** |
| **AC-014** | Zero product audit records emitted on ordinary read traffic (`guard:audit-governance` PASS) | `scripts/guard-product-audit-governance.ts`, `academy-read-db.test.ts` | **PASS** |
| **AC-015** | Regression suite green across monorepo | Full test pipeline (56 test files / 519 tests, 13 DB files / 113 DB tests) | **PASS** |
| **AC-016** | Implementation report completed | `reports/implementation/phase-4/FEAT-020.md` | **PASS** |

---

## 9. Monorepo Validation Pipeline Evidence

All mandatory validation commands were executed and passed cleanly with zero skips:

```text
1. npm run clean
   -> PASS (clean artifacts removed)

2. npm run lint
   -> PASS (0 errors, 0 warnings across entire monorepo)

3. npx prisma validate --schema=apps/api/prisma/schema.prisma
   -> PASS (The schema at apps/api/prisma/schema.prisma is valid)

4. npm run typecheck
   -> PASS (@aura/shared, @aura/api, @aura/web all clean)

5. npm run build
   -> PASS (all workspaces compiled and built for production)

6. npm run test
   -> PASS (56 test files, 519 tests passed; 0 failed; 0 skipped)
      - @aura/api: 53 test files, 496 passed
      - @aura/web: 2 test files, 3 passed
      - @aura/shared: 1 test file, 20 passed

7. npm run test:unit
   -> PASS (35 test files, 373 unit tests passed; 0 failed; 0 skipped)

8. npm run test:db
   -> PASS (13 live PostgreSQL integration test files, 113 tests passed; 0 failed; 0 skipped)
      - Includes 24 live tests in academy-read-db.test.ts
      - Includes 31 live tests in academy-persistence-db.test.ts

9. npm run test:redis
   -> PASS (5 test files, 50 tests passed; 0 failed; 0 skipped)

10. npm run guard:persistence
    -> PASS (14 tests passed)

11. npm run guard:migration
    -> PASS (4 migrations, 24 review risks, 4 digests, 0 blocking risks)

12. npm run guard:boundary
    -> PASS (controllers=7, services=11, repositories=6, 0 boundary violations)

13. npm run guard:audit-governance
    -> PASS (Zero premature product audit schemas, models, or APIs detected)

14. npm run guard:seed-safety
    -> PASS (Zero unsafe seed scripts or default admin backdoors detected)
```

---

## 10. Governance Invariants Confirmation

1. **Schema Changes**: EXACTLY ZERO (0 schema modifications, 0 migrations created).
2. **Redis Usage**: EXACTLY ZERO (no caching, keys, or connections added).
3. **Product Audit Emission**: EXACTLY ZERO (read endpoints emit zero product audit entries).
4. **FEAT-021 Status**: NOT STARTED (strictly blocked pending FEAT-020 QA closure).
5. **Human Final Gate**: NOT APPROVED (awaiting formal independent QA and Human Gate review).
