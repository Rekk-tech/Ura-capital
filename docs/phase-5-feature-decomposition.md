# Aura Capital - Phase 5 Feature Decomposition

Status: MASTER PLANNING APPROVED
Phase: Phase 5 - Simulation Engine
Owner after approval: DEV-A / Antigravity
Planning Owner: Codex
Architecture Owner: Codex
QA Governance Owner: Codex
Date: 2026-09-14
Scope: Phase 5 Simulation Engine governance and feature decomposition.
Human Master Planning Decision: APPROVED.

## 1. Canonical State

```text
Phase 4: DONE / QA PASS / Human Phase Final Gate APPROVED
Phase 5: READY FOR HUMAN PHASE FINAL GATE
Implementation: IN_PROGRESS
FEAT-031: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS, Git Checkpoint: PUBLISHED, CI: GREEN, Tag: feat-031-approved)
FEAT-032: DONE / INTEGRATED (Self-Verification: PASS; QA Independence: REDUCED)
FEAT-033: DONE / INTEGRATED (Internal Feature Gate: PASS)
FEAT-034: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-035: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS, Git Checkpoint: PUBLISHED, CI: GREEN, Tag: feat-035-approved)
FEAT-036: DONE (Implementation: COMPLETE, Self-Verification: PASS, QA Independence: REDUCED, Git Checkpoint: PUBLISHED, CI: GREEN, Tag: feat-036-approved)
FEAT-037: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-038: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-039: DONE (Implementation: COMPLETE, Internal Feature Gate: PASS)
FEAT-040: QA TECHNICAL BASELINE PASS / GOVERNANCE CLOSURE PASS (Human Phase Final Gate: NOT YET APPROVED)
```

## 2. Human-Approved MVP Decisions

| Decision | Approved Value |
| --- | --- |
| Starting cash | `100000.0000` simulated USD units |
| Display denomination | USD simulation only |
| Asset universe | fixed mock equities only |
| External market provider | DEFERRED |
| Market model | server-owned deterministic persisted snapshots |
| Scenario scope | single deterministic MVP scenario |
| Market timeline | server-controlled discrete integer cycles |
| Order type | MARKET only |
| Fractional quantity | DEFERRED |
| Short selling | DEFERRED |
| Margin / leverage | DEFERRED |
| Options / derivatives | OUT OF SCOPE |
| Crypto | OUT OF SCOPE |
| Trading fee | 0 |
| Slippage | 0 |
| Execution price | authoritative current market snapshot price |
| Historical valuation chart | DEFERRED |
| Leaderboards | OUT OF SCOPE |
| Competitions / multi-user simulation | OUT OF SCOPE |
| Admin/support Simulation visibility | DEFERRED |
| Durable Simulation product audit | DEFERRED FOR PHASE 5 |
| Real money | HARD BOUNDARY - prohibited |
| Brokerage integration | HARD BOUNDARY - prohibited |

Unresolved Human Decisions: ZERO for Phase 5 master planning decisions covered by this package.

## 3. Feature Matrix

| ID | Title | Type | Dependencies | State |
| --- | --- | --- | --- | --- |
| FEAT-031 | Simulation Domain Schema & Persistence Foundation | Implementation | Phase 2, Phase 3, Phase 4 approved | DONE (Internal Feature Gate: PASS, Tag: feat-031-approved) |
| FEAT-032 | Asset Universe & Market Snapshot Read Model | Implementation | FEAT-031 | DONE / INTEGRATED |
| FEAT-033 | Simulation Session Lifecycle | Implementation | FEAT-031 | DONE / INTEGRATED |
| FEAT-034 | Portfolio & Position Accounting Foundation | Implementation | FEAT-032 + FEAT-033 | DONE (Internal Feature Gate: PASS) |
| FEAT-035 | Market Order Submission & Execution | Implementation | FEAT-034 | DONE (Internal Feature Gate: PASS) |
| FEAT-036 | Order Idempotency & Concurrency Adversarial Hardening | Hardening | FEAT-035 | DONE (Self-Verification: PASS) |
| FEAT-037 | Current PnL & Portfolio Valuation | Implementation | FEAT-036 | DONE (Internal Feature Gate: PASS) |
| FEAT-038 | Simulation Learner UI | Implementation | FEAT-037 | DONE (Internal Feature Gate: PASS) |
| FEAT-039 | Simulation Authorization, Rate Limit & Audit-Deferral Hardening | Hardening / governance | FEAT-038 | DONE (Internal Feature Gate: PASS) |
| FEAT-040 | Phase 5 Simulation Integration Gate | Validation gate | FEAT-039 | QA TECHNICAL BASELINE PASS / GOVERNANCE CLOSURE PASS |

## 4. Dependency Graph

```text
FEAT-031
   |-- FEAT-032
   |-- FEAT-033

FEAT-032 + FEAT-033
   -> FEAT-034
   -> FEAT-035
   -> FEAT-036
   -> FEAT-037
   -> FEAT-038
   -> FEAT-039
   -> FEAT-040
```

FEAT-032 and FEAT-033 may be planned independently after FEAT-031. With the current single Antigravity implementation session, implementation remains sequential unless Human explicitly changes delivery mode.

## 5. FEAT-031 Exact Model List

FEAT-031 owns these Phase 5 models:

1. `SimulationScenario`
2. `SimulationAsset`
3. `SimulationMarketSnapshot`
4. `SimulationSession`
5. `SimulationPortfolio`
6. `SimulationPosition`
7. `SimulationOrder`
8. `SimulationTrade`

No product audit table, leaderboard table, competition table, subscription table, community table, or external provider table is approved in Phase 5 master planning.

## 6. Scenario / Cycle Model

Canonical scenario model:

- `SimulationScenario` owns deterministic scenario metadata.
- `SimulationMarketSnapshot` belongs to one scenario and one asset.
- `SimulationSession` stores `scenarioId` and `currentCycle`.
- No separate cycle table is introduced in Phase 5 MVP.

Cycle numbering:

- Integer and one-based.
- The first learner-visible and persisted market cycle is `1`.
- Cycle `0` is not a valid persisted Simulation market cycle in Phase 5.

Snapshot uniqueness:

```text
scenarioId + cycle + assetId
```

Snapshot immutability:

- Once a snapshot is used for order execution, normal application behavior must not update or delete it.
- Correction workflows are out of scope unless Human approves operational repair semantics.

## 7. Monetary Precision Contract

Canonical durable precision:

| Value | Storage |
| --- | --- |
| cash | `NUMERIC(20,4)` / Prisma Decimal |
| notional | `NUMERIC(20,4)` / Prisma Decimal |
| realized PnL | `NUMERIC(20,4)` / Prisma Decimal |
| fees | `NUMERIC(20,4)` / Prisma Decimal, fixed at `0.0000` in Phase 5 |
| price | `NUMERIC(20,6)` / Prisma Decimal |
| average cost | `NUMERIC(20,6)` / Prisma Decimal |
| quantity | positive `INTEGER` |

API Decimal contract:

- Decimal values are serialized as decimal strings.
- Request Decimal values are accepted only where explicitly approved.
- No uncontrolled JavaScript `Number` arithmetic for authoritative money, price, notional, PnL, or average cost.

Rounding and normalization:

- Rounding mode: half-up to the target scale at persistence boundaries.
- Rounding boundary: service/repository boundary before persistence and response serialization.
- Internal calculations may retain higher precision temporarily through Decimal operations.
- Zero normalizes to positive zero string form (`0.0000` or `0.000000` by field scale).
- Negative zero is rejected or normalized before persistence; it must never be durable.
- Scientific notation in public request payloads is rejected with `400 VALIDATION_ERROR`.
- Values exceeding approved precision/scale are rejected safely.

## 8. Session Lifecycle

Canonical lifecycle:

```text
CREATED -> ACTIVE -> COMPLETED
CREATED -> CANCELLED
ACTIVE -> CANCELLED
```

Completion:

- Explicit server-authorized learner completion action.

Active session policy:

- At most one `ACTIVE` simulation per user.
- PostgreSQL partial unique protection is required.
- Service pre-check alone is insufficient.
- Concurrent starts must not create two active sessions.

Reset policy:

- Old current session becomes `CANCELLED`.
- A new `CREATED` session is created.
- Historical sessions, orders, trades, positions, and portfolios are never deleted by normal reset behavior.

## 9. Accounting Authority

Canonical architecture:

```text
immutable order/trade history
+
materialized portfolio/position state
```

Precedence:

- Trade history is the historical execution record.
- Portfolio/position state is the operational current state.
- Reconciliation tests must reconstruct materialized state from trades where practical and verify no drift.

Fee and slippage:

- Phase 5 fee = 0.
- Phase 5 slippage = 0.
- Execution price = current authoritative market snapshot price.
- No fee component is included in Phase 5 average-cost basis.

Realized PnL:

```text
(executionPrice - averageCost) * quantity
```

Persist realized PnL per immutable trade. Portfolio-level realized PnL is a server-derived aggregate from trades unless FEAT-034 explicitly materializes it with reconciliation tests.

## 10. Order Request Contract

Canonical route:

```text
POST /api/simulation/sessions/:simulationId/orders
```

Request body:

```json
{
  "side": "BUY",
  "type": "MARKET",
  "assetSymbol": "AURA",
  "quantity": 1,
  "idempotencyKey": "client-generated-opaque-key"
}
```

Canonical asset identifier:

- Stable `assetSymbol`.
- Internal asset IDs are not required in public order requests.

Strict schema:

Any unapproved authoritative field returns `400 VALIDATION_ERROR`, including:

- `executionPrice`
- `cashAfter`
- `positionAfter`
- `realizedPnl`
- `unrealizedPnl`
- `status`
- `filledAt`
- `userId`
- `scenario`
- `cycle`

Response whitelist must be deterministic enough for idempotent replay and must not expose internal lock, SQL, Prisma, or constraint details.

## 11. Idempotency Contract

Scope:

```text
userId + simulationId + idempotencyKey
```

Rules:

- Idempotency records/identity are retained with Simulation history.
- No automatic idempotency deletion during normal lifecycle.
- Same key + same canonical request fingerprint returns the original result.
- Same key + different canonical payload returns `409 IDEMPOTENCY_CONFLICT`.
- PostgreSQL unique constraints are final authority.
- Redis must not be final idempotency authority.

FEAT-035 implements the minimum complete idempotency contract. FEAT-036 adversarially hardens and stress-tests it.

## 12. FEAT-035 Minimum Locking Strategy

FEAT-035 must not ship financially unsafe execution.

Minimum required strategy:

- Execute BUY/SELL inside one FEAT-013 TransactionRunner boundary.
- Lock the session portfolio row before cash/position mutation.
- Lock the target position row when it exists.
- Create missing position under the unique `(portfolioId, assetId)` constraint.
- Re-check cash/position after locks.
- Use PostgreSQL constraints to prevent negative cash and negative position.
- Keep order, trade, cash, position, and realized PnL mutation atomic.

FEAT-036 remains responsible for high-contention adversarial verification, deadlock/retry policy if needed, and diagnostics hardening.

## 13. Valuation Policy

Historical valuation chart/snapshot persistence is DEFERRED.

FEAT-037 provides current server-authoritative:

- cash
- positions
- market value
- realized PnL
- unrealized PnL
- equity
- orders
- trades

Current valuation is calculated after order execution where needed and/or on read against the current cycle snapshot. No unconditional historical valuation table or `GET .../valuations` history API is approved.

## 14. FEAT-039 Audit / Rate-Limit Policy

Durable Simulation product audit is DEFERRED FOR PHASE 5.

FEAT-039 must not add:

- product audit table
- product audit migration
- public audit API
- audit UI
- Academy/Auth audit reuse
- Simulation product-event persistence

Accepted risk:

- High-value Simulation business events are not durably product-audited in Phase 5.
- FEAT-016 product audit abstraction remains available for later activation.
- Auth/security audit remains unaffected.

Order submission rate limiting:

- INCLUDED in FEAT-039 for abuse/resource protection.
- Approved policy: per authenticated user + per simulation order route, 60 order submissions per 10 minutes, with safe `429 TOO_MANY_REQUESTS` and `Retry-After`.
- Redis may store transient counters only.
- Redis must not become order, portfolio, or idempotency authority.
- Rate-limit rejection must not mutate Simulation business state.

## 15. FEAT-040 Conditional PASS Policy

`CONDITIONAL PASS` may be used only for non-security, non-financial-integrity, non-migration, non-transaction, non-authorization, non-mandatory-validation P3/advisory issues.

`CONDITIONAL PASS` is prohibited for:

- P0/P1
- IDOR
- auth regression
- client-controlled price/cash/position/PnL
- overspend
- oversell
- duplicate order
- idempotency violation
- accounting drift
- Decimal corruption
- migration integrity
- database integrity
- transaction behavior
- Redis durable authority
- Redis fail-closed behavior where required
- durable audit misuse
- mandatory test skip
- mandatory validation not executed
- real-money/brokerage boundary violation

## 16. AC And Task Counts

| Feature | AC Count | Task Count |
| --- | ---: | ---: |
| FEAT-031 | 24 | 14 |
| FEAT-032 | 16 | 10 |
| FEAT-033 | 20 | 12 |
| FEAT-034 | 22 | 13 |
| FEAT-035 | 28 | 16 |
| FEAT-036 | 18 | 11 |
| FEAT-037 | 16 | 10 |
| FEAT-038 | 16 | 10 |
| FEAT-039 | 24 | 13 |
| FEAT-040 | 28 | 13 |

## 17. Validation And Reports

Canonical validation remains the 14-command gate:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```

Implementation reports:

- `reports/implementation/phase-5/FEAT-031.md` through `reports/implementation/phase-5/FEAT-039.md`

Phase QA report:

- `reports/qa/phase-5/PHASE-5-QA.md`

Git strategy:

- baseline: `phase-4-approved`
- feature checkpoints: `feat-031-approved` through `feat-039-approved`
- phase checkpoint after Human final gate: `phase-5-approved`

Never rewrite approved tags.
