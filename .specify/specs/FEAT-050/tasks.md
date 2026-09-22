# FEAT-050 Tasks

- [x] T001 Implement approved canonical routes: PUBLIC SAFE READ plans and AUTHENTICATED current-user subscription (FR-001, FR-002; AC-001, AC-002).
- [x] T002 Define strict request schemas and safe plan/current-user DTOs (FR-003, FR-004, FR-006; AC-003..AC-005).
- [x] T003 Implement plan read through the server-owned catalog (FR-001, FR-003; AC-006).
- [x] T004 Implement authenticated current-user read through entitlement resolver (FR-002, FR-004; AC-007).
- [x] T005 Implement no-record FREE projection (FR-005; AC-008).
- [x] T006 Reject/ignore forged user/premium/status authority (FR-007; AC-009, AC-010).
- [x] T007 Enforce zero-mutation/zero-provider-call GET behavior (FR-008; AC-011).
- [x] T008 Map safe auth/repository/integrity errors (FR-009; AC-012).
- [x] T009 Add unit/API/PostgreSQL-backed read tests (FR-010; AC-006..AC-012).
- [x] T010 Prove zero schema/Redis/mutation/guard/UI scope and run regressions (FR-011; AC-013..AC-015).
- [x] T011 Publish truthful implementation evidence (FR-010, FR-011; AC-016).

## Dependency Order

T001 -> T002 -> T003..T008 -> T009/T010 -> T011.
