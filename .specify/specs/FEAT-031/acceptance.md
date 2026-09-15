# FEAT-031 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | Human-approved MVP constants and monetary contract are recorded. | CRITICAL HARD GATE |
| AC-002 | `SimulationScenario` matches exact approved fields and constraints. | CRITICAL HARD GATE |
| AC-003 | `SimulationAsset` matches exact approved fields and asset constraints. | CRITICAL HARD GATE |
| AC-004 | `SimulationMarketSnapshot` enforces `scenarioId + cycle + assetId` uniqueness and positive Decimal price. | CRITICAL HARD GATE |
| AC-005 | `SimulationSession` stores user, scenario, status, starting cash, current cycle, and lifecycle timestamps. | CRITICAL HARD GATE |
| AC-006 | `SimulationPortfolio` enforces one portfolio per session and non-negative cash. | CRITICAL HARD GATE |
| AC-007 | `SimulationPosition` enforces one position per `portfolio + asset` and non-negative quantity/cost. | CRITICAL HARD GATE |
| AC-008 | `SimulationOrder` enforces canonical idempotency uniqueness and closed-set order fields. | CRITICAL HARD GATE |
| AC-009 | `SimulationTrade` is immutable execution history linked to order/session/asset. | CRITICAL HARD GATE |
| AC-010 | Migration uses actual timestamp naming `<timestamp>_feat031_simulation_foundation`. | CRITICAL HARD GATE |
| AC-011 | Historical migrations are not edited, renamed, or reordered. | CRITICAL HARD GATE |
| AC-012 | PostgreSQL enforces at most one ACTIVE session per user. | CRITICAL HARD GATE |
| AC-013 | Session belongs to user and scenario must exist. | CRITICAL HARD GATE |
| AC-014 | Portfolio/order/trade cannot cross mismatched session/asset authority in approved tests. | CRITICAL HARD GATE |
| AC-015 | Decimal precision uses approved `NUMERIC(20,4)` and `NUMERIC(20,6)` contracts. | CRITICAL HARD GATE |
| AC-016 | Repositories isolate Prisma from controllers and ordinary services. | CRITICAL HARD GATE |
| AC-017 | Repository factory supports root and transaction-scoped Simulation repositories. | PASS |
| AC-018 | Fresh zero-state migration deploy/status passes. | CRITICAL HARD GATE |
| AC-019 | Upgrade from `phase-4-approved` preserves existing rows and constraints. | CRITICAL HARD GATE |
| AC-020 | Live PostgreSQL tests cover FK, unique, NOT NULL, status, positive, partial unique, and Decimal constraints. | CRITICAL HARD GATE |
| AC-021 | No product audit table/migration/API/UI is introduced. | CRITICAL HARD GATE |
| AC-022 | No Academy/Community/Subscription/AI/real-money/brokerage schema is introduced. | CRITICAL HARD GATE |
| AC-023 | Canonical guards and regression validation pass. | CRITICAL HARD GATE |
| AC-024 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
