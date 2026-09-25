# FEAT-074 Requirement: Simulation & Portfolio Experience Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED
Phase: Phase 9 - UI Integration & Product Polish
Type: Implementation feature
Planning Owner: Codex

## Goal

Integrate and polish approved Simulation sessions, market snapshots, orders, portfolio, positions, and trades while keeping all financial state server-authoritative and visibly simulated.

## Functional Requirements

- FR-001 Integrate approved Simulation and portfolio routes into the canonical shell with preserved deep links.
- FR-002 Consume only approved server DTOs for assets, snapshots, sessions, orders, trades, positions, valuation, and risk reflection.
- FR-003 Keep order submission bounded to approved fields and preserve server idempotency, validation, and state transitions.
- FR-004 Display persistent, unambiguous `SIMULATION ONLY`, `NO REAL MONEY`, and no-brokerage disclosure in relevant journeys.
- FR-005 Render portfolio tables/cards responsively without client-derived authoritative cash, price, PnL, equity, or status.
- FR-006 Complete loading, empty, auth-required, forbidden, conflict, rate-limit, unavailable, and generic error states.
- FR-007 Meet keyboard, focus, semantic, contrast, reduced-motion, and responsive requirements for dense market data.
- FR-008 Run targeted order/portfolio journeys and Phase 5 integrity/security regression with truthful evidence.

## Non-Functional Requirements

- NFR-001 Preserve approved server-authority and security boundaries.
- NFR-002 Meet responsive mobile, tablet, and desktop behavior without horizontal overflow.
- NFR-003 Meet keyboard, focus, semantic, contrast, announcement, and reduced-motion baseline.
- NFR-004 Add no database migration unless a later Human-approved scope change explicitly assigns one.
- NFR-005 Produce deterministic tests and truthful exact-source evidence with no mandatory skips.

## Dependencies

FEAT-070, FEAT-071, Phase 5 approved Simulation baseline.

## Scope Boundary

Owns Simulation and portfolio frontend integration. Excludes matching, valuation authority, market generation, live data/brokerage, schema/API changes, and new premium gates.

## Approval Boundary

This package is a proposal. It does not authorize implementation and may not be marked implemented, QA PASS, DONE, or Human approved without later gates.

