# FEAT-047 Tasks

- [ ] T001 Verify FEAT-041..046 approvals, QA histories, implementation reports, and commits (FR-001; AC-001, AC-002).
- [ ] T002 Review integrated source, schema, migrations, and CI diff for scope/standards (FR-001, FR-015; AC-003, AC-004).
- [ ] T003 Create independent fresh and Phase 5 upgrade QA databases (FR-002, FR-003; AC-005, AC-006).
- [ ] T004 Run fresh migrate deploy/status/validate (FR-002; AC-005, AC-007).
- [ ] T005 Run Phase 5 upgrade with before/after preservation evidence (FR-003; AC-006, AC-008).
- [ ] T006 Verify Community constraints, indexes, FKs, statuses, and delete policies live (FR-004; AC-009..AC-011).
- [ ] T007 Execute authenticated post lifecycle and DTO/privacy tests (FR-005, FR-009; AC-012..AC-015).
- [ ] T008 Execute flat comment lifecycle, ordering, count, and ownership tests (FR-006, FR-009; AC-016..AC-018).
- [ ] T009 Execute like/unlike idempotency and cross-user isolation tests (FR-007; AC-019..AC-021).
- [ ] T010 Execute same-user and multi-user live concurrency tests (FR-007; AC-022, AC-023).
- [ ] T011 Verify moderation transitions, visibility, and zero public moderation surface (FR-008; AC-024, AC-025).
- [ ] T012 Run forged authority, IDOR, length, malformed input, and diagnostic probes (FR-009; AC-026..AC-028).
- [ ] T013 Run exact rate threshold, Retry-After, proxy spoof, and no-mutation tests (FR-010; AC-029..AC-031).
- [ ] T014 Run Redis multi-instance, outage/read-availability/recovery, key-isolation, and privacy tests (FR-010, FR-012; AC-032..AC-034).
- [ ] T015 Execute real authenticated frontend Community journey and state/accessibility checks (FR-011; AC-035, AC-036).
- [ ] T016 Verify PostgreSQL/Redis authority and product-audit deferral boundaries (FR-012; AC-033, AC-037).
- [ ] T017 Run Phase 2 authentication/RBAC regression (FR-014; AC-038).
- [ ] T018 Run Phase 3 persistence/migration/guard regression (FR-014; AC-038).
- [ ] T019 Run Phase 4 Academy and Phase 5 Simulation regressions (FR-014; AC-038).
- [ ] T020 Run canonical 14 sequentially with no skips and record exact counts (FR-013; AC-039).
- [ ] T021 Verify exact integrated commit CI is green with all mandatory jobs (FR-013; AC-039).
- [ ] T022 Confirm no Phase 7/8/9 or prohibited Community behavior (FR-015; AC-004, AC-040).
- [ ] T023 Reconcile all evidence and classify defects by owning feature/severity (FR-016; AC-001..AC-040).
- [ ] T024 Create `reports/qa/phase-6/PHASE-6-QA.md` with exact PASS/FAIL (FR-016; AC-040).

## Dependency Order

T001 -> T002 -> T003 -> T004..T006 -> T007..T19 -> T020..T022 -> T023 -> T024.
