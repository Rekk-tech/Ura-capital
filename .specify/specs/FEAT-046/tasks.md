# FEAT-046 Tasks

- [ ] T001 Freeze Community UI route, DTO, error, and auth contracts (FR-001..FR-003, FR-011; AC-001..AC-005).
- [ ] T002 [P] Implement centralized Community API client (FR-002, FR-015; AC-006..AC-009).
- [ ] T003 Implement TanStack Query feed/detail/comment queries and mutation invalidation (FR-004, FR-007..FR-010; AC-010..AC-013).
- [ ] T004 [P] Build auth/loading/empty/not-found/rate-limit/outage/error states (FR-003, FR-011; AC-014..AC-017).
- [ ] T005 Build post composer with accessible validation UX (FR-005, FR-014; AC-018).
- [ ] T006 Build safe post card and owner removal controls (FR-006, FR-012; AC-019, AC-020).
- [ ] T007 Build feed page with explicit cursor load-more behavior (FR-004; AC-010, AC-021).
- [ ] T008 Build post detail and flat comments list (FR-007, FR-012; AC-022, AC-023).
- [ ] T009 Build comment composer and owner removal controls (FR-008; AC-024).
- [ ] T010 Build pending-only like/unlike interaction with canonical refetch (FR-009, FR-010; AC-011..AC-013, AC-025).
- [ ] T011 Register `/community` routes and navigation under existing providers (FR-001, FR-002; AC-001, AC-026).
- [ ] T012 Apply responsive/accessibility and safe text rendering (FR-012, FR-014; AC-027, AC-028).
- [ ] T013 [P] Add API-client unit tests for paths/bodies/auth/errors (FR-015; AC-006..AC-009).
- [ ] T014 Add feed/post/comment/like component tests (FR-004..FR-013, FR-015; AC-010..AC-025).
- [ ] T015 Add accessibility, keyboard, XSS-safe text, and responsive-state tests (FR-014, FR-015; AC-027, AC-028).
- [ ] T016 Add authenticated runtime learner journey smoke (FR-015; AC-029).
- [ ] T017 Prove no edit/reply/comment-like/admin/public/premium UI and no backend/schema change (FR-013, FR-016; AC-030).
- [ ] T018 Run canonical 14 and frontend regressions (FR-015; AC-031).
- [ ] T019 Create `reports/implementation/phase-6/FEAT-046.md` with exact evidence (FR-015; AC-001..AC-031).

## Dependency Order

T001 -> T002..T004 -> T005..T012 -> T013..T017 -> T018 -> T019.
