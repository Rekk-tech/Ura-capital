# FEAT-076 Tasks: Subscription Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / NOT_STARTED

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Integrate Subscription route metadata and navigation with the shell. | FR-001 | AC-001 | TODO |
| T002 | Audit safe DTO mapping and remove any provider/payment detail exposure. | FR-002 | AC-002 | TODO |
| T003 | Implement the approved lifecycle status presentation matrix. | FR-003 | AC-003 | TODO |
| T004 | Enforce D10 production-commerce absence in routes, components, and tests. | FR-004 | AC-004 | TODO |
| T005 | Add spoof-resistance assertions for client cache, flags, route state, and query parameters. | FR-005 | AC-005 | TODO |
| T006 | Complete Subscription async/error/rate-limit/outage presentation. | FR-006 | AC-006 | TODO |
| T007 | Remediate Subscription responsive and accessibility gaps. | FR-007 | AC-007 | TODO |
| T008 | Add targeted journeys, run the approved feature gate, and record exact evidence. | FR-008 | AC-008 | TODO |

## Dependency Order

T001 establishes the feature entry contract. T002-T007 follow in order where they touch shared behavior; independent test fixtures may be prepared in parallel. T008 closes validation and evidence only after T001-T007 are complete.

## Traceability Rule

No task may be marked complete without evidence for its mapped FR and AC. New scope requires Human review rather than silent task insertion.

