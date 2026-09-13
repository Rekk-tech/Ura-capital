# Aura Capital - Phase 4 Feature Decomposition

**Status**: PHASE 4 IN_PROGRESS  
**Phase**: Phase 4 - Academy  
**Owner**: Codex Planner / Architect / QA Governance  
**Date**: 2026-09-03

**Current Feature State**:
- FEAT-019: DONE (Human Final Gate APPROVED)
- FEAT-020: DONE (QA PASS — Antigravity QA with Human Dual Review, Human Final Gate APPROVED)
- FEAT-021: DONE (QA PASS — QA Iteration 2, Human Final Gate APPROVED)
- FEAT-022: DONE (QA PASS — QA Iteration 2, Human Final Gate APPROVED)
- FEAT-023: DONE (Human Final Gate APPROVED)
- FEAT-024: DONE (Human Final Gate APPROVED)
- FEAT-025: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
- FEAT-026: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
- FEAT-027: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
- FEAT-028: UNBLOCKED FOR IMPLEMENTATION
- FEAT-029: UNBLOCKED FOR IMPLEMENTATION
- FEAT-030: BLOCKED according to dependency graph
- Phase 4: IN_PROGRESS
- Phase 5: BLOCKED

**Master Planning Governance**:
- Remaining Phase 4 phase-owned workflow transition: HUMAN APPROVED.
- FEAT-019 through FEAT-024 historical QA and Human Final Gate approvals are preserved.
- FEAT-025 through FEAT-029 use internal feature quality gates.
- FEAT-030 is the Phase 4 Academy Integration Gate with Human Phase Final Gate after Codex Phase QA.


*(HISTORICAL SNAPSHOT: Prior to FEAT-020 Human Final Gate approval, FEAT-020 was IMPLEMENTED / READY FOR QA and FEAT-021 through FEAT-030 were BLOCKED by dependency order).*

## 1. Phase Goal

Rebuild Academy on the approved production architecture established by Phases 1-3.

Phase 4 covers learner-facing Academy capabilities:

- Courses
- Lessons
- Flashcards
- Quizzes
- Quiz attempts
- XP / progression
- Idempotent rewards

Legacy Academy behavior is reference only. Legacy code must not be copied or refactored blindly.

## 2. Architecture Baseline

Phase 4 must preserve:

- Modular monolith.
- React + TypeScript + Vite frontend.
- Node.js + TypeScript + Express backend.
- PostgreSQL + Prisma for durable state.
- Repository and Unit of Work boundaries from FEAT-013.
- Database constraint standards from FEAT-014.
- Redis transient-only boundary from FEAT-015.
- Product audit governance from FEAT-016.
- Seed safety boundaries from FEAT-017.
- Role-free JWT and PostgreSQL role authority from Phase 2.

## 3. Academy Domain Boundary

Default boundary:

- Learner-facing Academy only.
- No public or admin course-authoring CMS unless Human explicitly approves a later feature.
- No default production content seed.
- Test fixtures may create Academy content only in isolated test databases.
- Production Academy content ingestion remains a Human decision.

Phase 4 must not introduce Simulation, Community, Subscription, or AI behavior except where a future integration gate verifies no regression.

## 4. Proposed Domain Entities

Planned entities and relationships:

| Entity | Purpose | Key Relationships / Constraints |
| --- | --- | --- |
| Course | Published learning unit grouping lessons | Unique slug; status enum; ordered lessons |
| Lesson | Course content unit | Belongs to Course; unique order within course; optional quiz |
| Flashcard | Review prompt/answer linked to lesson | Belongs to Lesson; unique order within lesson; safe front/back projection |
| Quiz | Assessment definition | Belongs to Lesson; unique order within lesson; status enum |
| QuizQuestion | Server-owned question definition | Belongs to quiz; stable order within quiz |
| QuizOption | Multiple-choice option or answer representation | Belongs to question; correct flag/answer representation server-only |
| QuizAttempt | User-scoped attempt lifecycle | Belongs to user and quiz; status enum; immutable after grading |
| QuizAnswer | Submitted user answer | Belongs to attempt and question; one answer per question per attempt |
| UserCourseProgress | Per-user course progress | Unique user/course |
| UserLessonProgress | Per-user lesson progress | Unique user/lesson |
| UserXP | Per-user XP aggregate | Unique user |
| RewardLedger | Idempotent XP/reward record | Unique idempotency key and user/resource scope |

Deletion policy must be feature-specific. No global soft-delete convention is approved.

## 5. Security Model

Server is the authority for:

- Correct answers.
- Answer evaluation.
- Score.
- Pass/fail.
- Progress state.
- XP.
- Reward issuance.
- Attempt state transitions.

Clients submit only intent and answers. Clients must not be trusted for score, correctness, XP, rewards, roles, ownership, completion, or authoritative timestamps.

Correct answers must never be returned before submission. Quiz definition APIs must return only safe quiz projections.

## 6. Quiz Attempt Lifecycle

Proposed state machine:

```text
CREATED -> IN_PROGRESS -> SUBMITTED -> GRADED
```

Rules:

- Attempt ownership is user-scoped.
- Only the owner may submit or view their attempt.
- `GRADED` attempts are immutable except for explicitly approved audit/repair operations.
- Repeated submission must be idempotent or safely rejected without duplicating XP/rewards.
- Timeout policy is deferred unless a quiz feature explicitly approves timed attempts.

## 7. XP / Reward Idempotency Architecture

PostgreSQL is the idempotency authority.

Reward processing must use:

- TransactionRunner / Unit of Work.
- Database unique constraints on reward idempotency keys or equivalent scoped uniqueness.
- Atomic mutation of attempt finalization, progress, XP, reward ledger, and transactionally coupled product audit when approved.

Redis must not be durable authority for XP, progression, attempts, correct answers, or reward ledger.

## 8. Transaction Model

High-integrity operations use FEAT-013 UoW:

```text
quiz submission
  -> answer validation
  -> server-side evaluation
  -> attempt finalization
  -> progress mutation
  -> XP/reward ledger mutation
  -> product audit if transactionally coupled
```

Audit strategy follows FEAT-016:

- `TRANSACTIONALLY_COUPLED`: required where absence of audit invalidates a high-integrity reward/state mutation.
- `STATE_FIRST`: allowed for risk-reducing state changes.
- `BEST_EFFORT`: allowed for informational learner interactions.

## 9. Redis Boundary

Redis may be used only for justified transient concerns such as short-lived UI helper state or future cache/read optimization.

Redis must not store durable:

- Course truth.
- Lesson truth.
- Correct answers.
- Quiz attempts.
- Progress.
- XP.
- Reward ledger.
- Product audit records.

Any Redis usage must define TTL, namespace, outage behavior, multi-instance behavior, and key/log sanitization.

## 10. Product Audit Strategy

FEAT-016 remains authoritative.

Potential Academy product audit candidates:

- `ACADEMY_QUIZ_ATTEMPT_GRADED`
- `ACADEMY_REWARD_GRANTED`
- `ACADEMY_PROGRESS_COMPLETED`

Human decision locked:

- Durable Academy product audit is DEFERRED for Phase 4.
- FEAT-029 verifies accepted risk and preservation of FEAT-016 governance only.
- `AuthSecurityAuditRecord` must not be used for Academy product events.

## 11. Proposed Feature Sequence

| ID | Title | Type | Dependencies |
| --- | --- | --- | --- |
| FEAT-019 | Academy Domain Schema & Persistence Foundation | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-020 | Course & Lesson Read Model APIs | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-021 | Academy Learner Course/Lesson UI | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-022 | Flashcards Domain & Review Flow | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-023 | Quiz Definition & Safe Projection | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-024 | Quiz Attempt Lifecycle | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-025 | Server-Side Quiz Evaluation & Secure Submission | Implementation | DONE (Internal Feature Gate: PASS) |
| FEAT-026 | Academy Progression & Completion Tracking | Implementation | DONE (Internal Feature Gate: PASS) |
| FEAT-027 | XP & Idempotent Reward Ledger | Implementation | APPROVED FOR IMPLEMENTATION |
| FEAT-028 | Academy Authorization & Ownership Hardening | Implementation / hardening | PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE |
| FEAT-029 | Academy Product Audit Decision & Integration | Governance / verification closure | PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE |
| FEAT-030 | Phase 4 Academy Integration Gate | Validation gate | FEAT-019..FEAT-029 as applicable |

## 12. Feature Details

### FEAT-019 - Academy Domain Schema & Persistence Foundation

Goal: Establish Academy PostgreSQL/Prisma models, repositories, constraints, migrations, and test fixtures for future Academy features.

Scope: Course, Lesson, Flashcard, Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer, progress, XP, and reward-ledger schema planning/implementation boundaries.

Excluded: Public APIs, frontend UI, answer evaluation behavior, reward granting behavior, CMS/admin authoring, product audit persistence.

QA Gate: Fresh migration, existing-schema compatibility, DB constraints, repository boundaries, no answer leakage route, no Phase 5 behavior.

Human Decisions: Confirm learner-facing-only boundary and production content ingestion approach.

### FEAT-020 - Course & Lesson Read Model APIs

Goal: Provide safe learner-facing course and lesson read APIs.

Scope: List courses, course detail, lesson detail, published filtering, ordering, safe DTOs.

Excluded: CMS authoring, progress mutation, quiz answer projection, XP.

QA Gate: Auth/public boundary verified, no unsafe fields, PostgreSQL-backed read tests, repository boundary guard.

Human Decisions: Authentication/access model: RESOLVED / HUMAN APPROVED (Catalog & Outline: Public; Lesson Detail: Authenticated).

### FEAT-021 - Academy Learner Course/Lesson UI

Goal: Build learner-facing course and lesson screens using safe APIs.

Scope: Course list/detail, lesson view, loading/empty/error states, responsive/accessibility baseline.

Excluded: Quiz attempt submission, XP mutation, content authoring.

QA Gate: Component tests, API client usage, no hidden UI-only authorization assumption, no answer leakage.

Human Decisions: UX detail priority and content display format.

### FEAT-022 - Flashcards Domain & Review Flow

Goal: Add flashcard read/review behavior for lessons.

Scope: Safe flashcard projection, learner review interactions, optional per-user review markers if approved.

Excluded: Spaced repetition algorithm unless separately approved, XP rewards.

QA Gate: Safe answer reveal semantics, ownership/progress boundary if persistence added, no Redis durable state.

Human Decisions: RESOLVED / HUMAN APPROVED — Flashcard review state persistence: DEFERRED; Phase 4 FEAT-022 behavior: TRANSIENT CLIENT-SIDE REVIEW SESSION ONLY. Answer secrecy level: OPTION A — UI REVEAL ONLY (APPROVED). No durable per-user flashcard review state, no spaced repetition, no XP, no progress mutation, no Redis durable authority.

### FEAT-023 - Quiz Definition & Safe Projection

Goal: Serve quiz definitions without exposing correct answers.

Scope: Quiz/question/option DTOs, safe projection tests, published quiz filtering.

Excluded: Attempt creation/submission/evaluation.

QA Gate: Correct answer leakage sentinel; raw schema fields with correctness never appear in pre-submission API/UI.

Human Decisions: RESOLVED / HUMAN APPROVED — Question type: SINGLE_CHOICE ONLY (APPROVED). Primary Quiz Read Policy: Lowest-order PUBLISHED quiz (APPROVED). Identifier Strategy: Stable opaque UUIDs (APPROVED). passingScore: Safe pre-submission metadata (APPROVED). Zero per-user attempt creation, zero scoring, zero progress/XP mutation, zero Redis state in FEAT-023.

### FEAT-024 - Quiz Attempt Lifecycle

Goal: Create and manage user-owned quiz attempts.

Scope: Attempt creation, IN_PROGRESS state, ownership, repeated active attempt policy, immutable completed attempt baseline.

Excluded: Evaluation, scoring, XP/reward mutation.

QA Gate: IDOR tests, status transition tests, duplicate/concurrent attempt tests, DB constraints.

Human Decisions: One active attempt per quiz or unlimited attempts with history.

### FEAT-025 - Server-Side Quiz Evaluation & Secure Submission

Goal: Evaluate submitted answers on the server and finalize attempts.

Scope: Submission validation, answer persistence, score/pass/fail calculation, GRADED finalization, safe result response after submission.

Excluded: XP/reward ledger mutation unless required as a dependency for later feature.

QA Gate: Tampering rejection, no client score/correctness trust, repeated submission semantics, rollback tests.

Human Decisions: Passing thresholds and scoring policy.

### FEAT-026 - Academy Progression & Completion Tracking

Goal: Maintain server-authoritative course and lesson progression for the authenticated learner while preserving FEAT-025 grading ownership.

Scope: User lesson progress, user course progress, percentage calculation, authenticated read API, informational lesson completion proposal, post-grade reconciliation from FEAT-025 `GRADED` attempts, frontend progress presentation, and internal completion fact contract for FEAT-027.

Excluded: XP/reward granting, `AcademyUserXp` writes, `AcademyRewardLedger` writes, product audit emission, Redis durable progress authority, quiz scoring/evaluation, FEAT-027 behavior, and admin analytics.

QA Gate: User-scoped access, server-authoritative progression, concurrency-safe completion, FEAT-025 reconciliation retry, progress/correctness secrecy regression, zero XP/reward/audit/Redis side effects.

Planning Status: HUMAN APPROVED (Codex-owned). Implementation: COMPLETE. Internal Feature Gate: PASS.

Human Decisions: APPROVED - quiz pass auto-completion, informational lesson completion policy, lesson/course monotonicity, new-published-lesson semantics, draft/archived denominator policy, zero-published-lesson semantics, and percentage rounding. Unresolved Human Decisions: ZERO.

Human-Approved Migration Decision: ZERO production migration based on existing progress tables and constraints.

### FEAT-027 - XP & Idempotent Reward Ledger

Goal: Grant XP/rewards exactly once for approved Academy achievements.

Scope: FEAT-026 completion/progression fact consumption, first lesson/course completion XP, reward reconciliation after progression commits, `AcademyRewardLedger` semantic idempotency, `AcademyUserXp` aggregate mutation, replay/concurrency protection, current-user XP read API, and lightweight read-only learner XP display.

Excluded: Badges, monetization, subscription entitlements, historical automatic reward backfill, level mechanics, level thresholds, level-up events, level rewards, public reward mutation endpoint, Kafka/RabbitMQ, and outbox.

QA Gate: Duplicate/retry/concurrent reward prevention, rollback behavior, DB uniqueness authority, progression-commit/reward-failure recovery, read-only XP projection, and no level mechanics.

Planning Status: HUMAN APPROVED / APPROVED FOR IMPLEMENTATION (Codex-owned). Implementation NOT_STARTED.

Human Decisions: APPROVED - lesson first completion 10 XP, course first completion 50 XP, failed quiz 0 XP, repeated quiz attempt 0 additional XP, historical automatic reward backfill deferred, current-user XP read API included, lightweight learner XP display included, badges out of scope, premium/subscription out of scope, level mechanics deferred.

Recovery Architecture: `AcademyCompletionFact.isFirstCompletion` is informational only. Durable reward eligibility is determined by authenticated user, persisted Academy completion state, deterministic reward identity, and absence/presence of the `AcademyRewardLedger` row. If progression commits and reward fails, retry/reconciliation must award the missing reward exactly once.

### FEAT-028 - Academy Authorization & Ownership Hardening

Goal: Verify Academy endpoints enforce user ownership and server-side authorization.

Scope: Personal attempts, progress, XP, reward history, ownership boundaries, and IDOR hardening.

Excluded: Public role management, admin content authoring, admin/support learner visibility, support read API, and new admin/support Academy routes.

QA Gate: User A cannot read/write User B's attempts/progress; client role/admin spoofing rejected.

Planning Status: PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE. Implementation NOT_STARTED.

Human Decisions: APPROVED - ADMIN / SUPPORT learner visibility is DEFERRED. FEAT-028 adds zero new admin/support Academy routes and remains learner ownership hardening only.

### FEAT-029 - Academy Product Audit Decision & Integration

Goal: Record and verify Human-approved deferral of durable Academy product audit for Phase 4.

Scope: Accepted risk documentation, verification of zero product audit table/migration/API/UI/event persistence, FEAT-016 abstraction preservation, FEAT-009 auth/security audit invariance, and regression/guard evidence.

Excluded: AuthSecurityAuditRecord reuse, public audit APIs, audit UI, product audit table, product audit migration, Academy product-event persistence, and grading/progress/reward semantic changes.

QA Gate: Zero product audit activation, FEAT-016 abstraction intact, FEAT-009 unchanged, existing guards/regression pass, accepted risk documented.

Planning Status: PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE. Implementation NOT_STARTED.

Human Decisions: APPROVED - Durable Academy product audit is DEFERRED for Phase 4. Accepted rationale: no current compliance/product requirement before Phase 4 exit; activation would touch stable quiz/progression/reward services close to the integration gate; FEAT-016 abstraction remains available later; FEAT-009 auth/security audit remains unchanged.

Parallel Note: FEAT-028 and FEAT-029 may run in parallel after FEAT-027 gate because FEAT-029 is DEFER. Both must start from the same `feat-027-approved` checkpoint, use isolated Git worktrees, and never run in the same working directory.

FEAT-028 / FEAT-029 File Ownership Matrix:

| File / Surface | Owner During Parallel Wave | Notes |
| --- | --- | --- |
| `apps/api/src/modules/academy/academy.routes.ts` | FEAT-028 OWNER | FEAT-029 DEFER must not add product audit routes. |
| `apps/api/src/modules/academy/*.controller.ts` | FEAT-028 OWNER | FEAT-029 DEFER should not modify controllers except guard/test evidence if required. |
| `apps/api/src/modules/academy/*.service.ts` | FEAT-028 OWNER | FEAT-029 DEFER must not add audit hooks or redefine semantics. |
| `apps/api/src/modules/academy/academy.types.ts` | FEAT-027 OWNER until checkpoint; then INTEGRATION OWNER | FEAT-028/029 must not redefine reward/progress contracts. |
| `apps/api/src/modules/academy/academy.dto.ts` | FEAT-028 OWNER for DTO secrecy checks | FEAT-029 should not expose audit DTOs publicly. |
| `packages/shared/src/**` | FEAT-027 OWNER for XP/reward contracts; INTEGRATION OWNER after checkpoint | FEAT-028/029 may consume but not redefine FEAT-027 contracts. |
| `apps/api/prisma/schema.prisma` and migrations | NO OWNER IN FEAT-029 DEFER | FEAT-029 must add zero product audit schema/migration. |
| `apps/api/package.json` | INTEGRATION OWNER | Coordinate test script additions and avoid duplicate suite registration. |
| `docs/progress-tracker.md` and phase decomposition | CODEX / INTEGRATION OWNER | Antigravity reports implementation; Codex owns lifecycle governance. |
| `reports/implementation/phase-4/FEAT-028.md` | FEAT-028 OWNER | Separate report. |
| `reports/implementation/phase-4/FEAT-029.md` | FEAT-029 OWNER | Separate report. |

### FEAT-030 - Phase 4 Academy Integration Gate

Goal: Validate integrated Academy behavior before Phase 5.

Scope: Full Academy lifecycle, answer leakage, ownership, progression, XP idempotency, migrations, regression, UI smoke/E2E where applicable.

Excluded: New product functionality.

QA Report: Codex writes `reports/qa/phase-4/PHASE-4-QA.md` or an explicitly canonical equivalent.

QA Gate: PASS / CONDITIONAL PASS / FAIL with no unresolved P0/P1 security, integrity, or answer leakage defects.

Human Decisions: Final Phase 4 approval.

## 13. Dependency Graph

```text
FEAT-019
  -> FEAT-020 -> FEAT-021
  -> FEAT-022
  -> FEAT-023 -> FEAT-024 -> FEAT-025 -> FEAT-026 -> FEAT-027
  -> FEAT-028
  -> FEAT-029 (DEFER governance / verification closure)
  -> FEAT-030
```

## 14. Phase 4 Final Gate

FEAT-030 is the final Phase 4 Academy Integration Gate.

Workflow transition:

- FEAT-019 through FEAT-024 retain their existing QA history, Human approvals, and Final Gate decisions.
- FEAT-025 through FEAT-029 use the new phase-owned workflow.
- Under the new workflow, FEAT-025 through FEAT-029 still require immutable approved specs, implementation, tests, implementation reports, internal feature quality gates, and dependency satisfaction.
- FEAT-025 through FEAT-029 do not require separate Human Final Gates before FEAT-030.
- Human approval is primarily Master Planning Approval, then the Phase 4 Final Gate after FEAT-030 QA.

PASS requires:

- FEAT-019 through FEAT-024 remain DONE / QA PASS / Human Final Gate APPROVED according to their historical governance.
- FEAT-025 through FEAT-028 complete implementation reports, tests, and internal feature quality gates under the phase-owned workflow.
- FEAT-029 either completes its internal quality gate or is explicitly deferred by Human with documented risk.
- Correct answers are never exposed before submission.
- Server-side evaluation, progression, XP, and rewards are authoritative.
- Duplicate rewards are prevented by PostgreSQL constraints and transactions.
- User-scoped Academy data is protected from IDOR.
- Phase 2 and Phase 3 regression remains green.

## 15. Human Decisions

1. Confirm Phase 4 default boundary: learner-facing Academy only, no CMS/admin authoring.
2. Decide production content ingestion approach.
3. [RESOLVED] Decide quiz question types before FEAT-023: SINGLE_CHOICE ONLY (APPROVED). (Scoring/pass policy to be finalized before FEAT-025).
4. [RESOLVED] Decide whether flashcard review state persists in Phase 4: DEFERRED (Phase 4 FEAT-022 behavior: TRANSIENT CLIENT-SIDE REVIEW SESSION ONLY; Option A UI reveal only approved).
5. [RESOLVED] Durable Academy product audit persistence in FEAT-029: DEFERRED FOR PHASE 4.
6. [RESOLVED] Admin/support learner visibility in FEAT-028: DEFERRED.
7. [RESOLVED] FEAT-027 XP/reward policy: lesson first completion 10 XP, course first completion 50 XP, failed quiz 0 XP, repeated quiz attempt 0 additional XP, historical automatic reward backfill deferred, current-user XP read API included, lightweight learner XP display included, level mechanics deferred.

## 16. Readiness

FEAT-027 READY FOR IMPLEMENTATION. FEAT-028 and FEAT-029 remain blocked until FEAT-027 gate/checkpoint/CI/tag.
