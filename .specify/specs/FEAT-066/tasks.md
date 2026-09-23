# FEAT-066 Tasks: Aura Intelligence Orchestration API & Safety Guardrails

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Implement the approved authenticated route and strict request handling. (FR-001; AC-001).
- [ ] T002 Implement server-derived identity/access/context authority and spoof rejection. (FR-002; AC-002).
- [ ] T003 Compose the exact ordered orchestration pipeline against `LLMProvider` without concrete-adapter imports or selection. (FR-003; AC-003).
- [ ] T004 Implement the approved financial-safety/refusal matrix. (FR-004; AC-004).
- [ ] T005 Implement mandatory simulation disclosure behavior. (FR-005; AC-005).
- [ ] T006 Implement the strict safe response/error/citation/quota envelope. (FR-006; AC-006).
- [ ] T007 Implement timeout/cancellation/unavailable/refusal/malformed no-fabrication and no-provider-fallback paths. (FR-007; AC-007).
- [ ] T008 Enforce no-tools/no-actions/no-domain-mutation behavior. (FR-008; AC-008).
- [ ] T009 Apply content-free logging and runtime diagnostic sanitization. (FR-009; AC-009).
- [ ] T010 Run API/runtime/adversarial/provider-neutral/no-fallback/security/regression tests, exact-source CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M4 -> FR-001, FR-006, and FR-007/T001, T006, and T007/AC-001, AC-006, and AC-007: enforce frozen request/response/citation/context/output bounds and exact error/refusal semantics.
- M5 -> FR-003 and FR-007/T003 and T007/AC-003 and AC-007: quota reservation precedes provider use and timeout/cancellation follows approved accounting with no ambiguous retry.
- P8-D05/D09 proposals -> FR-001..003, FR-006..007, and FR-010/T001..T003, T006..T007, and T010/AC-001..003, AC-006..007, and AC-010: after Human approval, implement and test sections 12.3/12.4 exactly, including pipeline order, request authority rejection, bounded success/refusal/error envelopes, user-only quota projection, and cancellation accounting.
- M6 -> FR-004..006/T004..T006/AC-004..006: answer follows query language while citations retain source language and simulation/safety text remains mandatory.
- M7 -> FR-008/T008/AC-008: stateless orchestration has no response or user-context cache.
- M8 -> FR-003, FR-006, and FR-010/T003, T006, and T010/AC-003, AC-006, and AC-010: record and regression-gate model, prompt, contract, corpus, and threshold versions.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
