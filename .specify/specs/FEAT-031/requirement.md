# FEAT-031 Requirement: Simulation Domain Schema & Persistence Foundation

Status: APPROVED FOR IMPLEMENTATION
Phase: Phase 5 - Simulation Engine
Type: Implementation feature

## Human Decisions

All Phase 5 MVP decisions required for FEAT-031 are HUMAN APPROVED in `docs/phase-5-feature-decomposition.md`.

## Goal

Create the exact durable PostgreSQL/Prisma foundation for the Simulation domain. FEAT-031 is schema/repository foundation only and must not implement order execution, UI, product audit persistence, rate limiting, or Phase 6/7 behavior.

## Functional Requirements

- FR-001 Create only these Phase 5 models: `SimulationScenario`, `SimulationAsset`, `SimulationMarketSnapshot`, `SimulationSession`, `SimulationPortfolio`, `SimulationPosition`, `SimulationOrder`, `SimulationTrade`.
- FR-002 Use actual migration timestamp naming: `<actual migration timestamp>_feat031_simulation_foundation`.
- FR-003 Preserve all approved/applied migrations; never edit or rename historical migrations.
- FR-004 Use PostgreSQL/Prisma migrations only; no `db push`.
- FR-005 Reference `User` for session ownership with restrict/no-action history-preserving semantics.
- FR-006 Enforce one portfolio per session.
- FR-007 Enforce one position per `portfolio + asset`.
- FR-008 Enforce asset symbol uniqueness.
- FR-009 Enforce market snapshot uniqueness by `scenarioId + cycle + assetId`.
- FR-010 Enforce one-based positive integer cycle numbering and store session `currentCycle`.
- FR-011 Enforce order ownership through session relation.
- FR-012 Enforce trade relation to order and asset/session consistency.
- FR-013 Enforce idempotency uniqueness by `userId + simulationId + idempotencyKey`.
- FR-014 Use the canonical monetary precision contract.
- FR-015 Serialize API Decimal values as decimal strings in later features.
- FR-016 Support repository interfaces and Prisma implementations without controller Prisma access.
- FR-017 Extend repository factory/UoW container for Simulation repositories.
- FR-018 Validate fresh zero-state migration.
- FR-019 Validate upgrade from `phase-4-approved`.
- FR-020 Add live PostgreSQL constraint tests for exact invariants.
- FR-021 Prohibit product audit table/migration/API/UI.
- FR-022 Prohibit Academy, Community, Subscription, AI, real-money, brokerage, or external market provider schema.
- FR-023 Record implementation evidence in `reports/implementation/phase-5/FEAT-031.md`.

## Out Of Scope

Order execution, lifecycle APIs, market read routes, portfolio mutation logic, UI, Redis, rate limiting, durable product audit persistence, leaderboards, competitions, brokerage integration.
