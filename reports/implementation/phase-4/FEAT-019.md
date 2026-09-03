# Implementation Report: FEAT-019 — Academy Persistence Foundation

**Feature**: FEAT-019 Academy Domain Schema & Persistence Foundation  
**Phase**: Phase 4 — Product Foundation & Academy MVP  
**Status**: `DONE`  
**QA History**:  
- QA Iteration 1: `FAIL` (DEF-001 through DEF-006 identified by Codex QA)  
- Rework Iteration 1: `COMPLETE` (DEF-001 through DEF-006 resolved and verified)  
- QA Iteration 2: `FAIL` (DEF-007 through DEF-011 identified by Codex QA)  
- Rework Iteration 2: `COMPLETE` (DEF-007 through DEF-011 resolved and verified)  
- QA Iteration 3: `Emergency QA Execution` — Antigravity (`EVIDENCE COMPLETE — NO BLOCKER OBSERVED`)  
- Human Dual Review: `APPROVED`  
**Human Final Gate**: `APPROVED`  
**Downstream Dependency**: FEAT-020 `UNBLOCKED FOR PLANNING` (Implementation: `NOT_STARTED`)  
**Date**: 2026-09-03  
**Migration ID**: `20260903000000_feat019_academy_foundation`


---

## 1. Executive Summary & Defect Resolutions

FEAT-019 establishes the canonical PostgreSQL database schema and persistence foundation for the Academy product domain. In strict compliance with the approved FEAT-019 specification, Phase 4 decomposition, and Codex QA Iteration 1 & 2 findings, Rework Iteration 2 has addressed all identified defects:

### Defect Closure Matrix

| Defect | Issue Identified | Resolution Implemented | Database Invariant / Verification |
| --- | --- | --- | --- |
| **DEF-001** | Partial unique index only enforced $\le 1$ correct option, allowing questions with 0 correct options | Implemented PostgreSQL-backed deferred constraint triggers (`trg_academy_quiz_options_exactly_one_correct` and `trg_academy_quiz_questions_has_correct_option`) + partial unique index (`academy_quiz_options_one_correct_per_question`) | Rejects 0 correct options and $\ge 2$ correct options on commit; allows transactional authoring and safe cascade question deletions |
| **DEF-002** | Status and type columns lacked PostgreSQL `CHECK` constraints (depended on app layer) | Added 10 PostgreSQL `CHECK` constraints on Course, Lesson, Quiz, QuizQuestion, QuizAttempt, CourseProgress, LessonProgress, RewardLedger status/source/reward fields | Rejects unapproved status/type values directly at PostgreSQL engine level |
| **DEF-003 & DEF-007** | Answer could select options belonging to another question (DEF-003) or reference questions from a different quiz than the attempt (DEF-007) | Persisted `quizId` on `AcademyQuizAnswer` with composite FKs `(attemptId, quizId)` $\rightarrow$ `AcademyQuizAttempt(id, quizId)`, `(questionId, quizId)` $\rightarrow$ `AcademyQuizQuestion(id, quizId)`, and `(selectedOptionId, questionId)` $\rightarrow$ `AcademyQuizOption(id, questionId)` with `onDelete: Restrict` | PostgreSQL enforces complete relational chain `Attempt -> Quiz -> Question -> Option` with mathematical certainty |
| **DEF-004** | Attempt sequencing lacked `attemptNumber` and unique scoped sequence | Added `attemptNumber` (`Int @default(1) @map("attempt_number")`, `CHECK ("attempt_number" >= 1)`), and unique constraint `@@unique([quizId, userId, attemptNumber])` on `AcademyQuizAttempt` | Rejects duplicate attempt numbers per (quiz, user) tuple and enforces $\ge 1$ |
| **DEF-005** | Course and Lesson progress allowed invalid status/timestamp combinations | Added PostgreSQL `CHECK` constraints: `(status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL)` | Prevents uncompleted rows with `completed_at` timestamps or completed rows without timestamps |
| **DEF-006** | Implementation report had schema field naming divergences | Fully rewritten [`reports/implementation/phase-4/FEAT-019.md`](file:///d:/project/ura-capital/reports/implementation/phase-4/FEAT-019.md) using exact schema fields and AC-001..AC-042 mappings from `acceptance.md` | 100% truthful documentation reflecting active codebase |
| **DEF-008** | `cleanAllTestTables` helper in `test-db-guard.ts` used explicit `any` failing ESLint | Replaced `any` with strongly typed structural interface `TestCleanupClient` | `npm run lint` passes with 0 errors |
| **DEF-009** | Redis health readiness integration test suffered timing/race failure on ephemeral key expiry | Updated `redis-health-readiness.test.ts` to use isolated unique test key and deterministic polling with bounded timeout | `npm run test:redis` passes 5 files / 50 tests with 0 failures |
| **DEF-010** | Active Phase 4 decomposition status header was stale | Updated `docs/phase-4-feature-decomposition.md` and `docs/progress-tracker.md` to reflect current active lifecycle state and tagged historical planning text | Governance state is 100% synchronized across all artifacts |
| **DEF-011** | Root `createQuestion` committed immediately and failed DB deferred trigger without options | Added `createQuestionWithOptions` to `IAcademyQuizRepository` / `PrismaAcademyQuizRepository` as the canonical persistence operation executing question + options in one Unit of Work | Valid single-choice question creation workflow is obvious and verified |

---

## 2. Canonical Schema & Models Implemented

All 12 approved domain models are implemented in `apps/api/prisma/schema.prisma` using actual active schema field names:

1. **`AcademyCourse`**: Root course entity (`id`, `slug`, `title`, `description`, `level`, `status`, `order`, `createdAt`, `updatedAt`).
2. **`AcademyLesson`**: Ordered module unit within a course (`id`, `courseId`, `title`, `slug`, `content`, `order`, `status`, `createdAt`, `updatedAt`).
3. **`AcademyFlashcard`**: Lesson-owned study cards (`id`, `lessonId`, `front`, `back`, `order`, `createdAt`, `updatedAt`).
4. **`AcademyQuiz`**: Lesson-owned assessment configuration (`id`, `lessonId`, `title`, `description`, `status`, `order`, `passingScore`, `createdAt`, `updatedAt`).
5. **`AcademyQuizQuestion`**: Individual quiz questions (`id`, `quizId`, `prompt`, `explanation`, `type`, `order`, `createdAt`, `updatedAt`).
6. **`AcademyQuizOption`**: Quiz question choices (`id`, `questionId`, `text`, `isCorrect`, `order`, `createdAt`, `updatedAt`).
7. **`AcademyQuizAttempt`**: Historical attempt snapshot (`id`, `userId`, `quizId`, `attemptNumber`, `status`, `score`, `passed`, `quizTitleSnapshot`, `quizVersionSnapshot`, `startedAt`, `submittedAt`, `gradedAt`, `createdAt`, `updatedAt`).
8. **`AcademyQuizAnswer`**: Historical answer snapshots with same-quiz binding (`id`, `attemptId`, `quizId`, `questionId`, `selectedOptionId`, `isCorrect`, `questionPromptSnapshot`, `selectedOptionTextSnapshot`, `correctOptionIdSnapshot`, `correctOptionTextSnapshot`, `createdAt`, `updatedAt`).
9. **`AcademyUserCourseProgress`**: Durable course completion facts (`id`, `userId`, `courseId`, `status`, `startedAt`, `completedAt`, `createdAt`, `updatedAt`).
10. **`AcademyUserLessonProgress`**: Durable lesson completion facts (`id`, `userId`, `lessonId`, `status`, `startedAt`, `completedAt`, `createdAt`, `updatedAt`).
11. **`AcademyUserXp`**: Single row per user XP aggregate (`id`, `userId`, `totalXp`, `level`, `createdAt`, `updatedAt`).
12. **`AcademyRewardLedger`**: Append-only reward audit ledger (`id`, `userId`, `sourceType`, `sourceId`, `rewardType`, `amount`, `idempotencyKey`, `status`, `metadata`, `createdAt`).

---

## 3. Database Constraints, Indexes & Invariants

### 3.1 Uniqueness Constraints & Indexes
- `AcademyCourse`: Unique slug `@@unique([slug])`.
- `AcademyLesson`: Unique composite `@@unique([courseId, slug])` and unique ordering `@@unique([courseId, order])`.
- `AcademyFlashcard`: Unique ordering `@@unique([lessonId, order])`.
- `AcademyQuiz`: Unique ordering `@@unique([lessonId, order])`.
- `AcademyQuizQuestion`: Unique ordering `@@unique([quizId, order])` and composite unique key `@@unique([id, quizId])` for foreign key binding.
- `AcademyQuizOption`: Unique ordering `@@unique([questionId, order])` and composite unique key `@@unique([id, questionId])` for foreign key binding.
- `AcademyQuizAttempt`: Scoped attempt sequence `@@unique([quizId, userId, attemptNumber])` and composite unique key `@@unique([id, quizId])` for foreign key binding.
- `AcademyQuizAnswer`: Unique answer per attempt `@@unique([attemptId, questionId])`.
- `AcademyUserCourseProgress`: Unique per user/course `@@unique([userId, courseId])`.
- `AcademyUserLessonProgress`: Unique per user/lesson `@@unique([userId, lessonId])`.
- `AcademyUserXp`: Unique per user `@@unique([userId])`.
- `AcademyRewardLedger`: Semantic unique tuple `@@unique([userId, sourceType, sourceId, rewardType])` and global unique idempotency key `@@unique([idempotencyKey])`.

### 3.2 Same-Quiz Relational Integrity (DEF-007)
Composite foreign keys on `academy_quiz_answers`:
- `FOREIGN KEY ("attempt_id", "quiz_id") REFERENCES "academy_quiz_attempts"("id", "quiz_id") ON DELETE RESTRICT`
- `FOREIGN KEY ("question_id", "quiz_id") REFERENCES "academy_quiz_questions"("id", "quiz_id") ON DELETE RESTRICT`
- `FOREIGN KEY ("selected_option_id", "question_id") REFERENCES "academy_quiz_options"("id", "question_id") ON DELETE RESTRICT`

### 3.3 Deferred Constraint Triggers (DEF-001)
- Partial unique index `academy_quiz_options_one_correct_per_question` (`WHERE is_correct = true`).
- Deferred constraint trigger `trg_academy_quiz_options_exactly_one_correct` on `academy_quiz_options`.
- Deferred constraint trigger `trg_academy_quiz_questions_has_correct_option` on `academy_quiz_questions`.

### 3.4 Closed-Set & State CHECK Constraints (DEF-002, DEF-004, DEF-005)
- `academy_courses_status_check`: `status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')`
- `academy_lessons_status_check`: `status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')`
- `academy_quizzes_status_check`: `status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')`
- `academy_quiz_questions_type_check`: `type IN ('SINGLE_CHOICE')`
- `academy_quiz_attempts_status_check`: `status IN ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED')`
- `academy_quiz_attempts_attempt_number_check`: `attempt_number >= 1`
- `academy_user_course_progress_status_check`: `status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`
- `academy_user_course_progress_completed_at_check`: `((status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL))`
- `academy_user_lesson_progress_status_check`: `status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')`
- `academy_user_lesson_progress_completed_at_check`: `((status = 'COMPLETED' AND completed_at IS NOT NULL) OR (status <> 'COMPLETED' AND completed_at IS NULL))`
- `academy_user_xp_total_xp_non_negative`: `total_xp >= 0`
- `academy_reward_ledger_status_check`: `status IN ('PENDING', 'APPLIED', 'REVERSED')`
- `academy_reward_ledger_source_type_check`: `source_type IN ('COURSE_COMPLETION', 'LESSON_COMPLETION', 'QUIZ_PERFECT_SCORE', 'FLASHCARD_SESSION')`
- `academy_reward_ledger_reward_type_check`: `reward_type IN ('XP')`

---

## 4. Live Migration & Upgrade Validation Evidence

### 4.1 Fresh Database Deployment (`aura_capital_test_feat019_rework2_fresh`)
- **Target**: `aura_capital_test_feat019_rework2_fresh`
- **Result**: `PASS`
- **Migrations Applied**:
  1. `20260825000000_init_identity`
  2. `20260825000001_feat005_refresh_session_rotation`
  3. `20260827000000_feat009_audit_events`
  4. `20260903000000_feat019_academy_foundation`
- **Status**: `Database schema is up to date!`

### 4.2 Incremental Upgrade Verification (`aura_capital_test_feat019_rework2_upgrade`)
- **Baseline**: 3 Phase 3 migrations applied with representative Phase 2/3 rows (`3 users`, `3 credentials`, `2 roles`, `4 user_roles`, `1 refresh_sessions`, `3 auth_security_audit_records`).
- **Upgrade**: `npx prisma migrate deploy` applied ONLY `20260903000000_feat019_academy_foundation`.
- **Preservation Check**: 100% row preservation across all Phase 2/3 tables (zero drift).
- **Schema Growth**: Constraints: 51 baseline $\rightarrow$ 182 total (+131 new constraints and triggers), Indexes: 23 baseline $\rightarrow$ 70 total (+47 new indexes).

---

## 5. Verification Suite & Governance Summary

```text
================================================================================
FEAT-019 REWORK ITERATION 2 VALIDATION SUMMARY
================================================================================
clean:                  PASS (tsc -b --clean, dist cleaned)
lint:                   PASS (eslint . — 0 errors)
prisma validate:        PASS (apps/api/prisma/schema.prisma valid)
typecheck:              PASS (shared, api, web)
build:                  PASS (shared, api, web production builds)
test (standard):        PASS (53 files, 487 tests passed)
test:unit:              PASS (33 files, 350 tests passed)
test:db (PostgreSQL):   PASS (12 files, 89 live tests passed)
test:redis (Redis):     PASS (5 files, 50 live tests passed)
guard:persistence:      PASS (14 tests passed)
guard:migration:        PASS (4 migrations, 0 blocking risks)
guard:boundary:         PASS (controllers=6, services=10, repositories=6)
guard:audit-governance: PASS (0 premature schemas)
guard:seed-safety:      PASS (0 unsafe seed fixtures)
================================================================================
```

---

## 6. Traceability Matrix: Acceptance Criteria (AC-001..AC-042)

| AC | Requirement | Implementation Status | Evidence / Verification |
| --- | --- | --- | --- |
| **AC-001** | FEAT-019 limited to schema & persistence foundation | PASS | Zero API endpoints, zero UI, zero business services |
| **AC-002** | No public Academy APIs, UI, quiz evaluation, progress mutation, XP granting, CMS/authoring | PASS | Boundary guard passes; zero controllers or public routes added |
| **AC-003** | 12 canonical Academy durable models exist | PASS | Models defined in `schema.prisma` with UUID PKs and strict typing |
| **AC-004** | Closed-set status/type enums database-backed | PASS | 10 PostgreSQL `CHECK` constraints reject invalid strings |
| **AC-005** | Required durable fields protected by NOT NULL | PASS | Enforced in Prisma schema and DDL migrations |
| **AC-006** | Course slug uniqueness enforced by PostgreSQL | PASS | `@@unique([slug])` in `schema.prisma` and unique index |
| **AC-007** | Ordering uniqueness scoped correctly | PASS | Scoped unique constraints on lessons, flashcards, quizzes, questions, options |
| **AC-008** | One answer per question per attempt enforced | PASS | `@@unique([attemptId, questionId])` on `AcademyQuizAnswer` |
| **AC-009** | User progress rows uniquely scoped | PASS | `@@unique([userId, courseId])` and `@@unique([userId, lessonId])` |
| **AC-010** | Foreign keys reject invalid parent/owner references & cross-quiz answer binding | PASS | All FKs configured; composite same-quiz FKs enforce full attempt $\rightarrow$ quiz $\rightarrow$ question $\rightarrow$ option chain (DEF-007) |
| **AC-011** | Restrictive delete policies on parent entities and user history | PASS | `onDelete: Restrict` on all parent and user learning relationships |
| **AC-012** | Indexes support expected query paths | PASS | Indexes on foreign keys, statuses, and composite lookup paths |
| **AC-013** | Application validation not presented as replacement for DB constraints | PASS | Database-level CHECK constraints, foreign keys, and triggers are final authority |
| **AC-014** | Reward ledger semantic uniqueness & global idempotency key | PASS | `@@unique([userId, sourceType, sourceId, rewardType])` and `@@unique([idempotencyKey])` |
| **AC-015** | Schema supports server-authoritative submission & immutable snapshots | PASS | Snapshots on attempts and answers preserve historical evaluation integrity |
| **AC-016** | Fresh zero-state migration deploy succeeds | PASS | Deployed cleanly on `aura_capital_test_feat019_rework2_fresh` |
| **AC-017** | True Phase 3 -> FEAT-019 upgrade preserves data and creates schema | PASS | Verified on `aura_capital_test_feat019_rework2_upgrade` (100% rows preserved) |
| **AC-018** | Migration guard passes; zero destructive migrations | PASS | `npm run guard:migration` passed (0 blocking risks) |
| **AC-019** | Migrations contain zero seed/content data | PASS | Pure DDL migration file |
| **AC-020** | `prisma db push` not used | PASS | Strictly `prisma migrate deploy` used |
| **AC-021** | Academy Prisma access isolated behind repositories | PASS | `IAcademyCourseRepository`, `IAcademyQuizRepository`, `IAcademyProgressRepository`, `IAcademyRewardRepository` |
| **AC-022** | Repositories support root and transaction client usage via UoW | PASS | `createRepositoryContainer` binds to root `PrismaClient` or `Prisma.TransactionClient`; atomic `createQuestionWithOptions` provided (DEF-011) |
| **AC-023** | Transaction-scoped repositories use transaction client | PASS | Verified via `PrismaTransactionRunner` integration tests |
| **AC-024** | Boundary guard passes | PASS | `npm run guard:boundary` passed (controllers=6, services=10, repositories=6) |
| **AC-025** | Correct-answer persistence fields server-only | PASS | Server-side only; zero client routes or DTO exposures |
| **AC-026** | Redis not used as durable Academy authority | PASS | Redis stores zero Academy keys |
| **AC-027** | Product audit persistence remains deferred | PASS | `npm run guard:audit-governance` passed |
| **AC-028** | Seed safety remains intact | PASS | `npm run guard:seed-safety` passed |
| **AC-029** | Persistence guard remains green | PASS | `npm run guard:persistence` passed (14 tests) |
| **AC-030** | FEAT-001 through FEAT-018 regression remains green | PASS | All 53 standard test files (487 tests) pass; 5 Redis files (50 tests) pass |
| **AC-031** | Full validation suite passes from root with actual counts | PASS | 100% PASS recorded across all static, unit, live DB, live Redis, and guard suites |
| **AC-032** | Implementation report truthfully maps evidence and limitations | PASS | Report synchronized with active schema and test metrics |
| **AC-033** | Governance state consistent | PASS | FEAT-019 IMPLEMENTED / READY FOR QA; FEAT-020 BLOCKED; Phase 4 IN_PROGRESS |
| **AC-034** | Quiz has required Lesson ownership (no polymorphic parent) | PASS | `lessonId` required foreign key on `AcademyQuiz` |
| **AC-035** | Flashcard has required Lesson ownership (no polymorphic parent) | PASS | `lessonId` required foreign key on `AcademyFlashcard` |
| **AC-036** | Single-choice quiz baseline supported | PASS | `SINGLE_CHOICE` enforced via PostgreSQL CHECK constraint |
| **AC-037** | `isCorrect` exists & exactly one correct option enforced | PASS | Deferred constraint triggers reject 0-correct and $\ge 2$-correct options on commit |
| **AC-038** | QuizAttempt and QuizAnswer contain immutable snapshot fields | PASS | Snapshots (`quizTitleSnapshot`, `quizVersionSnapshot`, `questionPromptSnapshot`, `selectedOptionTextSnapshot`, `correctOptionIdSnapshot`, `correctOptionTextSnapshot`) preserved |
| **AC-039** | Destructive quiz content deletion restricted once attempts exist | PASS | `onDelete: Restrict` prevents parent deletion |
| **AC-040** | One XP row per user & non-negative total XP | PASS | `@@unique([userId])` and `CHECK ("total_xp" >= 0)` |
| **AC-041** | Progress stores durable facts with completed-only semantics | PASS | Completed-only CHECK constraints enforce `status = 'COMPLETED' <-> completedAt IS NOT NULL` |
| **AC-042** | Restrictive user deletion for Academy history | PASS | `onDelete: Restrict` on User foreign keys in all history tables |

---

## 7. Governance State & Downstream Status

- **FEAT-019**: `DONE`
- **QA Verdict**: `QA PASS — Emergency QA Ownership Transfer`
- **Human Dual Review**: `APPROVED`
- **Human Final Gate**: `APPROVED`
- **Phase 4**: `IN_PROGRESS`
- **FEAT-020**: `UNBLOCKED FOR PLANNING` (Implementation: `NOT_STARTED`)

