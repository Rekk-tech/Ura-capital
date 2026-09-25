# FEAT-074 Specification: Simulation & Portfolio Experience Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION_NOT_STARTED

## 1. Architecture Contract

- Objective: Integrate and polish approved Simulation sessions, market snapshots, orders, portfolio, positions, and trades while keeping all financial state server-authoritative and visibly simulated.
- API: Consumes only approved Simulation asset, scenario/snapshot, session, order, portfolio, position, trade, valuation, and risk-reflection contracts.
- Persistence: ZERO database or migration changes.
- Security: The UI cannot calculate or authorize cash, prices, fills, positions, PnL, equity, order state, or ownership. Every screen must clearly communicate simulation-only and no-real-money status.
- Ownership: Owns Simulation and portfolio frontend integration. Excludes matching, valuation authority, market generation, live data/brokerage, schema/API changes, and new premium gates.

## 2. Functional Contract

### FR-001

Integrate approved Simulation and portfolio routes into the canonical shell with preserved deep links.

### FR-002

Consume only approved server DTOs for assets, snapshots, sessions, orders, trades, positions, valuation, and risk reflection.

### FR-003

Keep order submission bounded to approved fields and preserve server idempotency, validation, and state transitions.

### FR-004

Display persistent, unambiguous `SIMULATION ONLY`, `NO REAL MONEY`, and no-brokerage disclosure in relevant journeys.

### FR-005

Render portfolio tables/cards responsively without client-derived authoritative cash, price, PnL, equity, or status.

### FR-006

Complete loading, empty, auth-required, forbidden, conflict, rate-limit, unavailable, and generic error states.

### FR-007

Meet keyboard, focus, semantic, contrast, reduced-motion, and responsive requirements for dense market data.

### FR-008

Run targeted order/portfolio journeys and Phase 5 integrity/security regression with truthful evidence.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

