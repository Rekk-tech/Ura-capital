# Tasks: FEAT-012 Migration Reproducibility & Schema Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Implementation Rule**: Do not create product-domain schema. Do not begin FEAT-013.

## 1. Preparation

- [ ] T001 Read `docs/AGENT_WORKFLOW.md`, Phase 3 decomposition, `docs/progress-tracker.md`, ADR-003, environment strategy, FEAT-002 through FEAT-011 approved artifacts, and latest QA reports. Maps to FR-001, FR-016, AC-019.
- [ ] T002 Confirm FEAT-011 is DONE / QA PASS / Human approved and FEAT-013+ remain blocked. Maps to FR-016, AC-022.
- [ ] T003 Record FEAT-012 scope boundaries before implementation, including no product-domain schema or behavior. Maps to FR-017, AC-021.

## 2. Migration Workflow Definition

- [ ] T004 Document the approved Prisma migration commands for deploy, status, and validate. Maps to FR-001, FR-004, FR-005, AC-001, AC-003.
- [ ] T005 Define local migration rules, including local-only `.env` convenience and disposable reset boundaries. Maps to FR-013, AC-007, AC-016.
- [ ] T006 Define test and CI migration rules requiring explicit isolated database configuration and no developer-local `.env` dependency. Maps to FR-006, FR-014, AC-009, AC-010.
- [ ] T007 Define staging and production migration rules requiring protected configuration, pre-deploy review, deploy/status evidence, and no reset. Maps to FR-015, AC-007, AC-016.

## 3. Fresh Zero-State Validation

- [ ] T008 Create or document creation of a fresh isolated PostgreSQL database for FEAT-012 validation. Maps to FR-002, FR-007, AC-001, AC-011.
- [ ] T009 Run migration deploy from zero-state using explicit environment variables. Maps to FR-002, FR-004, AC-001, AC-009.
- [ ] T010 Run migration status after deploy and confirm schema is up to date. Maps to FR-005, AC-002, AC-003.
- [ ] T011 Record migration list/count and safe database identifier without exposing credentials. Maps to FR-018, AC-020.

## 4. Existing-Schema Upgrade Validation

- [ ] T012 Prepare an isolated existing-schema database at the latest approved FEAT-011/Phase 2 schema state. Maps to FR-003, AC-004.
- [ ] T013 Insert representative Phase 2 data: user, credential, role, user-role assignment, refresh session, and auth security audit record. Maps to FR-003, AC-004, AC-005.
- [ ] T014 Apply current migrations to the existing-schema database. Maps to FR-003, FR-004, AC-004.
- [ ] T015 Verify representative rows survive and remain queryable after migration. Maps to FR-003, AC-005, AC-006.
- [ ] T016 Verify key Phase 2 database constraints still reject invalid/duplicate/orphaned records. Maps to FR-016, AC-006, AC-019.

## 5. Isolation Guard And Environment Safety

- [ ] T017 Review the existing test database guard and identify whether migration commands are protected by it. Maps to FR-007, FR-008, AC-011.
- [ ] T018 Add or extend guard coverage so migration/database validation rejects unsafe local/staging/production-like targets. Maps to FR-007, FR-008, AC-011, AC-012.
- [ ] T019 Add negative validation for missing, ambiguous, development, staging, and production-like database targets. Maps to FR-007, FR-008, AC-011.
- [ ] T020 Ensure guard and validation errors sanitize database credentials and full URLs. Maps to FR-018, AC-012, AC-020.

## 6. Migration Governance Checks

- [ ] T021 Define non-destructive migration review classification for drop, rename, nullable-to-required, uniqueness, raw SQL, and data backfill risks. Maps to FR-009, AC-013.
- [ ] T022 Add review documentation or validation helper that flags destructive/data-loss migration patterns for Human approval. Maps to FR-009, FR-010, AC-013, AC-014.
- [ ] T023 Define applied migration immutability and checksum-drift handling. Maps to FR-011, AC-017.
- [ ] T024 Verify migration ordering is deterministic and reviewable. Maps to FR-012, AC-018.
- [ ] T025 Define rollback and forward-fix rules for disposable local/test versus shared/staging/production-like environments. Maps to FR-013, AC-016.

## 7. Regression Validation

- [ ] T026 Run standard validation: clean, lint, Prisma validate, typecheck, build, and standard tests. Maps to FR-016, AC-019.
- [ ] T027 Run PostgreSQL-backed regression tests with an isolated test database. Maps to FR-016, AC-006, AC-019.
- [ ] T028 Run Redis-backed regression tests with isolated Redis state. Maps to FR-016, AC-019.
- [ ] T029 Run persistence guard validation. Maps to FR-016, AC-019.
- [ ] T030 Confirm FEAT-002 through FEAT-011 behavior was not redesigned or weakened. Maps to FR-016, FR-017, AC-019, AC-021.

## 8. Reporting And Governance

- [ ] T031 Create `reports/implementation/phase-3/FEAT-012.md` with commands, database targets, migration evidence, guard evidence, limitations, validation results, and AC mapping. Maps to FR-018, AC-020, AC-022.
- [ ] T032 If any live DB/Redis/migration validation is environment-blocked, mark it `NOT VERIFIED` with exact blocker and do not claim PASS. Maps to FR-018, AC-020.
- [ ] T033 Update governance state only as allowed: FEAT-012 ready for QA after implementation; FEAT-013 remains blocked until FEAT-012 Human Final Gate approval. Maps to FR-018, AC-022.

## 9. Prohibited Work

- Do not create Academy, Simulation, Community, Subscription, AI, or other product-domain tables.
- Do not use `prisma db push` as a substitute for migration governance.
- Do not run destructive reset against shared/staging/production-like databases.
- Do not edit applied migrations to hide drift.
- Do not rely on developer-local `.env` for QA/CI validation evidence.
- Do not change FEAT-002 through FEAT-011 semantics.
- Do not start FEAT-013 or Phase 4.
