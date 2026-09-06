# Specification: FEAT-024 Quiz Attempt Lifecycle

**Feature ID**: FEAT-024  
**Feature Name**: Quiz Attempt Lifecycle  
**Phase**: Phase 4 — Academy  
**Status**: APPROVED FOR IMPLEMENTATION  

---

## 1. Domain Models & Minimal Migration Baseline

FEAT-024 introduces a **minimal constraint-only migration** adding a PostgreSQL partial unique index to enforce the active attempt invariant directly in the database.

### 1.1. Schema & Partial Index
Existing model `AcademyQuizAttempt` in `apps/api/prisma/schema.prisma`:
```prisma
model AcademyQuizAttempt {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  quizId              String    @map("quiz_id")
  attemptNumber       Int       @default(1) @map("attempt_number")
  status              String    @default("CREATED") // CREATED, IN_PROGRESS, SUBMITTED, GRADED
  score               Int?
  passed              Boolean?
  quizTitleSnapshot   String    @map("quiz_title_snapshot")
  quizVersionSnapshot String?   @map("quiz_version_snapshot")
  startedAt           DateTime  @default(now()) @map("started_at")
  submittedAt         DateTime? @map("submitted_at")
  gradedAt            DateTime? @map("graded_at")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  user    User                @relation(fields: [userId], references: [id], onDelete: Restrict)
  quiz    AcademyQuiz         @relation(fields: [quizId], references: [id], onDelete: Restrict)
  answers AcademyQuizAnswer[]

  @@unique([quizId, userId, attemptNumber])
  @@unique([id, quizId])
  @@index([userId])
  @@index([quizId])
  @@index([status])
  @@map("academy_quiz_attempts")
}
```

### 1.2. Minimal PostgreSQL Migration SQL
File: `apps/api/prisma/migrations/<timestamp>_feat024_active_attempt_constraint/migration.sql`
```sql
-- Preflight duplicate detection: fail safely if invalid duplicate data exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "academy_quiz_attempts"
    WHERE "status" = 'IN_PROGRESS'
    GROUP BY "quiz_id", "user_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Preflight check failed: duplicate IN_PROGRESS attempts found for same quiz_id and user_id';
  END IF;
END $$;

-- Add partial unique index for active IN_PROGRESS attempts
CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_active_key"
ON "academy_quiz_attempts"("quiz_id", "user_id")
WHERE "status" = 'IN_PROGRESS';
```

### 1.3. `AcademyQuizAnswer` Model (Unchanged)
```prisma
model AcademyQuizAnswer {
  id                         String   @id @default(uuid())
  attemptId                  String   @map("attempt_id")
  quizId                     String   @map("quiz_id")
  questionId                 String   @map("question_id")
  selectedOptionId           String?  @map("selected_option_id")
  isCorrect                  Boolean? @map("is_correct")
  questionPromptSnapshot     String   @map("question_prompt_snapshot")
  selectedOptionTextSnapshot String?  @map("selected_option_text_snapshot")
  correctOptionIdSnapshot    String?  @map("correct_option_id_snapshot")
  correctOptionTextSnapshot  String?  @map("correct_option_text_snapshot")
  createdAt                  DateTime @default(now()) @map("created_at")
  updatedAt                  DateTime @updatedAt @map("updated_at")

  attempt        AcademyQuizAttempt  @relation(fields: [attemptId, quizId], references: [id, quizId], onDelete: Restrict)
  question       AcademyQuizQuestion @relation(fields: [questionId, quizId], references: [id, quizId], onDelete: Restrict)
  selectedOption AcademyQuizOption?  @relation(fields: [selectedOptionId, questionId], references: [id, questionId], onDelete: Restrict)

  @@unique([attemptId, questionId])
  @@index([attemptId])
  @@index([questionId])
  @@index([quizId])
  @@map("academy_quiz_answers")
}
```

---

## 2. API Endpoints

All endpoints are protected by the `authenticate` middleware (`req.user.id`).

### 2.1. Start Quiz Attempt
- **Method / Path**: `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts`
- **Auth**: Required (`req.user.id`).
- **Path Parameters**:
  - `courseSlug`: string (slug regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`)
  - `lessonSlug`: string (slug regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`)
- **Request Body**: `{}` (Empty JSON object).
  - **Strict Validation**: If the client provides any body keys (e.g. `userId`, `quizId`, `status`, `score`, `passed`, etc.), the request is rejected with `400 VALIDATION_ERROR`.
- **Service Contract**:
  ```typescript
  export interface StartAttemptResult {
    attempt: AcademyQuizAttemptWithAnswers;
    created: boolean;
  }
  ```
- **Semantics**:
  1. Authenticates caller; obtains `userId = req.user.id`.
  2. Validates request body strictly; rejects unexpected fields with `400 VALIDATION_ERROR`.
  3. Resolves course, lesson, and primary published quiz (`course.status = PUBLISHED`, `lesson.status = PUBLISHED`, `quiz.status = PUBLISHED`).
  4. If hierarchy is missing, draft, archived, or mismatched: returns uniform sanitized `404 NOT_FOUND` ("Resource not found").
  5. Enters transaction with advisory lock on `hashtext('quiz_attempt:' || userId || ':' || quizId)`.
  6. Queries for existing active attempt (`userId`, `quizId`, `status = 'IN_PROGRESS'`).
  7. **Idempotent Return-Existing**: If an active attempt exists, returns `{ attempt: existing, created: false }`.
  8. If no active attempt:
     - Calculates `nextAttemptNumber = (SELECT COALESCE(MAX(attempt_number), 0) + 1 FROM academy_quiz_attempts WHERE user_id = $1 AND quiz_id = $2)` while holding the advisory lock.
     - Attempts to insert new `AcademyQuizAttempt` with `status: 'IN_PROGRESS'`.
     - **Targeted P2002 Race Recovery**:
       - If a Prisma `P2002` error occurs, queries `findActiveAttempt(userId, quizId)`.
       - If an active attempt exists, returns `{ attempt: existing, created: false }`.
       - If no active attempt exists (e.g. an unrelated collision on `attemptNumber`), rethrows the error through the sanitized database error path (`500 INTERNAL_ERROR`).
     - If insert succeeds, returns `{ attempt: newAttempt, created: true }`.
  9. Controller inspects `result.created`:
     - If `result.created === true`: returns `201 Created` with attempt DTO.
     - If `result.created === false`: returns `200 OK` with attempt DTO.

### 2.2. Get Current Active Attempt
- **Method / Path**: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug/quiz/attempts/current`
- **Auth**: Required (`req.user.id`).
- **Semantics**:
  1. Resolves published course, lesson, and primary published quiz. If non-published or missing: returns generic `404 NOT_FOUND`.
  2. Queries active attempt: `userId = req.user.id`, `quizId = quiz.id`, `status = 'IN_PROGRESS'`.
  3. If found: returns `200 OK` with attempt DTO (including draft answers).
  4. If not found: returns `404 QUIZ_ATTEMPT_NOT_FOUND` ("Quiz attempt not found").
  5. If a legacy `CREATED` row exists, it is ignored and endpoint returns `404 QUIZ_ATTEMPT_NOT_FOUND`.

### 2.3. Get Attempt By ID
- **Method / Path**: `GET /api/academy/quiz-attempts/:attemptId`
- **Auth**: Required (`req.user.id`).
- **Path Parameters**:
  - `attemptId`: string (UUID)
- **Canonical Algorithm**:
  1. Queries `AcademyQuizAttempt` scoping ownership: `attempt.id = attemptId AND attempt.userId = req.user.id`.
  2. If attempt does not exist OR belongs to another user: returns generic `404 QUIZ_ATTEMPT_NOT_FOUND`.
  3. Inspects `attempt.status`:
     - **If `IN_PROGRESS`**: Enforces current published content continuation. Verifies that parent quiz, lesson, and course are currently `PUBLISHED`. If any entity became draft, archived, or deleted: returns generic `404 NOT_FOUND`.
     - **If `SUBMITTED` or `GRADED`**: Allows owner-safe historical read of the safe DTO without requiring current content publication (attempt history is durable learner-owned historical state).
     - **If `CREATED`**: Treated as unavailable to FEAT-024 learner runtime; returns `404 QUIZ_ATTEMPT_NOT_FOUND`.
  4. Returns `200 OK` with attempt DTO.

### 2.4. Record Draft Answer
- **Method / Path**: `PUT /api/academy/quiz-attempts/:attemptId/answers/:questionId`
- **Auth**: Required (`req.user.id`).
- **Path Parameters**:
  - `attemptId`: string (UUID)
  - `questionId`: string (UUID)
- **Request Body**:
```json
{
  "optionId": "d3a84e53-5g9f-5c7e-0d23-4c9g83b5e002"
}
```
- **Canonical Algorithm & Ordering**:
  1. Validates body schema: `optionId` must be valid UUID string. If invalid: `400 VALIDATION_ERROR`.
  2. Resolves attempt with ownership check (`id = attemptId AND userId = req.user.id`). If mismatch or missing: `404 QUIZ_ATTEMPT_NOT_FOUND`.
  3. **State Machine Check (Evaluated before content check)**:
     - If `attempt.status === 'SUBMITTED'` or `attempt.status === 'GRADED'`: returns `409 ATTEMPT_ALREADY_FINALIZED` immediately (deterministic finalization immutability).
     - If `attempt.status !== 'IN_PROGRESS'`: returns `404 QUIZ_ATTEMPT_NOT_FOUND`.
  4. **Unpublished Continuation Check**:
     - For `IN_PROGRESS` attempt, verifies that parent quiz, lesson, and course remain `PUBLISHED`. If any is unpublished: returns generic `404 NOT_FOUND`.
  5. **Relational Tree Check**:
     - Question must exist, have `quizId === attempt.quizId`, and `type === 'SINGLE_CHOICE'`. If mismatch: `400 INVALID_OPTION_FOR_QUESTION`.
     - Option must exist and have `questionId === question.id`. If mismatch: `400 INVALID_OPTION_FOR_QUESTION`.
  6. Upserts `AcademyQuizAnswer` on `@@unique([attemptId, questionId])`:
     - `selectedOptionId`: `option.id`
     - `questionPromptSnapshot`: `question.prompt`
     - `selectedOptionTextSnapshot`: `option.text`
     - `isCorrect`: `null` (ZERO evaluation)
     - `correctOptionIdSnapshot`: `null` (AC-011 secrecy)
     - `correctOptionTextSnapshot`: `null` (AC-011 secrecy)
  7. Returns `200 OK` with draft answer DTO.

---

## 3. Data Transfer Objects & Whitelist Projections

### 3.1. Quiz Attempt DTO
```typescript
export interface QuizAttemptDto {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: "CREATED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  startedAt: string;
  answers: QuizDraftAnswerDto[];
}
```

### 3.2. Quiz Draft Answer DTO
```typescript
export interface QuizDraftAnswerDto {
  questionId: string;
  selectedOptionId: string | null;
  updatedAt: string;
}
```

### 3.3. Whitelist Exclusions (AC-011 Zero Leakage)
DTO mappers must strictly exclude:
- `userId`
- `score` / `learnerScore`
- `passed` / `passFailResult`
- `submittedAt` / `gradedAt`
- `isCorrect` / `is_correct`
- `correctOptionIdSnapshot` / `correctOptionTextSnapshot`
- `explanation` / `solution`
- `questionPromptSnapshot` / `selectedOptionTextSnapshot`

---

## 4. Layered Concurrency & Advisory Lock Mechanics

### 4.1. Layer 1: PostgreSQL Partial Unique Index
```sql
CREATE UNIQUE INDEX "academy_quiz_attempts_quiz_id_user_id_active_key"
ON "academy_quiz_attempts"("quiz_id", "user_id")
WHERE "status" = 'IN_PROGRESS';
```
- Final integrity authority directly inside the PostgreSQL engine.
- Physically rejects any second `IN_PROGRESS` attempt for the same `(quiz_id, user_id)` at the storage layer.

### 4.2. Layer 2: PostgreSQL Transaction Advisory Lock
```sql
SELECT pg_advisory_xact_lock(hashtext('quiz_attempt:' || $userId || ':' || $quizId));
```
- Coordinates racing requests inside `PrismaTransactionRunner`.
- **Collision Safety**:
  - `hashtext()` computes a 32-bit integer.
  - In the event of an advisory lock hash collision between unrelated `(user, quiz)` pairs, the two transactions simply serialize momentarily.
  - **No cross-tenant data leak or corruption can occur**, because queries inside the transaction strictly filter by `userId` and `quizId`.

### 4.3. Layer 3: Targeted P2002 Race Recovery
- If an insert encounters a unique violation (Prisma `P2002`), the repository queries `findActiveAttempt(userId, quizId)`.
- If an active attempt exists, it is returned with `created: false`.
- If no active attempt exists, the error is rethrown and mapped through sanitized database error handling (`500 INTERNAL_ERROR`).

---

## 5. Normalized Aura Error Vocabulary

| HTTP Status | Error Code | Canonical Message | Scenario |
|:---|:---|:---|:---|
| **400 Bad Request** | `VALIDATION_ERROR` | Validation failed | Malformed UUID, slug regex violation, or authoritative fields sent in body. |
| **400 Bad Request** | `INVALID_OPTION_FOR_QUESTION` | Invalid option for question | Option does not belong to question, or question does not belong to quiz. |
| **401 Unauthorized** | `UNAUTHENTICATED` | Authentication required | Missing, malformed, or expired JWT access token. |
| **404 Not Found** | `NOT_FOUND` | Resource not found | Course, Lesson, or Quiz is missing, draft, archived, or mismatched from relational hierarchy. |
| **404 Not Found** | `QUIZ_ATTEMPT_NOT_FOUND` | Quiz attempt not found | Attempt does not exist, has no active `IN_PROGRESS` status, or is owned by another user. |
| **409 Conflict** | `ATTEMPT_ALREADY_FINALIZED` | Attempt is already finalized | Attempt status is `SUBMITTED` or `GRADED`; draft answer modification rejected. |
| **500 Internal Server Error** | `INTERNAL_ERROR` | Internal server error | Sanitized error envelope. Zero SQL/Prisma details leaked. |

---

## 6. Frontend State & Cache Authority

1. **Server Authority**: The server is the sole source of truth for attempt and answer state.
2. **No Optimistic Answer Writes**: TanStack Query mutations do **not** write to the canonical attempt cache prior to server response.
3. **Pending Visual State**: The UI provides immediate visual feedback (e.g. pending spinner/disabled radio buttons) during the mutation.
4. **Cache Synchronization**: Upon mutation success, the query cache is updated/invalidated using the server-returned data.
5. **Error Handling**: On failure, the UI remains on the previous confirmed selection and displays a non-intrusive error notification.
