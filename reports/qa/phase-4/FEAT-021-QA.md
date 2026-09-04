# FEAT-021 QA Report: Academy Learner Course/Lesson UI

**Feature**: FEAT-021 — Academy Learner Course/Lesson UI  
**Phase**: Phase 4 — Academy  
**QA Owner**: Antigravity — Independent QA Verification  
**QA Iteration**: 2 (Re-Verification)  
**Date**: 2026-09-04  
**Final Verdict**: **PASS**  
**Governance State**: **DONE**  
**Human Final Gate**: **APPROVED**  
**FEAT-022**: **UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)**  
**Phase 4 Status**: **IN_PROGRESS**  

---


## 1. Executive Summary

Independent QA Iteration 1 was executed for **FEAT-021: Academy Learner Course/Lesson UI** in accordance with `.specify/specs/FEAT-021/acceptance.md`, `reports/implementation/phase-4/FEAT-021.md`, and the Phase 4 governance requirements.

Implementation source code was **not modified** during this QA evaluation. FEAT-022 was **not started**.

All 29 verification areas were rigorously inspected and tested. While the frontend component architecture, dual-query orchestration, responsive grid layout, and monorepo regression suite demonstrated high quality with zero backend changes, QA identified **two blocking defects**:
1. **DEF-021-01 (Severity P1 — Security)**: Open Redirect Filter Bypass via URL-encoded backslashes (`/%5C%5Cevil.example`), double encoding, and control characters (CRLF / null byte injection) in `redirect-validator.ts`.
2. **DEF-021-02 (Severity P2 — Accessibility)**: Heading hierarchy violation on the Lesson Detail view where two `<h1>` elements render simultaneously when educational Markdown content includes top-level headings (`# ...`).

In addition, an explicit evidence gap (**GAP-021-01**) was recorded regarding client-side logout cache invalidation due to the absence of a client-side session manager in `apps/web`.

Per the approved Acceptance Criteria FAIL conditions, FEAT-021 receives a final verdict of **FAIL** for Iteration 1 and requires remediation before Human Final Gate review.

---

## 2. Validation Suite Execution Evidence

All 14 mandatory monorepo regression commands were executed and passed with clean exit code 0:

| Validation Command | Status | Actual Executed Count | Notes / Evidence |
| :--- | :---: | :--- | :--- |
| `npm run clean` | **PASS** | Monorepo-wide | Cleaned dist across shared, api, and web |
| `npm run lint` | **PASS** | Monorepo-wide | 0 errors, 0 warnings across all workspaces |
| `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Backend schema | Prisma schema syntax, relations, and generators valid |
| `npm run typecheck` | **PASS** | Monorepo-wide | Zero TypeScript compilation errors across shared, api, and web |
| `npm run build` | **PASS** | Monorepo-wide | Shared tsc, API tsc, and Web Vite bundle built in 9.66s |
| `npm run test` (standard) | **PASS** | **62 files / 564 tests** | API: 53/496, Web: 8/48, Shared: 1/20. 0 failures, 0 skips |
| `npm run test:unit` | **PASS** | **41 files / 418 tests** | API: 33/351, Web: 7/47, Shared: 1/20. 0 failures |
| `npm run test:db` (PostgreSQL) | **PASS** | **13 files / 113 tests** | Full live PostgreSQL integration suite passes |
| `npm run test:redis` (Redis) | **PASS** | **5 files / 50 tests** | Live Redis rate-limit and boundary suite passes |
| `npm run guard:persistence` | **PASS** | 1 file / 14 tests | Persistence boundary integrity verified |
| `npm run guard:migration` | **PASS** | 4 migrations | Exactly 4 migrations; 24 review risks; 0 blocking risks |
| `npm run guard:boundary` | **PASS** | Static AST guard | controllers=7, services=11, repositories=6 |
| `npm run guard:audit-governance` | **PASS** | Static AST guard | Zero premature product audit schemas, models, or APIs |
| `npm run guard:seed-safety` | **PASS** | Static AST guard | Zero unsafe seed scripts or default admin backdoors |

---

## 3. Detailed QA Findings by Area (Criteria 1–25)

### Point 1: Scope Integrity
- **Inspection**: `git diff HEAD -- apps/api` returned completely empty.
- **Verification**: Zero modifications to `apps/api/**`, Prisma schema, migrations, backend tests, Redis behavior, or database schema.
- **Out of Scope Check**: Zero implementation for flashcards, quizzes, quiz attempts, grading, progress mutation, XP, rewards, or CMS/authoring in `apps/web`.

### Point 2: Route Verification
- **Verified Routes**:
  - `/academy` $\to$ `CourseCatalogPage`
  - `/academy/courses` $\to$ Redirects cleanly to `/academy`
  - `/academy/courses/:courseSlug` $\to$ `CourseDetailPage`
  - `/academy/courses/:courseSlug/lessons/:lessonSlug` $\to$ `LessonDetailPage`
- No conflicting or duplicate Academy routes. Direct navigation and client-side link navigation verified.

### Point 3: FEAT-020 API Contract Preservation
- `AcademyApiClient` (`apps/web/src/api/academy.api.ts`) consumes strictly:
  - `GET /api/academy/courses`
  - `GET /api/academy/courses/:slug`
  - `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug`
- Zero invented endpoints. DTOs match FEAT-020 approved models with zero dependence on unapproved fields.

### Point 4: Course Catalog
- Renders `title`, `description`, `level` badge, `lessonCount`, pagination bar, and difficulty filter.
- Verified states: `LOADING` (skeletons), `SUCCESS` (card grid), `EMPTY` (with filter reset), `ERROR` (with working retry).
- Filter switching resets page state to 1.
- No internal IDs, timestamps, or draft status exposed.

### Point 5: Responsive Catalog
- CSS rules verified in `apps/web/src/index.css:444-462`:
  - Mobile ($<640\text{px}$): `grid-template-columns: 1fr` (1 column)
  - Tablet ($640\text{px}-1023\text{px}$): `grid-template-columns: repeat(2, 1fr)` (2 columns)
  - Desktop ($\ge 1024\text{px}$): `grid-template-columns: repeat(3, 1fr)` (3 columns)
- Verified zero horizontal overflow at narrow viewports ($375\text{px}$, $414\text{px}$).

### Point 6: Course Detail
- Verified only approved fields rendered. Lesson count derived strictly from `course.lessons.length`.
- Numbered vertical outline renders lesson summaries only; full lesson content is not projected.
- Generic "Course Unavailable" state returned on 404 without leaking whether course is draft or archived.

### Point 7: Lesson Dual-Query Strategy
- `LessonDetailPage` executes Query A (`useLessonQuery`) for authenticated lesson content and Query B (`useCourseQuery`) for course metadata/outline.
- Query B is never used to authorize access. Query A remains authoritative for 401, 404, and 5xx errors.

### Point 8: Previous / Next Derivation
- Adjacent lesson navigation derived strictly by array proximity (`lessons[currentIndex - 1]` and `lessons[currentIndex + 1]`).
- Probed with non-contiguous orders (10, 20, 40) in `LessonDetailPage.test.tsx`; order 20 correctly resolves previous to 10 and next to 40. Zero arithmetic (`order - 1` / `order + 1`) exists in source.

### Point 9: Course Query Fallback
- Probed failure scenario where Query A succeeds (200) and Query B fails (500).
- Lesson content remains fully visible, breadcrumb falls back to "Course", lesson position badge and previous/next controls gracefully hide, and the view does not crash.

### Point 10: Authentication Boundary
- Access token passed as optional argument to client: `Authorization: Bearer <token>`.
- Zero token persistence introduced: no `localStorage`, no `sessionStorage`, no JS-managed refresh token, no client-set cookies, no tokens in query params or DOM attributes, and no token logging.

### Point 11: Lesson Auth States
- 401 returns in-place `AUTH_REQUIRED` card with login/register links.
- 404 returns generic "Lesson Unavailable" state without revealing draft/archived status.
- 5xx/network error returns `ErrorState` with functional retry button.

### Point 12: Open Redirect Defense — DEFECT DETECTED
- **Defect Found**: `isValidInternalRedirect` fails to reject URL-encoded backslashes (`/%5C%5Cevil.example`), double-encoded payloads (`/%252F%252Fevil.example`), and control characters/newlines (`/path\nwith\nnewlines`, `/path\x00nullbyte`).
- See **DEF-021-01** below.

### Point 13: Markdown Parsing & Multi-Vector XSS Rejection
- Tested 15 concrete injection vectors including `<script>`, `<img onerror>`, `<a href="javascript:">`, `[click](javascript:)`, `[click](data:)`, `[click](vbscript:)`, `<iframe>`, `<form>`, `<style>`, `<svg onload>`, `<math>`, mixed-case `JaVaScRiPt:`, and malformed nested tags.
- All attack vectors neutralized by `marked` token suppression + `DOMPurify`. Zero executable JavaScript reaches DOM.

### Point 14: DOMPurify Boundary
- `dangerouslySetInnerHTML` is used in exactly ONE location in `apps/web`: `LessonContent.tsx:31`.
- Content is strictly sanitized via `DOMPurify.sanitize()` using minimal allowlist (`PURIFY_CONFIG`) before insertion. No unsanitized usage exists.

### Point 15: Link Handling
- Legitimate links (`https://ft.com`) render with `target="_blank"` and `rel="noopener noreferrer"`.
- Unsafe protocols (`javascript:`, `data:`, `vbscript:`) have their `href` attribute stripped.

### Point 16: React Rendering / XSS
- No string concatenation occurs on sanitized HTML prior to rendering.

### Point 17: Heading Semantics — DEFECT DETECTED
- **Defect Found**: While header brand title switches to `<span>` on child routes, the Lesson Detail view renders two `<h1>` elements simultaneously whenever educational Markdown content starts with `# Heading` (which is the case for seed/test lesson content).
- See **DEF-021-02** below.

### Point 18 & 19: Accessibility
- Semantic `<ol>` outline list, full keyboard navigation, high-contrast visible focus rings (`outline: 2px solid var(--primary)`), `aria-pressed` on filter pills, `aria-busy="true"` on loading states, and `role="alert"` on error banners.

### Point 20: Responsive Lesson View
- Reading column constrained to max width $720\text{px}$ (`.lesson-reading-column`).
- Responsive typography, word-break rules, and zero horizontal scrolling on narrow viewports.

### Point 21: API Error Sanitization
- Evaluated error rendering when backend errors contain internal details (SQL, stack traces, hostnames). UI displays generic sanitized error messages without leaking infrastructure details.

### Point 22: TanStack Query Behavior
- Query keys cleanly partitioned:
  - `["academy", "courses", params]`
  - `["academy", "course", slug]`
  - `["academy", "lesson", courseSlug, lessonSlug]`
- No cache collisions between different courses, lessons, or catalog filter parameters.

### Point 23: Logout / Auth Transition — EVIDENCE GAP
- See **GAP-021-01** below.

### Point 24: Dependency Review
- Dependencies installed:
  - `react-router-dom`: `^7.18.3`
  - `dompurify`: `^3.4.14` (ships native types; `@types/dompurify` correctly omitted)
  - `marked`: `^15.0.12` (ships native types)
- Package lockfile consistent; zero unnecessary backend dependencies added.

### Point 25: Sensitive Data Search
- Static grep confirmed zero usage of `localStorage`, `sessionStorage`, `document.cookie`, `console.log`, or hardcoded tokens in `apps/web/src/features/academy/`.

---

## 4. Defect Log

### DEF-021-01: Open Redirect Filter Bypass via URL-Encoded Backslashes, Double Encoding, and Control Characters
- **Defect ID**: `DEF-021-01`
- **Severity**: **P1 (Security Defect)**
- **Affected Acceptance Criteria**: AC-017, AC-014, QA Point 12
- **Exact Evidence**:
  In `apps/web/src/features/academy/utils/redirect-validator.ts`:
  ```typescript
  export function isValidInternalRedirect(path: string | null | undefined): boolean {
    if (!path || typeof path !== "string") return false;
    const trimmed = path.trim();
    if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) return false;
    if (trimmed.includes("\\")) return false;
    const protocolPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
    if (protocolPattern.test(trimmed.slice(1))) return false;
    return true;
  }
  ```
  When tested against required test vectors:
  1. `/%5C%5Cevil.example`: returns `true`, and `buildAuthRedirectUrl("/login", "/%5C%5Cevil.example")` yields `/login?redirect=%2F%255C%255Cevil.example`. In standard web browsers and server redirects, `%5C` normalizes to `\`, resolving to `/\evil.example` or `//evil.example` (scheme-relative external URL).
  2. `/%252F%252Fevil.example` (double-encoded): returns `true`.
  3. Control characters and newlines (`/path\nwith\nnewlines`, `/path\r\nSet-Cookie:evil=1`, `/path\x00nullbyte`): returns `true`, allowing CRLF and null-byte injection into redirect query parameters.
- **Security Impact**: High. Enables open redirect exploitation via craftily encoded return URLs in the learner authentication flow.
- **Required Fix**:
  1. Check for and reject control characters (`/[\x00-\x1f\x7f\s]/`).
  2. Safely decode URL percent-encoding (handling single and nested decoding) and verify that the decoded string does not contain `\\`, `//`, `/\`, or protocol identifiers before approving as a valid relative internal route.
- **Required Regression Test**:
  Add test assertions in `redirect-validator.test.ts` proving that `/%5C%5Cevil.example`, `/%252F%252Fevil.example`, `/path\nwith\nnewlines`, `/path\rwith\rreturns`, and `/path\x00nullbyte` all evaluate to `false` and fall back to `/academy`.

---

### DEF-021-02: Dual `<h1>` Elements Render Simultaneously on Lesson Detail View
- **Defect ID**: `DEF-021-02`
- **Severity**: **P2 (Accessibility Defect)**
- **Affected Acceptance Criteria**: AC-014, QA Point 17
- **Exact Evidence**:
  In `apps/web/src/features/academy/pages/LessonDetailPage.tsx:110`:
  The component renders the page's primary title as an `<h1>`:
  ```tsx
  <h1 id="lesson-main-heading" className="lesson-main-title">{lesson.title}</h1>
  ```
  Simultaneously, `LessonContent.tsx` renders `sanitizeLessonMarkdown(lesson.content)`. When lesson Markdown content begins with a level-1 heading (e.g. `# Budgeting Basics`, which is the standard format used by FEAT-020 seeds and test fixtures), `marked` outputs `<h1>Budgeting Basics</h1>` and `PURIFY_CONFIG.ALLOWED_TAGS` permits `h1`.
  Consequently, `document.querySelectorAll("h1")` returns 2 `<h1>` elements simultaneously on the lesson detail view, violating the strict "one `h1` per view" requirement.
- **Security Impact**: None. Accessibility heading hierarchy defect.
- **Required Fix**:
  Configure the Markdown rendering pipeline (e.g. via `marked` custom renderer / walkTokens or DOMPurify attribute/tag transformation) to shift Markdown heading levels down by one (e.g. `#` becomes `<h2>`, `##` becomes `<h3>`) so educational content headings nest under the page's primary `<h1>` (`lesson.title`), or disallow `h1` in `PURIFY_CONFIG.ALLOWED_TAGS`.
- **Required Regression Test**:
  Add an integration test in `LessonDetailPage.test.tsx` verifying that when `lesson.content` begins with `# Markdown Heading`, `container.querySelectorAll("h1").length === 1`.

---

## 5. Evidence Gaps

### GAP-021-01: Client-Side Logout Query Cache Invalidation
- **Area**: QA Point 23
- **Description**: `apps/web` does not yet possess an integrated client-side authentication provider or logout action (backend auth APIs exist, but client-side session management UI is scheduled for a future feature). Therefore, automated browser verification that authenticated lesson content in TanStack Query cache is purged upon logout could not be executed in the FEAT-021 environment.
- **Status**: Documented evidence gap.

---

## 6. Acceptance Criteria Evaluation (AC-001..AC-017)

| AC | Description | Result | Notes |
| :--- | :--- | :---: | :--- |
| **AC-001** | Scope Integrity (Frontend only, zero backend/db/migration changes) | **PASS** | Verified via `git diff` and static guards |
| **AC-002** | Contract Fidelity (Consumes FEAT-020 REST APIs with exact DTOs) | **PASS** | `AcademyApiClient` consumes only 3 approved endpoints |
| **AC-003** | Course Catalog Screen (1/2/3 col grid, level badge, lessonCount) | **PASS** | Verified in `CourseCatalogPage.test.tsx` and CSS |
| **AC-004** | Level Filtering & Pagination (All/Beginner/Inter/Adv, page reset) | **PASS** | Verified in `CourseCatalogPage.test.tsx` |
| **AC-005** | Course Detail & Syllabus Outline (Derived lessonCount) | **PASS** | Verified in `CourseDetailPage.test.tsx` |
| **AC-006** | Course 404 Indistinguishability (Generic unavailable message) | **PASS** | Verified in `CourseDetailPage.test.tsx` |
| **AC-007** | Lesson Detail Authenticated View (Dual-query orchestration) | **PASS** | Verified in `LessonDetailPage.test.tsx` |
| **AC-008** | Lesson 401 Auth-Required Handling (In-place card with returnUrl) | **PASS** | Verified in `LessonDetailPage.test.tsx` |
| **AC-009** | Lesson 404 Indistinguishability (Generic lesson unavailable message)| **PASS** | Verified in `LessonDetailPage.test.tsx` |
| **AC-010** | Intra-Course Lesson Navigation & Outline Fallback (Adjacent array) | **PASS** | Verified with non-contiguous orders 10, 20, 40 |
| **AC-011** | XSS Mitigation & Sanitized Rendering Boundary (DOMPurify final) | **PASS** | 15 concrete attack vectors proven neutralized |
| **AC-012** | Zero Sensitive DTO Leakage (No UUIDs, quiz answers, timestamps) | **PASS** | DOM inspection confirmed zero leaked fields |
| **AC-013** | Explicit Async UI States (Loading, success, empty, error) | **PASS** | All states implemented and tested |
| **AC-014** | Accessibility Baseline (Single h1 per view, keyboard, focus) | **FAIL** | Failed due to dual `<h1>` elements on lesson view (**DEF-021-02**) |
| **AC-015** | Responsive Baseline (1/2/3 col, 720px reading column, no overflow)| **PASS** | Verified across breakpoints |
| **AC-016** | Monorepo Regression (All 14 validation commands pass) | **PASS** | All 14 commands green across all workspaces |
| **AC-017** | Safe Internal Redirect & Open-Redirect Immunity | **FAIL** | Failed due to encoded backslash/control char bypass (**DEF-021-01**) |

---

---

## 7. Historical QA Iteration 1 Verdict (Archive)

- **Historical Verdict**: **FAIL (Iteration 1)**
- **Historical Governance State**: **IMPLEMENTED / QA FAILED**
- **Remediation Triggered**: Implementation owner addressed `DEF-021-01` and `DEF-021-02` in Rework Iteration 1.

---

## 8. QA Iteration 2 (Re-Verification & Comprehensive Evaluation)

Independent QA Iteration 2 was conducted to re-verify the remediated defects, evaluate security regression around them, inspect canonical acceptance criteria, and execute the full monorepo validation suite.

### 8.1. DEF-021-01 Re-Verification (Open Redirect Hardening) — **FIXED VERIFIED**

- **Source File**: `apps/web/src/features/academy/utils/redirect-validator.ts`
- **Verification Details**:
  1. **Raw Control Character Rejection**: Verified `CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f]/` rejects raw control characters (`\n`, `\r`, `\t`, `\x00`) immediately before trimming or further processing.
  2. **Bounded Safe Percent-Decoding**: Verified `decodeURIComponent` executes for a maximum of 2 rounds. Malformed percent sequences (`/%`, `/%2`, `/%E0%A4%A`) throw `URIError` and immediately fail safe (`return false`).
  3. **Multi-Stage Invariant Enforcement**:
     - Begins with exactly one `/` and not with `//` or `/\`.
     - Contains no literal `\` or encoded backslashes (`%5c`, `%5C`).
     - Contains no encoded slashes (`%2f`, `%2F`).
     - Contains no encoded control characters (`%00`–`%1f`, `%7f`).
     - Contains no URI scheme pattern (`^[a-zA-Z][a-zA-Z0-9+.-]*:`).
  4. **Synthetic Trusted Origin Resolution**: Verified candidate resolution via `new URL(normalized, "http://localhost.localdomain")`, asserting `resolved.origin === "http://localhost.localdomain"` and `resolved.pathname.startsWith("/")`.
  5. **Deterministic Fallback**: `buildAuthRedirectUrl` validates candidate internally first, falling back to `/academy` whenever validation fails, before producing `?redirect=...`.
  6. **Encoding Depth Evaluation**:
     - 0 rounds (clean `/academy`): Accepted (`true`).
     - 0 rounds (raw `//evil.example`, `/\evil.example`): Rejected (`false`), fallback `/academy`.
     - 1 round (`/%2F%2Fevil.example`, `/%5C%5Cevil.example`): Rejected (`false`), fallback `/academy`.
     - 2 rounds (`/%252F%252Fevil.example`, `/%255C%255Cevil.example`): Rejected (`false`), fallback `/academy`.
     - >2 rounds (triple `%25252F%25252F`): Rejected (`false`), fallback `/academy`.
     - >2 rounds (quad `%2525252F...`): Remains an application-internal path on `http://localhost.localdomain` and never leaves origin.
  7. **Positive Cases Verified**: `/academy`, `/academy/courses/foo`, `/academy/courses/foo/lessons/bar`, `/academy?page=2` remain strictly valid (`true`).
  8. **Negative Cases Verified (44/44 in test suite)**: All required vectors (`https://evil.example`, `http://evil.example`, `ftp://evil.example`, `//evil.example`, `/\evil.example`, `\\evil.example`, `javascript:alert(1)`, `data:text/html,...`, `vbscript:evil`, encoded slash/backslash, CRLF, null bytes, whitespace attacks, malformed encodings) evaluate to `false` and generate fallback `/academy`.

### 8.2. DEF-021-02 Re-Verification (Heading Hierarchy Normalization) — **FIXED VERIFIED**

- **Source File**: `apps/web/src/features/academy/utils/markdown-sanitizer.ts`
- **Verification Details**:
  1. **Parser Token Transformation**: `markedInstance.use({ walkTokens })` intercepts heading tokens and transforms `token.depth = Math.min(6, token.depth + 1)`:
     - `# Heading` $\to$ `<h2>`
     - `## Heading` $\to$ `<h3>`
     - `### Heading` $\to$ `<h4>`
     - `#### Heading` $\to$ `<h5>`
     - `##### Heading` $\to$ `<h6>`
     - `###### Heading` $\to$ `<h6>` (clamped at `<h6>`)
  2. **Sanitizer Allowlist Boundary**: `"h1"` is completely removed from `PURIFY_CONFIG.ALLOWED_TAGS`. DOMPurify permits only `["h2", "h3", "h4", "h5", "h6", "p", ...]`.
  3. **DOM Inspection on LessonDetailPage**: Verified via Vitest in `LessonDetailPage.test.tsx`:
     - `document.querySelectorAll("h1").length === 1` when lesson content begins with `# Markdown Heading`.
     - The single `<h1>` is verified to be the page-level lesson title (`lesson.title`).
     - `# Markdown Heading` is verified rendered as `<h2>`.
  4. **Raw HTML Injection Bypass**: Tested `<h1>Injected Heading</h1>` and mixed Markdown + raw HTML; raw `<h1>` is stripped in parser and rejected by DOMPurify allowlist. Zero secondary `<h1>` elements reach the DOM.

### 8.3. XSS Regression Verification (AC-011) — **PASS**

- **Sanitizer Security Boundary**: Tested against 15 concrete attack payloads:
  - `<script>alert("XSS")</script>`: Neutralized.
  - `<img src="invalid.jpg" onerror="alert('pwned')" />`: Neutralized.
  - `<b onmouseover="...">`, `<button onclick="...">`: Neutralized.
  - `<a href="javascript:...">`, `[click](javascript:...)`: Neutralized.
  - `[data](data:text/html;base64,...)`: Neutralized.
  - `[vbscript](vbscript:...)`: Neutralized.
  - `<iframe>`, `<form>`, `<input>`, `<style>`: Completely stripped.
  - `<svg onload="...">`, `<math>`: Completely stripped.
  - Malformed and nested HTML tags: Stripped.
- `dangerouslySetInnerHTML` occurs in exactly ONE isolated location: `LessonContent.tsx:31`, taking direct sanitized output from `sanitizeLessonMarkdown`. Zero unsanitized paths exist in `apps/web`.

### 8.4. Canonical Acceptance Criteria Re-Evaluation

| Criterion | Description | Iteration 1 | Iteration 2 | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **AC-001** | Scope Integrity (Frontend only) | PASS | **PASS** | `apps/api` untouched; 0 backend changes |
| **AC-002** | Contract Fidelity (FEAT-020 REST APIs) | PASS | **PASS** | Pure consumer of approved endpoints |
| **AC-003** | Course Catalog Screen (1/2/3 col, cards) | PASS | **PASS** | Verified in `CourseCatalogPage.test.tsx` |
| **AC-004** | Level Filtering & Pagination | PASS | **PASS** | Page reset and bounded pagination pass |
| **AC-005** | Course Detail & Syllabus Outline | PASS | **PASS** | Derived lesson count verified |
| **AC-006** | Course 404 Indistinguishability | PASS | **PASS** | No draft/archived status leakage |
| **AC-007** | Lesson Detail Authenticated View | PASS | **PASS** | Dual-query orchestration verified |
| **AC-008** | Lesson 401 Auth-Required Handling | PASS | **PASS** | Verified with hardened returnUrl |
| **AC-009** | Lesson 404 Indistinguishability | PASS | **PASS** | Generic unavailable message verified |
| **AC-010** | Intra-Course Lesson Navigation | PASS | **PASS** | Adjacent array navigation with non-contiguous orders |
| **AC-011** | XSS Mitigation & Sanitized Boundary | PASS | **PASS** | Re-verified across all attack vectors |
| **AC-012** | Zero Sensitive DTO Leakage | PASS | **PASS** | DOM inspection confirmed clean |
| **AC-013** | Explicit Async UI States | PASS | **PASS** | Loading, empty, error, auth-required pass |
| **AC-014** | FEAT-021 Accessibility Baseline | FAIL | **PASS** | **Remediated via DEF-021-02** (single h1 per view verified) |
| **AC-015** | Responsive Baseline | PASS | **PASS** | Verified across mobile, tablet, desktop |
| **AC-016** | Monorepo Regression (14 commands) | PASS | **PASS** | All 14 scripts green across workspaces |
| **AC-017** | Safe Internal Redirect Protection | FAIL | **PASS** | **Remediated via DEF-021-01** (hardened redirect validator) |

### 8.5. Evidence Gaps

- **GAP-021-01: Client-Side Logout Query Cache Invalidation**:
  - **Status**: **OPEN / NON-BLOCKING EVIDENCE GAP**
  - **Assessment**: Frontend session management / logout handler is not within FEAT-021 scope. In accordance with governance, no implementation was fabricated. GAP-021-01 remains open and non-blocking for FEAT-021.

### 8.6. Scope Boundary Confirmation

- `git diff HEAD -- apps/api`: Completely empty.
- Prisma schema and PostgreSQL migrations: Untouched.
- Redis behavior and backend tests: Untouched.
- **FEAT-022**: Strictly **NOT_STARTED / BLOCKED**.

### 8.7. Monorepo Validation Execution Evidence (Iteration 2)

| Validation Command | Status | Actual Executed Count | Notes / Evidence |
| :--- | :---: | :--- | :--- |
| `npm run clean` | **PASS** | Monorepo-wide | Dist folders cleaned |
| `npm run lint` | **PASS** | Monorepo-wide | 0 errors, 0 warnings |
| `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Backend schema | Prisma schema valid |
| `npm run typecheck` | **PASS** | Monorepo-wide | 0 TypeScript compilation errors |
| `npm run build` | **PASS** | Monorepo-wide | Shared, API, and Web bundles compiled in 6.36s |
| `npm run test` (standard) | **PASS** | **62 files / 602 tests** | API: 53/496, Web: 8/86, Shared: 1/20. 0 failures |
| `npm run test:unit` | **PASS** | **41 files / 456 tests** | API: 33/351, Web: 7/85, Shared: 1/20. 0 failures |
| `npm run test:db` (PostgreSQL) | **PASS** | **13 files / 113 tests** | Full live PostgreSQL integration suite passes |
| `npm run test:redis` (Redis) | **PASS** | **5 files / 50 tests** | Live Redis rate-limit and boundary suite passes |
| `npm run guard:persistence` | **PASS** | 1 file / 14 tests | Persistence boundary integrity verified |
| `npm run guard:migration` | **PASS** | 4 migrations | Exactly 4 migrations; 24 review risks; 0 blocking risks |
| `npm run guard:boundary` | **PASS** | Static AST guard | controllers=7, services=11, repositories=6 |
| `npm run guard:audit-governance` | **PASS** | Static AST guard | Zero premature product audit schemas/models |
| `npm run guard:seed-safety` | **PASS** | Static AST guard | Zero unsafe seed scripts or admin backdoors |

---

## 9. Final QA Verdict & Governance Status (Iteration 2)

- **QA Iteration 2 Verdict**: **PASS**
- **DEF-021-01**: **FIXED VERIFIED**
- **DEF-021-02**: **FIXED VERIFIED**
- **GAP-021-01**: **OPEN / NON-BLOCKING**
- **FEAT-021 Governance State**: **DONE**
- **Human Final Gate**: **APPROVED**
- **FEAT-022**: **UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)**
- **Phase 4**: **IN_PROGRESS**

