# Technical Specification: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  
**Planning Status**: COMPLETE (REWORK ITERATION 1)  
**Implementation Status**: NOT_STARTED  
**Canonical Acceptance Criteria**: AC-001 .. AC-020  

---

## 1. Persistence & Schema Architecture

### 1.1. Existing Physical Tables (from FEAT-019)
Physical audit confirms that the required tables and constraints are already fully provisioned in PostgreSQL via migration `20260903000000_feat019_academy_foundation`:

#### Table: `academy_user_lesson_progress`
- `id`: String (UUID PK)
- `user_id`: String (FK $\rightarrow$ `users.id` ON DELETE RESTRICT ON UPDATE CASCADE)
- `lesson_id`: String (FK $\rightarrow$ `academy_lessons.id` ON DELETE RESTRICT ON UPDATE CASCADE)
- `status`: String (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
- `started_at`: DateTime (default `now()`)
- `completed_at`: DateTime?
- `created_at`: DateTime (default `now()`)
- `updated_at`: DateTime (`@updatedAt`)
- Constraints:
  - Unique Index: `academy_user_lesson_progress_user_id_lesson_id_key` on `("user_id", "lesson_id")`
  - Check Constraint: `academy_user_lesson_progress_status_check` (`"status" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`)
  - Check Constraint: `academy_user_lesson_progress_completed_check` (`("status" = 'COMPLETED' AND "completed_at" IS NOT NULL) OR ("status" <> 'COMPLETED' AND "completed_at" IS NULL)`)

#### Table: `academy_user_course_progress`
- `id`: String (UUID PK)
- `user_id`: String (FK $\rightarrow$ `users.id` ON DELETE RESTRICT ON UPDATE CASCADE)
- `course_id`: String (FK $\rightarrow$ `academy_courses.id` ON DELETE RESTRICT ON UPDATE CASCADE)
- `status`: String (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`)
- `started_at`: DateTime (default `now()`)
- `completed_at`: DateTime?
- `created_at`: DateTime (default `now()`)
- `updated_at`: DateTime (`@updatedAt`)
- Constraints:
  - Unique Index: `academy_user_course_progress_user_id_course_id_key` on `("user_id", "course_id")`
  - Check Constraint: `academy_user_course_progress_status_check` (`"status" IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`)
  - Check Constraint: `academy_user_course_progress_completed_check` (`("status" = 'COMPLETED' AND "completed_at" IS NOT NULL) OR ("status" <> 'COMPLETED' AND "completed_at" IS NULL)`)

### 1.2. Database Migration Decision (AC-017)
- **ZERO MIGRATIONS REQUIRED**: The existing schema, composite unique keys, foreign keys, and PostgreSQL check constraints already provide 100% of the integrity guarantees needed for FEAT-026.
- **Monotonicity Enforcement Clarification**:
  - PostgreSQL constraints enforce `status` validity and `completed_at` presence when `COMPLETED`.
  - Monotonicity (preventing transition from `COMPLETED` back to `IN_PROGRESS` or overwriting `completed_at`) is an **application transactional invariant** enforced by the repository/service layer, not an automated database trigger.
- Computed metrics (`progressPercent`, `completedLessons`, `totalLessons`) are dynamically calculated at read/projection time to eliminate denormalization drift.

---

## 2. Shared Types & DTO Contracts (`@aura/shared`)

### 2.1. Progression Status Type
```typescript
export type AcademyProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
```

### 2.2. Lesson Progress DTO
```typescript
export interface LessonProgressDto {
  lessonSlug: string;
  status: AcademyProgressStatus;
  completed: boolean;
  completedAt: string | null; // ISO 8601 string or null
}
```

### 2.3. Course Progress DTO
```typescript
export interface CourseProgressDto {
  courseSlug: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number; // Integer 0..100
  status: AcademyProgressStatus;
  completed: boolean;
  completedAt: string | null; // ISO 8601 string or null
  lessons: LessonProgressDto[];
}

export type CourseProgressResponse = ApiResponse<CourseProgressDto>;
```

### 2.4. Safe DTO & Information Isolation Rules
- **No Leaked Identifiers**: `userId`, `courseId`, and `lessonId` (internal UUIDs) are strictly omitted from client DTOs.
- **No Leaked Quiz Data (AC-018)**: Zero answer keys, option correctness flags, question explanations, or scores are included.
- **No Leaked XP/Reward Internals (AC-019)**: Ledger keys, XP point formulas, and audit fields are strictly omitted.
- **No Raw Prisma Models**: Raw database entities are never passed to the response layer.

### 2.5. Complete Lesson Body Schema (AC-003)
```typescript
export const CompleteLessonBodySchema = z.object({}).strict();
export type CompleteLessonBody = z.infer<typeof CompleteLessonBodySchema>;
```
*Note*: Any client-supplied body with fields such as `userId`, `completed`, `status`, `completedAt`, `progressPercent`, `score`, or `passed` will fail validation with HTTP `400 VALIDATION_ERROR`.

### 2.6. Frozen Internal Completion Fact Contract (AC-019)
```typescript
export interface AcademyCompletionFact {
  readonly userId: string;
  readonly resourceType: 'LESSON' | 'COURSE';
  readonly resourceId: string;
  readonly isFirstCompletion: boolean;
  readonly completedAt: Date;
}
```

### 2.7. Deterministic Downstream Idempotency Identity
For downstream FEAT-027 consumption, FEAT-026 defines the canonical semantic identity:
- **LESSON**: `userId + "LESSON" + resourceId`
- **COURSE**: `userId + "COURSE" + resourceId`

Internal deterministic key helper:
```typescript
export function getCompletionKey(fact: AcademyCompletionFact): string {
  return `${fact.userId}:${fact.resourceType}:${fact.resourceId}`;
}
```
*Transport Note*: Completion facts are passed strictly in-process to FEAT-027. No message brokers, Kafka, RabbitMQ, or transactional outbox mechanisms are introduced in FEAT-026.

### 2.8. Backward-Compatible Additive Contract Extension for Lesson Detail
The existing approved `LessonDetailDto` (from FEAT-020) is extended additively:
```typescript
export interface LessonDetailDto {
  // ... existing FEAT-020 fields ...
  progress?: LessonProgressDto | null; // Additive field
}
```
- **Backward Compatibility Verified**: Adding optional `progress` preserves full backward compatibility with FEAT-021, FEAT-022, FEAT-023, and FEAT-024 frontend consumers.

---

## 3. API Endpoint Specifications

### 3.1. Normalized Aura Error Contract
All endpoints comply strictly with the canonical Aura error contract:

| Status | Error Code | Response Schema / Message |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "Validation failed", "details": [...]}}` |
| `400` | `QUIZ_COMPLETION_REQUIRED` | `{"success": false, "error": {"code": "QUIZ_COMPLETION_REQUIRED", "message": "This lesson contains an assessment quiz. You must pass the quiz to complete the lesson."}}` |
| `401` | `UNAUTHENTICATED` | `{"success": false, "error": {"code": "UNAUTHENTICATED", "message": "Authentication required"}}` |
| `404` | `NOT_FOUND` | `{"success": false, "error": {"code": "NOT_FOUND", "message": "Resource not found"}}` |
| `500` | `INTERNAL_ERROR` | `{"success": false, "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}}` |

*Removed Legacy Codes*: `UNAUTHORIZED`, `COURSE_NOT_FOUND`, and `LESSON_NOT_FOUND` are eliminated. Generic `NOT_FOUND` ("Resource not found") is mandatory for non-existent, draft, archived, or mismatched resources.

---

### 3.2. Get Course Progress Endpoint (AC-001, AC-002, AC-007, AC-011, AC-012, AC-013, AC-014)
- **Method**: `GET`
- **Path**: `/api/academy/courses/:courseSlug/progress`
- **Auth**: Required (`Bearer <JWT>`)
- **User Scoping**: Evaluated strictly for `req.user.id`. Client-supplied user parameters are rejected.
- **Success Response**: HTTP `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "courseSlug": "defi-fundamentals",
      "completedLessons": 2,
      "totalLessons": 3,
      "progressPercent": 67,
      "status": "IN_PROGRESS",
      "completed": false,
      "completedAt": null,
      "lessons": [
        {
          "lessonSlug": "intro-to-liquidity-pools",
          "status": "COMPLETED",
          "completed": true,
          "completedAt": "2026-09-08T14:20:00.000Z"
        },
        {
          "lessonSlug": "automated-market-makers",
          "status": "COMPLETED",
          "completed": true,
          "completedAt": "2026-09-09T09:15:00.000Z"
        },
        {
          "lessonSlug": "impermanent-loss-risks",
          "status": "NOT_STARTED",
          "completed": false,
          "completedAt": null
        }
      ]
    }
  }
  ```
- **Special Valid State (Historical Completed with Curriculum Expansion)**:
  ```json
  {
    "courseSlug": "defi-fundamentals",
    "completedLessons": 5,
    "totalLessons": 6,
    "progressPercent": 83,
    "status": "COMPLETED",
    "completed": true,
    "completedAt": "2026-09-01T10:00:00.000Z",
    "lessons": [ ... ]
  }
  ```
- **Error Responses**:
  - `401 UNAUTHENTICATED`: Missing or invalid token.
  - `404 NOT_FOUND`: Course does not exist, or is in `DRAFT`/`ARCHIVED` status (`"Resource not found"`).

---

### 3.3. Manually Complete Informational Lesson Endpoint (AC-001, AC-002, AC-003, AC-008, AC-009, AC-015)
- **Method**: `POST`
- **Path**: `/api/academy/courses/:courseSlug/lessons/:lessonSlug/complete`
- **Auth**: Required (`Bearer <JWT>`)
- **Request Body**: `{}` (strictly enforced; any extra fields trigger `400 VALIDATION_ERROR`)
- **Success Response**: HTTP `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "lessonSlug": "welcome-overview",
      "status": "COMPLETED",
      "completed": true,
      "completedAt": "2026-09-09T11:00:00.000Z"
    }
  }
  ```
- **Assessment Integrity Guard (AC-009)**:
  - If the lesson has an associated quiz with status `PUBLISHED`:
    - Returns HTTP `400 QUIZ_COMPLETION_REQUIRED` (`"This lesson contains an assessment quiz. You must pass the quiz to complete the lesson."`).
- **Idempotency (AC-015)**:
  - Repeated calls return `200 OK` and leave the original `completedAt` timestamp intact.
- **Error Responses**:
  - `400 VALIDATION_ERROR`: Body contains extraneous properties or client-asserted metrics.
  - `400 QUIZ_COMPLETION_REQUIRED`: Lesson contains a published quiz.
  - `401 UNAUTHENTICATED`: Missing or invalid token.
  - `404 NOT_FOUND`: Course or lesson does not exist, is `DRAFT`/`ARCHIVED`, or does not match the slug hierarchy (`"Resource not found"`).

---

## 4. Repository & Domain Architecture

### 4.1. Decoupled Post-Grade Progression Reconciliation Architecture (AC-004, AC-005, AC-006)
FEAT-025 owns the `QuizAttempt` submission and grading transaction. FEAT-026 progression reconciliation is strictly decoupled from the grading transaction:

```
[Client POST /attempts/:attemptId/submit]
              │
              ▼
[FEAT-025 QuizAttemptController / Service]
              │
              ▼ (Transaction 1: Grade & Commit Attempt)
[PostgreSQL: QuizAttempt = GRADED (passed = true/false)]
              │ (Commit successful)
              ▼
[Application Orchestration Layer]
              │
              ▼
[FEAT-026 reconcileProgressFromGradedAttempt(userId, attemptId)]
              │
              ▼ (Transaction 2: Independent Progression Transaction)
[PostgreSQL: academy_user_lesson_progress & academy_user_course_progress]
              │
              ▼
[Return Response to Client]
```

#### Workflow & Recovery Rules:
1. **Transaction Isolation**: FEAT-026 mutations never run inside the FEAT-025 grading transaction.
2. **Partial Failure Handling**: If Transaction 1 commits but Transaction 2 fails:
   - Attempt remains safely and durably `GRADED`.
   - FEAT-026 transaction rolls back cleanly (zero partial progress).
   - Server returns sanitized HTTP `500 INTERNAL_ERROR`.
3. **Submit Replay & Convergence**:
   - On retry of the submit request, FEAT-025 returns the existing `GRADED` attempt.
   - The orchestrator **MUST NEVER** skip progression reconciliation on replay. It triggers `reconcileProgressFromGradedAttempt` again.
   - FEAT-026 reconciliation runs idempotently, converging progress to `COMPLETED`.
4. **Failing Attempt Handling**:
   - If attempt has `passed = false`:
     - Incomplete lesson remains `IN_PROGRESS` or `NOT_STARTED`.
     - Completed lesson remains `COMPLETED` with original `completedAt` (no downgrade).

---

### 4.2. Repository Interface: `IAcademyProgressRepository`
Implemented in `apps/api/src/modules/academy/academy.repository.ts`:

```typescript
export interface IAcademyProgressRepository {
  findCourseProgress(userId: string, courseId: string): Promise<AcademyUserCourseProgress | null>;
  findLessonProgress(userId: string, lessonId: string): Promise<AcademyUserLessonProgress | null>;
  findCourseProgressBySlug(userId: string, courseSlug: string): Promise<{
    course: AcademyCourse;
    publishedLessons: AcademyLesson[];
    lessonProgressMap: Map<string, AcademyUserLessonProgress>;
    courseProgress: AcademyUserCourseProgress | null;
  } | null>;
  
  // Deterministic concurrency-safe upsert with first-completion detection
  upsertLessonProgressSafe(
    userId: string,
    lessonId: string,
    status: AcademyProgressStatus,
    targetCompletedAt: Date | null,
    tx: Prisma.TransactionClient
  ): Promise<{ progress: AcademyUserLessonProgress; isFirstCompletion: boolean }>;

  upsertCourseProgressSafe(
    userId: string,
    courseId: string,
    status: AcademyProgressStatus,
    targetCompletedAt: Date | null,
    tx: Prisma.TransactionClient
  ): Promise<{ progress: AcademyUserCourseProgress; isFirstCompletion: boolean }>;

  getPublishedLessonsForCourse(
    courseId: string,
    tx?: Prisma.TransactionClient
  ): Promise<AcademyLesson[]>;
}
```

---

### 4.3. Concurrency-Safe First-Completion Strategy (AC-016)

To guarantee that 5 simultaneous requests produce exactly one `isFirstCompletion = true`:
```typescript
// Inside PostgreSQL transaction (tx):
// 1. Lock the existing lesson progress row if it exists, or insert initial row with conflict handling
const existing = await tx.$queryRaw<AcademyUserLessonProgress[]>`
  SELECT * FROM "academy_user_lesson_progress"
  WHERE "user_id" = ${userId} AND "lesson_id" = ${lessonId}
  FOR UPDATE
`;

let isFirstCompletion = false;
let progressRow: AcademyUserLessonProgress;

if (existing.length === 0) {
  // First creation: insert directly
  const now = new Date();
  progressRow = await tx.academyUserLessonProgress.create({
    data: {
      userId,
      lessonId,
      status,
      startedAt: now,
      completedAt: status === 'COMPLETED' ? (targetCompletedAt ?? now) : null,
    },
  });
  isFirstCompletion = status === 'COMPLETED';
} else {
  const current = existing[0];
  if (current.status === 'COMPLETED') {
    // Monotonicity: never downgrade, never overwrite completedAt
    progressRow = current;
    isFirstCompletion = false;
  } else {
    // Transitioning from NOT_STARTED / IN_PROGRESS to COMPLETED
    const now = new Date();
    progressRow = await tx.academyUserLessonProgress.update({
      where: { id: current.id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? (targetCompletedAt ?? now) : current.completedAt,
      },
    });
    isFirstCompletion = status === 'COMPLETED';
  }
}
```
*Outcome*: Exactly one worker observes `existing.status !== 'COMPLETED'` and transitions the record, emitting `isFirstCompletion = true`. All concurrent workers waiting on the `FOR UPDATE` lock observe the updated `COMPLETED` row and return `isFirstCompletion = false` with the preserved original timestamp.

---

### 4.4. Course Progress Rollup Algorithm (AC-010, AC-011, AC-012, AC-013, AC-014)

Executed in the same transaction as lesson completion:
```typescript
// 1. Fetch all active PUBLISHED lessons for the course
const publishedLessons = await tx.academyLesson.findMany({
  where: { courseId, status: 'PUBLISHED' },
  select: { id: true }
});

const totalLessons = publishedLessons.length;

// 2. Fetch completed lesson progress for published lessons
const completedProgress = await tx.academyUserLessonProgress.findMany({
  where: {
    userId,
    lessonId: { in: publishedLessons.map(l => l.id) },
    status: 'COMPLETED',
  },
});

const completedLessons = completedProgress.length;

// 3. Compute dynamic curriculum coverage percentage (guarded against division by zero)
const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

// 4. Lock/Fetch existing course progress row
const existingCourse = await tx.$queryRaw<AcademyUserCourseProgress[]>`
  SELECT * FROM "academy_user_course_progress"
  WHERE "user_id" = ${userId} AND "course_id" = ${courseId}
  FOR UPDATE
`;

let isFirstCourseCompletion = false;
let courseRow: AcademyUserCourseProgress;

if (existingCourse.length > 0 && existingCourse[0].status === 'COMPLETED') {
  // AC-013: Monotonic Historical Completion Invariant
  // Course remains COMPLETED permanently even if totalLessons changed or became 0
  courseRow = existingCourse[0];
  isFirstCourseCompletion = false;
} else if (totalLessons > 0 && completedLessons === totalLessons) {
  // Transition to COMPLETED
  const now = new Date();
  if (existingCourse.length === 0) {
    courseRow = await tx.academyUserCourseProgress.create({
      data: {
        userId,
        courseId,
        status: 'COMPLETED',
        startedAt: now,
        completedAt: now,
      },
    });
  } else {
    courseRow = await tx.academyUserCourseProgress.update({
      where: { id: existingCourse[0].id },
      data: {
        status: 'COMPLETED',
        completedAt: now,
      },
    });
  }
  isFirstCourseCompletion = true;
} else {
  // Remains NOT_STARTED or IN_PROGRESS
  const status: AcademyProgressStatus = (completedLessons > 0 || (existingCourse.length > 0 && existingCourse[0].status === 'IN_PROGRESS'))
    ? 'IN_PROGRESS'
    : 'NOT_STARTED';
  const now = new Date();
  if (existingCourse.length === 0) {
    courseRow = await tx.academyUserCourseProgress.create({
      data: { userId, courseId, status, startedAt: now, completedAt: null },
    });
  } else {
    courseRow = await tx.academyUserCourseProgress.update({
      where: { id: existingCourse[0].id },
      data: { status, completedAt: null },
    });
  }
  isFirstCourseCompletion = false;
}
```

---

## 5. Security & Isolation Architecture

1. **Authentication Required (AC-001)**: All progression endpoints reject requests missing valid JWT bearer tokens with `401 UNAUTHENTICATED`.
2. **Server-Derived Identity (AC-002)**: User identity is extracted strictly from verified token principal (`req.user.id`). No cross-user access or manipulation is possible.
3. **Strict Body Validation (AC-003)**: Client cannot pass authoritative progress state. Extra fields return `400 VALIDATION_ERROR`.
4. **Assessment Integrity Guard (AC-009)**: Server checks whether a lesson contains an active published quiz. If present, manual complete is rejected with `400 QUIZ_COMPLETION_REQUIRED`.
5. **Pre-Submission Secrecy Hard Gate (AC-018)**: Progression endpoints and DTO projections expose ZERO quiz option structures, answer keys, explanations, or scores.
6. **Zero Side Effects (AC-019)**: ZERO writes to `AcademyUserXp`, `AcademyRewardLedger`, or `ProductAuditRecord`. ZERO Redis durable progress authority.

---

## 6. Traceability Matrix

| Acceptance Criteria | Technical Specification Section | Enforcing Mechanism |
|---|---|---|
| **AC-001** Authentication | Section 3.1, 3.2, 3.3, 5 | Express auth middleware returning `401 UNAUTHENTICATED` |
| **AC-002** Ownership / Server-Derived User | Section 3.2, 3.3, 5 | Controller extracting `req.user.id` only; ignoring client params |
| **AC-003** Strict Request Validation | Section 2.5, 3.3 | Zod `CompleteLessonBodySchema.strict()` returning `400 VALIDATION_ERROR` |
| **AC-004** Passing Quiz Sync | Section 4.1 | Application orchestrator calling `reconcileProgressFromGradedAttempt` |
| **AC-005** Failing Quiz Sync | Section 4.1 | Reconciliation checks `attempt.passed === true` before updating |
| **AC-006** Retake Failure Invariant | Section 4.3 | Row lock checking `existing.status === 'COMPLETED'` preserving state |
| **AC-007** Server Authority | Section 2.4, 4.4 | Server calculates all metrics from PostgreSQL; client inputs rejected |
| **AC-008** Informational Lesson Complete | Section 3.3, 4.3 | `POST .../complete` updates lesson progress in PostgreSQL |
| **AC-009** Quiz Lesson Rejection | Section 3.3, 5 | Server verifies quiz existence; returns `400 QUIZ_COMPLETION_REQUIRED` |
| **AC-010** Course Completion Rollup | Section 4.4 | Synchronous rollup in transaction when `completedLessons === totalLessons` |
| **AC-011** Curriculum Progress % | Section 4.4 | `Math.round((completed / total) * 100)` on active published lessons |
| **AC-012** Zero Published Lessons | Section 4.4 | Guard against zero denominator; preserves historical completed state |
| **AC-013** Monotonic Historical Course | Section 4.4 | Course progress remains `COMPLETED` even after curriculum expansion |
| **AC-014** Draft / Archived Exclusion | Section 4.4 | SQL queries filter `status = 'PUBLISHED'`; historical rows preserved |
| **AC-015** Idempotent Completion | Section 4.3, 4.4 | Repeated calls return `200 OK` and leave `completedAt` unchanged |
| **AC-016** Concurrent Progression Safety | Section 4.3 | `SELECT ... FOR UPDATE` row locking; exactly one `isFirstCompletion: true` |
| **AC-017** PostgreSQL Integrity | Section 1.1, 1.2 | Verification against schema CHECK constraints; transaction rollback on error |
| **AC-018** Secrecy Hard Gate | Section 2.4, 5 | DTO mappers omit quiz questions, options, answers, and explanations |
| **AC-019** Completion Fact Contract | Section 2.6, 2.7 | In-process emission of `AcademyCompletionFact`; zero XP/ledger/audit writes |
| **AC-020** Canonical Verification | Section 1.2, 6 | Execution of canonical 14 validation suite with zero failures |
