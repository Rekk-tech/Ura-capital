# FEAT-038 Requirement: Simulation Learner UI

Status: PLANNED / BLOCKED BY FEAT-037
Phase: Phase 5 - Simulation Engine
Type: Implementation feature

## Human Decisions

HUMAN APPROVED: historical valuation chart deferred; UI scope includes session management, asset list, MARKET order ticket, portfolio, positions, orders, trades, current PnL/equity; every Simulation page states SIMULATION ONLY / NO REAL MONEY / NO BROKERAGE EXECUTION.

## Goal

Build learner-facing Simulation UI that submits only trade intent and displays server-authoritative current state.

## Functional Requirements

- FR-001 Provide session management UI.
- FR-002 Display asset list.
- FR-003 Provide MARKET order ticket with only side/type/assetSymbol/quantity/idempotencyKey.
- FR-004 Display portfolio, positions, orders, trades, current PnL/equity from server DTOs.
- FR-005 Do not implement historical valuation chart.
- FR-006 Do not calculate authoritative price, cash, position, PnL, order status, or equity on frontend.
- FR-007 Every page clearly states `SIMULATION ONLY`, `NO REAL MONEY`, and `NO BROKERAGE EXECUTION`.
- FR-008 Handle loading, empty, error, auth, forbidden, and rate-limited states.
- FR-009 Maintain responsive and accessible baseline.
- FR-010 Record implementation evidence in `reports/implementation/phase-5/FEAT-038.md`.
