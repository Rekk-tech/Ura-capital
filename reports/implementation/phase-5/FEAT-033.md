# FEAT-033 Implementation Report: Simulation Session Lifecycle

## 1. Executive Summary

- **Feature ID**: FEAT-033
- **Feature Name**: Simulation Session Lifecycle
- **Phase**: Phase 5 — Simulation Engine
- **Planning Owner**: Codex
- **Implementation Owner**: Antigravity / DEV-A
- **Status**: COMPLETE / PASS
- **Internal Feature Gate**: PASS
- **Baseline**: `feat-031-approved`
- **Git Branch**: `feat/FEAT-033-simulation-session-lifecycle`
- **Application Code Changes for FEAT-032**: ZERO

---

## 2. Scope & Route Specifications

All endpoints are authenticated and derive the user identity strictly from the verified access token. No client-supplied `userId` or administrative overrides are accepted.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/simulation/sessions` | List simulation sessions owned by authenticated user (optional `?status=` filter). | Yes (Bearer) |
| `POST` | `/api/simulation/sessions` | Create a new private simulation session in `CREATED` status with starting cash `100000.0000`. | Yes (Bearer) |
| `GET` | `/api/simulation/sessions/:simulationId` | Read specific owned simulation session by UUID. Returns 404 on cross-user IDOR attempt. | Yes (Bearer) |
| `POST` | `/api/simulation/sessions/:simulationId/start` | Start/activate session (`CREATED -> ACTIVE`), enforced by PostgreSQL partial unique index. | Yes (Bearer) |
| `POST` | `/api/simulation/sessions/:simulationId/complete` | Explicit learner action transitioning `ACTIVE -> COMPLETED`. Idempotent for completed sessions. | Yes (Bearer) |
| `POST` | `/api/simulation/sessions/:simulationId/cancel` | Cancel session (`CREATED/ACTIVE -> CANCELLED`). Idempotent for cancelled sessions. | Yes (Bearer) |
| `POST` | `/api/simulation/sessions/:simulationId/reset` | Atomic reset: cancels current session and creates a fresh `CREATED` session. Preserves all history. | Yes (Bearer) |

---

## 3. Lifecycle State Machine

The session lifecycle strictly conforms to human-approved transitions:

```text
CREATED -> ACTIVE -> COMPLETED
CREATED -> CANCELLED
ACTIVE  -> CANCELLED
```

### Transition Matrix & Rules

| Current Status | Target Action | Resulting Status | Timestamp Set | Idempotency / Conflict Policy |
|---|---|---|---|---|
| `CREATED` | `start` | `ACTIVE` | `startedAt` | Allowed if user has no other `ACTIVE` session. |
| `ACTIVE` | `start` | — | — | 409 `CONFLICT` ("Cannot start session in status: ACTIVE"). |
| `COMPLETED` | `start` | — | — | 409 `CONFLICT` ("Cannot start session in status: COMPLETED"). |
| `CANCELLED` | `start` | — | — | 409 `CONFLICT` ("Cannot start session in status: CANCELLED"). |
| `ACTIVE` | `complete` | `COMPLETED` | `completedAt` | Transitions atomically. |
| `COMPLETED` | `complete` | `COMPLETED` | Unchanged | Idempotent 200 OK returning original `completedAt`. |
| `CREATED` | `complete` | — | — | 409 `CONFLICT` ("Cannot complete session in status: CREATED"). |
| `CANCELLED` | `complete` | — | — | 409 `CONFLICT` ("Cannot complete session in status: CANCELLED"). |
| `CREATED` | `cancel` | `CANCELLED` | `cancelledAt` | Transitions atomically. |
| `ACTIVE` | `cancel` | `CANCELLED` | `cancelledAt` | Transitions atomically. |
| `CANCELLED` | `cancel` | `CANCELLED` | Unchanged | Idempotent 200 OK returning original `cancelledAt`. |
| `COMPLETED` | `cancel` | — | — | 409 `CONFLICT` ("Cannot cancel a completed simulation session"). |

---

## 4. One-Active-Session Invariant & Concurrency Protection

### PostgreSQL Enforcement Authority

PostgreSQL is the durable authority enforcing at most one `ACTIVE` session per user:
- Index: `simulation_sessions_user_active_idx`
- Definition: `CREATE UNIQUE INDEX "simulation_sessions_user_active_idx" ON "simulation_sessions" ("user_id") WHERE "status" = 'ACTIVE';`

### Multi-Tiered Concurrency Handling

1. **Service Pre-check**: Fast non-blocking check (`findActiveSessionByUserId`) to short-circuit obvious non-racing duplicates with 409 `CONFLICT`.
2. **Transaction & Database Constraint**: Execution inside `TransactionRunner`. Under concurrent races, PostgreSQL serializes or detects unique index conflict (`P2002` / `simulation_sessions_user_active_idx`).
3. **Deterministic Error Mapping**: Constraint violations are caught and safely mapped to 409 `CONFLICT` (`ERROR_CODES.CONFLICT`), eliminating unhandled 500 errors.

### Live PostgreSQL Concurrency Verification

Verified in `tests/integration/simulation-session-db.test.ts`:
- 5 concurrent start/activation requests for the same user against live PostgreSQL.
- Succeeded: exactly 1 request transitioned to `ACTIVE`.
- Failed: exactly 4 requests rejected with 409 `CONFLICT`.
- Direct PostgreSQL check: `SELECT COUNT(*) FROM simulation_sessions WHERE user_id = $1 AND status = 'ACTIVE'` equals exactly 1.
- Zero duplicate active sessions. Zero partial states. Zero 500 errors.

---

## 5. Strict Schema Authority Validation (AC-001)

The server enforces strict whitelisting and rejects all client-provided authoritative fields:
- `userId`, `user_id`
- `status`
- `startingCash`, `cash`, `cashBalance`
- `currentCycle`, `cycle`
- `scenarioId`, `scenarioKey`, `scenario`
- `portfolioId`, `portfolio`
- `startedAt`, `completedAt`, `cancelledAt`, `createdAt`, `updatedAt`
- `realizedPnl`, `equity`, `balance`, `orders`, `trades`, `positions`

Any presence of these fields in `POST /api/simulation/sessions` immediately terminates with HTTP 400 `VALIDATION_ERROR` (`ERROR_CODES.VALIDATION_ERROR`).

---

## 6. Scenario Binding & Starting Cash

1. **Default Scenario Binding**: Sessions bind to the canonical default scenario (`DEFAULT`), verified and lazily resolved by the server.
2. **Initial Starting Cash**: Server sets `startingCash = 100000.0000` simulated USD units (`SIMULATION_CONSTANTS.STARTING_CASH_DEFAULT`).
3. **Portfolio Materialization**: An initial `SimulationPortfolio` is atomically created with `cashBalance = 100000.0000` and `realizedPnl = 0.0000`.
4. **Current Cycle**: Initialized strictly to `1`.

---

## 7. Atomic Reset Semantics (AC-009)

In accordance with human-approved reset semantics:
1. The old current session transitions to `CANCELLED` with `cancelledAt` set.
2. Any lingering `ACTIVE` sessions for the user are also transitioned to `CANCELLED`.
3. A brand new session is created in `CREATED` status with `100000.0000` starting cash and cycle `1`.
4. A new portfolio is created for the new session.
5. All operations execute inside a single transactional boundary (`transactionRunner.run`).
6. **No Deletion**: Historical sessions, orders, trades, and portfolio records are never deleted (`DELETE` statements = 0).

---

## 8. Ownership & IDOR Protection (AC-003, AC-010, AC-011)

- Every operation resolves `userId` strictly from the verified JWT access token.
- User A cannot access User B's session for any action (`get`, `start`, `complete`, `cancel`, `reset`).
- Non-owner requests reject safely with HTTP 404 `NOT_FOUND` (`ERROR_CODES.NOT_FOUND`), preventing existence enumeration.
- Session listing (`GET /api/simulation/sessions`) queries only sessions where `userId = req.user.id`.

---

## 9. Boundary Protections

1. **Real-Money / Brokerage Boundary (CRITICAL HARD GATE)**:
   - ZERO brokerage integrations.
   - ZERO payment gateways, deposits, real security purchases, or live external credentials.
   - All sessions, portfolios, and amounts are explicitly simulated.
2. **Redis Authority Boundary**:
   - Redis is used strictly for transient rate-limiting counters.
   - ZERO session lifecycle or portfolio data is stored in or authorized by Redis.
   - PostgreSQL is the sole durable authority.
3. **FEAT-032 Isolation**:
   - ZERO FEAT-032 application changes.
   - No asset catalog endpoints, scenario snapshot endpoints, or market snapshot read services were added.

---

## 10. Verification & Test Evidence

### Test Summary

| Suite | File | Tests | Duration | Status |
|---|---|---|---|---|
| Unit Tests | `apps/api/tests/unit/simulation-session.service.test.ts` | 27 | 44ms | PASS |
| HTTP Routes Integration | `apps/api/tests/integration/simulation-session-routes.test.ts` | 16 | 146ms | PASS |
| Live PostgreSQL DB Integration | `apps/api/tests/integration/simulation-session-db.test.ts` | 9 | 1162ms | PASS |

### Canonical 14 Validation Results

| # | Command | Result | Details |
|---|---|---|---|
| 1 | `npm run clean` | PASS | Build artifacts cleaned across workspaces. |
| 2 | `npm run lint` | PASS | ESLint 0 errors, 0 warnings. |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | PASS | Prisma schema is valid. |
| 4 | `npm run typecheck` | PASS | TypeScript check passed across all workspaces. |
| 5 | `npm run build` | PASS | Web, API, and Shared packages built successfully. |
| 6 | `npm run test` | PASS | 72 files, 804 tests passed across all workspaces. |
| 7 | `npm run test:unit` | PASS | 51 files, 635 unit tests passed. |
| 8 | `npm run test:db` | PASS | 22 files, 277 live PostgreSQL database tests passed. |
| 9 | `npm run test:redis` | PASS | 5 files, 50 live Redis tests passed. |
| 10 | `npm run guard:persistence` | PASS | 14/14 persistence guard checks passed. |
| 11 | `npm run guard:migration` | PASS | 8 migrations, 8 digests, 0 blocking risks. |
| 12 | `npm run guard:boundary` | PASS | controllers=12, services=16, repositories=7. |
| 13 | `npm run guard:audit-governance` | PASS | 0 premature product audit models. |
| 14 | `npm run guard:seed-safety` | PASS | 0 unsafe seed scripts or backdoors. |

**Mandatory Skips: ZERO.**

---

## 11. Acceptance Criteria Traceability Matrix

| AC | Criterion | Implemented Location | Status |
|---|---|---|---|
| AC-001 | Strict schema rejects userId/status/cash/currentCycle/scenario/timestamp/portfolio authority fields. | `simulation-session.validation.ts` | PASS |
| AC-002 | Authenticated user can create a `CREATED` session bound to default scenario and `currentCycle = 1`. | `simulation-session.service.ts` | PASS |
| AC-003 | Users can list/read only their own sessions. | `simulation-session.service.ts` | PASS |
| AC-004 | Valid start transitions `CREATED -> ACTIVE`. | `simulation-session.service.ts` | PASS |
| AC-005 | PostgreSQL enforces at most one ACTIVE session per user. | `simulation_sessions_user_active_idx` | PASS |
| AC-006 | Concurrent starts do not create two active sessions. | `simulation-session-db.test.ts` | PASS |
| AC-007 | Explicit learner completion transitions `ACTIVE -> COMPLETED`. | `simulation-session.service.ts` | PASS |
| AC-008 | Cancel supports `CREATED/ACTIVE -> CANCELLED`. | `simulation-session.service.ts` | PASS |
| AC-009 | Reset cancels old session and creates new `CREATED` session without deleting history. | `simulation-session.service.ts` | PASS |
| AC-010 | Foreign session access is denied safely. | `simulation-session.service.ts` | PASS |
| AC-011 | Unknown/foreign errors do not disclose private resource existence (404 NOT_FOUND). | `simulation-session.service.ts` | PASS |
| AC-012 | No order execution is introduced. | Domain boundary verified | PASS |
| AC-013 | No admin/support visibility is introduced. | Domain boundary verified | PASS |
| AC-014 | No real-money or brokerage behavior is introduced. | Domain boundary verified | PASS |
| AC-015 | PostgreSQL remains session authority; Redis is not durable. | Domain boundary verified | PASS |
| AC-016 | FEAT-031 regressions remain green. | `simulation-foundation-db.test.ts` PASS | PASS |
| AC-017 | Unit and live DB tests cover lifecycle and reset. | `simulation-session-db.test.ts`, unit test suite | PASS |
| AC-018 | Canonical guards pass. | 14/14 canonical suite | PASS |
| AC-019 | No Phase 6/7 behavior is introduced. | Domain boundary verified | PASS |
| AC-020 | Implementation report is complete and truthful. | `reports/implementation/phase-5/FEAT-033.md` | PASS |

---

## 12. Governance Decision

- **FEAT-033 Implementation**: COMPLETE
- **Internal Feature Gate**: PASS
- **FEAT-032 Application Changes**: ZERO
- **Ready for Review & Checkpoint**: YES
