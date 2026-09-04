# Requirement: FEAT-021 Academy Learner Course/Lesson UI

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-021  
**Phase**: Phase 4 — Academy  
**Feature Type**: Learner-facing Web UI implementation planning package  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human UX Planning Decisions**: APPROVED  
**Implementation Agent**: Pending Human Approval  
**QA Owner**: Codex (with Human Governance)  

---

## 1. Context & Background

Phase 4 establishes the learner-facing Academy domain on the approved production architecture.
- **FEAT-019** established the durable PostgreSQL persistence foundation (`DONE`, `feat-019-approved`).
- **FEAT-020** established the learner-facing read model APIs (`DONE`, `feat-020-approved`), providing:
  1. `GET /api/academy/courses` (PUBLIC): paginated published course catalog with `lessonCount`.
  2. `GET /api/academy/courses/:slug` (PUBLIC): published course outline with ordered lesson summaries.
  3. `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` (AUTHENTICATED): published lesson educational markdown content.

FEAT-021 is the third feature in Phase 4. It implements the learner-facing frontend user interface in `apps/web` consuming the approved FEAT-020 read model APIs. It establishes the visual, interactive, accessible, and responsive foundation for browsing courses, inspecting course syllabi, and reading lesson educational content.

---

## 2. Goal

Build a clean, modern, accessible, and responsive learner-facing web interface in `apps/web` that consumes the approved FEAT-020 backend read endpoints:
1. **Course Catalog Screen**: Learners and prospective guests browse published courses, filter by level, inspect summary cards, and navigate paginated catalog results.
2. **Course Detail Screen**: Learners inspect course descriptions, metadata badges, and the ordered syllabus of published lessons.
3. **Lesson Detail Screen**: Authenticated learners read educational lesson content, navigate through lessons within the course, and receive clear auth-required prompts when unauthenticated.

All UI features must strictly adhere to the per-view async state model (`LOADING`, `SUCCESS`, `EMPTY`, `NOT_FOUND`, `AUTH_REQUIRED`, `ERROR`), enforce client-side sanitization on rendered educational markdown content with raw HTML disabled, and maintain strict scope boundaries with zero backend modifications.

---

## 3. Scope Boundaries

### In Scope
1. **Course Catalog Screen (`/academy` or `/academy/courses`)**:
   - Responsive card grid displaying: `title`, `description`, `level` badge, `lessonCount`, and `order`.
   - Bounded pagination controls (`page`, `limit`, `totalPages`, `total`).
   - Level filter controls (`ALL`, `BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
   - Dedicated states: `LOADING` skeleton, `SUCCESS` grid, `EMPTY` state with filter reset, and `ERROR` state with retry.
2. **Course Detail Screen (`/academy/courses/:slug`)**:
   - Course metadata presentation: `title`, `description`, `level`, and derived lesson count (`course.lessons.length`).
   - Published lesson outline list displaying: lesson `title`, lesson index/`order`, and clickable navigation links.
   - Dedicated states: `LOADING` skeleton, `SUCCESS` syllabus view, `NOT_FOUND` (generic 404 content unavailable), and `ERROR` with retry.
3. **Lesson Detail Screen (`/academy/courses/:courseSlug/lessons/:lessonSlug`)**:
   - Dual-query data orchestration:
     - **Query A**: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` for authenticated educational markdown content.
     - **Query B**: `GET /api/academy/courses/:courseSlug` for course metadata, breadcrumb course title, and ordered lesson outline.
   - Intra-course lesson navigation derived by locating `lesson.slug === lessonSlug` inside `CourseDetailDto.lessons` and linking adjacent elements (never numeric `order - 1`/`order + 1`).
   - Resilient query fallback: if Query A succeeds but Query B fails, lesson content still renders, breadcrumb falls back to "Course", and adjacent controls are omitted without raising a fatal error.
   - Sanitized markdown rendering with strict XSS prevention (raw HTML parsing disabled by default, followed by DOMPurify).
   - Breadcrumb top navigation (`Academy` $\rightarrow$ `[Course Name]` $\rightarrow$ `[Lesson Name]`) and footer navigation (`← Previous Lesson` / `Next Lesson →`).
   - Dedicated states: `LOADING` skeleton, `SUCCESS` reading column, `AUTH_REQUIRED` in-place card with safe internal return redirect, `NOT_FOUND` (generic 404), and `ERROR` with retry.
4. **Frontend Architecture & Client Boundary**:
   - Modular frontend API client layer (`apps/web/src/api/academy.api.ts`) integrated with `@tanstack/react-query`.
   - Error normalization mapping backend error envelopes (`AppErrorResponse`) to UI state.
   - Short-lived access token acquired strictly through the existing approved frontend auth/session abstraction; zero localStorage, sessionStorage, or JavaScript refresh token persistence.
5. **Accessibility & Responsive Standards**:
   - FEAT-021 accessibility baseline: semantic HTML5, keyboard navigation, visible focus indicators, screen reader live regions for dynamic states, and color independence.
   - Responsive layouts across mobile (<640px), tablet (640px–1023px), and desktop ($\ge 1024px$).

### Strictly Out of Scope
- **Quiz UI**: Quiz questions, options, attempt tracking, or answer submissions (deferred to FEAT-023/FEAT-024/FEAT-025).
- **Flashcards Review UI**: Flashcard decks, flip cards, or review states (deferred to FEAT-022).
- **Progress Tracking & Mutations**: Mark as completed, progress bars, or progress persistence (deferred to FEAT-026).
- **XP / Rewards UI**: XP badges, reward ledgers, or gamification animations (deferred to FEAT-027).
- **CMS / Admin Authoring**: Course/lesson creation, editing, publishing, or draft preview UI.
- **Backend Changes**: Zero modifications to `apps/api` controllers, services, repositories, or routes.
- **Database / Migration Changes**: Zero alterations to `schema.prisma` or PostgreSQL migrations.

---

## 4. API Contract Alignment (FEAT-020 Consumption)

FEAT-021 consumes the approved, immutable FEAT-020 REST endpoints:

| Endpoint | Method | Access Boundary | Query / Param Schema | Success Response Payload |
| :--- | :---: | :---: | :--- | :--- |
| `/api/academy/courses` | `GET` | **PUBLIC** | `page` (int $\ge 1$), `limit` (int 1..50), `level` (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`) | `{ data: CourseSummaryDto[], pagination: PaginationMeta }` |
| `/api/academy/courses/:slug` | `GET` | **PUBLIC** | `slug` (lowercase alphanumeric + hyphens) | `{ data: CourseDetailDto }` |
| `/api/academy/courses/:courseSlug/lessons/:lessonSlug` | `GET` | **AUTHENTICATED** | `courseSlug`, `lessonSlug` | `{ data: LessonDetailDto }` |

### Expected DTO Structures

```typescript
export interface CourseSummaryDto {
  slug: string;
  title: string;
  description: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
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
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
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

> [!IMPORTANT]
> `CourseDetailDto` does NOT contain `lessonCount`. The course detail UI derives total lessons via `course.lessons.length`.
> `LessonDetailDto` does NOT contain course metadata, course title, full outline, or previous/next lesson references. The lesson detail UI derives navigation from `CourseDetailDto.lessons`.

---

## 5. Approved UX Decisions (Locked by Human)

All FEAT-021 UX defaults have received explicit Human approval and are locked:

1. **Course Catalog Layout**:
   - **Decision**: **Responsive Card Grid** (`APPROVED`).
   - Mobile (<640px): 1 column.
   - Tablet (640px–1023px): 2 columns.
   - Desktop ($\ge 1024px$): 3 columns.
   - Card contents: course title, description, level badge, lesson count badge, and "View Outline" action link.
2. **Course Syllabus / Outline Layout**:
   - **Decision**: **Numbered Vertical Outline** (`APPROVED`).
   - Flat sequential list showing step number badge, published lesson title, and action link.
3. **Lesson Reading Column Typography**:
   - **Decision**: **Centered Reading Column** (`APPROVED`).
   - `max-width: approximately 720px`, line-height `1.7`, readable typography with high contrast.
4. **Lesson Navigation Model**:
   - **Decision**: **Dual Navigation** (`APPROVED`).
   - Sticky / top breadcrumb navigation (`Academy` $\rightarrow$ `[Course Name]` $\rightarrow$ `[Lesson Name]`).
   - Bottom navigation footer (`← Previous Lesson`, `Back to Course Outline`, `Next Lesson →`).
5. **Unauthenticated Lesson Access State**:
   - **Decision**: **In-Place Auth-Required Card** (`APPROVED`).
   - Displays an accessible card on 401 response explaining that lesson reading requires an active account.
   - Actions: "Sign In" and "Create Account" buttons with safe relative redirect encoding.

---

## 6. Authentication & Token Boundary

1. **Approved Source**: Frontend API client obtains the short-lived access token solely through the existing approved frontend auth/session abstraction in `apps/web`.
2. **Forbidden Token Mechanisms**:
   - No `localStorage` access-token persistence.
   - No `sessionStorage` access-token persistence.
   - No refresh token storage in JavaScript.
   - No token in URL query parameters.
   - No token in DOM attributes.
   - No console logging of tokens or credentials.
3. **Degradation Policy**: If the existing frontend auth abstraction cannot provide an access token, it is treated as unauthenticated (triggering standard 401 handling); do not invent storage mechanisms.

---

## 7. Redirect Safety & Open-Redirect Immunity

1. **Internal Relative Paths Only**: When preserving lesson location for unauthenticated visitors, the return URL must be strictly derived from the router location path and query (e.g. `/academy/courses/:courseSlug/lessons/:lessonSlug`).
2. **Sanitization & Encoding**:
   - Return URL must start with a single `/`.
   - Paths starting with `//`, `/\`, or containing protocol schemes (`http:`, `https:`, `javascript:`, `data:`) are strictly forbidden.
   - The verified relative path is URI-encoded prior to appending: `?redirect=${encodeURIComponent(relativePath)}`.

---

## 8. Markdown Rendering & DOMPurify Sanitization Pipeline

1. **Explicit Safe Pipeline**:
   ```text
   Raw Lesson Markdown string
       ↓
   Markdown Parser (`marked` with raw HTML parsing disabled — defense-in-depth)
       ↓
   Mandatory Final HTML Sanitizer (`DOMPurify` with strict tag & attribute allowlist)
       ↓
   Isolated React Rendering (`dangerouslySetInnerHTML` in LessonContent only)
   ```
2. **Mandatory Final Sanitization Boundary**: `DOMPurify` execution is the mandatory, non-bypassable security boundary before DOM insertion. Raw HTML suppression in the Markdown parser operates strictly as secondary defense-in-depth. Unsanitized `dangerouslySetInnerHTML` is strictly **PROHIBITED** across the entire codebase.
3. **DOMPurify Allowed Tags**:
   - `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `p`, `b`, `i`, `strong`, `em`, `strike`, `code`, `pre`, `ul`, `ol`, `li`, `blockquote`, `hr`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `span`, `a`, `br`.
4. **DOMPurify Allowed Attributes**:
   - `href`, `title`, `target`, `rel`.
5. **Strict Prohibitions & Protocol Neutralization**:
   - Prohibited Tags: `script`, `iframe`, `object`, `embed`, `form`, `input`, `button`, `style`, `link`, `meta`.
   - Prohibited Attributes: `style`, `srcdoc`, event handlers (`onerror`, `onload`, `onclick`, `onmouseover`, etc.), form action attributes.
   - Neutralized Protocols: `javascript:`, `data:`, `vbscript:`.
6. **External Links**: All `<a>` tags targeting external destinations must automatically receive `rel="noopener noreferrer"`.

---

## 9. Dependency Inventory (`apps/web`)

Inspection of `apps/web/package.json` confirms:
- **`react`** (`^19.0.0`): **ALREADY PRESENT**
- **`react-dom`** (`^19.0.0`): **ALREADY PRESENT**
- **`@tanstack/react-query`** (`^5.66.0`): **ALREADY PRESENT**
- **`lucide-react`** (`^0.475.0`): **ALREADY PRESENT**
- **`react-router-dom`** (`^7.0.0`): **NEW DEPENDENCY REQUIRED** (client-side routing, ships built-in TypeScript declarations)
- **`dompurify`** (`^3.2.4`): **NEW DEPENDENCY REQUIRED** (runtime HTML sanitization engine; ships built-in TypeScript declarations at `./dist/purify.cjs.d.ts`; `@types/dompurify` is **NOT required** and omitted)
- **`marked`** (`^15.0.7`): **NEW DEPENDENCY REQUIRED** (pure Markdown parser; ships built-in TypeScript declarations at `./lib/marked.d.ts`)

*Zero backend dependency changes. Zero redundant typings packages.*

---

## 10. Async State Model

Each view implements only its logically valid async states:

| View | Valid Async States | Descriptions |
| :--- | :--- | :--- |
| **Course Catalog** | `LOADING`<br>`SUCCESS`<br>`EMPTY`<br>`ERROR` | Skeleton cards while fetching.<br>Grid of course cards and pagination controls.<br>Zero courses match filter; offers reset action.<br>Error notification with retry button. |
| **Course Detail** | `LOADING`<br>`SUCCESS`<br>`NOT_FOUND`<br>`ERROR` | Hero skeleton and outline shimmer rows.<br>Course metadata and sequential lesson list.<br>Generic 404 "Course Unavailable" without draft leak.<br>Network or 500 error with retry button. |
| **Lesson Detail** | `LOADING`<br>`SUCCESS`<br>`AUTH_REQUIRED`<br>`NOT_FOUND`<br>`ERROR` | Reading column shimmer placeholders.<br>Sanitized lesson content and navigation buttons.<br>401 response: in-place card with login/register links.<br>404 response: generic "Lesson Unavailable" card.<br>Network or 500 error with retry button. |

---

## 11. FEAT-021 Accessibility Baseline

Rather than claiming unvalidated universal conformance, FEAT-021 specifies an objective, testable baseline:
1. **Semantic Structure**: Exactly one `<h1>` per view, followed by logical `<h2>` to `<h4>` headings.
2. **Keyboard Operability**: All filters, cards, outline links, pagination buttons, and lesson navigation controls are operable via `Tab`, `Enter`, and `Space`.
3. **Visible Focus**: Dedicated high-contrast focus rings (`outline: 2px solid var(--primary)`) on all focused elements.
4. **Accessible Names**: All buttons, links, and icon-only controls have descriptive text or `aria-label`.
5. **Live Region Announcements**: Loading states use `aria-busy="true"` and `role="status"` with polite live announcements; error states use `role="alert"`.
6. **Color Independence**: Badges and status pills convey meaning through clear text labels in addition to colors.

---

## 12. Success Criteria

1. **Zero Backend Modifications**: All code resides in `apps/web`. Zero changes to `apps/api`, Prisma schema, or migrations.
2. **Contract Fidelity**: Consumes only approved FEAT-020 endpoints (`/courses`, `/courses/:slug`, `/lessons/:lessonSlug`).
3. **Dual-Query Resilience**: Lesson detail view safely coordinates lesson and course outline queries, gracefully degrading navigation if course metadata fails.
4. **Open-Redirect Immunity**: Preserved return paths are strictly relative, encoded, and validated against open-redirect exploits.
5. **XSS Mitigation & Sanitized Rendering Boundary**: DOMPurify serves as the mandatory final sanitization boundary before DOM insertion, with Markdown parser raw-HTML suppression providing defense-in-depth. Rendering is proven resilient against concrete XSS attack vectors (`<script>`, inline event handlers, `javascript:`/`data:` URLs, iframes, forms, style injection, malformed HTML, and unsafe links).
6. **Accessibility & Responsive Conformance**: Meets the FEAT-021 accessibility baseline and displays without horizontal overflow on mobile, tablet, and desktop.
