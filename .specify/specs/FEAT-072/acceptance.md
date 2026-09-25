# FEAT-072 Acceptance Criteria: Learner Dashboard & Cross-Domain Summary

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW

- AC-001 `/dashboard` requires an authenticated session and contains only Human-approved MVP domain summaries.
- AC-002 No dashboard-specific API, table, migration, cross-domain transaction, or materialized authority is introduced.
- AC-003 Every displayed fact is traceable to an approved server DTO and every action navigates to its owning domain.
- AC-004 A failed/empty/unauthorized widget is isolated and never produces false global success or hides other usable widgets.
- AC-005 Initial and user-triggered requests are bounded, cancellable, retry-limited, and free of render-loop storms.
- AC-006 No client calculation grants progress, money, ownership, role, or premium entitlement.
- AC-007 Dashboard works without overflow on mobile/tablet/desktop and passes keyboard/accessibility checks.
- AC-008 Tests cover all widget states, partial failure, request bounds, authority invariants, and included-domain regressions.

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

