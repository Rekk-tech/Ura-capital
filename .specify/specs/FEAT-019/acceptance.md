# Acceptance Criteria: FEAT-019 Academy Domain Schema & Persistence Foundation

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-019  
**Phase**: Phase 4 - Academy

## 1. Acceptance Matrix

| AC | Criterion | Verification |
| --- | --- | --- |
| AC-001 | FEAT-019 remains limited to Academy schema and persistence foundation. | Source/diff/report review |
| AC-002 | No public Academy APIs, frontend UI, quiz evaluation, progress mutation, XP reward granting, CMS/admin authoring, product audit persistence, or Phase 5 behavior is introduced. | Source/route/UI/schema review |
| AC-003 | Canonical Academy durable models exist: AcademyCourse, AcademyLesson, AcademyFlashcard, AcademyQuiz, AcademyQuizQuestion, AcademyQuizOption, AcademyQuizAttempt, AcademyQuizAnswer, AcademyUserCourseProgress, AcademyUserLessonProgress, AcademyUserXp, and AcademyRewardLedger. | Prisma schema review |
| AC-004 | Academy status enums are closed-set and database-backed through Prisma/PostgreSQL. | Schema/DB tests |
| AC-005 | Required durable fields are protected by PostgreSQL NOT NULL constraints. | DB tests |
| AC-006 | Course slug uniqueness is enforced by PostgreSQL. | DB duplicate test |
| AC-007 | Ordering uniqueness is scoped correctly for lessons within course, quizzes within lesson where applicable, questions within quiz, and options within question. | DB composite unique tests |
| AC-008 | One answer per question per attempt is enforced by PostgreSQL. | DB composite unique test |
| AC-009 | User progress rows are uniquely scoped per user/course and user/lesson. | DB tests |
| AC-010 | Foreign keys reject invalid parent/owner references. | DB FK tests |
| AC-011 | Delete policies are explicit, deterministic, and verified; parent/history relationships use restrictive/no-action behavior unless a narrower non-history exception is explicitly documented. | Schema review and DB tests |
| AC-012 | Indexes support expected ownership, ordering, and future read-model query paths without speculative unrelated indexes. | Schema/index review |
| AC-013 | Application validation is not presented as a replacement for PostgreSQL constraints. | Spec/source/report review |
| AC-014 | AcademyRewardLedger enforces durable PostgreSQL semantic uniqueness for `(userId, sourceType, sourceId, rewardType)` and any stored idempotencyKey has explicit global uniqueness semantics. | Schema/DB duplicate test |
| AC-015 | Academy attempt/progress/reward schema supports future server-authoritative quiz submission, historical attempt preservation, and idempotent reward processing. | Architecture/source review |
| AC-016 | Fresh zero-state migration deploy succeeds on an isolated FEAT-019 PostgreSQL database. | Migration evidence |
| AC-017 | True Phase 3 -> FEAT-019 incremental migration preserves representative Phase 2/3 rows and constraints and creates the Academy schema correctly. | Upgrade DB evidence |
| AC-018 | Migration guard passes and no destructive/data-loss migration exists without explicit Human approval. | `guard:migration` |
| AC-019 | Migrations contain no Academy seed/content data. | Migration review |
| AC-020 | `prisma db push` is not used as migration governance. | Command/report review |
| AC-021 | Academy Prisma access is isolated behind repositories and approved infrastructure. | Source review |
| AC-022 | Academy repositories support root PrismaClient and transaction client usage through the approved factory/UoW pattern. | Unit/DB tests |
| AC-023 | Transaction-scoped Academy repositories use the transaction client and do not bypass UoW. | Tests/source review |
| AC-024 | Boundary guard remains green; controllers and ordinary services do not import Prisma or query Academy tables directly. | `guard:boundary` |
| AC-025 | Correct-answer persistence fields are server-only and not exposed through any FEAT-019 public route, DTO, log, report evidence, Redis key, or client-controlled surface. | Source/API surface review |
| AC-026 | Redis is not used as durable Academy authority. | Source/Redis review |
| AC-027 | Product audit persistence remains deferred and `AuthSecurityAuditRecord` is not used for Academy product events. | `guard:audit-governance` |
| AC-028 | Seed safety remains intact; no production Academy seed data or default privileged Academy content setup is added. | `guard:seed-safety` |
| AC-029 | Persistence guard remains green; no JSON/file fallback is introduced. | `guard:persistence` |
| AC-030 | FEAT-001 through FEAT-018 regression validation remains green. | Validation evidence |
| AC-031 | Full validation suite passes from repository root with actual counts recorded. | Command evidence |
| AC-032 | Implementation report truthfully maps tasks, files, migration evidence, test evidence, known limitations, and AC-001..AC-042. | Report review |
| AC-033 | Governance state remains consistent: FEAT-019 in QA/review after implementation, FEAT-020 blocked until FEAT-019 Human Final Gate, Phase 4 IN_PROGRESS, Phase 5 BLOCKED. | Tracker/report review |
| AC-034 | AcademyQuiz has exactly one required AcademyLesson parent; no course-or-lesson polymorphic ownership is present. | Schema/DB FK review |
| AC-035 | AcademyFlashcard has exactly one required AcademyLesson parent; no course-or-lesson polymorphic ownership is present. | Schema/DB FK review |
| AC-036 | FEAT-019 supports only the single-choice quiz baseline; unsupported quiz/question types are absent or explicitly deferred. | Schema/spec/source review |
| AC-037 | `AcademyQuizOption.isCorrect` exists as the canonical server-only correct-answer marker, and PostgreSQL enforces exactly one correct option per single-choice quiz question through a documented database-backed mechanism. | DB integrity tests |
| AC-038 | QuizAttempt and QuizAnswer schema contain immutable snapshot fields sufficient to preserve historical attempt meaning after future quiz content edits. | Schema/source review |
| AC-039 | Destructive quiz-content changes are restricted once attempts/answers exist unless a later versioning/authoring feature explicitly changes the policy. | DB FK/delete tests |
| AC-040 | AcademyUserXp has one row per user and non-negative totalXp enforced by PostgreSQL where practical. | Schema/DB constraint tests |
| AC-041 | Course and lesson progress store durable facts only: owner, content reference, status, startedAt, nullable completedAt with completed-only semantics; no client-authoritative percentage is introduced. | Schema/source review |
| AC-042 | Academy user-owned history uses restrictive/no-action User foreign keys; user deletion cannot silently delete attempts, progress, XP, or rewards. | Schema/DB delete tests |

## 2. PASS Requirements

FEAT-019 may receive QA PASS only when AC-001 through AC-042 pass, live PostgreSQL migration/constraint validation passes, repository boundaries are enforced, no answer leakage surface is introduced, all mandatory guards pass, and no unresolved P0/P1 security or data-integrity defect remains.

## 3. FAIL Conditions

- Correct answers are exposed through any public route/DTO/log/report before submission.
- Academy state is stored durably in Redis, JSON, files, logs, or memory.
- AcademyQuiz or AcademyFlashcard uses ambiguous Course-or-Lesson ownership.
- Historical quiz attempts can lose meaning because they depend only on mutable live content.
- Database constraints are missing for required uniqueness, ownership, or idempotency invariants.
- Reward processing can duplicate the same semantic reward source at PostgreSQL level.
- Academy User deletion can silently delete or corrupt learning history.
- Controllers or ordinary services bypass repositories and query Prisma directly.
- Migrations are destructive without Human approval.
- Seed/content data is embedded in migrations.
- FEAT-020 or later Academy behavior is implemented prematurely.
- FEAT-001 through FEAT-018 regression is broken.

## 4. QA Notes

Codex QA must independently inspect schema, migrations, repository boundaries, guards, DB evidence, and no-answer-leakage surfaces. FEAT-020 remains blocked until FEAT-019 receives QA PASS and Human Final Gate approval.
