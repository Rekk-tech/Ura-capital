# FEAT-063 Requirement: Simulation & Portfolio Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation

## Goal

Expose owned bounded Simulation, portfolio, position, trade, asset, and scenario facts while making simulated-world status explicit and preserving Phase 5 authority.

## Functional Requirements

- FR-001 Implement the Simulation adapter through approved read contracts/repositories without direct Prisma use in AI controllers/services.
- FR-002 Bind sessions, portfolios, positions, trades, and owned simulation state to the authenticated current user.
- FR-003 Project only allowlisted bounded asset, scenario, market-snapshot, portfolio, position, and trade fields.
- FR-004 Serialize Decimal/money/quantity values using stable approved string formats without floating-point authority drift.
- FR-005 Mark the envelope and every relevant interpretation as simulated and not real brokerage/market authority.
- FR-006 Preserve server authority for orders, fills, prices, settlement, valuation, and portfolio facts; the model/client cannot mutate or recalculate authoritative state.
- FR-007 Attach safe provenance and freshness/cycle identifiers while excluding provider/internal diagnostics and unrelated user data.
- FR-008 Apply deterministic item/time-range/token budgets and safe missing/stale/session-terminal handling.
- FR-009 Prevent IDOR, cross-session, cross-user, and client-supplied portfolio/context selection bypasses.
- FR-010 Test ownership, serialization, simulated disclosure, budgets, no-action behavior, and full Phase 5 regression.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

FEAT-061 approved checkpoint; Phase 5 approved contracts/checkpoint; FEAT-060 intent/context vocabulary; Human decision P8-D09 for shared context bounds.

## Ownership

Simulation read adapter, ownership scoping, safe numeric serialization, simulation markers, bounded projections, provenance, and Simulation-specific tests.

## Out Of Scope

Orders, trades, settlement, valuation/pricing mutation, real brokerage data, guaranteed outcomes, schema/migrations, UI, and durable AI data.

## Migration Ownership

ZERO. Phase 5 retains Simulation schema ownership.

## Prepared P8-D09 Simulation Budget

Pending Human confirmation, Simulation projections obey section 12.4: each item at most 2 KiB UTF-8, the Simulation adapter at most 8 KiB, and the shared 16 KiB/4,096-token aggregate context ceiling. Stricter ownership, time-range, item-count, and disclosure rules remain mandatory.

## Human Decision Lock

- P8-D08: APPROVED - Simulation context is selected only through the closed intent/context-mode catalogs.
- P8-D09: APPROVED WITH BLOCKER - section-12.4 bounds await Human confirmation.
- P8-D10: APPROVED - simulated educational explanation only; no real-world execution or authority.
- P8-D11: APPROVED WITH BLOCKER - owned Simulation data allowlist is approved; production provider region/privacy conditions remain required.
- P8-D15: PENDING - Simulation context remains provider-neutral and cannot select the production provider.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-061 and P8-D09 context-budget closure; non-synthetic/production provider use remains blocked by P8-D11 and P8-D15.
