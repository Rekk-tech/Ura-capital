# FEAT-060 Tasks: Prompt Registry, Intent Classification & Structured Contracts

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Implement the approved closed intent catalog and classifier contract. (FR-001; AC-001).
- [ ] T002 Implement the bounded strict request schema. (FR-002; AC-002).
- [ ] T003 Implement strict provider-independent `LLMProvider` structured-output and public-response schemas. (FR-003; AC-003).
- [ ] T004 Implement the code-versioned server-owned prompt registry. (FR-004; AC-004).
- [ ] T005 Implement instruction/context/retrieval/user-content separation in prompt assembly. (FR-005; AC-005).
- [ ] T006 Add override and prompt-version tampering protections. (FR-006; AC-006).
- [ ] T007 Implement strict canonical output parsing and provider-specific/malformed/oversized rejection. (FR-007; AC-007).
- [ ] T008 Implement safe internal/public error and refusal classifications. (FR-008; AC-008).
- [ ] T009 Create deterministic intent/schema/injection/compatibility fixtures and tests. (FR-009; AC-009).
- [ ] T010 Export the canonical shared contract, run canonical validation/CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M4 -> FR-002..003 and FR-007/T002..T003 and T007/AC-002..003 and AC-007: enforce the frozen request/context/citation/answer/output limits.
- M6 -> FR-003, FR-008, and FR-009/T003, T008, and T009/AC-003, AC-008, and AC-009: response language follows the query, preserves citation language, and cannot weaken safety.
- M8 -> FR-004 and FR-010/T004 and T010/AC-004 and AC-010: prompt, contract, and fixture versions are immutable and regression-gated.
- P8-D09 proposal -> FR-002..003, FR-007..008, and FR-010/T002..T003, T007..T008, and T010/AC-002..003, AC-007..008, and AC-010: after Human approval, implement the exact section-12.4 request, context bounds, response, refusal, error, citation, quota, and FEAT-078 handover contract.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
