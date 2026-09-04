# Specification: FEAT-022 Flashcards Domain & Review Flow

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-022  
**Phase**: Phase 4 — Academy  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Human Planning Approval**: APPROVED  
**Human Product Decision**: APPROVED (Transient Client-Side Review Session Only; Persistence DEFERRED)  
**Human Answer-Secrecy Decision**: APPROVED (Option A — UI Reveal Only)  
**Implementation**: NOT_STARTED  

---

## 1. Domain Model & Schema Baseline

### 1.1. Prisma Schema Verification
From `apps/api/prisma/schema.prisma` (established in `FEAT-019`):

```prisma
model AcademyFlashcard {
  id        String   @id @default(uuid())
  lessonId  String   @map("lesson_id")
  front     String
  back      String
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  lesson AcademyLesson @relation(fields: [lessonId], references: [id], onDelete: Restrict)

  @@unique([lessonId, order])
  @@index([lessonId])
  @@map("academy_flashcards")
}
```

### 1.2. Schema Governance Rules
1. **Parent Relationship**: `AcademyFlashcard` belongs strictly to `AcademyLesson` via `lessonId`. It does NOT belong to `AcademyCourse` directly.
2. **Published Visibility**: `AcademyFlashcard` has NO status field. Visibility is strictly derived from the relational chain:
   - `AcademyCourse.status === "PUBLISHED"`
   - `AcademyLesson.status === "PUBLISHED"`
3. **Ordering**: `order ASC`. Because the database enforces `@@unique([lessonId, order])`, duplicate orders cannot exist under the same lesson.
4. **Schema Changes**: **ZERO schema changes**. The existing schema completely fulfills all FEAT-022 requirements.

---

## 2. Backend REST API Specification

### 2.1. Read Flashcards Endpoint
- **Method / Path**: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/flashcards`
- **Access Level**: **AUTHENTICATED** (requires valid role-free Bearer JWT via `authenticate` middleware).
- **Rationale**: Flashcard content represents educational lesson material. Consistent with the authenticated boundary established for lesson content in FEAT-020 (`GET .../lessons/:lessonSlug`), flashcard access requires an active learner session.

#### Path Parameters
| Parameter | Type | Validation Constraint | Description |
| :--- | :--- | :--- | :--- |
| `courseSlug` | `string` | Regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1-120 chars | URL-safe slug of published parent course |
| `lessonSlug` | `string` | Regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, 1-120 chars | URL-safe slug of published parent lesson |

#### HTTP Response Status Codes & Aura Capital Error Envelope
| Status | Condition | Error Code | Response Envelope |
| :--- | :--- | :--- | :--- |
| `200 OK` | Course & lesson published, authenticated | N/A | `{ data: LessonFlashcardsResponseDto }` |
| `400 Bad Request` | Malformed slug parameter | `VALIDATION_ERROR` | `{ error: { code: "VALIDATION_ERROR", message: "..." } }` |
| `401 Unauthorized` | Missing, expired, or invalid JWT | `UNAUTHENTICATED` | `{ error: { code: "UNAUTHENTICATED", message: "Authentication required" } }` |
| `404 Not Found` | Course/lesson not found, draft/archived, or relation mismatch | `NOT_FOUND` | `{ error: { code: "NOT_FOUND", message: "Lesson not found or unavailable" } }` |
| `500 Internal Server Error` | Database/runtime exception | `INTERNAL_ERROR` | `{ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }` |

*Security Invariant*: Draft courses, draft lessons, archived states, mismatched slugs, or missing slugs return an identical, indistinguishable generic `404 Not Found` to prevent metadata leakage.

*Empty Deck Invariant*: A published course with a published lesson that has zero flashcards returns `200 OK` with `flashcards: []` and `totalCount: 0`. It does NOT return 404.

---

## 3. Data Transfer Objects (DTO)

### 3.1. Minimized Option A DTO (Canonical)
```typescript
export interface FlashcardItemDto {
  front: string;
  back: string;
  order: number;
}

export interface LessonFlashcardsResponseDto {
  courseSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  flashcards: FlashcardItemDto[];
  totalCount: number;
}
```

### 3.2. DTO Whitelist Invariants
- `id`, `courseId`, and `lessonId` internal UUIDs are strictly omitted.
- `createdAt` and `updatedAt` database timestamps are omitted.
- No quiz, progress, XP, or reward ledger fields are present.
- Raw Prisma entity instances are NEVER serialized directly.

---

## 4. Repository & Service Architecture

### 4.1. Repository Interface Extension
In `apps/api/src/modules/academy/academy.repository.ts`:

```typescript
export interface IAcademyCourseRepository {
  // Existing methods ...
  findPublishedFlashcardsByLesson(
    courseSlug: string,
    lessonSlug: string
  ): Promise<{
    lessonTitle: string;
    flashcards: Array<Pick<AcademyFlashcard, "front" | "back" | "order">>;
  } | null>;
}
```

### 4.2. Relational Query Enforcement
```typescript
async findPublishedFlashcardsByLesson(
  courseSlug: string,
  lessonSlug: string
): Promise<{
  lessonTitle: string;
  flashcards: Array<Pick<AcademyFlashcard, "front" | "back" | "order">>;
} | null> {
  const lesson = await this.prisma.academyLesson.findFirst({
    where: {
      slug: lessonSlug,
      status: "PUBLISHED",
      course: {
        slug: courseSlug,
        status: "PUBLISHED",
      },
    },
    select: {
      title: true,
      flashcards: {
        select: {
          front: true,
          back: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!lesson) {
    return null;
  }

  return {
    lessonTitle: lesson.title,
    flashcards: lesson.flashcards,
  };
}
```

- **Query Semantics**: Standard read query. Zero mutations (`INSERT`, `UPDATE`, `DELETE`).
- **Lesson Title Source**: Derived directly from the published lesson lookup in the same relational query.

### 4.3. Service Implementation
In `apps/api/src/modules/academy/academy-course-read.service.ts`:

```typescript
async getPublishedFlashcards(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonFlashcardsResponse> {
  const result = await this.courseRepo.findPublishedFlashcardsByLesson(courseSlug, lessonSlug);

  if (!result) {
    throw new AppError("Lesson not found", ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return {
    data: {
      courseSlug,
      lessonSlug,
      lessonTitle: result.lessonTitle,
      flashcards: result.flashcards.map((card) => ({
        front: card.front,
        back: card.back,
        order: card.order,
      })),
      totalCount: result.flashcards.length,
    },
  };
}
```

---

## 5. Frontend Architecture & Review Flow

### 5.1. Existing API Client Extension
In `apps/web/src/api/academy.api.ts`, extend `AcademyApiClient` using standard browser `fetch`:

```typescript
async getLessonFlashcards(
  courseSlug: string,
  lessonSlug: string,
  accessToken?: string
): Promise<{ data: LessonFlashcardsResponseDto }> {
  const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/flashcards`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { method: "GET", headers });

  if (!res.ok) {
    await this.handleError(res);
  }

  return (await res.json()) as { data: LessonFlashcardsResponseDto };
}
```

In `apps/web/src/features/academy/hooks/use-academy.ts`:

```typescript
export function useFlashcardsQuery(
  courseSlug: string | undefined,
  lessonSlug: string | undefined,
  accessToken?: string
) {
  return useQuery({
    queryKey: ["academy", "flashcards", courseSlug, lessonSlug],
    queryFn: () => {
      if (!courseSlug || !lessonSlug) throw new Error("Course and lesson slugs are required");
      return academyApi.getLessonFlashcards(courseSlug, lessonSlug, accessToken);
    },
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    retry: (failureCount, error: unknown) => {
      if (error instanceof AcademyApiError && (error.status === 401 || error.status === 404)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
```

### 5.2. Review State Machine (Transient Client-Side)
- **Lifecycle States**: `LOADING`, `EMPTY`, `ERROR`, `AUTH_REQUIRED`, `NOT_FOUND`, `READY_FRONT`, `REVEALED`.

```text
           [Init / Fetch]
                 │
                 ▼
          ┌─────────────┐
          │   LOADING   │
          └──────┬──────┘
                 │
       ┌─────────┴───────────────┬─────────────────┬─────────────────┐
       ▼                         ▼                 ▼                 ▼
 ┌───────────┐             ┌───────────┐     ┌───────────┐     ┌───────────┐
 │   EMPTY   │             │   ERROR   │     │ 401 AUTH  │     │  404 NOT  │
 │ (0 cards) │             │ (w/ retry)│     │ REQUIRED  │     │   FOUND   │
 └───────────┘             └───────────┘     └───────────┘     └───────────┘
       │
       ▼ (cards.length > 0)
 ┌─────────────────────────────────────────────────────────────┐
 │                         ACTIVE DECK                         │
 │                                                             │
 │   ┌───────────────┐     Reveal Action     ┌───────────────┐ │
 │   │  READY_FRONT  │ ────────────────────> │   REVEALED    │ │
 │   │ (Back hidden) │                       │ (Back visible)│ │
 │   └───────┬───────┘                       └───────┬───────┘ │
 │           │                                       │         │
 │           │<──────── Next / Prev / Restart ───────┘         │
 └─────────────────────────────────────────────────────────────┘
```

#### State Transition Rules
1. `READY_FRONT`: Front prompt displayed. Card back is completely excluded from the rendered DOM and accessibility tree.
2. `REVEALED`: Triggered by explicit learner action ("Reveal Answer" click, Space key, or Enter key). Back answer mounts and is announced via `aria-live="polite"`.
3. `NEXT`: Increments `currentIndex`. Automatically resets reveal state to `READY_FRONT`. If on the last card, renders deck completion summary with a "Restart Review" button.
4. `PREVIOUS`: Decrements `currentIndex`. Automatically resets reveal state to `READY_FRONT`.
5. `RESTART`: Resets `currentIndex = 0` and reveal state to `READY_FRONT`.
6. **Session Reset**: Navigating away or refreshing resets all transient state to initial values.

### 5.3. Keyboard Behavior & Input Guard
Global keydown listeners for shortcuts (`Space`, `Enter`, `ArrowRight`, `ArrowLeft`, `R`) must include an interactive element guard:

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
If `isInteractiveElement(e.target)` is true, shortcuts are NOT intercepted. Explicit button interaction remains the primary accessible mechanism.

---

## 6. Content Security & Sanitization

- Flashcard front and back text are rendered through the exact `markdown-sanitizer.ts` from FEAT-021.
- Parser AST visitor enforces heading depth normalization (`#` $\to$ `h2`, clamped at `h6`).
- Strict DOMPurify allowlist strips `<script>`, inline event handlers (`onload`, `onerror`), `javascript:` URIs, `data:` URIs, `<iframe>`, and `<form>`.
- The flashcard page has exactly one page-level `<h1>` (`Flashcards: [Lesson Title]`).
- Sanitization boundary mitigates XSS risks; no unsanitized `dangerouslySetInnerHTML`.

---

## 7. Performance & Caching

### 7.1. Client-Side Query Caching (TanStack Query)
- Query Key: `["academy", "flashcards", courseSlug, lessonSlug]`
- `staleTime`: 2 minutes; `gcTime`: 10 minutes.
- Isolation: Flashcards for different lessons never collide.

### 7.2. Infrastructure Boundary
- **Zero Redis Usage**: FEAT-022 code introduces zero Redis imports, calls, or keys.
- **Zero Database Mutation**: Pure read queries.
