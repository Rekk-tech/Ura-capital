# FEAT-065 Tasks: AI Rate Limits, Daily Quotas & Cost Controls

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Implement approved source/user/daily/concurrent/global budget policies before any provider-independent `LLMProvider` invocation. (FR-001; AC-001).
- [ ] T002 Implement atomic multi-instance Redis counter/reservation operations. (FR-002; AC-002).
- [ ] T003 Implement HMAC-derived versioned key namespaces and TTLs. (FR-003; AC-003).
- [ ] T004 Unify canonical/approved alias route quota identity. (FR-004; AC-004).
- [ ] T005 Implement reservation, attempt accounting, normalized token/cost settlement, and abandoned expiry without adapter-specific authority. (FR-005; AC-005).
- [ ] T006 Implement fail-closed Redis unavailable/ambiguous behavior before provider call. (FR-006; AC-006).
- [ ] T007 Implement safe 429/quota responses and Retry-After calculation. (FR-007; AC-007).
- [ ] T008 Enforce no-lockout and transient-only Redis authority. (FR-008; AC-008).
- [ ] T009 Implement environment/run/worker isolation and narrow cleanup. (FR-009; AC-009).
- [ ] T010 Run deterministic/live Redis/security/regression tests, exact-source CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M5 -> FR-001..007/T001..T007/AC-001..007: reserve atomically before provider invocation; pre-provider rejection consumes no attempt; initiated calls consume request quota after timeout/cancellation; no ambiguous retry; settle bounded usage/cost; expire abandoned reservations; use Human-confirmed source and daily-window semantics.
- P8-D05 proposal -> FR-001..007/T001..T007/AC-001..007: once Human-approved, implement and prove section 12.3 exactly, including source/user/day/concurrency/global-cost atomicity, UTC reset, USD micro-unit reservation/settlement, conservative ambiguous outcomes, safe 429/503, and no public cost/source leakage.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
