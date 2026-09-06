# Requirement: FEAT-023 Quiz Definition & Safe Projection

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-023  
**Phase**: Phase 4 — Academy  
**Feature Type**: Backend API Read Model & Safe Projection Contract  
**Planning Owner**: Antigravity — Temporary Planning Ownership Transfer  
**Planning Status**: COMPLETE (HUMAN APPROVED)  
**Human Planning Approval**: APPROVED  
**Human Decisions (All Resolved / Approved)**:
- **Question Types for Production MVP**: `SINGLE_CHOICE ONLY` — **RESOLVED / HUMAN APPROVED**
- **Primary Quiz Read Policy**: Lowest-order `PUBLISHED` quiz — **RESOLVED / HUMAN APPROVED**
- **Identifier Strategy**: Stable opaque UUIDs (`quiz.id`, `question.id`, `option.id`) — **RESOLVED / HUMAN APPROVED**
- **`passingScore` Security Classification**: Safe pre-submission quiz metadata — **RESOLVED / HUMAN APPROVED**  
**Implementation Status**: NOT_STARTED  
**QA Status**: NOT_STARTED  
**Human Final Gate**: NOT APPROVED  
**FEAT-024**: BLOCKED  
**Phase 4 Status**: IN_PROGRESS  

---

## 1. Context & Background

Phase 4 rebuilds the learner-facing Academy domain on the approved production architecture.
- **FEAT-019**: Established the durable persistence foundation (`DONE`, `feat-019-approved`), including canonical PostgreSQL models `AcademyQuiz`, `AcademyQuizQuestion`, `AcademyQuizOption`, `AcademyQuizAttempt`, and `AcademyQuizAnswer` with strict foreign keys, partial unique indexes, and deferred constraint triggers.
- **FEAT-020**: Delivered the public course catalog, public course outline, and authenticated lesson read APIs (`DONE`, `feat-020-approved`).
- **FEAT-021**: Delivered the learner-facing course catalog, course detail, and lesson detail frontend views with dual-query orchestration, security boundaries, and accessibility baselines (`DONE`, `feat-021-approved`).
- **FEAT-022**: Delivered the authenticated flashcard read API and transient learner review container with Option A UI reveal secrecy and the FEAT-022 Accessibility Baseline (`DONE`, `feat-022-approved`).

FEAT-023 is the fifth feature in Phase 4. It introduces the read-only quiz definition API and safe projection model for Aura Academy lessons. It enables authenticated learners to retrieve quiz metadata, question prompts, and answer option choices for published lessons **without leaking correct answers, answer keys, explanations, or evaluation data**.

---

## 2. Core Goal

The primary goal of FEAT-023 is to serve learner-safe quiz definitions for published lessons while guaranteeing pre-submission answer secrecy:
1. Provide an authenticated endpoint returning quiz metadata, question prompts, and available options for published lessons.
2. Implement the **Primary Quiz Read Policy**: return the lowest-order `PUBLISHED` quiz belonging to the requested `PUBLISHED` lesson and `PUBLISHED` course.
3. Enforce relational ownership in the database query (the quiz must belong to the lesson, which must belong to the course).
4. Strictly prevent any leakage of correct answers, correctness flags, explanations, or evaluation data prior to submission.
5. Provide a typed frontend API client and query hook (`useLessonQuizQuery`) for downstream consumption.
6. Display a product-neutral, read-only Quiz Summary on `LessonDetailPage`.

---

## 3. Human Decisions & Architectural Locks (Resolved / Approved)

### 3.1. Question Types: `SINGLE_CHOICE` ONLY (RESOLVED / HUMAN APPROVED)
- **Approved Decision**: Production MVP quiz questions support **`SINGLE_CHOICE` ONLY**.
- **Canonical Behavior**: `AcademyQuizQuestion.type: "SINGLE_CHOICE"`.
- **Excluded Types**: FEAT-023 must NOT support `MULTI_SELECT`, `FREE_TEXT`, `BOOLEAN`, `ORDERING`, or other unapproved types.
- **Rationale**: In FEAT-019, PostgreSQL constraint triggers `trg_academy_quiz_options_exactly_one_correct` and `trg_academy_quiz_questions_has_correct_option` alongside partial unique index `academy_quiz_options_one_correct_per_question` already strictly enforce the single-choice exactly-one-correct-option invariant. No schema or migration changes are required.

### 3.2. Primary Quiz Read Policy & Cardinality (RESOLVED / HUMAN APPROVED)
- **Approved Policy**:
  - `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz`
  - Returns the **lowest-order `PUBLISHED` quiz** (`status = 'PUBLISHED'`, `orderBy: { order: 'asc' }`, `findFirst`) belonging to the requested published lesson and published course.
- **Cardinality Clarification**:
  - In `apps/api/prisma/schema.prisma`, `AcademyLesson` has `quizzes AcademyQuiz[]` and `AcademyQuiz` has constraint `@@unique([lessonId, order])`. This means multiple quizzes may belong to one lesson as long as their orders differ.
  - The Primary Quiz Read Policy is a **read-model selection policy only**; it does **not** claim or establish "at most one quiz per lesson" as a database or domain constraint.
  - If no `PUBLISHED` quiz exists for the lesson (or course/lesson is draft/archived/nonexistent), the endpoint returns uniform `404 Not Found`.
  - Zero schema drift: `AcademyQuiz` has no `slug` column, and none will be added.

### 3.3. Identifier Strategy: Stable Opaque Identifiers (RESOLVED / HUMAN APPROVED)
- **Approved Decision**: Return stable opaque UUIDs for `quiz.id`, `question.id`, and `option.id` in the pre-submission DTO.
- **Rationale**: FEAT-024 (`Quiz Attempt Lifecycle`) and FEAT-025 (`Server-Side Quiz Evaluation & Secure Submission`) require stable server-side binding for attempts and submitted option answers against database foreign keys `(question_id, quiz_id)` and `(selected_option_id, question_id)`.
- **Security Boundary**:
  - Exposed UUIDs are identifiers only; they carry **zero correctness semantics**.
  - Exposed UUIDs are **not authorization tokens**; relational ownership and attempt validation remain mandatory on the server in FEAT-024/025.
  - Internal foreign keys (`lessonId`, `courseId`, `quizId`, `questionId`, `selectedOptionId`) remain strictly hidden.

### 3.4. `passingScore` Security Classification (RESOLVED / HUMAN APPROVED)
- **Approved Decision**: `passingScore` is classified as **safe learner-visible quiz metadata** and may be returned pre-submission.
- **Security Clarification**: `passingScore` represents the published passing threshold requirement for the quiz (e.g. `80` meaning 80%). It does **not** reveal:
  - Which option is correct
  - Correctness flags or correct option identity
  - Answer keys or explanations
  - Per-question grading rules or points
  - Learner score or pass/fail evaluation results.
- **Categorization**:
  - **Safe Pre-Submission Metadata**: `passingScore`, `totalQuestions`, `title`, `description`.
  - **Forbidden Pre-Submission Evaluation Data**: `isCorrect`, `correctOptionId`, `correctAnswer`, `answerKey`, `solution`, `explanation`, `score`, `pointsAwarded`, `gradingResult`, `passFailResult`.

---

## 4. Hard Security Invariant — Pre-Submission Correct Answer Secrecy

> [!CAUTION]
> **CRITICAL HARD SECURITY BOUNDARY**:
> Pre-submission correct-answer secrecy is an absolute, non-negotiable security boundary.
> Under NO circumstances may pre-submission quiz definition endpoints or frontend objects expose:
> - `isCorrect` / `is_correct`
> - `correctOptionId` / `correct_option_id`
> - `correctAnswer` / `correct_answer`
> - `answerKey` / `answer_key`
> - `solution` / `solutionText`
> - `explanation` (suppressed before submission/evaluation)
> - `score` / `learnerScore` / `pointsAwarded` / `gradingResult` / `passFailResult`
> - Server evaluation hints or correctness flags.
>
> This applies across:
> - Direct top-level DTO properties
> - Nested object properties
> - Raw Prisma entity serialization
> - Debug responses and client-facing error payloads
> - Browser network payloads and client-side TanStack Query cache.
>
> Any leak of a correct answer or correctness indicator in FEAT-023 constitutes a **P1 Security Defect** and causes immediate feature failure.

---

## 5. Scope Boundaries & Invariants

### 5.1. Strictly Included in FEAT-023
- Authenticated `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz` endpoint (with Express alias `/academy/...`).
- Primary Quiz Read Policy: relational query selecting lowest-order published quiz where `course.status = PUBLISHED`, `lesson.status = PUBLISHED`, and `quiz.status = PUBLISHED`.
- Safe whitelist DTOs (`QuizDefinitionDto`, `QuizQuestionDto`, `QuizOptionDto`) with zero correctness fields.
- Prisma repository query using safe `select` projection (omitting `isCorrect` and `explanation`).
- Deterministic ordering: `questions` ordered by `order ASC`, `options` ordered by `order ASC`.
- Uniform sanitized `404 Not Found` for draft, archived, nonexistent, or cross-course mismatched parents/quizzes.
- Recursive property key denylist sentinel test scanning all response property keys using anchored patterns (confirming `passingScore` is safe pre-submission quiz metadata and allowed).
- Adversarial integration tests with planted true/false options and secret explanation verifying zero leakage in body and serialized HTTP text.
- Frontend typed API client function (`academyApiClient.getLessonQuiz`) and TanStack Query hook with query key `["academy", "quiz", courseSlug, lessonSlug]`.
- Product-neutral informational Quiz Summary Card on `LessonDetailPage` displaying quiz title, description, question count, and `passingScore`.

### 5.2. Strictly Excluded from FEAT-023
- **Zero Quiz Attempt Lifecycle**: No creation or management of `AcademyQuizAttempt` records (owned by FEAT-024).
- **Zero Answer Submission**: No submission endpoints, no `AcademyQuizAnswer` records (owned by FEAT-024/025).
- **Zero Scoring / Evaluation**: No pass/fail calculation, no grading logic (owned by FEAT-025).
- **Zero Interactive Answer UI**: No radio buttons, option selection workflows, timers, submit buttons, or score screens.
- **Zero Internal Engineering Jargon in UI**: No references to "Attempts Unlocked in FEAT-024" or roadmap identifiers in learner-facing copy; product-neutral wording only ("Quiz available" or "Quiz attempts are not available yet").
- **Zero Progress Mutation**: No changes to `AcademyUserCourseProgress` or `AcademyUserLessonProgress`.
- **Zero XP / Rewards**: No XP grants (`AcademyUserXp`), no reward ledger writes (`AcademyRewardLedger`).
- **Zero Redis Usage**: No Redis keys, caching, or rate limiting added.
- **Zero Schema Changes**: `apps/api/prisma/schema.prisma` remains strictly unmodified; zero migrations.
- **Zero Product Audit Records**: No audit events emitted; audit decisions belong to `FEAT-029`.
