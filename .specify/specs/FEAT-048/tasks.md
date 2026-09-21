# FEAT-048 Tasks

- [x] T001 Record and implement the approved D2..D6 locks, PostgreSQL authority, no-record FREE semantics, and exact terminal-state terminology (FR-001, FR-002, FR-004, FR-010; AC-001, AC-002).
- [x] T002 Inventory the `phase-6-approved` Prisma baseline and migration digests (FR-012, FR-013; AC-003).
- [x] T003 Define the three approved entities and explicit cardinalities/delete policies (FR-003, FR-007; AC-004..AC-006).
- [x] T004 Define closed plan/status/outcome/source/strategy values (FR-004; AC-007).
- [x] T005 Create the sole additive Phase 7 migration (FR-012; AC-008, AC-009).
- [x] T006 Add provider-event and external-subscription uniqueness (FR-005, FR-006; AC-010, AC-011).
- [x] T007 Add one-non-terminal-subscription database invariant and race proof (FR-003; AC-012).
- [x] T008 Add required indexes, timestamps, nullability, and User delete restriction (FR-007, FR-008; AC-013, AC-014).
- [x] T009 Add repository interfaces and shared root/transaction implementations with no transition service (FR-009, FR-014; AC-015, AC-016).
- [x] T010 Prove repository primitives participate atomically in a caller-owned UoW test harness and roll back on forced failure (FR-009, FR-010; AC-017).
- [x] T011 Prove transition append-only and auth-audit invariance (FR-010; AC-018, AC-019).
- [x] T012 Probe prohibited payment/raw-payload persistence and diagnostic leakage (FR-011; AC-020).
- [x] T013 Run fresh zero-state migration validation (FR-012, FR-013; AC-021).
- [x] T014 Run real Phase 6 upgrade and representative-row/constraint preservation (FR-013; AC-022).
- [x] T015 Run boundary/migration/audit guards and full Phase 2-6 regression (FR-014..FR-016; AC-023).
- [x] T016 Publish truthful implementation report and keep FEAT-049 blocked pending gate (FR-016; AC-024).

## Dependency Order

T001 -> T002 -> T003..T008 -> T009..T012 -> T013..T015 -> T016.
