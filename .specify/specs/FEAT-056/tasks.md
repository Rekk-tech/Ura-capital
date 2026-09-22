# FEAT-056 Tasks

- [x] T001 Record approved D8 `/subscription`, approved D10 production-commerce deferral, and the read-only copy/action matrix (FR-001; AC-001, AC-002).
- [x] T002 Define typed safe DTO/query/command adapters through the centralized API client (FR-002, FR-003; AC-003, AC-004).
- [x] T003 Implement loading and FREE/no-record presentation (FR-004; AC-005).
- [x] T004 Implement ACTIVE, PAST_DUE, cancellation-pending, CANCELLED, and EXPIRED views (FR-003, FR-004; AC-006, AC-007).
- [x] T005 Enforce absence of production commerce actions and fake/local premium success (FR-005; AC-008).
- [x] T006 Prove production hosted-flow navigation is absent and payment data is never handled (FR-006, FR-007; AC-009, AC-010).
- [x] T007 Implement cancellation confirmation and server-confirmed refetch flow (FR-008; AC-011).
- [x] T008 Enforce server authority over client cache/flags/URL/local state (FR-009, FR-010; AC-012, AC-013).
- [x] T009 Implement safe canonical error, throttling, and unavailable states (FR-010, FR-011; AC-014, AC-015).
- [x] T010 Implement accessibility, focus, announcements, responsive layout, and reduced motion (FR-012; AC-016).
- [x] T011 Add API-client and component state-matrix tests (FR-013; AC-003..AC-008, AC-014).
- [x] T012 Add redirect, spoof, privacy, cancellation, and server-denial tests (FR-013; AC-009..AC-015).
- [x] T013 Prove zero schema/backend/admin/payment/existing-domain scope and run regressions (FR-014, FR-015; AC-017..AC-019).
- [x] T014 Publish truthful implementation evidence (FR-015; AC-020).

## Dependency Order

T001 -> T002 -> T003..T010 -> T011/T012 -> T013 -> T014.
