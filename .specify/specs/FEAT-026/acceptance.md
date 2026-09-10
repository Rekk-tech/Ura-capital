# Acceptance Criteria: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 — Academy  
**Status**: READY FOR HUMAN PLANNING REVIEW  
**Planning Status**: COMPLETE (REWORK ITERATION 1)  
**Implementation Status**: NOT_STARTED  
**Unresolved Human Decisions**: ZERO  

---

## 1. Canonical Acceptance Criteria Matrix (AC-001 .. AC-020)

This matrix represents the **single canonical truth** for FEAT-026. All specification, planning, task, and test artifacts align strictly to this numbered index.

| ID | Category | Description | Verification Method |
|---|---|---|---|
| **AC-001** | Authentication | Unauthenticated access to `GET /api/academy/courses/:courseSlug/progress` or `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete` returns HTTP `401 UNAUTHENTICATED`. | Integration Test |
| **AC-002** | Ownership / Server-Derived User | Progression queries and mutations derive user identity strictly from the authenticated session (`req.user.id`). Any client-supplied `userId` in query params, path, or request body is rejected or ignored. No learner can access or mutate another learner's progress. | Integration Test |
| **AC-003** | Strict Request Validation | `POST .../complete` strictly validates the request body using `CompleteLessonBodySchema` (`{}`). Any extraneous fields, client-asserted progress states, or completion metadata (`userId`, `completed`, `status`, `completedAt`, `progressPercent`, `score`, `passed`) are rejected with HTTP `400 VALIDATION_ERROR`. | Unit & Integration Test |
| **AC-004** | Passing Quiz Triggers Lesson Completion | Achieving a `GRADED` quiz attempt with `passed = true` automatically triggers post-grade progression reconciliation in FEAT-026, transitioning lesson progress to `status = 'COMPLETED'` with non-null `completedAt`. | Integration Test |
| **AC-005** | Failing Quiz Does Not Complete Lesson | Achieving a `GRADED` quiz attempt with `passed = false` does NOT mark an incomplete lesson as `COMPLETED`. Lesson progress remains `IN_PROGRESS` or `NOT_STARTED`. | Integration Test |
| **AC-006** | Failing Retake Does Not Revoke Completion | Retaking a quiz on a previously completed lesson and failing (`passed = false`) MUST NOT revoke or downgrade completion. Lesson remains `status = 'COMPLETED'` with the original historical `completedAt` timestamp intact. | Integration Test |
| **AC-007** | Server-Authoritative Progression | **CRITICAL HARD GATE**: All progression states, counts, and percentages (`completedLessons`, `totalLessons`, `progressPercent`, `status`, `completed`, `completedAt`) are strictly computed server-side from PostgreSQL. Clients possess ZERO authority over progression metrics. | Integration Test |
| **AC-008** | Informational Lesson Manual Completion | Calling `POST .../complete` on a published informational lesson (a lesson with NO published quiz) transitions lesson progress to `status = 'COMPLETED'` with `completedAt = now()`. | Integration Test |
| **AC-009** | Quiz Lesson Manual Completion Rejected | Calling `POST .../complete` on a lesson that contains a `PUBLISHED` quiz is rejected server-side with HTTP `400 QUIZ_COMPLETION_REQUIRED`. Client UI button omission is not a substitute for this hard server guard. | Integration Test |
| **AC-010** | Course Completion Rollup | When all active published lessons in a course achieve `COMPLETED` status for a learner, the course progress transitions to `status = 'COMPLETED'` with non-null `completedAt`. | Integration Test |
| **AC-011** | Current Curriculum Progress Percentage | `progressPercent` reflects current active curriculum coverage: `Math.round((completedLessons / totalLessons) * 100)`, considering only active `PUBLISHED` lessons. Evaluates to 0 if total published lessons is 0. | Unit & Integration Test |
| **AC-012** | Zero Published Lessons | A course with zero published lessons returns `completedLessons: 0`, `totalLessons: 0`, `progressPercent: 0`. If never completed, `status: NOT_STARTED`, `completed: false`. If historically completed, preserves historical `COMPLETED` status while coverage metrics report 0/0/0. Division by zero is strictly prevented. | Unit & Integration Test |
| **AC-013** | Monotonic Historical Course Completion | Once an `AcademyUserCourseProgress` achieves `COMPLETED` (`completed = true`), it remains permanently `COMPLETED` even if new lessons are subsequently added to the curriculum or existing lessons are archived. The state `status = 'COMPLETED', completed = true, progressPercent = 83` is explicitly valid. | Integration Test |
| **AC-014** | Draft / Archived Lesson Exclusion | Lessons with status `DRAFT` or `ARCHIVED` are strictly excluded from the course progress denominator and completion rollup. Archiving a previously completed lesson preserves its historical progress row in PostgreSQL. | Integration Test |
| **AC-015** | Idempotent Completion | Repeated invocations of `POST .../complete` or repeated graded attempt reconciliations return HTTP `200 OK` and leave the original `completedAt` timestamp and progress row unmodified. | Integration Test |
| **AC-016** | Concurrent Progression Safety | Under high concurrency (e.g., 5 simultaneous completion or reconciliation requests for the same user and resource), exactly one row is created, exactly one first-completion fact (`isFirstCompletion = true`) is generated, subsequent calls report `false`, and no 500 errors or duplicate key exceptions leak to the caller. | Integration Test (Real PostgreSQL) |
| **AC-017** | PostgreSQL Integrity | All persisted progress records strictly satisfy PostgreSQL check constraints `status_check` (`status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`) and `completed_check` (`(status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL)`). Any mutation failure rolls back the entire FEAT-026 progress transaction. | Integration Test |
| **AC-018** | Pre-Submission Secrecy Regression | **CRITICAL HARD GATE**: Progression endpoints, lesson detail progress projections, and DTOs expose ZERO quiz options, correct answer keys, question explanations, or correctness snapshots. | Integration Test |
| **AC-019** | Completion Fact Contract + Zero XP/Reward/Audit Side Effects | Emits internal `AcademyCompletionFact` with deterministic semantic identity (`userId + resourceType + resourceId`) for downstream FEAT-027 consumption. FEAT-026 performs ZERO writes to `AcademyUserXp`, `AcademyRewardLedger`, or `ProductAuditRecord`, and assigns ZERO durable authority to Redis. | Unit & Integration Test |
| **AC-020** | Canonical Regression / Documentation Integrity | All 14 canonical verification checks pass with exit code 0 (`clean`, `lint`, `prisma validate`, `typecheck`, `build`, `test`, `test:unit`, `test:db`, `test:redis`, `guard:persistence`, `guard:migration`, `guard:boundary`, `guard:audit-governance`, `guard:seed-safety`), with zero unapproved skips and complete synchronization across specification and governance files. | Verification Suite |

---

## 2. Critical Hard Gates Definition

### Gate 1: Server-Authoritative Progression (AC-007)
Clients have zero capability to author, override, or supply completion flags, percentage calculations, or completion timestamps. All progression is derived deterministically server-side from PostgreSQL state.

### Gate 2: Pre-Submission Secrecy Regression (AC-018)
No progression endpoint or DTO projection may include question answer options, correct option IDs, explanations, attempt scores, or evaluation snapshots. Progression endpoints return strictly progression metadata.

### Gate 3: Assessment Integrity Guard (AC-009)
Any attempt to manually complete a lesson that contains an active published quiz via `POST .../complete` MUST be blocked by the server with HTTP `400 QUIZ_COMPLETION_REQUIRED`. Client-side hiding of the completion button is insufficient; server enforcement is mandatory.

---

## 3. Aura Error Contract Compliance

All learner-facing error responses conform strictly to standard Aura error semantics:

| HTTP Status | Error Code | Description / Context |
|---|---|---|
| **400** | `VALIDATION_ERROR` | Request body contains unrecognized fields, invalid parameters, or client-asserted progress values. |
| **400** | `QUIZ_COMPLETION_REQUIRED` | Attempted manual completion of a lesson that contains an active `PUBLISHED` quiz. |
| **401** | `UNAUTHENTICATED` | Missing, invalid, or expired JWT bearer token. |
| **404** | `NOT_FOUND` | Course or lesson slug does not exist, is in `DRAFT`/`ARCHIVED` state, or does not belong to the requested hierarchy. Generic message: `"Resource not found"`. |
| **500** | `INTERNAL_ERROR` | Unexpected internal server error or unhandled transaction rollback. |

*Note*: Disallowed legacy codes `UNAUTHORIZED`, `COURSE_NOT_FOUND`, and `LESSON_NOT_FOUND` are removed from FEAT-026 contracts. Generic `NOT_FOUND` ("Resource not found") is mandatory.
