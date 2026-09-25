# FEAT-079 Tasks: Accessibility, Responsive & Async-State Hardening

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / NOT_STARTED

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Build the canonical route/component/state/accessibility/viewport inventory. | FR-001 | AC-001 | TODO |
| T002 | Audit and consolidate semantic design tokens and shared primitives. | FR-002 | AC-002 | TODO |
| T003 | Remediate keyboard, focus, landmark, heading, label, and announcement defects. | FR-003 | AC-003 | TODO |
| T004 | Remediate mobile/tablet/desktop layout, sizing, text fit, and overflow defects. | FR-004 | AC-004 | TODO |
| T005 | Complete and test the canonical asynchronous/error state matrix. | FR-005 | AC-005 | TODO |
| T006 | Remediate reduced-motion, transient feedback, and layout-shift behavior. | FR-006 | AC-006 | TODO |
| T007 | Execute automated and documented manual accessibility/responsive verification. | FR-007 | AC-007 | TODO |
| T008 | Run included-domain regressions and guards, then record exact remediation evidence. | FR-008 | AC-008 | TODO |

## Dependency Order

T001 establishes the entry and dependency contract. T002-T007 follow in order where they touch shared behavior; independent fixtures may be prepared in parallel. T008 closes validation/evidence only after T001-T007 are complete.

## Traceability Rule

No task may be marked complete without evidence for its mapped FR and AC. New scope requires Human review rather than silent task insertion.

