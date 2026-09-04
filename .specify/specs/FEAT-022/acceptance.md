# Acceptance Criteria: FEAT-022 Flashcards Domain & Review Flow

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-022  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human Product Decision**: APPROVED (Transient Client-Side Review Session Only; Persistence DEFERRED)  
**Human Answer-Secrecy Decision**: APPROVED (Option A — UI Reveal Only)  
**Implementation**: NOT_STARTED  

---

## 1. Acceptance Criteria Inventory

| Criterion ID | Name | Target Layer | Verification Method |
| :--- | :--- | :--- | :--- |
| **AC-001** | Zero Schema Drift & Persistence Invariant | Database / Prisma | Static schema comparison & AST guard |
| **AC-002** | Authenticated Access Boundary | Backend API | HTTP 401 integration tests |
| **AC-003** | Published Parent Status Enforcement | Backend API | Relational query tests with draft/archived parents |
| **AC-004** | Relational Scoping & Cross-Course Isolation | Backend API | Mismatched slug integration tests (indistinguishable 404) |
| **AC-005** | Flashcard Ordering Determinism | Backend API | Integration tests verifying `order ASC` under unique constraint |
| **AC-006** | Minimized Whitelist DTO Sanitization | Backend API | Response contract assertion (zero internal UUIDs) |
| **AC-007** | Empty Deck Graceful Handling | Backend & Frontend | HTTP 200 with empty array; friendly UI state |
| **AC-008** | Lesson Detail Navigation Integration | Frontend Route | UI CTA button linking to canonical review route |
| **AC-009** | Async UI Lifecycle State Coverage | Frontend | Unit tests for `LOADING`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR` |
| **AC-010** | Explicit Answer Reveal Action | Frontend UI | Component test verifying reveal on explicit action only |
| **AC-011** | Screen Reader Hidden-Answer Protection | Frontend Accessibility | DOM-level conditional rendering assertions |
| **AC-012** | Transient-Only Session State | Frontend / Persistence | Refresh/reset test and zero DB write assertion |
| **AC-013** | Zero Progression / XP / Reward Mutation | Backend Persistence | Database row count assertions before and after review |
| **AC-014** | Zero FEAT-022 Redis Usage | Infrastructure | Static inspection verifying 0 Redis imports/calls/keys in FEAT-022 |
| **AC-015** | Safe Markdown Rendering & XSS Mitigation | Frontend Security | XSS payload injection test suite |
| **AC-016** | FEAT-022 Accessibility & Responsive Baseline | Frontend Design | Single `<h1>`, keyboard operability with input guard, responsive layout |
| **AC-017** | Human-Approved Option A Conformance | Backend / Frontend | API returns front/back; UI keeps back absent until explicit reveal |
| **AC-018** | Monorepo Regression & Truthful Documentation | Full Monorepo | 14/14 automated validation checks & report review |

---

## 2. Detailed Criterion Specifications

### AC-001: Zero Schema Drift & Persistence Invariant
- **Condition**: `apps/api/prisma/schema.prisma` and PostgreSQL migration files must remain completely unmodified (`git diff HEAD -- apps/api/prisma` is empty).
- **Pass**: Prisma schema validation passes; zero new tables, columns, or relations added.
- **Fail**: Any schema change or migration introduced.

### AC-002: Authenticated Access Boundary
- **Condition**: Requests to `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards` without a valid Bearer JWT or with an expired/tampered JWT must return `401 Unauthorized` (`UNAUTHENTICATED`).
- **Pass**: All unauthenticated requests reject with 401; authenticated requests proceed.
- **Fail**: Endpoint allows anonymous access or relies on frontend-only authentication guards.

### AC-003: Published Parent Status Enforcement
- **Condition**: Flashcards must be served only if the parent `AcademyCourse` is `PUBLISHED` AND the parent `AcademyLesson` is `PUBLISHED`.
- **Pass**: If either parent is `DRAFT` or `ARCHIVED`, endpoint returns generic `404 Not Found` (`NOT_FOUND`).
- **Fail**: Draft or archived course/lesson content is accessible.

### AC-004: Relational Scoping & Cross-Course Isolation
- **Condition**: Query must enforce that the specified lesson belongs to the specified course via relational lookup.
- **Pass**: Requests with a valid course slug and a lesson slug belonging to a *different* course return generic `404 Not Found`.
- **Fail**: Flashcards leak across course boundaries.

### AC-005: Flashcard Ordering Determinism
- **Condition**: Returned flashcards must be sorted by `order ASC`. Uniqueness per lesson is guaranteed by schema constraint `@@unique([lessonId, order])`.
- **Pass**: Flashcard array matches strict `order ASC` sorting under all test permutations.
- **Fail**: Non-deterministic ordering or sorting mismatch.

### AC-006: Minimized Whitelist DTO Sanitization
- **Condition**: API response must match `LessonFlashcardsResponseDto` whitelist strictly.
- **Pass**: Response includes only `courseSlug`, `lessonSlug`, `lessonTitle`, `flashcards` (`front`, `back`, `order`), and `totalCount`. Contains NO internal UUIDs (`id`, `courseId`, `lessonId`), timestamps (`createdAt`, `updatedAt`), or quiz/progress/reward data.
- **Fail**: Raw Prisma models or internal database UUIDs leaked in JSON.

### AC-007: Empty Deck Graceful Handling
- **Condition**: When a published lesson contains zero flashcards, API returns `200 OK` with `flashcards: []` and `totalCount: 0`. Frontend displays a friendly empty state with a return link to the lesson.
- **Pass**: Returns 200 without throwing 404 or 500; frontend renders friendly empty state.
- **Fail**: Crashes or returns 404 for an empty deck.

### AC-008: Lesson Detail Navigation Integration
- **Condition**: `LessonDetailPage` (`/academy/courses/:courseSlug/lessons/:lessonSlug`) contains a visible, accessible navigation element ("Study Flashcards") linking to `/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards`.
- **Pass**: Link renders and routes correctly to the flashcard review view.
- **Fail**: Missing navigation link between lesson detail and flashcard review.

### AC-009: Async UI Lifecycle State Coverage
- **Condition**: The flashcard review page handles all async states deterministically:
  - `LOADING`: Skeleton placeholder displayed.
  - `AUTH_REQUIRED`: Auth redirect card with safe return redirect URL.
  - `NOT_FOUND`: Generic 404 error message with return link.
  - `ERROR`: Retryable error banner.
  - `EMPTY`: Empty deck state.
  - `SUCCESS`: Active review deck container.
- **Pass**: All states render appropriate UI without console errors.
- **Fail**: Any unhandled rejection or blank screen.

### AC-010: Explicit Answer Reveal Action
- **Condition**: Card back is revealed ONLY upon explicit user interaction (clicking "Reveal Answer", pressing `Space`, or pressing `Enter`).
- **Pass**: Back remains unrevealed during initial load, card navigation, hover, mouse enter, focus, and scrolling.
- **Fail**: Back is visible by default or reveals on hover/focus.

### AC-011: Screen Reader Hidden-Answer Protection
- **Condition**: When a card is in the unrevealed state, the answer text must NOT exist in the rendered DOM (or must be strictly hidden from the accessibility tree).
- **Pass**: Screen reader inspection reveals zero back text before reveal. When revealed, `aria-live="polite"` announces the answer.
- **Fail**: Answer text is present in the DOM with only visual hiding (e.g. `opacity: 0`), exposing answers to screen readers.

### AC-012: Transient-Only Session State
- **Condition**: Review session progress (`currentIndex`, `isRevealed`) is stored strictly in client component memory.
- **Pass**: Refreshing the browser or navigating away resets the session cleanly. Zero writes occur in `localStorage` or `sessionStorage` for review progress.
- **Fail**: Review state attempts to write to database tables or browser storage.

### AC-013: Zero Progression / XP / Reward Mutation
- **Condition**: Completing a flashcard review session must produce ZERO mutations to:
  - `AcademyUserCourseProgress`
  - `AcademyUserLessonProgress`
  - `AcademyUserXp`
  - `AcademyRewardLedger`
- **Pass**: Integration tests assert row counts in all progress/XP tables remain identical before and after review.
- **Fail**: Any progress or XP records are created or mutated.

### AC-014: Zero FEAT-022 Redis Usage
- **Condition**: FEAT-022 implementation files introduce zero Redis imports, client calls, or caching keys.
- **Pass**: Static inspection verifies 0 Redis references in FEAT-022 source; existing Redis regression suite (`npm run test:redis`) remains 100% green.
- **Fail**: Redis cache or session key introduced by FEAT-022.

### AC-015: Safe Markdown Rendering & XSS Mitigation
- **Condition**: Flashcard front and back text rendered as Markdown must pass through the verified FEAT-021 `markdown-sanitizer.ts`.
- **Pass**: Heading downshift to `h2` is applied; script tags, inline event handlers (`onerror`, `onload`), dangerous schemes (`javascript:`, `data:`), and raw HTML tags are completely neutralized.
- **Fail**: Any unescaped XSS payload executes.

### AC-016: FEAT-022 Accessibility & Responsive Baseline
- **Condition**:
  - Exactly one `<h1>` element on the page (`Flashcards: [Lesson Title]`).
  - Keyboard operable: `Space`/`Enter` to flip, `ArrowRight` for next, `ArrowLeft` for prev, `R` for restart.
  - Keyboard handler guard: shortcuts are ignored when typing in `input`, `textarea`, `select`, or buttons.
  - Responsive container: layout adapts seamlessly from 320px mobile to 1440px+ desktop without horizontal scrolling or text clipping.
  - Respects `prefers-reduced-motion`.
- **Pass**: All accessibility and responsive tests pass.
- **Fail**: Multiple `<h1>`s, keyboard traps, shortcut hijacking, or broken mobile layout.

### AC-017: Human-Approved Option A Conformance
- **Condition**:
  - The authenticated API endpoint returns `{ front, back, order }` in the HTTP response payload.
  - The frontend client application MUST NOT render or expose the back answer in the DOM or accessibility tree before explicit Reveal action.
  - FEAT-022 explicitly acknowledges that back content exists in browser memory and authenticated network payloads as an approved formative study trade-off.
- **Pass**: Conforms strictly to Option A semantics without introducing Option B reveal endpoints or claims of DevTools secrecy.
- **Fail**: Implementation attempts server-enforced reveal endpoints or violates UI reveal concealment.

### AC-018: Monorepo Regression & Truthful Documentation
- **Condition**: All 14 monorepo validation commands pass with exit code 0:
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
  npm run guard:boundary
  npm run guard:audit-governance
  npm run guard:seed-safety
  ```
- **Pass**: 14/14 checks pass; implementation report and progress tracker updated truthfully.
- **Fail**: Any failing test, lint error, type error, or stale documentation.
