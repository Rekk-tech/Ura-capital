# Requirement: FEAT-026 Academy Progression & Completion Tracking

**Status**: READY FOR HUMAN PLANNING REVIEW  
**Feature ID**: FEAT-026  
**Phase**: Phase 4 — Academy  
**Feature Type**: Backend Domain Lifecycle, Progression State Foundation & Safe Learner Projection  
**Planning Owner**: DEV-A  
**Planning Status**: COMPLETE (REWORK ITERATION 1)  
**Human Planning Approval**: PENDING  
**Unresolved Human Decisions**: ZERO (All 8 Human Decisions Approved)  
**Application Code Changes in this Step**: ZERO (Specification & Planning Package Only)  
**Implementation Status**: NOT_STARTED (BLOCKED PENDING HUMAN PLANNING APPROVAL)  
**QA Status**: NOT_STARTED  
**Internal Feature Gate**: PENDING  
**FEAT-027**: BLOCKED by FEAT-026  
**Phase 4 Status**: IN_PROGRESS  

---

## 1. Executive Summary & Context

Phase 4 establishes learner-facing Academy capabilities on the approved Aura architecture:
- **FEAT-019**: Academy Domain Schema & Persistence Foundation (`DONE` / Human Final Gate Approved).
- **FEAT-020**: Course & Lesson Read Model APIs (`DONE` / Human Final Gate Approved).
- **FEAT-021**: Academy Learner Course/Lesson UI (`DONE` / Human Final Gate Approved).
- **FEAT-022**: Flashcards Domain & Review Flow (`DONE` / Human Final Gate Approved).
- **FEAT-023**: Quiz Definition & Safe Projection (`DONE` / Human Final Gate Approved).
- **FEAT-024**: Quiz Attempt Lifecycle (`DONE` / Human Final Gate Approved).
- **FEAT-025**: Server-Side Quiz Evaluation & Secure Submission (`DONE` / Internal Feature Gate Passed).

**FEAT-026** is the eighth feature in Phase 4. It establishes the **server-authoritative progression and completion tracking foundation** for courses and lessons across the Aura Academy.

FEAT-026 owns:
1. Learner lesson progression state (`AcademyUserLessonProgress`).
2. Learner course progression state (`AcademyUserCourseProgress`).
3. Server-authoritative lesson completion evaluation.
4. Server-authoritative course completion rollup and dynamic progress percentage calculation.
5. Idempotent progression updates with permanent monotonicity guarantees.
6. Coordinated post-grade progression reconciliation decoupled from FEAT-025 grading transactions.
7. Durable PostgreSQL progress persistence.
8. Safe, authenticated learner progress read APIs and backward-compatible additive projection in lesson detail.
9. Frozen internal completion fact contract with deterministic downstream idempotency identity for FEAT-027 (XP & Rewards).

FEAT-026 explicitly **DOES NOT OWN**:
- Reopening or mutating the FEAT-025 grading transaction (FEAT-025 boundary remains strictly preserved).
- XP awards, calculations, or grants (owned by FEAT-027).
- `AcademyRewardLedger` or `AcademyUserXp` writes (owned by FEAT-027).
- Badges, achievements, streaks, or gamification mechanics (Phase 4 / Phase 8).
- Premium subscription entitlement gates (owned by Phase 7 / FEAT-051).
- Concrete product audit persistence (deferred pending Human decision in FEAT-029).
- Quiz scoring, evaluation, or option correctness verification (owned by FEAT-025).
- Redis durable progress authority (prohibited by cross-phase architecture contracts).
- Event bus or outbox message brokers (Kafka, RabbitMQ, outbox tables are prohibited).

---

## 2. Core Architecture & Invariants

### 2.1. Absolute Server Authority (CRITICAL HARD GATE: AC-007)
- The client has **ZERO authority** over progression percentages, completion status flags, completion timestamps, or quiz passing states.
- The client may only express learner intent (e.g., submitting a quiz attempt via FEAT-025, or requesting manual completion for an informational lesson).
- Any request body attempting to submit authoritative fields (`progressPercent`, `status`, `completed`, `completedAt`, `courseCompleted`, `lessonCompleted`, `score`, `passed`, `xp`) is strictly rejected with HTTP `400 VALIDATION_ERROR`.
- All progress metrics (`completedLessons`, `totalLessons`, `progressPercent`, `status`, `completed`, `completedAt`) are strictly derived by the server from PostgreSQL persistence.

### 2.2. Two Distinct Semantics: Historical Completion vs. Current Curriculum Coverage
A core architectural tenet of FEAT-026 is the explicit separation of historical milestone achievement from active curriculum coverage:
1. **Historical Completion Achievement**:
   - Represented by `status = 'COMPLETED'` and `completed = true` on `AcademyUserCourseProgress` and `AcademyUserLessonProgress`.
   - Reflects the durable pedagogical fact that the learner satisfied all completion requirements at a specific point in time (`completedAt`).
   - Strictly **MONOTONIC**: once achieved, completion is permanent. It is never revoked, cleared, or demoted.
2. **Current Curriculum Coverage**:
   - Represented by `completedLessons`, `totalLessons`, and `progressPercent`.
   - Reflects the learner's progress against the currently active `PUBLISHED` lessons in the course.
   - Evaluated dynamically at read time.
3. **Valid Multi-Metric State**:
   - When new lessons are published to an already completed course, historical completion remains intact while current coverage reflects the expanded denominator:
     $$\text{status} = \text{'COMPLETED'}, \quad \text{completed} = \text{true}, \quad \text{progressPercent} = 83$$
   - Frontend and downstream consumers (including FEAT-027) **MUST NOT** infer `completed === (progressPercent === 100)`.

### 2.3. Zero-Lesson Policy (AC-012)
- For a course with zero active published lessons:
  - `completedLessons = 0`, `totalLessons = 0`, `progressPercent = 0`.
  - Division by zero is strictly guarded and prevented.
  - If the course has never historically completed: `status = 'NOT_STARTED'`, `completed = false`.
  - If the course was historically `COMPLETED` prior to lesson unpublishing/archiving: historical `status = 'COMPLETED'` and original `completedAt` are preserved, while active coverage metrics report `0 / 0 / 0%`.

### 2.4. Published Content & Archive Invariant (AC-014)
- Only lessons with status `PUBLISHED` belong to the course progress denominator and contribute to active progress rollup.
- Lessons with status `DRAFT` or `ARCHIVED` are strictly excluded from calculation.
- Archiving a previously completed lesson does **NOT** delete or alter the learner's historical `AcademyUserLessonProgress` row in PostgreSQL.

### 2.5. Decoupled Post-Grade Progression Reconciliation Architecture (AC-004, AC-005, AC-006)
- **FEAT-025 Boundary Preserved**: FEAT-025 owns the grading transaction for `QuizAttempt` and `QuizAnswer`. In accordance with architectural boundaries, FEAT-026 **MUST NOT** inject progress writes into the FEAT-025 grading transaction.
- **Coordinated Workflow**:
  1. FEAT-025 executes the attempt submission and evaluation, committing the `QuizAttempt` (`status = 'GRADED'`) and answers in its own transaction.
  2. The application orchestrator inspects the committed graded result.
  3. The orchestrator invokes the internal FEAT-026 progression service:
     ```typescript
     reconcileProgressFromGradedAttempt(authenticatedUserId: string, attemptId: string): Promise<void>
     ```
  4. FEAT-026 executes progression evaluation and updates in its own independent PostgreSQL transaction.
- **Delivery & Recovery Semantics**:
  - **Grading**: Durable, exactly-once committed outcome.
  - **Progress Reconciliation Invocation**: At-least-once / retryable.
  - **Progress State Mutation**: Idempotent and convergent.
- **Partial Failure & Retry Recovery**:
  - If FEAT-025 grading commits successfully but FEAT-026 progression reconciliation fails (e.g., transient DB lock or network interruption):
    - The `QuizAttempt` remains durably `GRADED` in PostgreSQL.
    - No partial or corrupted progress data is committed (FEAT-026 transaction rolls back).
    - The HTTP request returns a sanitized `500 INTERNAL_ERROR`.
  - On a subsequent client retry of the submission:
    - FEAT-025 idempotently returns the already-persisted `GRADED` result.
    - **CRITICAL**: The orchestrator **MUST NEVER** skip progression reconciliation during a graded replay. It invokes `reconcileProgressFromGradedAttempt` again.
    - The progression reconciliation executes and idempotently converges the learner's progress to `COMPLETED`.
- **Failing Attempt Handling (AC-005, AC-006)**:
  - If the attempt achieved `status = 'GRADED'` but `passed = false`:
    - Reconciliation must NOT mark an incomplete lesson as `COMPLETED`.
    - If the lesson was previously `COMPLETED`, reconciliation preserves the completion status and original timestamp unchanged (strictly zero downgrade).

### 2.6. Atomic FEAT-026 Progression Transaction (AC-010, AC-017)
When a lesson completion occurs (via manual completion or post-grade reconciliation), a single atomic PostgreSQL transaction coordinates:
1. Lesson progress upsert and verification.
2. First-completion detection (`isFirstCompletion: boolean`).
3. Query of active published lesson IDs for the course.
4. Count of completed published lessons.
5. Course progress status rollup.
6. First course-completion detection (`isFirstCompletion: boolean`).
7. Construction of internal `AcademyCompletionFact` records.
Any failure during this workflow causes a complete **ROLLBACK** of all mutations in the transaction.

### 2.7. Deterministic Concurrency & First-Completion Safety (AC-016)
- Existing composite unique constraints `(user_id, lesson_id)` and `(user_id, course_id)` guarantee physical duplicate-row prevention.
- However, naive application-level `upsert` cannot deterministically determine `isFirstCompletion` under concurrent execution.
- Under high concurrency (e.g., 5 simultaneous completion requests for the same user and resource):
  - Progression operations use deterministic repository row-locking (`SELECT ... FOR UPDATE` on progress rows) or conditional atomic updates with conflict handling.
  - Exactly one execution path detects that the resource transitioned from incomplete to complete, asserting `isFirstCompletion = true`.
  - All competing concurrent executions observe the existing completion, asserting `isFirstCompletion = false` and returning the original `completedAt`.
  - Exactly one progress row exists in PostgreSQL per resource, with no unhandled 500 errors or duplicate-key crashes.

### 2.8. Zero Database Migrations Decision (AC-017)
- Direct physical inspection of `apps/api/prisma/schema.prisma` and migration `20260903000000_feat019_academy_foundation` confirms that:
  - `academy_user_lesson_progress` and `academy_user_course_progress` already possess composite unique keys (`user_id, lesson_id` and `user_id, course_id`).
  - PostgreSQL CHECK constraints enforce valid statuses: `status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`.
  - PostgreSQL CHECK constraints enforce timestamp coherence: `(status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL)`.
- **Monotonicity Clarification**: Monotonicity (preventing downgrade or timestamp alteration) is an **application transactional invariant** enforced by repository logic, not a database trigger or constraint. Documentation must accurately describe this distinction without falsely claiming DB-enforced monotonicity.
- Therefore: Existing schema satisfies 100% of FEAT-026 persistence requirements. **ZERO database migrations are required.**

---

## 3. Human Product & Architectural Decisions (APPROVED)

The 8 architectural and product decisions for FEAT-026 are resolved and approved:

### Decision 1: Does passing a lesson quiz automatically complete the lesson?
- **APPROVED**: **YES (Automatic Completion via Post-Grade Reconciliation)**.
- When a learner achieves a `GRADED` attempt with `passed = true` on the published quiz for a lesson, post-grade reconciliation automatically updates `AcademyUserLessonProgress` to `COMPLETED`. The learner is not required to click a separate "Mark Complete" button.
- Passing a graded assessment is the definitive pedagogical requirement for mastery.

### Decision 2: Completion policy for lessons without a quiz?
- **APPROVED**: **Explicit Intent via Protected Endpoint with Server Assessment Guard**.
- Endpoint: `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete`
- Request body: Strict empty JSON object `{}` (validated via Zod).
- **Assessment Integrity Guard**: If the target lesson contains a `PUBLISHED` quiz, manual completion is **strictly rejected** with HTTP `400 QUIZ_COMPLETION_REQUIRED` ("This lesson contains an assessment quiz. You must pass the quiz to complete the lesson.").
- If the lesson has no published quiz (informational / reading content), the endpoint idempotently marks the lesson `COMPLETED` with `completedAt = now()`.

### Decision 3: Monotonicity of Lesson and Course Completion
- **APPROVED**: **STRICT MONOTONICITY (COMPLETION IS PERMANENT)**.
- Once an `AcademyUserLessonProgress` or `AcademyUserCourseProgress` transitions to `COMPLETED`, it remains `COMPLETED` permanently.
- Retaking a quiz and failing (`passed = false`) does **NOT** revoke completion or demote status to `IN_PROGRESS`.
- The original `completedAt` timestamp is permanently preserved across all retakes and repeated calls.

### Decision 4: Policy when a new lesson is published to an already completed course
- **APPROVED**: **Preserve Historical Completed Status; Coverage Metric Reflects New Scope**.
- If a learner historically completed all 5 lessons of a 5-lesson course (`status = 'COMPLETED'`, `completed = true`, `completedAt = T1`), and a 6th lesson is subsequently published:
  - Course `status` remains `COMPLETED`, `completed` remains `true`, and `completedAt` remains `T1`.
  - Dynamic read metrics report `completedLessons: 5`, `totalLessons: 6`, `progressPercent: 83`.
  - Completing the 6th lesson updates coverage to 100% without altering the historical `completedAt`.

### Decision 5: Policy for Archived or Unpublished Lessons/Quizzes
- **APPROVED**: **Preserve Historical Progress Rows; Denominator Queries Active Published Only**.
- Historical `AcademyUserLessonProgress` rows remain durably in PostgreSQL.
- Progress percentage and completion rollups evaluate only currently active `PUBLISHED` lessons.

### Decision 6: Course Progress Percentage Formula & Rounding
- **APPROVED**: **Standard Integer Percentage with Zero-Lesson Guard**.
- Formula:
  $$\text{progressPercent} = \begin{cases} 0 & \text{if } N_{\text{published}} = 0 \\ \text{Math.round}\left(\frac{C_{\text{published}}}{N_{\text{published}}} \times 100\right) & \text{if } N_{\text{published}} > 0 \end{cases}$$
  where $C_{\text{published}}$ is the count of active published lessons completed by the learner, and $N_{\text{published}}$ is the total count of active published lessons.
- Integer bounded strictly between 0 and 100. Division by zero is impossible.

### Decision 7: Schema Migration Decision
- **APPROVED**: **ZERO SCHEMA MIGRATION**.
- Physical tables from FEAT-019 satisfy all integrity requirements.
- Monotonicity is guaranteed by the service/repository transactional boundary.

### Decision 8: Progress Read API Shape & Projection Policy
- **APPROVED**: **Dedicated Authenticated Endpoint + Backward-Compatible Additive Projection**.
- Dedicated endpoint: `GET /api/academy/courses/:courseSlug/progress` (Authenticated, user-scoped).
- Additive projection: `GET /api/academy/courses/:courseSlug/lessons/:lessonSlug` includes optional `progress?: LessonProgressDto | null`. Classified as an approved backward-compatible additive contract extension that preserves existing FEAT-021..FEAT-024 frontend compatibility.

---

## 4. Canonical Acceptance Criteria Baseline (AC-001 .. AC-020)

FEAT-026 enforces exactly 20 canonical acceptance criteria:

1. **AC-001: Authentication** — Unauthenticated requests to progression endpoints return HTTP `401 UNAUTHENTICATED`.
2. **AC-002: Ownership / Server-Derived User** — Learner identity is strictly extracted from `req.user.id`. Client-supplied user identifiers are rejected.
3. **AC-003: Strict Request Validation** — `POST .../complete` strictly validates body `{}`. Extraneous or client-asserted fields return HTTP `400 VALIDATION_ERROR`.
4. **AC-004: Passing Quiz Triggers Lesson Completion** — `GRADED` attempt with `passed = true` reconciles lesson progress to `COMPLETED` with non-null `completedAt`.
5. **AC-005: Failing Quiz Does Not Complete Lesson** — `GRADED` attempt with `passed = false` does not transition incomplete lesson to `COMPLETED`.
6. **AC-006: Failing Retake Does Not Revoke Completion** — Failing a retake on a completed lesson preserves `COMPLETED` status and original `completedAt`.
7. **AC-007: Server-Authoritative Progression (CRITICAL HARD GATE)** — All metrics and flags are server-derived from PostgreSQL; zero client calculation authority.
8. **AC-008: Informational Lesson Manual Completion** — `POST .../complete` on a published lesson without a quiz marks lesson `COMPLETED`.
9. **AC-009: Quiz Lesson Manual Completion Rejected** — `POST .../complete` on a lesson with a published quiz is rejected with HTTP `400 QUIZ_COMPLETION_REQUIRED`.
10. **AC-010: Course Completion Rollup** — Completing all active published lessons transitions course progress to `COMPLETED`.
11. **AC-011: Current Curriculum Progress Percentage** — `progressPercent` dynamically reflects published curriculum coverage: `Math.round((completed / total) * 100)`.
12. **AC-012: Zero Published Lessons** — Course with zero published lessons returns `0 / 0 / 0%`. Prevents division by zero; preserves historical completion if previously completed.
13. **AC-013: Monotonic Historical Course Completion** — Historical course completion is permanent. Course remains `completed = true` even if new lessons expand curriculum.
14. **AC-014: Draft / Archived Lesson Exclusion** — Non-published lessons are excluded from progress denominator; historical progress rows remain intact.
15. **AC-015: Idempotent Completion** — Repeated completion requests return HTTP `200 OK` without overwriting original `completedAt`.
16. **AC-016: Concurrent Progression Safety** — Concurrent completion calls result in exactly one progress row, original `completedAt`, and exactly one `isFirstCompletion = true`.
17. **AC-017: PostgreSQL Integrity** — Strict compliance with PostgreSQL check and unique constraints; atomic rollback on any failure.
18. **AC-018: Pre-Submission Secrecy Regression (CRITICAL HARD GATE)** — Progression endpoints expose ZERO quiz answer options, answer keys, or correctness data.
19. **AC-019: Completion Fact Contract + Zero XP/Reward/Audit Side Effects** — Emits frozen `AcademyCompletionFact` with deterministic identity; zero writes to XP, rewards, or audit logs; zero Redis durable authority.
20. **AC-020: Canonical Regression / Documentation Integrity** — All 14 canonical verification checks pass with exit code 0; zero unapproved skips.

---

## 5. Downstream Integration Contract for FEAT-027 (XP & Rewards)

### 5.1. Frozen Internal Completion Fact Interface
```typescript
export interface AcademyCompletionFact {
  readonly userId: string;
  readonly resourceType: 'LESSON' | 'COURSE';
  readonly resourceId: string;
  readonly isFirstCompletion: boolean;
  readonly completedAt: Date;
}
```

### 5.2. Deterministic Downstream Idempotency Identity
To ensure FEAT-027 can enforce exactly-once reward ledger writes without race conditions, FEAT-026 establishes the canonical semantic identity for completions:
- **Lesson Completion Identity**: `userId + "LESSON" + resourceId`
- **Course Completion Identity**: `userId + "COURSE" + resourceId`

An internal helper method provides the deterministic idempotency key format:
```typescript
export function getCompletionKey(fact: AcademyCompletionFact): string {
  return `${fact.userId}:${fact.resourceType}:${fact.resourceId}`;
}
```
*Note*: This key is an internal domain/service construct for FEAT-027 ledger deduplication and is **NEVER** exposed via learner-facing APIs.

### 5.3. In-Process Transport Boundary
- `AcademyCompletionFact` is passed strictly in-process (via service return or internal domain event handler).
- FEAT-026 does **NOT** introduce message queues, event buses, Kafka, RabbitMQ, or transactional outbox tables.

---

## 6. Aura Normalized Error Contract

Learner-facing error responses conform strictly to the Aura error vocabulary:

| HTTP Status | Error Code | Canonical Message / Condition |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `"Validation failed"` (extraneous fields or client-asserted progress values). |
| `400` | `QUIZ_COMPLETION_REQUIRED` | `"This lesson contains an assessment quiz. You must pass the quiz to complete the lesson."` |
| `401` | `UNAUTHENTICATED` | `"Authentication required"` (missing or invalid JWT). |
| `404` | `NOT_FOUND` | `"Resource not found"` (course or lesson non-existent, draft, archived, or mismatched hierarchy). |
| `500` | `INTERNAL_ERROR` | `"An unexpected error occurred"` |
