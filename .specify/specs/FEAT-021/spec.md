# Specification: FEAT-021 Academy Learner Course/Lesson UI

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-021  
**Phase**: Phase 4 — Academy  
**Specification Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human UX Planning Decisions**: APPROVED  
**Implementation Agent**: Pending Human Approval  

---

## 1. System Architecture & Module Placement

FEAT-021 resides entirely within `apps/web` under the modular frontend architecture established in `docs/architecture-context.md`.

```text
apps/web/src/
├── api/
│   └── academy.api.ts                 # Pure API client consuming FEAT-020 REST endpoints
├── features/
│   └── academy/
│       ├── components/
│       │   ├── CourseCard.tsx          # Responsive card presentation
│       │   ├── LevelFilter.tsx         # Filter pills (ALL, BEGINNER, INTERMEDIATE, ADVANCED)
│       │   ├── PaginationControls.tsx  # Prev/Next/Page navigation controls
│       │   ├── LessonOutlineList.tsx   # Numbered vertical list of published lessons
│       │   ├── LessonContent.tsx       # Isolated sanitized Markdown renderer (DOMPurify)
│       │   └── AcademyStates.tsx       # Loading skeletons, empty state, error/retry state, auth-gate
│       ├── hooks/
│       │   └── use-academy.ts          # TanStack Query hooks (useCoursesQuery, useCourseQuery, useLessonQuery)
│       ├── pages/
│       │   ├── CourseCatalogPage.tsx   # Route: /academy or /academy/courses
│       │   ├── CourseDetailPage.tsx    # Route: /academy/courses/:courseSlug
│       │   └── LessonDetailPage.tsx    # Route: /academy/courses/:courseSlug/lessons/:lessonSlug
│       ├── types/
│       │   └── academy-ui.types.ts     # UI state models, query params, component props
│       └── utils/
│           ├── markdown-sanitizer.ts   # marked parser + DOMPurify pipeline
│           └── redirect-validator.ts   # Relative return URL validator & encoder
├── app/
│   └── router/
│       └── academy-routes.tsx          # Declarative React Router route registration
└── index.css                           # CSS variables, responsive utilities, focus styles
```

---

## 2. API Client Specification (`academy.api.ts`)

The frontend API client communicates with the backend via standard `fetch` with error normalization into `AppErrorResponse`.

### Contract Signatures

```typescript
export interface ListCoursesParams {
  page?: number;
  limit?: number;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}

export interface IAcademyApiClient {
  listCourses(params?: ListCoursesParams): Promise<{ data: CourseSummaryDto[]; pagination: PaginationMeta }>;
  getCourseBySlug(slug: string): Promise<{ data: CourseDetailDto }>;
  getLessonBySlug(courseSlug: string, lessonSlug: string, accessToken?: string): Promise<{ data: LessonDetailDto }>;
}
```

### Request Lifecycle & Credential Propagation
1. **Base URL Resolution**: Resolves `/api/academy/...` via Vite proxy or `VITE_API_URL`.
2. **Public Requests (`listCourses`, `getCourseBySlug`)**:
   - Sent without `Authorization` header.
   - Requires no credentials.
3. **Authenticated Requests (`getLessonBySlug`)**:
   - Obtains short-lived access token **only** through the existing approved frontend auth/session abstraction in `apps/web`.
   - If token is available: attaches `Authorization: Bearer <token>`.
   - If token is unavailable: request is sent without header, triggering server 401 response.
4. **Token Security Boundary**:
   - No `localStorage` or `sessionStorage` token storage.
   - No refresh token handling in JavaScript.
   - No token exposure in URL query strings, DOM data attributes, or console logs.
5. **Error Normalization**:
   - HTTP 400: Parses `{ error: { code: "VALIDATION_ERROR", message: string } }`.
   - HTTP 401: Normalizes to `code: "UNAUTHENTICATED"`, triggers `AUTH_REQUIRED` UI state.
   - HTTP 404: Normalizes to `code: "NOT_FOUND"`, triggers `NOT_FOUND` UI state.
   - HTTP 500 / Network Error: Normalizes to generic `code: "INTERNAL_ERROR"`, displays user-friendly message without leaking server stack traces or database details.

---

## 3. UI View Specifications

### View 1: Course Catalog (`CourseCatalogPage`)
- **Route**: `/academy` (alias `/academy/courses`).
- **Access Boundary**: Public (accessible to unauthenticated visitors and authenticated learners).
- **Core Elements**:
  1. **Page Header**:
     - Single `<h1>` heading: *"Aura Academy Courses"*.
     - Subtitle explaining the curriculum structure.
  2. **Level Filter Toolbar**:
     - Filter options: `All`, `Beginner`, `Intermediate`, `Advanced`.
     - Active pill is highlighted with high contrast and `aria-pressed="true"`.
     - Changing filter resets `page` to `1`.
  3. **Course Grid (Locked UX: Responsive Card Grid)**:
     - Responsive layout: 3 columns on desktop ($\ge 1024px$), 2 on tablet ($640px-1023px$), 1 on mobile ($<640px$).
     - Card items:
       - Course title (`<h3>`).
       - Level badge (`BEGINNER` $\rightarrow$ Green, `INTERMEDIATE` $\rightarrow$ Blue, `ADVANCED` $\rightarrow$ Purple) with explicit text label.
       - Course description (clamped to 3 lines).
       - Published lesson count pill (e.g., `5 Lessons`).
       - Primary action link: *"View Outline →"* linking to `/academy/courses/:slug`.
  4. **Pagination Bar**:
     - Summary text: *"Page X of Y (Z courses)"*.
     - *"Previous"* button (disabled when `page <= 1`).
     - *"Next"* button (disabled when `page >= totalPages`).
     - Keyboard operable (`Tab`, `Enter`, `Space`).
- **Async State Model**:
  - `LOADING`: 6 pulsing skeleton cards with placeholder boxes.
  - `SUCCESS`: Grid of course cards and pagination controls.
  - `EMPTY`: Zero courses matching active filter; displays "No courses found" with a "Reset Filters" action.
  - `ERROR`: Accessible error banner (`role="alert"`) with "Retry" action.

---

### View 2: Course Detail (`CourseDetailPage`)
- **Route**: `/academy/courses/:slug`.
- **Access Boundary**: Public.
- **Core Elements**:
  1. **Breadcrumb Bar**:
     - Links: `Academy` $\rightarrow$ `[Course Title]`.
  2. **Course Header Section**:
     - Course title (`<h1>`).
     - Level badge and total lesson count derived via `course.lessons.length` (note: `CourseDetailDto` does not have a `lessonCount` field).
     - Full course description.
  3. **Syllabus Section (Locked UX: Numbered Vertical Outline)**:
     - Section heading: `<h2>Course Outline</h2>`.
     - Sequential list of published lessons:
       - Numbered badge representing lesson `order` (`1`, `2`, `3`...).
       - Lesson title (`<h4>`).
       - Action link: *"Read Lesson →"* navigating to `/academy/courses/:courseSlug/lessons/:lessonSlug`.
- **Async State Model**:
  - `LOADING`: Header skeleton and 4 placeholder outline rows.
  - `SUCCESS`: Course header and published lesson outline list.
  - `NOT_FOUND`: Generic "Course Unavailable" message without revealing draft/archived status.
  - `ERROR`: Network or server error with actionable "Retry" button.

---

### View 3: Lesson Detail (`LessonDetailPage`)
- **Route**: `/academy/courses/:courseSlug/lessons/:lessonSlug`.
- **Access Boundary**: Authenticated (requires valid learner access token).
- **Dual-Query Orchestration**:
  ```typescript
  // Query A: Authenticated lesson content
  const lessonQuery = useLessonQuery(courseSlug, lessonSlug);

  // Query B: Public course metadata & outline
  const courseQuery = useCourseQuery(courseSlug);
  ```
  - **Derivation of Navigation**:
    The page locates `lesson.slug === lessonSlug` within `courseQuery.data.lessons`:
    ```typescript
    const lessons = courseQuery.data?.lessons ?? [];
    const currentIndex = lessons.findIndex((l) => l.slug === lessonSlug);
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
    const currentPosition = currentIndex >= 0 ? currentIndex + 1 : null;
    const totalLessons = lessons.length;
    ```
    > [!IMPORTANT]
    > Adjacent elements are used directly. `order - 1` and `order + 1` are strictly prohibited because order values are not guaranteed to be contiguous.
  - **Query Fallback Resilience**:
    - If Query A succeeds but Query B fails/loads: lesson content renders safely; top breadcrumb falls back to "Course" (`/academy/courses/:courseSlug`); previous/next navigation controls are omitted; no fatal error is raised.
    - If Query A returns 401: authoritative state is `AUTH_REQUIRED`.
    - If Query A returns 404: authoritative state is `NOT_FOUND` (Lesson Unavailable).
- **Core Elements**:
  1. **Top Navigation (Locked UX: Dual Navigation)**:
     - Top breadcrumb: `Academy` $\rightarrow$ `[Course Name]` $\rightarrow$ `[Lesson Name]`.
  2. **Lesson Header**:
     - Position badge: *"Lesson X of Y"* (or *"Lesson"* if outline unavailable).
     - Lesson title (`<h1>`).
  3. **Reading Container (Locked UX: Centered Reading Column)**:
     - Centered container (`max-width: approximately 720px`), line-height `1.7`.
     - Sanitized educational markdown rendering via `LessonContent.tsx`.
  4. **Bottom Navigation Footer**:
     - *"← Previous Lesson"* (links to `prevLesson.slug`; omitted if first or outline unavailable).
     - *"Back to Course Outline"* (links to `/academy/courses/:courseSlug`).
     - *"Next Lesson →"* (links to `nextLesson.slug`; omitted if last or outline unavailable).
- **Async State Model**:
  - `LOADING`: Reading column skeleton shimmer lines.
  - `SUCCESS`: Educational content, breadcrumbs, and intra-course navigation.
  - `AUTH_REQUIRED (Locked UX: In-Place Auth-Required Card)`:
    - Displayed on 401 response without rendering lesson body.
    - Presents card:
      - Icon: Shield/Lock.
      - Heading: *"Authentication Required"*.
      - Description: *"Lesson content is available to registered Aura Capital learners. Please sign in or create an account to access this lesson."*
      - Action: "Sign In" and "Create Account" buttons with safe relative redirect encoding:
        `?redirect=${encodeURIComponent("/academy/courses/" + courseSlug + "/lessons/" + lessonSlug)}`.
  - `NOT_FOUND`: Generic "Lesson Unavailable" card with button *"Back to Course Outline"*.
  - `ERROR`: Network or 500 error with *"Retry"* button.

---

## 4. Redirect Safety Specification

To eliminate open-redirect vulnerabilities:
1. The return path must be derived solely from router location: `location.pathname + location.search`.
2. The path is validated with `isValidInternalRedirect(path)`:
   - Must begin with a single `/`.
   - Must NOT begin with `//` or `/\`.
   - Must NOT contain `:` before `/` (preventing `https:`, `http:`, `javascript:`, `data:`).
3. If validation fails, return redirect falls back to `/academy`.
4. The validated path is URI-encoded prior to parameter attachment:
   ```typescript
   export function buildAuthRedirectUrl(authPath: "/login" | "/register", returnPath: string): string {
     const safePath = isValidInternalRedirect(returnPath) ? returnPath : "/academy";
     return `${authPath}?redirect=${encodeURIComponent(safePath)}`;
   }
   ```

---

## 5. Markdown Parsing & DOMPurify Pipeline

Lesson content is rendered strictly through the isolated `LessonContent.tsx` component:

```text
Raw Markdown
    ↓
`marked.parse(content, { gfm: true, breaks: true })` with RAW HTML DISABLED (defense-in-depth)
    ↓
`DOMPurify.sanitize(html, purifyOptions)` (MANDATORY FINAL SANITIZATION BOUNDARY)
    ↓
Isolated `<div className="prose" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />`
```

> [!IMPORTANT]
> `DOMPurify` execution is the mandatory final sanitization boundary before DOM insertion. Parser raw-HTML suppression serves strictly as secondary defense-in-depth. Unsanitized `dangerouslySetInnerHTML` is strictly **PROHIBITED** across the entire codebase.

### 1. Markdown Parser Configuration
Raw HTML embedded in Markdown is **DISABLED by default**. In `marked`, the `html` tokenizer is overridden to escape or drop raw HTML nodes, ensuring raw `<script>` or `<img onerror=...>` tags are never parsed into HTML elements.

### 2. DOMPurify Configuration
```typescript
import DOMPurify from "dompurify";

const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "b", "i", "strong", "em", "strike", "code", "pre",
    "ul", "ol", "li", "blockquote", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "a", "br"
  ],
  ALLOWED_ATTR: ["href", "title", "target", "rel"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "style", "link", "meta"],
  FORBID_ATTR: ["style", "srcdoc", "onerror", "onload", "onclick", "onmouseover"],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeLessonContent(rawHtml: string): string {
  // Add hook to enforce rel="noopener noreferrer" on external links
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  const sanitized = DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);
  DOMPurify.removeHook("afterSanitizeAttributes");
  return sanitized as string;
}
```

---

## 6. Dependency Inventory (`apps/web/package.json`)

| Package | Version | Status | Purpose |
| :--- | :--- | :--- | :--- |
| `react` | `^19.0.0` | **ALREADY PRESENT** | Core UI library |
| `react-dom` | `^19.0.0` | **ALREADY PRESENT** | DOM renderer |
| `@tanstack/react-query` | `^5.66.0` | **ALREADY PRESENT** | Server state management & caching |
| `lucide-react` | `^0.475.0` | **ALREADY PRESENT** | Accessible UI icons |
| `react-router-dom` | `^7.0.0` | **NEW DEPENDENCY REQUIRED** | Client-side routing for `/academy` routes (ships built-in types) |
| `dompurify` | `^3.2.4` | **NEW DEPENDENCY REQUIRED** | XSS sanitization engine (ships built-in types at `./dist/purify.cjs.d.ts`; `@types/dompurify` omitted) |
| `marked` | `^15.0.7` | **NEW DEPENDENCY REQUIRED** | Pure Markdown parser (ships built-in types at `./lib/marked.d.ts`) |

*Zero backend dependency changes. Zero redundant typings packages.*

---

## 7. FEAT-021 Accessibility Baseline

1. **Semantic Heading Hierarchy**:
   - Single `<h1>` per view: Catalog (`Aura Academy Courses`), Course Detail (`[Course Title]`), Lesson Detail (`[Lesson Title]`).
   - Section headings follow strict `<h2>` through `<h4>` order.
2. **Keyboard Operability**:
   - Filter pills, cards, outline rows, pagination buttons, and lesson footer controls are navigable via `Tab`.
   - Actions trigger via `Enter` or `Space`.
3. **Focus States**:
   - Unambiguous focus ring (`outline: 2px solid var(--primary); outline-offset: 2px;`) on all interactive controls.
4. **Accessible Names**:
   - Every interactive control has descriptive inner text or an explicit `aria-label`.
5. **Live Regions & Announcements**:
   - Dynamic loading indicators include `aria-busy="true"` and a polite live region (`role="status"`).
   - Dynamic error messages use `role="alert"`.
6. **Color Independence**:
   - Badges communicate course levels with explicit text labels (`Beginner`, `Intermediate`, `Advanced`) alongside color tokens.

---

## 8. Responsive Layout Specifications

| Viewport | Width Range | Catalog Grid | Course Outline | Reading Column |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile** | $< 640px$ | 1 column, full-width cards | Full-width vertical list | Full width, $16px$ horizontal padding |
| **Tablet** | $640px - 1023px$ | 2 columns grid | Full-width vertical list | Max $640px$ centered column |
| **Desktop** | $\ge 1024px$ | 3 columns grid | Max $960px$ centered outline | Max $720px$ centered column ($65-75ch$) |

*Zero horizontal scrolling on any supported viewport.*

---

## 9. Security Specifications

1. **DTO Leakage Prevention**:
   - UI consumes and displays only approved FEAT-020 DTO fields.
   - Zero display of internal UUID IDs, timestamps, or backend error traces.
2. **XSS Mitigation & Sanitized Rendering Boundary**:
   - DOMPurify is the mandatory final sanitization boundary before DOM insertion.
   - Markdown parser raw-HTML suppression provides defense-in-depth only.
   - Unsanitized `dangerouslySetInnerHTML` is strictly **PROHIBITED** throughout the codebase.
   - Rendered output is subjected to comprehensive XSS attack-vector rejection tests against concrete payloads (`<script>`, inline event handlers, `javascript:`/`data:` URLs, `iframe`, `form`, `style` injection, malformed nested HTML, and unsafe Markdown links).
3. **No Client Authorization Assumptions**:
   - Frontend never guesses course/lesson publication status; relies 100% on server status codes.
4. **Safe Token Handling**:
   - Access tokens acquired only via approved auth abstraction, transmitted via standard headers, never logged or stored in DOM.
