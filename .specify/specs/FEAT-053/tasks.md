# FEAT-053 Tasks

- [ ] T001 Record approved D1/D10 production deferral, D4/D5 lifecycle, and configured test-safe limiter/outage policy (FR-001, FR-009; AC-001, AC-002).
- [ ] T002 Define strict environment-gated mock/dev/test command contracts and safe DTOs with no production route (FR-002..FR-004; AC-003..AC-005).
- [ ] T003 Implement server-scoped mock/dev/test checkout intent through provider port with no production capability (FR-003, FR-005; AC-006, AC-007).
- [ ] T004 Prove checkout never grants entitlement before verified event (FR-005; AC-008).
- [ ] T005 Implement provider-verified cancellation semantics (FR-006; AC-009, AC-010).
- [ ] T006 Implement repeated-command idempotency and active-subscription safety (FR-007; AC-011).
- [ ] T007 Map provider timeout/unavailability to retryable 5xx with zero transition/grant (FR-008; AC-012).
- [ ] T008 Implement the Human-approved Redis HMAC user/source matrix and no-mutation outage behavior (FR-009; AC-013..AC-015).
- [ ] T009 Implement internal canonical-provider reconciliation (FR-010, FR-011; AC-016, AC-017).
- [ ] T010 Apply UoW and FEAT-053-owned transition evidence to command/reconciliation-originated transitions (FR-012; AC-018, AC-019).
- [ ] T011 Add response/log/provider/payment sanitization (FR-013; AC-020).
- [ ] T012 Add unit/API/provider contract tests (FR-015; AC-003..AC-012).
- [ ] T013 Add live PostgreSQL/Redis idempotency, no-mutation, outage, and recovery tests (FR-015; AC-011..AC-019).
- [ ] T014 Prove no public repair/manual grant/refund/invoice/UI/schema scope (FR-014; AC-021, AC-022).
- [ ] T015 Run canonical validation and Phase 2-6/FEAT-048-052 regressions (FR-016; AC-023).
- [ ] T016 Publish truthful report and dependency state (FR-015, FR-016; AC-024).

## Dependency Order

T001 -> T002 -> T003..T011 -> T012..T015 -> T016.
