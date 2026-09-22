# Aura Capital - Phase 7 Feature Decomposition

Status: HUMAN MASTER PLANNING APPROVED
Phase: Phase 7 - Subscription / Premium
Planning Rework Iteration: 1 - B-01 through B-06 addressed
Planning / Architecture Owner: Codex
Implementation Owner: DEV-B / Antigravity
Human Owner: Master Planning Approval and Phase Final Gate
Baseline: `phase-6-approved`
Scope: Planning only; application, test, schema, and migration changes are zero.

## 1. Current Governance State

```text
Phase 6: DONE / QA PASS / HUMAN PHASE FINAL GATE APPROVED
Phase Checkpoint: phase-6-approved PUBLISHED
Phase 7 Planning: HUMAN MASTER PLANNING APPROVED
Phase 7 Implementation: IN_PROGRESS
Human Decisions D1..D10: APPROVED
FEAT-048: DONE / INTERNAL FEATURE GATE PASS / feat-048-approved PUBLISHED
FEAT-049: UNBLOCKED FOR IMPLEMENTATION
FEAT-051: DONE / INTERNAL FEATURE GATE PASS / feat-051-approved PUBLISHED
FEAT-052: BLOCKED PENDING FEAT-049; FEAT-051 PREREQUISITE SATISFIED
FEAT-050, FEAT-053..FEAT-057: PLANNED / DEPENDENCY CONTROLLED
Phase 8: BLOCKED
```

Historical planning snapshot: the earlier FEAT-048..FEAT-054 contract-first roadmap was recorded as `HUMAN APPROVED / PLANNED`. Human Master Planning now approves the detailed FEAT-048..FEAT-057 map in this document, which supersedes that preliminary feature map as implementation authority.

## 2. Phase Goal And Boundary

Goal: deliver server-authoritative subscription and entitlement foundations without client self-upgrade, unverified provider state, duplicate-event corruption, payment credential storage, or Redis durable authority.

In scope:

- Minimal subscription persistence and lifecycle history.
- Server-owned FREE/PREMIUM plan catalog proposal and capability-based entitlement resolution.
- Safe current-user subscription reads.
- Provider-independent adapter boundary and strictly isolated development/test mock.
- Verified, durable, idempotent provider event processing.
- Subscription lifecycle commands and reconciliation.
- Reusable server-side entitlement guard.
- Dedicated subscription transition audit proposal under FEAT-016 governance.
- Learner subscription account UI, subject to provider/checkout decisions.
- Final Phase 7 integration/security gate.

Out of scope unless Human explicitly expands Phase 7:

- Storing card numbers, CVV, raw payment credentials, or full webhook payloads.
- Client-controlled premium, plan, status, entitlement, billing, dates, provider IDs, or user IDs.
- Public self-upgrade or manual premium grant endpoints.
- Refund, invoice, tax, coupon, metered billing, seat, organization, marketplace, or multi-currency systems.
- Admin/support override, refund, or repair UI/API.
- Actual premium gating of Academy, Simulation, Community, or Phase 8 AI capabilities.
- Durable Redis subscription state.
- Reuse of `AuthSecurityAuditRecord` for product events.

## 3. Approved Architecture Decisions

### 3.1 Plan And Entitlement Model

- D2 approved: tier set is exactly `FREE`, `PREMIUM`; no additional commercial tier in Phase 7.
- Plan catalog is configuration-backed and server-owned. This avoids production seed/data-migration ambiguity and keeps provider price identifiers out of public DTOs.
- Approved initial entitlement taxonomy: `FREE -> []` and `PREMIUM -> [PREMIUM_ACCESS]`. Domain-specific keys require a future explicit Human decision.
- A missing subscription record resolves to `FREE` with no premium entitlement.
- No durable `isPremium` flag and no user-editable entitlement row are introduced.
- Entitlements are resolved from the authoritative PostgreSQL subscription record, server-owned plan mapping, status, period bounds, and cancellation state.

### 3.2 Minimal Durable Model

FEAT-048 is the only Phase 7 migration owner and owns the approved durable model:

- `UserSubscription`: immutable UUID, user FK, plan key, lifecycle status, provider key, external subscription identifier, current-period bounds, cancel-at-period-end flag, provider ordering marker, timestamps.
- `SubscriptionProviderEvent`: provider/event identity, normalized event type, occurrence/processing timestamps, processing outcome, safe payload digest/metadata, and optional subscription relation. Unique `(providerKey, providerEventId)` is the durable idempotency authority.
- `SubscriptionTransitionRecord`: append-only before/after plan/status facts, actor/source, correlation/request ID, transaction strategy, safe metadata, and timestamps.

No `SubscriptionPlan` or per-user `SubscriptionEntitlement` table is approved. Any later database-backed plan or manual grant requirement must return to Human planning before schema work.

### 3.3 Cardinality And Integrity

- A user may retain historical terminal subscriptions.
- At most one non-terminal subscription (`ACTIVE` or `PAST_DUE`) may exist per user, enforced by PostgreSQL.
- `(providerKey, externalSubscriptionId)` is unique when present.
- Provider events are append-only and uniquely identified by provider-controlled event identity.
- User deletion is RESTRICT/NO ACTION while subscription/event/history records exist unless a later retention/erasure policy is Human-approved.
- Provider event, subscription mutation, and core event-processing result use FEAT-013 Unit of Work where atomicity is required.

### 3.4 Approved Lifecycle

Closed status set: `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`.

- No record -> FREE/no premium entitlement.
- `ACTIVE` -> entitlement is active only while the authoritative period is valid.
- D3 approved: no trial, `TRIAL`, `TRIALING`, `trialUntil`, or implicit trial entitlement in Phase 7.
- D4 approved: `PAST_DUE` has no grace period and grants no `PREMIUM_ACCESS`.
- D5 approved: `ACTIVE + cancelAtPeriodEnd=true` remains entitled only until authoritative `currentPeriodEnd`; at that valid boundary it transitions to `EXPIRED`.
- `CANCELLED` is reserved for a provider-confirmed immediate cancellation before normal period expiry, and is used only when the Human-selected provider supports that exact semantic.
- `EXPIRED` means the authoritative service period ended without an earlier provider-confirmed immediate cancellation, including cancel-at-period-end reaching `currentPeriodEnd`.
- `CANCELLED` and `EXPIRED` are terminal and deny premium. Implementation may not infer one from the other or revive either record.
- A later verified resubscription creates a new subscription record; terminal records are not rewritten into a new commercial agreement.

Allowed transitions are provider-event driven or provider-verified command outcomes. Stale, impossible, or client-authored transitions fail closed.

### 3.5 Provider And Event Boundary

Provider adapters own checkout/cancel/fetch/signature verification/event normalization. Domain services consume normalized provider results and never parse provider-specific payloads directly.

Raw webhook bytes may exist ephemerally for signature verification but are not durably stored or logged. Before verification, payload fields have zero authority. The normalized event contract includes provider event ID, event type, provider subscription ID, occurred-at time, optional provider sequence/version, and allowlisted state facts.

Out-of-order policy:

- Use a provider-guaranteed monotonic sequence/version when available.
- If no trustworthy ordering marker exists, fetch canonical provider state before mutation.
- Event timestamp alone must not silently authorize a downgrade or upgrade.
- Duplicate delivery returns a safe idempotent outcome and performs no second business transition.

D1 approved for the current Phase 7 foundation: production provider integration is deferred and no production billing SDK is selected.

- FEAT-051 implements the provider-neutral port, canonical provider types, and isolated local/test/CI mock; production adapter is deferred.
- FEAT-052 implements provider-neutral verification, normalization, durable idempotency, and mock/test verified-event behavior; production provider-specific signature adapter is deferred.
- FEAT-053 implements provider-neutral lifecycle orchestration; production checkout/cancel adapter is deferred.
- FEAT-056 must not claim production payment capability.

Mock adapters are permitted only under explicit local development, isolated test, or CI predicates and must fail closed in staging, production, production-like, unknown, or conflicting environments before mutation.

### 3.6 Approved Authorization And API Contract

Approved routes and policies:

- `GET /api/subscriptions/plans`: PUBLIC SAFE READ of plan key, safe display name, safe benefit copy, and availability only.
- `GET /api/subscriptions/me`: authenticated current-user subscription and effective entitlement projection.
- Production `POST /api/subscriptions/checkout`, cancellation, and provider-webhook routes are deferred and MUST NOT exist in the current approved Phase 7 foundation.
- Provider-neutral checkout/cancellation/event contracts may be exercised only through explicitly isolated local/test/CI adapters or harnesses; those harnesses are not public production APIs and cannot grant authority from unverified intent.

Entitlement enforcement pattern:

```text
authenticate
-> load authoritative subscription from PostgreSQL
-> resolve effective entitlements using server-owned mapping and clock
-> requireEntitlement(key)
-> handler
```

The guard is reusable by later approved domain integrations. D9 approval defers all Academy, Simulation, Community, and Aura Intelligence premium gating during Phase 7.

### 3.7 Approved Audit Strategy

D6 approved: dedicated subscription transition history (`SubscriptionTransitionRecord`), not a global product-audit table and never `AuthSecurityAuditRecord`.

Options evaluated:

- Approved option - dedicated subscription transition history. It keeps the Phase 7 migration and transaction semantics inside the owning domain and supports provider-event correlation.
- Rejected for Phase 7 - general product-audit persistence. It remains outside scope unless a future Human decision expands it.
- Provider-event rows alone are insufficient: they prove ingestion/idempotency but do not express actor/source, before/after lifecycle facts, or the approved transaction strategy for every business transition.

- Activation/upgrade entitlement grants: `TRANSACTIONALLY_COUPLED`; missing audit invalidates the grant.
- Downgrade/revocation/cancellation effects: `STATE_FIRST`; access reduction commits even if the separate product-audit write fails, with sanitized alerting and reconciliation/backfill evidence.
- Informational provider retries/duplicate observations: `BEST_EFFORT` unless they change durable state.
- Provider event records remain core idempotency/processing evidence and are not a substitute for auth/security audit.
- Metadata is flat, allowlisted, sanitized, size-bounded, and excludes payment credentials, raw payloads, email, token, cookie, secret, and provider authentication material.

D6 approval activates this subscription-specific FEAT-016 strategy for FEAT-048 implementation.

Audit responsibility is exclusive by origin and phase:

| Feature | Audit responsibility |
| --- | --- |
| FEAT-048 | Owns `SubscriptionTransitionRecord` schema and repository primitives only; it implements no transition-producing service. |
| FEAT-052 | Writes provider-event-originated transition records and owns their required transaction/audit coupling. |
| FEAT-053 | Writes command/reconciliation-originated transition evidence only when those operations produce a business transition. |
| FEAT-055 | Hardens audit integrity, verifies existing origin writers, reconciles audit-pending evidence, and performs failure recovery/operational audit reconciliation. It does not own normal transition production and is not required for FEAT-052 basic provider-transition correctness. |

### 3.8 Redis And Failure Boundary

- PostgreSQL is the sole durable authority for subscription status, entitlement, provider events, lifecycle, and audit history.
- Redis may provide transient endpoint rate limits or a non-authoritative cache with TTL only when justified.
- Cache miss/outage must fall back to PostgreSQL for reads; a stale cache must never grant entitlement.
- Checkout/cancel writes fail closed if their approved abuse-protection dependency is unavailable before provider/DB mutation.
- Webhook outage behavior must return a retryable safe failure without acknowledging an uncommitted event.
- Exact numeric limits wait for the selected provider's retry/traffic contract and feature-level Human approval.

### 3.9 Rate Limits, Errors, And Observability

- Production commerce limits are not invented because D1/D10 defer production provider and checkout.
- Mock/dev/test provider mutation endpoints use bounded test-safe, configuration-defined limits. Redis remains transient-only and unavailable Redis fails mutation closed before provider/DB mutation.
- Any future production provider implementation must return to Human planning and define user ceiling, source ceiling, window, exact `Retry-After`, Redis outage policy, and provider retry/idempotency semantics before implementation.
- Webhook abuse protection must preserve the selected provider's retry/signature contract. PostgreSQL uniqueness remains the idempotency authority; a Redis decision cannot acknowledge an uncommitted event.
- Subscription reads do not receive a new Phase 7 limiter by default. Existing platform controls remain; a dedicated read limit requires measured abuse evidence and an approved contract.
- Canonical external failures distinguish unauthenticated, entitlement required, invalid request/plan, invalid signature, invalid transition, throttled, provider unavailable, and sanitized infrastructure failure. Duplicate committed provider delivery is a safe idempotent outcome, not an authorization signal.
- Structured observability covers provider latency/availability, signature failures, duplicate/replay and stale events, transition outcomes, reconciliation backlog, audit-pending records, and entitlement denials.
- Metrics/logs use bounded server-controlled labels. They exclude payment data, raw webhook bodies, provider/customer/subscription identifiers where sensitive, credentials, secrets, tokens, cookies, and unbounded client metadata.

### 3.10 Candidate Premium Integration Points

Phase 7 supplies a reusable entitlement guard but activates none of these candidates unless D9 is revised and the owning domain receives an approved integration spec:

| Domain | Candidate future capability | Phase 7 state |
| --- | --- | --- |
| Academy | premium lessons, quizzes, or advanced learning paths | Mapped only; not gated |
| Simulation | advanced scenarios, analytics, or expanded limits | Mapped only; not gated |
| Community | premium publishing/community capabilities | Mapped only; not gated |
| Aura Intelligence / Phase 8 | premium AI usage or advanced context tools | Future dependency only; not implemented |

The initial entitlement remains `PREMIUM_ACCESS`. Domain-specific entitlement keys require the owning feature to define behavior, authorization placement, downgrade effects, tests, and Human approval.

### 3.11 Learner UI And Deferred Commerce

- D8 approved: canonical learner route is `/subscription`, following the repository's top-level singular domain route convention.
- The page may show current plan, status, safe benefits, and period/cancellation state. It has no admin/support surface.
- D10 approved: real production checkout is deferred. Phase 7 delivers provider-neutral checkout contracts and mock/dev/test flows only.
- The learner page is informational/read-only for production commerce and may render capability unavailable. It has no production purchase/cancel CTA.
- Fake checkout, fake premium buttons, client premium mutation, embedded payment collection, and production mock fallback are prohibited.

## 4. Approved Feature Sequence

| ID | Title | Type | Dependencies | ACs | Tasks | Migration |
| --- | --- | --- | --- | ---: | ---: | --- |
| FEAT-048 | Subscription Domain Schema & Persistence Foundation | Implementation | `phase-6-approved`, Phase 2/3 contracts, D2/D3/D4/D5/D6 | 24 | 16 | Sole Phase 7 owner |
| FEAT-049 | Plan Catalog & Entitlement Resolution | Implementation | FEAT-048, D2/D3/D4/D9 | 18 | 12 | Zero |
| FEAT-050 | Subscription Read APIs | Implementation | FEAT-049 | 16 | 11 | Zero |
| FEAT-051 | Provider Abstraction & Development Mock Isolation | Implementation | FEAT-048, D1/D10 | 20 | 14 | Zero |
| FEAT-052 | Verified Provider Events & Idempotent Processing | Security/integration | FEAT-048, FEAT-049, FEAT-051, D1 | 28 | 18 | Zero |
| FEAT-053 | Subscription Lifecycle Commands | Implementation/hardening | FEAT-049, FEAT-052, D4/D5/D10 | 24 | 16 | Zero |
| FEAT-054 | Premium Entitlement Authorization Guard | Security foundation | FEAT-049 | 20 | 14 | Zero |
| FEAT-055 | Subscription Audit & Reconciliation | Integrity/hardening | FEAT-052, FEAT-053, D6/D7 | 22 | 15 | Zero |
| FEAT-056 | Subscription Learner UI | Frontend implementation | FEAT-050, FEAT-053, FEAT-054, D8/D10 | 20 | 14 | Zero |
| FEAT-057 | Phase 7 Independent Integration QA | Validation gate | FEAT-048..FEAT-056 | 36 | 22 | Zero |

Locked baseline: **228 acceptance criteria** and **152 tasks**.

## 5. Dependency Graph

```text
phase-6-approved
      |
   FEAT-048
      |
  +---+----------------+
  |                    |
FEAT-049             FEAT-051
  |                    |
  +--> FEAT-050       FEAT-052 <--- FEAT-049
  |                    |
  +--> FEAT-054        +--> FEAT-053
                              |
                         +----+----+
                         |         |
                      FEAT-055  FEAT-056 <--- FEAT-050/054
                         |         |
                         +----+----+
                              |
                           FEAT-057
                              |
                    Human Phase Final Gate
```

The graph is acyclic. FEAT-057 remains last.

## 6. Parallelization Plan

- FEAT-048 implementation is exclusive because it owns all Phase 7 schema and the single additive migration.
- After FEAT-048 contracts freeze, FEAT-049 and FEAT-051 may prepare and implement in parallel on isolated branches.
- FEAT-050 may begin after FEAT-049 DTOs freeze.
- FEAT-052 follows FEAT-051 and implements only the approved provider-neutral/mock-test branch.
- FEAT-054 may proceed after FEAT-049 without waiting for provider ingestion.
- FEAT-053 follows FEAT-052 and may coordinate provider commands/reconciliation.
- FEAT-055 follows lifecycle/event behavior so its event taxonomy and failure policy are concrete.
- FEAT-056 may prepare visual states after FEAT-050 contracts freeze and must enforce the approved D8 `/subscription` route plus D10 production-commerce deferral; it adds no checkout/cancel integration.
- FEAT-057 executes only after FEAT-048..056 gates complete and branches are integrated on the latest approved baseline.

No parallel feature may create or edit a Phase 7 migration.

## 7. QA Strategy

Implementation features use self-verification, targeted unit/API/PostgreSQL/provider-adapter/UI tests, canonical 14, exact-commit CI, checkpoint publication, and an internal feature gate. Feature-level independent QA is required only for P0/P1, self-upgrade bypass, authentication/entitlement bypass, provider-signature bypass, idempotency failure, state corruption, migration failure, audit-integrity failure, payment/secret leakage, or canonical validation failure. Documentation-only findings use governance correction plus Human targeted review.

FEAT-048..FEAT-056 become eligible for FEAT-057 when they are implemented, feature-gated under approved Phase 7 Fast-Track governance, CI-green, checkpointed, and integrated. They do not each require independent QA unless an escalation condition occurs.

FEAT-057 performs full independent Phase QA covering:

- Fresh migration and real upgrade from `phase-6-approved` with representative Identity, Academy, Simulation, Community, auth-audit, and Phase 7 rows.
- No-record FREE behavior and server-authoritative entitlement decisions.
- Valid/invalid provider-neutral mock/test verification artifacts, duplicate and concurrent events, out-of-order delivery, provider outage, retry, cancellation, expiry, and reconciliation, with no production webhook/signature surface.
- Transaction/audit strategies and no `AuthSecurityAuditRecord` misuse.
- No payment credential/raw webhook leakage.
- Redis transient-only and outage behavior.
- Learner `/subscription` UI and real authenticated read-only runtime journey, including proof that production commerce navigation and CTAs are absent.
- Phase 2 through Phase 6 regressions, canonical validation, exact-commit CI, and zero unresolved P0/P1.

## 8. Human Decision Register

| ID | Decision | Approved disposition | Consequence |
| --- | --- | --- | --- |
| D1 | Production billing provider | **APPROVED:** defer production provider integration | Provider-neutral port/mock only; production adapter/signature SDK deferred |
| D2 | Tier model | **APPROVED:** `FREE`, `PREMIUM`; configuration catalog; no DB plan table | FEAT-048/049 locked |
| D3 | Trial policy | **APPROVED:** no trial or trial fields/entitlement | FEAT-048 lifecycle locked |
| D4 | PAST_DUE grace | **APPROVED:** no grace and no `PREMIUM_ACCESS` | Fail closed |
| D5 | Cancellation | **APPROVED:** cancel-at-period-end -> `EXPIRED`; immediate provider-confirmed cancel -> `CANCELLED`; both terminal | New verified subscription required to regain ACTIVE |
| D6 | Product audit persistence | **APPROVED:** dedicated `SubscriptionTransitionRecord`; no global/auth audit reuse | FEAT-048/052/053/055 ownership locked |
| D7 | Manual/admin override | **APPROVED:** defer all grant/set-plan/repair/support override API/UI | No override surface |
| D8 | Learner UI | **APPROVED:** `/subscription`; safe learner state; no admin UI | Production commerce unavailable state |
| D9 | Existing-domain gates | **APPROVED:** defer Academy/Simulation/Community/Aura Intelligence gating | FEAT-054 guard only |
| D10 | Real checkout | **APPROVED:** defer real production checkout | Provider-neutral contracts/mock-test flows only; no production CTA |

All ten Human decisions are approved and locked. No implementation agent may reinterpret them or alter AC semantics to make a defect pass.

## 9. Completion And Phase Gates

- Master Planning Rework Iteration 1 preserves 228 ACs / 152 tasks and resolves B-01..B-06.
- Human Master Planning approval locks the decomposition and D1..D10 decisions.
- This detailed approved decomposition supersedes preliminary Phase 7 feature references in cross-phase planning documents.
- Each feature requires its own approved spec and predecessor gate before implementation.
- FEAT-048 is the only migration owner; its migration is additive, forward-only, fresh-deploy reproducible, and upgrade-safe from `phase-6-approved`.
- FEAT-057 PASS plus Human Phase Final Gate approval is required to close Phase 7.
- Phase 8 remains blocked throughout planning and implementation until the Phase 7 Human Final Gate.
