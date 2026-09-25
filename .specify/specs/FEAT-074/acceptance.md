# FEAT-074 Acceptance Criteria: Simulation & Portfolio Experience Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW

- AC-001 All approved Simulation routes are reachable through the shared shell and preserve valid deep links.
- AC-002 Rendered values and identifiers come only from approved safe DTOs; no hidden provider/internal fields appear.
- AC-003 Order forms submit only approved fields, prevent duplicate UI submission, and reflect server-confirmed outcomes.
- AC-004 Every relevant Simulation screen clearly and persistently states simulation-only, no-real-money, and no-brokerage execution.
- AC-005 No browser calculation becomes authoritative for cash, prices, fills, positions, PnL, equity, ownership, or order status.
- AC-006 All required async/error/conflict/rate-limit/outage states are deterministic and report no false success.
- AC-007 Dense tables/forms remain keyboard usable, focus-safe, readable, and overflow-safe on mobile/tablet/desktop.
- AC-008 Targeted tests and Phase 5 regressions prove ownership, idempotency, concurrency outcomes, valuation authority, and zero backend/schema change.

## Traceability Matrix

| Requirement | Task | Acceptance |
|---|---|---|
| FR-001 | T001 | AC-001 |
| FR-002 | T002 | AC-002 |
| FR-003 | T003 | AC-003 |
| FR-004 | T004 | AC-004 |
| FR-005 | T005 | AC-005 |
| FR-006 | T006 | AC-006 |
| FR-007 | T007 | AC-007 |
| FR-008 | T008 | AC-008 |

## Verdict Rule

PASS requires AC-001 through AC-008 with no mandatory skip, no P0/P1, no scope expansion, truthful evidence, and exact-source CI green. Otherwise FAIL and map each defect to the owning requirement.

