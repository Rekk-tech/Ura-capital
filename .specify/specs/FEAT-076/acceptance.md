# FEAT-076 Acceptance Criteria: Subscription Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW

- AC-001 The canonical Subscription route is present in the shared shell and respects authenticated readiness.
- AC-002 UI exposes only safe approved DTO fields and no provider/customer/subscription identifiers or payment data.
- AC-003 Every lifecycle status matches server facts and period/cancel semantics without client-created authority.
- AC-004 No production commerce API/CTA, mock upgrade, local premium toggle, payment form, or false success is introduced.
- AC-005 Client state cannot grant/extend entitlement and server 401/403/409 outcomes remain authoritative.
- AC-006 All required async/error/rate-limit/outage states are deterministic and sanitized.
- AC-007 Subscription status and available actions are responsive, accessible, and clearly announced.
- AC-008 Targeted tests and Phase 7 regressions prove entitlement authority, deferrals, privacy, audit integrity, and zero backend/schema change.

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

