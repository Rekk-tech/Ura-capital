# FEAT-037 Requirement: Current PnL & Portfolio Valuation

Status: PLANNED / BLOCKED BY FEAT-036
Phase: Phase 5 - Simulation Engine
Type: Implementation feature

## Human Decisions

HUMAN APPROVED: historical valuation chart/snapshot persistence is DEFERRED.

## Goal

Expose current server-authoritative portfolio valuation and PnL reads without introducing historical valuation persistence.

## Functional Requirements

- FR-001 Provide current cash, positions, market value, realized PnL, unrealized PnL, equity, orders, and trades.
- FR-002 Current valuation is calculated after order execution where needed and/or on read against current cycle snapshots.
- FR-003 Do not create historical valuation table.
- FR-004 Do not expose `GET .../valuations` history API.
- FR-005 Serialize Decimal values as strings.
- FR-006 Enforce owner-only reads.
- FR-007 Reads must not mutate state.
- FR-008 Record implementation evidence in `reports/implementation/phase-5/FEAT-037.md`.
