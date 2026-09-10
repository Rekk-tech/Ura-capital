# Tasks: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 - Academy  
**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Status**: NOT_STARTED  
**Human Planning Approval**: APPROVED  
**Unresolved Human Decisions**: ZERO  

---

## Task Matrix

| ID | Task | Dependencies | Acceptance Mapping |
| --- | --- | --- | --- |
| T001 | Read approved Human policy decisions and freeze FEAT-026 contracts before coding. | FEAT-026 Human planning approval | AC-020 |
| T002 | Add shared DTO/schema contracts for course progress, lesson progress, empty completion body, and `AcademyCompletionFact`. | T001 | AC-003, AC-007, AC-018, AC-019 |
| T003 | Extend Academy repository interfaces/factories for progress reads, progress writes, graded-attempt lookup, published lesson counts, and published quiz detection. | T002 | AC-002, AC-004, AC-005, AC-008, AC-010, AC-014, AC-017 |
| T004 | Implement FEAT-026 progression service with repository/UoW boundaries and no direct Prisma in controllers. | T003 | AC-002, AC-007, AC-017, AC-020 |
| T005 | Implement post-grade `reconcileProgressFromGradedAttempt(...)` integration while preserving FEAT-025 grading transaction ownership. | T004 | AC-004, AC-005, AC-006, AC-015, AC-016, AC-019 |
| T006 | Implement informational lesson completion endpoint and quiz-lesson completion guard. | T004 | AC-001, AC-003, AC-008, AC-009, AC-015 |
| T007 | Implement authenticated course progress read endpoint with historical/current curriculum semantics. | T004 | AC-001, AC-002, AC-010, AC-011, AC-012, AC-013, AC-014, AC-018 |
| T008 | Update learner frontend progress presentation without XP/reward UI or client-authoritative calculations. | T007 | AC-007, AC-011, AC-012, AC-013, AC-018 |
| T009 | Add unit/integration tests for validation, policy behavior, DTO secrecy, and FEAT-025 regression. | T005, T006, T007 | AC-001 through AC-015, AC-018, AC-019 |
| T010 | Add live PostgreSQL tests for concurrency, idempotency, rollback, constraints, and retry convergence. | T005, T006, T007 | AC-016, AC-017 |
| T011 | Run canonical validation suite, update progress tracker, and write implementation report. | T009, T010 | AC-020 |

## Coverage Rules

- Every AC-001 through AC-020 must have implementation and test ownership.
- No task may introduce XP/reward mutation, product audit persistence, Redis durable state, quiz scoring logic, or FEAT-027 behavior.
- If a migration becomes necessary because implementation discovers contradictory schema evidence, implementation must stop for explicit migration approval before T003 proceeds.
