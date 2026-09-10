# Acceptance Criteria: FEAT-026 Academy Progression & Completion Tracking

**Feature ID**: FEAT-026  
**Phase**: Phase 4 - Academy  
**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Owner**: Codex  
**Implementation Status**: NOT_STARTED  
**Human Planning Approval**: APPROVED  
**Unresolved Human Decisions**: ZERO  

---

## Canonical AC Matrix

| ID | Category | Acceptance Criterion | Verification |
| --- | --- | --- | --- |
| AC-001 | Authentication | Unauthenticated access to progress endpoints returns `401 UNAUTHENTICATED`. | Integration |
| AC-002 | Ownership | Progress reads and writes derive user identity from the authenticated server context. Client-supplied `userId` cannot access or mutate another learner's progress. | Integration |
| AC-003 | Validation | `POST .../complete` accepts `{}` only. Extra fields or client-authoritative fields such as `completed`, `status`, `completedAt`, `progressPercent`, `score`, `passed`, `xp`, or `userId` return `400 VALIDATION_ERROR`. | Unit, Integration |
| AC-004 | Passing Quiz Progression | A FEAT-025 `GRADED` attempt with `passed = true` reconciles lesson progress to `COMPLETED` with non-null `completedAt`. | Integration, PostgreSQL |
| AC-005 | Failed Quiz No Completion | A FEAT-025 `GRADED` attempt with `passed = false` does not complete an incomplete lesson. | Integration |
| AC-006 | Failed Retake No Revocation | A failed retake never revokes existing lesson completion and preserves the original `completedAt`. | Integration |
| AC-007 | Server Authority | CRITICAL HARD GATE: progress state, counts, percentages, completion flags, and timestamps are server-derived from PostgreSQL; client calculations are not trusted. | Integration, Security |
| AC-008 | Informational Completion | A published lesson with no published quiz can be completed idempotently through the explicit completion endpoint. | Integration |
| AC-009 | Quiz Completion Guard | A lesson with a published quiz cannot be manually completed; the server returns `400 QUIZ_COMPLETION_REQUIRED`. | Integration |
| AC-010 | Course Rollup | Completing all active published lessons completes course progress with non-null `completedAt`. | Integration, PostgreSQL |
| AC-011 | Percentage Formula | `progressPercent` equals `Math.round((completedPublishedLessons / totalPublishedLessons) * 100)` and returns 0 when denominator is 0. | Unit, Integration |
| AC-012 | Zero Published Lessons | A course with zero published lessons returns `completedLessons = 0`, `totalLessons = 0`, `progressPercent = 0`, and does not become newly completed by calculation alone. | Unit, Integration |
| AC-013 | Historical Completion | Historical course completion is monotonic and can remain true while current coverage falls below 100% after new lessons are published. | Integration |
| AC-014 | Draft/Archived Exclusion | Draft and archived lessons are excluded from current progress denominator; historical progress rows are preserved. | Integration |
| AC-015 | Idempotency | Repeated completion or reconciliation returns safely without overwriting original `completedAt` or duplicating progress rows. | Integration |
| AC-016 | Concurrency | Concurrent completion/reconciliation for the same user/resource creates one row, preserves the first timestamp, emits at most one first-completion fact, and does not leak duplicate-key errors. | Live PostgreSQL |
| AC-017 | PostgreSQL Integrity | Progress writes satisfy unique, FK, and status/timestamp CHECK constraints. Forced failure rolls back the full FEAT-026 progress transaction. | Live PostgreSQL |
| AC-018 | Secrecy Regression | CRITICAL HARD GATE: progress endpoints and DTOs expose no answer keys, correct option IDs, correctness snapshots, explanations, score, passed state, XP, or reward internals. | Security, Integration |
| AC-019 | Completion Fact / No Side Effects | FEAT-026 returns internal `AcademyCompletionFact` with deterministic identity and performs zero writes to XP, reward ledger, product audit, or Redis durable progress state. | Unit, Integration |
| AC-020 | Regression and Governance | Canonical validation suite passes with no mandatory skips; docs, tracker, implementation report, and task traceability remain synchronized. | Verification Suite |

## Critical Hard Gates

- AC-007 Server-Authoritative Progression.
- AC-018 Progress/Quiz Correctness Secrecy Regression.

Any failure of a critical hard gate is an automatic FAIL.

## Canonical Validation Suite

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```

Mandatory validation skipped because of unavailable PostgreSQL/Redis cannot be recorded as PASS.
