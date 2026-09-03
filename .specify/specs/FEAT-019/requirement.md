# Requirement: FEAT-019 Academy Domain Schema & Persistence Foundation

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-019  
**Phase**: Phase 4 - Academy  
**Feature Type**: Implementation planning package  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex

## 1. Context

Phase 3 is DONE / QA PASS / Human Final Gate APPROVED. FEAT-019 is the first executable Phase 4 feature.

FEAT-019 establishes the Academy durable data foundation on the approved PostgreSQL/Prisma architecture. It must not implement learner-facing API behavior, frontend behavior, quiz evaluation, progression mutation, XP reward granting, product audit persistence, or content-management workflows.

## 2. Goal

Create the approved Academy schema and persistence boundary needed by later Phase 4 features.

The feature must define and implement durable models, migrations, repositories, repository factory integration, database constraints, isolated test fixtures, and validation evidence for Academy domain persistence.

## 3. Dependencies

- Phase 3 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-013 repository and Unit of Work pattern.
- FEAT-014 data constraint standards.
- FEAT-012 migration governance.
- FEAT-016 product audit governance.
- FEAT-017 seed safety and test fixture boundaries.
- Phase 2 authentication and PostgreSQL user authority.

## 4. In Scope

- Academy Prisma/PostgreSQL schema for the minimum durable foundation.
- Canonical models: AcademyCourse, AcademyLesson, AcademyFlashcard, AcademyQuiz, AcademyQuizQuestion, AcademyQuizOption, AcademyQuizAttempt, AcademyQuizAnswer, AcademyUserCourseProgress, AcademyUserLessonProgress, AcademyUserXp, and AcademyRewardLedger.
- Canonical Academy ownership model: Course -> Lesson -> Quiz, and Lesson -> Flashcard.
- Single-choice quiz schema baseline with server-only correct-answer persistence.
- Historical attempt and answer snapshot fields required to preserve graded attempt meaning.
- Durable reward idempotency semantics and XP authority model.
- Status enums and lifecycle fields required for future features.
- Foreign keys, uniqueness, ordering, indexes, timestamps, and deletion policies.
- Repository interfaces and Prisma implementations for Academy persistence.
- Repository factory integration compatible with root PrismaClient and transaction client.
- PostgreSQL-backed tests for migrations and constraints.
- No-answer-leakage persistence boundary checks.
- Implementation report at `reports/implementation/phase-4/FEAT-019.md`.

## 5. Out of Scope

FEAT-019 must not implement:

- Public Academy API endpoints.
- Frontend Academy UI.
- Course/lesson read behavior.
- Flashcard review behavior.
- Quiz safe projection behavior.
- Quiz attempt creation/submission behavior.
- Server-side answer evaluation.
- Progress percentage calculation.
- XP/reward granting behavior.
- Concrete product audit table or event emission.
- CMS/admin authoring APIs.
- Production content ingestion.
- Default Academy production seed data.
- Simulation, Community, Subscription, or AI behavior.

## 6. Functional Requirements

- **FR-001**: FEAT-019 MUST remain limited to Academy schema and persistence foundation.
- **FR-002**: FEAT-019 MUST introduce no public API route, frontend UI, or product behavior beyond persistence infrastructure.
- **FR-003**: Academy durable state MUST use PostgreSQL and Prisma migrations.
- **FR-004**: Prisma access MUST remain isolated behind repository implementations and approved infrastructure.
- **FR-005**: Controllers and ordinary services MUST NOT import Prisma or directly query Academy tables.
- **FR-006**: Academy repositories MUST support root and transaction-scoped clients through the approved repository factory/UoW pattern.
- **FR-007**: Schema MUST use UUID primary keys for durable Academy entities unless Human approves an exception.
- **FR-008**: Required durable fields MUST use database NOT NULL constraints.
- **FR-009**: Academy slugs and other durable uniqueness invariants MUST be enforced by PostgreSQL unique constraints.
- **FR-010**: Scoped ordering and pairing invariants MUST use composite unique constraints where applicable.
- **FR-011**: Relationships MUST use PostgreSQL foreign keys with explicit restrictive/no-action policy for parent/history relationships unless a narrower non-history exception is explicitly documented for QA review.
- **FR-012**: Application validation MUST NOT be treated as a replacement for PostgreSQL constraints.
- **FR-013**: AcademyQuiz MUST belong to exactly one AcademyLesson through a required lessonId foreign key; course ownership MUST be derived through the lesson and FEAT-019 MUST NOT use nullable courseId plus lessonId polymorphic quiz ownership.
- **FR-014**: Quiz attempt/progress/reward schema MUST support future server-authoritative evaluation and idempotent rewards.
- **FR-015**: AcademyFlashcard MUST belong to exactly one AcademyLesson through a required lessonId foreign key; course-level flashcard grouping MUST be derived through the lesson.
- **FR-016**: Redis MUST NOT be used as durable Academy state authority.
- **FR-017**: Academy seed/content data MUST NOT be embedded in migrations.
- **FR-018**: Test fixtures MUST be isolated to test databases and must not create production seed behavior.
- **FR-019**: Fresh migration validation MUST run against an isolated FEAT-019 PostgreSQL database.
- **FR-020**: Existing-schema upgrade validation MUST be a true Phase 3 -> FEAT-019 incremental migration test that creates a Phase 3 database, inserts representative Phase 2/3 rows, captures before state, applies the FEAT-019 Academy migration, captures after state, and verifies prior rows/constraints plus new Academy schema.
- **FR-021**: Migration guard, persistence guard, boundary guard, audit-governance guard, and seed-safety guard MUST remain green.
- **FR-022**: Implementation MUST not use `prisma db push` as migration governance.
- **FR-023**: Product audit persistence MUST remain deferred unless Human explicitly approves activation in a later Academy feature.
- **FR-024**: FEAT-019 MUST preserve FEAT-001 through FEAT-018 regression behavior.
- **FR-025**: Implementation report MUST map every task and acceptance criterion truthfully.
- **FR-026**: FEAT-019 MUST use explicit deterministic restrictive foreign-key delete policies for Academy parent/history relationships; draft-content deletion workflows are deferred and MUST NOT be modeled as conditional cascade behavior.
- **FR-027**: FEAT-019 MUST support only single-choice quiz questions as the baseline; multi-answer, free-text, ordering, timed, randomized, and adaptive question types are deferred.
- **FR-028**: Correct-answer persistence MUST be represented by server-only `AcademyQuizOption.isCorrect`, with PostgreSQL integrity enforcing exactly one correct option per single-choice question.
- **FR-029**: Correct-answer fields and snapshots MUST NOT be exposed through any FEAT-019 public route, DTO, log, report evidence, seed output, Redis key, or client-controlled surface.
- **FR-030**: Quiz attempts and answers MUST include immutable snapshot fields sufficient to preserve historical attempt meaning after future content changes; destructive quiz content changes after attempts exist MUST be restricted unless a later versioning/authoring feature explicitly changes the policy.
- **FR-031**: RewardLedger MUST be the durable reward source of truth and MUST enforce semantic PostgreSQL uniqueness on (userId, sourceType, sourceId, rewardType); if idempotencyKey is stored, it MUST be deterministically derived from that semantic tuple and globally unique.
- **FR-032**: AcademyUserXp MUST be one row per user with a non-negative integer or bigint totalXp protected by a database-backed constraint where practical; it is a transactionally maintained aggregate, not a second independent reward authority.
- **FR-033**: Course and lesson progress MUST store durable facts only: user ownership, course/lesson ownership, closed-set status, startedAt, and nullable completedAt; client-authoritative percentage fields are prohibited in FEAT-019.
- **FR-034**: Academy user-owned history tables MUST use restrictive/no-action User foreign keys so deleting a Phase 2 User cannot silently delete or corrupt Academy attempts, progress, XP, or rewards; anonymization or archival behavior is deferred to a later approved feature.
- **FR-035**: Phase 4 default boundary is learner-facing Academy only; FEAT-019 MUST NOT implement CMS/admin authoring, production content ingestion, default production Academy content, or public content-management APIs.

## 7. Human Decisions Required

1. Decide production content ingestion approach before learner read APIs need real content.
2. Decide public vs authenticated course catalog behavior in FEAT-020.
3. Decide quiz scoring and attempt retry policy in later quiz behavior features.

## 8. Status

APPROVED FOR IMPLEMENTATION.
