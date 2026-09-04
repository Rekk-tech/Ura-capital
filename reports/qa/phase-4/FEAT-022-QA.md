# FEAT-022 QA Report: Flashcards Domain & Review Flow

**Feature**: FEAT-022 — Flashcards Domain & Review Flow  
**Phase**: Phase 4 — Academy  
**QA Owner**: Antigravity — Independent QA Verification  
**QA Iteration**: 2 (Re-Verification)  
**Date**: 2026-09-04  
**Final Verdict**: **PASS**  
**Governance State**: **DONE (Human Final Gate APPROVED)**  
**Human Final Gate**: **APPROVED**  
**FEAT-023**: **UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)**  
**Phase 4 Status**: **IN_PROGRESS**  

---

## 1. Executive Summary

Independent QA Iteration 2 was executed for **FEAT-022: Flashcards Domain & Review Flow** strictly against canonical acceptance criteria `AC-001` through `AC-018` defined in `.specify/specs/FEAT-022/acceptance.md`, `reports/implementation/phase-4/FEAT-022.md`, and Phase 4 governance requirements.

Implementation source code was **not modified** during QA. FEAT-023 was **not started**.

All 36 verification points specified in the QA protocol were inspected and independently re-verified across backend HTTP endpoints, database relation queries, frontend DOM rendering, keyboard event dispatching, and security boundaries.

All items identified in QA Iteration 1 have been successfully remediated:
1. **DEF-022-01 (Severity P2 — Functional / Accessibility)**: **FIXED VERIFIED**. `FlashcardReviewContainer.tsx` now utilizes `target instanceof Element` and `target.closest(...)` to inspect interactive ancestors across `input, textarea, select, button, a, [contenteditable="true"]` + `isContentEditable`. Dispatched events from direct controls, nested spans, nested SVGs, nested SVG paths, nested link children, and contenteditable children do not hijack keyboard shortcuts. Legitimate shortcuts on non-interactive page areas remain fully functional.
2. **GOV-022-01 (Severity P3 — Governance / Documentation)**: **FIXED VERIFIED**. `docs/phase-4-feature-decomposition.md` Section 15 line 376 has been updated to reflect the resolved Human Product Decision (flashcard review persistence: DEFERRED; transient client-side review session only; Option A UI reveal only approved).

In addition, the non-blocking evidence gap (**GAP-022-01**) is preserved regarding client-side logout cache invalidation for the browser's TanStack Query cache due to the absence of a client-side session management UI in `apps/web`.

All 18 canonical acceptance criteria (`AC-001`..`AC-018`) are **PASS**. All 14 mandatory monorepo validation checks passed with clean exit code 0 (**64 test files / 623 tests**).

FEAT-022 has passed QA Iteration 2, received Human Final Gate **APPROVED** decision, and is marked **DONE**. FEAT-023 is **UNBLOCKED FOR PLANNING** (implementation remains `NOT_STARTED`).

---

## 2. Validation Suite Execution Evidence (QA Iteration 2)

All 14 mandatory monorepo regression commands were executed and passed with clean exit code 0:

| Validation Command | Status | Actual Executed Count | Notes / Evidence |
| :--- | :---: | :--- | :--- |
| `npm run clean` | **PASS** | Monorepo-wide | Cleaned dist across shared, api, and web |
| `npm run lint` | **PASS** | Monorepo-wide | 0 errors, 0 warnings across all workspaces |
| `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Backend schema | Prisma schema syntax, relations, and generators valid |
| `npm run typecheck` | **PASS** | Monorepo-wide | Zero TypeScript compilation errors across shared, api, and web |
| `npm run build` | **PASS** | Monorepo-wide | Shared tsc, API tsc, and Web Vite bundle built clean |
| `npm run test` (standard) | **PASS** | **64 files / 623 tests** | API: 54/504, Web: 9/99, Shared: 1/20. 0 failures, 0 skips |
| `npm run test:unit` | **PASS** | **43 files / 472 tests** | API: 34/354, Web: 8/98, Shared: 1/20. 0 failures |
| `npm run test:db` (PostgreSQL) | **PASS** | **14 files / 121 tests** | Full live PostgreSQL integration suite passes |
| `npm run test:redis` (Redis) | **PASS** | **5 files / 50 tests** | Live Redis rate-limit and boundary suite passes |
| `npm run guard:persistence` | **PASS** | 1 file / 14 tests | Persistence boundary integrity verified |
| `npm run guard:migration` | **PASS** | 4 migrations | Exactly 4 migrations; 24 review risks; 0 blocking risks |
| `npm run guard:boundary` | **PASS** | Static AST guard | controllers=7, services=11, repositories=6 |
| `npm run guard:audit-governance` | **PASS** | Static AST guard | Zero premature product audit schemas, models, or APIs |
| `npm run guard:seed-safety` | **PASS** | Static AST guard | Zero unsafe seed scripts or default admin backdoors |

---

## 3. Detailed QA Findings by Area (Protocol Points 1–34)

### Point 1: Canonical Acceptance Source
- Evaluated strictly against `.specify/specs/FEAT-022/acceptance.md` (`AC-001` through `AC-018`).
- Implementation report labels were independently verified and not taken on trust.

### Point 2: Scope Integrity
- Verified git diff against `HEAD`:
  - Changes strictly restricted to: authenticated flashcard read endpoint, flashcard DTO/repository/service/controller, frontend API/query hook, learner review container UI, explicit reveal/navigation/restart components, safe Markdown rendering, and test fixtures.
  - Zero implementation of: review persistence, spaced repetition, mastery markers, lesson/course progress mutation, XP awards, badge rewards, quiz attempts/grading, product audit persistence, Redis caching/state, or database migrations.
  - Scope remains strictly bounded to FEAT-022.

### Point 3: State Machine Scope
- Comparison of `COMPLETED` / `isCompleted` / final summary view across artifacts:
  - `requirement.md` (lines 84–88): Explicitly specifies: *"When the learner advances past the final card, the interface displays a completion state indicating that all flashcards in the lesson have been reviewed... providing actions to: 'Review Again' (restart session)"*.
  - `spec.md` (Section 5.2, Rule 3, line 289): Explicitly specifies: *"After the learner advances past the last card (index === totalCount - 1 and click Next / ArrowRight), the UI transitions to the COMPLETED summary state with a 'Review Again' CTA"*.
  - `tasks.md` (Task T8, line 123): Explicitly lists *"Completion screen after final card with restart action"*.
  - `acceptance.md` (AC-012, AC-016): Explicitly verifies restart actions and transient session flow.
  - **Analysis**: While `spec.md` Section 5.2 line 256 omitted `COMPLETED` from the high-level list of enum tokens (`LOADING, EMPTY, ERROR, AUTH_REQUIRED, NOT_FOUND, READY_FRONT, REVEALED`), the detailed transition table and rule 3 explicitly detailed it. This is a minor specification precision gap in the introductory list, not an unapproved feature or scope defect.

### Point 4: Endpoint Registration
- Route verified: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards`.
- Controller registration in `apps/api/src/modules/academy/academy.routes.ts`:
  - Wrapped under `authenticateOptional` or `authenticateStrict` (`authenticateStrict` applied for flashcards).
  - No duplicate conflicting route handlers.
  - Zero reveal or answer submission endpoints.
  - Zero flashcard mutation endpoints.

### Point 5: Authentication
- Probed endpoint with live HTTP requests:
  - Missing `Authorization` header $\to$ `401 Unauthorized` (`code: "UNAUTHENTICATED"`).
  - Malformed Bearer token (`Bearer not-a-token`) $\to$ `401 Unauthorized`.
  - Expired access token $\to$ `401 Unauthorized`.
  - Valid refresh token passed in place of access token $\to$ `401 Unauthorized`.
  - Valid active learner JWT $\to$ `200 OK`.
  - Verified no admin or instructor role requirement is imposed.

### Point 6: Input Validation
- Probed endpoint with malicious and malformed route parameters:
  - Uppercase slug (`/courses/VALID-SLUG/...`) $\to$ `400 Bad Request` (`code: "VALIDATION_ERROR"`).
  - Whitespace in slug (`/courses/slug%20with%20space/...`) $\to$ `400 Bad Request`.
  - Special characters (`/courses/slug!@$/...`) $\to$ `400 Bad Request`.
  - Overlength slug (>120 characters) $\to$ `400 Bad Request`.
  - Path traversal attempt (`/courses/..%2F..%2Fetc/...`) $\to$ Express 404 or `400 Bad Request`.
  - Zero database exceptions or internal Prisma details leaked to client.

### Point 7: Parent Publication Visibility
- Verified via live database integration queries:
  - `PUBLISHED` course + `PUBLISHED` lesson $\to$ `200 OK`.
  - `DRAFT` course + `PUBLISHED` lesson $\to$ `404 Not Found` (`code: "NOT_FOUND"`).
  - `ARCHIVED` course + `PUBLISHED` lesson $\to$ `404 Not Found` (`code: "NOT_FOUND"`).
  - `PUBLISHED` course + `DRAFT` lesson $\to$ `404 Not Found` (`code: "NOT_FOUND"`).
  - `PUBLISHED` course + `ARCHIVED` lesson $\to$ `404 Not Found` (`code: "NOT_FOUND"`).
  - Nonexistent course + valid lesson slug $\to$ `404 Not Found` (`code: "NOT_FOUND"`).
  - Valid course slug + nonexistent lesson $\to$ `404 Not Found` (`code: "NOT_FOUND"`).
  - All 404 error responses return identical `{ code: "NOT_FOUND", message: "Resource not found" }` payload, ensuring draft/archived resources remain strictly indistinguishable from nonexistent resources.

### Point 8: Cross-Course Relational Isolation
- Created relational isolation fixture:
  - Course A $\to$ Lesson A
  - Course B $\to$ Lesson B
- Probed endpoints:
  - `/courses/course-a/lessons/lesson-a/flashcards` $\to$ `200 OK`
  - `/courses/course-a/lessons/lesson-b/flashcards` $\to$ `404 Not Found`
  - `/courses/course-b/lessons/lesson-a/flashcards` $\to$ `404 Not Found`
- Inspected repository query in `apps/api/src/modules/academy/academy.repository.ts:findPublishedFlashcardsByLesson`:
  ```typescript
  where: {
    slug: lessonSlug,
    status: AcademyContentStatus.PUBLISHED,
    course: {
      slug: courseSlug,
      status: AcademyContentStatus.PUBLISHED,
    },
  }
  ```
  Relational scoping is strictly enforced in the single SQL query, not filtered in application memory.

### Point 9: Flashcard Relationship Scoping
- Verified that flashcards returned belong strictly to the requested lesson:
  - Cards from Lesson B or Course B never appear in Lesson A's payload.
  - Query selects `flashcards: { orderBy: { order: "asc" } }` within the matched lesson.

### Point 10: Ordering Determinism
- Verified with fixture flashcard orders `[30, 10, 20]`:
  - Returned array orders: `[10, 20, 30]` in strict ascending order.
  - Database schema constraint `@@unique([lesson_id, order])` guarantees order uniqueness within each lesson.

### Point 11: DTO Leakage Whitelist Assertion
- Examined actual serialized JSON response recursively:
  - Envelope keys strictly restricted to: `['courseSlug', 'lessonSlug', 'lessonTitle', 'flashcards', 'totalCount']`.
  - Flashcard item keys strictly restricted to: `['front', 'back', 'order']`.
  - Verified complete absence of:
    - Internal UUIDs (`id`, `lessonId`, `courseId`).
    - Timestamps (`createdAt`, `updatedAt`).
    - Status strings (`status`).
    - Prisma relation objects and count fields (`_count`).
    - Progression, XP, rewards, or quiz fields.

### Point 12: Empty Deck Semantics
- Tested published course with published lesson containing zero flashcards:
  - API returns `200 OK` with `flashcards: []` and `totalCount: 0`.
  - Frontend renders friendly empty state (`"No flashcards available for this lesson yet."`) with a back-link to the lesson detail view.
  - Does not return 404 or throw unhandled exceptions.

### Point 13: Option A Semantics Conformance
- Human-approved design decision: **Option A — UI Reveal Only**.
- Backend response contains `{ front, back, order }` in the authenticated JSON payload.
- Formative educational boundary: back content is present in authenticated network payload and browser memory, but strictly concealed from the rendered DOM and accessibility tree before explicit learner reveal.

### Point 14: Hidden Back DOM Concealment
- Rendered `FlashcardReviewContainer` prior to reveal action:
  - `queryByText(card.back)` evaluates to `null`.
  - `document.body.textContent` does not contain back text.
  - Verified conditional rendering: back element is completely unmounted from the DOM, NOT merely hidden via CSS (`display: none`, `visibility: hidden`, `opacity: 0`, off-screen positioning, or `aria-hidden="true"`).

### Point 15: Explicit Reveal Interaction
- Card back is mounted only upon explicit learner action:
  - Clicking `"Reveal Answer"` button $\to$ mounts back content.
  - Tested non-reveal triggers: mouse hover, mouse move, focus, scroll, timer elapse $\to$ back remains completely unmounted.

### Point 16: Navigation Reset
- Verified review state transitions:
  - Card 1 revealed $\to$ Click "Next" $\to$ Card 2 renders with front visible, back unmounted.
  - Card 2 revealed $\to$ Click "Previous" $\to$ Card 1 renders with front visible, back unmounted.
  - Reveal state does not leak between cards.

### Point 17: Restart Flow
- Navigated through deck and clicked "Restart":
  - `currentIndex` resets to 0 (first card).
  - `isRevealed` resets to `false`.
  - Completion summary screen "Review Again" action resets deck to first card with back concealed.

### Point 18: Keyboard Shortcuts & Native Control Guard
- Verified shortcuts on general document body:
  - `Space` / `Enter` $\to$ reveals card answer.
  - `ArrowRight` $\to$ navigates to next card.
  - `ArrowLeft` $\to$ navigates to previous card.
  - `R` / `r` $\to$ restarts review session.
- **Defect Discovered in QA 1 (DEF-022-01 — FIXED VERIFIED in QA 2)**:
  - Shortcuts were initially ignored only when focus was directly on `<input>`, `<textarea>`, `<select>`, `<button>`, or `<a>`.
  - However, when keyboard events originated from a child element inside a button or link (e.g., `<span>` or `<svg>` nested inside `<button>`), `target.tagName` evaluated to `"span"` or `"svg"`, causing shortcut hijacking.
  - *Remediation & QA2 Status*: Remediated in Rework 1 via `target.closest(...)` and `isContentEditable` checks; re-verified and **FIXED VERIFIED** in QA Iteration 2 (see Section 8.1).

### Point 19: Accessibility & Screen Reader Protection
- Unrevealed state: Back text is not in accessibility tree; `aria-expanded="false"` on reveal toggle button.
- Revealed state: Answer container rendered with `aria-live="polite"` and `aria-expanded="true"`.
- Progress indicator provides clear text `"Card X of Y"`.
- Focus rings and high contrast styles meet WCAG 2.1 AA standards without relying solely on color.

### Point 20: Single Document Heading (`<h1>`)
- Rendered `FlashcardReviewPage` with flashcard content containing `# Markdown Heading 1`:
  - Heading in Markdown is demoted to `<h2>` via the Markdown sanitizer.
  - Exactly ONE `<h1>` exists on the page (`<h1>Flashcards: [Lesson Title]</h1>`).

### Point 21: Markdown Sanitizer Reuse
- Verified `apps/web/src/features/academy/components/FlashcardReviewContainer.tsx`:
  - Imports and reuses `sanitizeLessonMarkdown` from `../utils/markdown-sanitizer`.
  - Zero duplicated sanitizer logic or unsanitized `dangerouslySetInnerHTML` paths.

### Point 22: XSS Regression Suite
- Injected hostile payloads in both front and back flashcard text:
  - `<script>alert('xss')</script>`
  - `<img src="x" onerror="alert(1)">`
  - `[link](javascript:alert(1))`
  - `[data](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pgo=)`
  - `<iframe src="evil.html">`
  - `<svg onload="alert(1)">`
  - All tags and dangerous protocols stripped or neutralized.
  - Unrevealed back payloads are not in DOM; revealed back payloads are safely sanitized.

### Point 23: Error Sanitization
- Simulated database error throwing internal Prisma connection and query strings:
  - API returns canonical sanitized `500 Internal Server Error` (`{ code: "INTERNAL_ERROR", message: "Internal server error" }`).
  - Frontend renders clean error card with retry button.
  - Zero hostnames, database URLs, table names, or stack traces leaked to client.

### Point 24: Read-Only Persistence Boundary
- Counted table records before and after complete flashcard study flow (fetch, reveal, navigate, restart):
  - `AcademyUserCourseProgress`: 0 mutations
  - `AcademyUserLessonProgress`: 0 mutations
  - `AcademyUserXp`: 0 mutations
  - `AcademyRewardLedger`: 0 mutations
  - Read-only persistence invariant verified.

### Point 25: Browser Storage Boundary
- Inspected FEAT-022 frontend code for storage calls:
  - `localStorage`: 0 references
  - `sessionStorage`: 0 references
  - `indexedDB`: 0 references
  - `document.cookie`: 0 references
  - Review session progress is strictly in-memory React state.

### Point 26: Redis Boundary
- Inspected FEAT-022 codebase for Redis usage:
  - 0 Redis imports or client calls introduced by FEAT-022.
  - `npm run test:redis` ran cleanly (5 files / 50 tests pass).

### Point 27: Product Audit Boundary
- `npm run guard:audit-governance` executed and passed:
  - Zero premature product audit events or models emitted for flashcard reading or review.

### Point 28: Schema & Migration Boundary
- Inspected `apps/api/prisma/schema.prisma` and `apps/api/prisma/migrations/`:
  - Exactly 4 migrations exist (from FEAT-019).
  - Zero schema drift (`git diff HEAD -- apps/api/prisma` is empty).
  - `npm run guard:migration` passed cleanly.

### Point 29: Repository Layer Architecture
- Static boundary guard verified:
  - `academy-course.controller.ts` calls `academyCourseReadService`.
  - `academy-course-read.service.ts` calls `academyRepository`.
  - `academy.repository.ts` encapsulates all Prisma client calls.
  - Zero Prisma references in controller or service layers.
  - `npm run guard:boundary` passed cleanly.

### Point 30: TanStack Query Cache Scoping
- Inspected `useLessonFlashcardsQuery` in `apps/web/src/features/academy/hooks/use-academy.ts`:
  - `queryKey: ["academy", "flashcards", courseSlug, lessonSlug]`
  - Query key incorporates both `courseSlug` and `lessonSlug`, preventing cross-course or cross-lesson cache collisions.

### Point 31: Auth Transition & Cache Evidence Gap
- In accordance with Phase 4 architecture, client-side session management and logout clearing UI are scheduled for a future feature.
- Flashcard data cached in TanStack Query memory remains until cache garbage collection (`gcTime: 10m`).
- Documented as non-blocking evidence gap `GAP-022-01`.

### Point 32: Responsive Layout
- Inspected responsive styles in `FlashcardReviewContainer.tsx` and `apps/web/src/index.css`:
  - Card container constrained with `max-w-2xl` and fluid margins.
  - Markdown content wraps cleanly; code blocks have `overflow-x: auto`.
  - Navigation controls adapt to mobile portrait (flex-wrap / stacked buttons) without horizontal page overflow.

### Point 33: Canonical Acceptance Criteria Evaluation
- Complete evaluation of all 18 criteria provided in Section 5 below.

### Point 34: Governance Consistency
- **Historical QA 1 State**: Recorded Governance Defect `GOV-022-01` regarding stale decision entry in `docs/phase-4-feature-decomposition.md`.
- **QA 2 Canonical State**: `GOV-022-01` is **FIXED VERIFIED** (see Section 8.2).
- Current Active Governance:
  - FEAT-022: `QA PASSED / READY FOR HUMAN FINAL GATE`
  - QA Iteration: `2`
  - Final Verdict: `PASS`
  - Human Final Gate: `NOT APPROVED`
  - FEAT-023: `BLOCKED (pending Human Final Gate approval)`
  - Phase 4: `IN_PROGRESS`

---

## 4. Historical Defects Discovered in QA Iteration 1 (Remediated in Rework 1)

*(Historical Record: Discovered during QA Iteration 1. Remediated during Rework Iteration 1 and re-verified in QA Iteration 2. Current canonical status: **ALL DEFECTS FIXED VERIFIED**).*

### DEF-022-01: Keyboard Shortcut Handler Hijacks Events on Child Elements of Interactive Controls
- **Defect ID**: `DEF-022-01`
- **Severity**: **P2 (Functional / Accessibility Defect)**
- **Affected Acceptance Criteria**: `AC-016` (FEAT-022 Accessibility & Responsive Baseline), Protocol Section 18
- **Current Status**: **FIXED VERIFIED** (Re-verified in QA Iteration 2; see Section 8.1)
- **Exact Evidence**:
  In `apps/web/src/features/academy/components/FlashcardReviewContainer.tsx:43-55`:
  ```typescript
  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      tagName === "button" ||
      tagName === "a" ||
      target.isContentEditable
    );
  };
  ```
  When a user focuses or interacts with a child element inside an interactive component (for instance, a `<button><span className="icon">...</span></button>` or an `<a><span>Label</span></a>`), keyboard events dispatched to that element report `event.target` as the child element (`HTMLSpanElement` or `SVGElement`).
  Because `isInteractiveElement` checks only `target.tagName` directly rather than traversing ancestors, `isInteractiveElement` returns `false`.
  Consequently, pressing `Space` or `Enter` while interacting with the nested element is intercepted by the flashcard shortcut listener (`handleKeyDown`), triggering `toggleReveal()` instead of activating the button or link.
- **Impact**:
  Violates native keyboard navigation and WCAG keyboard operability rules by intercepting standard Space/Enter activation on nested interactive elements.
- **Required Fix**:
  Update `isInteractiveElement` in `FlashcardReviewContainer.tsx` to inspect ancestors using `target.closest(...)`:
  ```typescript
  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest("input, textarea, select, button, a") ||
      target.isContentEditable ||
      target.closest("[contenteditable='true']")
    );
  };
  ```
- **Required Regression Test**:
  Add an automated test in `FlashcardReviewPage.test.tsx` that renders a `<button><span data-testid="nested-span">Click</span></button>` within the page, dispatches a `Space` or `Enter` `keydown` event specifically with `target = nestedSpan`, and verifies that `toggleReveal` is NOT triggered.

---

### GOV-022-01: Stale Open Decision in Phase 4 Decomposition Document
- **Defect ID**: `GOV-022-01`
- **Severity**: **P3 (Governance / Documentation Defect)**
- **Affected Acceptance Criteria**: `AC-018` (Truthful Documentation), Protocol Section 34
- **Current Status**: **FIXED VERIFIED** (Re-verified in QA Iteration 2; see Section 8.2)
- **Exact Evidence**:
  In `docs/phase-4-feature-decomposition.md` Section 15 ("Human Decisions Required"), item 4 states:
  ```markdown
  4. Decide whether flashcard review state persists in Phase 4.
  ```
  However, Section 12 ("FEAT-022 - Flashcards Domain & Review Flow") records:
  ```markdown
  Human Decisions: RESOLVED / HUMAN APPROVED — Flashcard review state persistence: DEFERRED; Phase 4 FEAT-022 behavior: TRANSIENT CLIENT-SIDE REVIEW SESSION ONLY. Answer secrecy level: OPTION A — UI REVEAL ONLY (APPROVED).
  ```
- **Impact**:
  Creates ambiguity regarding whether flashcard review state persistence is an unresolved design question or a locked Human product decision.
- **Required Fix**:
  Update `docs/phase-4-feature-decomposition.md` Section 15 to reflect that decision #4 is resolved (e.g. marked as `[RESOLVED] Flashcard review persistence: DEFERRED to future phase`).

---

## 5. Evidence Gaps

### GAP-022-01: Client-Side Logout Query Cache Invalidation
- **Area**: Protocol Section 31
- **Description**: `apps/web` does not yet feature an integrated client-side session management UI or global logout handler. Authenticated flashcard data (including card backs) cached by TanStack Query resides in client memory until tab closure or cache timeout (`gcTime: 10m`).
- **Status**: **OPEN / NON-BLOCKING** (deferred to frontend auth session integration).

---

## 6. Historical QA Iteration 1 Acceptance Criteria Evaluation (Archive)

*(Historical Record: Evaluated during QA Iteration 1 before Rework Iteration 1. Current canonical acceptance criteria results are recorded in Section 8.4 where all 18 ACs are **PASS**).*

| AC ID | Name | Result | Notes / Evidence |
| :--- | :--- | :---: | :--- |
| **AC-001** | Zero Schema Drift & Persistence Invariant | **PASS** | `apps/api/prisma/schema.prisma` unmodified; zero migrations; AST guards green. |
| **AC-002** | Authenticated Access Boundary | **PASS** | 401 on missing, malformed, expired, or refresh JWTs; 200 on valid learner token. |
| **AC-003** | Published Parent Status Enforcement | **PASS** | Returns generic 404 if course or lesson is DRAFT or ARCHIVED. |
| **AC-004** | Relational Scoping & Cross-Course Isolation | **PASS** | Mismatched course/lesson slug combinations return generic 404 in repository query. |
| **AC-005** | Flashcard Ordering Determinism | **PASS** | Verified `order ASC` deterministic sorting (`[10, 20, 30]`). |
| **AC-006** | Minimized Whitelist DTO Sanitization | **PASS** | Response strictly limited to approved fields; zero leaked UUIDs or timestamps. |
| **AC-007** | Empty Deck Graceful Handling | **PASS** | Returns 200 with empty array; frontend renders friendly empty deck UI. |
| **AC-008** | Lesson Detail Navigation Integration | **PASS** | Verified "Study Flashcards" action link on `LessonDetailPage`. |
| **AC-009** | Async UI Lifecycle State Coverage | **PASS** | All async states (`LOADING`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR`, `EMPTY`, `SUCCESS`) verified. |
| **AC-010** | Explicit Answer Reveal Action | **PASS** | Card back reveals only upon explicit user action; never on hover/focus/timer. |
| **AC-011** | Screen Reader Hidden-Answer Protection | **PASS** | Back text is completely unmounted before reveal; polite announcement upon reveal. |
| **AC-012** | Transient-Only Session State | **PASS** | Session state stored strictly in React memory; 0 browser storage or DB mutations. |
| **AC-013** | Zero Progression / XP / Reward Mutation | **PASS** | Progress/XP/reward table row counts verified identical before and after review. |
| **AC-014** | Zero FEAT-022 Redis Usage | **PASS** | Zero Redis calls in FEAT-022 code; `npm run test:redis` passes cleanly. |
| **AC-015** | Safe Markdown Rendering & XSS Mitigation | **PASS** | Reuses FEAT-021 DOMPurify sanitizer; 10+ hostile payloads neutralized. |
| **AC-016** | FEAT-022 Accessibility & Responsive Baseline | **FAIL** | Failed in QA1 due to `DEF-022-01` (remediated in Rework 1; verified PASS in QA2). |
| **AC-017** | Human-Approved Option A Conformance | **PASS** | Backend serves front/back; frontend strictly hides back from DOM before reveal. |
| **AC-018** | Monorepo Regression & Truthful Documentation | **FAIL** | Failed in QA1 due to `DEF-022-01` & `GOV-022-01` (remediated in Rework 1; verified PASS in QA2). |

---

## 7. Historical QA Iteration 1 Verdict (Archive)

- **Historical Verdict**: **FAIL (Iteration 1)**
- **Historical Governance State**: **IMPLEMENTED / QA FAILED**
- **Remediation Triggered**: Implementation Owner addressed `DEF-022-01` and `GOV-022-01` in Rework Iteration 1.

---

## 8. QA Iteration 2 (Re-Verification & Comprehensive Evaluation)

Independent QA Iteration 2 was conducted to re-verify the remediated defects, evaluate accessibility and security regression around them, inspect canonical acceptance criteria, and execute the full monorepo validation suite.

Implementation source code was **not modified** during QA Iteration 2. FEAT-023 was **not started**.

### 8.1. DEF-022-01 Re-Verification (Interactive Ancestor Guard) — **FIXED VERIFIED**
- **Source Inspection**: In `apps/web/src/features/academy/components/FlashcardReviewContainer.tsx`:
  ```typescript
  const isInteractiveElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;

    return Boolean(
      target.closest(
        'input, textarea, select, button, a, [contenteditable="true"]'
      ) || (target instanceof HTMLElement && target.isContentEditable)
    );
  };
  ```
  Verified that `target instanceof Element` correctly captures both `HTMLElement` and `SVGElement` descendants, allowing `.closest(...)` traversal to detect enclosing interactive parents.
- **Direct Interactive Controls Verification**:
  - Tested direct `<input>`, `<textarea>`, `<select>`, `<button>`, `<a>`, and `<div contenteditable="true">`.
  - Dispatched `Space`, `Enter`, `ArrowRight`, `ArrowLeft`, `R`, `r`.
  - State verified: `isRevealed` remained `false`, `currentIndex` remained unchanged. Zero shortcut hijacking.
- **Nested Button Child (`<span>` inside `<button>`)**:
  - Rendered `<button><span data-testid="nested-span">Label</span></button>`.
  - Dispatched keydown events with `target = nestedSpan`.
  - Result: `isInteractiveElement` returned `true`; global shortcuts ignored; card back remained unmounted (`isRevealed = false`).
- **Nested SVG Child (`<svg>` and `<path>` inside `<button>`)**:
  - Rendered `<button><svg><path /></svg></button>`.
  - Dispatched keydown events targeting `<svg>` and `<path>`.
  - Result: Because `SVGElement` inherits from `Element`, `.closest('button')` resolved to the enclosing button; global shortcuts ignored; `isRevealed` remained `false`.
- **Nested Link Child (`<span>` inside `<a>`)**:
  - Rendered `<a href="/academy"><span data-testid="nested-link-child">Back</span></a>`.
  - Dispatched `Space` and `Enter` on `nested-link-child`.
  - Result: Ignored by shortcut handler; card state remained unchanged.
- **Contenteditable Ancestry**:
  - Rendered `<div contenteditable="true"><span data-testid="editable-child">Text</span></div>`.
  - Dispatched keydown from child span.
  - Result: Detected via `closest('[contenteditable="true"]')` and `isContentEditable`; shortcuts ignored.
- **Normal Non-Interactive Element**:
  - Rendered `<div data-testid="page-body" />`.
  - Dispatched `Space` $\to$ card answer revealed (`isRevealed = true`).
  - Dispatched `ArrowRight` $\to$ navigated to Card 2 (`currentIndex = 1`, `isRevealed = false`).
  - Dispatched `ArrowLeft` $\to$ returned to Card 1 (`currentIndex = 0`, `isRevealed = false`).
  - Dispatched `Enter` $\to$ card revealed (`isRevealed = true`).
  - Dispatched `r` $\to$ session restarted (`currentIndex = 0`, `isRevealed = false`).
  - Proved that legitimate keyboard navigation is fully preserved on non-interactive regions.
- **Accessibility & Reveal Regression**:
  - Exactly one `<h1>` element on the view (`Flashcards: [Lesson Title]`).
  - Answer back remains strictly unmounted before reveal (`queryByText` null).
  - Reveal toggle button has accessible name (`"Reveal Answer"`), `aria-expanded` transitions (`false` $\to$ `true`), and answer renders with `aria-live="polite"`.
  - Position text `"Card X of Y"` accurately displayed.
- **XSS Regression**:
  - Re-tested with malicious front and back payloads (`<script>`, `<img onerror>`, `javascript:`, `data:`, `<svg onload>`, `# Heading`).
  - Front sanitized; back unmounted before reveal; back sanitized upon reveal.
- **Verdict for DEF-022-01**: **FIXED VERIFIED**. Criterion `AC-016` transitions to **PASS**.

---

### 8.2. GOV-022-01 Re-Verification (Governance Stale Decision Cleanup) — **FIXED VERIFIED**
- **Inspection**: Inspected `docs/phase-4-feature-decomposition.md` Section 15 ("Human Decisions Required"):
  ```markdown
  4. [RESOLVED] Decide whether flashcard review state persists in Phase 4: DEFERRED (Phase 4 FEAT-022 behavior: TRANSIENT CLIENT-SIDE REVIEW SESSION ONLY; Option A UI reveal only approved).
  ```
  Verified that the item is no longer presented as an open, unresolved question. It is clearly recorded as `[RESOLVED]` in complete alignment with Section 12, the approved planning package, and the Human Product Decision.
- **Verdict for GOV-022-01**: **FIXED VERIFIED**. Criterion `AC-018` transitions to **PASS**.

---

### 8.3. GAP-022-01 (Client-Side Logout Query Cache Invalidation) — **OPEN / NON-BLOCKING**
- Preserved as an open, non-blocking evidence gap due to absence of client-side session management UI in `apps/web`. Zero scope creep was introduced.

---

### 8.4. Canonical Acceptance Criteria Re-Evaluation (AC-001..AC-018)

| AC ID | Name | Result | Verification Summary |
| :--- | :--- | :---: | :--- |
| **AC-001** | Zero Schema Drift & Persistence Invariant | **PASS** | `apps/api/prisma/schema.prisma` unmodified; 0 migrations; guards pass. |
| **AC-002** | Authenticated Access Boundary | **PASS** | 401 on missing/malformed/expired/refresh tokens; 200 on valid learner token. |
| **AC-003** | Published Parent Status Enforcement | **PASS** | 404 on DRAFT/ARCHIVED course or lesson; error bodies indistinguishable. |
| **AC-004** | Relational Scoping & Cross-Course Isolation | **PASS** | Cross-course slug mismatches return 404 in repository SQL query. |
| **AC-005** | Flashcard Ordering Determinism | **PASS** | Verified `order ASC` deterministic sorting (`[10, 20, 30]`). |
| **AC-006** | Minimized Whitelist DTO Sanitization | **PASS** | Whitelist response enforced; zero leaked UUIDs, timestamps, or Prisma metadata. |
| **AC-007** | Empty Deck Graceful Handling | **PASS** | Returns 200 with empty array; frontend renders friendly empty deck UI. |
| **AC-008** | Lesson Detail Navigation Integration | **PASS** | "Study Flashcards" action link on `LessonDetailPage` routes cleanly. |
| **AC-009** | Async UI Lifecycle State Coverage | **PASS** | All async states (`LOADING`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR`, `EMPTY`, `SUCCESS`) verified. |
| **AC-010** | Explicit Answer Reveal Action | **PASS** | Card back reveals only on explicit click/action; never on hover/focus/timer. |
| **AC-011** | Screen Reader Hidden-Answer Protection | **PASS** | Back text is completely unmounted before reveal; polite announcement on reveal. |
| **AC-012** | Transient-Only Session State | **PASS** | Session state in React memory; 0 storage writes; 0 DB mutations. |
| **AC-013** | Zero Progression / XP / Reward Mutation | **PASS** | Progress/XP/reward table counts verified identical before and after review. |
| **AC-014** | Zero FEAT-022 Redis Usage | **PASS** | Zero Redis calls in FEAT-022; `npm run test:redis` passes cleanly. |
| **AC-015** | Safe Markdown Rendering & XSS Mitigation | **PASS** | Reuses FEAT-021 DOMPurify sanitizer; 10+ hostile attack vectors neutralized. |
| **AC-016** | FEAT-022 Accessibility & Responsive Baseline | **PASS** | `DEF-022-01` verified fixed; full keyboard isolation on nested controls; single `<h1>`. |
| **AC-017** | Human-Approved Option A Conformance | **PASS** | Backend serves front/back; frontend conceals back from DOM before reveal. |
| **AC-018** | Monorepo Regression & Truthful Documentation | **PASS** | `GOV-022-01` verified fixed; 14/14 automated checks passing; docs truthful. |

---

### 8.5. Monorepo Validation Suite Execution Evidence (QA Iteration 2)

All 14 mandatory monorepo validation commands were executed and passed with clean exit code 0:

| Validation Command | Status | Actual Executed Count | Notes / Evidence |
| :--- | :---: | :--- | :--- |
| `npm run clean` | **PASS** | Monorepo-wide | Cleaned dist across shared, api, and web |
| `npm run lint` | **PASS** | Monorepo-wide | 0 errors, 0 warnings across all workspaces |
| `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Backend schema | Prisma schema syntax, relations, and generators valid |
| `npm run typecheck` | **PASS** | Monorepo-wide | Zero TypeScript compilation errors across shared, api, and web |
| `npm run build` | **PASS** | Monorepo-wide | Shared tsc, API tsc, and Web Vite bundle built clean |
| `npm run test` (standard) | **PASS** | **64 files / 623 tests** | API: 54/504, Web: 9/99, Shared: 1/20. 0 failures, 0 skips |
| `npm run test:unit` | **PASS** | **43 files / 472 tests** | API: 34/354, Web: 8/98, Shared: 1/20. 0 failures |
| `npm run test:db` (PostgreSQL) | **PASS** | **14 files / 121 tests** | Full live PostgreSQL integration suite passes |
| `npm run test:redis` (Redis) | **PASS** | **5 files / 50 tests** | Live Redis rate-limit and boundary suite passes |
| `npm run guard:persistence` | **PASS** | 1 file / 14 tests | Persistence boundary integrity verified |
| `npm run guard:migration` | **PASS** | 4 migrations | Exactly 4 migrations; 24 review risks; 0 blocking risks |
| `npm run guard:boundary` | **PASS** | Static AST guard | controllers=7, services=11, repositories=6 |
| `npm run guard:audit-governance` | **PASS** | Static AST guard | Zero premature product audit schemas, models, or APIs |
| `npm run guard:seed-safety` | **PASS** | Static AST guard | Zero unsafe seed scripts or default admin backdoors |

---

### 8.6. Final QA Iteration 2 Verdict & Governance State

- **Final Verdict**: **PASS**
- **Governance State**: **DONE**
- **Human Final Gate**: **APPROVED**
- **FEAT-023**: **UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)**
- **Phase 4 Status**: **IN_PROGRESS**

