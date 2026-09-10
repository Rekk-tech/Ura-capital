# Technical Specification: FEAT-025 Server-Side Quiz Evaluation & Secure Submission

**Feature ID**: FEAT-025  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  

---

## 1. Database & Persistence Architecture

### 1.1. Existing Physical Table Schema (from FEAT-019 & FEAT-024)
- **`academy_quiz_attempts`**:
  - `id`: String (UUID PK)
  - `user_id`: String (FK $\rightarrow$ `users.id`)
  - `quiz_id`: String (FK $\rightarrow$ `academy_quizzes.id`)
  - `attempt_number`: Int (`>= 1`)
  - `status`: String (`CREATED`, `IN_PROGRESS`, `SUBMITTED`, `GRADED`)
  - `score`: Int? (0-100)
  - `passed`: Boolean?
  - `quiz_title_snapshot`: String
  - `quiz_version_snapshot`: String?
  - `started_at`: DateTime
  - `submitted_at`: DateTime?
  - `graded_at`: DateTime?
  - Partial Unique Index: `academy_quiz_attempts_quiz_id_user_id_active_key` on `(quiz_id, user_id)` WHERE `status = 'IN_PROGRESS'`
- **`academy_quiz_answers`**:
  - `id`: String (UUID PK)
  - `attempt_id`: String (FK $\rightarrow$ `academy_quiz_attempts`)
  - `quiz_id`: String
  - `question_id`: String (FK $\rightarrow$ `academy_quiz_questions`)
  - `selected_option_id`: String? (FK $\rightarrow$ `academy_quiz_options`)
  - `isCorrect`: Boolean? (`is_correct`)
  - `question_prompt_snapshot`: String
  - `selected_option_text_snapshot`: String?
  - `correct_option_id_snapshot`: String?
  - `correct_option_text_snapshot`: String?
- **`academy_quizzes`**:
  - `passing_score`: Int (default 80)
- **`academy_quiz_options`**:
  - `is_correct`: Boolean (default false)
  - Partial Unique Index: `academy_quiz_options_one_correct_per_question` on `(question_id)` WHERE `is_correct = true`

### 1.2. Minimal Additive Check-Constraint Migration (Approved by Human)
A minimal, additive migration (`20260907000000_feat025_grading_integrity_constraints`) is introduced to lock down state and score invariants directly in PostgreSQL:

```sql
-- 1. Score range check: score must be between 0 and 100 when present
ALTER TABLE "academy_quiz_attempts"
  ADD CONSTRAINT "academy_quiz_attempts_score_range_check"
  CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 100));

-- 2. State attribute coherency check:
-- When GRADED: score, passed, submitted_at, graded_at MUST be NOT NULL
-- When CREATED or IN_PROGRESS: score, passed, graded_at MUST be NULL
-- When SUBMITTED: submitted_at MUST be NOT NULL
ALTER TABLE "academy_quiz_attempts"
  ADD CONSTRAINT "academy_quiz_attempts_graded_state_check"
  CHECK (
    ("status" = 'GRADED' AND "score" IS NOT NULL AND "passed" IS NOT NULL AND "submitted_at" IS NOT NULL AND "graded_at" IS NOT NULL)
    OR
    ("status" IN ('CREATED', 'IN_PROGRESS') AND "score" IS NULL AND "passed" IS NULL AND "graded_at" IS NULL)
    OR
    ("status" = 'SUBMITTED' AND "submitted_at" IS NOT NULL)
  );
```
- **Zero new tables**, **zero new columns**, **zero destructive alterations**, and **zero historical row repair**.

---

## 2. API Endpoint Contracts

### 2.1. Submit Quiz Attempt
- **Method**: `POST`
- **Path**: `/api/academy/quiz-attempts/:attemptId/submit`
- **Auth**: Required (`Bearer <JWT>`)
- **Headers**: `Content-Type: application/json`
- **Request Body**: `{}` (strictly enforced via `z.object({}).strict()`)
- **Success Response**: HTTP `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "attemptId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "quizId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "status": "GRADED",
      "score": 100,
      "passed": true,
      "submittedAt": "2026-09-07T09:00:00.000Z",
      "gradedAt": "2026-09-07T09:00:00.000Z",
      "answers": [
        {
          "questionId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
          "selectedOptionId": "d4e5f6a7-b8c9-0123-def1-234567890123",
          "isCorrect": true,
          "correctOptionId": "d4e5f6a7-b8c9-0123-def1-234567890123"
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 VALIDATION_ERROR`: Non-empty body or unrecognized properties.
  - `400 UNANSWERED_QUESTIONS`: Incomplete draft answers (`code: "UNANSWERED_QUESTIONS"`).
  - `400 INVALID_QUIZ_STATE`: Zero-question quiz (`code: "INVALID_QUIZ_STATE"`, message: `"Quiz has no questions to evaluate"`).
  - `401 UNAUTHENTICATED`: Missing, invalid, or expired JWT.
  - `404 NOT_FOUND`: Course/Lesson/Quiz unpublished for active attempt (`code: "NOT_FOUND"`, message: `"Resource not found"`).
  - `404 QUIZ_ATTEMPT_NOT_FOUND`: Attempt does not exist or belongs to another user (zero 403 oracle).
  - `500 INTERNAL_ERROR`: Sanitized database, relational corruption, or transaction failure.

### 2.2. Get Graded Attempt Result
- **Method**: `GET`
- **Path**: `/api/academy/quiz-attempts/:attemptId/result`
- **Auth**: Required (`Bearer <JWT>`)
- **Success Response**: HTTP `200 OK` (Identical `QuizResultDto` structure).
- **Error Responses**:
  - `401 UNAUTHENTICATED`: Missing, invalid, or expired JWT.
  - `404 QUIZ_ATTEMPT_NOT_FOUND`: Attempt not found, belongs to another user, or attempt is not yet `GRADED` (zero 403 oracle).
  - `500 INTERNAL_ERROR`: Sanitized internal error.

---

## 3. Data Transfer Objects (DTOs)

### 3.1. `QuizResultDto`
```typescript
export interface QuizResultDto {
  attemptId: string;
  quizId: string;
  status: "GRADED";
  score: number;
  passed: boolean;
  submittedAt: string;
  gradedAt: string;
  answers: QuizResultAnswerDto[];
}
```
> [!IMPORTANT]
> `passingScore` is omitted from `QuizResultDto` (Option B) because `AcademyQuizAttempt` does not snapshot it. The persisted `passed` boolean remains the sole historical authority. Question `explanation` is deferred and not exposed.

### 3.2. `QuizResultAnswerDto`
```typescript
export interface QuizResultAnswerDto {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  correctOptionId: string;
}
```

---

## 4. Evaluation Algorithm & Layering Architecture

The evaluation algorithm executes strictly inside the **Repository layer** within `transactionRunner.run`:

```typescript
async function submitAndGradeAttempt(
  userId: string,
  attemptId: string
): Promise<QuizResultDto> {
  return transactionRunner.run(async (tx) => {
    // 1. Acquire row lock using SELECT ... FOR UPDATE scoped by attemptId and userId
    const attempts = await tx.$queryRaw<AcademyQuizAttempt[]>`
      SELECT * FROM "academy_quiz_attempts"
      WHERE "id" = ${attemptId} AND "user_id" = ${userId}
      FOR UPDATE;
    `;

    if (attempts.length === 0) {
      throw new QuizAttemptNotFoundError("Quiz attempt not found");
    }

    const attempt = attempts[0];

    // 2. Re-read under lock: If already GRADED, execute idempotent replay
    if (attempt.status === "GRADED") {
      return reconstructPersistedResult(tx, attempt);
    }

    // 3. Ensure attempt is IN_PROGRESS
    if (attempt.status !== "IN_PROGRESS") {
      throw new QuizAttemptNotFoundError("Quiz attempt not found");
    }

    // 4. Validate content publication scoping
    const quiz = await tx.academyQuiz.findUnique({
      where: { id: attempt.quizId },
      include: { lesson: { include: { course: true } } }
    });

    if (
      !quiz ||
      quiz.status !== "PUBLISHED" ||
      quiz.lesson.status !== "PUBLISHED" ||
      quiz.lesson.course.status !== "PUBLISHED"
    ) {
      throw new NotFoundError("Resource not found");
    }

    // 5. Load quiz questions and options
    const questions = await tx.academyQuizQuestion.findMany({
      where: { quizId: quiz.id },
      include: { options: true },
      orderBy: { order: "asc" }
    });

    if (questions.length === 0) {
      throw new ValidationError("Quiz has no questions to evaluate", "INVALID_QUIZ_STATE");
    }

    // 6. Load all draft answers for this attempt
    const draftAnswers = await tx.academyQuizAnswer.findMany({
      where: { attemptId: attempt.id }
    });

    // 7. Strict completeness check: Ensure all questions have a draft answer
    const answeredMap = new Map(draftAnswers.map((a) => [a.questionId, a]));
    for (const q of questions) {
      if (!answeredMap.has(q.id)) {
        throw new ValidationError("All questions must be answered before submitting", "UNANSWERED_QUESTIONS");
      }
    }

    // 8. Transactional intermediate step: set status = 'SUBMITTED'
    const now = new Date();
    await tx.academyQuizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        updatedAt: now
      }
    });

    // 9. Evaluate each answer against current server-authoritative quiz definition
    let correctCount = 0;
    const evaluatedAnswers: QuizResultAnswerDto[] = [];

    for (const question of questions) {
      const draft = answeredMap.get(question.id)!;

      // Relational validation
      if (draft.quizId !== quiz.id) {
        throw new Error("Integrity defect: draft answer quizId mismatch");
      }

      // Exactly-one-correct defensive check
      const correctOptions = question.options.filter((o) => o.isCorrect);
      if (correctOptions.length !== 1) {
        throw new Error(`Integrity defect: question ${question.id} has ${correctOptions.length} correct options`);
      }
      const correctOption = correctOptions[0];

      // Option relational validation
      if (draft.selectedOptionId) {
        const optionBelongs = question.options.some((o) => o.id === draft.selectedOptionId);
        if (!optionBelongs) {
          throw new Error("Integrity defect: selectedOptionId does not belong to question");
        }
      }

      const isCorrect = draft.selectedOptionId === correctOption.id;
      if (isCorrect) {
        correctCount += 1;
      }

      // Persist frozen correctness snapshots atomically
      await tx.academyQuizAnswer.update({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: question.id } },
        data: {
          isCorrect,
          correctOptionIdSnapshot: correctOption.id,
          correctOptionTextSnapshot: correctOption.text,
          updatedAt: now
        }
      });

      evaluatedAnswers.push({
        questionId: question.id,
        selectedOptionId: draft.selectedOptionId,
        isCorrect,
        correctOptionId: correctOption.id
      });
    }

    // 10. Compute integer score and pass/fail
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    // 11. Finalize attempt to GRADED
    const finalizedAttempt = await tx.academyQuizAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "GRADED",
        score,
        passed,
        gradedAt: now,
        updatedAt: now
      }
    });

    return {
      attemptId: finalizedAttempt.id,
      quizId: finalizedAttempt.quizId,
      status: "GRADED",
      score,
      passed,
      submittedAt: finalizedAttempt.submittedAt!.toISOString(),
      gradedAt: finalizedAttempt.gradedAt!.toISOString(),
      answers: evaluatedAnswers
    };
  });
}
```

---

## 5. Idempotent Historical Result Reconstruction

When an attempt is already in `status = 'GRADED'`, the repository **reconstructs the result exclusively from persisted snapshot fields**:

```typescript
async function reconstructPersistedResult(
  tx: PrismaTransactionClient,
  attempt: AcademyQuizAttempt
): Promise<QuizResultDto> {
  const answers = await tx.academyQuizAnswer.findMany({
    where: { attemptId: attempt.id },
    orderBy: { createdAt: "asc" }
  });

  return {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    status: "GRADED",
    score: attempt.score!,
    passed: attempt.passed!,
    submittedAt: attempt.submittedAt!.toISOString(),
    gradedAt: attempt.gradedAt!.toISOString(),
    answers: answers.map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId,
      isCorrect: a.isCorrect!,
      correctOptionId: a.correctOptionIdSnapshot!
    }))
  };
}
```
> [!IMPORTANT]
> The repository **never re-evaluates live `isCorrect`** when returning a historical result. The result is immutable even if the quiz definition is later modified.
