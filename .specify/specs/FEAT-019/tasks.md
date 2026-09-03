# Tasks: FEAT-019 Academy Domain Schema & Persistence Foundation

**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Rule**: Implement only FEAT-019 after Human approval. Do not start FEAT-020.

| ID | Task | Requirement Mapping | Acceptance Mapping | Status |
| --- | --- | --- | --- | --- |
| T001 | Read workflow, tracker, Phase 4 decomposition, ADR-003, ADR-005, FEAT-013, FEAT-014, FEAT-016, FEAT-017, and FEAT-018 artifacts. | FR-001, FR-024 | AC-001, AC-030 | [x] COMPLETE |
| T002 | Confirm implementation scope excludes APIs, UI, quiz evaluation, progression mutation, reward granting, CMS, production content seed, product audit persistence, and Phase 5 behavior. | FR-001, FR-002, FR-023 | AC-001, AC-002, AC-028 | [x] COMPLETE |
| T003 | Design canonical Academy Prisma models and enums for AcademyCourse, AcademyLesson, AcademyFlashcard, AcademyQuiz, AcademyQuizQuestion, AcademyQuizOption, AcademyQuizAttempt, AcademyQuizAnswer, AcademyUserCourseProgress, AcademyUserLessonProgress, AcademyUserXp, and AcademyRewardLedger. | FR-003, FR-007, FR-013, FR-014, FR-015, FR-027 | AC-003, AC-004, AC-034, AC-035, AC-036 | [x] COMPLETE |
| T004 | Define explicit relationship cardinalities and deterministic restrictive/no-action delete policies. | FR-011, FR-026, FR-034 | AC-010, AC-011, AC-039, AC-042 | [x] COMPLETE |
| T005 | Add forward-only Prisma migration with no seed/content data and no destructive changes to approved Phase 2/3 tables. | FR-017, FR-019, FR-020, FR-022 | AC-016, AC-017, AC-018, AC-020 | [x] COMPLETE |
| T006 | Add unique constraints for course slug, ordered children, answer uniqueness, progress uniqueness, user XP, semantic reward idempotency, and optional idempotencyKey. | FR-009, FR-010, FR-031, FR-032, FR-033 | AC-006, AC-007, AC-008, AC-009, AC-014, AC-040, AC-041 | [x] COMPLETE |
| T007 | Add foreign keys and indexes for Lesson-owned quiz/flashcard ownership, ordering, joins, authorization lookups, history preservation, and future read models. | FR-011, FR-013, FR-015, FR-034 | AC-010, AC-012, AC-034, AC-035, AC-042 | [x] COMPLETE |
| T008 | Implement Academy repository interfaces and Prisma-backed implementations in approved locations. | FR-004, FR-006 | AC-021, AC-022 | [x] COMPLETE |
| T009 | Integrate Academy repositories with the repository factory for root and transaction-scoped clients. | FR-006 | AC-022, AC-023 | [x] COMPLETE |
| T010 | Add source/boundary checks proving controllers and ordinary services do not import Prisma or query Academy tables directly. | FR-005 | AC-024 | [x] COMPLETE |
| T011 | Add `AcademyQuizOption.isCorrect` and no-answer-leakage checks for schema-to-public-surface boundaries, logs, report evidence, Redis keys, and client-controlled surfaces. | FR-028, FR-029 | AC-025, AC-037 | [x] COMPLETE |
| T012 | Add PostgreSQL-backed constraint tests for required fields, unique constraints, composite unique constraints, FK violations, delete policies, reward idempotency uniqueness, exact-one-correct-option integrity, non-negative XP, and restrictive user deletion behavior. | FR-008, FR-009, FR-010, FR-011, FR-026, FR-028, FR-031, FR-032, FR-034 | AC-005, AC-006, AC-007, AC-008, AC-010, AC-011, AC-014, AC-037, AC-040, AC-042 | [x] COMPLETE |
| T013 | Add repository tests proving root and transaction-scoped usage. | FR-006 | AC-022, AC-023 | [x] COMPLETE |
| T014 | Validate fresh zero-state migration on an isolated FEAT-019 database. | FR-019 | AC-016 | [x] COMPLETE |
| T015 | Validate true Phase 3 to FEAT-019 incremental migration with representative Phase 2/3 rows preserved and Academy schema created. | FR-020 | AC-017 | [x] COMPLETE |
| T016 | Run migration governance checks and confirm no `prisma db push` usage. | FR-021, FR-022 | AC-018, AC-029 | [x] COMPLETE |
| T017 | Run persistence, boundary, audit-governance, and seed-safety guards. | FR-021, FR-023 | AC-024, AC-027, AC-028, AC-029 | [x] COMPLETE |
| T018 | Verify Redis remains unused as durable Academy authority. | FR-016 | AC-026 | [x] COMPLETE |
| T019 | Run full validation suite from repository root and record actual counts. | FR-024, FR-025 | AC-030, AC-031 | [x] COMPLETE |
| T020 | Add schema/source checks proving no CMS/admin authoring, production content ingestion, default production Academy content, or content-management API is introduced. | FR-002, FR-035 | AC-001, AC-002 | [x] COMPLETE |
| T021 | Verify attempt/answer snapshot fields preserve historical attempt meaning without implementing quiz evaluation behavior. | FR-030 | AC-015, AC-038, AC-039 | [x] COMPLETE |
| T022 | Verify progress schema stores durable facts only and excludes client-authoritative percentage fields. | FR-033 | AC-009, AC-041 | [x] COMPLETE |
| T023 | Verify RewardLedger is the source of truth and AcademyUserXp is a transactionally maintained aggregate, not competing authority. | FR-031, FR-032 | AC-014, AC-040 | [x] COMPLETE |
| T024 | Create `reports/implementation/phase-4/FEAT-019.md` with file changes, migration evidence, tests, constraints, risks, and exact AC-001..AC-042 mapping. | FR-025 | AC-032 | [x] COMPLETE |
| T025 | Update `docs/progress-tracker.md` to show FEAT-019 implemented/ready for QA only after mandatory validation passes. | FR-025 | AC-033 | [x] COMPLETE |

## Validation Commands

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```

## Prohibited Work

- Do not implement FEAT-020 APIs.
- Do not implement frontend UI.
- Do not implement quiz evaluation, progress mutation, or XP reward granting.
- Do not create CMS/admin authoring endpoints.
- Do not create product audit persistence.
- Do not use Redis as durable Academy authority.
- Do not embed Academy seed/content rows in migrations.
