# Implementation Plan: FEAT-022 Flashcards Domain & Review Flow

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-022  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human Product Decision**: APPROVED (Transient Client-Side Review Session Only; Persistence DEFERRED)  
**Human Answer-Secrecy Decision**: APPROVED (Option A — UI Reveal Only)  
**Implementation**: NOT_STARTED  

---

## 1. Architectural Overview & System Boundaries

FEAT-022 introduces flashcard study capabilities attached to published lessons, reusing established patterns across `apps/api` (Express read model) and `apps/web` (React review UI).

```text
[ Learner Browser ]
       │
       ▼
[ /academy/courses/:courseSlug/lessons/:lessonSlug/flashcards ]
       │  (React + TanStack Query + native fetch via AcademyApiClient)
       │
       ▼  HTTP GET (Bearer JWT in Authorization Header)
[ GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards ]
       │
       ▼  authenticate middleware (role-free JWT)
[ AcademyCourseController.getPublishedFlashcards ]
       │
       ▼
[ AcademyCourseReadService.getPublishedFlashcards ]
       │
       ▼
[ PrismaAcademyCourseRepository.findPublishedFlashcardsByLesson ]
       │
       ▼  PostgreSQL (prisma.academyLesson / prisma.academyFlashcard)
[ Relational Read Query: published course + published lesson + ordered flashcards ]
```

### Invariant Architectural Boundaries
- **Prisma Schema**: Zero modifications to `apps/api/prisma/schema.prisma` or migration files.
- **Read-Only Operations**: Flashcard queries are pure reads; zero `INSERT`, `UPDATE`, or `DELETE` mutations.
- **Review Session State**: Managed purely in-memory in React component state. Refresh/navigation resets session.
- **Redis Boundary**: Zero Redis imports, calls, keys, or caching introduced in FEAT-022.
- **Frontend HTTP Boundary**: Extends existing `AcademyApiClient` using native browser `fetch` (no Axios).
- **Authentication**: Reuses existing `authenticate` middleware and FEAT-021 token passing pattern; zero client-side token storage in `localStorage` or `sessionStorage`.

---

## 2. Proposed Changes & File Modifications

### 2.1. Backend (`apps/api`)
1. **[MODIFY] `apps/api/src/modules/academy/academy.types.ts`**:
   - Add `FlashcardItemDto` (`front`, `back`, `order`) and `LessonFlashcardsResponseDto`.
2. **[MODIFY] `apps/api/src/modules/academy/academy.repository.ts`**:
   - Add `findPublishedFlashcardsByLesson(courseSlug, lessonSlug)` to `IAcademyCourseRepository` and `PrismaAcademyCourseRepository`.
   - Query filters by published course and published lesson, selecting lesson title and flashcards ordered by `order: "asc"`.
3. **[MODIFY] `apps/api/src/modules/academy/academy-course-read.service.ts`**:
   - Add `getPublishedFlashcards(courseSlug, lessonSlug)` returning `{ data: LessonFlashcardsResponseDto }` or throwing `AppError("Lesson not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)`.
4. **[MODIFY] `apps/api/src/modules/academy/academy-course.controller.ts`**:
   - Add `getPublishedFlashcards` handler validating slug parameters via `lessonSlugParamSchema` and delegating to service.
5. **[MODIFY] `apps/api/src/modules/academy/academy.routes.ts`**:
   - Register route `GET /courses/:courseSlug/lessons/:lessonSlug/flashcards` protected by `authenticate`.
6. **[NEW] `apps/api/src/modules/academy/academy-flashcard.test.ts`**:
   - Integration tests covering 401 unauthenticated, 404 published filtering, cross-course relational isolation, deterministic `order ASC`, minimized DTO whitelist, and zero mutation.

### 2.2. Frontend (`apps/web`)
1. **[MODIFY] `apps/web/src/features/academy/types/academy-ui.types.ts`**:
   - Add `FlashcardItemDto` and `LessonFlashcardsResponseDto`.
2. **[MODIFY] `apps/web/src/api/academy.api.ts`**:
   - Add `getLessonFlashcards(courseSlug, lessonSlug, accessToken?)` to `IAcademyApiClient` and `AcademyApiClient`.
3. **[MODIFY] `apps/web/src/features/academy/hooks/use-academy.ts`**:
   - Add `useFlashcardsQuery(courseSlug, lessonSlug, accessToken?)`.
4. **[NEW] `apps/web/src/features/academy/components/FlashcardReviewContainer.tsx`**:
   - Interactive card view, front/back state, card counter, previous/next/restart buttons, keyboard listener with interactive control guard, and `aria-live` announcement.
5. **[NEW] `apps/web/src/features/academy/pages/FlashcardReviewPage.tsx`**:
   - Page shell with breadcrumbs, page header (`h1`), and lifecycle states (`LOADING`, `SUCCESS`, `EMPTY`, `AUTH_REQUIRED`, `NOT_FOUND`, `ERROR`).
6. **[MODIFY] `apps/web/src/features/academy/pages/LessonDetailPage.tsx`**:
   - Add "Study Flashcards" button linking to the review route.
7. **[MODIFY] `apps/web/src/app/router/academy-routes.tsx`**:
   - Register route `/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards`.
8. **[MODIFY] `apps/web/src/index.css`**:
   - Add scoped CSS tokens for flashcard container, flip transitions, and responsive layout.
9. **[NEW] `apps/web/src/features/academy/pages/FlashcardReviewPage.test.tsx`**:
   - Unit and interaction tests covering reveal action, navigation, keyboard controls with input guard, empty/error/auth states, and screen reader DOM behavior.

---

## 3. Verification & Quality Assurance Plan

### 3.1. Automated Unit & Integration Tests
- **Backend API Integration Tests** (`apps/api`):
  - `401 Unauthorized` (`UNAUTHENTICATED`) when JWT is missing or invalid.
  - `404 Not Found` (`NOT_FOUND`) when parent Course is in `DRAFT` or `ARCHIVED` status.
  - `404 Not Found` (`NOT_FOUND`) when parent Lesson is in `DRAFT` or `ARCHIVED` status.
  - `404 Not Found` (`NOT_FOUND`) when `lessonSlug` does not belong to `courseSlug`.
  - `200 OK` returns flashcards ordered by `order ASC`.
  - `200 OK` with `flashcards: []` and `totalCount: 0` when published lesson has zero cards.
  - DTO whitelist verification: asserts response contains only `courseSlug`, `lessonSlug`, `lessonTitle`, `flashcards` (`front`, `back`, `order`), and `totalCount`. Contains NO `id`, `lessonId`, `courseId`, or timestamps.
  - Asserts zero database mutations occur during read execution.
- **Frontend Component & Page Tests** (`apps/web`):
  - `LOADING` skeleton renders during fetch.
  - `AUTH_REQUIRED` renders login redirect card with safe return redirect when API returns 401.
  - `NOT_FOUND` renders 404 message when API returns 404.
  - `EMPTY` state renders friendly "No flashcards yet" with return link when deck is empty.
  - Front prompt is visible by default; back answer is NOT in the DOM.
  - Clicking "Reveal Answer" mounts and renders back text.
  - Pressing `Space` or `Enter` reveals back text; shortcuts are disabled when typing in inputs.
  - Clicking "Next" advances card index and resets reveal state to front.
  - Clicking "Previous" decrements card index and resets reveal state to front.
  - Clicking "Restart" resets card index to 0.
  - XSS payload neutralization: malicious `<script>` or event handlers in front/back Markdown are strictly sanitized.

### 3.2. Automated Persistence & State Guard
- **Zero-Mutation Test**: Execute full flashcard review lifecycle through integration test and assert database row counts in `AcademyUserCourseProgress`, `AcademyUserLessonProgress`, `AcademyUserXp`, `AcademyRewardLedger`, and all Prisma tables remain unchanged.
- **Zero-Redis Verification**: Static analysis and code inspection confirm zero Redis imports or client calls in FEAT-022 files.

### 3.3. Monorepo Regression Suite (14 Mandatory Commands)
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

---

## 4. Risk Analysis & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **DevTools Answer Exposure** | Low / Formative | Flashcards are study aids, not exams. Human explicitly approved Option A (UI reveal only). Quizzes own high-stakes evaluation. |
| **Accidental Database Mutation** | High / Governance | All backend queries are pure reads. Automated persistence guard asserts zero DB row changes. |
| **Screen Reader Leaking Answer Pre-Reveal** | Medium / A11y | Card back is completely unmounted from the DOM until `isRevealed === true`, rather than using CSS hiding. |
| **Keyboard Shortcut Hijacking** | Medium / UX | `isInteractiveElement` guard checks event target before handling `Space`, `Enter`, Arrow keys, or `R`. |
| **XSS from Markdown Content** | High / Security | Reuses FEAT-021 verified `markdown-sanitizer.ts` (marked AST heading downshift + DOMPurify allowlist). |
| **Cross-Lesson Flashcard Leakage** | High / Isolation | Relational Prisma query enforces `lesson.slug` + `course.slug` scoping. |
