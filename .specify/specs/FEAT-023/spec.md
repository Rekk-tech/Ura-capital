# Specification: FEAT-023 Quiz Definition & Safe Projection

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-023  
**Phase**: Phase 4 — Academy  
**Feature Type**: Backend API Read Model & Safe Projection Contract  
**Planning Status**: COMPLETE (HUMAN APPROVED)  
**Human Planning Approval**: APPROVED  
**Implementation Status**: NOT_STARTED  
**QA Status**: NOT_STARTED  
**Human Final Gate**: NOT APPROVED  
**FEAT-024**: BLOCKED  
**Phase 4 Status**: IN_PROGRESS  

---

## 1. HTTP Endpoint Contract

### 1.1. Primary & Alias Routes
- **Canonical Route**: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz`
- **Express Alias Route**: `GET /academy/courses/:courseSlug/lessons/:lessonSlug/quiz`
- **HTTP Method**: `GET`
- **Access Control**: **AUTHENTICATED** (Learner)
  - Protected by `authenticate` middleware (`apps/api/src/modules/auth/auth.middleware.ts`).
  - Requires valid, non-expired Bearer JWT access token (`typ: "access"`).
  - Any active learner role is authorized; no administrative or instructor role required.

### 1.2. Request Parameters & Validation
Route parameters must adhere to canonical slug validation:
```typescript
export const getLessonQuizParamsSchema = z.object({
  courseSlug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid course slug format"),
  lessonSlug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid lesson slug format"),
});
```

- Invalid format, uppercase characters, whitespace, special symbols, or traversal attempts $\rightarrow$ `400 Bad Request` with `{ code: "VALIDATION_ERROR", message: "...", details: [...] }`.

---

## 2. Response DTO Specification (Safe Projection)

### 2.1. Whitelist Response Schema
Under NO circumstances are raw Prisma models returned. The response envelope is strictly mapped to the following schema:

```typescript
export interface QuizOptionDto {
  id: string;      // Stable opaque UUID for submission binding
  text: string;    // Display text of the option
  order: number;   // Deterministic option display order
}

export interface QuizQuestionDto {
  id: string;               // Stable opaque UUID for answer submission binding
  prompt: string;           // Question prompt text
  type: "SINGLE_CHOICE";    // Canonical question type (SINGLE_CHOICE ONLY)
  order: number;            // Deterministic question display order
  options: QuizOptionDto[]; // Ordered option choices
}

export interface QuizDefinitionDto {
  id: string;                 // Stable opaque UUID of the quiz
  courseSlug: string;         // Verified parent course slug
  lessonSlug: string;         // Verified parent lesson slug
  lessonTitle: string;        // Title of the parent lesson
  title: string;              // Title of the quiz
  description: string | null; // Optional description/instructions
  passingScore: number;       // Approved safe metadata: required passing threshold (e.g. 80)
  totalQuestions: number;     // Number of questions in quiz
  questions: QuizQuestionDto[];
}
```

### 2.2. Pre-Submission Metadata vs. Forbidden Evaluation Data
- **Approved Safe Pre-Submission Metadata**:
  - `passingScore`: The published passing threshold percentage (e.g. `80`). This is safe pre-submission quiz metadata; it does NOT evaluate or reveal any learner or question result.
  - `totalQuestions`, `title`, `description`, `order`.
- **Forbidden Pre-Submission Evaluation Data (Strict Denylist)**:
  - `isCorrect` / `is_correct` (P1 Security Defect if leaked)
  - `explanation` (must NOT be returned before attempt submission/evaluation)
  - `correctOptionId` / `correct_option_id`
  - `correctAnswer` / `answerKey` / `solution`
  - `score` / `learnerScore` / `pointsAwarded` / `gradingResult` / `passFailResult`
  - Internal foreign keys: `lessonId`, `courseId`, `quizId`, `questionId`, `selectedOptionId`
  - Timestamps / internal status: `createdAt`, `updatedAt`, `status` of options/questions.

---

## 3. Database Query & Visibility Rules

### 3.1. Primary Quiz Read Policy & Relational Ownership
The repository query MUST enforce full relational integrity across Course, Lesson, and Quiz in a single database operation:

1. `course.status = 'PUBLISHED'` AND `course.slug = :courseSlug`
2. `lesson.status = 'PUBLISHED'` AND `lesson.slug = :lessonSlug` AND `lesson.course_id = course.id`
3. `quiz.status = 'PUBLISHED'` AND `quiz.lesson_id = lesson.id`
4. **Ordering & Selection**: Order quizzes by `quiz.order ASC` and select the **lowest-order PUBLISHED quiz** (`findFirst`).

> [!NOTE]
> **Cardinality Clarification**:
> The database schema enforces `@@unique([lessonId, order])`, permitting multiple quizzes per lesson with distinct order values.
> Returning the lowest-order published quiz is a **read-model selection policy**, NOT a domain invariant claiming lessons can only ever have one quiz.

### 3.2. Uniform 404 Indistinguishability
To prevent reconnaissance and content discovery:
- Nonexistent course slug $\rightarrow$ `404 Not Found`
- `DRAFT` or `ARCHIVED` course $\rightarrow$ `404 Not Found`
- Nonexistent lesson slug $\rightarrow$ `404 Not Found`
- `DRAFT` or `ARCHIVED` lesson $\rightarrow$ `404 Not Found`
- Lesson belongs to a different course $\rightarrow$ `404 Not Found`
- No quiz attached to lesson $\rightarrow$ `404 Not Found`
- Quiz is `DRAFT` or `ARCHIVED` $\rightarrow$ `404 Not Found`

All 404 scenarios return the exact identical generic response:
```json
{
  "code": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 3.3. Safe Prisma Select Projection
The database query MUST utilize field-level `select` to avoid fetching forbidden fields over the wire:

```typescript
const quiz = await this.prisma.academyQuiz.findFirst({
  where: {
    status: "PUBLISHED",
    lesson: {
      slug: lessonSlug,
      status: "PUBLISHED",
      course: {
        slug: courseSlug,
        status: "PUBLISHED",
      },
    },
  },
  orderBy: { order: "asc" },
  select: {
    id: true,
    title: true,
    description: true,
    passingScore: true, // Safe pre-submission metadata
    lesson: {
      select: {
        title: true,
        slug: true,
        course: {
          select: {
            slug: true,
          },
        },
      },
    },
    questions: {
      select: {
        id: true,
        prompt: true,
        type: true,
        order: true,
        // CRITICAL: explanation is NOT selected
        // CRITICAL: isCorrect is NOT selected
        options: {
          select: {
            id: true,
            text: true,
            order: true,
            // CRITICAL: isCorrect is NOT selected
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    },
  },
});
```

---

## 4. Ordering & Determinism Rules

1. **Primary Quiz Selection**: The lowest-order published quiz (`order ASC`) is returned.
2. **Questions Ordering**: `questions` MUST be ordered deterministically by `question.order ASC`.
3. **Options Ordering**: `options` for each question MUST be ordered deterministically by `option.order ASC`.
4. **Empty Questions Deck**: If a selected published quiz has 0 questions, `questions: []` and `totalQuestions: 0` are returned with HTTP 200. (This is distinct from no published quiz, which returns HTTP 404).

---

## 5. Security & Leakage Sentinel Specification

### 5.1. Recursive Property Key Sentinel
Integration tests must pass the parsed JSON response body through a recursive property key scanner that checks FIELD NAMES (not arbitrary text strings, avoiding false positives on prompts containing words like "correct"):

```typescript
const FORBIDDEN_PROPERTY_PATTERNS = [
  /^is_?correct$/i,
  /^correct$/i,
  /^correct_?option/i,
  /^correct_?answer/i,
  /^answer_?key$/i,
  /^solution/i,
  /^explanation$/i,
  /^score$/i,
  /^learner_?score$/i,
  /^points/i,
  /^grading/i,
  /^pass_?fail$/i,
];

export function assertZeroCorrectnessLeakage(payload: unknown): void {
  function scan(value: unknown, path: string): void {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => scan(item, `${path}[${index}]`));
      return;
    }

    for (const [key, propValue] of Object.entries(value as Record<string, unknown>)) {
      const currentPath = path ? `${path}.${key}` : key;
      for (const pattern of FORBIDDEN_PROPERTY_PATTERNS) {
        if (pattern.test(key)) {
          throw new Error(
            `SECURITY DEFECT: Forbidden correctness key "${key}" detected at path "${currentPath}" in quiz definition payload.`
          );
        }
      }
      scan(propValue, currentPath);
    }
  }

  scan(payload, "");
}
```
*Note*: `passingScore` does not match any forbidden pattern and is explicitly permitted.

### 5.2. Adversarial Value Test
Tests must seed a quiz with clearly identified correct and incorrect options:
- Option A: `text: "Wrong Answer A"`, `isCorrect: false`
- Option B: `text: "Correct Answer B"`, `isCorrect: true`
- Option C: `text: "Wrong Answer C"`, `isCorrect: false`
- Question: `explanation: "Secret rationale explaining why B is correct"`

The test must assert on the actual serialized HTTP response:
1. `assertZeroCorrectnessLeakage(response.body)` passes.
2. The secret rationale string `"Secret rationale explaining why B is correct"` does NOT appear anywhere in `response.text`.
3. No boolean correctness indicator exists for Option B compared to Option A or Option C.
4. HTTP response text contains option text, option IDs, and option order only.

---

## 6. Frontend Client & State Boundary

### 6.1. Web API Client (Reusing Existing Architecture)
In [`apps/web/src/api/academy.api.ts`](file:///d:/project/ura-capital/apps/web/src/api/academy.api.ts), extend `IAcademyApiClient` and `AcademyApiClient` using the established pattern:

```typescript
export interface IAcademyApiClient {
  // ... existing methods ...
  getLessonQuiz(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string
  ): Promise<{ data: QuizDefinitionDto }>;
}

export class AcademyApiClient implements IAcademyApiClient {
  // ... existing methods ...
  async getLessonQuiz(
    courseSlug: string,
    lessonSlug: string,
    accessToken?: string
  ): Promise<{ data: QuizDefinitionDto }> {
    const url = `${this.baseUrl}/courses/${encodeURIComponent(courseSlug)}/lessons/${encodeURIComponent(lessonSlug)}/quiz`;
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
    return (await res.json()) as { data: QuizDefinitionDto };
  }
}
```

### 6.2. Authenticated Token Boundary
- Reuses the existing `accessToken` parameter mechanism from authenticated Lesson Detail and Flashcards.
- Does NOT introduce client token persistence (`localStorage`, `sessionStorage`), token query parameters, or token logging.

### 6.3. TanStack Query Hook
In `apps/web/src/features/academy/hooks/use-academy.ts`:
```typescript
export function useLessonQuizQuery(
  courseSlug: string,
  lessonSlug: string,
  accessToken?: string
) {
  return useQuery({
    queryKey: ["academy", "quiz", courseSlug, lessonSlug],
    queryFn: () => academyApiClient.getLessonQuiz(courseSlug, lessonSlug, accessToken).then(r => r.data),
    enabled: Boolean(courseSlug && lessonSlug),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 404 || error?.status === 401) return false;
      return failureCount < 2;
    },
  });
}
```

### 6.4. Lesson Detail Page Quiz Summary (Informational Only)
- On `LessonDetailPage.tsx`, display a clean, product-neutral Quiz Summary card:
  - Quiz title & description (if present)
  - Question count badge (`"N Questions"`)
  - Passing score requirement (`"Passing Score: 80%"`)
  - Status text: `"Quiz available"` or `"Quiz attempts are not available yet"`.
  - **Forbidden**: Do NOT display internal engineering jargon like `"Attempts Unlocked in FEAT-024"`.

---

## 7. Error Handling Matrix

| Scenario | HTTP Status | Code | Message |
| :--- | :---: | :--- | :--- |
| Missing or invalid Bearer token | `401` | `UNAUTHENTICATED` | `"Authentication required"` |
| Malformed course or lesson slug | `400` | `VALIDATION_ERROR` | `"Validation failed"` |
| Course does not exist | `404` | `NOT_FOUND` | `"Resource not found"` |
| Course status is `DRAFT` or `ARCHIVED` | `404` | `NOT_FOUND` | `"Resource not found"` |
| Lesson does not exist in course | `404` | `NOT_FOUND` | `"Resource not found"` |
| Lesson status is `DRAFT` or `ARCHIVED` | `404` | `NOT_FOUND` | `"Resource not found"` |
| No published quiz attached to lesson | `404` | `NOT_FOUND` | `"Resource not found"` |
| Quiz status is `DRAFT` or `ARCHIVED` | `404` | `NOT_FOUND` | `"Resource not found"` |
| Internal database error | `500` | `INTERNAL_ERROR` | `"Internal server error"` |
