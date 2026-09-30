# FEAT-061 Tasks: AI Context Resolver Core & Data Isolation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Define the canonical context envelope and classifications. (FR-001; AC-001).
- [ ] T002 Implement authenticated identity binding and client-authority rejection. (FR-002; AC-002).
- [ ] T003 Define read-only domain adapter ports and deterministic registry. (FR-003; AC-003).
- [ ] T004 Implement per-source and aggregate resource budgets. (FR-004; AC-004).
- [ ] T005 Implement field allowlists and prohibited-data checks. (FR-005; AC-005).
- [ ] T006 Implement provenance and authoritative/derived/simulated distinctions. (FR-006; AC-006).
- [ ] T007 Implement required/optional failure, timeout, stale, and partial-context policy. (FR-007; AC-007).
- [ ] T008 Add user-scope enforcement and cross-user/collision tests. (FR-008; AC-008).
- [ ] T009 Implement untrusted-context framing and no-action protections. (FR-009; AC-009).
- [ ] T010 Add boundary tests, domain regression, canonical validation/CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M3 -> FR-005/T005/AC-005: apply the exact provider-bound field allowlist and prohibited-field set.
- M4 -> FR-004/T004/AC-004: enforce frozen per-source and aggregate item/byte/token context bounds.
- P8-D09 proposal -> FR-004/T004/AC-004: after Human approval, enforce the exact section-12.4 2-KiB item, 8-KiB adapter/retrieval, five-item retrieval, and 16-KiB/4,096-token aggregate ceilings.
- M7 -> FR-001 and FR-010/T001 and T010/AC-001 and AC-010: context is request-scoped only and no response/user-context cache may exist.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
