# FEAT-073 Tasks: Academy Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / NOT_STARTED

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Integrate the Academy route tree with the canonical shell and route metadata. | FR-001 | AC-001 | TODO |
| T002 | Audit Academy API clients/DTOs and remove any integration-level contract drift. | FR-002 | AC-002 | TODO |
| T003 | Verify quiz option/submission rendering preserves answer secrecy and server grading. | FR-003 | AC-003 | TODO |
| T004 | Integrate continue-learning/progression/reward presentation from approved facts. | FR-004 | AC-004 | TODO |
| T005 | Revalidate content sanitization and safe Academy diagnostics. | FR-005 | AC-005 | TODO |
| T006 | Complete the Academy async/error state matrix. | FR-006 | AC-006 | TODO |
| T007 | Remediate Academy responsive and accessibility gaps using shared primitives. | FR-007 | AC-007 | TODO |
| T008 | Add targeted journeys, run the approved feature gate, and record exact evidence. | FR-008 | AC-008 | TODO |

## Dependency Order

T001 establishes the feature entry contract. T002-T007 follow in order where they touch shared behavior; independent test fixtures may be prepared in parallel. T008 closes validation and evidence only after T001-T007 are complete.

## Traceability Rule

No task may be marked complete without evidence for its mapped FR and AC. New scope requires Human review rather than silent task insertion.

