# FEAT-075 Tasks: Community Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / NOT_STARTED

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Integrate Community route metadata and authenticated route readiness with the shell. | FR-001 | AC-001 | TODO |
| T002 | Audit cursor/load-more orchestration and canonical query invalidation. | FR-002 | AC-002 | TODO |
| T003 | Harden post/comment mutation presentation around server validation and ownership. | FR-003 | AC-003 | TODO |
| T004 | Harden like/unlike pending/refetch behavior without optimistic authority. | FR-004 | AC-004 | TODO |
| T005 | Revalidate safe text rendering and hidden/removed content handling. | FR-005 | AC-005 | TODO |
| T006 | Complete the Community async/error/rate-limit/outage matrix. | FR-006 | AC-006 | TODO |
| T007 | Remediate Community responsive and accessibility gaps. | FR-007 | AC-007 | TODO |
| T008 | Add targeted journeys, run the approved feature gate, and record exact evidence. | FR-008 | AC-008 | TODO |

## Dependency Order

T001 establishes the feature entry contract. T002-T007 follow in order where they touch shared behavior; independent test fixtures may be prepared in parallel. T008 closes validation and evidence only after T001-T007 are complete.

## Traceability Rule

No task may be marked complete without evidence for its mapped FR and AC. New scope requires Human review rather than silent task insertion.

