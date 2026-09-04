# Tasks: FEAT-022 Flashcards Domain & Review Flow

**Status**: IMPLEMENTED / READY FOR QA  
**Feature ID**: FEAT-022  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human Product Decision**: APPROVED (Transient Client-Side Review Session Only; Persistence DEFERRED)  
**Human Answer-Secrecy Decision**: APPROVED (Option A — UI Reveal Only)  
**Implementation**: COMPLETE  

---

## 1. Task Dependency Overview

```text
[T1: Minimized DTOs & Validation] ───> [T2: Relational Repository Query] ───> [T3: Service Read Method]
                                                                                      │
                                                                                      ▼
[T5: Backend Integration Tests] <──────────────────────────────────────── [T4: Controller & Authenticated Route]
          │
          ▼
[T6: Frontend API Client & Hook] ───────────────────────────────────────> [T7: Flashcard Route & Page Shell]
                                                                                      │
                                                                                      ▼
[T9: Content Sanitization & XSS] <──────────────────────────────────────── [T8: Review Container & State Machine]
          │
          ▼
[T10: Accessibility & Responsive Polish] ────────────────────────────────> [T11: Frontend Component & State Tests]
                                                                                      │
                                                                                      ▼
                                                                           [T12: Monorepo Regression & Report]
```

---

## 2. Detailed Task Definitions

### Phase A: Backend Read Model & API Integration

#### Task T1: Define Minimized Flashcard DTOs & Parameter Validation
- **Scope**:
  - In `apps/api/src/modules/academy/academy.types.ts`: Define `FlashcardItemDto` (`front`, `back`, `order`) and `LessonFlashcardsResponseDto` (`courseSlug`, `lessonSlug`, `lessonTitle`, `flashcards`, `totalCount`). Omit `id`, `lessonId`, `courseId`, and timestamps.
  - In `apps/api/src/modules/academy/academy.validation.ts`: Re-verify `lessonSlugParamSchema` validates `courseSlug` and `lessonSlug`.
- **Inputs**: `FEAT-022 spec.md` Section 3.
- **Outputs**: Strongly typed DTO interfaces and validated path schemas.
- **Verification**: `npm run typecheck` passes cleanly.

#### Task T2: Implement Relational Flashcard Repository Query
- **Scope**:
  - In `apps/api/src/modules/academy/academy.repository.ts`: Add `findPublishedFlashcardsByLesson(courseSlug, lessonSlug)` to `IAcademyCourseRepository` and `PrismaAcademyCourseRepository`.
  - Enforce relational traversal: `lesson.status === 'PUBLISHED'` AND `lesson.course.status === 'PUBLISHED'`.
  - Order flashcards by `order: "asc"` (uniqueness guaranteed by `@@unique([lessonId, order])`).
  - Retrieve lesson title from the same published lesson lookup.
  - Pure read query: zero `INSERT`, `UPDATE`, or `DELETE` operations.
- **Inputs**: `apps/api/prisma/schema.prisma` `AcademyFlashcard` and `AcademyLesson` models.
- **Outputs**: Repository method returning `{ lessonTitle, flashcards }` or `null`.
- **Verification**: Typecheck passes; repository tests assert query filters and published status constraints.

#### Task T3: Implement Academy Course Read Service Method
- **Scope**:
  - In `apps/api/src/modules/academy/academy-course-read.service.ts`: Implement `getPublishedFlashcards(courseSlug, lessonSlug)`.
  - If repository returns `null`, throw `new AppError("Lesson not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)`.
  - Map repository data to `LessonFlashcardsResponseDto` whitelist (excluding internal UUIDs).
- **Inputs**: `IAcademyCourseRepository` interface, `AppError` envelope.
- **Outputs**: Service method returning `{ data: LessonFlashcardsResponseDto }`.
- **Verification**: Unit tests verify 404 throwing on missing/draft parent and valid DTO projection.

#### Task T4: Register Controller Handler & Authenticated Express Route
- **Scope**:
  - In `apps/api/src/modules/academy/academy-course.controller.ts`: Implement `getPublishedFlashcards` handler validating params via `lessonSlugParamSchema`.
  - In `apps/api/src/modules/academy/academy.routes.ts`: Register route `GET /courses/:courseSlug/lessons/:lessonSlug/flashcards` protected with `authenticate` middleware.
- **Inputs**: Express router, authenticate middleware, service method.
- **Outputs**: Mounted, authenticated API endpoint.
- **Verification**: Route registration verified via static inspection and route list.

#### Task T5: Backend API Integration & Security Tests
- **Scope**:
  - In `apps/api/src/modules/academy/academy-flashcard.test.ts`:
    - Test 401 when Authorization header is absent, expired, or malformed.
    - Test 404 when course is `DRAFT` or `ARCHIVED`.
    - Test 404 when lesson is `DRAFT` or `ARCHIVED`.
    - Test 404 when `lessonSlug` does not belong to `courseSlug` (cross-course isolation).
    - Test 200 OK returns flashcards in strict `order ASC`.
    - Test 200 OK with `flashcards: []` and `totalCount: 0` when published lesson has zero cards.
    - Test response contains zero internal IDs (`id`, `lessonId`, `courseId`) or timestamps.
    - Test zero database mutations occur during read requests.
- **Inputs**: Test database with published and draft fixtures.
- **Outputs**: Passing integration test suite.
- **Verification**: `npm run test:db` passes 100%.

---

### Phase B: Frontend Presentation & Review Flow

#### Task T6: Extend Existing Academy API Client & Query Hook
- **Scope**:
  - In `apps/web/src/features/academy/types/academy-ui.types.ts`: Add `FlashcardItemDto` and `LessonFlashcardsResponseDto`.
  - In `apps/web/src/api/academy.api.ts`: Extend `IAcademyApiClient` and `AcademyApiClient` with `getLessonFlashcards(courseSlug, lessonSlug, accessToken?)` using standard browser `fetch`.
  - In `apps/web/src/features/academy/hooks/use-academy.ts`: Add `useFlashcardsQuery(courseSlug, lessonSlug, accessToken?)` with `["academy", "flashcards", courseSlug, lessonSlug]` query key.
- **Inputs**: Backend endpoint contract, existing `AcademyApiClient`.
- **Outputs**: Type-safe API client method and React hook.
- **Verification**: Unit tests for API client success and error paths.

#### Task T7: Flashcard Review Page Shell & Routing
- **Scope**:
  - In `apps/web/src/app/router/academy-routes.tsx`: Register `/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards`.
  - In `apps/web/src/features/academy/pages/FlashcardReviewPage.tsx`: Implement page shell with breadcrumbs, page header (`h1: Flashcards: [Lesson Title]`), and async states (`LOADING`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR`, `EMPTY`, `SUCCESS`).
  - In `apps/web/src/features/academy/pages/LessonDetailPage.tsx`: Add "Study Flashcards" CTA button linking to the review route.
- **Inputs**: React Router, Academy layout tokens.
- **Outputs**: Mounted route shell with async state management.
- **Verification**: Route renders correctly with skeleton, 404, and auth-required cards.

#### Task T8: Flashcard Review Container & Transient State Machine
- **Scope**:
  - In `apps/web/src/features/academy/components/FlashcardReviewContainer.tsx`:
    - In-memory state: `currentIndex` (number) and `isRevealed` (boolean).
    - Render front prompt card.
    - Render "Reveal Answer" action button.
    - Render back card conditionally when `isRevealed === true`.
    - Render Previous, Next, and Restart buttons.
    - Render position indicator (`Card X of Y`).
    - Render deck completion summary upon finishing the final card.
    - Next/Prev and Restart automatically reset `isRevealed` to `false`.
    - Refresh/navigation cleanly resets session state.
- **Inputs**: Flashcard DTO array.
- **Outputs**: Interactive flashcard review container.
- **Verification**: Interactive tests verify flip, next, prev, and restart transitions.

#### Task T9: Content Sanitization & Safe Markdown Rendering
- **Scope**:
  - In `FlashcardReviewContainer.tsx`: Re-use FEAT-021 `markdown-sanitizer.ts` for rendering Markdown in front and back card faces.
  - Enforce heading normalization downshift (no `h1` permitted) and DOMPurify allowlist.
  - Zero raw HTML or script execution permitted.
- **Inputs**: `apps/web/src/features/academy/utils/markdown-sanitizer.ts`.
- **Outputs**: Safe flashcard text rendering.
- **Verification**: Malicious XSS vectors neutralized.

#### Task T10: Accessibility, Keyboard Guard & Responsive Polish
- **Scope**:
  - Keyboard listener with `isInteractiveElement` guard: `Space`/`Enter` (flip), `ArrowRight` (next), `ArrowLeft` (prev), `R` (restart) are ignored when typing in `input`, `textarea`, `select`, or buttons.
  - DOM-level conditional rendering: back text completely unmounted from the DOM when unrevealed.
  - Screen reader announcement via `aria-live="polite"` upon reveal.
  - Single `<h1>` per view (`Flashcards: [Lesson Title]`).
  - Responsive CSS in `apps/web/src/index.css`: fluid card layout adapting from 320px to 1440px+ without horizontal overflow.
  - Respect `prefers-reduced-motion` for transitions.
- **Inputs**: WCAG 2.1 AA guidelines, `ui-context.md`.
- **Outputs**: Accessible, responsive flashcard review experience.
- **Verification**: Accessibility test assertions pass; screen reader inspection verified.

#### Task T11: Frontend Component & State Machine Tests
- **Scope**:
  - In `apps/web/src/features/academy/pages/FlashcardReviewPage.test.tsx`:
    - Test loading skeleton display.
    - Test 401 auth-required state with safe internal return redirect.
    - Test 404 not found state.
    - Test empty deck message.
    - Test card front is visible initially and back is not in the DOM.
    - Test clicking Reveal mounts and renders back.
    - Test Next advances to card 2 and resets reveal state.
    - Test Previous returns to card 1 and resets reveal state.
    - Test Restart resets to card 1.
    - Test keyboard shortcuts work and are disabled when focus is in interactive inputs.
    - Test single `<h1>` heading constraint.
- **Inputs**: React Testing Library, mock query responses.
- **Outputs**: Comprehensive frontend unit/integration test suite.
- **Verification**: `npm run test:unit` in `apps/web` passes 100%.

---

### Phase C: Governance & Monorepo Validation

#### Task T12: Monorepo Regression, Persistence Verification & Implementation Report
- **Scope**:
  - Execute full monorepo regression across all 14 mandatory validation suites.
  - Execute persistence verification guard: assert zero DB mutations after flashcard interactions.
  - Verify zero Redis imports, calls, or keys introduced in FEAT-022 code.
  - Author `reports/implementation/phase-4/FEAT-022.md`.
  - Update `docs/progress-tracker.md` and `docs/phase-4-feature-decomposition.md`.
- **Inputs**: Completed implementation and tests.
- **Outputs**: 14/14 green checks, truthful implementation report, updated progress tracker.
- **Verification**: Clean exit code 0 across all guards and test suites.

---

## 3. Task to Acceptance Criteria Traceability Matrix

| Task | Primary ACs Covered |
| :--- | :--- |
| **T1: Minimized DTOs & Validation** | AC-006 |
| **T2: Relational Repository Query** | AC-001, AC-003, AC-004, AC-005, AC-013 |
| **T3: Service Read Method** | AC-003, AC-004, AC-006, AC-007 |
| **T4: Controller & Routes** | AC-002, AC-004, AC-007 |
| **T5: Backend Integration Tests** | AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-013, AC-017 |
| **T6: Frontend API Client & Hook** | AC-002, AC-006, AC-009 |
| **T7: Page Shell & Routing** | AC-008, AC-009, AC-016 |
| **T8: Review Container & State Machine** | AC-010, AC-012 |
| **T9: Content Sanitization & XSS** | AC-015 |
| **T10: Accessibility & Responsive Polish** | AC-011, AC-016 |
| **T11: Frontend Component Tests** | AC-007, AC-009, AC-010, AC-011, AC-012, AC-015, AC-016, AC-017 |
| **T12: Monorepo Regression & Report** | AC-001, AC-013, AC-014, AC-018 |
