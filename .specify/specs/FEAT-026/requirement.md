# Requirement: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 - Academy  
**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Owner**: Codex  
**Implementation Owner After Approval**: Antigravity / DEV-A  
**Implementation Status**: NOT_STARTED  
**Human Planning Approval**: APPROVED  
**Unresolved Human Decisions**: ZERO  
**FEAT-027**: BLOCKED by FEAT-026  

---

## 1. Preconditions

Human-provided precondition evidence is accepted for planning:

- FEAT-025: DONE
- FEAT-025 Internal Feature Gate: PASS
- Git checkpoint: PUBLISHED
- Checkpoint commit: `86f556aabd91eee376a9f138494d61156eaf5735`
- Tag: `feat-025-approved`
- GitHub Actions: GREEN / SUCCESS
- CI Run: `#3448694958`
- Migration history: VERIFIED & REPRODUCIBLE, 7 migrations
- FEAT-026 application changes before planning: ZERO

FEAT-026 planning is Human approved. Implementation is authorized for Antigravity / DEV-A and has not started.

## 2. Feature Goal

FEAT-026 establishes server-authoritative Academy lesson and course progression for the authenticated learner. It consumes FEAT-025 durable quiz grading results and produces durable PostgreSQL progress facts for FEAT-027 reward processing.

## 3. In Scope

- Authenticated learner progress read API.
- Informational lesson completion API.
- Lesson progress persistence using `AcademyUserLessonProgress`.
- Course progress persistence using `AcademyUserCourseProgress`.
- Post-grade progress reconciliation from FEAT-025 `GRADED` quiz attempts.
- Course progress calculation against currently published lessons.
- Historical completion semantics distinct from current curriculum coverage.
- Internal completion fact contract for FEAT-027.
- Frontend learner progress presentation.
- PostgreSQL-backed idempotency, concurrency, rollback, and constraint tests.

## 4. Out of Scope

- XP calculation or mutation.
- `AcademyUserXp` writes.
- `AcademyRewardLedger` writes.
- Badge awards.
- Premium entitlement.
- Product audit persistence or event emission.
- Redis durable progress authority.
- Quiz evaluation, scoring, answer correctness, or attempt grading.
- Public/admin content authoring.
- FEAT-027 reward behavior.

## 5. Human-Approved Product Policies

Human approved the following baseline:

1. Passing the published quiz for a lesson automatically completes the lesson.
2. Lessons without a published quiz are completed only by explicit learner `POST .../complete`.
3. Lesson completion is monotonic: once completed, it is never downgraded.
4. Historical course completion is monotonic: once completed, it is never revoked.
5. Publishing a new lesson after course completion preserves historical completion while current coverage can fall below 100%.
6. Archived and draft lessons are excluded from the current progress denominator, while historical progress rows are preserved.
7. A course with zero published lessons reports `0 / 0 / 0%` and is not newly completed by calculation alone.
8. `progressPercent = Math.round((completedPublishedLessons / totalPublishedLessons) * 100)`, with zero denominator returning 0.

## 6. Core Requirements

### FR-001 Authentication
Progress endpoints MUST require a valid authenticated learner context.

### FR-002 Server-Derived User
All progress reads and writes MUST derive the learner from the server-authenticated principal. Client-supplied `userId` MUST be rejected or ignored without granting cross-user access.

### FR-003 Strict Request Validation
Manual lesson completion MUST accept an empty JSON object only. Client-submitted authoritative fields such as `progressPercent`, `completed`, `completedAt`, `status`, `score`, `passed`, `xp`, or `userId` MUST be rejected with `400 VALIDATION_ERROR`.

### FR-004 FEAT-025 Boundary Preservation
FEAT-025 remains the owner of quiz submission, evaluation, score, pass/fail, correctness snapshots, and `GRADED` finalization. FEAT-026 MUST NOT move progress writes into the FEAT-025 grading transaction.

### FR-005 Post-Grade Reconciliation
FEAT-026 MUST provide an idempotent internal reconciliation operation that consumes a durable FEAT-025 `GRADED` attempt. A passed attempt completes the lesson; a failed attempt does not complete an incomplete lesson and never revokes prior completion.

### FR-006 Failure and Retry
If FEAT-025 grading commits but FEAT-026 reconciliation fails, the `GRADED` attempt remains durable. The progress transaction MUST roll back cleanly and a later retry MUST converge without duplicate facts or corrupted progress.

### FR-007 Informational Lesson Completion
`POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete` completes published lessons with no published quiz and rejects lessons with a published quiz using `400 QUIZ_COMPLETION_REQUIRED`.

### FR-008 Historical vs Current Progress
FEAT-026 MUST separate historical completion (`status = COMPLETED`, `completedAt`) from current curriculum coverage (`completedLessons`, `totalLessons`, `progressPercent`). Consumers MUST NOT infer `completed === progressPercent === 100`.

### FR-009 Course Rollup
Completing all currently published lessons in a course MUST complete course progress. New or archived lessons MUST update current coverage without deleting historical facts.

### FR-010 PostgreSQL Authority
PostgreSQL is the durable authority for progression. Redis MUST NOT store durable progress, completion facts, quiz pass state, XP, reward ledger data, or correctness information.

### FR-011 Concurrency and Idempotency
Concurrent completion/reconciliation for the same user and resource MUST produce one progress row, preserve the first `completedAt`, and emit at most one first-completion fact.

### FR-012 Completion Fact Contract
FEAT-026 MUST define an internal, non-public `AcademyCompletionFact` for FEAT-027. Its deterministic identity is `userId + resourceType + resourceId`.

### FR-013 Secrecy and Safe Projection
Progress DTOs MUST NOT expose correct answers, selected correctness, explanations, score, pass/fail, XP, reward internals, Redis keys, or internal relation details.

### FR-014 Repository and UoW Boundaries
Implementation MUST use FEAT-013 repository and transaction conventions. Controllers MUST NOT import Prisma directly.

### FR-015 Migration Decision
Codex schema inspection finds existing progress tables and constraints sufficient for the approved FEAT-026 model. Human-approved migration decision: ZERO production migration. If implementation discovers contradictory schema evidence, it must stop for explicit Human review before adding migrations.

## 7. API Surface

Canonical approved APIs:

- `GET /api/academy/courses/:courseSlug/progress`
- `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete`

The read API returns safe current-user progress. The completion API is limited to informational lessons and accepts body `{}` only.

## 8. Error Contract

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Invalid body, extra fields, or client-authoritative progress input. |
| 400 | `QUIZ_COMPLETION_REQUIRED` | Manual completion attempted for a lesson with a published quiz. |
| 401 | `UNAUTHENTICATED` | Missing or invalid authentication. |
| 404 | `NOT_FOUND` | Course/lesson/attempt unavailable, unpublished, archived, or mismatched. Message: `Resource not found`. |
| 500 | `INTERNAL_ERROR` | Unexpected sanitized internal failure. |

Do not introduce `UNAUTHORIZED`, `COURSE_NOT_FOUND`, or `LESSON_NOT_FOUND`.

## 9. Acceptance Baseline

FEAT-026 uses exactly AC-001 through AC-020 as defined in `acceptance.md`. AC-007 and AC-018 are critical hard gates.
