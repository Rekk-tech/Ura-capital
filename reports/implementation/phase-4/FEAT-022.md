# Implementation Report: FEAT-022 Flashcards Domain & Review Flow

**Feature ID**: FEAT-022  
**Feature Name**: Flashcards Domain & Review Flow  
**Phase**: Phase 4 — Product Foundation & Academy MVP  
**Implementation Status**: `COMPLETE`  
**QA Status**: `PASS (QA Iteration 2)`  
**Human Final Gate**: `APPROVED`  
**FEAT-023 Status**: `UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)`  
**Date**: 2026-09-04  

---

## 1. Executive Summary

FEAT-022 implements the read-only authenticated flashcards query model and the interactive learner review flow for Aura Academy lessons. The implementation adheres strictly to the approved specification package (`.specify/specs/FEAT-022/`), the human product decision (**Transient Client-Side Review Session Only**), and the human answer-secrecy decision (**Option A — UI Reveal Only**):

- **Backend Read-Only API**: Canonical authenticated endpoint `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards` (with Express alias `/academy/...`) returning ordered flashcards for published courses and lessons.
- **Strict Layered Boundary**: Clean controller $\rightarrow$ service $\rightarrow$ repository query flow with zero direct Prisma calls in controllers/services (`npm run guard:boundary` 100% compliant).
- **Relational Ownership & Visibility Enforcement**: Database queries enforce `course.status = PUBLISHED`, `lesson.status = PUBLISHED`, and `lesson.courseId = course.id`. Draft, archived, nonexistent, or mismatched parent entities return uniform sanitized `404 Not Found`.
- **Option A (UI Reveal Only) & Accessibility Concealment**: The back/answer text is present in the authenticated HTTP network payload and browser memory, but is **strictly unmounted from the DOM and accessibility tree** (`queryByText` returns null) until the learner performs an explicit reveal action.
- **Transient-Only Session State**: Review progress (`currentIndex`, `isRevealed`, `isCompleted`) is stored entirely in React component memory. Zero mutations to PostgreSQL (`AcademyUserCourseProgress`, `AcademyUserLessonProgress`, `AcademyUserXp`, `AcademyRewardLedger`), zero Redis usage, and zero `localStorage`/`sessionStorage` writes.
- **Safe Markdown Rendering**: Reuses the validated `markdown-sanitizer.ts` pipeline (`marked` $\rightarrow$ heading normalization to `h2` $\rightarrow$ DOMPurify strict allowlist $\rightarrow$ rendering) preventing duplicate `h1` headings and neutralizing XSS vectors.
- **Keyboard Navigation & Interactive Guard**: Keyboard shortcuts (`Space`/`Enter` flip, `ArrowRight` next, `ArrowLeft` prev, `R` restart) with active input protection (`isInteractiveElement` guard) to prevent hijacking when learners focus form controls.
- **Accessibility Baseline**: Exactly one `<h1>` per page, textual position badge (`Card X of Y`), `aria-expanded` and `aria-live="polite"` state transitions, and responsive mobile-to-desktop design.
- **Zero Schema Drift**: Zero Prisma schema edits, zero migrations, and zero new database indexes (`schema.prisma` unmodified).
- **All 14 Validation Commands Pass**: Verified clean lint, typecheck, build, unit tests, DB integration tests, Redis tests, and all five governance guards.

---

## 2. Endpoint Contract & Authorization Boundary

| Method | Canonical Route | Alias Route | Access Control | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards` | `/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards` | **AUTHENTICATED** (Learner) | Returns ordered flashcards for a published lesson under a published course. |

### Authentication Boundary
- Protected by the trusted `authenticate` middleware ([`apps/api/src/modules/auth/auth.middleware.ts`](file:///d:/project/ura-capital/apps/api/src/modules/auth/auth.middleware.ts)).
- Enforces Bearer JWT access token validation (`typ: "access"`), HMAC-SHA256 signature verification, claims validation (`sub`, `iss`, `aud`, `exp`), and active user status verification.
- Active learner authentication is required and sufficient; no administrative role is required.
- Missing, malformed, or expired tokens return `401 Unauthorized` (`UNAUTHENTICATED`) with the standard Aura error envelope.

---

## 3. Safe Whitelist DTO Projections

All responses serialize through pure mapper functions defined in [`apps/api/src/modules/academy/academy.dto.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.dto.ts).

### `FlashcardItemDto`
```typescript
export interface FlashcardItemDto {
  front: string;
  back: string;
  order: number;
}
```

### `LessonFlashcardsResponseDto`
```typescript
export interface LessonFlashcardsResponseDto {
  courseSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  flashcards: FlashcardItemDto[];
  totalCount: number;
}
```

### Sanitization & Leakage Prevention Invariants
- **Excluded Fields**: Zero internal UUIDs (`id`, `lessonId`, `courseId`), zero timestamps (`createdAt`, `updatedAt`), zero internal status strings, zero quiz models, zero XP/reward ledgers.
- Never returns raw Prisma entity instances.

---

## 4. Relational Predicates & Error Semantics

The database repository query in [`apps/api/src/modules/academy/academy.repository.ts`](file:///d:/project/ura-capital/apps/api/src/modules/academy/academy.repository.ts) (`findPublishedFlashcardsByLesson`) enforces relational consistency at the database level:

```prisma
where: {
  slug: lessonSlug,
  status: "PUBLISHED",
  course: {
    slug: courseSlug,
    status: "PUBLISHED",
  },
}
```

### Deterministic Error Matrix
- **`400 Bad Request` (`VALIDATION_ERROR`)**: Malformed `courseSlug` or `lessonSlug` path parameters violating Zod slug constraints.
- **`401 Unauthorized` (`UNAUTHENTICATED`)**: Missing or invalid `Authorization: Bearer <token>` header.
- **`404 Not Found` (`NOT_FOUND`)**: Nonexistent course, nonexistent lesson, `DRAFT` course, `ARCHIVED` course, `DRAFT` lesson, `ARCHIVED` lesson, or cross-course relationship mismatch (lesson belongs to a different course). All return identical, sanitized 404 responses without leaking unpublished status or relational structure.
- **`200 OK` (Empty Deck)**: Published course with published lesson having zero flashcards returns `200 OK` with `{ flashcards: [], totalCount: 0 }`. It does **not** throw 404.
- **`500 Internal Server Error` (`INTERNAL_ERROR`)**: Uncaught infrastructure or database errors sanitize internal stack traces through the central error envelope.

---

## 5. Option A (UI Reveal Only) & Frontend Review Architecture

### Human Decision Alignment
- **Option A Approved**: The backend returns `{ front, back, order }` in the authenticated response. The answer exists in client memory and network response.
- **DOM & Accessibility Concealment**: Before explicit learner reveal, the back text is **not mounted in the DOM** and **does not exist in the accessibility tree**. Conditional rendering (`!isRevealed ? <RevealPrompt /> : <BackSection />`) ensures `queryByText(back)` evaluates to `null`.
- **Zero Accidental Reveal**: Reveal occurs only through deliberate learner action (clicking "Reveal Answer", pressing `Space`, or pressing `Enter`). No reveal occurs on hover, focus, timer, or viewport intersection.

### Transient State Machine
- `READY_FRONT`: Card prompt rendered; answer unmounted; "Reveal Answer" CTA present (`aria-expanded="false"`).
- `REVEALED`: Answer mounted into DOM with `aria-live="polite"` announcement; reveal CTA replaced by answer surface.
- `NEXT` / `PREVIOUS`: Advances or decrements card index and **immediately resets** `isRevealed = false`, unmounting the answer for the next card.
- `COMPLETED`: Summary view rendered after the final card with total count reviewed.
- `RESTART`: Resets `currentIndex = 0`, `isRevealed = false`, and `isCompleted = false`.

### Keyboard Navigation & Input Guard
- Global `keydown` handler listens for `Space`/`Enter` (flip), `ArrowRight` (next), `ArrowLeft` (prev), and `R` (restart).
- Guard function `isInteractiveElement(e.target)` checks whether the event originated within `input`, `textarea`, `select`, `button`, `a`, or `contenteditable` elements, preventing shortcut hijacking during form interaction.

---

## 6. Zero Mutability & Governance Compliance

- **PostgreSQL Database**: Zero mutations occur during flashcard review. Asserted by tests checking row counts in `AcademyUserCourseProgress`, `AcademyUserLessonProgress`, `AcademyUserXp`, and `AcademyRewardLedger`.
- **Prisma Schema**: Zero edits to `apps/api/prisma/schema.prisma`. Zero new migrations or indexes created.
- **Redis Cache**: Zero Redis keys, imports, or caching layers introduced for FEAT-022.
- **Product Audit**: Zero durable product audit records or security audit records emitted during read or review operations.

---

## 7. Modified & Created Files

### Backend (API)
- `apps/api/src/modules/academy/academy.dto.ts` — Added `FlashcardItemDto`, `LessonFlashcardsResponseDto`, and `toFlashcardItemDto` mapper.
- `apps/api/src/modules/academy/academy.types.ts` — Re-exported flashcard DTO types.
- `apps/api/src/modules/academy/academy.repository.ts` — Added `findPublishedFlashcardsByLesson(courseSlug, lessonSlug)` with relational predicates and `order: "asc"`.
- `apps/api/src/modules/academy/academy-course-read.service.ts` — Added `getPublishedFlashcards` business query method.
- `apps/api/src/modules/academy/academy-course.controller.ts` — Added `getFlashcards` HTTP controller handler.
- `apps/api/src/modules/academy/academy.routes.ts` — Registered authenticated route `GET /courses/:courseSlug/lessons/:lessonSlug/flashcards` (with `/api/academy` and `/academy` prefixes).
- `apps/api/package.json` — Added `academy-flashcards-db.test.ts` to `test:db` script.

### Backend Tests
- `apps/api/tests/unit/academy-flashcard-read.service.test.ts` — 3 unit tests verifying service 404 behavior, empty deck handling, and DTO whitelist projection.
- `apps/api/tests/integration/academy-routes.test.ts` — Added integration tests for 401 unauthenticated, 400 invalid courseSlug, 400 invalid lessonSlug.
- `apps/api/tests/integration/academy-flashcards-db.test.ts` — 8 live PostgreSQL integration tests verifying 401 unauthenticated, 200 ordered ASC, empty deck 200, draft/archived parent 404s, cross-course 404, and zero database mutations.

### Frontend (Web)
- `apps/web/src/features/academy/types/academy-ui.types.ts` — Added `FlashcardItemDto`, `LessonFlashcardsResponseDto`, and `FlashcardReviewState`.
- `apps/web/src/api/academy.api.ts` — Extended `IAcademyApiClient` & `AcademyApiClient` with `getLessonFlashcards(courseSlug, lessonSlug, accessToken?)`.
- `apps/web/src/features/academy/hooks/use-academy.ts` — Added `useFlashcardsQuery` hook.
- `apps/web/src/features/academy/components/AcademyStates.tsx` — Added `FlashcardLoadingSkeleton` and updated `AuthRequiredCard` with optional `returnPath`.
- `apps/web/src/features/academy/components/FlashcardReviewContainer.tsx` — Interactive review container with transient state machine, conditional reveal, keyboard guard, and Markdown rendering.
- `apps/web/src/features/academy/pages/FlashcardReviewPage.tsx` — Complete review page shell with single `<h1>`, breadcrumbs, and full async state handling.
- `apps/web/src/app/router/academy-routes.tsx` — Registered route `/courses/:courseSlug/lessons/:lessonSlug/flashcards`.
- `apps/web/src/features/academy/pages/LessonDetailPage.tsx` — Added "Study Flashcards" CTA link button.
- `apps/web/src/index.css` — Added responsive and accessible styles for flashcard review components.

### Frontend Tests
- `apps/web/src/features/academy/pages/FlashcardReviewPage.test.tsx` — 13 unit and interaction tests covering single `<h1>`, position badge, hidden back assertion, explicit reveal, reset on navigation, deck completion, restart, keyboard shortcuts with interactive ancestor guard (DEF-022-01 regression suite), Markdown XSS sanitization, heading downshift, empty deck state, 401 auth-required state, 404 not-found state, and 500 error with retry.

---

## 8. Verification & Test Evidence

### 14 Mandatory Monorepo Validation Commands

| # | Command | Result | Details |
| :--- | :--- | :--- | :--- |
| 1 | `npm run clean` | **PASS** | Dist and cache directories cleaned across workspaces. |
| 2 | `npm run lint` | **PASS** | ESLint passed with 0 errors and 0 warnings across all files. |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Schema is completely valid; zero drift. |
| 4 | `npm run typecheck` | **PASS** | `tsc --noEmit` passed across `@aura/shared`, `@aura/api`, and `@aura/web`. |
| 5 | `npm run build` | **PASS** | Production bundles built successfully for `@aura/shared`, `@aura/api`, and `@aura/web`. |
| 6 | `npm run test` | **PASS** | **64 test files passed (623 tests passed, 0 failed)**. |
| 7 | `npm run test:unit` | **PASS** | **43 test files passed (472 tests passed, 0 failed)**. |
| 8 | `npm run test:db` | **PASS** | **14 test files passed (121 tests passed, 0 failed)** on live PostgreSQL. |
| 9 | `npm run test:redis` | **PASS** | **5 test files passed (50 tests passed, 0 failed)**. |
| 10 | `npm run guard:persistence` | **PASS** | 1 test file passed (14 tests passed); zero unauthorized persistence. |
| 11 | `npm run guard:migration` | **PASS** | 4 migrations verified, 0 blocking risks, 24 review risks, 4 digests valid. |
| 12 | `npm run guard:boundary` | **PASS** | 7 controllers, 11 services, 6 repositories verified; zero Prisma leakage. |
| 13 | `npm run guard:audit-governance` | **PASS** | Zero premature product audit schemas, models, or APIs detected. |
| 14 | `npm run guard:seed-safety` | **PASS** | Zero unsafe seed scripts, migration fixtures, or default admin backdoors. |

---

## 9. Acceptance Criteria Traceability Matrix (AC-001..AC-018)

| AC ID | Requirement | Implementation Evidence | Test Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AC-001** | Zero Schema Drift & Persistence Invariant | `schema.prisma` unmodified; zero migrations or indexes | `prisma validate`, `guard:migration`, `git diff` | **VERIFIED** |
| **AC-002** | Authenticated Access Boundary | `authenticate` middleware attached in `academy.routes.ts` | `academy-routes.test.ts`, `academy-flashcards-db.test.ts` | **VERIFIED** |
| **AC-003** | Published Parent Status Enforcement | Repository query requires `status: "PUBLISHED"` on both course and lesson | `academy-flashcards-db.test.ts` (draft/archived tests) | **VERIFIED** |
| **AC-004** | Relational Scoping & Cross-Course Isolation | Repository query filters `course.slug = courseSlug` | `academy-flashcards-db.test.ts` (cross-course test) | **VERIFIED** |
| **AC-005** | Flashcard Ordering Determinism | Repository orders by `order: "asc"`; schema enforces unique `[lessonId, order]` | `academy-flashcards-db.test.ts` (order test) | **VERIFIED** |
| **AC-006** | Minimized Whitelist DTO Sanitization | `toFlashcardItemDto` exposes only `front`, `back`, `order`; zero UUIDs/timestamps | `academy-flashcard-read.service.test.ts`, `academy-flashcards-db.test.ts` | **VERIFIED** |
| **AC-007** | Empty Deck Graceful Handling | Empty flashcard list returns `200 OK` with `flashcards: []`; UI shows empty state | `academy-flashcards-db.test.ts`, `FlashcardReviewPage.test.tsx` | **VERIFIED** |
| **AC-008** | Lesson Detail Navigation Integration | Added "Study Flashcards" CTA link button in `LessonDetailPage.tsx` | `LessonDetailPage.test.tsx`, `FlashcardReviewPage.test.tsx` | **VERIFIED** |
| **AC-009** | Async UI Lifecycle State Coverage | Handles `LOADING`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR`, `EMPTY`, `SUCCESS` | `FlashcardReviewPage.test.tsx` | **VERIFIED** |
| **AC-010** | Explicit Answer Reveal Action | Front displayed initially; back mounted only on explicit button/shortcut | `FlashcardReviewPage.test.tsx` | **VERIFIED** |
| **AC-011** | Screen Reader Hidden-Answer Protection | Back is completely unmounted from DOM until reveal; `aria-live="polite"` on reveal | `FlashcardReviewPage.test.tsx` (`queryByText` null assertion) | **VERIFIED** |
| **AC-012** | Transient-Only Session State | State stored only in React memory (`useState`); zero storage/DB persistence | `FlashcardReviewPage.test.tsx` (reset & restart tests) | **VERIFIED** |
| **AC-013** | Zero Progression / XP / Reward Mutation | Read-only flow; zero queries to progress, XP, or reward ledger tables | `academy-flashcards-db.test.ts` (DB row count assertions) | **VERIFIED** |
| **AC-014** | Zero FEAT-022 Redis Usage | Zero Redis imports, keys, or calls in any FEAT-022 source code | `guard:boundary`, `npm run test:redis` | **VERIFIED** |
| **AC-015** | Safe Markdown Rendering & XSS Mitigation | Reuses `markdown-sanitizer.ts` with DOMPurify allowlist and heading downshift | `FlashcardReviewPage.test.tsx` (malicious XSS injection test) | **VERIFIED** |
| **AC-016** | Accessibility & Responsive Baseline | Single `<h1>`, keyboard shortcuts with input guard, responsive CSS layout | `FlashcardReviewPage.test.tsx`, `index.css` | **READY FOR RE-VERIFICATION** |
| **AC-017** | Human-Approved Option A Conformance | Authenticated API returns front/back; UI reveals only on explicit learner action | `academy-flashcards-db.test.ts`, `FlashcardReviewPage.test.tsx` | **VERIFIED** |
| **AC-018** | Monorepo Regression & Documentation | 14/14 automated validation checks passed; truthful report documented | Full 14 validation commands recorded in report | **READY FOR RE-VERIFICATION** |

---

## 10. Governance & Next Steps

- **FEAT-022 Implementation Status**: `REWORK COMPLETE / READY FOR QA RE-VERIFICATION`
- **QA Status**: `PENDING RE-VERIFICATION (Iteration 1: FAIL — DEF-022-01 & GOV-022-01 Remediated)`
- **Human Final Gate**: `NOT APPROVED`
- **FEAT-023**: `BLOCKED` (NOT_STARTED; zero work performed)
- **Phase 4 Status**: `IN_PROGRESS`

---

## 11. Rework Iteration 1

Following QA Iteration 1 (which identified blocking defect `DEF-022-01` and governance defect `GOV-022-01`), Rework Iteration 1 was performed with zero scope expansion and zero modifications to backend or database schemas:

### 11.1. DEF-022-01 Remediation (Interactive Ancestor Guard) — **FIXED — awaiting QA re-verification**
- **Root Cause**: In `FlashcardReviewContainer.tsx`, `isInteractiveElement` performed direct tag name equality (`target.tagName.toLowerCase() === "button"`, etc.) without inspecting nearest interactive ancestor elements. When events originated from child elements inside interactive controls (e.g. `<span>` or `<svg>` nested inside a `<button>` or `<a>`), `target.tagName` was `"span"` or `"svg"`, causing keyboard shortcuts (`Space`/`Enter`) to hijack native control activation.
- **Fix Applied**: Updated `isInteractiveElement` to check `target instanceof Element` and query the closest interactive ancestor:
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
  Using `Element` rather than only `HTMLElement` ensures SVG element children (e.g. `<svg>` or `<path>` inside icon buttons) correctly resolve to their parent `<button>`.
- **Regression Test Coverage Added**: Added comprehensive test suite in `apps/web/src/features/academy/pages/FlashcardReviewPage.test.tsx`:
  - **A. Direct button target**: Space/Enter dispatches to button; card back remains unmounted (`isRevealed = false`).
  - **B. Nested span inside button**: `<button><span data-testid="nested-span">Label</span></button>`; Space/Enter on span does not trigger reveal.
  - **C. Nested SVG inside button**: `<button><svg data-testid="nested-svg" /></button>`; Space/Enter on SVG does not trigger reveal.
  - **D. Nested link child**: `<a href="/academy"><span data-testid="nested-link-child">Back</span></a>`; Space/Enter on nested link child does not trigger reveal.
  - **E. contenteditable child**: `<div contenteditable="true"><span>Editable</span></div>`; Space/Enter on editable child does not trigger reveal.
  - **F. Normal non-interactive element**: `<div data-testid="page-body" />`; Space key cleanly triggers card reveal as intended.
  - Asserted that `isRevealed` remains `false` throughout all protected interactive cases.
- **AC-016 Status**: Fully verifiable and **READY FOR RE-VERIFICATION**.

### 11.2. GOV-022-01 Remediation (Governance Stale Decision Cleanup) — **FIXED — awaiting QA re-verification**
- **Fix Applied**: Updated `docs/phase-4-feature-decomposition.md` Section 15 ("Human Decisions Required"), item 4 from an open question to:
  ```markdown
  4. [RESOLVED] Decide whether flashcard review state persists in Phase 4: DEFERRED (Phase 4 FEAT-022 behavior: TRANSIENT CLIENT-SIDE REVIEW SESSION ONLY; Option A UI reveal only approved).
  ```
- **AC-018 Documentation Status**: Synchronized with canonical Human Product Decision; **READY FOR RE-VERIFICATION**.

### 11.3. GAP-022-01 (Client-Side Logout Query Cache Invalidation) — **OPEN / NON-BLOCKING**
- Preserved as an open, non-blocking evidence gap due to the absence of a client-side session management UI in `apps/web`. Zero scope expansion was introduced.

### 11.4. Validation Suite Execution Counts (Rework Iteration 1)
All 14 validation commands passed with clean exit code 0:
- `npm run clean`: **PASS**
- `npm run lint`: **PASS** (0 errors, 0 warnings across all workspaces)
- `npx prisma validate`: **PASS** (schema valid)
- `npm run typecheck`: **PASS** (zero TypeScript compilation errors)
- `npm run build`: **PASS** (shared tsc, api tsc, and web Vite bundle)
- `npm run test` (standard): **PASS** (**64 test files / 623 tests**)
- `npm run test:unit`: **PASS** (**43 test files / 472 tests**)
- `npm run test:db`: **PASS** (**14 test files / 121 tests**)
- `npm run test:redis`: **PASS** (**5 test files / 50 tests**)
- `npm run guard:persistence`: **PASS** (1 test file / 14 tests)
- `npm run guard:migration`: **PASS** (4 migrations, 24 review risks, 0 blocking risks)
- `npm run guard:boundary`: **PASS** (controllers=7, services=11, repositories=6)
- `npm run guard:audit-governance`: **PASS** (0 premature product audit schemas/models)
- `npm run guard:seed-safety`: **PASS** (0 unsafe seed scripts or backdoors)

### 11.5. Readiness for QA Iteration 2
- **DEF-022-01**: **FIXED — awaiting QA re-verification**
- **GOV-022-01**: **FIXED — awaiting QA re-verification**
- **GAP-022-01**: **OPEN / NON-BLOCKING**
- **FEAT-023**: `BLOCKED` / `NOT_STARTED`
- **FEAT-022**: **READY FOR QA ITERATION 2 RE-VERIFICATION**

