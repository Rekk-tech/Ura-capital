# FEAT-041 Tasks

- [x] T001 Inventory current Prisma models and 8-migration Phase 5 baseline (FR-014, FR-015; AC-001, AC-002).
- [x] T002 Define Community model and relation changes in `apps/api/prisma/schema.prisma` (FR-001..FR-005; AC-003..AC-008).
- [x] T003 Add DB-level content/status checks in the FEAT-041 migration (FR-007..FR-010; AC-009..AC-012).
- [x] T004 Add feed, comments, ownership, and like indexes in the migration (FR-011; AC-013).
- [x] T005 Enforce unique `(userId, postId)` and prohibit materialized counters (FR-006, FR-012; AC-014, AC-015).
- [x] T006 Create the additive, seed-free FEAT-041 migration (FR-014; AC-016, AC-017).
- [x] T007 [P] Define Community repository interfaces in the Community module (FR-013; AC-018).
- [x] T008 Implement post repository with root/transaction client support (FR-013; AC-018, AC-019).
- [x] T009 [P] Implement comment repository with root/transaction client support (FR-013; AC-018, AC-019).
- [x] T010 [P] Implement post-like repository with root/transaction client support (FR-013; AC-018, AC-019).
- [x] T011 Register Community repositories in the approved repository factory (FR-013; AC-020).
- [x] T012 [P] Add repository mapping and safe database-error unit tests (FR-013, FR-018; AC-019, AC-021).
- [x] T013 Add live DB tests for UUID, required fields, length, and status checks (FR-002, FR-007..FR-010, FR-016; AC-003, AC-009..AC-012).
- [x] T014 Add live DB tests for all foreign keys and deletion policies (FR-003..FR-005, FR-016; AC-006..AC-008, AC-022).
- [x] T015 Add duplicate and concurrent-like database tests (FR-006, FR-016; AC-014, AC-023).
- [x] T016 Prove no materialized counters, nested comments, or product-domain leakage (FR-012, FR-017; AC-015, AC-024).
- [x] T017 Run fresh isolated migration deploy/status/validate (FR-014, FR-015; AC-016, AC-025).
- [x] T018 Run Phase 5 upgrade preservation and constraint checks (FR-015; AC-026).
- [x] T019 Run canonical 14 with zero mandatory skips (FR-018; AC-027).
- [x] T020 Create `reports/implementation/phase-6/FEAT-041.md` with exact AC evidence (FR-018; AC-028).

## Dependency Order

T001 -> T002 -> T003..T006 -> T007..T011 -> T012..T016 -> T017..T019 -> T020. Tasks marked `[P]` may run concurrently after their prerequisites.
