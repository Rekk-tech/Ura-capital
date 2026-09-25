# FEAT-071 Tasks: Authentication Entry & Account Experience

Status: IMPLEMENTATION COMPLETE / SELF-VERIFIED / READY FOR REVIEW

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Add the three canonical auth/account routes and route guards/states. | FR-001 | AC-001 | DONE |
| T002 | Extend the centralized auth client only for missing approved operations and typed DTOs. | FR-002 | AC-002 | DONE |
| T003 | Build registration validation and server-error mapping against FEAT-003 rules. | FR-003 | AC-003 | DONE |
| T004 | Build login states with uniform failures and bounded rate-limit/outage handling. | FR-004 | AC-004 | DONE |
| T005 | Audit and test memory-only token/cookie/credential boundaries. | FR-005 | AC-005 | DONE |
| T006 | Implement and test the safe internal return-path utility. | FR-006 | AC-006 | DONE |
| T007 | Implement read-only account/session/logout presentation without role authority. | FR-007 | AC-007 | DONE |
| T008 | Add targeted tests, run the approved feature gate, and record exact evidence. | FR-008 | AC-008 | DONE |

## Dependency Order

T001 establishes the feature entry contract. T002-T007 follow in order where they touch shared behavior; independent test fixtures may be prepared in parallel. T008 closes validation and evidence only after T001-T007 are complete.

## Traceability Rule

No task may be marked complete without evidence for its mapped FR and AC. New scope requires Human review rather than silent task insertion.

