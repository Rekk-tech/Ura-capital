# Specification: FEAT-019 Academy Domain Schema & Persistence Foundation

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-019  
**Phase**: Phase 4 - Academy

## 1. User Stories

### Story 1 - Academy Persistence Foundation

As a platform owner, I need Academy durable models and constraints established on PostgreSQL so later course, lesson, flashcard, quiz, progress, and reward features can build on production-grade persistence.

**Independent Test**: Apply migrations to a fresh isolated PostgreSQL database and verify Academy tables, keys, relationships, constraints, and indexes exist as specified.

### Story 2 - Secure Quiz Data Foundation

As a learner, I need quiz answers to remain server-side so that quiz results are earned through submission and evaluation, not leaked in advance.

**Independent Test**: Review schema/repository/API surface and verify FEAT-019 exposes no public route or DTO that can return correct-answer fields before submission.

### Story 3 - Idempotent Reward Readiness

As an engineer, I need reward and progression persistence to support idempotent future writes so retries cannot duplicate XP.

**Independent Test**: Verify AcademyRewardLedger has scoped semantic uniqueness and can participate in Unit of Work transactions.

## 2. Domain Model

Canonical planned models:

- `AcademyCourse`
- `AcademyLesson`
- `AcademyFlashcard`
- `AcademyQuiz`
- `AcademyQuizQuestion`
- `AcademyQuizOption`
- `AcademyQuizAttempt`
- `AcademyQuizAnswer`
- `AcademyUserCourseProgress`
- `AcademyUserLessonProgress`
- `AcademyUserXp`
- `AcademyRewardLedger`

## 3. Core Relationships

- Course has many Lessons.
- Lesson belongs to exactly one Course through required `courseId`.
- Lesson has many Flashcards.
- Flashcard belongs to exactly one Lesson through required `lessonId`; course grouping is derived through Lesson.
- Lesson has many Quizzes.
- Quiz belongs to exactly one Lesson through required `lessonId`; course ownership is derived through Lesson.
- Quiz has many QuizQuestions.
- QuizQuestion has many QuizOptions where applicable.
- User has many QuizAttempts.
- QuizAttempt belongs to User and Quiz.
- QuizAttempt has many QuizAnswers.
- User has one XP aggregate.
- RewardLedger belongs to User and records one durable idempotent reward event.

## 4. Status Enums

Required closed-set status values:

- Course: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- Lesson: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- Quiz: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- QuizAttempt: `CREATED`, `IN_PROGRESS`, `SUBMITTED`, `GRADED`
- Progress: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`
- RewardLedger: `PENDING`, `APPLIED`, `REVERSED`

Status transitions are owned by later behavior features. FEAT-019 only creates the durable closed-set representation.

Question type baseline:

- FEAT-019 supports `SINGLE_CHOICE` quiz questions only.
- Multiple-answer, free-text, ordering, timed, randomized, adaptive, and manually graded question types are deferred.
- If a question type enum is introduced, it must contain only the approved baseline unless a later feature expands it.

## 5. Constraint Standards

Required constraints:

- UUID primary key on every durable Academy table.
- Unique `AcademyCourse.slug`.
- Unique lesson order within course.
- Unique question order within quiz.
- Unique option order within question.
- Unique quiz attempt answer per attempt/question.
- Unique user/course progress row.
- Unique user/lesson progress row.
- Unique user XP aggregate.
- Unique reward semantic tuple: `(userId, sourceType, sourceId, rewardType)`.
- Optional `idempotencyKey`, if stored, must be deterministically derived from the semantic tuple and globally unique.
- Required FK ownership and parent relationships.
- Explicit delete policies for each relationship.
- Non-negative XP aggregate enforced by PostgreSQL where practical.

Application validation complements these rules but does not replace PostgreSQL constraints.

## 6. Delete Policy

FEAT-019 must use deterministic FK delete behavior. Conditional cascade based on draft/history state is deferred to a future CMS/content-management feature.

| Parent | Dependent Academy Records | FEAT-019 Policy |
| --- | --- | --- |
| AcademyCourse | Lessons, course progress, derived quiz/reward history | RESTRICT / NO ACTION |
| AcademyLesson | Flashcards, quizzes, lesson progress, derived attempt/reward history | RESTRICT / NO ACTION |
| AcademyQuiz | Questions and quiz attempts | RESTRICT / NO ACTION |
| AcademyQuizQuestion | Options and attempt answers | RESTRICT / NO ACTION |
| AcademyQuizOption | Selected/correct option history | RESTRICT / NO ACTION |
| User | Attempts, progress, XP aggregate, reward ledger | RESTRICT / NO ACTION |

No cascade is approved for Academy production schema in FEAT-019 unless the implementation proves the row is purely dependent, cannot contain learner/history meaning, and is explicitly called out in the implementation report for QA review. Destructive content deletion workflows remain out of scope.

No global soft-delete convention is introduced.

## 7. Repository Boundary

FEAT-019 must add Academy repository interfaces and implementations only where needed for persistence tests and future features.

Allowed:

- Repository interfaces.
- Prisma repository implementations.
- Repository factory integration.
- Transaction context / Unit of Work usage.
- Test-only helpers.

Prohibited:

- Direct Prisma imports in controllers.
- Direct Prisma delegate queries in ordinary services.
- Generic mega-repository.
- Raw SQL outside approved migration/test/infrastructure boundaries.

## 8. Quiz Answer Security

FEAT-019 answer model:

- Baseline quiz question type is single-choice.
- Correct answer is represented on `AcademyQuizOption` by the required server-only boolean field `isCorrect`.
- PostgreSQL must enforce exactly one correct option per single-choice question by a deferrable constraint trigger, partial unique index plus complementary invariant, or another explicitly documented database-backed mechanism.
- Must not appear in safe pre-submission projection contracts.
- Must not be returned by any FEAT-019 API because FEAT-019 must not add public Academy APIs.
- Must not be logged or included in reports as learner-visible answer keys.

Later FEAT-023/FEAT-025 will define safe quiz projection and post-submission result behavior.

## 8A. Attempt Snapshot Integrity

FEAT-019 must preserve historical attempt meaning even if future content lifecycle features edit titles, prompts, or option text.

Minimum schema capability:

- `AcademyQuizAttempt` stores immutable quiz-attempt snapshot fields such as quiz title/version labels needed for history.
- `AcademyQuizAnswer` stores immutable submitted-answer snapshot fields such as question prompt snapshot, selected option snapshot, correct option identity/value snapshot, and correctness snapshot where needed by future grading.
- Live Question/Option foreign keys may remain for traceability, but attempt history must not depend only on mutable live content.
- Deleting or destructively changing quiz content after attempts exist is restricted until a later authoring/versioning feature explicitly defines a replacement policy.

FEAT-019 does not implement evaluation behavior. It only ensures the persistence model can safely support future server-side evaluation and durable historical results.

## 9. Transaction Readiness

Schema/repositories must support future atomic operations:

- Quiz attempt creation.
- Quiz submission and answer persistence.
- Attempt finalization.
- Progress mutation.
- XP/reward ledger mutation.
- Optional transactionally coupled product audit if later approved.

FEAT-019 must prove repository factory compatibility with root and transaction clients.

## 9A. Progress And XP Authority

Progress rows store durable facts, not client-authoritative percentages.

Course progress minimum:

- `userId`
- `courseId`
- `status`
- `startedAt`
- nullable `completedAt`
- unique `(userId, courseId)`

Lesson progress minimum:

- `userId`
- `lessonId`
- `status`
- `startedAt`
- nullable `completedAt`
- unique `(userId, lessonId)`

`completedAt` must be null unless status is `COMPLETED`; when status is `COMPLETED`, later behavior features must set it server-side. FEAT-019 must define the durable shape and database-backed invariant where practical.

Derived percentages are deferred until FEAT-026 defines server calculation semantics.

XP model:

- `AcademyRewardLedger` is the immutable/idempotent source of truth for reward history.
- `AcademyUserXp` is one row per user and a transactionally maintained materialized aggregate.
- `AcademyUserXp.totalXp` must be an integer or bigint and must be non-negative through database-backed constraint where practical.
- FEAT-019 creates schema readiness only; reward granting behavior belongs to FEAT-027.

## 10. Redis Boundary

Redis is not needed for FEAT-019.

If implementation touches Redis unexpectedly, it must stop for Human/Codex review.

## 11. Product Audit Boundary

FEAT-019 must not create product audit tables or Academy audit event emission.

It may document future candidate audit events but must preserve FEAT-016 activation criteria and must not use `AuthSecurityAuditRecord`.

## 12. Migration Strategy

Implementation must:

- Create Prisma migration(s) for Academy schema.
- Run `prisma migrate deploy`.
- Run `prisma migrate status`.
- Run `prisma validate`.
- Run migration guard.
- Prove fresh zero-state migration.
- Prove true Phase 3 -> FEAT-019 incremental upgrade:
  1. create an isolated database at approved Phase 3 migration state,
  2. insert representative Phase 2/3 rows,
  3. capture before row counts, IDs, relationships, and constraints,
  4. apply the FEAT-019 Academy migration,
  5. capture after state,
  6. verify Phase 2/3 rows and constraints are unchanged,
  7. verify Academy schema was created correctly.
- Avoid `prisma db push`.
- Avoid seed data in migrations.
- Avoid destructive migration unless Human explicitly approves.

## 13. Test Strategy

Required:

- Unit tests for repository factory or mapping logic where applicable.
- PostgreSQL-backed schema/constraint tests.
- Migration validation tests/evidence.
- Boundary guard regression.
- Persistence guard regression.
- Audit-governance guard regression.
- Seed-safety guard regression.
- No-answer-leakage source/API surface review.
- FEAT-001 through FEAT-018 regression suite as practical.

## 14. Success Criteria

FEAT-019 succeeds when Academy persistence foundation is implemented, migration-safe, constraint-backed, repository-isolated, testable, and ready for FEAT-020 without adding Academy behavior prematurely.
