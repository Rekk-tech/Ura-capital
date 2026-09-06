# Implementation Plan: FEAT-023 Quiz Definition & Safe Projection

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

## 1. Architecture & Layering

The implementation follows the strict layered architecture established in Phases 1–3 and adhered to in FEAT-019..FEAT-022:

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request                                                │
│ GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ academy.routes.ts                                           │
│ - authenticate (Bearer JWT verification)                    │
│ - getLessonQuizParamsSchema (Zod slug validation)           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ academy-course.controller.ts                                │
│ - Parameter extraction & HTTP response formatting           │
│ - Status code mapping (200, 400, 401, 404, 500)             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ academy-quiz-read.service.ts                                │
│ - Business orchestration & DTO mapping                      │
│ - Whitelist projection enforcement (defense-in-depth)       │
│ - Zero direct Prisma calls (AST boundary guard compliant)   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ IAcademyQuizRepository (PrismaAcademyQuizRepository)        │
│ - Relational query enforcing published statuses             │
│ - Primary Quiz Read Policy: lowest-order published quiz     │
│ - Prisma select projection (omitting isCorrect/explanation) │
│ - Deterministic sorting (questions.order, options.order)    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL                                                  │
│ (academy_courses, academy_lessons, academy_quizzes,         │
│  academy_quiz_questions, academy_quiz_options)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. File & Component Breakdown

### 2.1. Backend (`apps/api`)

1. **DTOs & Schemas** (`apps/api/src/modules/academy/academy.dto.ts` & `academy.types.ts`):
   - Add `QuizOptionDto`, `QuizQuestionDto`, `QuizDefinitionDto`.
   - Add `passingScore: number` as approved safe pre-submission metadata.
   - Add Zod parameter validation schema `getLessonQuizParamsSchema`.
   - Add repository input/output interfaces for `findPublishedQuizByLesson`.

2. **Repository Layer** (`apps/api/src/modules/academy/academy.repository.ts`):
   - Extend `IAcademyQuizRepository` with:
     ```typescript
     findPublishedQuizByLesson(
       courseSlug: string,
       lessonSlug: string
     ): Promise<PublishedQuizRecord | null>;
     ```
   - Implement query with:
     - `course.status = 'PUBLISHED'`, `lesson.status = 'PUBLISHED'`, `quiz.status = 'PUBLISHED'`.
     - `orderBy: { order: "asc" }` and `findFirst` to enforce the Primary Quiz Read Policy.
     - Field-level Prisma `select` strictly excluding `isCorrect` and `explanation`.

3. **Service Layer** (`apps/api/src/modules/academy/academy-quiz-read.service.ts`):
   - Implement `getLessonQuiz(courseSlug, lessonSlug): Promise<QuizDefinitionDto | null>`.
   - Enforce defense-in-depth whitelist transformation ensuring zero extraneous fields.
   - Return `null` when repository returns `null` (translated to uniform 404 in controller).

4. **Controller Layer** (`apps/api/src/modules/academy/academy-course.controller.ts`):
   - Add `getLessonQuiz` method.
   - Return 404 when service returns `null`.

5. **Route Registration** (`apps/api/src/modules/academy/academy.routes.ts`):
   - Register route with `authenticate` middleware.
   - Register both `/api/academy/...` canonical route and `/academy/...` alias route.

### 2.2. Frontend (`apps/web`)

1. **API Client** ([`apps/web/src/api/academy.api.ts`](file:///d:/project/ura-capital/apps/web/src/api/academy.api.ts)):
   - Extend existing `AcademyApiClient` with:
     ```typescript
     getLessonQuiz(
       courseSlug: string,
       lessonSlug: string,
       accessToken?: string
     ): Promise<{ data: QuizDefinitionDto }>;
     ```
   - Reuse existing fetch error-handling and authentication header patterns.

2. **Query Hook** (`apps/web/src/features/academy/hooks/use-academy.ts`):
   - Add `useLessonQuizQuery(courseSlug: string, lessonSlug: string, accessToken?: string)`.
   - Query key: `["academy", "quiz", courseSlug, lessonSlug]`.

3. **UI Integration** (`apps/web/src/features/academy/pages/LessonDetailPage.tsx`):
   - Add informational Quiz Summary card showing quiz title, description, question count, and `passingScore`.
   - Display product-neutral status: `"Quiz available"` or `"Quiz attempts are not available yet"` (zero internal roadmap IDs or jargon).

---

## 3. Boundary & Governance Compliance

- **Architecture AST Guard** (`npm run guard:boundary`):
  - Controller and service must never import `PrismaClient`.
  - All database queries encapsulated in `PrismaAcademyQuizRepository`.
- **Audit Governance Guard** (`npm run guard:audit-governance`):
  - Zero product audit records created.
- **Migration Guard** (`npm run guard:migration`):
  - Zero schema modifications. Schema drift = 0.
- **Persistence Guard** (`npm run guard:persistence`):
  - Zero mutations to attempts, answers, progress, XP, or rewards.

---

## 4. Verification & Testing Strategy

### 4.1. Unit Tests (`apps/api/tests/unit/academy-quiz-read.service.test.ts`)
- Mocks `IAcademyQuizRepository`.
- Verifies DTO transformation, field whitelisting, and null handling.
- Verifies that even if a buggy repository returns `isCorrect` or `explanation`, the service layer whitelist strictly discards them.

### 4.2. Database Integration Tests (`apps/api/tests/integration/academy-quiz-db.test.ts`)
- Runs against live PostgreSQL test database.
- Verifies:
  - Valid published course + lesson + quiz returns 200 with complete definition.
  - Primary Quiz Read Policy: returns lowest-order published quiz when multiple quizzes exist.
  - Deterministic ordering: questions ordered by `order ASC`, options ordered by `order ASC`.
  - Draft course / Draft lesson / Draft quiz returns 404.
  - Archived course / Archived lesson / Archived quiz returns 404.
  - Relational cross-course mismatch returns 404.
  - Empty questions quiz returns 200 with `questions: []` and `totalQuestions: 0`.
  - Read-only boundary: zero database mutations during quiz fetch.

### 4.3. Adversarial Leakage & Sentinel Tests
- Seeds a quiz where Option A is false, Option B is true, Option C is false.
- Adds a secret rationale string to `academy_quiz_questions.explanation`.
- Probes live HTTP endpoint as an authenticated learner.
- Executes `assertZeroCorrectnessLeakage(response.body)` (recursive property key scanner testing anchored patterns: `/^is_?correct$/i`, `/^correct$/i`, `/^correct_?option/i`, `/^correct_?answer/i`, `/^answer_?key$/i`, `/^solution/i`, `/^explanation$/i`, `/^score$/i`, `/^learner_?score$/i`, `/^points/i`, `/^grading/i`, `/^pass_?fail$/i`).
- Confirms `passingScore` is safely permitted as pre-submission quiz metadata and does not trigger `/^score$/i`.
- Asserts that secret explanation text does not appear in `response.text`.
- Asserts that Option B contains zero correctness semantics or flags distinguishing it from Option A or C in the learner response.

### 4.4. Frontend Unit Tests (`apps/web/src/features/academy/pages/LessonDetailPage.test.tsx`)
- Verifies rendering of the Quiz Summary card with product-neutral copy when quiz data is loaded.
- Verifies friendly fallback when no published quiz exists.

### 4.5. Monorepo Validation Baseline
Execute all 14 mandatory checks:
- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:unit`
- `npm run test:db`
- `npm run test:redis`
- `npm run guard:persistence`
- `npm run guard:migration`
- `npm run guard:boundary`
- `npm run guard:audit-governance`
- `npm run guard:seed-safety`

---

## 5. Implementation vs. QA Ownership Boundary

- **Implementation Agent**:
  - Implements code and tests.
  - Runs all 14 validation commands.
  - Authoritative deliverable: [`reports/implementation/phase-4/FEAT-023.md`](file:///d:/project/ura-capital/reports/implementation/phase-4/FEAT-023.md).
  - Terminal state upon implementation completion: `FEAT-023: IMPLEMENTED / READY FOR QA`, QA Status: `PENDING`.
  - **Does NOT create QA report**.
- **Independent QA**:
  - Executes independent QA protocol in a separate subsequent turn.
  - Authoritative deliverable: `reports/qa/phase-4/FEAT-023-QA.md`.
