# FEAT-049 Tasks

- [ ] T001 Record and implement exact approved D2..D5/D9 locks and canonical constants (FR-001, FR-003, FR-007; AC-001, AC-002).
- [ ] T002 Define validated server-owned plan catalog and secret provider mapping boundary (FR-002; AC-003, AC-004).
- [ ] T003 Define immutable entitlement context and resolver interface (FR-011; AC-005).
- [ ] T004 Implement missing-record FREE behavior (FR-004; AC-006).
- [ ] T005 Implement ACTIVE/period-bound entitlement evaluation with injected clock (FR-005, FR-006; AC-007, AC-008).
- [ ] T006 Implement no-trial, no-grace PAST_DUE, cancel-at-period-end-to-EXPIRED, and immediate-provider-CANCELLED policy (FR-007; AC-009..AC-011).
- [ ] T007 Reject/ignore forged client and JWT premium authority (FR-008; AC-012).
- [ ] T008 Fail closed on repository and invalid durable state (FR-009; AC-013, AC-014).
- [ ] T009 Prove no Redis, schema, migration, API, guard, or domain gating (FR-010; AC-015).
- [ ] T010 Add unit and PostgreSQL-backed resolver/clock boundary tests (FR-005..FR-009; AC-006..AC-014).
- [ ] T011 Run canonical validation and Phase 2-6/FEAT-048 regressions (FR-012; AC-016, AC-017).
- [ ] T012 Publish truthful report and dependency state (FR-012; AC-018).

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010/T011 -> T012.
