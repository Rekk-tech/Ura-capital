# Acceptance Criteria: FEAT-021 Academy Learner Course/Lesson UI

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-021  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human UX Planning Decisions**: APPROVED  
**Implementation Agent**: Pending Human Approval  
**QA Owner**: Codex (with Human Governance)  

---

## 1. Acceptance Matrix

| AC | Criterion | Verification Method |
| :--- | :--- | :--- |
| **AC-001** | **Scope Integrity**: Implementation is strictly isolated to frontend UI in `apps/web`. Zero changes to `apps/api`, Prisma schema, migrations, or database. Zero quiz, flashcard, progress tracking, XP rewards, or CMS authoring logic. | `git status`, source diff, and `npm run guard:boundary` |
| **AC-002** | **Contract Fidelity**: Frontend API client consumes approved FEAT-020 endpoints (`GET /api/academy/courses`, `GET /api/academy/courses/:slug`, `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`) with exact DTO mapping. Zero invented backend endpoints. | Client unit tests & contract validation |
| **AC-003** | **Course Catalog Screen**: Displays published course cards in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop) with `title`, `description`, `level` badge, published `lessonCount`, and action linking to `/academy/courses/:slug`. | Component & visual tests |
| **AC-004** | **Level Filtering & Pagination**: Catalog supports interactive level filtering (`All`, `Beginner`, `Intermediate`, `Advanced`) and bounded pagination controls (`Previous`, `Next`, page indicators). Filter change resets page to 1. | Component state & interaction tests |
| **AC-005** | **Course Detail & Syllabus Outline**: Displays course metadata (title, description, level badge, derived `lessonCount = course.lessons.length`) and a numbered vertical outline of published lessons with order badges, lesson titles, and read links. | Component & integration tests |
| **AC-006** | **Course 404 Indistinguishability**: Course detail view handles 404 responses with a generic "Course Unavailable" message without revealing whether the course is DRAFT, ARCHIVED, or nonexistent. | Negative mock tests |
| **AC-007** | **Lesson Detail Authenticated View**: Displays lesson educational title, breadcrumbs, and content for authenticated learners via dual-query orchestration (`useLessonQuery` + `useCourseQuery`). | Authenticated integration tests |
| **AC-008** | **Lesson 401 Auth-Required Handling**: Lesson detail view handles 401 response by rendering an in-place `AUTH_REQUIRED` card with Sign In / Register links preserving the current relative redirect URL. | Unauthenticated probe tests |
| **AC-009** | **Lesson 404 Indistinguishability**: Lesson detail view displays a generic "Lesson Unavailable" message on 404 responses (nonexistent, draft/archived parent or lesson, cross-course mismatch). | Negative integration tests |
| **AC-010** | **Intra-Course Lesson Navigation & Outline Fallback**: Lesson detail derives "Previous" and "Next" lesson controls from adjacent array elements in `CourseDetailDto.lessons` (never numeric `order - 1` / `order + 1`). If course outline query fails or is loading while lesson query succeeds, lesson content renders safely, breadcrumb falls back to "Course", and adjacent controls are omitted without raising a fatal error. | Navigation unit tests with non-contiguous orders & failure mocks |
| **AC-011** | **XSS Mitigation & Sanitized Rendering Boundary**: DOMPurify serves as the mandatory final sanitization boundary before DOM insertion, with Markdown parser raw-HTML suppression providing defense-in-depth only. Unsanitized `dangerouslySetInnerHTML` is strictly PROHIBITED. Rejection tests prove neutralization against concrete attack vectors: `<script>`, inline event handlers (`onload`, `onerror`, `onclick`), `javascript:` URLs, `data:` URLs, `iframe`, `form`, `style` injection, malformed nested HTML, and Markdown links with unsafe protocols. External links receive `rel="noopener noreferrer"`. | Security XSS injection test suite across all specified attack vectors |
| **AC-012** | **Zero Sensitive DTO Leakage**: UI components strictly render safe learner DTO fields; internal UUID IDs, timestamps, status values, quiz data, and backend error details are never displayed. | Component DOM inspection tests |
| **AC-013** | **Explicit Async UI States**: Course Catalog implements `LOADING`, `SUCCESS`, `EMPTY`, `ERROR`. Course Detail implements `LOADING`, `SUCCESS`, `NOT_FOUND`, `ERROR`. Lesson Detail implements `LOADING`, `SUCCESS`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR`. | Async state unit tests |
| **AC-014** | **FEAT-021 Accessibility Baseline**: Semantic heading hierarchy (single `<h1>` per view), visible focus indicators (`outline: 2px solid var(--primary)`), full keyboard operability, screen reader live regions (`aria-busy="true"`, `role="alert"`), and color independence. | Accessibility unit & keyboard tests |
| **AC-015** | **Responsive Baseline**: Layout adapts cleanly across mobile (<640px, 1-col), tablet (640-1023px, 2-col), and desktop ($\ge 1024px$, 3-col) with zero horizontal overflow. | Viewport responsive tests |
| **AC-016** | **Monorepo Regression**: Full monorepo validation suite (`clean`, `lint`, `typecheck`, `build`, `test`, `test:unit`, `test:db`, `test:redis`, and all 5 guards) passes cleanly with zero backend regressions. | Full validation script execution |
| **AC-017** | **Safe Internal Redirect & Open-Redirect Immunity**: Preserved return URL in `AUTH_REQUIRED` card is strictly validated as an internal relative path; external URLs (`https://evil.com`), protocol-relative URLs (`//evil.com`), and protocol schemes (`javascript:`) are rejected and sanitized to `/academy`. | Open-redirect unit tests |

---

## 2. PASS Requirements

FEAT-021 may receive QA PASS only when:
1. AC-001 through AC-017 pass with zero exceptions.
2. All frontend unit and component tests in `apps/web` pass cleanly.
3. Zero backend files (`apps/api/**`, `prisma/**`) are modified.
4. Lesson content rendering is proven resilient against XSS test payloads.
5. All 5 governance guards (`persistence`, `migration`, `boundary`, `audit-governance`, `seed-safety`) remain green.
6. Zero P0 or P1 security, accessibility, or visual overflow defects exist.

---

## 3. FAIL Conditions

The feature must be flagged as FAIL if:
- Any modification is made to `apps/api/`, Prisma schema, or PostgreSQL migrations.
- Educational markdown content is rendered via unsanitized `dangerouslySetInnerHTML` or executes arbitrary JavaScript.
- An unauthenticated visitor can view lesson educational content.
- Draft or archived course/lesson status is revealed to learners via UI error text.
- Navigation assumes contiguous numeric orders (`order - 1`/`order + 1`) and breaks on non-contiguous lesson sequences.
- An external or open redirect can be injected into the auth redirection flow.
- Navigation or pagination controls cannot be operated via keyboard.
- Horizontal scrolling occurs on standard mobile viewports ($375px$, $414px$).
- Monorepo regression tests or governance guards fail.
