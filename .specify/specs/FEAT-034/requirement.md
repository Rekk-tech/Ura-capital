# FEAT-034 Requirement: Portfolio & Position Accounting Foundation

Status: PLANNED / BLOCKED BY FEAT-032 + FEAT-033
Phase: Phase 5 - Simulation Engine
Type: Implementation feature

## Human Decisions

HUMAN APPROVED: fee = 0, slippage = 0, execution price = authoritative current market snapshot price, immutable trade history + materialized portfolio/position state, historical valuation chart deferred.

## Goal

Define and test server-authoritative accounting primitives before order execution is exposed.

## Functional Requirements

- FR-001 Use immutable order/trade history plus materialized portfolio/position state.
- FR-002 Treat trade history as historical execution record.
- FR-003 Treat portfolio/position as operational current state.
- FR-004 Use Decimal-safe formulas from canonical monetary contract.
- FR-005 Enforce non-negative cash and non-negative positions.
- FR-006 Fee and slippage are zero in Phase 5.
- FR-007 Realized PnL per SELL trade is `(executionPrice - averageCost) * quantity`.
- FR-008 BUY does not include fee in average cost basis.
- FR-009 Portfolio-level realized PnL is server-derived aggregate from trades unless materialized with reconciliation tests.
- FR-010 Add reconciliation tests reconstructing portfolio/positions from trades where practical.
- FR-011 No frontend/client accounting authority.
- FR-012 Record implementation evidence in `reports/implementation/phase-5/FEAT-034.md`.
