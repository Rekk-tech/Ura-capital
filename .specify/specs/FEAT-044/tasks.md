# FEAT-044 Tasks

- [ ] T001 Freeze like routes, empty-body, response, and error contracts (FR-001, FR-003, FR-006; AC-001..AC-004).
- [ ] T002 [P] Add strict UUID and empty-body validation (FR-012; AC-005, AC-006).
- [ ] T003 Extend like repository with unique-safe create and canonical state read (FR-004, FR-006, FR-007; AC-007..AC-010).
- [ ] T004 Extend like repository with caller-scoped idempotent delete (FR-005, FR-010; AC-011..AC-013).
- [ ] T005 Implement like service with post visibility and race handling (FR-003..FR-010, FR-013; AC-007..AC-015).
- [ ] T006 Implement controller and exact authenticated PUT/DELETE routes (FR-001, FR-002; AC-001, AC-016).
- [ ] T007 Integrate canonical state with feed/detail projections (FR-011; AC-017).
- [ ] T008 [P] Add validation and service unit tests (FR-012..FR-014; AC-005..AC-010).
- [ ] T009 Add API idempotent PUT/DELETE and unavailable-post tests (FR-003..FR-006; AC-016, AC-018, AC-019).
- [ ] T010 Add five-request same-user live PostgreSQL concurrency test (FR-007, FR-008; AC-020).
- [ ] T011 Add distinct-user concurrent like test (FR-009; AC-021).
- [ ] T012 Add cross-user unlike and repeated-unlike tests (FR-005, FR-010; AC-012, AC-013, AC-022).
- [ ] T013 Add forged body, safe diagnostics, and zero-mutation tests (FR-012, FR-013; AC-005, AC-006, AC-015).
- [ ] T014 Prove zero migration/comment-like/Redis/audit/UI scope creep (FR-015; AC-023).
- [ ] T015 Run canonical 14 with no mandatory skips (FR-014; AC-024).
- [ ] T016 Create `reports/implementation/phase-6/FEAT-044.md` with exact evidence (FR-014; AC-001..AC-024).

## Dependency Order

T001 -> T002 -> T003..T007 -> T008..T014 -> T015 -> T016.
