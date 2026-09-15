# FEAT-031 Spec: Simulation Domain Schema & Persistence Foundation

## Monetary Contract

- cash, notional, realized PnL, fees: `NUMERIC(20,4)` / Prisma Decimal.
- price, average cost: `NUMERIC(20,6)` / Prisma Decimal.
- quantity: positive `INTEGER`.
- Rounding: half-up at persistence/serialization boundary.
- Negative zero must not persist.
- Scientific notation in public requests is rejected by later API validation.
- No uncontrolled JS Number arithmetic for authoritative values.

## Exact Model Specifications

### SimulationScenario

- `id`: String UUID PK, not null.
- `key`: String, unique, not null.
- `name`: String, not null.
- `status`: String closed-set, default `ACTIVE`; allowed `ACTIVE`, `ARCHIVED`.
- `createdAt`: DateTime default now.
- `updatedAt`: DateTime updatedAt.
- Relationships: market snapshots, sessions.
- Delete policy: restrict/no-action when referenced.

### SimulationAsset

- `id`: String UUID PK.
- `symbol`: String, unique, not null, stable public order identifier.
- `name`: String, not null.
- `assetType`: String closed-set, default `EQUITY`.
- `status`: String closed-set, default `ACTIVE`.
- `displayOrder`: Int default 0.
- `createdAt`, `updatedAt`.
- Constraints: symbol unique, assetType `EQUITY` only for MVP, status `ACTIVE`/`ARCHIVED`.

### SimulationMarketSnapshot

- `id`: String UUID PK.
- `scenarioId`: FK to `SimulationScenario`, not null, restrict/no-action.
- `assetId`: FK to `SimulationAsset`, not null, restrict/no-action.
- `cycle`: Int, positive and one-based; the first persisted market cycle is `1`.
- `price`: Decimal `NUMERIC(20,6)`, positive.
- `occurredAt`: DateTime server-owned.
- `createdAt`: DateTime.
- Unique: `scenarioId + cycle + assetId`.
- Indexes: `scenarioId + cycle`, `assetId`.
- Policy: immutable after normal creation; no update/delete in normal app behavior once used.

### SimulationSession

- `id`: String UUID PK.
- `userId`: FK to `User`, not null, restrict/no-action.
- `scenarioId`: FK to `SimulationScenario`, not null, restrict/no-action.
- `status`: String closed-set, default `CREATED`; allowed `CREATED`, `ACTIVE`, `COMPLETED`, `CANCELLED`.
- `startingCash`: Decimal `NUMERIC(20,4)`, default `100000.0000`.
- `currentCycle`: Int, positive, default `1`.
- `startedAt`: DateTime nullable.
- `completedAt`: DateTime nullable.
- `cancelledAt`: DateTime nullable.
- `createdAt`, `updatedAt`.
- Indexes: `userId`, `scenarioId`, `status`.
- Partial unique index: at most one `ACTIVE` session per `userId`.

### SimulationPortfolio

- `id`: String UUID PK.
- `sessionId`: FK to `SimulationSession`, unique, not null, restrict/no-action.
- `cashBalance`: Decimal `NUMERIC(20,4)`, non-negative.
- `realizedPnl`: Decimal `NUMERIC(20,4)`, default `0.0000`.
- `createdAt`, `updatedAt`.
- Relationship: positions.
- Invariant: one portfolio per session.

### SimulationPosition

- `id`: String UUID PK.
- `portfolioId`: FK to `SimulationPortfolio`, not null, restrict/no-action.
- `assetId`: FK to `SimulationAsset`, not null, restrict/no-action.
- `quantity`: Int, non-negative.
- `averageCost`: Decimal `NUMERIC(20,6)`, non-negative.
- `createdAt`, `updatedAt`.
- Unique: `portfolioId + assetId`.
- Indexes: `portfolioId`, `assetId`.

### SimulationOrder

- `id`: String UUID PK.
- `sessionId`: FK to `SimulationSession`, not null, restrict/no-action.
- `userId`: FK to `User`, not null, restrict/no-action.
- `assetId`: FK to `SimulationAsset`, not null, restrict/no-action.
- `side`: String closed-set `BUY`, `SELL`.
- `type`: String closed-set `MARKET`.
- `quantity`: Int positive.
- `status`: String closed-set `RECEIVED`, `FILLED`, `REJECTED`.
- `idempotencyKey`: String, not null.
- `requestFingerprint`: String, not null.
- `rejectionCode`: String nullable.
- `executionPrice`: Decimal `NUMERIC(20,6)` nullable.
- `executedQuantity`: Int nullable.
- `submittedAt`: DateTime server-owned.
- `filledAt`: DateTime nullable.
- `createdAt`, `updatedAt`.
- Unique: `userId + sessionId + idempotencyKey`.
- Indexes: `sessionId`, `userId`, `assetId`, `status`.

### SimulationTrade

- `id`: String UUID PK.
- `orderId`: FK to `SimulationOrder`, unique, not null, restrict/no-action.
- `sessionId`: FK to `SimulationSession`, not null, restrict/no-action.
- `assetId`: FK to `SimulationAsset`, not null, restrict/no-action.
- `side`: String closed-set `BUY`, `SELL`.
- `quantity`: Int positive.
- `executionPrice`: Decimal `NUMERIC(20,6)`, positive.
- `notional`: Decimal `NUMERIC(20,4)`, non-negative.
- `realizedPnl`: Decimal `NUMERIC(20,4)`, not null, `0.0000` for BUY.
- `executedAt`: DateTime server-owned.
- `createdAt`: DateTime.
- Indexes: `sessionId`, `assetId`, `orderId`.
- Consistency: trade session/asset must match order session/asset through service and DB-backed tests; use composite constraints where Prisma/PostgreSQL relationship design permits.

## Migration Strategy

Migration name must be `<actual migration timestamp>_feat031_simulation_foundation`. Fresh and upgrade validations are mandatory. No fixed fake timestamp is allowed in specs, reports, or implementation.

## Repository Boundary

Simulation repositories must support root and transaction-scoped clients through the existing repository factory and TransactionRunner. Controllers and ordinary services must not import Prisma directly.
