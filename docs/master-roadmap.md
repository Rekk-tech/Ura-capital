# Aura Capital - Master Roadmap for Remaining Phases

Status: HUMAN APPROVED  
Owner: Codex Master Planner / System Architect / QA Governance  
Date: 2026-09-07  
Scope: Remaining roadmap planning only. Application code changes: ZERO.

Human Master Planning Decision: APPROVED.

Approved governance model:

```text
PLAN UPFRONT
-> FREEZE CROSS-PHASE CONTRACTS
-> DEVELOP PHASE STREAMS IN PARALLEL
-> INTERNAL FEATURE GATES
-> CODEX PHASE QA
-> HUMAN PHASE FINAL GATE
-> SEQUENTIAL INTEGRATION
```

## 1. Current Governance State

- Phase 1: DONE / QA PASS / Human Final Gate APPROVED.
- Phase 2: DONE / QA PASS / Human Final Gate APPROVED.
- Phase 3: DONE / QA PASS / Human Final Gate APPROVED.
- Phase 4: IN_PROGRESS.
- FEAT-019 through FEAT-024: DONE / approved according to current tracker.
- FEAT-025: existing planning package and resolved Human product decisions are reviewed inputs; do not discard or reopen unless a master contract conflict is found.
- FEAT-025 through FEAT-029: remaining Phase 4 implementation features under phase-owned governance; no separate Human Final Gate is required per feature.
- FEAT-030: Phase 4 Academy Integration Gate; validation-only; Codex produces `reports/qa/phase-4/PHASE-4-QA.md` or an explicitly canonical equivalent.
- Phase 5: PLANNED for DEV-A; implementation BLOCKED by Phase 4 Human Phase Final Gate.
- Phase 6: PLANNED for DEV-B; contract-first preparation AUTHORIZED, while full production implementation waits for Phase 6 product decisions.
- Phase 7: PLANNED for DEV-B; contract-first preparation may begin after Phase 6 core contracts freeze, while full production implementation waits for Phase 7 product decisions.

## 2. Fixed Development Ownership

| Phase | Owner | Rule |
| --- | --- | --- |
| Phase 4 - Academy | DEV-A | Exclusive implementation ownership |
| Phase 5 - Simulation Engine | DEV-A | Exclusive implementation ownership |
| Phase 6 - Community | DEV-B | Exclusive implementation ownership |
| Phase 7 - Subscription / Premium | DEV-B | Exclusive implementation ownership |
| Phase 8+ | UNASSIGNED | Human decision required before implementation |

DEV-A must not implement Phase 6/7. DEV-B must not implement Phase 4/5.

Protected shared architecture may not be redesigned by either developer without Codex architecture review:

- Authentication/session strategy.
- Global middleware and error envelope.
- Repository/Unit of Work infrastructure.
- Prisma migration governance.
- Redis responsibility boundary.
- Audit architecture.
- CI and validation guards.
- Shared security utilities.

## 3. Roadmap Summary

| Phase | Title | Owner | Business Objective | Technical Objective | Status |
| --- | --- | --- | --- | --- | --- |
| Phase 4 | Academy | DEV-A | Deliver learner-facing Academy MVP | Academy schema, read APIs, UI, quizzes, progression, rewards | IN_PROGRESS |
| Phase 5 | Simulation Engine | DEV-A | Deliver server-authoritative financial simulation | Simulation persistence, market/order/portfolio engines, settlement, UI | PLANNED |
| Phase 6 | Community | DEV-B | Deliver safe multi-user community | Posts, comments, likes, moderation baseline | PLANNED |
| Phase 7 | Subscription / Premium | DEV-B | Deliver entitlement-based premium access | Subscription persistence, provider boundary, entitlement checks | PLANNED |
| Phase 8 | Aura Intelligence | UNASSIGNED | Deliver context-aware AI learning assistant | AI gateway, context resolver, quotas, guardrails, observability | IDENTIFIED |
| Phase 9 | UI Integration & Product Polish | UNASSIGNED | Deliver cohesive production MVP experience | Cross-domain UX, accessibility, responsive flows, E2E | IDENTIFIED |
| Phase 10 | Production Hardening | UNASSIGNED | Prepare controlled production release | Observability, security hardening, backup/restore, deployment runbooks | IDENTIFIED |

## 4. Phase 4 - Academy

Business Objective:

Deliver the learner-facing Academy foundation: course/lesson discovery, learner UI, flashcards, safe quiz projection, attempt lifecycle, evaluation, progression, XP/rewards, ownership hardening, and final Academy gate.

Technical Objective:

Use the approved Phase 2/3 platform with PostgreSQL durable Academy authority, repository/UoW boundaries, safe pre-submission quiz projection, server-authoritative scoring/progress/XP, and no answer leakage.

Feature List:

- FEAT-019 - Academy Domain Schema & Persistence Foundation: DONE.
- FEAT-020 - Course & Lesson Read Model APIs: DONE.
- FEAT-021 - Academy Learner Course/Lesson UI: DONE.
- FEAT-022 - Flashcards Domain & Review Flow: DONE.
- FEAT-023 - Quiz Definition & Safe Projection: DONE.
- FEAT-024 - Quiz Attempt Lifecycle: DONE.
- FEAT-025 - Server-Side Quiz Evaluation & Secure Submission: reviewed planning input; implementation not started.
- FEAT-026 - Academy Progression & Completion Tracking.
- FEAT-027 - XP & Idempotent Reward Ledger.
- FEAT-028 - Academy Authorization & Ownership Hardening.
- FEAT-029 - Academy Product Audit Decision & Integration.
- FEAT-030 - Phase 4 Academy Integration Gate.

Primary APIs:

- Academy catalog/course/lesson read APIs from FEAT-020.
- Learner quiz definition and attempt APIs from FEAT-023/024.
- Future evaluation/progress/reward APIs from FEAT-025 through FEAT-027.

Schema Ownership:

Phase 4 owns Academy tables only. It consumes `users`, roles/auth context, repository/UoW infrastructure, Redis transient boundary, and product audit governance.

Migration History:

Existing approved Phase 4 migrations, including `202609...` migrations from FEAT-019 through FEAT-024, are immutable. They must never be renamed, reordered, or edited. The reserved `20261004` range applies only to remaining new/unapplied Phase 4 work.

Redis Policy:

Redis must not store durable Academy truth, correct answers, attempts, progress, XP, reward ledger, or product audit records.

Audit Policy:

`AuthSecurityAuditRecord` must not be reused for Academy product events. FEAT-029 must either activate product audit with Human approval or defer it with documented risk.

QA Gate:

FEAT-030 validates complete Academy integration, answer secrecy, IDOR/ownership, server-authoritative scoring/progression/rewards, PostgreSQL constraints, migrations, UI smoke/E2E, and Phase 1-3 regression.

Governance Transition:

- FEAT-019 through FEAT-024 retain all historical QA history, Human approvals, and Final Gate decisions.
- FEAT-025 through FEAT-029 proceed under the phase-owned workflow after Human Master Planning Approval.
- FEAT-025 through FEAT-029 require immutable approved specs, implementation reports, tests, internal feature quality gates, and dependency satisfaction.
- Separate Human Final Gates for FEAT-025 through FEAT-029 are removed.
- Human approval occurs at Master Planning Approval and at the Phase 4 Final Gate after FEAT-030.

Human Decisions:

- Production Academy content ingestion approach.
- FEAT-025 scoring/pass policy if not already approved in its spec.
- FEAT-028 admin read-only support visibility.
- FEAT-029 product audit activation or deferral.

## 5. Phase 5 - Simulation Engine

Business Objective:

Deliver an individual server-authoritative simulation where users can trade in a clearly simulated financial environment without client-controlled prices, clocks, balances, or outcomes.

Technical Objective:

Create Simulation PostgreSQL schema, deterministic market/clock/order/portfolio/settlement services, transient Redis coordination where justified, safe APIs, UI, and a Phase 5 integration gate.

Phase 5 depends on Phase 4 Human Phase Final Gate approval as project sequencing, but its core domain does not require Academy runtime outputs. It has HARD dependencies on Phase 2 auth/security and Phase 3 data foundation. No Phase 5 implementation overlap is currently authorized.

Feature List:

- FEAT-031 - Simulation Persistence Foundation.
- FEAT-032 - Server Clock, Market Scenario & Phase Engine.
- FEAT-033 - Order Intent API & Validation.
- FEAT-034 - Trade Execution & Portfolio Accounting.
- FEAT-035 - Simulation Settlement, Events & Snapshots.
- FEAT-036 - Simulation Read Models & Dashboard APIs.
- FEAT-037 - Simulation Leaderboard & Redis Cache Boundary.
- FEAT-038 - Simulation Learner UI.
- FEAT-039 - Simulation Security, Audit & Abuse Hardening.
- FEAT-040 - Phase 5 Simulation Integration Gate.

Inputs:

- Authenticated server-derived user context.
- PostgreSQL, Prisma, repository/UoW, migration governance.
- Redis transient boundary and health validation.
- Product audit governance.
- Academy completion is a governance prerequisite, not a technical data dependency.

Outputs:

- Durable simulation sessions, market snapshots, orders, trades, positions, portfolio snapshots, settlement records, and event history.
- Safe simulation APIs and UI.
- Simulation integration QA report.

Primary APIs:

- `POST /simulation/sessions`
- `GET /simulation/sessions/:id`
- `GET /simulation/sessions/:id/state`
- `POST /simulation/sessions/:id/orders`
- `GET /simulation/sessions/:id/orders`
- `GET /simulation/sessions/:id/portfolio`
- `GET /simulation/sessions/:id/events`
- `POST /simulation/sessions/:id/settle` only if server-controlled/manual test/admin operation is approved; otherwise settlement is internal.

DTOs:

- `SimulationSessionDto`
- `SimulationStateDto`
- `MarketSnapshotDto`
- `OrderIntentRequest`
- `OrderDto`
- `TradeDto`
- `PositionDto`
- `PortfolioDto`
- `SimulationEventDto`
- `LeaderboardEntryDto`

Schema Ownership:

Phase 5 owns simulation tables only. It may reference `users` with restrictive history-preserving behavior. It must not modify Academy, Community, Subscription, or AI tables.

Redis Policy:

Allowed: transient locks, phase timers, ephemeral leaderboards/cache, idempotency acceleration. PostgreSQL remains durable authority for sessions, orders, trades, positions, settlement, balances, and history.

Audit Policy:

High-value simulation actions must follow FEAT-016. Concrete product audit persistence requires an owning feature decision in FEAT-039 or a prior Human-approved audit activation.

Migration Ownership:

DEV-A owns Phase 5 simulation migrations. Use reserved names `20261005xxxxxx_feat031_...` through `20261005xxxxxx_feat040_...` unless Codex assigns a different timestamp range. Existing approved Phase 4 migrations are immutable and must not be renamed to fit future ranges.

QA Gate:

FEAT-040 must run fresh DB migration, Phase 4/5 upgrade validation, deterministic engine tests, concurrency/rollback tests, Redis outage tests where Redis is used, E2E simulation flow, and full regression.

Human Decisions:

- Initial simulated asset universe and scenario set.
- Phase duration/default cycle rules.
- Starting cash and portfolio constraints.
- Order types included in MVP.
- Leaderboard inclusion and privacy scope.
- Product audit activation for simulation high-value events.

## 6. Phase 6 - Community

Business Objective:

Deliver a safe multi-user community where authenticated users can create posts/comments, like/unlike relationally, and basic moderation can hide or review harmful content.

Technical Objective:

Create Community PostgreSQL schema, post/comment/like APIs, ownership and moderation boundaries, optional UI, and final integration gate without depending on unfinished Academy/Simulation internals.

PHASE 6 EARLIEST SAFE START CONDITION:

PHASE 6 CONTRACT-FIRST PREPARATION is AUTHORIZED after Human Master Planning Approval and frozen cross-phase contract approval.

Allowed preparation includes reading frozen contracts, detailed feature planning, phase-local interfaces, DTO definitions, mocks, fixtures, test design, isolated phase-local architecture, and domain work depending only on FROZEN contracts. Phase 6 full production implementation is not authorized until Phase 6 Human product decisions are resolved. Phase 6 must not merge into main until it rebases onto the latest approved Phase 4/5 main and passes sequential integration.

Feature List:

- FEAT-041 - Community Persistence Foundation.
- FEAT-042 - Posts API & Feed Read Models.
- FEAT-043 - Comments API.
- FEAT-044 - Like/Unlike Relational Semantics.
- FEAT-045 - Moderation Baseline.
- FEAT-046 - Community UI.
- FEAT-047 - Phase 6 Community Integration Gate.

Inputs:

- Authenticated user context and server-derived identity.
- PostgreSQL/Prisma repository/UoW conventions.
- Product audit governance.
- Optional premium entitlement contract from Phase 7 is not required for base Phase 6.

Outputs:

- Durable posts, comments, likes, moderation state.
- Safe public/authenticated community APIs.
- Community UI if FEAT-046 remains in scope.

Primary APIs:

- `GET /community/posts`
- `POST /community/posts`
- `GET /community/posts/:id`
- `PATCH /community/posts/:id`
- `DELETE /community/posts/:id`
- `GET /community/posts/:id/comments`
- `POST /community/posts/:id/comments`
- `PATCH /community/comments/:id`
- `DELETE /community/comments/:id`
- `PUT /community/posts/:id/like`
- `DELETE /community/posts/:id/like`
- Moderation APIs only through server-side admin authorization if FEAT-045 includes admin operations.

DTOs:

- `CommunityPostDto`
- `CommunityPostCreateRequest`
- `CommunityPostUpdateRequest`
- `CommunityCommentDto`
- `CommunityCommentCreateRequest`
- `CommunityLikeStateDto`
- `ModerationStateDto`

Schema Ownership:

Phase 6 owns community tables only. It may reference `users`. It must not modify Academy, Simulation, Subscription, AI, or auth tables.

Redis Policy:

No durable community state in Redis. Optional feed/cache/rate-limit helpers must be transient, namespaced, TTL-bound, and PostgreSQL-backed.

Audit Policy:

Moderation actions are product-audit candidates. Concrete product audit persistence requires Human-approved activation under FEAT-045 or deferral with risk.

Migration Ownership:

DEV-B owns Phase 6 community migrations. Use reserved names `20261006xxxxxx_feat041_...` through `20261006xxxxxx_feat047_...`.

QA Gate:

FEAT-047 validates ownership, IDOR, duplicate likes, unlike isolation, moderation safety, PostgreSQL constraints, migration upgrade from latest main, and full regression.

Human Decisions:

- Whether Community UI is included before Phase 6 gate or deferred to Phase 9.
- Moderation level: hide-only, report queue, admin actions, or deferred.
- Product audit activation for moderation events.
- Public read policy for posts/feed.

## 7. Phase 7 - Subscription / Premium

Business Objective:

Deliver entitlement-based premium access without client self-upgrade, duplicate provider event issues, or ambiguous premium authority.

Technical Objective:

Create subscription/plan/entitlement persistence, provider abstraction, idempotent provider event handling, entitlement middleware, UI account state, and integration gate.

PHASE 7 EARLIEST SAFE START CONDITION:

PHASE 7 CONTRACT-FIRST PREPARATION may begin after Phase 6 core contracts are frozen. Full Phase 7 production implementation requires Human decisions for provider strategy, plan taxonomy, entitlement keys, and checkout inclusion/deferment. Full Phase 7 integration waits for Phase 6 internal gate if premium checks are applied to Community features, and waits for Phase 5/6 latest main before merge.

Feature List:

- FEAT-048 - Subscription Persistence & Entitlement Foundation.
- FEAT-049 - Plan Catalog & Entitlement Read APIs.
- FEAT-050 - Provider Event Boundary & Idempotent Webhook Processing.
- FEAT-051 - Premium Entitlement Enforcement.
- FEAT-052 - Subscription Account UI.
- FEAT-053 - Subscription Audit, Reconciliation & Operational Controls.
- FEAT-054 - Phase 7 Subscription Integration Gate.

Inputs:

- Authenticated user context.
- PostgreSQL/Prisma repository/UoW and migration governance.
- Product audit governance.
- Optional provider credentials in local/staging/prod only through environment/secret manager.
- Phase 5/6 premium gates are SOFT until concrete features declare premium requirements.

Outputs:

- Durable subscription, plan, entitlement, provider event, and status transition records.
- Safe entitlement APIs/middleware.
- Provider webhook/idempotency boundary.

Primary APIs:

- `GET /plans`
- `GET /me/entitlements`
- `GET /me/subscription`
- `POST /subscriptions/provider/webhook`
- `POST /subscriptions/checkout-session` only if a real checkout provider is approved.
- Admin/operational reconciliation APIs only if FEAT-053 approves them and uses admin guard.

DTOs:

- `PlanDto`
- `EntitlementDto`
- `SubscriptionDto`
- `ProviderEventDto`
- `SubscriptionStatusDto`
- `CheckoutSessionRequest/Response` if checkout is approved.

Schema Ownership:

Phase 7 owns subscription and entitlement tables only. It may reference `users`. It must not modify Community/Simulation/Academy schemas except adding feature-local entitlement checks through APIs/middleware.

Redis Policy:

Redis may be used for transient provider webhook replay throttling or entitlement cache with strict TTL, but PostgreSQL remains entitlement authority.

Audit Policy:

Subscription status transitions, provider webhook processing, entitlement grant/revoke, and reconciliation are high-value product-audit candidates. Concrete audit persistence must follow FEAT-016.

Migration Ownership:

DEV-B owns Phase 7 subscription migrations. Use reserved names `20261007xxxxxx_feat048_...` through `20261007xxxxxx_feat054_...`.

QA Gate:

FEAT-054 validates entitlement authority, no client self-upgrade, provider idempotency, rollback/concurrency, audit policy, migration upgrade from latest approved main, and full regression.

Human Decisions:

- Provider selection: mock-only, Stripe, Lemon Squeezy, Paddle, or another provider.
- Initial plan/entitlement taxonomy.
- Whether checkout is included in Phase 7 or only entitlement backend foundation.
- Trial/grace-period/refund/cancel semantics.
- Which Phase 5/6/Academy features are premium-gated before Phase 9.

## 8. Later Phases

### Phase 8 - Aura Intelligence

Owner: UNASSIGNED.

Objective:

Implement AI gateway, Gemini provider boundary, intent classification, context resolver, prompt versioning, structured output validation, quotas, guardrails, and AI observability.

Dependency:

HARD on Phase 2/3. SOFT on Phase 4/5 context contracts. Optional SOFT on Phase 7 entitlements if AI is premium-gated.

### Phase 9 - UI Integration & Product Polish

Owner: UNASSIGNED.

Objective:

Unify Academy, Simulation, Community, Subscription, profile, admin, and AI experiences with responsive UX, accessibility, loading/error/empty states, and critical E2E journeys.

Dependency:

HARD on whichever product phases are included in the Production MVP cut.

### Phase 10 - Production Hardening

Owner: UNASSIGNED.

Objective:

Complete OpenTelemetry, metrics/traces/logs, security review, dependency scanning, performance tests, E2E suite, backup/restore validation, deployment pipeline, rollback procedure, and operational runbooks.

Dependency:

HARD on Production MVP feature scope decision.

## 9. Critical Path

Project merge/integration critical path:

```text
Phase 4 FEAT-025 -> FEAT-026 -> FEAT-027 -> FEAT-028 -> FEAT-029 decision -> FEAT-030
  -> Phase 5 FEAT-031 -> FEAT-034 -> FEAT-035 -> FEAT-038 -> FEAT-040
  -> sequential integration of Phase 6
  -> sequential integration of Phase 7
```

Parallel implementation critical path:

```text
DEV-A: Phase 4 -> Phase 5
DEV-B: Phase 6 contract-first -> Phase 7 contract-first/internal sequence
```

The risky shared bottleneck is Prisma migration ordering. Contract-first parallel work must reserve phase migration ranges and rebase before merge.

Migration history rule:

- Already approved/applied migrations are immutable.
- Never rename, reorder, or edit an approved/applied migration.
- Existing approved Phase 4 `202609...` migrations remain as-is.
- Reserved future ranges apply only to new/unapplied work:
  - Remaining new Phase 4 work: `20261004xxxxxx_feat025_...` through `20261004xxxxxx_feat030_...`
  - Phase 5: `20261005xxxxxx_feat031_...` through `20261005xxxxxx_feat040_...`
  - Phase 6: `20261006xxxxxx_feat041_...` through `20261006xxxxxx_feat047_...`
  - Phase 7: `20261007xxxxxx_feat048_...` through `20261007xxxxxx_feat054_...`

## 10. Human Decisions Required

Blocking before Phase 5 implementation:

- Complete Phase 4 Human Phase Final Gate.
- Approve Simulation MVP rules: asset universe, starting cash, order types, phase/cycle policy.

Blocking before Phase 6 implementation:

- Decide whether Community UI is in Phase 6 or deferred to Phase 9.
- Decide moderation baseline.
- Decide public feed/read policy.

Blocking before Phase 7 implementation:

- Approve provider strategy and plan/entitlement taxonomy.
- Decide whether checkout is included or deferred.
- Approve initial entitlement keys.

Can defer until integration:

- Which Phase 5/6 features become premium-gated.
- Product audit persistence activation per domain.
- Later Phase 8+ ownership.
