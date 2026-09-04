# Implementation Plan: FEAT-021 Academy Learner Course/Lesson UI

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-021  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human UX Planning Decisions**: APPROVED  
**Implementation Agent**: Pending Human Approval  

---

## 1. Technical Approach & Design Principles

FEAT-021 delivers the learner-facing web interface in `apps/web` consuming the approved FEAT-020 backend APIs.

### Key Architectural Principles
1. **Zero Backend Modifications**: All implementation work is isolated to `apps/web`. Zero changes to `apps/api`, Prisma schema, or PostgreSQL migrations.
2. **Dual-Query Lesson Orchestration**:
   - `LessonDetailPage` executes Query A (`useLessonQuery`) for authenticated lesson content and Query B (`useCourseQuery`) for course metadata and published lesson outline.
   - Previous and next navigation controls are derived strictly by locating adjacent elements in `CourseDetailDto.lessons` (`findIndex`). Numeric `order - 1` / `order + 1` arithmetic is forbidden.
   - If Query B fails or is loading while Query A succeeds, lesson content renders normally, breadcrumbs fall back to "Course", and adjacent controls are omitted without raising a fatal error.
3. **Pure Client Layer**: An isolated API client (`apps/web/src/api/academy.api.ts`) encapsulates all HTTP operations, URL resolution, and error normalization. Components never call `fetch()` directly.
4. **Token Security Boundary**: The API client obtains the short-lived access token strictly through the existing approved frontend auth/session abstraction. Zero `localStorage`, `sessionStorage`, or JavaScript refresh-token storage.
5. **Redirect Safety**: The `AUTH_REQUIRED` card preserves the return path using relative application URLs only, validated to prevent open-redirect attacks.
6. **Strict Sanitization on Educational Content**:
   - `DOMPurify` is the mandatory final sanitization boundary before DOM insertion.
   - `marked` Markdown parser raw-HTML suppression provides defense-in-depth only.
   - `dangerouslySetInnerHTML` is permitted only inside the isolated `LessonContent.tsx` component; unsanitized usage is strictly prohibited.
7. **FEAT-021 Accessibility Baseline**: Single `<h1>` per view, semantic headings, keyboard operability, visible focus indicators, screen reader live regions, and color independence.
8. **Responsive First**: Mobile-first layouts adapting to mobile (1 col), tablet (2 col), and desktop (3 col) without horizontal scrolling.

---

## 2. Locked Human UX Decisions

Human approval has locked all UX defaults:
- **Course Catalog**: Responsive Card Grid (1 col mobile, 2 col tablet, 3 col desktop).
- **Course Outline**: Numbered Vertical Outline.
- **Lesson Reading**: Centered Reading Column (`max-width: approximately 720px`, line-height `1.7`).
- **Lesson Navigation**: Dual Navigation (breadcrumb top bar + previous/outline/next bottom footer).
- **Unauthenticated Lesson**: In-Place `AUTH_REQUIRED` Card with safe internal return redirect.

---

## 3. Dependency Inventory (`apps/web/package.json`)

Direct inspection of `apps/web/package.json` establishes the exact dependency plan:

| Dependency | Target Version | Classification | Purpose |
| :--- | :--- | :--- | :--- |
| `react` | `^19.0.0` | **ALREADY PRESENT** | UI component framework |
| `react-dom` | `^19.0.0` | **ALREADY PRESENT** | DOM rendering engine |
| `@tanstack/react-query` | `^5.66.0` | **ALREADY PRESENT** | Server state caching & async queries |
| `lucide-react` | `^0.475.0` | **ALREADY PRESENT** | UI icons |
| `react-router-dom` | `^7.0.0` | **NEW DEPENDENCY REQUIRED** | Client-side routing for `/academy` routes (ships built-in types) |
| `dompurify` | `^3.2.4` | **NEW DEPENDENCY REQUIRED** | HTML XSS sanitization engine (ships built-in types at `./dist/purify.cjs.d.ts`; `@types/dompurify` omitted) |
| `marked` | `^15.0.7` | **NEW DEPENDENCY REQUIRED** | Pure Markdown parser (ships built-in types at `./lib/marked.d.ts`) |

*Zero backend dependency changes. Zero redundant typings packages.*

*Zero backend dependency changes.*

---

## 4. Component Hierarchy & Navigation Flow

```text
App
└── AcademyLayout (Header, Breadcrumbs, Main Container, Footer)
    ├── Route: /academy (CourseCatalogPage)
    │   ├── LevelFilter (All, Beginner, Intermediate, Advanced)
    │   ├── CourseGrid
    │   │   └── CourseCard[] (Title, Level badge, Lesson count, Description, Outline link)
    │   ├── PaginationControls (Prev, Next, Page numbers, Total count)
    │   └── State Views (LoadingSkeleton, EmptyState, ErrorState with Retry)
    │
    ├── Route: /academy/courses/:courseSlug (CourseDetailPage)
    │   ├── CourseHeader (Title, Description, Level badge, Derived lessonCount)
    │   ├── LessonOutlineList
    │   │   └── LessonOutlineItem[] (Order index, Title, Read action link)
    │   └── State Views (LoadingSkeleton, NotFoundState, ErrorState with Retry)
    │
    └── Route: /academy/courses/:courseSlug/lessons/:lessonSlug (LessonDetailPage)
        ├── TopNavigation (Breadcrumbs, Back to Course)
        ├── LessonHeader (Position badge: Lesson X of Y, Title)
        ├── LessonContent (Sanitized Markdown reading column via marked + DOMPurify)
        ├── BottomNavigation (Previous Lesson, Back to Course Outline, Next Lesson)
        └── State Views (LoadingSkeleton, AuthRequiredCard, NotFoundState, ErrorState)
```

---

## 5. Query Cache Strategy (TanStack Query)

| Query Hook | Endpoint | Stale Time | Cache Time | Behavior & Fallback |
| :--- | :--- | :---: | :---: | :--- |
| `useCoursesQuery(params)` | `GET /api/academy/courses` | 5 min | 15 min | Public catalog; caches by `{ page, limit, level }`. |
| `useCourseQuery(slug)` | `GET /api/academy/courses/:slug` | 5 min | 15 min | Public course outline; used by both CourseDetail and LessonDetail. |
| `useLessonQuery(courseSlug, lessonSlug)` | `GET /api/academy/.../lessons/...` | 2 min | 10 min | Authenticated lesson content; sends Bearer token when available. |

### Lesson Query Independence & Fallback
- `useLessonQuery` 401 is authoritative $\rightarrow$ displays `AUTH_REQUIRED`.
- `useLessonQuery` 404 is authoritative $\rightarrow$ displays `NOT_FOUND`.
- `useCourseQuery` failure does NOT prevent `useLessonQuery` from displaying lesson content; breadcrumb defaults to generic "Course" and previous/next navigation is safely omitted.

---

## 6. Security Threat Modeling & Mitigation

### 1. Stored XSS via Educational Markdown
- **Threat**: Educational content could contain malicious `<script>`, `<iframe>`, `<img onerror=...>`, or `javascript:` links.
- **Mitigation & Sanitization Boundary**:
  1. `marked` configured with raw HTML parsing disabled (defense-in-depth).
  2. `DOMPurify` sanitizer serves as the mandatory final sanitization boundary before DOM insertion, stripping any unexpected tags/attributes and neutralizing unsafe protocols (`javascript:`, `data:`, `vbscript:`).
  3. External links receive `rel="noopener noreferrer"`.
  4. `dangerouslySetInnerHTML` is isolated exclusively inside `LessonContent.tsx`; unsanitized usage is prohibited.
  5. Comprehensive XSS attack-vector rejection tests verify neutralization of concrete attack payloads.

### 2. Open-Redirect Exploits
- **Threat**: Attackers could craft `?redirect=https://evil.com` to phish users after login.
- **Mitigation**:
  - `isValidInternalRedirect(path)` verifies the path starts with `/`, rejects `//`, and rejects protocol schemes.
  - Return URL is strictly URI-encoded.

### 3. Sensitive Data & Error Leakage
- **Threat**: Rendering backend error responses might reveal database tables, Prisma queries, or stack traces.
- **Mitigation**:
  - Frontend error normalization produces clean, user-facing error messages.
  - 404 responses for draft or archived content are generic and indistinguishable from nonexistent entities.

---

## 7. Verification & Testing Strategy

### 1. Unit & Component Tests (`apps/web/src/features/academy/**/*.test.tsx`)
- **`CourseCatalogPage.test.tsx`**:
  - Rendering of course cards with title, description, level, and lesson count.
  - Level filter click updates parameters and resets page to 1.
  - Pagination controls disable "Previous" on page 1 and "Next" on totalPages.
  - Renders `LOADING` skeleton, `EMPTY` state, and `ERROR` state with working retry.
- **`CourseDetailPage.test.tsx`**:
  - Rendering of course hero and ordered lesson outline rows.
  - Verified derivation of `lessonCount = course.lessons.length`.
  - 404 response displays generic "Course Unavailable" without leaking status.
- **`LessonDetailPage.test.tsx`**:
  - Dual-query orchestration: Query A success + Query B success renders title, content, breadcrumbs, and adjacent navigation.
  - Non-contiguous lesson orders: adjacent navigation correctly links previous and next lessons based on array order.
  - Query B failure fallback: lesson content renders safely when Query B fails; breadcrumb falls back to "Course" and adjacent buttons are omitted without crash.
  - 401 response renders in-place `AUTH_REQUIRED` card with valid internal redirect URL.
  - 404 response renders generic "Lesson Unavailable" card.
- **`redirect-validator.test.ts`**:
  - Valid internal relative paths pass.
  - External URLs (`https://...`), protocol-relative URLs (`//evil.com`), and protocol schemes (`javascript:...`) are rejected.
- **`markdown-sanitizer.test.ts`**:
  - Standard Markdown (headings, lists, code blocks, tables, links) renders properly.
  - XSS attack-vector rejection tests against concrete payloads:
    - `<script>alert(1)</script>`
    - `<img src=x onerror=alert(1)>` (inline event handlers)
    - `<a href="javascript:alert(1)">link</a>` (javascript: URL)
    - `<a href="data:text/html,...">link</a>` (data: URL)
    - `<iframe src="..."></iframe>`
    - `<form action="...">...</form>`
    - `<style>body { display:none }</style>` (style injection)
    - `<<SCRIPT>alert("XSS");//<</SCRIPT>` (malformed nested HTML)
    - `[link](javascript:alert(1))` (Markdown links with unsafe protocols)
  - External links receive `rel="noopener noreferrer"`.

### 2. Accessibility & Responsive Verification
- **Accessibility**: semantic headings check (single `<h1>`), keyboard tab navigation order, visible focus rings, and ARIA live announcements.
- **Responsive**: 1 column (<640px), 2 columns (640-1023px), 3 columns ($\ge 1024px$) with zero horizontal overflow.

### 3. Monorepo Regression Verification
Execution of full monorepo validation suite:
```bash
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:migrations
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```
