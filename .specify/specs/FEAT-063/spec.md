# FEAT-063 Specification: Simulation & Portfolio Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Expose owned bounded Simulation, portfolio, position, trade, asset, and scenario facts while making simulated-world status explicit and preserving Phase 5 authority.

## Architecture And Ownership

Simulation read adapter, ownership scoping, safe numeric serialization, simulation markers, bounded projections, provenance, and Simulation-specific tests.

Proposed ownership: apps/api/src/modules/ai/context/simulation/**, Simulation adapter tests/fixtures, composition wiring, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Implement the Simulation adapter through approved read contracts/repositories without direct Prisma use in AI controllers/services.

### FR-002

Bind sessions, portfolios, positions, trades, and owned simulation state to the authenticated current user.

### FR-003

Project only allowlisted bounded asset, scenario, market-snapshot, portfolio, position, and trade fields.

### FR-004

Serialize Decimal/money/quantity values using stable approved string formats without floating-point authority drift.

### FR-005

Mark the envelope and every relevant interpretation as simulated and not real brokerage/market authority.

### FR-006

Preserve server authority for orders, fills, prices, settlement, valuation, and portfolio facts; the model/client cannot mutate or recalculate authoritative state.

### FR-007

Attach safe provenance and freshness/cycle identifiers while excluding provider/internal diagnostics and unrelated user data.

### FR-008

Apply deterministic item/time-range/token budgets and safe missing/stale/session-terminal handling.

### FR-009

Prevent IDOR, cross-session, cross-user, and client-supplied portfolio/context selection bypasses.

### FR-010

Test ownership, serialization, simulated disclosure, budgets, no-action behavior, and full Phase 5 regression.

## Authority And Security

- Authenticated identity and authorization facts are server-derived.
- Client, retrieved, and model-supplied business facts are untrusted.
- PostgreSQL remains durable business authority; Redis and the model are never durable or authorization authorities.
- Raw prompts, responses, context, provider payloads, credentials, tokens, cookies, secrets, and sensitive paths are prohibited from ordinary diagnostics.
- Provider/model output cannot grant entitlement, place trades, grade work, mutate progress, or authorize any action.

## Failure Contract

Validation, dependency, timeout, unavailable, quota, malformed-output, and safety outcomes must be deterministic and sanitized. The implementation must never fabricate success, silently enable a fallback, or weaken an existing-domain failure policy.

## Environment Contract

Local/test/CI fakes require explicit approved predicates. Staging, production, production-like, unknown, and conflicting environments fail closed for fake or unsafe configuration. Secrets come only from validated environment configuration and have no hard-coded/default fallback.

## Data And Migration

ZERO. Phase 5 retains Simulation schema ownership.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Simulation Bounds

After P8-D09 approval, Simulation context must fit the exact section-12.4 item/adapter/aggregate ceilings. Deterministic trimming cannot remove the simulation marker/disclaimer or admit another user's session, portfolio, position, trade, or authoritative state.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D08: APPROVED - Simulation context is selected only through the closed intent/context-mode catalogs.
- P8-D09: APPROVED WITH BLOCKER - prepared bounds are not implementation-authorized yet.
- P8-D10: APPROVED - simulated educational explanation only; no real-world execution or authority.
- P8-D11: APPROVED WITH BLOCKER - owned Simulation data allowlist is approved; production provider region/privacy conditions remain required.
- P8-D15: PENDING - Simulation context remains provider-neutral and cannot select the production provider.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-061 and P8-D09 context-budget closure; non-synthetic/production provider use remains blocked by P8-D11 and P8-D15.
