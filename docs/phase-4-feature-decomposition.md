# Aura Capital - Phase 4 Feature Decomposition

**Status**: PHASE 4 IN_PROGRESS  
**Phase**: Phase 4 - Academy  
**Owner**: Codex Planner / Architect / QA Governance  
**Date**: 2026-09-03

**Current Feature State**:
- FEAT-019: DONE (Human Final Gate APPROVED)
- FEAT-020: DONE (QA PASS — Antigravity QA with Human Dual Review, Human Final Gate APPROVED)
- FEAT-021: DONE (QA PASS — QA Iteration 2, Human Final Gate APPROVED)
- FEAT-022: UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED)
- FEAT-023+: BLOCKED according to dependency graph
- Phase 4: IN_PROGRESS
- Phase 5: BLOCKED


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

Human decision required:

- Whether Academy is the first domain to activate concrete product audit persistence.
- If yes, the owning feature must define a product audit table/schema, event taxonomy, metadata allowlist, transaction strategy, retention posture, and tests.
- `AuthSecurityAuditRecord` must not be used for Academy product events.

## 11. Proposed Feature Sequence

| ID | Title | Type | Dependencies |
| --- | --- | --- | --- |
| FEAT-019 | Academy Domain Schema & Persistence Foundation | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-020 | Course & Lesson Read Model APIs | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-021 | Academy Learner Course/Lesson UI | Implementation | DONE (Human Final Gate APPROVED) |
| FEAT-022 | Flashcards Domain & Review Flow | Implementation | UNBLOCKED FOR PLANNING (Implementation: NOT_STARTED) |
| FEAT-023 | Quiz Definition & Safe Projection | Implementation | FEAT-019, FEAT-020 |
| FEAT-024 | Quiz Attempt Lifecycle | Implementation | FEAT-019, FEAT-023 |
| FEAT-025 | Server-Side Quiz Evaluation & Secure Submission | Implementation | FEAT-024 |
| FEAT-026 | Academy Progression & Completion Tracking | Implementation | FEAT-020, FEAT-024, FEAT-025 |
| FEAT-027 | XP & Idempotent Reward Ledger | Implementation | FEAT-025, FEAT-026 |
| FEAT-028 | Academy Authorization & Ownership Hardening | Implementation / hardening | FEAT-020..FEAT-027 |
| FEAT-029 | Academy Product Audit Decision & Integration | Conditional implementation | FEAT-025, FEAT-027, Human audit decision |
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

Human Decisions: Whether flashcard review state persists in Phase 4.

### FEAT-023 - Quiz Definition & Safe Projection

Goal: Serve quiz definitions without exposing correct answers.

Scope: Quiz/question/option DTOs, safe projection tests, published quiz filtering.

Excluded: Attempt creation/submission/evaluation.

QA Gate: Correct answer leakage sentinel; raw schema fields with correctness never appear in pre-submission API/UI.

Human Decisions: Question types for Production MVP.

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

Goal: Maintain server-authoritative course/lesson/quiz progression.

Scope: User progress records, completion state, percentage calculation, read APIs for current user.

Excluded: XP/reward granting and admin analytics.

QA Gate: User-scoped access, concurrency-safe completion, no client-written percentages.

Human Decisions: Course completion formula.

### FEAT-027 - XP & Idempotent Reward Ledger

Goal: Grant XP/rewards exactly once for approved Academy achievements.

Scope: UserXP aggregate, RewardLedger, idempotency keys, transactionally safe reward mutation.

Excluded: Badges unless Human approves, monetization, subscription entitlements.

QA Gate: Duplicate/retry/concurrent reward prevention, rollback behavior, DB uniqueness authority.

Human Decisions: XP amounts and reward triggers.

### FEAT-028 - Academy Authorization & Ownership Hardening

Goal: Verify Academy endpoints enforce user ownership and server-side authorization.

Scope: Personal attempts, progress, XP, ownership boundaries, IDOR hardening, optional admin-read policy if approved.

Excluded: Public role management, admin content authoring.

QA Gate: User A cannot read/write User B's attempts/progress; client role/admin spoofing rejected.

Human Decisions: Whether admins get read-only support visibility in Phase 4.

### FEAT-029 - Academy Product Audit Decision & Integration

Goal: Apply FEAT-016 product-audit governance to Academy high-value events if Human approves concrete persistence.

Scope: Event taxonomy, metadata allowlist, transaction strategy, repository abstraction, audit table only if explicitly approved.

Excluded: AuthSecurityAuditRecord reuse, public audit APIs, audit UI.

QA Gate: FEAT-016 10-point activation criteria, metadata sanitizer, transaction coupling tests.

Human Decisions: Required before implementation: activate durable Academy product audit persistence or defer with accepted risk.

### FEAT-030 - Phase 4 Academy Integration Gate

Goal: Validate integrated Academy behavior before Phase 5.

Scope: Full Academy lifecycle, answer leakage, ownership, progression, XP idempotency, migrations, regression, UI smoke/E2E where applicable.

Excluded: New product functionality.

QA Gate: PASS / CONDITIONAL PASS / FAIL with no unresolved P0/P1 security, integrity, or answer leakage defects.

Human Decisions: Final Phase 4 approval.

## 13. Dependency Graph

```text
FEAT-019
  -> FEAT-020 -> FEAT-021
  -> FEAT-022
  -> FEAT-023 -> FEAT-024 -> FEAT-025 -> FEAT-026 -> FEAT-027
  -> FEAT-028
  -> FEAT-029 (conditional on Human audit decision)
  -> FEAT-030
```

## 14. Phase 4 Final Gate

FEAT-030 is the final Phase 4 Academy Integration Gate.

PASS requires:

- FEAT-019 through FEAT-028 are DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-029 is either DONE / QA PASS / Human Final Gate APPROVED or explicitly deferred by Human with documented risk.
- Correct answers are never exposed before submission.
- Server-side evaluation, progression, XP, and rewards are authoritative.
- Duplicate rewards are prevented by PostgreSQL constraints and transactions.
- User-scoped Academy data is protected from IDOR.
- Phase 2 and Phase 3 regression remains green.

## 15. Human Decisions Required

1. Confirm Phase 4 default boundary: learner-facing Academy only, no CMS/admin authoring.
2. Decide production content ingestion approach.
3. Decide quiz question types and scoring/pass policy before FEAT-023/FEAT-025.
4. Decide whether flashcard review state persists in Phase 4.
5. Decide whether Academy activates concrete product audit persistence in FEAT-029.
6. Decide whether admin read-only support visibility is included in FEAT-028 or deferred.

## 16. Readiness

READY FOR HUMAN REVIEW.
