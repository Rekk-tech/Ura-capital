# Plan: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 - Academy  
**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Owner**: Codex  
**Implementation Status**: NOT_STARTED  
**Human Planning Approval**: APPROVED  
**Unresolved Human Decisions**: ZERO  

---

## 1. Implementation Strategy

Implement FEAT-026 as a narrow progression feature layered on top of approved Academy persistence and FEAT-025 grading.

Human planning approval is recorded. Antigravity / DEV-A may implement FEAT-026 exactly as specified; application implementation has not started in this approval step.

## 2. Dependency Order

1. FEAT-020 course/lesson read APIs.
2. FEAT-024 attempt lifecycle and ownership.
3. FEAT-025 grading and `GRADED` pass/fail persistence.
4. FEAT-026 progression.
5. FEAT-027 XP/reward ledger remains blocked until FEAT-026 passes its internal quality gate.

## 3. Migration Plan

Human-approved decision: ZERO production migration.

Rationale:

- Existing progress tables support durable lesson/course progress.
- Unique constraints protect one progress row per user/resource.
- Existing status/timestamp CHECK constraints enforce coherence.
- FEAT-026 can derive current progress percentage at read time.

If implementation discovers contradictory schema evidence requiring new persisted attributes, implementation must stop and request explicit migration approval.

## 4. Service Design

Add or extend Academy progression service boundaries to support:

- `getCourseProgressForCurrentUser(courseSlug, userId)`
- `completeInformationalLesson(courseSlug, lessonSlug, userId)`
- `reconcileProgressFromGradedAttempt(attemptId, userId)`

Services must depend on repository interfaces and the transaction runner, not Prisma delegates.

## 5. Repository Design

Repository methods should provide:

- find published course and lesson by slug and hierarchy
- find published quiz for lesson
- read existing lesson/course progress
- idempotently create or update lesson/course progress
- count currently published lessons
- count completed published lessons for a user
- read FEAT-025 graded attempt state safely

Transaction-scoped repositories must use FEAT-013 conventions.

## 6. Transaction Plan

FEAT-026 transaction boundaries:

- one transaction for manual lesson completion and course rollup;
- one transaction for post-grade reconciliation and course rollup;
- rollback all FEAT-026 progress changes on forced failure;
- never nest or silently create second Prisma transaction inside an active UoW.

FEAT-025 grading transaction remains separate.

## 7. Concurrency Plan

Use PostgreSQL uniqueness plus transaction logic to ensure:

- one progress row per user/lesson;
- one progress row per user/course;
- first `completedAt` timestamp is preserved;
- exactly one first-completion fact per user/resource under concurrent calls;
- duplicate conflicts are handled safely without leaking raw database errors.

## 8. API Plan

Add authenticated endpoints:

- `GET /api/academy/courses/:courseSlug/progress`
- `POST /api/academy/courses/:courseSlug/lessons/:lessonSlug/complete`

No public role escalation, admin authoring, XP, reward, or audit APIs are introduced.

## 9. Frontend Plan

Update learner-facing Academy UI to present:

- current course progress percentage;
- lesson completion markers;
- informational lesson completion action;
- historical completion status where relevant.

Frontend must not compute authoritative progress or expose XP/reward UI for FEAT-026.

## 10. Testing Plan

Required tests:

- auth and ownership integration tests;
- strict validation tests;
- passing/failing quiz progression tests;
- informational lesson completion tests;
- quiz lesson manual completion rejection tests;
- zero published lesson tests;
- new lesson after historical completion tests;
- archived lesson denominator tests;
- concurrency/idempotency PostgreSQL tests;
- retry after reconciliation failure tests;
- DTO secrecy sentinel tests;
- zero XP/reward/audit/Redis mutation tests;
- frontend progress presentation tests;
- full regression FEAT-019 through FEAT-025.

## 11. Governance Plan

Antigravity implementation report must be written to:

```text
reports/implementation/phase-4/FEAT-026.md
```

Codex QA report must be written to:

```text
reports/qa/phase-4/FEAT-026-QA.md
```

The progress tracker must remain:

- FEAT-026: implemented/ready for QA only after mandatory validation actually passes;
- FEAT-027: blocked until FEAT-026 internal quality gate passes;
- Phase 4: IN_PROGRESS.

## 12. Human Decisions

All eight FEAT-026 product policies are Human approved. Unresolved Human decisions: ZERO.
