# Acceptance Criteria: FEAT-020 Course & Lesson Read Model APIs

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-020  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  

---

## 1. Acceptance Matrix

| AC | Criterion | Verification Method |
| --- | --- | --- |
| **AC-001** | FEAT-020 scope is strictly limited to read-only course and lesson endpoints. Zero UI, flashcard review, quiz projection, progress mutation, XP reward granting, or CMS authoring is introduced. | Route & source review; boundary inspection |
| **AC-002** | Zero database schema changes, migrations, or DDL adjustments. All queries build upon approved FEAT-019 persistence schema without altering tables, indexes, or constraints. | `git status` on `prisma/` and `npm run guard:migration` |
| **AC-003** | `GET /api/academy/courses` returns a paginated list of courses with status `PUBLISHED` filtered directly at the database query level. Non-published courses (`DRAFT`, `ARCHIVED`) are strictly omitted. Response includes pagination metadata (`page`, `limit`, `total`, `totalPages`), where `totalPages = 0` when `total = 0`. | HTTP integration & live DB tests |
| **AC-004** | `GET /api/academy/courses` supports deterministic ordering (`order ASC, title ASC, id ASC`) and optional `level` filtering (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`). Unsupported query values return `400 Bad Request`. | Unit & integration tests |
| **AC-005** | `GET /api/academy/courses/:slug` returns metadata for a published course and an ordered array of its published lesson summaries (`slug`, `title`, `order`). Unpublished lessons are excluded by the database query. | HTTP integration tests |
| **AC-006** | `GET /api/academy/courses/:slug` returns standard `404 Not Found` if the requested course does not exist, is in `DRAFT`, or is `ARCHIVED` (indistinguishable response). | HTTP integration tests |
| **AC-007** | `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` requires valid access token authentication (`authenticate` middleware). Missing, invalid, or expired tokens return `401 Unauthorized`. Valid authenticated learner identity is sufficient without role checks. | Auth middleware integration tests |
| **AC-008** | `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` returns `200 OK` with full lesson content (`content`) when both course and lesson are `PUBLISHED` and the lesson belongs to the specified course. | HTTP integration tests |
| **AC-009** | `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` returns `404 Not Found` if the requested lesson belongs to a different course (`lesson.courseId !== course.id`), preventing cross-course URL spoofing. | Negative security integration tests |
| **AC-010** | `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` returns `404 Not Found` if either the parent course or the lesson is in `DRAFT` or `ARCHIVED` status. | Negative security integration tests |
| **AC-011** | Minimized safe learner DTO projection: Responses use strict whitelisted DTOs (`CourseSummaryDto`, `CourseDetailDto`, `LessonSummaryDto`, `LessonDetailDto`). Responses strictly exclude internal UUID IDs (`id`, `courseId`), timestamps (`createdAt`, `updatedAt`), quiz answers, or raw database errors. | Response serialization & contract tests |
| **AC-012** | Architectural layering is preserved: Controller calls Service, Service calls Repository, Repository queries PostgreSQL. Zero direct `@prisma/client` imports in controllers or services. | `npm run guard:boundary` |
| **AC-013** | Redis transient-only boundary is maintained: Redis is strictly unused in FEAT-020 read models (no durable state, no unapproved caching). | `npm run guard:persistence` & source review |
| **AC-014** | Product audit governance is preserved: Ordinary read operations do not emit product audit records. | `npm run guard:audit-governance` |
| **AC-015** | Regression validation: Full monorepo validation suite (clean, lint, typecheck, build, test, test:unit, test:db, test:redis, and all 5 guards) passes with zero regressions. | Full validation script execution |
| **AC-016** | Comprehensive implementation report is produced at `reports/implementation/phase-4/FEAT-020.md` detailing architecture, test metrics, and AC-001..AC-016 mappings. | Report inspection |

---

## 2. PASS Requirements

FEAT-020 may receive QA PASS only when:
1. AC-001 through AC-016 pass with zero exceptions.
2. All unit, integration, and live database tests pass.
3. No DRAFT or ARCHIVED content is accessible via any learner route.
4. Cross-course lesson URL access returns 404.
5. All 5 governance guards (`persistence`, `migration`, `boundary`, `audit-governance`, `seed-safety`) remain green.
6. Zero P0 or P1 security or data-leakage defects exist.

---

## 3. FAIL Conditions

The feature must be flagged as FAIL if:
- Any `DRAFT` or `ARCHIVED` course or lesson is exposed to a learner.
- A lesson belonging to Course A can be accessed under `/courses/course-b/lessons/...`.
- Raw Prisma entity objects, internal UUIDs, or timestamps are returned to the client.
- The lesson endpoint is accessible without authentication.
- Any controller or ordinary service imports `@prisma/client` directly.
- Schema migrations or DDL changes are introduced.
- Redis is used as durable storage or unapproved cache for Academy content.
- Monorepo regression tests or governance guards fail.
