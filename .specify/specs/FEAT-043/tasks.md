# FEAT-043 Tasks

- [ ] T001 Freeze comment route, DTO, cursor, and error contracts (FR-001, FR-007, FR-008, FR-011; AC-001..AC-005).
- [ ] T002 [P] Implement strict body/param/query validation (FR-003, FR-008, FR-012; AC-006..AC-009).
- [ ] T003 Extend comment repository visible-list projection (FR-008, FR-009; AC-010..AC-012).
- [ ] T004 Extend comment repository create and owner-removal operations (FR-004, FR-006, FR-010; AC-013..AC-016).
- [ ] T005 Extend post repository/service projection for visible `commentCount` (FR-014; AC-017).
- [ ] T006 Implement safe comment DTO mapper (FR-007; AC-018).
- [ ] T007 Implement comment service with parent visibility and UoW policies (FR-005, FR-010, FR-011, FR-015; AC-013..AC-016, AC-019).
- [ ] T008 Implement comment controller and exact authenticated routes (FR-001, FR-002; AC-001, AC-020).
- [ ] T009 [P] Add validation/cursor/DTO unit tests (FR-003, FR-007, FR-008, FR-012; AC-006..AC-012, AC-018).
- [ ] T010 Add comment list/create API integration tests (FR-001..FR-009; AC-020..AC-022).
- [ ] T011 Add parent hidden/removed/missing behavior tests (FR-005, FR-011; AC-013, AC-023).
- [ ] T012 Add forged relation/author/status/nesting rejection tests (FR-004, FR-006, FR-012; AC-008, AC-024).
- [ ] T013 Add owner/cross-user/repeated removal and rollback tests (FR-010, FR-011, FR-015; AC-014..AC-016, AC-019).
- [ ] T014 Add live DB ordering/cursor and visible-count consistency tests (FR-008, FR-009, FR-014; AC-010..AC-012, AC-017).
- [ ] T015 Prove no edit/reply/comment-like/schema/Redis/audit scope creep (FR-012, FR-013, FR-015; AC-009, AC-025).
- [ ] T016 Run canonical 14 with no mandatory skips (FR-016; AC-026).
- [ ] T017 Create `reports/implementation/phase-6/FEAT-043.md` with exact mappings (FR-016; AC-001..AC-026).

## Dependency Order

T001 -> T002 -> T003..T008 -> T009..T015 -> T016 -> T017.
