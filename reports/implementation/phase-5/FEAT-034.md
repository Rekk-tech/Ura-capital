# FEAT-034 Implementation Report: Portfolio & Position Accounting Foundation

## 1. Executive Summary

- **Feature ID**: FEAT-034
- **Feature Name**: Portfolio & Position Accounting Foundation
- **Phase**: Phase 5 — Simulation Engine
- **Planning Owner**: Codex
- **Implementation Owner**: Antigravity / DEV-A
- **Status**: COMPLETE / PASS
- **Internal Feature Gate**: PASS
- **Baseline**: `feat-033-integration-approved` (`7ea1136`)
- **Git Branch**: `feat/FEAT-034-portfolio-position-accounting`
- **Application Code Changes for FEAT-035**: ZERO
- **Database Migration**: ZERO new migrations (FEAT-031 schema foundation fully utilized)
- **Durable Redis Accounting Authority**: ZERO (PostgreSQL is sole authority)
- **Real-Money Trading Rails**: ZERO (Simulation only)

---

## 2. Scope & Architectural Boundaries

FEAT-034 establishes server-authoritative operational accounting primitives for Simulation Portfolios and Positions prior to order execution exposure in FEAT-035.

### In Scope
- Server-authoritative Decimal accounting math and rounding.
- Exact monetary precision contracts: 4 decimals for currency (`cashBalance`, `realizedPnl`, `notional`), 6 decimals for prices (`executionPrice`, `averageCost`).
- Starting portfolio initialization for simulation sessions (100,000.0000 USD default, 0 initial positions).
- One `SimulationPortfolio` per `SimulationSession` invariant enforced by PostgreSQL unique index.
- Unique `(portfolioId, assetId)` position identity invariant.
- Buy accounting with canonical weighted-average cost formula (zero fee, zero slippage).
- Sell accounting with canonical realized PnL formula (`(executionPrice - averageCost) * quantity`).
- Preservation of average cost for remaining shares upon partial sell.
- Canonical zero position semantics: retaining zero row (`quantity: 0`) with preserved average cost basis.
- Server-side valuation and equity helper formulas.
- Multi-asset independence and isolation.
- Atomic transaction boundaries via `TransactionRunner` with rollback on failure.
- Trade reconciliation algorithm reconstructing materialized state from trade history.
- Numeric abuse protection (rejection of NaN, Infinity, negative zero normalization, scientific notation rejection, scale overflow, precision bounds).

### Out of Scope (Strictly Blocked / Preserved)
- **FEAT-035 Boundary**: Zero order submission endpoints (`POST /orders`), zero order status transition machines, zero idempotency request handling APIs, zero market execution routers.
- **Valuation UI**: Zero historical valuation charts, tables, or client-side calculation authority.
- **Brokerage Integrations**: Zero live order routing, deposits, withdrawals, or real-money accounts.

---

## 3. Canonical Accounting Authority

The human-approved Phase 5 accounting architecture enforces:
```text
trade history       = historical execution record (immutable ledger)
portfolio/position  = operational current state (materialized state)
```

In FEAT-034:
- `SimulationPortfolio` and `SimulationPosition` rows represent the authoritative current operational state.
- Internal accounting primitives mutate cash balance, position quantity, weighted-average cost, and cumulative realized PnL atomically inside `TransactionRunner`.
- Deterministic reconciliation tests verify that replaying immutable trades from starting cash produces the exact same cash balance, position quantities, average costs, and realized PnL as the materialized operational state.

---

## 4. Monetary Precision Contract & Rounding

| Category | Database Column / Field | Precision / Scale | Rounding Mode | Description |
|---|---|---|---|---|
| Cash Balance | `simulation_portfolios.cash_balance` | `DECIMAL(20, 4)` | `ROUND_HALF_UP` | Simulated USD cash balance (`cash >= 0`). |
| Realized PnL | `simulation_portfolios.realized_pnl` | `DECIMAL(20, 4)` | `ROUND_HALF_UP` | Cumulative realized PnL across all closed positions. |
| Trade Notional | `simulation_trades.notional` | `DECIMAL(20, 4)` | `ROUND_HALF_UP` | Value of execution (`quantity * executionPrice`). |
| Execution Price | `simulation_trades.execution_price` | `DECIMAL(20, 6)` | `ROUND_HALF_UP` | Authoritative cycle execution snapshot price (`price > 0`). |
| Average Cost | `simulation_positions.average_cost` | `DECIMAL(20, 6)` | `ROUND_HALF_UP` | Weighted-average share acquisition cost basis (`average_cost >= 0`). |
| Share Quantity | `simulation_positions.quantity` | `INTEGER` | N/A | Non-negative integer quantity (`quantity >= 0`). |

All calculations are performed using `Prisma.Decimal` (powered by `decimal.js`). Authoritative JavaScript floating-point arithmetic is strictly prohibited and eliminated.

---

## 5. Canonical Formulas

### Buy Accounting
In Phase 5 MVP, trading fees and slippage are zero (`fee = 0`, `slippage = 0`).
```text
buyNotional    = toCurrencyDecimal(buyQuantity * executionPrice)
newCashBalance = toCurrencyDecimal(currentCash - buyNotional)
newQuantity    = currentQuantity + buyQuantity

If currentQuantity == 0:
    newAverageCost = toPriceDecimal(executionPrice)
Else:
    oldBasis       = currentAverageCost * currentQuantity
    combinedBasis  = oldBasis + buyNotional
    newAverageCost = toPriceDecimal(combinedBasis / newQuantity)
```
- Invariant: `newCashBalance >= 0`. If `newCashBalance < 0`, operation is rejected with `409 CONFLICT` (`INSUFFICIENT_CASH`).

### Sell Accounting
```text
sellNotional            = toCurrencyDecimal(sellQuantity * executionPrice)
tradeRealizedPnl        = toCurrencyDecimal((executionPrice - currentAverageCost) * sellQuantity)
newCashBalance          = toCurrencyDecimal(currentCash + sellNotional)
newQuantity             = currentQuantity - sellQuantity
newPortfolioRealizedPnl = toCurrencyDecimal(currentRealizedPnl + tradeRealizedPnl)
remainingAverageCost    = currentAverageCost (unmutated)
```
- Invariant: `sellQuantity <= currentQuantity`. If `sellQuantity > currentQuantity`, operation is rejected with `409 CONFLICT` (`INSUFFICIENT_POSITION`). Short selling is deferred.

### Valuation & Equity Calculations
```text
marketValue      = toCurrencyDecimal(quantity * currentSnapshotPrice)
unrealizedPnl    = toCurrencyDecimal((currentSnapshotPrice - averageCost) * quantity)
totalMarketValue = sum(marketValue)
totalUnrealized  = sum(unrealizedPnl)
totalEquity      = toCurrencyDecimal(cashBalance + totalMarketValue)
```

---

## 6. Portfolio & Position Persistence Semantics

### Portfolio Initialization
- When a Simulation session initializes its accounting state, it creates exactly one `SimulationPortfolio` row with `cashBalance = 100000.0000` and `realizedPnl = 0.0000`.
- Initial positions: ZERO rows.
- Unique session binding: `sessionId @unique`. Concurrent initialization attempts result in exactly 1 portfolio and `409 CONFLICT` for racing requests.

### Position Identity & Zero Position Semantics
- Canonical position identity: `(portfolioId, assetId) @unique`. Exactly one row per asset per portfolio.
- **Canonical Zero Position Semantics**: When a full sell occurs (`newQuantity == 0`), the position row is retained in PostgreSQL with `quantity = 0` and its previous `averageCost` preserved.
  - Aligns with database constraint `quantity >= 0`.
  - Enables row-level locking without lock-escalation or race conditions on insert vs update in subsequent features.
  - Re-buying from zero quantity calculates: `(0 * oldAvgCost + buyNotional) / newQuantity = executionPrice`, cleanly resetting the cost basis to the new execution price.

---

## 7. Transaction Boundary & Rollback Safety

All accounting mutations execute inside `TransactionRunner.run(...)`:
- Atomically mutates `cashBalance`, `realizedPnl`, and `SimulationPosition` within a single PostgreSQL database transaction.
- If any validation fails, or if a forced error occurs before commit, all changes to portfolio cash, positions, and PnL are completely rolled back.
- Verified in live PostgreSQL integration test `rolls back all cash and position mutations if a failure occurs inside transaction`.

---

## 8. Files Created & Modified

### New Implementation Files
- `apps/api/src/modules/simulation/simulation-accounting.ts`:
  - Pure Decimal accounting math, formula calculations, input validation (`validateDecimalInput`, `validateQuantityInput`), and `reconstructPortfolioStateFromTrades` helper.
- `apps/api/src/modules/simulation/simulation-accounting.service.ts`:
  - Server-authoritative domain service (`initializePortfolio`, `applyBuyAccounting`, `applySellAccounting`, `getPortfolioState`, `calculatePortfolioValuation`, `reconcilePortfolio`). Conforms strictly to repository boundary rules with zero direct Prisma infrastructure leakage.

### Modified Files
- `apps/api/src/modules/simulation/simulation.repository.ts`:
  - Added `updatePortfolioAccounting(id, data)` and `deletePosition(portfolioId, assetId)` methods to `ISimulationPortfolioRepository` and `PrismaSimulationPortfolioRepository`.
- `apps/api/src/modules/simulation/simulation.types.ts`:
  - Exported domain model types (`SimulationPortfolio`, `SimulationPosition`, `SimulationTrade`, `SimulationOrder`, `SimulationSession`, `SimulationAsset`) and `Decimal` alias.
- `apps/api/package.json`:
  - Registered `tests/integration/simulation-accounting-db.test.ts` in `test:db`.

### New Test Suites
- `apps/api/tests/unit/simulation-accounting.test.ts`:
  - 24 unit tests verifying Decimal precision, BUY weighted-average cost, SELL realized PnL, valuation formulas, numeric abuse protections, trade reconstruction, and service mock transactions.
- `apps/api/tests/integration/simulation-accounting-db.test.ts`:
  - 13 live PostgreSQL integration tests verifying portfolio initialization, session uniqueness under concurrency, position composite uniqueness, DB check constraints (`cash_balance >= 0`, `quantity >= 0`, `average_cost >= 0`), atomic rollback, cross-session isolation, multi-asset lifecycle execution, and trade reconciliation.

---

## 9. Acceptance Criteria Traceability Matrix

| AC | Requirement & Description | Gate | Verification Evidence | Result |
|---|---|---|---|---|
| **AC-001** | Durable accounting uses Decimal/NUMERIC and approved rounding (`ROUND_HALF_UP`). | CRITICAL HARD GATE | `simulation-accounting.ts` enforces 4 decimals for currency, 6 for price. Verified in unit and DB tests. | **PASS** |
| **AC-002** | Portfolio state is server-authoritative current state with starting cash 100000.0000. | CRITICAL HARD GATE | `initializePortfolio` defaults to `100000.0000`, 0 initial positions, 1 portfolio per session. | **PASS** |
| **AC-003** | Position state is server-authoritative current state with composite `(portfolioId, assetId)` unique constraint. | CRITICAL HARD GATE | PostgreSQL composite unique constraint verified with concurrent upsert tests. | **PASS** |
| **AC-004** | BUY average cost excludes fees because fee = 0. | CRITICAL HARD GATE | Weighted-average cost formula tests verify exact mathematical basis without fee addition. | **PASS** |
| **AC-005** | SELL realized PnL uses `(executionPrice - averageCost) * quantity`. | CRITICAL HARD GATE | Partial sell at profit, loss, and full sell tests assert exact realized PnL. Average cost remains unchanged. | **PASS** |
| **AC-006** | Current market value uses current authoritative snapshot price. | CRITICAL HARD GATE | `calculateValuationAccounting` uses snapshot price directly for each position. | **PASS** |
| **AC-007** | Unrealized PnL is server-computed: `(snapshotPrice - averageCost) * quantity`. | CRITICAL HARD GATE | Multi-position valuation tests verify server-side derivation. | **PASS** |
| **AC-008** | Equity is server-computed: `cashBalance + sum(current market value)`. | CRITICAL HARD GATE | Valuation tests assert exact equity calculation. | **PASS** |
| **AC-009** | Negative cash is rejected. | CRITICAL HARD GATE | Service pre-check and PostgreSQL `simulation_portfolios_cash_balance_check` tested. | **PASS** |
| **AC-010** | Negative positions are rejected while shorting is deferred. | CRITICAL HARD GATE | Oversell pre-check and PostgreSQL `simulation_positions_quantity_check` tested. | **PASS** |
| **AC-011** | NaN/Infinity are rejected. | CRITICAL HARD GATE | `validateDecimalInput` and `validateQuantityInput` reject NaN/Infinity in inputs. | **PASS** |
| **AC-012** | Negative zero is rejected or normalized before persistence. | CRITICAL HARD GATE | `normalizeNegativeZero` normalizes `-0`, `-0.0000` to canonical positive zero. | **PASS** |
| **AC-013** | Scientific notation in public request payloads is rejected. | PASS | Regex check `/[eE]/` rejects scientific notation strings like `"1e5"`. | **PASS** |
| **AC-014** | Precision/overflow abuse is rejected safely. | CRITICAL HARD GATE | Bounds checking against PostgreSQL `NUMERIC(20, scale)` and integer limits. | **PASS** |
| **AC-015** | Reconciliation from trades to materialized state is tested. | CRITICAL HARD GATE | Full multi-asset trade sequence replayed and verified against live PostgreSQL state. | **PASS** |
| **AC-016** | Client/frontend calculations are not authoritative. | CRITICAL HARD GATE | All calculations are encapsulated strictly in server domain service. Zero public order endpoints. | **PASS** |
| **AC-017** | Forced accounting failure rolls back transaction-scoped mutations. | CRITICAL HARD GATE | Live PostgreSQL test proves atomic rollback on forced error inside `TransactionRunner`. | **PASS** |
| **AC-018** | Historical valuation chart/table/API is not introduced. | CRITICAL HARD GATE | Valuation UI deferred per canonical plan. Zero new historical charts or routes created. | **PASS** |
| **AC-019** | FEAT-031..033 regressions remain green. | CRITICAL HARD GATE | All cross-feature integration, session lifecycle, and market read tests remain 100% green. | **PASS** |
| **AC-020** | Live PostgreSQL tests cover constraints and rollback. | CRITICAL HARD GATE | 13 dedicated live PostgreSQL tests executed and passed. | **PASS** |
| **AC-021** | Canonical guards pass. | CRITICAL HARD GATE | All 5 guards (`persistence`, `migration`, `boundary`, `audit-governance`, `seed-safety`) passed. | **PASS** |
| **AC-022** | Implementation report is complete and truthful. | CRITICAL HARD GATE | Documented in `reports/implementation/phase-5/FEAT-034.md`. | **PASS** |

---

## 10. Targeted Test Suite Results

| Test Suite | File | Type | Tests | Result |
|---|---|---|---|---|
| FEAT-034 Accounting Unit | `apps/api/tests/unit/simulation-accounting.test.ts` | Unit | 24 | **PASS** |
| FEAT-034 Live DB Accounting | `apps/api/tests/integration/simulation-accounting-db.test.ts` | Integration (DB) | 13 | **PASS** |
| **Total Targeted FEAT-034** | **2 files** | — | **37** | **PASS (100%)** |

---

## 11. Full Canonical 14 Validation Results

| # | Validation Command | Result | Details |
|---|---|---|---|
| 1 | `npm run clean` | **PASS** | Dist and caches cleaned across all workspaces |
| 2 | `npm run lint` | **PASS** | ESLint 0 errors, 0 warnings across workspaces |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Prisma schema valid |
| 4 | `npm run typecheck` | **PASS** | TypeScript strict typecheck clean across Shared, API, and Web |
| 5 | `npm run build` | **PASS** | Shared, API, and Web production builds successful |
| 6 | `npm run test` | **PASS** | 75 files / 808 tests passed (API: 64/666, Web: 10/112, Shared: 1/30) |
| 7 | `npm run test:unit` | **PASS** | 52 files / 633 tests passed (API: 42/492, Web: 9/111, Shared: 1/30) |
| 8 | `npm run test:db` | **PASS** | 25 files / 297 tests passed, 0 skipped, 0 failed |
| 9 | `npm run test:redis` | **PASS** | 5 files / 50 tests passed, 0 skipped, 0 failed |
| 10 | `npm run guard:persistence` | **PASS** | 1 file / 14 tests, 0 legacy persistence violations |
| 11 | `npm run guard:migration` | **PASS** | 8 migrations, 8 digests, 0 blocking risks, 35 review risks |
| 12 | `npm run guard:boundary` | **PASS** | controllers=13, services=18, repositories=7 |
| 13 | `npm run guard:audit-governance` | **PASS** | 0 premature audit schemas or APIs detected |
| 14 | `npm run guard:seed-safety` | **PASS** | 0 unsafe seed scripts or default admin backdoors |

**Canonical 14 Result: 14/14 PASS (100%)**

---

## 12. FEAT-035 Boundary Confirmation

- Application code changes for FEAT-035: **ZERO**.
- Endpoints created: **ZERO** (No `POST /api/simulation/sessions/:simulationId/orders`, no order controller, no market order execution endpoint).
- Order execution service created: **ZERO**.
- Idempotency request handlers created: **ZERO**.

---

## 13. Governance Decision & Next Steps

- **FEAT-034**: `DONE`
- **Implementation**: `COMPLETE`
- **Internal Feature Gate**: `PASS`
- **FEAT-035**: `UNBLOCKED FOR IMPLEMENTATION`
- **Phase 5**: `IN_PROGRESS`
