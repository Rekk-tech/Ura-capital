# FEAT-062 Tasks: Academy Learning Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Implement the Academy read adapter using approved boundaries. (FR-001; AC-001).
- [ ] T002 Implement published/visible content filtering. (FR-002; AC-002).
- [ ] T003 Implement authenticated learner progress/attempt/outcome projection. (FR-003; AC-003).
- [ ] T004 Implement pre-submission correct-answer exclusion. (FR-004; AC-004).
- [ ] T005 Implement bounded completed-assessment summaries. (FR-005; AC-005).
- [ ] T006 Enforce read-only server authority for progression/grading/XP/rewards. (FR-006; AC-006).
- [ ] T007 Implement safe Academy provenance/citation projection. (FR-007; AC-007).
- [ ] T008 Implement budgets and empty/not-found/stale handling. (FR-008; AC-008).
- [ ] T009 Add hostile Academy content framing/injection tests. (FR-009; AC-009).
- [ ] T010 Run targeted/live DB/security/Phase 4 regression, canonical CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M3 -> FR-002..005/T002..T005/AC-002..005: provider-bound Academy data excludes direct identity, drafts, answer keys, unrelated PII, and internal fields.
- M4 -> FR-008/T008/AC-008: enforce the frozen Academy item/text/token limits.
- P8-D09 proposal -> FR-008/T008/AC-008: after Human approval, enforce Academy projections within the exact section-12.4 item/adapter/aggregate ceilings.
- M6 -> FR-007/T007/AC-007: preserve citation source language for query-language output.
- M7 -> FR-008 and FR-010/T008 and T010/AC-008 and AC-010: no response or learner-context cache is permitted.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
