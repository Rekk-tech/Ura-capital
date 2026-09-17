# FEAT-037 Implementation Report: Current Portfolio Valuation & PnL Read Model

## 1. Executive Summary & Governance

| Property | Value |
|---|---|
| **Feature ID** | `FEAT-037` |
| **Feature Name** | Current Portfolio Valuation & PnL Read Model |
| **Phase** | Phase 5 — Simulation Engine |
| **Planning Owner** | CODEX |
| **Implementation Owner** | ANTIGRAVITY / DEV-A |
| **Feature Verdict** | **IMPLEMENTATION COMPLETE / INTERNAL FEATURE GATE PASS** |
| **Upstream Baseline** | `FEAT-036` (`feat-036-approved` / SHA `50d4177`) |
| **Post-FEAT-036 Compatibility Check** | **PASS** (Zero schema drift, zero repository signature incompatibility) |
| **FEAT-038 Application Changes** | **ZERO** (Learner valuation UI strictly deferred to FEAT-038) |
| **Database Migrations** | **ZERO** (No schema changes, no historical valuation tables) |
| **Historical Valuation Persistence** | **DEFERRED** (AC-001, AC-002: Zero tables, zero history routes) |
| **Redis Valuation Authority** | **ZERO** (PostgreSQL is sole durable authority) |
| **Real-Money Trading Rails** | **ZERO** (Educational simulation only; `simulated: true` disclosure) |

---

## 2. Post-FEAT-036 Compatibility Verification

Before implementing FEAT-037, a thorough compatibility review against the `feat-036-approved` baseline confirmed:
- **Canonical Schema Entities**: `SimulationPortfolio`, `SimulationPosition`, `SimulationMarketSnapshot`, `SimulationSession`, `SimulationOrder`, and `SimulationTrade` remain 100% compliant with expected Phase 5 contracts.
- **Repository Signatures**:
  - `findPortfolioBySessionId(sessionId)`: preserved and verified.
  - `listSnapshotsByScenarioAndCycle(scenarioId, cycle, filter?)`: preserved and verified.
  - `listOrdersBySessionId(sessionId)`: preserved and verified.
  - `listTradesBySessionId(sessionId)`: preserved and verified.
- **FEAT-035 Order DTO Compatibility**: All order execution outputs and response formats remain compatible without modification.
- **Repository Boundary Guard**: Preserved with zero `@prisma/client` imports in service files (`controllers=15, services=20, repositories=7`).

---

## 3. Architecture & Canonical Read Routes

Three authenticated, owner-scoped read routes were implemented under `/api/simulation`:

```text
GET /api/simulation/sessions/:simulationId/portfolio
GET /api/simulation/sessions/:simulationId/orders
GET /api/simulation/sessions/:simulationId/trades
```

### Route Design & Controller Mapping
- **Authentication**: Protected by `requireAuth` middleware requiring a valid Bearer token (`req.user.id`).
- **Input Validation**: UUID parameters validated with standard `uuidSchema`. Invalid UUID formats trigger immediate `400 VALIDATION_ERROR`.
- **Envelope Standardization**: All successful responses return standardized `{ data: ... }` JSON envelopes.

---

## 4. Ownership Policy & Non-Enumerating IDOR Defense

- **Canonical Rule (AC-008, AC-009)**: All simulation session data is strictly owner-scoped. A learner (User A) must never access the portfolio, positions, orders, or trades of another learner (User B).
- **Non-Enumerating Policy**: If a session does not exist, or if the session belongs to a different user, the service uniformly throws `AppError(ERROR_CODES.NOT_FOUND, HTTP_STATUS.NOT_FOUND, "Simulation session not found")`.
- **Security Boundary**: The API never returns `403 FORBIDDEN` for foreign sessions, preventing attackers from enumerating valid session IDs across the user base.

---

## 5. Current Market Price Authority & Snapshot Isolation

- **Authoritative Price Resolution (AC-004)**: For every position held in the portfolio, the current price is strictly resolved from the PostgreSQL database using:
  $$\mathbf{Key} = (\text{session.scenarioId},\ \text{session.currentCycle},\ \text{position.assetId})$$
- **Strict Isolation**:
  - Snapshot prices from past cycles (`cycle < currentCycle`) are completely ignored.
  - Snapshot prices from future cycles (`cycle > currentCycle`) are completely ignored.
  - Snapshot prices from different scenarios are completely ignored.
  - Client-supplied prices, old order prices, or fallback prices are strictly rejected.
- **Missing Snapshot Policy**: If an owned position lacks an authoritative snapshot for the active cycle and scenario, the service aborts valuation and raises:
  $$\text{AppError}(\text{VALIDATION\_ERROR},\ 400,\ \text{"Missing authoritative market snapshot for asset ... at cycle ..."})$$
  No zero-price fabrication, last-known-price fallback, or partial misleading valuations are permitted.

---

## 6. Financial Formulas, Precision & Decimal Safety

Authoritative financial math is implemented with zero JavaScript native floating-point numbers, using `Prisma.Decimal` and `ROUND_HALF_UP`:

### Canonical Valuation Formulas
1. **Position Market Value**:
   $$\text{positionMarketValue} = \text{ROUND\_HALF\_UP}(\text{quantity} \times \text{currentPrice},\ 4)$$
2. **Position Unrealized PnL**:
   $$\text{positionUnrealizedPnL} = \text{ROUND\_HALF\_UP}((\text{currentPrice} - \text{averageCost}) \times \text{quantity},\ 4)$$
3. **Total Portfolio Market Value**:
   $$\text{totalMarketValue} = \sum \text{positionMarketValue}$$
4. **Total Portfolio Unrealized PnL**:
   $$\text{totalUnrealizedPnL} = \sum \text{positionUnrealizedPnL}$$
5. **Total Portfolio Equity**:
   $$\text{totalEquity} = \text{cashBalance} + \text{totalMarketValue}$$
6. **Realized PnL**:
   $$\text{realizedPnl} = \text{SimulationPortfolio.realizedPnl (Authoritative Persisted Value)}$$

### Zero-Quantity Position Semantics
If a position has `quantity === 0` (retained after a complete sell under the canonical accounting model):
- `marketValue = "0.0000"`
- `unrealizedPnl = "0.0000"`
- `averageCost` is preserved as defined by upstream accounting.
- Zero cleanup mutations occur during GET operations.

### Decimal Serialization (AC-011)
All financial values in DTO responses are serialized as fixed-precision strings:
- **Currency amounts** (`cashBalance`, `marketValue`, `totalEquity`, `realizedPnl`, `unrealizedPnl`, `notional`): 4 decimal places (`"0.0000"`).
- **Unit prices & costs** (`currentPrice`, `averageCost`, `executionPrice`): 6 decimal places (`"0.000000"`).
- **Quantities**: Canonical non-negative integers (`0`, `10`, `100`).

---

## 7. Response DTO Specifications & Simulation Disclosure

### Portfolio Valuation DTO
```json
{
  "sessionId": "33333333-3333-4333-8333-333333333333",
  "currentCycle": 2,
  "cashBalance": "95000.0000",
  "marketValue": "6000.0000",
  "totalEquity": "101000.0000",
  "realizedPnl": "0.0000",
  "unrealizedPnl": "1000.0000",
  "positions": [
    {
      "assetId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "symbol": "AURA",
      "name": "Aura Capital",
      "quantity": 50,
      "averageCost": "100.000000",
      "currentPrice": "120.000000",
      "marketValue": "6000.0000",
      "unrealizedPnl": "1000.0000",
      "simulated": true
    }
  ],
  "simulated": true,
  "updatedAt": "2026-09-17T10:00:00.000Z"
}
```

### Orders & Trades Response DTOs
- **Orders**: Reuses the approved FEAT-035 order DTO (`id`, `sessionId`, `assetId`, `assetSymbol`, `side`, `type`, `quantity`, `status`, `executionPrice`, `executedQuantity`, `filledAt`, `realizedPnl`, `submittedAt`, `simulated: true`).
  - Internal security fields (`userId`, `idempotencyKey`, `requestFingerprint`) are completely omitted.
- **Trades**: Strict safe DTO (`id`, `orderId`, `assetId`, `assetSymbol`, `side`, `quantity`, `executionPrice`, `notional`, `realizedPnl`, `executedAt`, `simulated: true`).
- **Simulation Disclosure (AC-012)**: `simulated: true` is explicitly present across all portfolio, position, order, and trade models.

---

## 8. Read-Only Invariant & Live Database Verification (AC-010)

FEAT-037 routes are strictly **READ-ONLY**. GET operations must never mutate session, portfolio, position, order, trade, snapshot, or audit records.

### Live PostgreSQL Read-Only Verification Test
In `tests/integration/simulation-valuation-db.test.ts`, the database state before and after repeated GET requests was captured and verified:

```typescript
// Snapshot database state before reads
const [portBefore, posBefore, ordersBefore, tradesBefore, sessionBefore] = await Promise.all([
  prisma.simulationPortfolio.findUnique({ where: { sessionId } }),
  prisma.simulationPosition.findMany({ where: { portfolioId: portfolio.id } }),
  prisma.simulationOrder.findMany({ where: { sessionId } }),
  prisma.simulationTrade.findMany({ where: { sessionId } }),
  prisma.simulationSession.findUnique({ where: { id: sessionId } }),
]);

// Execute read routes repeatedly
await request(app).get(`/api/simulation/sessions/${sessionId}/portfolio`).set("Authorization", `Bearer ${token}`);
await request(app).get(`/api/simulation/sessions/${sessionId}/orders`).set("Authorization", `Bearer ${token}`);
await request(app).get(`/api/simulation/sessions/${sessionId}/trades`).set("Authorization", `Bearer ${token}`);

// Snapshot database state after reads
const [portAfter, posAfter, ordersAfter, tradesAfter, sessionAfter] = await Promise.all([
  prisma.simulationPortfolio.findUnique({ where: { sessionId } }),
  prisma.simulationPosition.findMany({ where: { portfolioId: portfolio.id } }),
  prisma.simulationOrder.findMany({ where: { sessionId } }),
  prisma.simulationTrade.findMany({ where: { sessionId } }),
  prisma.simulationSession.findUnique({ where: { id: sessionId } }),
]);

// Assert ZERO mutations
expect(portAfter?.cashBalance.toString()).toBe(portBefore?.cashBalance.toString());
expect(portAfter?.realizedPnl.toString()).toBe(portBefore?.realizedPnl.toString());
expect(portAfter?.updatedAt.toISOString()).toBe(portBefore?.updatedAt.toISOString());
expect(posAfter).toEqual(posBefore);
expect(ordersAfter).toEqual(ordersBefore);
expect(tradesAfter).toEqual(tradesBefore);
expect(sessionAfter?.updatedAt.toISOString()).toBe(sessionBefore?.updatedAt.toISOString());
```
**Empirical Result**: Zero row count changes, zero balance changes, zero timestamp modifications.

---

## 9. Historical Valuation Deferral (AC-001, AC-002)

Per explicit architectural governance:
- **Historical Valuation Persistence**: **DEFERRED**.
- **Historical Valuation Tables**: **ZERO**.
- **Historical Chart / Valuation API Routes**: **ZERO**.
- Any attempt to query or create `/valuations` history endpoints was strictly avoided.

---

## 10. Empirical Test Evidence

### Targeted Unit Test Suite (`tests/unit/simulation-valuation.test.ts`)
```text
 ✓ tests/unit/simulation-valuation.test.ts (15 tests) 17ms
   ✓ 1. Portfolio Valuation Calculations & Formulas (AC-003, AC-004, AC-006, AC-007)
     ✓ evaluates empty portfolio with zero positions (cash = equity, marketValue = 0)
     ✓ evaluates single position with positive unrealized PnL (price > averageCost)
     ✓ evaluates single position with negative unrealized PnL (price < averageCost)
     ✓ evaluates multiple positions aggregating positive and negative unrealized PnL
     ✓ evaluates zero-quantity retained position (marketValue = 0, unrealizedPnL = 0)
     ✓ verifies ROUND_HALF_UP boundary and high-precision price and cost (AC-001, AC-011)
     ✓ rejects when snapshot price is missing for a held position (AC-004)
   ✓ 2. IDOR Protection & Ownership Scoping (AC-008, AC-009)
     ✓ rejects foreign user attempting to read portfolio valuation with 404 NOT_FOUND
     ✓ rejects invalid UUID parameter with 400 VALIDATION_ERROR
     ✓ rejects non-existent session with 404 NOT_FOUND
   ✓ 3. Orders and Trades Read Model (AC-008, AC-011, AC-012)
     ✓ returns owner orders with safe DTO projection and simulated: true
     ✓ rejects foreign user attempting to read orders with 404 NOT_FOUND
     ✓ returns owner trades with safe DTO projection and simulated: true
     ✓ rejects foreign user attempting to read trades with 404 NOT_FOUND
   ✓ 4. Trade DTO Formatting Helper
     ✓ correctly formats trade DTO fields with fixed scale decimals
```

### Live PostgreSQL DB Integration Test Suite (`tests/integration/simulation-valuation-db.test.ts`)
```text
 ✓ tests/integration/simulation-valuation-db.test.ts (11 tests) 2060ms
   ✓ AC-003, AC-006, AC-007: Empty portfolio valuation (cash = equity, marketValue = 0)
   ✓ AC-003, AC-004, AC-006, AC-007: Active portfolio valuation with positive unrealized PnL
   ✓ AC-004: Cycle isolation — evaluates strictly against current cycle snapshot
   ✓ AC-004: Missing snapshot policy — returns 400 VALIDATION_ERROR when snapshot missing
   ✓ AC-008, AC-009: IDOR protection — foreign user receives 404 NOT_FOUND for portfolio
   ✓ AC-008, AC-011, AC-012: Owner can read orders list with safe DTO fields
   ✓ AC-008, AC-009: IDOR protection — foreign user receives 404 NOT_FOUND for orders
   ✓ AC-008, AC-011, AC-012: Owner can read trades list with safe DTO fields
   ✓ AC-008, AC-009: IDOR protection — foreign user receives 404 NOT_FOUND for trades
   ✓ AC-010: Read-Only Invariant — verifies GET operations cause ZERO DB mutations
   ✓ AC-001, AC-002: Historical valuation boundary — proves history endpoints are absent
```

---

## 11. Canonical 14 Validation Results

All 14 canonical quality, security, and integrity commands were executed with zero skips:

| # | Command | Result | Details |
|---|---|---|---|
| 1 | `npm run clean` | **PASS** | Clean build caches across all workspaces |
| 2 | `npm run lint` | **PASS** | 0 errors, 0 warnings across all workspaces |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Schema syntax and constraints valid |
| 4 | `npm run typecheck` | **PASS** | Shared, API, and Web TypeScript checks clean |
| 5 | `npm run build` | **PASS** | Production bundles built successfully |
| 6 | `npm run test` | **PASS** | 79 test files, 879 tests passed |
| 7 | `npm run test:unit` | **PASS** | 55 test files, 689 tests passed |
| 8 | `npm run test:db` | **PASS** | 28 test files, 337 tests passed |
| 9 | `npm run test:redis` | **PASS** | 5 test files, 50 tests passed |
| 10 | `npm run guard:persistence` | **PASS** | 14 architectural persistence tests passed |
| 11 | `npm run guard:migration` | **PASS** | 8 migrations, 8 digests, 0 blocking risks |
| 12 | `npm run guard:boundary` | **PASS** | controllers=15, services=20, repositories=7 |
| 13 | `npm run guard:audit-governance` | **PASS** | Zero premature product audit schemas/APIs |
| 14 | `npm run guard:seed-safety` | **PASS** | Zero unsafe seed backdoors or fixtures |

---

## 12. Acceptance Criteria Traceability Matrix

| AC # | Acceptance Criterion Description | Verification Method | Status |
|---|---|---|---|
| **AC-001** | Zero historical valuation tables or models in schema | `guard:migration`, Prisma validation, DB schema inspection | **PASS** |
| **AC-002** | Zero `/valuations` historical routes or chart endpoints | Route inspection, integration 404 assertion | **PASS** |
| **AC-003** | Portfolio read returns cash, market value, equity, PnL | Unit & DB integration tests (`GET .../portfolio`) | **PASS** |
| **AC-004** | Authoritative snapshot price strictly from current cycle + scenario | Cycle isolation integration test; missing snapshot test | **PASS** |
| **AC-005** | Realized PnL derives from authoritative persisted accounting | Upstream accounting fidelity verification | **PASS** |
| **AC-006** | Unrealized PnL computed correctly via `(price - cost) * qty` | Unit test matrix; DB integration with gains/losses | **PASS** |
| **AC-007** | Total equity equals `cashBalance + totalMarketValue` | Multi-asset integration tests; exact formula assert | **PASS** |
| **AC-008** | Orders and trades lists readable only by session owner | Owner read tests; safe whitelist DTO assertions | **PASS** |
| **AC-009** | Anti-enumerating IDOR defense (foreign session yields 404) | User A vs User B cross-user integration tests | **PASS** |
| **AC-010** | Strict Read-Only Invariant (zero database mutations during GET) | Before/after DB snapshot diffing assertion | **PASS** |
| **AC-011** | All Decimal values serialized as fixed-scale strings | Unit & DB test regex matchers (`0.0000`, `0.000000`) | **PASS** |
| **AC-012** | Explicit simulation disclosure (`simulated: true`) | DTO schema and payload property verification | **PASS** |
| **AC-013** | Redis is NOT valuation authority | Architectural review; DB-backed snapshot authority | **PASS** |
| **AC-014** | Zero regression across FEAT-031..FEAT-036 | Full test suite passed (879 tests green) | **PASS** |
| **AC-015** | All 14 Canonical validations PASS | 14/14 commands executed and passed | **PASS** |
| **AC-016** | Truthful and complete implementation report | `reports/implementation/phase-5/FEAT-037.md` published | **PASS** |

---

## 13. Feature Gate Verdict & Next Steps

### Internal Feature Gate Verdict: **PASS**
- All 16 Acceptance Criteria (AC-001 through AC-016) are fully satisfied.
- Zero database migrations introduced.
- Zero historical valuation tables or endpoints created.
- Zero FEAT-038 application changes introduced.
- Zero regressions across FEAT-031 through FEAT-036.

### Downstream Handoff
- **FEAT-037**: `DONE` / `IMPLEMENTATION COMPLETE`
- **FEAT-038**: `UNBLOCKED FOR IMPLEMENTATION` (Learner Portfolio Valuation UI & Charting)
- **Phase 5**: `IN_PROGRESS`
