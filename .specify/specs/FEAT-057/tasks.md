# FEAT-057 Tasks

- [ ] T001 Verify FEAT-048..056 Fast-Track feature gates, exact-source CI/checkpoints/integration, any required escalation QA, and D1..D10 closure (FR-002; AC-001, AC-002).
- [ ] T002 Record clean baseline, exact source SHA, environment topology, and zero gate implementation scope (FR-001, FR-017; AC-003, AC-004).
- [ ] T003 Audit schema/migrations and confirm FEAT-048 is the sole Phase 7 migration owner (FR-001, FR-003; AC-005).
- [ ] T004 Execute fresh zero-state migration deploy/status/validate and record order/count (FR-003; AC-006).
- [ ] T005 Build exact Phase 6 upgrade baseline with representative rows and BEFORE evidence (FR-004; AC-007).
- [ ] T006 Apply the real FEAT-048 migration and verify AFTER preservation/new constraints (FR-004, FR-005; AC-008, AC-009).
- [ ] T007 Validate catalog, missing-row FREE, lifecycle, and entitlement resolver matrix (FR-005, FR-006; AC-010..AC-012).
- [ ] T008 Validate safe owned read APIs and enumeration resistance (FR-007; AC-013, AC-014).
- [ ] T009 Validate approved production-provider deferral, provider abstraction/mock isolation, and secret/config failure (FR-008; AC-015, AC-016).
- [ ] T010 Validate signature, replay, duplicate/concurrency, and out-of-order processing (FR-008; AC-017..AC-019).
- [ ] T011 Validate production commerce-surface absence plus isolated lifecycle/reconciliation no-self-upgrade behavior under approved D10 deferral (FR-009; AC-020..AC-022).
- [ ] T012 Validate entitlement guard, same-token immediacy, and authority boundaries (FR-010; AC-023, AC-024).
- [ ] T013 Validate transition audit coupling/state-first/pending reconciliation and FEAT-009 invariance (FR-011; AC-025, AC-026).
- [ ] T014 Validate read-only learner UI, server authority, commerce-navigation absence, privacy, and accessibility under approved D8/D10 (FR-012; AC-027).
- [ ] T015 Validate Redis isolation, TTL, multi-instance, outage, recovery, and transient-only boundary (FR-013; AC-028, AC-029).
- [ ] T016 Audit absence of unauthorized existing-domain gates and public admin/debug/repair surfaces (FR-014, FR-015; AC-030, AC-031).
- [ ] T017 Execute full standard/unit/PostgreSQL/Redis/provider/E2E suites with zero mandatory skips (FR-016; AC-032).
- [ ] T018 Execute canonical lint/typecheck/build/schema validation and all authoritative guards (FR-016; AC-033).
- [ ] T019 Execute and assess Phase 2-6 regression and cross-feature interactions (FR-016; AC-034).
- [ ] T020 Verify exact-source CI GREEN and reconcile implementation/QA evidence (FR-017, FR-019; AC-035).
- [ ] T021 Classify defects by severity/owner and apply PASS/FAIL rules without modifying implementation (FR-018, FR-019; AC-036).
- [ ] T022 Publish `reports/qa/phase-7/PHASE-7-QA.md`; keep Phase 8 blocked pending Human gate (FR-020; AC-036).

## Dependency Order

T001 -> T002/T003 -> T004..T016 -> T017..T019 -> T020 -> T021 -> T022.
