# Acceptance Criteria: FEAT-023 Quiz Definition & Safe Projection

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

## Acceptance Matrix Overview

| AC ID | Category | Title | Criticality |
| :--- | :--- | :--- | :---: |
| **AC-001** | Scope & Database | Zero Schema Drift & Migration Invariant | Blocking |
| **AC-002** | Security & Auth | Authenticated Access Boundary | Blocking |
| **AC-003** | Visibility | Primary Quiz Read Policy & Publication Enforcement | Blocking |
| **AC-004** | Security | Relational Scoping & Cross-Course Isolation | Blocking |
| **AC-005** | Functional | Deterministic Question & Option Ordering | Blocking |
| **AC-006** | **Security (CRITICAL)** | **Pre-Submission Correct Answer Secrecy** | **CRITICAL HARD GATE** |
| **AC-007** | Security | Recursive Property Key Denylist Sentinel | Blocking |
| **AC-008** | Security | Adversarial Explanation & Hint Suppression | Blocking |
| **AC-009** | Architecture | Stable Opaque Identifiers for Quiz, Question, Option | Blocking |
| **AC-010** | Security | Whitelist DTO Sanitization & Safe `passingScore` Metadata | Blocking |
| **AC-011** | Security | Indistinguishable Generic 404 Error Semantics | Blocking |
| **AC-012** | Functional | Empty Selected Published Quiz Graceful Handling | Blocking |
| **AC-013** | Persistence Boundary | Zero Attempt, Answer, Progress, or Reward Mutation | Blocking |
| **AC-014** | Architecture | Zero Redis Usage & Zero Product Audit Records | Blocking |
| **AC-015** | Architecture | Layered Architecture & Static Boundary Compliance | Blocking |
| **AC-016** | Frontend | Frontend API Client & Safe TanStack Query Cache | Blocking |
| **AC-017** | Frontend | Product-Neutral Lesson Detail Quiz Summary Integration | Blocking |
| **AC-018** | Governance | Full Monorepo Regression & Implementation Report Ownership | Blocking |

---

## Detailed Acceptance Criteria

### AC-001: Zero Schema Drift & Migration Invariant
- **Requirement**: `apps/api/prisma/schema.prisma` must remain 100% byte-for-byte identical to the approved FEAT-019 baseline.
- **Verification**: `git diff HEAD -- apps/api/prisma/schema.prisma` is completely empty. `npx prisma validate` passes. `npm run guard:migration` confirms exactly 4 migrations.

---

### AC-002: Authenticated Access Boundary
- **Requirement**: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz` must require a valid learner JWT.
- **Verification**: Requests with missing, malformed, expired, or refresh-token credentials return `401 Unauthorized` (`code: "UNAUTHENTICATED"`). Requests with valid learner access token return `200 OK` (or `404 Not Found` if quiz is unavailable). No admin role is required.

---

### AC-003: Primary Quiz Read Policy & Publication Enforcement
- **Requirement**: Endpoint returns the lowest-order `PUBLISHED` quiz belonging to the requested published lesson and course.
- **Verification**:
  - `course.status != 'PUBLISHED'` $\rightarrow$ `404 Not Found`.
  - `lesson.status != 'PUBLISHED'` $\rightarrow$ `404 Not Found`.
  - `quiz.status != 'PUBLISHED'` $\rightarrow$ `404 Not Found`.
  - When multiple published quizzes exist for a lesson, the quiz with the lowest `order` value is selected deterministically.
  - When course, lesson, and quiz are `PUBLISHED`, endpoint succeeds with `200 OK`.

---

### AC-004: Relational Scoping & Cross-Course Isolation
- **Requirement**: The query must enforce that the lesson belongs to the course specified by `courseSlug`, and the quiz belongs to that lesson.
- **Verification**: Requesting `/courses/course-a/lessons/lesson-b/quiz` (where `lesson-b` belongs to `course-b`) returns `404 Not Found`. Cross-tenant or cross-course leaks are strictly prevented.

---

### AC-005: Deterministic Question & Option Ordering
- **Requirement**: Questions and options must be returned in strictly deterministic order.
- **Verification**:
  - Questions are sorted by `question.order ASC`.
  - Options within each question are sorted by `option.order ASC`.
  - Repeated requests to the endpoint return identical question and option sequences.

---

### AC-006: Pre-Submission Correct Answer Secrecy (CRITICAL HARD GATE)
- **Requirement**: No property or serialized field may reveal correctness semantics, including `isCorrect`, `is_correct`, `correctOptionId`, `correctAnswer`, `answerKey`, `solution`, `explanation`, or equivalent server correctness/evaluation fields.
- **Criticality**: **CRITICAL HARD GATE**. If any correctness indicator is present in the response body or serialized JSON, the feature immediately fails verification regardless of all other tests. Any correctness leak constitutes a **P1 SECURITY DEFECT**.
- **Verification**: Inspect parsed JSON response and raw serialized JSON text; confirm zero occurrences of `isCorrect`, `is_correct`, `correctOptionId`, `correctAnswer`, `answerKey`, `solution`, `explanation`, or server correctness indicators. (Adversarial test fixtures in PostgreSQL may contain internal boolean `isCorrect` values, but these must never appear in the learner response).

---

### AC-007: Recursive Property Key Denylist Sentinel
- **Requirement**: Integration tests must execute a recursive property key scanner across the entire parsed JSON response payload using the canonical anchored denylist patterns:
  `/^is_?correct$/i`, `/^correct$/i`, `/^correct_?option/i`, `/^correct_?answer/i`, `/^answer_?key$/i`, `/^solution/i`, `/^explanation$/i`, `/^score$/i`, `/^learner_?score$/i`, `/^points/i`, `/^grading/i`, or `/^pass_?fail$/i`.
- **Approved Safe Metadata**: `passingScore` is an approved safe pre-submission quiz metadata key representing the published passing threshold and does not match `/^score$/i` or any other anchored forbidden pattern.
- **Verification**: The sentinel scans all property keys in the response. No property key matches any anchored forbidden pattern, and `passingScore` remains safely permitted without false rejection.

---

### AC-008: Adversarial Explanation & Hint Suppression
- **Requirement**: Database field `AcademyQuizQuestion.explanation` contains answer rationales. Pre-submission quiz reads must strictly suppress `explanation`.
- **Verification**: Seed a question with `explanation = "Secret explanation revealing why option B is correct"`. Assert that this string does not appear anywhere in the HTTP response body or raw text.

---

### AC-009: Stable Opaque Identifiers for Quiz, Question, and Option
- **Requirement**: Quiz, Question, and Option objects in the DTO must provide stable opaque identifiers (`id: string`) to enable unambiguous answer binding in FEAT-024/FEAT-025.
- **Verification**: DTO contains `id` for quiz, questions, and options; foreign keys (`lessonId`, `quizId`, `questionId`, `courseId`, `selectedOptionId`) are omitted. Exposed UUIDs carry zero correctness semantics and are not authorization tokens.

---

### AC-010: Whitelist DTO Sanitization & Safe `passingScore` Metadata
- **Requirement**: The response must conform strictly to `QuizDefinitionDto`.
  - `passingScore` is explicitly permitted and validated as safe pre-submission quiz metadata representing the published passing threshold.
  - No internal Prisma fields (`createdAt`, `updatedAt`, `status`, internal metadata, learner scores) may leak.
- **Verification**: Response schema validation confirms exact match to `QuizDefinitionDto` with no unexpected keys.

---

### AC-011: Indistinguishable Generic 404 Error Semantics
- **Requirement**: All 404 scenarios (draft course, draft lesson, draft quiz, nonexistent course, nonexistent lesson, relational mismatch, no published quiz) must return the identical generic payload `{ "code": "NOT_FOUND", "message": "Resource not found" }`.
- **Verification**: Probing draft, archived, nonexistent, mismatched entities, and lessons without published quizzes yields identical status `404` and identical response bodies.

---

### AC-012: Empty Selected Published Quiz Graceful Handling
- **Requirement**: If a selected published quiz contains zero questions, the endpoint must return `200 OK` with `questions: []` and `totalQuestions: 0`.
- **Verification**: Seed an empty published quiz; endpoint returns 200 with empty questions array. (Distinct from no published quiz which returns 404).

---

### AC-013: Read-Only Persistence Boundary
- **Requirement**: Calling the quiz definition endpoint must produce zero mutations to any table in PostgreSQL.
- **Verification**: Count rows in `academy_quiz_attempts`, `academy_quiz_answers`, `academy_user_course_progress`, `academy_user_lesson_progress`, `academy_user_xp`, and `academy_reward_ledger` before and after requests; row counts remain identical.

---

### AC-014: Zero Redis Usage & Zero Product Audit Records
- **Requirement**: FEAT-023 must introduce zero Redis operations and emit zero product audit records.
- **Verification**: `npm run test:redis` passes cleanly; `npm run guard:audit-governance` passes cleanly.

---

### AC-015: Layered Architecture & Static Boundary Compliance
- **Requirement**: Strict separation of concerns: Controller $\to$ Service $\to$ Repository. Zero direct Prisma calls in controllers or services.
- **Verification**: `npm run guard:boundary` passes with 0 violations.

---

### AC-016: Frontend API Client & Safe TanStack Query Cache
- **Requirement**: Frontend web client must extend `AcademyApiClient` with `getLessonQuiz(courseSlug, lessonSlug, accessToken)` and provide `useLessonQuizQuery` hook.
- **Verification**: Query key is `["academy", "quiz", courseSlug, lessonSlug]`. Inspecting client memory / TanStack cache reveals safe projected data only; zero correct-answer data in client memory.

---

### AC-017: Product-Neutral Lesson Detail Quiz Summary Integration
- **Requirement**: `LessonDetailPage` must display a clean Quiz Summary card when a quiz is available, indicating title, question count, and passing score requirement.
- **Verification**: Component uses product-neutral copy (`"Quiz available"` or `"Quiz attempts are not available yet"`). Zero internal roadmap identifiers or engineering jargon (e.g., no `"FEAT-024"`) appear in the UI.

---

### AC-018: Full Monorepo Regression & Implementation Report Ownership
- **Requirement**: All 14 monorepo validation checks pass with clean exit code 0. Implementation Agent produces `reports/implementation/phase-4/FEAT-023.md`. QA report is strictly reserved for Independent QA.
- **Verification**: All 14 checks pass; progress tracker records implementation state truthfully without self-QA.
