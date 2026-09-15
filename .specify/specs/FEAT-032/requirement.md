# FEAT-032 Requirement: Asset Universe & Market Snapshot Read Model

Status: PLANNED / BLOCKED BY FEAT-031
Phase: Phase 5 - Simulation Engine
Type: Implementation feature

## Human Decisions

HUMAN APPROVED: fixed mock equities only, single deterministic MVP scenario, external market provider deferred, server-owned deterministic persisted snapshots, server-controlled integer cycles.

## Goal

Expose the authenticated fixed mock asset catalog and deterministic scenario snapshot read model without session-specific behavior.

## Functional Requirements

- FR-001 Provide authenticated `GET /api/simulation/assets`.
- FR-002 Provide authenticated `GET /api/simulation/scenarios/:scenarioKey/snapshots/:cycle`.
- FR-003 Use stable asset symbols in DTOs; do not expose internal scenario IDs.
- FR-004 Return only fixed mock equity assets.
- FR-005 Return persisted server-owned snapshots for the requested scenario key and cycle.
- FR-006 Every DTO clearly marks data as `SIMULATED`.
- FR-007 GET reads must not mutate state or advance cycles.
- FR-008 Client cannot provide or override authoritative price, scenario state, cycle state, or availability.
- FR-009 Missing/archived assets or snapshots return safe errors.
- FR-010 No external market provider, live market feed, crypto, options, derivatives, or brokerage integration.
- FR-011 PostgreSQL remains price authority; Redis is not price authority.
- FR-012 Record implementation evidence in `reports/implementation/phase-5/FEAT-032.md`.

## Out Of Scope

Session creation, session-scoped market projection, currentCycle binding, order execution, portfolio accounting, UI.
