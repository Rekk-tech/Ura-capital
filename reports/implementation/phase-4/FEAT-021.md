# FEAT-021 Implementation Report: Academy Learner Course/Lesson UI

**Feature**: FEAT-021 — Academy Learner Course/Lesson UI  
**Phase**: Phase 4 — Academy  
**Implementation Owner**: Antigravity  
**Date**: 2026-09-04  
**Status**: **DONE**  
**QA Status**: **PASS — QA Iteration 2**  
**Human Final Gate**: **APPROVED**  
**FEAT-022**: **UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)**  
**Phase 4 Status**: **IN_PROGRESS**  

---


## 1. Executive Summary

FEAT-021 delivers the learner-facing Academy frontend interface within `apps/web/**`, strictly consuming the approved and frozen FEAT-020 REST API read model contracts (`GET /api/academy/courses`, `GET /api/academy/courses/:slug`, and `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`).

All implementation adheres strictly to the approved FEAT-021 planning and specification package:
- **Zero Backend Changes**: Zero modifications to `apps/api/**`, Prisma schemas, migrations, backend services/controllers/repositories, Redis, or database records.
- **Scope Boundary**: Frontend-only learner catalog, course detail, and lesson detail views. Quizzes, flashcards, progression mutations, XP, rewards, and CMS/authoring remain explicitly excluded and untouched.
- **Dual-Query Lesson Detail Architecture**: Orchestrates Query A (authenticated lesson content) with Query B (public course outline), deriving adjacent array-based navigation and providing fault-tolerant fallback if Query B fails while Query A succeeds.
- **Strict Security & XSS Mitigation**: Implements a defense-in-depth Markdown rendering pipeline using `marked` (with raw HTML tags suppressed via token visitor) and `DOMPurify` as the mandatory final sanitization boundary. Implements strict relative internal redirect path validation preventing open redirect vulnerabilities.
- **Comprehensive Quality Baseline**: 8 test suites containing 86 passing tests in `apps/web` verifying AC-001 through AC-017, plus full green monorepo regression across all 3 workspaces (62 files, 602 tests; unit: 41 files, 456 tests).

---



## 2. Routes & Pages Implemented

| Route Pattern | Component | Description | Access Boundary |
| :--- | :--- | :--- | :--- |
| `/academy` | `CourseCatalogPage` | Responsive course grid (1/2/3 col), level filter, pagination controls, loading skeletons, empty state, error state with retry. | Public |
| `/academy/courses/:courseSlug` | `CourseDetailPage` | Course title, description, level badge, derived lesson count (`course.lessons.length`), ordered lesson outline list. | Public |
| `/academy/courses/:courseSlug/lessons/:lessonSlug` | `LessonDetailPage` | Dual-query view: authenticated lesson content, position indicator, breadcrumb, adjacent previous/next navigation, in-place `AUTH_REQUIRED` card, generic 404 handler. | Authoritative Authenticated |

---

## 3. UI Component Architecture

The feature is built with modular, reusable, accessible components located in `apps/web/src/features/academy/`:

### Components
1. **`CourseCard`** (`components/CourseCard.tsx`):
   - Renders course title, description, level badge (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), lesson count, and call-to-action linking to `/academy/courses/:slug`.
   - Accessible heading structure (`h2`), keyboard-navigable card layout, clear hover states.

2. **`LevelFilter`** (`components/LevelFilter.tsx`):
   - Accessible filter toolbar with `role="group"` and `aria-label="Filter courses by difficulty level"`.
   - Filter buttons for All, Beginner, Intermediate, and Advanced with active states indicated by both visual tokens and `aria-pressed`.

3. **`PaginationControls`** (`components/PaginationControls.tsx`):
   - Accessible pagination bar with `role="navigation"` and `aria-label="Pagination Navigation"`.
   - Bounded Previous/Next buttons disabling at boundaries (`page <= 1` and `page >= totalPages`), live page indicator (`aria-current="page"`).

4. **`LessonOutlineList`** (`components/LessonOutlineList.tsx`):
   - Numbered vertical outline list rendering lesson order, title, and link to `/academy/courses/:courseSlug/lessons/:lessonSlug`.
   - Semantic `<ol>` list structure with accessible link labels.

5. **`LessonContent`** (`components/LessonContent.tsx`):
   - Centered reading column constrained to $\le 720\text{px}$ readable width.
   - Renders educational HTML produced exclusively through the sanitized Markdown pipeline.

6. **`AcademyStates`** (`components/AcademyStates.tsx`):
   - **`CatalogGridSkeleton` & `LessonDetailSkeleton`**: Smooth animated skeletons with `aria-busy="true"` and `role="status"`.
   - **`EmptyState`**: Empty catalog message with filter reset action.
   - **`ErrorState`**: Error banner with `role="alert"` and retry button.
   - **`NotFoundState`**: Safe 404 message without internal status leakage, providing a safe link back to the catalog or course outline.
   - **`AuthRequiredCard`**: In-place authentication card offering Login and Register links parameterized with a validated internal `returnUrl`.

---

## 4. API Client & TanStack Query Architecture

### API Client (`apps/web/src/api/academy.api.ts`)
- Implements `AcademyApiClient` consuming pure REST contracts:
  - `listCourses(params)`: `GET /api/academy/courses?page=&limit=&level=`
  - `getCourseBySlug(slug)`: `GET /api/academy/courses/:slug`
  - `getLessonBySlug(courseSlug, lessonSlug, accessToken)`: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`
- Standardizes all network, HTTP, and domain errors into `AcademyApiError` instances containing HTTP status code, API error code (`UNAUTHENTICATED`, `NOT_FOUND`, `VALIDATION_ERROR`), and sanitized message.

### TanStack Query Hooks (`apps/web/src/features/academy/hooks/use-academy.ts`)
- **`useCoursesQuery(params)`**: Caches catalog results with 5-minute `staleTime`.
- **`useCourseQuery(slug)`**: Caches course detail and outline with 5-minute `staleTime`.
- **`useLessonQuery(courseSlug, lessonSlug, accessToken)`**:
  - Caches authenticated lesson content with 2-minute `staleTime`.
  - Non-retry policy on 401 (`UNAUTHENTICATED`) and 404 (`NOT_FOUND`) errors to immediately trigger appropriate UI states without UI thrashing or infinite loops.

---

## 5. Dual-Query Lesson Strategy & Failure Semantics

The lesson view (`LessonDetailPage.tsx`) orchestrates two queries to satisfy the UI requirements without requesting backend DTO modifications:
- **Query A (Authoritative)**: `useLessonQuery(courseSlug, lessonSlug)` provides lesson title, content, order, and courseSlug.
- **Query B (Auxiliary)**: `useCourseQuery(courseSlug)` provides course title and ordered lesson list for breadcrumb and adjacent navigation.

### Failure Handling Matrix
| Scenario | Query A (Lesson) | Query B (Course Outline) | UI Presentation & Behavior |
| :--- | :--- | :--- | :--- |
| **Normal Success** | 200 OK | 200 OK | Lesson content rendered; breadcrumb displays course title; lesson position badge (`Lesson X of Y`) displayed; Prev/Next buttons derive adjacent links. |
| **Auth Required** | 401 Unauthorized | Any | In-place `AuthRequiredCard` displayed with login/register links and safe internal return path. |
| **Lesson Not Found** | 404 Not Found | Any | Generic `NotFoundState` ("Lesson Unavailable") displayed without revealing draft/archived status. |
| **Lesson Server Error** | 500 / Network Err | Any | `ErrorState` with retry button triggering `lessonQuery.refetch()`. |
| **Outline Query Failure** | 200 OK | 500 / Network Err | **Fault-tolerant fallback**: Lesson content remains fully visible; breadcrumb falls back to generic "Course" label; lesson position badge and Prev/Next buttons are gracefully hidden; view does not crash. |

### Adjacent Navigation Derivation
Previous and Next navigation links are derived strictly by finding the current lesson's index within `course.lessons` ordered array:
```typescript
const currentIndex = course.lessons.findIndex((l) => l.slug === lessonSlug);
const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
const nextLesson = currentIndex >= 0 && currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;
```
Numeric arithmetic on `order` (e.g., `order - 1` or `order + 1`) is strictly avoided, ensuring resilient navigation even if backend lesson orders are non-contiguous (e.g. 10, 20, 30).

## 6. Markdown Parser & Mandatory Sanitization Boundary

### Pipeline Architecture (`apps/web/src/features/academy/utils/markdown-sanitizer.ts`)
```
Lesson Markdown String
        │
        ▼
[ marked Parser ]
   - Token walker: Raw HTML suppression (<script>, <iframe>, <form>, etc. treated as empty)
   - Token walker: Heading normalization (# -> h2, ## -> h3, ### -> h4, #### -> h5, ##### -> h6, ###### -> h6, clamped at h6)
        │
        ▼
Intermediate HTML String (Markdown headings normalized strictly below page <h1>)
        │
        ▼
[ DOMPurify Sanitizer ] (Mandatory Final Security Boundary)
   - Strict Tag Allowlist: h2-h6, p, b, i, strong, em, strike, code, pre, ul, ol, li, blockquote, hr, table, thead, tbody, tr, th, td, span, a, br (h1 strictly excluded)
   - Strict Attribute Allowlist: href, title, target, rel
   - External Link Defense: Automatically enforces rel="noopener noreferrer" on target="_blank"
   - Neutralization: Strips javascript:, data:, vbscript: protocols, inline event handlers, svg, and math vectors
        │
        ▼
Safe Sanitized HTML String (Guaranteed zero <h1> elements from Markdown; page lesson title remains the only <h1>)
        │
        ▼
Rendered into isolated container via dangerouslySetInnerHTML
```

---

## 7. Open Redirect Mitigation (`redirect-validator.ts`)

To protect learner authentication flows from open redirect attacks:
- `isValidInternalRedirect(path)` strictly enforces that return URLs are relative paths starting with exactly one `/`, not beginning with `//` or `/\`, containing no backslashes, control characters, encoded slashes/backslashes (`%2f`, `%5c`), encoded control characters, or protocol schemes (`http:`, `javascript:`).
- Bounded safe decoding (maximum 2 rounds via `decodeURIComponent`) protects against single and double encoding evasion; malformed percent sequences are rejected immediately.
- Validates candidate resolution relative to a synthetic internal trusted origin (`new URL(candidate, "http://localhost.localdomain")`), asserting `resolved.origin === "http://localhost.localdomain"` and pathname begins with `/`.
- Absolute URLs (`https://evil.example`), protocol-relative URLs (`//evil.example`), and malformed schemes are discarded and safely resolved to `/academy`.
- `buildAuthRedirectUrl(authPath, returnPath)` encodes only the already validated internal return URL (`?redirect=...`), falling back safely to `/academy` whenever validation fails.

---

## 8. Dependencies Installed

1. **`react-router-dom`** (`^7.18.3`): Client-side routing for `/academy`, `/academy/courses/:courseSlug`, and `/academy/courses/:courseSlug/lessons/:lessonSlug`.
2. **`dompurify`** (`^3.4.14`): Mandatory final HTML sanitization boundary. Ships native TypeScript declarations (`./dist/purify.cjs.d.ts`), avoiding external typing packages.
3. **`marked`** (`^15.0.12`): Controlled Markdown parser with AST token visitation hooks. Ships native TypeScript declarations (`./lib/marked.d.ts`).

---

## 9. Responsive & Accessibility Baseline

### Responsive Design
- **Grid Layout**: Responsive CSS Grid adapting from 1 column on mobile screens ($<640\text{px}$), 2 columns on tablet screens ($640\text{px} - 1023\text{px}$), to 3 columns on desktop screens ($\ge 1024\text{px}$).
- **Readable Content Column**: Centered reading column max width of $720\text{px}$ with optimal line-height and typography scale.
- **Overflow Prevention**: Strict box-sizing, word break rules, and zero horizontal scrollbar overflow.

### Accessibility Standards
- **Heading Hierarchy**: Exactly one `h1` per page view:
  - Root: App Title (`Aura Capital`)
  - Catalog: `Academy Courses`
  - Course Detail: `{course.title}`
  - Lesson Detail: `{lesson.title}` (Markdown headings strictly normalized to `h2`–`h6`, clamped at `h6`)
- **Accessible Names**: All buttons, links, search/filter controls, and pagination have explicit accessible text or `aria-label`.
- **Keyboard Navigation**: Full tab navigation support with visible high-contrast focus rings (`outline: 2px solid var(--primary)`).
- **Status & Alerts**: Dynamic loading states announce via `aria-busy="true"` and `role="status"`. Error states announce via `role="alert"`.
- **Color Independence**: Badges and status pills pair colors with text labels, icons, and distinct borders.

---

## 10. Verification of Acceptance Criteria (AC-001..AC-017)

All acceptance criteria mappings strictly align with the canonical definition in `.specify/specs/FEAT-021/acceptance.md`:

| Criterion | Description | Test File / Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **AC-001** | **Scope Integrity**: Isolated to frontend UI in `apps/web`; zero changes to `apps/api`, Prisma, migrations, or database; zero quiz/flashcard/progress/CMS | `git status`, source diff, `npm run guard:boundary` | **PASS** |
| **AC-002** | **Contract Fidelity**: Frontend API client consumes approved FEAT-020 endpoints with exact DTO mapping; zero invented endpoints | `academy.api.test.ts`, DTO contract validation | **PASS** |
| **AC-003** | **Course Catalog Screen**: Published course cards in responsive grid (1 col mobile, 2 col tablet, 3 col desktop) with title, description, level badge, lessonCount, and action link | `CourseCatalogPage.test.tsx`, `index.css` | **PASS** |
| **AC-004** | **Level Filtering & Pagination**: Interactive level filter (`All`, `Beginner`, `Intermediate`, `Advanced`), bounded pagination, page reset on filter change | `CourseCatalogPage.test.tsx` | **PASS** |
| **AC-005** | **Course Detail & Syllabus Outline**: Course metadata, derived lesson count (`course.lessons.length`), numbered vertical outline with order badges and titles | `CourseDetailPage.test.tsx` | **PASS** |
| **AC-006** | **Course 404 Indistinguishability**: Generic "Course Unavailable" message without leaking DRAFT, ARCHIVED, or nonexistent status | `CourseDetailPage.test.tsx` | **PASS** |
| **AC-007** | **Lesson Detail Authenticated View**: Displays lesson educational title, breadcrumbs, and content for authenticated learners via dual-query orchestration | `LessonDetailPage.test.tsx` | **PASS** |
| **AC-008** | **Lesson 401 Auth-Required Handling**: In-place `AUTH_REQUIRED` card rendering with Sign In / Register links preserving validated internal redirect URL | `LessonDetailPage.test.tsx` | **PASS** |
| **AC-009** | **Lesson 404 Indistinguishability**: Generic "Lesson Unavailable" message on 404 responses without internal status leakage | `LessonDetailPage.test.tsx` | **PASS** |
| **AC-010** | **Intra-Course Lesson Navigation & Outline Fallback**: Adjacent array navigation with non-contiguous orders; fault-tolerant fallback if outline query fails | `LessonDetailPage.test.tsx` | **PASS** |
| **AC-011** | **XSS Mitigation & Sanitized Rendering Boundary**: DOMPurify mandatory final boundary, raw HTML suppression, external link rel="noopener noreferrer", rejection of concrete payloads | `markdown-sanitizer.test.ts` (17 tests) | **PASS** |
| **AC-012** | **Zero Sensitive DTO Leakage**: Strictly renders safe learner fields; internal UUIDs, timestamps, status values, quiz data, and backend error details are never displayed | Component DOM inspection tests | **PASS** |
| **AC-013** | **Explicit Async UI States**: Catalog (`LOADING`, `SUCCESS`, `EMPTY`, `ERROR`), Course Detail (`LOADING`, `SUCCESS`, `NOT_FOUND`, `ERROR`), Lesson Detail (`LOADING`, `SUCCESS`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR`) | `CourseCatalogPage.test.tsx`, `CourseDetailPage.test.tsx`, `LessonDetailPage.test.tsx` | **PASS** |
| **AC-014** | **FEAT-021 Accessibility Baseline**: Semantic heading hierarchy (single `<h1>` per view), visible focus indicators, full keyboard operability, live regions, color independence | `LessonDetailPage.test.tsx`, `App.test.tsx`, component test suites | **PASS (Remediated in Rework 1: DEF-021-02)** |
| **AC-015** | **Responsive Baseline**: Mobile (<640px 1-col), tablet (640-1023px 2-col), desktop ($\ge 1024px$ 3-col), max 720px reading column, zero horizontal overflow | Responsive viewport tests, CSS rules | **PASS** |
| **AC-016** | **Monorepo Regression**: Full monorepo validation suite (clean, lint, typecheck, build, test, test:unit, test:db, test:redis, and all 5 guards) passes cleanly | 14 monorepo validation scripts green | **PASS** |
| **AC-017** | **Safe Internal Redirect & Open-Redirect Immunity**: Preserved return URL in `AUTH_REQUIRED` card strictly validated as internal relative path; external, protocol-relative, encoded, and dangerous schemes sanitized to `/academy` | `redirect-validator.test.ts` (44 tests) | **PASS (Remediated in Rework 1: DEF-021-01)** |

---

## 11. Monorepo Validation Suite Execution Evidence

| Validation Command | Status | Executed Scope | Notes / Results |
| :--- | :---: | :--- | :--- |
| `npm run clean` | **PASS** | Monorepo-wide | Cleaned dist folders across packages/shared, apps/api, apps/web |
| `npm run lint` | **PASS** | Monorepo-wide | 0 errors, 0 warnings across all files |
| `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Backend schema | Prisma schema validated successfully |
| `npm run typecheck` | **PASS** | Monorepo-wide | `tsc --noEmit` passed across @aura/shared, @aura/api, @aura/web |
| `npm run build` | **PASS** | Monorepo-wide | Shared tsc, API tsc, and Web Vite bundle built in 6.80s |
| `npm run test` (standard) | **PASS** | **62 files / 602 tests** | API: 53/496, Web: 8/86, Shared: 1/20. 0 failures, 0 skips |
| `npm run test:unit` | **PASS** | **41 files / 456 tests** | API: 33/351, Web: 7/85, Shared: 1/20. 0 failures |
| `npm run test:db` (PostgreSQL) | **PASS** | **13 files / 113 tests** | Full live PostgreSQL integration suite passes |
| `npm run test:redis` (Redis) | **PASS** | **5 files / 50 tests** | Live Redis rate-limit and readiness suite passes |
| `npm run guard:persistence` | **PASS** | 1 file / 14 tests | Persistence boundary integrity verified |
| `npm run guard:migration` | **PASS** | 4 migrations | Exactly 4 migrations; 24 review risks; 0 blocking risks |
| `npm run guard:boundary` | **PASS** | Static AST guard | controllers=7, services=11, repositories=6 |
| `npm run guard:audit-governance` | **PASS** | Static AST guard | Zero premature product audit schemas, models, or APIs |
| `npm run guard:seed-safety` | **PASS** | Static AST guard | Zero unsafe seed scripts or admin backdoors |

---

## 12. Files Changed & Scope Verification

### Modified Files
- `apps/web/package.json` (installed `react-router-dom`, `dompurify`, `marked`)
- `apps/web/src/app/App.tsx` (integrated Academy routing, Header navigation, and single `h1` per view logic)
- `apps/web/src/index.css` (added responsive grid, outline list, markdown typography, and state styling)
- `package-lock.json`
- `docs/phase-4-feature-decomposition.md`
- `docs/progress-tracker.md`

### Newly Created Files
- `.specify/specs/FEAT-021/spec.md`, `plan.md`, `tasks.md`, `acceptance.md`
- `apps/web/src/api/academy.api.ts` & `apps/web/src/api/academy.api.test.ts`
- `apps/web/src/app/router/academy-routes.tsx`
- `apps/web/src/features/academy/types/academy-ui.types.ts`
- `apps/web/src/features/academy/utils/redirect-validator.ts` & `redirect-validator.test.ts`
- `apps/web/src/features/academy/utils/markdown-sanitizer.ts` & `markdown-sanitizer.test.ts`
- `apps/web/src/features/academy/hooks/use-academy.ts`
- `apps/web/src/features/academy/components/AcademyStates.tsx`
- `apps/web/src/features/academy/components/CourseCard.tsx`
- `apps/web/src/features/academy/components/LevelFilter.tsx`
- `apps/web/src/features/academy/components/PaginationControls.tsx`
- `apps/web/src/features/academy/components/LessonOutlineList.tsx`
- `apps/web/src/features/academy/components/LessonContent.tsx`
- `apps/web/src/features/academy/pages/CourseCatalogPage.tsx` & `CourseCatalogPage.test.tsx`
- `apps/web/src/features/academy/pages/CourseDetailPage.tsx` & `CourseDetailPage.test.tsx`
- `apps/web/src/features/academy/pages/LessonDetailPage.tsx` & `LessonDetailPage.test.tsx`

### Scope Confirmations
- **Zero Backend Changes**: `git diff HEAD -- apps/api` returned completely empty.
- **Zero Database / Migration Changes**: No changes to `prisma/schema.prisma` or migration files.
- **Zero Redis State Added**: Pure read model consumer on the frontend.
- **FEAT-022 Not Started**: Quiz attempt, evaluation, and progression features remain untouched.

---

## 13. Governance Status

In accordance with `docs/AGENT_WORKFLOW.md` and the governance rules:
- **FEAT-021**: `DONE`
- **QA Verdict**: `PASS — QA Iteration 2`
- **Human Final Gate**: `APPROVED`
- **FEAT-022**: `UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)`
- **Phase 4**: `IN_PROGRESS`

---

## 14. Rework Iteration 1 (DEF-021-01 & DEF-021-02 Remediation)

Following QA Iteration 1 verdict (`FAIL`), Rework Iteration 1 addressed exclusively the two reported defects without expanding scope or touching backend systems:

### DEF-021-01: Open Redirect Hardening — **FIXED**

- **Affected Canonical AC**: **AC-017** (Safe Internal Redirect & Open-Redirect Immunity)
- **Also Verified Against**: **AC-008** (Lesson 401 Auth-Required Handling return URL parameter)
- **Root Cause**: The initial redirect path validator checked prefix and character conditions on the raw input string without decoding percent-encoded bypasses (e.g. `/%5C%5Cevil.example`, `/%2F%2Fevil.example`) or validating URL origin resolution against a trusted domain.

- **Implementation Remediations** (`apps/web/src/features/academy/utils/redirect-validator.ts`):
  1. **Immediate Control Character Rejection**: Uses `[\x00-\x1f\x7f]` to immediately reject raw control characters (newlines `\n`, carriage returns `\r`, tabs `\t`, null bytes `\x00`).
  2. **Bounded Safe Decoding Strategy**: Performs bounded decoding up to a maximum of 2 rounds via `decodeURIComponent`. If decoding throws `URIError` (malformed percent sequences like `/%` or `/%2`), input is rejected immediately.
  3. **Strict Invariant Enforcement**: At every decoding round, verifies that the string:
     - Begins with a single `/` and does not begin with `//` or `/\`.
     - Contains no backslashes (`\`).
     - Contains no encoded slashes (`%2f`) or encoded backslashes (`%5c`).
     - Contains no encoded control characters.
     - Contains no URI scheme pattern (`^[a-zA-Z][a-zA-Z0-9+.-]*:`).
  4. **Synthetic Trusted Origin Resolution**: Validates candidate resolution via `new URL(normalized, "http://localhost.localdomain")`, ensuring `resolved.origin === "http://localhost.localdomain"` and pathname begins with `/`.
  5. **Deterministic Auth URL Construction**: `buildAuthRedirectUrl` validates candidate internally first, falling back to `/academy` if invalid, before performing query parameter URI encoding.
- **Regression Test Coverage** (`apps/web/src/features/academy/utils/redirect-validator.test.ts`):
  - 44 tests covering positive internal routes (`/academy`, `/academy/courses/foo`, `/academy/courses/foo/lessons/bar`, `/academy?page=2`) and negative vectors:
    - Absolute URLs (`https://evil.example`, `http://evil.example`, `ftp://evil.example`).
    - Protocol-relative URLs (`//evil.example`, `/\evil.example`, `\\evil.example`, `\\\\evil.example`).
    - Dangerous schemes (`javascript:alert(1)`, `data:text/html,...`, `vbscript:evil`).
    - Encoded slash/backslash attacks (`/%5C%5Cevil.example`, `/%2F%2Fevil.example`, `/%252F%252Fevil.example`, `/%255C%255Cevil.example`, mixed encoded/decoded).
    - Control characters and CRLF injection (`/path\nnewline`, `/path\rreturn`, `/path\r\nheader`, `/path\x00null`, `/path\tvalue`).
    - Whitespace attack forms (leading/trailing spaces, tabs, newlines).
    - Malformed percent encodings (`/%`, `/%2`, `/%E0%A4%A`).
  - Verifies both `isValidInternalRedirect(...) === false` and `buildAuthRedirectUrl(...)` safely returning `/login?redirect=%2Facademy` or `/register?redirect=%2Facademy`.

### DEF-021-02: Heading Hierarchy Normalization — **FIXED**

- **Affected Canonical AC**: **AC-014** (FEAT-021 Accessibility Baseline — single `<h1>` per view)
- **Root Cause**: Lesson educational Markdown rendered `# Heading` as `<h1>`, causing `LessonDetailPage` to have multiple `<h1>` elements in the DOM (the page-level lesson title and the Markdown heading), violating WCAG single-h1 hierarchy.

- **Implementation Remediations** (`apps/web/src/features/academy/utils/markdown-sanitizer.ts`):
  1. **Parser-Level Heading Shift**: In `markedInstance` token visitor (`walkTokens`), all heading tokens have depth normalized down by 1 (`token.depth = Math.min(6, token.depth + 1)`).
     - `# Heading` $\to$ `<h2>`
     - `## Heading` $\to$ `<h3>`
     - `### Heading` $\to$ `<h4>`
     - `#### Heading` $\to$ `<h5>`
     - `##### Heading` $\to$ `<h6>`
     - `###### Heading` $\to$ `<h6>` (clamped at `<h6>`).
  2. **Sanitization Boundary Enforcement**: Removed `"h1"` from `PURIFY_CONFIG.ALLOWED_TAGS`. DOMPurify permits only `["h2", "h3", "h4", "h5", "h6", "p", ...]`. Even if raw HTML contains `<h1>`, it is stripped by DOMPurify.
- **Regression Test Coverage**:
  - `markdown-sanitizer.test.ts` (17 tests): Verifies `#` shifts to `<h2>`, `##` to `<h3>`, `######` clamps at `<h6>`, raw HTML `<h1>` is stripped, and all XSS attack vectors (`<script>`, inline event handlers, `javascript:`, `data:`, `vbscript:`, `<iframe>`, `<form>`, `<style>`, `<svg onload>`, `<math>`, malformed tags) remain strictly neutralized.
  - `LessonDetailPage.test.tsx` (7 tests): Critical assertion `document.querySelectorAll("h1").length === 1` passes when lesson content begins with `# Markdown Heading`, confirming page title is the only `<h1>` in the document.

### GAP-021-01: Client-Side Logout Query Cache Invalidation — **PRESERVED**

- **Status**: **OPEN / NON-BLOCKING EVIDENCE GAP**
- **Rationale**: The FEAT-021 approved specification is strictly limited to the learner-facing Course Catalog, Course Detail, and Lesson Detail UI (`apps/web/src/features/academy/**`). A client-side session management / logout handler does not exist in the current frontend scope. Fabricating logout architecture would violate strict scope boundaries. GAP-021-01 is preserved as non-blocking for FEAT-021 and will be addressed when frontend session state management is formally decomposed.

### Scope & Monorepo Validation Summary

- **Backend / Database State**: Zero modifications to `apps/api/**`, Prisma schema, migrations, Redis, or backend tests.
- **Next Feature State**: **FEAT-022 UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)**.
- **Monorepo Validation (14/14 commands passing)**:
  - `npm run clean`: PASS
  - `npm run lint`: PASS (0 errors, 0 warnings)
  - `npx prisma validate --schema=apps/api/prisma/schema.prisma`: PASS
  - `npm run typecheck`: PASS
  - `npm run build`: PASS
  - `npm run test`: PASS (62 files, 602 tests)
  - `npm run test:unit`: PASS (41 files, 456 tests)
  - `npm run test:db`: PASS (13 files, 113 tests)
  - `npm run test:redis`: PASS (5 files, 50 tests)
  - `npm run guard:persistence`: PASS (14 tests)
  - `npm run guard:migration`: PASS (4 migrations, 24 review risks)
  - `npm run guard:boundary`: PASS (controllers=7, services=11, repositories=6)
  - `npm run guard:audit-governance`: PASS (zero premature product audit)
  - `npm run guard:seed-safety`: PASS (zero unsafe seed scripts)

