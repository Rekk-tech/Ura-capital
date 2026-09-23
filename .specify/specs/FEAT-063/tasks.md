# FEAT-063 Tasks: Simulation & Portfolio Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Implement the Simulation read adapter using approved boundaries. (FR-001; AC-001).
- [ ] T002 Implement authenticated ownership scoping for session/portfolio/position/trade reads. (FR-002; AC-002).
- [ ] T003 Implement allowlisted bounded domain projections. (FR-003; AC-003).
- [ ] T004 Implement stable Decimal/money/quantity serialization. (FR-004; AC-004).
- [ ] T005 Implement mandatory simulated-world markers and disclosure metadata. (FR-005; AC-005).
- [ ] T006 Enforce read-only server authority and no-action behavior. (FR-006; AC-006).
- [ ] T007 Implement safe provenance/freshness/cycle projection. (FR-007; AC-007).
- [ ] T008 Implement budgets and missing/stale/terminal handling. (FR-008; AC-008).
- [ ] T009 Add IDOR, cross-user/session, and client-context spoofing tests. (FR-009; AC-009).
- [ ] T010 Run targeted/live DB/security/Phase 5 regression, canonical CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M3 -> FR-003 and FR-007/T003 and T007/AC-003 and AC-007: provider-bound Simulation facts exclude direct identity, unrelated PII, provider IDs, and internals.
- M4 -> FR-008/T008/AC-008: enforce frozen item/time-range/text/token limits.
- P8-D09 proposal -> FR-008/T008/AC-008: after Human approval, enforce Simulation projections within the exact section-12.4 item/adapter/aggregate ceilings.
- M6 -> FR-005/T005/AC-005: query-language output never removes the mandatory simulation disclosure.
- M7 -> FR-008 and FR-010/T008 and T010/AC-008 and AC-010: no response or user-context cache is permitted.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
