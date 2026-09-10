# Aura Capital - Phase 7 Feature Decomposition

Status: HUMAN APPROVED / PLANNED  
Phase: Phase 7 - Subscription / Premium  
Owner: DEV-B  
Date: 2026-09-07  
Scope: Planning only. Application code changes: ZERO.

Human Master Planning Approval: APPROVED.

Implementation status:

```text
Contract-first preparation may begin after Phase 6 core contracts are frozen
Full production implementation pending Phase 7 Human product decisions
```

## 1. Earliest Safe Start

PHASE 7 CONTRACT-FIRST PREPARATION is eligible after Phase 6 core contracts are frozen.

Phase 7 does not need concrete Community data for core subscription persistence and entitlement APIs. Premium integration with Phase 5/6 surfaces remains SOFT until Human chooses exact premium gates.

Allowed preparation:

- Reading frozen Phase 2/3 contracts and Phase 6 core contracts.
- Detailed feature planning.
- Phase-local interfaces.
- Provider mocks and fixtures.
- Test design.
- Isolated scaffolding that does not commit unresolved provider or product policy.

Full production implementation is not automatically approved by master planning. It requires Human decisions on provider strategy, plan taxonomy, entitlement keys, and checkout inclusion/deferment.

## 2. Phase Boundary

In scope:

- Plans.
- Subscriptions.
- Entitlements.
- Provider abstraction.
- Provider event idempotency.
- Server-side entitlement checks.
- Subscription account UI if approved.

Out of scope:

- Real payment provider integration until Human chooses provider.
- Client self-upgrade without verified provider event.
- Academy/Simulation/Community schema changes except consuming entitlement checks.
- AI quotas unless Phase 8 planning imports entitlement contract.

## 3. Dependency Classification

| Dependency | Type | Reason |
| --- | --- | --- |
| Phase 2 auth/security | HARD | Entitlements are user-scoped. |
| Phase 3 data foundation | HARD | Requires durable PostgreSQL authority and transaction/idempotency. |
| Phase 5 Simulation premium gates | SOFT | Integration depends on Human premium decisions. |
| Phase 6 Community premium gates | SOFT | Integration depends on Human premium decisions. |
| Phase 6 implementation | SOFT | DEV-B owns both; subscription core can proceed contract-first. |

## 4. Feature Sequence

| ID | Title | Type | Dependencies |
| --- | --- | --- | --- |
| FEAT-048 | Subscription Persistence & Entitlement Foundation | Implementation | Phase 2/3 frozen contracts |
| FEAT-049 | Plan Catalog & Entitlement Read APIs | Implementation | FEAT-048 |
| FEAT-050 | Provider Event Boundary & Idempotent Webhook Processing | Implementation | FEAT-048 |
| FEAT-051 | Premium Entitlement Enforcement | Implementation | FEAT-048, FEAT-049 |
| FEAT-052 | Subscription Account UI | Implementation | FEAT-049, FEAT-051 |
| FEAT-053 | Subscription Audit, Reconciliation & Operational Controls | Implementation / hardening | FEAT-048 through FEAT-051 |
| FEAT-054 | Phase 7 Subscription Integration Gate | Validation gate | FEAT-048 through FEAT-053 |

## 5. Feature Details

### FEAT-048 - Subscription Persistence & Entitlement Foundation

Goal: Create durable subscription and entitlement schema.

Scope: plans, subscriptions, entitlement grants, provider account links if required.

Acceptance: PostgreSQL is entitlement authority; no client self-upgrade; migrations fresh/upgrade pass.

### FEAT-049 - Plan Catalog & Entitlement Read APIs

Goal: Serve safe plan and current-user entitlement state.

Scope: public or authenticated plan read, `/me/entitlements`, `/me/subscription`.

Acceptance: no sensitive provider internals; current user only; inactive entitlements omitted or clearly marked.

### FEAT-050 - Provider Event Boundary & Idempotent Webhook Processing

Goal: Process provider events safely and idempotently.

Scope: provider adapter interface, webhook signature validation if provider selected, idempotency keys, event persistence.

Acceptance: duplicate provider events do not duplicate entitlement transitions; invalid signatures rejected.

### FEAT-051 - Premium Entitlement Enforcement

Goal: Provide server-side entitlement checks.

Scope: middleware/service helper, entitlement keys, safe 403 behavior.

Acceptance: client premium flag ignored; entitlement from PostgreSQL; optional Redis cache cannot be authority.

### FEAT-052 - Subscription Account UI

Goal: Show plan/subscription/entitlement state.

Scope: account screen, plan cards, current status, safe upgrade action only if checkout approved.

Acceptance: UI does not imply real billing unless provider is approved; no hidden UI-only authorization.

### FEAT-053 - Subscription Audit, Reconciliation & Operational Controls

Goal: Harden subscription lifecycle.

Scope: transition audit policy, reconciliation checks, operational admin read/repair if approved.

Acceptance: status transitions auditable or explicitly deferred; admin guard enforced; no public privilege escalation.

### FEAT-054 - Phase 7 Subscription Integration Gate

Goal: Validate integrated Subscription/Premium.

Scope: validation only; entitlement authority, provider idempotency, UI, audit, migrations, regression.

Acceptance: no P0/P1 security/integrity defects; full validation PASS; Phase 8 readiness assessed.

## 6. Feature Contract Matrix

| Feature | Requirements | Dependencies | Contracts / APIs | Schema Ownership | Acceptance Gate | Integration Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| FEAT-048 | Durable subscription/entitlement authority | Phase 2/3 frozen contracts | Subscription and entitlement repositories | Owns `plans`, `subscriptions`, `entitlements`, provider account tables if approved | Fresh/upgrade migrations; no self-upgrade path | Must not edit Academy/Simulation/Community tables |
| FEAT-049 | Plan and entitlement reads | FEAT-048 | `GET /plans`, `GET /me/entitlements`, `GET /me/subscription` | Read indexes only | Current user isolation; safe DTOs | Consumers use entitlement DTO only |
| FEAT-050 | Provider boundary and idempotent events | FEAT-048 | `POST /subscriptions/provider/webhook`, provider adapter | Provider event table and idempotency constraints | Duplicate events idempotent; invalid signature rejected | Real provider waits for Human provider decision |
| FEAT-051 | Entitlement enforcement | FEAT-048, FEAT-049 | `assertEntitlement`, premium middleware | No schema unless enforcement metadata approved | Client premium flag ignored; PostgreSQL authority | Phase 5/6 gates integrate via frozen helper |
| FEAT-052 | Account UI | FEAT-049, FEAT-051 | Account/subscription UI API client | No schema | UI accurate, no fake billing claims | Checkout UI only if provider/checkout approved |
| FEAT-053 | Audit/reconciliation/ops | FEAT-048..051 | Admin reconciliation route if approved | Product audit table only if Human activates | Admin-only; status transitions auditable or deferred | Must follow FEAT-016 and not reuse auth audit |
| FEAT-054 | Final validation gate | FEAT-048..053 | Phase QA report | No schema | Full Phase 7 PASS/FAIL gate | Rebase onto latest Phase 6 main before merge |

## 7. Human Decisions Required

Blocking before implementation:

- Payment/provider strategy.
- Initial plan taxonomy.
- Initial entitlement keys.
- Whether checkout is in Phase 7 or deferred.

Deferred until integration:

- Exact premium gates in Academy/Simulation/Community.
- Trial, grace-period, refund, cancel semantics.
- Product audit persistence activation.
