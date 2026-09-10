# Aura Capital - Phase 5 Feature Decomposition

Status: HUMAN APPROVED / PLANNED  
Phase: Phase 5 - Simulation Engine  
Owner: DEV-A  
Date: 2026-09-07  
Scope: Planning only. Application code changes: ZERO.

Human Master Planning Approval: APPROVED.

Implementation status:

```text
BLOCKED by Phase 4 Human Phase Final Gate
```

## 1. Phase Boundary

Phase 5 builds a server-authoritative individual financial simulation.

In scope:

- Simulation sessions.
- Simulated assets and scenario configuration.
- Server clock/phase/market engine.
- Order intents.
- Trade execution.
- Positions and portfolio accounting.
- Settlement and event history.
- Simulation read APIs and UI.
- Optional Redis cache/locks/leaderboard, never durable authority.

Out of scope:

- Real-money trading.
- Brokerage integration.
- Community behavior.
- Subscription payment provider behavior.
- AI coaching.
- Academy schema redesign.

## 2. Dependency Classification

| Dependency | Type | Reason |
| --- | --- | --- |
| Phase 2 auth/security | HARD | Simulation sessions are user-owned and protected. |
| Phase 3 data foundation | HARD | Requires PostgreSQL migrations, transactions, constraints, Redis boundary. |
| Phase 4 Academy outputs | INDEPENDENT | Simulation MVP does not consume Academy data. Phase 4 completion remains governance sequencing. |
| Phase 7 entitlements | SOFT | Premium-gated simulation features can be integrated after entitlement contract freezes. |
| Phase 8 AI | INDEPENDENT | AI coaching comes later. |

## 3. Feature Sequence

| ID | Title | Type | Dependencies |
| --- | --- | --- | --- |
| FEAT-031 | Simulation Persistence Foundation | Implementation | Phase 3, Phase 4 Human Phase Final Gate by governance |
| FEAT-032 | Server Clock, Market Scenario & Phase Engine | Implementation | FEAT-031 |
| FEAT-033 | Order Intent API & Validation | Implementation | FEAT-031, FEAT-032 |
| FEAT-034 | Trade Execution & Portfolio Accounting | Implementation | FEAT-033 |
| FEAT-035 | Simulation Settlement, Events & Snapshots | Implementation | FEAT-034 |
| FEAT-036 | Simulation Read Models & Dashboard APIs | Implementation | FEAT-031, FEAT-035 |
| FEAT-037 | Simulation Leaderboard & Redis Cache Boundary | Implementation | FEAT-035, FEAT-036 |
| FEAT-038 | Simulation Learner UI | Implementation | FEAT-036 |
| FEAT-039 | Simulation Security, Audit & Abuse Hardening | Hardening | FEAT-033 through FEAT-038 |
| FEAT-040 | Phase 5 Simulation Integration Gate | Validation gate | FEAT-031 through FEAT-039 |

## 4. Feature Details

### FEAT-031 - Simulation Persistence Foundation

Goal: Create durable simulation schema and repositories.

Scope: `SimulationSession`, `SimulationAsset`, `SimulationScenario`, `MarketSnapshot`, `SimulationEvent`, initial `Portfolio`, `Position`, `Order`, and `Trade` schema boundaries if required by the approved design.

Deliverables: Prisma migration, repositories, DB constraints, test fixtures.

Acceptance: fresh/upgrade migrations pass; user FK restricts/cascades as approved; no client-authoritative fields; no Academy/Community/Subscription/AI schema.

### FEAT-032 - Server Clock, Market Scenario & Phase Engine

Goal: Make server the authority for phase, cycle, simulated time, and market scenario progression.

Scope: deterministic clock service, phase rules, scenario seed, market state computation.

Acceptance: client time input ignored; GET does not mutate; deterministic tests pass; invalid phases rejected.

### FEAT-033 - Order Intent API & Validation

Goal: Accept user order intent without trusting client price/balance/phase.

Scope: order request schema, authenticated route, server-side eligibility checks, safe errors.

Acceptance: invalid order types rejected; missing auth rejected; user cannot trade for another user; client price ignored.

### FEAT-034 - Trade Execution & Portfolio Accounting

Goal: Execute valid orders transactionally and update portfolio/positions.

Scope: balance checks, oversell rejection, trade records, position updates, transaction rollback.

Acceptance: insufficient balance rejected; oversell rejected; concurrent orders preserve balance/position integrity.

### FEAT-035 - Simulation Settlement, Events & Snapshots

Goal: Persist deterministic settlement and event history.

Scope: settlement service, event records, market/portfolio snapshots.

Acceptance: settlement idempotent; event ordering deterministic; historical snapshots remain meaningful after scenario changes.

### FEAT-036 - Simulation Read Models & Dashboard APIs

Goal: Serve safe simulation state to the learner UI.

Scope: session state, portfolio, positions, orders, trades, event history.

Acceptance: only owner can read private simulation state; DTOs mark data as simulated; no sensitive internals.

### FEAT-037 - Simulation Leaderboard & Redis Cache Boundary

Goal: Add optional leaderboard/cache without moving authority out of PostgreSQL.

Scope: Redis transient cache, TTL, rebuild from PostgreSQL, outage behavior.

Acceptance: Redis loss does not corrupt durable results; leaderboard can rebuild; keys sanitized/namespaced.

### FEAT-038 - Simulation Learner UI

Goal: Build learner-facing simulation interface.

Scope: dashboard, order ticket, portfolio, market state, history, loading/error/empty states.

Acceptance: UI clearly says simulation; no gambling-like UX; no hidden UI auth assumption.

### FEAT-039 - Simulation Security, Audit & Abuse Hardening

Goal: Harden simulation against tampering and abuse.

Scope: ownership, IDOR, replay/double-submit, product audit decision, rate-limit/quota where needed.

Acceptance: client cannot change balance/price/phase; audit policy follows FEAT-016; high-value mutations tested.

### FEAT-040 - Phase 5 Simulation Integration Gate

Goal: Validate integrated Phase 5.

Scope: validation only; full simulation lifecycle, migrations, Redis, audit, UI, regression.

Acceptance: no P0/P1 security/integrity defects; full validation PASS; Phase 6 integration readiness assessed.

## 5. Feature Contract Matrix

| Feature | Requirements | Dependencies | Contracts / APIs | Schema Ownership | Acceptance Gate | Integration Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| FEAT-031 | Durable simulation persistence, constraints, repositories | Phase 2/3; Phase 4 Human Phase Final Gate by governance | Repository interfaces for sessions/assets/portfolio/orders/trades/events | Owns `simulation_sessions`, `simulation_assets`, `simulation_scenarios`, initial portfolio/order/trade tables | Fresh/upgrade migrations, FK/unique/check constraints, repository boundary | Must preserve Phase 1-4 migrations and auth regressions |
| FEAT-032 | Server-owned clock/phase/market state | FEAT-031 | Internal engine contracts, no public mutation via GET | May add phase/scenario fields if not in FEAT-031 | Deterministic phase tests; client time ignored | Must use server clock and deterministic seeds |
| FEAT-033 | Order intent validation and safe API | FEAT-031, FEAT-032 | `POST /simulation/sessions/:id/orders`, `OrderIntentRequest`, `OrderDto` | Owns order table additions/indexes | Invalid order/client price rejected; owner-only | Must not mutate portfolio outside transaction path |
| FEAT-034 | Trade execution and accounting | FEAT-033 | Trade execution service, portfolio/position repositories | Owns trades, positions, portfolio balance fields | Insufficient balance/oversell/concurrency tests PASS | Must use UoW and PostgreSQL constraints |
| FEAT-035 | Settlement/events/snapshots | FEAT-034 | Settlement service and `SimulationEventDto` | Owns settlement/event/snapshot tables | Idempotent deterministic settlement; event order stable | Must preserve historical meaning after config changes |
| FEAT-036 | Safe read models | FEAT-031, FEAT-035 | `GET /simulation/sessions/:id/state`, portfolio/order/event reads | No new authority beyond read indexes/views if approved | Owner-only reads; simulated-data marker present | UI and future AI consume read DTOs only |
| FEAT-037 | Leaderboard/cache boundary | FEAT-035, FEAT-036 | `LeaderboardEntryDto`; Redis key namespace | PostgreSQL remains leaderboard authority; Redis cache only | Redis loss/rebuild/outage tests PASS | Must not affect settlement/portfolio truth |
| FEAT-038 | Learner UI | FEAT-036 | Central API client calls, UI route contracts | No schema | Desktop/mobile smoke, accessibility, no gambling-like copy | Must consume safe DTOs and display simulated-data warnings |
| FEAT-039 | Security/audit hardening | FEAT-033..038 | Ownership checks, product audit decision, abuse limits | May add audit table only if Human activates product audit | IDOR/tampering/replay tests PASS | Must preserve auth/RBAC/Redis/audit boundaries |
| FEAT-040 | Final validation gate | FEAT-031..039 | Phase QA report | No schema | Full Phase 5 PASS/FAIL gate | Fresh DB, upgrade DB, Redis, UI/E2E, regression |

## 6. Human Decisions Required

Blocking before implementation:

- Phase 4 Human Phase Final Gate approval.
- Starting cash.
- Asset universe.
- Order types.
- Phase/cycle duration rules.
- Whether leaderboard is in MVP.

Deferred until integration:

- Premium-gated simulation capabilities.
- Concrete product audit persistence.
