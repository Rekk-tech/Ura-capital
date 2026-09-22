# FEAT-052 Tasks

- [x] T001 Record approved D1 production deferral and D6 policies; lock provider-neutral mock/test verification/retry/ordering contracts (FR-001, FR-009..FR-011; AC-001, AC-002).
- [x] T002 Define isolated mock/test provider allowlist and bounded verification input with no production webhook route (FR-002, FR-003; AC-003..AC-005).
- [x] T003 Implement invalid signature/provider/body/event zero-mutation rejection (FR-004; AC-006, AC-007).
- [x] T004 Normalize only verified events through FEAT-051 (FR-005; AC-008).
- [x] T005 Implement PostgreSQL event claim and unique-race handling (FR-006, FR-007; AC-009..AC-011).
- [x] T006 Implement atomic event/subscription/core-result Unit of Work (FR-008; AC-012, AC-013).
- [x] T007 Implement FEAT-052-owned provider-originated grant/upgrade transactionally coupled history (FR-009; AC-014).
- [x] T008 Implement FEAT-052-owned provider-originated revocation state-first and audit-pending evidence (FR-010; AC-015, AC-016).
- [x] T009 Implement trusted sequence/version stale-event handling (FR-011, FR-012; AC-017, AC-018).
- [x] T010 Implement canonical-fetch ordering fallback (FR-011; AC-019).
- [x] T011 Implement duplicate, retryable failure, and unsupported-event responses (FR-013, FR-016; AC-020..AC-022).
- [x] T012 Add payment/payload/signature/secret diagnostic sanitization (FR-014; AC-023).
- [x] T013 Prove Redis is not idempotency authority and abuse policy preserves retries (FR-015; AC-024).
- [x] T014 Add unit and API signature/normalization tests (FR-017; AC-003..AC-008).
- [x] T015 Add live DB sequential/concurrent duplicate and atomic rollback tests (FR-017; AC-009..AC-016).
- [x] T016 Add out-of-order/stale/reconciliation-path tests (FR-017; AC-017..AC-022).
- [x] T017 Run canonical validation, guards, regressions, and zero-scope checks (FR-018; AC-025..AC-027).
- [x] T018 Publish truthful implementation evidence (FR-017, FR-018; AC-028).

## Dependency Order

T001 -> T002..T004 -> T005..T013 -> T014..T017 -> T018.
