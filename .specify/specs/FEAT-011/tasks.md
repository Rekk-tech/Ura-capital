# Tasks: FEAT-011 Persistence Boundary & Legacy Data Elimination

**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Rule**: Do not implement product-domain behavior. Do not begin FEAT-012.

## 1. Preparation

- [ ] T001 Read `docs/AGENT_WORKFLOW.md`, Phase 3 decomposition, ADR-003, ADR-005, environment strategy, code standards, and FEAT-002 through FEAT-010A approved artifacts. Maps to FR-001, AC-014.
- [ ] T002 Confirm Phase 2 is DONE / QA PASS / Human approved and Phase 3 implementation has not started. Maps to FR-009, FR-010, AC-011.
- [ ] T003 Record FEAT-011 scope boundaries before implementation. Maps to FR-014, AC-013.

## 2. Inventory And Classification

- [ ] T004 Search repository for `db.json`. Maps to FR-001, AC-001, AC-005.
- [ ] T005 Search runtime source for mutable JSON-file persistence patterns. Maps to FR-001, FR-003, AC-001, AC-002.
- [ ] T006 Search scripts/tests/docs/specs/reports for legacy persistence references. Maps to FR-001, FR-002, AC-005, AC-006.
- [ ] T007 Classify every finding as prohibited runtime dependency, allowed documentation/reference, allowed test fixture, or false positive. Maps to FR-002, FR-005, FR-006, AC-005, AC-006, AC-007.

## 3. Boundary Enforcement

- [ ] T008 Remove or quarantine any prohibited runtime `db.json` dependency if discovered. Maps to FR-003, FR-004, FR-011, AC-001, AC-002, AC-003.
- [ ] T009 Verify no runtime fallback to JSON-file persistence exists when PostgreSQL or Redis is unavailable. Maps to FR-011, AC-004.
- [ ] T010 Confirm allowed fixture/documentation references cannot act as runtime application persistence. Maps to FR-005, FR-006, AC-006, AC-007.

## 4. Guard Validation

- [ ] T011 Add deterministic guard test or validation script for prohibited runtime `db.json` dependency. Maps to FR-007, FR-008, AC-008, AC-009.
- [ ] T012 Ensure the guard has explicit allowlist/classification behavior for docs and test fixtures. Maps to FR-008, AC-009.
- [ ] T013 Ensure guard failures do not leak secrets, sensitive local config, database URLs, Redis URLs, tokens, cookies, or passwords. Maps to FR-007, AC-010.
- [ ] T014 Add the guard to an appropriate validation path or document the exact command QA must run. Maps to FR-007, AC-008, AC-015.

## 5. Regression Validation

- [ ] T015 Run standard validation: clean, lint, Prisma validate, typecheck, build, and standard tests. Maps to FR-013, AC-011, AC-015.
- [ ] T016 Run PostgreSQL-backed regression tests using an isolated test database. Maps to FR-009, FR-013, AC-011, AC-012.
- [ ] T017 Run Redis-backed regression tests using isolated Redis state. Maps to FR-010, FR-013, AC-011, AC-012.
- [ ] T018 Confirm no Phase 2 auth/security behavior was redesigned or weakened. Maps to FR-009, FR-010, FR-014, AC-011, AC-013.

## 6. Reporting

- [ ] T019 Create `reports/implementation/phase-3/FEAT-011.md` with source inventory, classifications, files changed, validation evidence, limitations, and AC mapping. Maps to FR-012, AC-014, AC-015, AC-016.
- [ ] T020 If DB/Redis validation is environment-blocked, report exact blocker and mark affected evidence `NOT VERIFIED`. Maps to FR-012, FR-013, AC-015, AC-016.
- [ ] T021 Confirm FEAT-012 remains unstarted and Phase 3 tracker state remains accurate. Maps to FR-014, AC-016.

## 7. Prohibited Work

- Do not create product-domain tables.
- Do not introduce JSON import from legacy data.
- Do not implement data seeding.
- Do not expose Redis details on public health response.
- Do not modify FEAT-002 through FEAT-010A semantics.
- Do not start FEAT-012 or Phase 4.
