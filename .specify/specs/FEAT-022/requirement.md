# Requirement: FEAT-022 Flashcards Domain & Review Flow

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-022  
**Phase**: Phase 4 — Academy  
**Feature Type**: Backend API Read Model & Frontend Interactive Flashcard Review UI  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human Product Decision**: APPROVED (Transient Client-Side Review Session Only; Persistence DEFERRED)  
**Human Answer-Secrecy Decision**: APPROVED (Option A — UI Reveal Only)  
**Implementation Agent**: Antigravity (Implementation: NOT_STARTED)  
**QA Owner**: Independent QA / Codex Governance  

---

## 1. Context & Background

Phase 4 rebuilds the learner-facing Academy domain on the approved production architecture.
- **FEAT-019**: Established the durable persistence foundation (`DONE`, `feat-019-approved`), including the `AcademyFlashcard` model with unique `[lessonId, order]` constraint.
- **FEAT-020**: Delivered the public course catalog, public course outline, and authenticated lesson read APIs (`DONE`, `feat-020-approved`).
- **FEAT-021**: Delivered the learner-facing course catalog, course detail, and lesson detail frontend views with dual-query orchestration, security boundaries, and accessibility baselines (`DONE`, `feat-021-approved`).

FEAT-022 is the fourth feature in Phase 4. It introduces flashcard study capabilities attached to published lessons, enabling learners to reinforce concepts through interactive card flipping and review cycles.

---

## 2. Human Decisions & Architectural Locks

The following constraints are formally locked by Human Decision:

1. **Flashcard Review State Persistence**: **DEFERRED**
   - No database persistence of reviewed cards, mastered cards, card difficulty ratings, or review timestamps.
   - No spaced repetition algorithm (e.g. SM-2, Leitner) in Phase 4.
2. **Review Session Lifecycle**: **TRANSIENT CLIENT-SIDE REVIEW SESSION ONLY**
   - Review session state (`currentIndex`, `isRevealed`) is managed strictly in memory within the client application.
   - Navigating away from or refreshing the page cleanly resets the transient review session.
   - No `localStorage` or `sessionStorage` review state persistence.
3. **Answer Secrecy Level**: **OPTION A — UI REVEAL ONLY (APPROVED)**
   - **Canonical Semantics**: The authenticated API returns `{ front, back, order }` for each flashcard.
   - The back answer exists in the authenticated HTTP payload and browser memory. FEAT-022 does not promise DevTools/network concealment.
   - The learner UI MUST NOT render or expose back content in the DOM or accessibility tree before explicit Reveal action.
   - This is a formative, self-paced study interaction. High-stakes correct-answer server secrecy is owned by Quizzes (`FEAT-023`, `FEAT-024`, `FEAT-025`).
4. **Progression & Reward Boundary**:
   - Zero mutation to `AcademyUserCourseProgress` or `AcademyUserLessonProgress`.
   - Zero XP awards (`AcademyUserXp`) and zero reward ledger entries (`AcademyRewardLedger`).
   - Progress completion remains strictly reserved for later features (`FEAT-026`, `FEAT-027`).
5. **Infrastructure & Redis Boundary**:
   - Zero Redis state, caching, or durable authority for flashcard review sessions.
   - FEAT-022 code introduces zero Redis imports, calls, or keys.

---

## 3. Rejected Alternatives

### OPTION B: Server-Enforced Reveal (FUTURE / REJECTED FOR FEAT-022)
- Returning only front text initially and fetching back text on-demand via secondary endpoint is rejected for Phase 4 MVP.
- **Rationale**: Flashcards in Academy are formative study aids. Network round-trips on every card flip create friction, degrade mobile UX, and offer negligible security benefit for low-stakes self-assessment.

---

## 4. Scope Boundaries

### In Scope
1. **Backend Read API**:
   - Authenticated endpoint: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards`.
   - Reuses existing Aura Capital error envelope: `{ error: { code, message } }` via `AppError`.
   - Strict published visibility: parent `AcademyCourse` must be `PUBLISHED` AND parent `AcademyLesson` must be `PUBLISHED`.
   - Relational scoping: query enforces that the lesson belongs to the specified course.
   - Deterministic ordering: `order ASC` (guaranteed unique per lesson by `@@unique([lessonId, order])`).
   - Minimized DTO: `{ front, back, order }`. No internal UUIDs (`id`, `lessonId`, `courseId`) or timestamps.
   - Lesson title derived directly from the published lesson query (no redundant queries).
   - Empty deck: published lesson with 0 flashcards returns HTTP 200 with `flashcards: []`, `totalCount: 0`.
2. **Frontend Review UI**:
   - Canonical route: `/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards`.
   - Extends existing `AcademyApiClient` (`apps/web/src/api/academy.api.ts`) using standard browser `fetch`.
   - Extends existing TanStack Query hooks (`apps/web/src/features/academy/hooks/use-academy.ts`).
   - Reuses approved FEAT-021 authentication pattern (no new auth architecture or client token storage).
   - Interactive review container:
     - Front prompt card area.
     - "Reveal Answer" explicit action button.
     - Revealed back answer card area with safe sanitized Markdown rendering.
     - Navigation controls: Previous Card, Next Card, Restart Session.
     - Card counter (`Card X of Y`).
     - Deck completion summary screen on completing the last card.
   - Entry point: "Study Flashcards" CTA button on `LessonDetailPage`.
   - Async states: `LOADING`, `SUCCESS`, `EMPTY`, `AUTH_REQUIRED` (with safe return redirect), `NOT_FOUND`, `ERROR` with retry.
3. **Accessibility & Responsive Baseline**:
   - Single `<h1>` per view (`Flashcards: [Lesson Title]`).
   - DOM-level conditional rendering: back text completely excluded from the accessibility tree when unrevealed.
   - Screen reader announcement via `aria-live="polite"` upon reveal.
   - Keyboard operability with input guard: `Space`/`Enter` (flip), `ArrowRight` (next), `ArrowLeft` (prev), `R` (restart) are disabled when focus is on interactive controls (`input`, `textarea`, `select`, `button`, `a`).
   - Responsive layout: fluid card layout adapting from 320px mobile to 1440px+ desktop without horizontal overflow.
   - Respects `prefers-reduced-motion`.
4. **Security & Sanitization**:
   - Reuses EXACT `markdown-sanitizer.ts` from FEAT-021 (marked AST heading shift down to `h2` + strict DOMPurify allowlist).
   - Zero unsanitized `dangerouslySetInnerHTML`.

### Out of Scope (Strictly Excluded)
- Database schema changes or migrations.
- User review progress persistence (mastery, difficulty, intervals).
- Spaced repetition scheduling.
- Lesson completion or course progress mutation (`FEAT-026`).
- XP or reward granting (`FEAT-027`).
- Quiz creation, attempts, or grading (`FEAT-023`..`FEAT-025`).
- CMS/admin authoring interfaces.
- Redis caching or session management.
- Product audit persistence (`FEAT-029`).

---

## 5. Stakeholder & Acceptance Matrix

| Verification Area | Target Layer | Criteria |
| :--- | :--- | :--- |
| **Backend API Contract** | `apps/api` | Minimized DTO, relational scoping, published status gate, 401 auth gate, deterministic `order ASC`. |
| **Frontend Review Flow** | `apps/web` | Interactive flip, card navigation, restart, empty/error/auth states, zero durable mutation. |
| **Security & XSS** | `apps/web` | Reused FEAT-021 Markdown sanitizer, heading downshift, DOMPurify boundary. |
| **Accessibility Baseline** | `apps/web` | Single `<h1>`, keyboard shortcuts with input guard, hidden-answer AT protection, `aria-live` reveal. |
| **Regression & Guards** | Monorepo | All 14 monorepo validation checks pass; zero DB/Redis mutation verified. |
