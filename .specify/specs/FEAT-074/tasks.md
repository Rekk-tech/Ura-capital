# FEAT-074 Tasks: Simulation & Portfolio Experience Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / NOT_STARTED

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Integrate Simulation route metadata, navigation, and deep-link behavior with the shell. | FR-001 | AC-001 | TODO |
| T002 | Audit and align Simulation API clients and safe DTO rendering. | FR-002 | AC-002 | TODO |
| T003 | Harden order form submission against duplicate UI actions while preserving server authority. | FR-003 | AC-003 | TODO |
| T004 | Implement consistent simulation-only/no-real-money/no-brokerage disclosure. | FR-004 | AC-004 | TODO |
| T005 | Remediate responsive portfolio, position, order, and trade presentation without client authority. | FR-005 | AC-005 | TODO |
| T006 | Complete the Simulation async/error state matrix. | FR-006 | AC-006 | TODO |
| T007 | Remediate keyboard/accessibility behavior for dense data and forms. | FR-007 | AC-007 | TODO |
| T008 | Add targeted journeys, run the approved feature gate, and record exact evidence. | FR-008 | AC-008 | TODO |

## Dependency Order

T001 establishes the feature entry contract. T002-T007 follow in order where they touch shared behavior; independent test fixtures may be prepared in parallel. T008 closes validation and evidence only after T001-T007 are complete.

## Traceability Rule

No task may be marked complete without evidence for its mapped FR and AC. New scope requires Human review rather than silent task insertion.

