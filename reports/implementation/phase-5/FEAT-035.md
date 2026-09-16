# FEAT-035 Implementation Report: Market Order Submission & Execution (Financial Integrity Gate)

## 1. Executive Summary

- **Feature ID**: FEAT-035
- **Feature Name**: Market Order Submission & Execution
- **Phase**: Phase 5 — Simulation Engine
- **Planning Owner**: Codex
- **Implementation Owner**: Antigravity / DEV-A
- **Status**: COMPLETE / PASS
- **Internal Feature Gate**: PASS
- **Baseline**: `feat-034-approved` (`9000db2`)
- **Git Branch**: `feat/FEAT-035-market-order-execution`
- **Application Code Changes for FEAT-036**: ZERO
- **Database Migration**: ZERO new migrations (FEAT-031 schema foundation fully utilized)
- **Durable Redis Accounting Authority**: ZERO (PostgreSQL is sole authority)
- **Real-Money Trading Rails**: ZERO (Simulation only)

---

## 2. Scope & Architectural Boundaries

FEAT-035 implements synchronous market order submission and execution for active simulation sessions, enforcing strict financial integrity against overspend, oversell, price tampering, duplicate execution, and partial mutations.

### In Scope
- Server-authoritative `POST /api/simulation/sessions/:simulationId/orders` endpoint.
- `MARKET` order type only (strict rejection of `LIMIT`, `STOP`, and other advanced types).
- Whole-share integer positive quantity (`quantity >= 1`).
- Zero fees (`fee = 0`), zero slippage (`slippage = 0`) per Phase 5 MVP specification.
- Authoritative execution price derived solely from `SimulationMarketSnapshot` for `(scenarioId, currentCycle, assetId)`. Zero client price authority.
- Transactional execution using `TransactionRunner` with explicit PostgreSQL row locking:
  1. `simulation_portfolios` locked `FOR UPDATE` first.
  2. `simulation_positions` locked `FOR UPDATE` second (if exists).
  Consistent lock hierarchy across BUY and SELL eliminating deadlocks and race conditions.
- Minimum complete idempotency with compound uniqueness on `(userId, simulationId, idempotencyKey)`:
  - Deterministic SHA-256 fingerprint generated over normalized order payload (`${side}:${type}:${assetSymbol}:${quantity}`).
  - Pre-flight lookup for instantaneous replay of finished orders.
  - Safe transactional race recovery: concurrent P2002 unique constraint collisions cleanly recover the winning order, verify fingerprint identity, and return `200 OK` on replay or `409 IDEMPOTENCY_CONFLICT` on mismatch.
- Anti-overspend protection: BUY orders exceeding available cash fail immediately with `409 INSUFFICIENT_CASH`.
- Anti-oversell protection: SELL orders exceeding existing position quantity fail immediately with `409 INSUFFICIENT_POSITION`.
- Inactive session guard: sessions in `CREATED`, `COMPLETED`, or `CANCELLED` status fail immediately with `409 SIMULATION_NOT_ACTIVE`.
- Safe Learner DTO projection: decimal numbers formatted as fixed-scale strings, sensitive infrastructure hidden, `simulated: true` explicitly tagged.

### Out of Scope (Strictly Blocked / Preserved)
- **FEAT-036 Boundary**: Zero limit orders, zero stop orders, zero conditional trigger order engines, zero multi-cycle order persistence.
- **Durable Redis Authority**: Redis is strictly limited to rate-limiting and ephemeral cache. All accounting mutations and order records are durably committed in PostgreSQL.
- **Real-Money Trading Rails**: Zero broker APIs, zero ACH/fiat rails, zero clearinghouse integrations.

---

## 3. Financial Integrity & Concurrency Architecture

### 3.1 Lock Ordering & Deadlock Prevention
To guarantee absolute serializability under concurrent client requests:
```text
Step 1: BEGIN TRANSACTION
Step 2: SELECT * FROM simulation_portfolios WHERE session_id = :sessionId FOR UPDATE;
Step 3: SELECT * FROM simulation_positions WHERE portfolio_id = :portfolioId AND asset_id = :assetId FOR UPDATE;
Step 4: Validate cash/position invariants (anti-overspend / anti-oversell)
Step 5: Apply atomic portfolio & position mutations
Step 6: INSERT INTO simulation_orders (...)
Step 7: INSERT INTO simulation_trades (...)
Step 8: COMMIT
```
Because both BUY and SELL transactions acquire the `simulation_portfolios` lock first before touching `simulation_positions`, deadlock cycles between conflicting transactions are structurally impossible.

### 3.2 Anti-Overspend & Anti-Oversell Invariants
- **BUY Order**:
  `cashBalance - (quantity * executionPrice) >= 0`
  If violated, transaction aborts with `AppError("INSUFFICIENT_CASH", ERROR_CODES.INSUFFICIENT_CASH, HTTP_STATUS.CONFLICT)`.
- **SELL Order**:
  `position.quantity - quantity >= 0`
  If position row does not exist or has `quantity < orderQuantity`, transaction aborts with `AppError("INSUFFICIENT_POSITION", ERROR_CODES.INSUFFICIENT_POSITION, HTTP_STATUS.CONFLICT)`.

### 3.3 Idempotency Key & Deterministic Fingerprint
1. Client supplies `idempotencyKey` (UUIDv4 or alphanumeric string, max 128 chars) in request body.
2. Server computes `payloadFingerprint`:
   ```text
   SHA-256("${side.toUpperCase()}:${type.toUpperCase()}:${assetSymbol.toUpperCase()}:${quantity.toString()}")
   ```
3. If an order with `(userId, session.id, idempotencyKey)` already exists:
   - If stored `payloadFingerprint === computedFingerprint`: Return `200 OK` with existing order and trade DTOs without re-executing trade.
   - If stored `payloadFingerprint !== computedFingerprint`: Reject with `409 IDEMPOTENCY_CONFLICT`.

---

## 4. Acceptance Criteria Traceability Matrix (AC-001 .. AC-028)

| AC ID | Specification Requirement | Verification Method | Result |
|---|---|---|---|
| **AC-001** | `POST /api/simulation/sessions/:simulationId/orders` endpoint exists | Route integration test | PASS |
| **AC-002** | Authenticated learner authorization enforced | 401 Unauthorized test | PASS |
| **AC-003** | Session parameter must be valid UUID | 400 Bad Request test | PASS |
| **AC-004** | Strict request schema rejects undeclared properties | Zod `.strict()` rejection test | PASS |
| **AC-005** | Rejection of client-supplied authority fields (`price`, `fee`, `status`) | Validation helper & route tests | PASS |
| **AC-006** | `MARKET` order type only (reject `LIMIT`, `STOP`) | Schema validation unit tests | PASS |
| **AC-007** | `side` must be `BUY` or `SELL` | Schema validation unit tests | PASS |
| **AC-008** | Whole-share positive integer quantity (`>= 1`) | Boundary unit tests (0, -5, 1.5) | PASS |
| **AC-009** | Idempotency key required (max 128 chars) | Validation unit tests | PASS |
| **AC-010** | Session ownership verified (belongs to caller) | 404 Not Found cross-user test | PASS |
| **AC-011** | Simulation session must be `ACTIVE` | 409 `SIMULATION_NOT_ACTIVE` test | PASS |
| **AC-012** | Asset must exist and be `ACTIVE` | 404 Not Found & 400 Inactive tests | PASS |
| **AC-013** | Server snapshot price authoritative for cycle | Price lookup and mock tests | PASS |
| **AC-014** | Zero trading fee (`fee = 0.0000`) | Trade record assertion | PASS |
| **AC-015** | Zero slippage (`slippage = 0.000000`) | Execution price assertion | PASS |
| **AC-016** | BUY notional deducted from cash balance | Live PostgreSQL test | PASS |
| **AC-017** | BUY updates weighted-average cost basis | Live PostgreSQL test | PASS |
| **AC-018** | Anti-overspend: Insufficient cash rejected | 409 `INSUFFICIENT_CASH` test | PASS |
| **AC-019** | SELL notional added to cash balance | Live PostgreSQL test | PASS |
| **AC-020** | SELL calculates and accumulates realized PnL | Live PostgreSQL test | PASS |
| **AC-021** | Anti-oversell: Insufficient position rejected | 409 `INSUFFICIENT_POSITION` test | PASS |
| **AC-022** | Full sell preserves zero position row and cost basis | Live PostgreSQL test | PASS |
| **AC-023** | Partial sell preserves average cost basis | Live PostgreSQL test | PASS |
| **AC-024** | Atomic transaction: rollback on error | Injected failure rollback test | PASS |
| **AC-025** | Row locking prevents concurrent overspend | 5 concurrent BUYs test | PASS |
| **AC-026** | Row locking prevents concurrent oversell | 5 concurrent SELLs test | PASS |
| **AC-027** | Idempotent replay: same key + same payload | 200 OK replay test | PASS |
| **AC-028** | Idempotent conflict: same key + different payload | 409 `IDEMPOTENCY_CONFLICT` test | PASS |

---

## 5. Live PostgreSQL Concurrency & Integrity Test Evidence

All tests executed against real PostgreSQL in `tests/integration/simulation-order-execution-db.test.ts`:

```text
✓ AC-016 & AC-017: BUY order execution updates portfolio cash, position quantity, and average cost (17ms)
✓ AC-019 & AC-020: SELL order execution updates cash, reduces position, and calculates realized PnL (13ms)
✓ AC-022: Full SELL leaves position at quantity 0 and preserves average cost basis (13ms)
✓ AC-023: Partial SELL preserves average cost basis for remaining shares (14ms)
✓ AC-018: Anti-overspend — rejects BUY when notional exceeds cashBalance (7ms)
✓ AC-021: Anti-oversell — rejects SELL when quantity exceeds owned shares (7ms)
✓ AC-021: Anti-oversell — rejects SELL when no position exists for asset (6ms)
✓ AC-011: Rejects order submission when simulation session is not ACTIVE (7ms)
✓ AC-012: Rejects order submission when asset does not exist (6ms)
✓ AC-024: Atomic rollback — simulated failure rolls back portfolio, position, order, and trade (8ms)
✓ AC-027: Idempotency replay — returns existing order on same key and matching payload without duplicate trade (12ms)
✓ AC-028: Idempotency conflict — rejects with 409 IDEMPOTENCY_CONFLICT on same key and modified payload (8ms)
✓ AC-025: Concurrency anti-overspend — 5 parallel BUYs competing for cash cannot cause negative balance (41ms)
✓ AC-026: Concurrency anti-oversell — 5 parallel SELLs competing for shares cannot cause negative position (35ms)
✓ AC-027: Concurrent idempotency race — 5 parallel submissions with identical key all succeed with single order (35ms)
```

---

## 6. Full Canonical 14 Validation Results

| Step | Command | Result | Details |
|---|---|---|---|
| **1** | `npm run clean` | **PASS** | Dist and tsbuildinfo caches wiped |
| **2** | `npm run lint` | **PASS** | 0 errors, 0 warnings across all files |
| **3** | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Schema valid, 0 drift |
| **4** | `npm run typecheck` | **PASS** | Shared, API, and Web workspaces clean |
| **5** | `npm run build` | **PASS** | Shared, API, and Web production builds successful |
| **6** | `npm run test` | **PASS** | 77 test files, 852 tests passed |
| **7** | `npm run test:unit` | **PASS** | 53 test files, 662 tests passed |
| **8** | `npm run test:db` | **PASS** | 26 test files, 313 tests passed |
| **9** | `npm run test:redis` | **PASS** | 5 test files, 50 tests passed |
| **10** | `npm run guard:persistence` | **PASS** | 14/14 persistence guard rules verified |
| **11** | `npm run guard:migration` | **PASS** | 8 migrations, 8 digests, 0 blocking risks |
| **12** | `npm run guard:boundary` | **PASS** | controllers=14, services=19, repositories=7 |
| **13** | `npm run guard:audit-governance` | **PASS** | Zero premature product audit schemas |
| **14** | `npm run guard:seed-safety` | **PASS** | Zero unsafe seed scripts or default backdoors |

---

## 7. Governance & Transition Recommendation

FEAT-035 has satisfied all financial integrity requirements, passed all live database concurrency tests, achieved 14/14 green Canonical validations, and preserved all architectural boundaries:
- **FEAT-035 Status**: COMPLETE
- **Internal Feature Gate**: PASS
- **FEAT-036 Status**: UNBLOCKED FOR IMPLEMENTATION
