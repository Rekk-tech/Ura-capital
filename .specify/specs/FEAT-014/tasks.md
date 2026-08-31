# Tasks: FEAT-014 Core Domain Constraint Baseline

**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation**: Complete; ready for QA  

## 1. Task List

### T001 - Review Approved Data Foundation Context

Status: TODO  
Maps to: FR-001, FR-013, FR-019; AC-001, AC-026, AC-029

- Review ADR-003, FEAT-011, FEAT-012, FEAT-013, environment strategy, and code standards.
- Confirm existing approved schema and validation commands before making any change.

### T002 - Inventory Existing Prisma Constraint Patterns

Status: TODO  
Maps to: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009; AC-002, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017

- Inventory current Prisma models, IDs, relationships, constraints, indexes, timestamps, enums/statuses, and deletion policies.
- Record whether existing approved schema already demonstrates each baseline category.

### T003 - Create Constraint Standards Documentation

Status: TODO  
Maps to: FR-001, FR-015, FR-016; AC-001, AC-003, AC-004, AC-005, AC-006

- Create or update a durable governance document such as `docs/data-constraint-standards.md`.
- Classify each rule as `MUST`, `SHOULD`, or `DOMAIN-SPECIFIC DECISION`.

### T004 - Define UUID Primary Key Rules

Status: TODO  
Maps to: FR-002, FR-015; AC-007

- Document approved UUID primary key pattern.
- Document exceptions requiring Human approval.

### T005 - Define Foreign Key And Cardinality Rules

Status: TODO  
Maps to: FR-003, FR-009, FR-015; AC-008, AC-016, AC-017

- Document required FK usage, one-to-one, one-to-many, many-to-many, optional relation, and deletion policy expectations.

### T006 - Define Required Field And `NOT NULL` Rules

Status: TODO  
Maps to: FR-004, FR-010, FR-015; AC-009, AC-018

- Document required invariant handling.
- State explicitly that request validation does not replace DB `NOT NULL`.

### T007 - Define Unique And Composite Unique Rules

Status: TODO  
Maps to: FR-005, FR-010, FR-011, FR-015; AC-010, AC-011, AC-019, AC-020

- Document uniqueness, composite uniqueness, race handling, and safe duplicate error mapping expectations.

### T008 - Define Indexing Rules

Status: TODO  
Maps to: FR-006, FR-015; AC-012

- Document integrity indexes, FK/query-path index review, and prohibition on speculative indexes.

### T009 - Define Timestamp Rules

Status: TODO  
Maps to: FR-007, FR-015; AC-013

- Document mutable-record and immutable-event timestamp expectations.

### T010 - Define Enum/Status Integrity Rules

Status: TODO  
Maps to: FR-008, FR-010, FR-015; AC-014

- Document closed-set status handling through DB/Prisma constraints.
- Distinguish allowed values from domain transition logic.

### T011 - Define Delete Policy Standards

Status: TODO  
Maps to: FR-009, FR-018; AC-015, AC-016

- Document restrict/no-action, cascade, set-null, and soft-delete non-decision.
- Require future features to choose deletion policy explicitly.

### T012 - Define DB Constraints Vs Application Validation Boundary

Status: TODO  
Maps to: FR-010, FR-011; AC-018, AC-019, AC-020

- Document validation layering and concurrency race expectations.
- Prohibit application-only durable invariants.

### T013 - Define Prohibited Patterns And Exception Process

Status: TODO  
Maps to: FR-016, FR-017, FR-018; AC-004, AC-005, AC-006, AC-027, AC-028

- Document prohibited schema and migration patterns.
- Define Human approval path for exceptions and destructive/data-loss migrations.

### T014 - Design PostgreSQL Constraint Test Coverage

Status: TODO  
Maps to: FR-012, FR-014; AC-021, AC-022, AC-023, AC-024, AC-025

- Choose existing approved schema constraints and/or test-only fixtures/helpers.
- Ensure test approach does not create product-domain application migrations.

### T015 - Implement UUID Constraint Verification

Status: TODO  
Maps to: FR-002, FR-012, FR-014; AC-007, AC-021

- Add live PostgreSQL evidence for UUID primary key behavior using approved schema or test-only fixtures.

### T016 - Implement `NOT NULL` Constraint Verification

Status: TODO  
Maps to: FR-004, FR-010, FR-012, FR-014; AC-009, AC-018, AC-021

- Add live PostgreSQL evidence that missing required durable values are rejected by the DB.

### T017 - Implement Unique Constraint Verification

Status: TODO  
Maps to: FR-005, FR-011, FR-012, FR-014; AC-010, AC-019, AC-021

- Add live PostgreSQL evidence for duplicate unique-value rejection.

### T018 - Implement Composite Unique Constraint Verification

Status: TODO  
Maps to: FR-005, FR-011, FR-012, FR-014; AC-011, AC-019, AC-021

- Add live PostgreSQL evidence for duplicate composite-pair rejection.

### T019 - Implement Foreign Key Constraint Verification

Status: TODO  
Maps to: FR-003, FR-012, FR-014; AC-008, AC-021

- Add live PostgreSQL evidence for invalid FK rejection and valid FK acceptance.

### T020 - Implement Delete Policy Verification

Status: TODO  
Maps to: FR-009, FR-012, FR-014; AC-015, AC-016, AC-021

- Verify approved cascade/restrict/set-null semantics where available through existing schema or test fixtures.
- If a category cannot be safely demonstrated, document it as `NOT APPLICABLE IN CURRENT SCHEMA` with rationale and future-feature requirement.

### T021 - Implement Enum/Status Constraint Verification

Status: TODO  
Maps to: FR-008, FR-012, FR-014; AC-014, AC-021

- Verify closed-set status behavior where existing schema or test-only fixtures make it possible.
- Do not add product-domain enums solely for demonstration.

### T022 - Verify Application Validation Is Not Used As DB Replacement

Status: TODO  
Maps to: FR-010, FR-011; AC-018, AC-019, AC-020

- Review and test that durable uniqueness/FK/required invariants rely on database constraints.
- Confirm pre-checks do not claim race protection.

### T023 - Verify Migration Compatibility

Status: TODO  
Maps to: FR-013, FR-017, FR-019; AC-026, AC-027, AC-029

- Run fresh migration deploy/status using isolated PostgreSQL.
- Confirm no destructive or product-domain migration is introduced.
- Confirm FEAT-002 through FEAT-013 schema remains compatible.

### T024 - Verify Product-Domain Schema Prohibition

Status: TODO  
Maps to: FR-013, FR-014, FR-017, FR-018; AC-027, AC-028

- Review Prisma schema and migrations for prohibited Academy, Simulation, Community, Subscription, AI, or placeholder product tables.
- Confirm no global soft-delete convention is added.

### T025 - Run Persistence, Migration, And Boundary Guards

Status: TODO  
Maps to: FR-013, FR-019; AC-026, AC-029, AC-030

- Run `npm run guard:persistence`.
- Run `npm run guard:migration`.
- Run `npm run guard:boundary`.
- Run any FEAT-014-specific constraint guard if added.

### T026 - Run Full Regression

Status: TODO  
Maps to: FR-019; AC-029, AC-030

- Run required validation from repository root:
  - `npm run clean`
  - `npm run lint`
  - `npx prisma validate --schema=apps/api/prisma/schema.prisma`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test`
  - `npm run test:db`
  - `npm run test:redis`
  - `npm run guard:persistence`
  - `npm run guard:migration`
  - `npm run guard:boundary`

### T027 - Review Security And Data-Integrity Output

Status: TODO  
Maps to: FR-012, FR-020; AC-022, AC-025, AC-031

- Confirm constraint failures and reports do not leak database URLs, credentials, secrets, tokens, cookies, passwords, SQL values, or sensitive local paths.

### T028 - Produce Implementation Report

Status: TODO  
Maps to: FR-020; AC-031, AC-032

- Create `reports/implementation/phase-3/FEAT-014.md`.
- Include standards, changed files, commands, PostgreSQL evidence, migration compatibility, regression results, limitations, and AC mapping.
- Do not claim validation that was not actually run.

### T029 - Confirm Governance State

Status: TODO  
Maps to: FR-020; AC-032

- Keep FEAT-014 in QA/review after implementation.
- Keep FEAT-015+ blocked until Human-approved progression.
- Keep Phase 4 blocked.

## 2. Dependency Order

1. T001-T002
2. T003-T013
3. T014
4. T015-T022
5. T023-T025
6. T026-T027
7. T028-T029

## 3. Scope Guard

If implementation discovers that proving a constraint requires a product-domain migration, Antigravity must stop and request Human/Codex review. FEAT-014 must not create speculative product-domain schema.
