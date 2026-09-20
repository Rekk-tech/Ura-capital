# FEAT-042 Tasks

- [ ] T001 Freeze post route, DTO, cursor, and safe-error contracts (FR-001, FR-006..FR-009; AC-001..AC-005).
- [ ] T002 [P] Implement strict post body/param/query validation (FR-003, FR-007; AC-006..AC-008).
- [ ] T003 [P] Implement opaque versioned cursor codec and limit policy (FR-006, FR-007; AC-009, AC-010).
- [ ] T004 Extend post repository with visible feed/detail projection (FR-006, FR-009..FR-011; AC-011..AC-014).
- [ ] T005 Extend post repository with create and conditional owner removal writes (FR-005, FR-012, FR-013; AC-015..AC-018).
- [ ] T006 Implement safe `CommunityPostDto` mapper (FR-008, FR-009; AC-019).
- [ ] T007 Implement post service using injected repositories/UoW (FR-004, FR-010..FR-015; AC-013..AC-020).
- [ ] T008 Implement post controller with canonical envelope (FR-001, FR-015; AC-001, AC-021).
- [ ] T009 Register exact authenticated routes and no PATCH route (FR-001, FR-002, FR-014; AC-001, AC-022).
- [ ] T010 [P] Add cursor/validation/DTO unit tests (FR-003, FR-006..FR-009; AC-006..AC-010, AC-019).
- [ ] T011 Add authenticated create/feed/detail API tests (FR-001..FR-005; AC-021..AC-024).
- [ ] T012 Add spoofed ownership/status/count rejection tests (FR-004, FR-014, FR-016; AC-025).
- [ ] T013 Add live DB pagination ordering and tie-breaker tests (FR-006, FR-016; AC-009..AC-014).
- [ ] T014 Add live DB aggregate/liked-state tests (FR-010, FR-016; AC-013, AC-014).
- [ ] T015 Add own-delete, cross-user IDOR, hidden/removed visibility tests (FR-011..FR-013, FR-016; AC-016..AC-018, AC-026).
- [ ] T016 Add forced DB failure rollback and diagnostics tests (FR-013, FR-015, FR-016; AC-017, AC-020).
- [ ] T017 Prove zero schema/migration/Redis/audit/editing scope creep (FR-014, FR-017; AC-022, AC-027).
- [ ] T018 Run canonical 14 with no mandatory skips (FR-016; AC-028).
- [ ] T019 Create `reports/implementation/phase-6/FEAT-042.md` with exact traceability (FR-016; AC-001..AC-028).

## Dependency Order

T001 -> T002..T003 -> T004..T009 -> T010..T17 -> T018 -> T019.
