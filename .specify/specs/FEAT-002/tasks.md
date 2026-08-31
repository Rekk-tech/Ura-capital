# Tasks: Identity Persistence & Auth Configuration

**Feature ID**: FEAT-002  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Input**: `requirement.md`, `spec.md`, `plan.md`, `acceptance.md`  
**Prerequisites**: Human approval of this spec package and FEAT-001 Human Final Gate approval  
**Implementation Agent**: Antigravity after Human approval  
**Tests**: Required because FEAT-002 introduces security-sensitive persistence/configuration prerequisites.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks that touch different files and do not depend on incomplete work.
- **[Story]**: Maps the task to a user story in `spec.md`.
- Every task includes an expected file path.
- Every task maps to requirement/spec/acceptance references in the Traceability section.

## Phase 1: Setup

**Purpose**: Prepare identity persistence work without changing feature behavior beyond FEAT-002.

- [ ] T001 Review FEAT-002 approved spec package before coding in `.specify/specs/FEAT-002/`
- [ ] T002 Review current FEAT-001 repository structure and preserve workspace boundaries in `apps/api`, `apps/web`, and `packages/shared`
- [ ] T003 [P] Add or update Prisma package/tooling configuration for the API workspace in `apps/api/package.json`
- [ ] T004 [P] Add or update database environment documentation with safe dummy values in `.env.example`
- [ ] T005 [P] Create or update identity implementation report skeleton in `reports/implementation/phase-2/FEAT-002.md`

## Phase 2: Foundational

**Purpose**: Establish database, configuration, and repository infrastructure that blocks all FEAT-002 stories.

- [ ] T006 Configure Prisma schema location and datasource for API identity persistence in `apps/api/prisma/schema.prisma`
- [ ] T007 Configure database client boundary in `apps/api/src/infrastructure/database/`
- [ ] T008 Configure identity-safe test database guard utilities in `apps/api/tests/`
- [ ] T009 Extend API environment validation for database/auth settings in `apps/api/src/infrastructure/config/`
- [ ] T010 Add unit tests for missing/invalid database and auth config in `apps/api/tests/unit/`
- [ ] T011 Add unit tests proving secret values are not exposed by config validation failures in `apps/api/tests/unit/`

## Phase 3: User Story 1 - Persist Identity Records Safely (Priority: P1)

**Goal**: Identity records and relationships persist durably with database constraints.

**Independent Test**: Apply the migration to an isolated test database and verify required tables, uniqueness, and foreign-key constraints.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add migration/schema test for required identity tables in `apps/api/tests/integration/identity-schema.test.ts`
- [ ] T013 [P] [US1] Add uniqueness constraint test for normalized identity identifier in `apps/api/tests/integration/identity-schema.test.ts`
- [ ] T014 [P] [US1] Add referential integrity tests for credential, role assignment, refresh session, and audit prerequisite records in `apps/api/tests/integration/identity-schema.test.ts`

### Implementation for User Story 1

- [ ] T015 [US1] Define `User` identity model with normalized unique identifier in `apps/api/prisma/schema.prisma`
- [ ] T016 [US1] Define credential persistence model without password hashing behavior in `apps/api/prisma/schema.prisma`
- [ ] T017 [US1] Define role and user-role assignment models in `apps/api/prisma/schema.prisma`
- [ ] T018 [US1] Define refresh-session prerequisite model without rotation/revocation behavior in `apps/api/prisma/schema.prisma`
- [ ] T019 [US1] Define auth/security audit persistence prerequisite model only if structurally required in `apps/api/prisma/schema.prisma`
- [ ] T020 [US1] Generate identity-scoped Prisma migration under `apps/api/prisma/migrations/`
- [ ] T021 [US1] Create user repository boundary in `apps/api/src/modules/users/`
- [ ] T022 [US1] Create credential repository boundary in `apps/api/src/modules/auth/`
- [ ] T023 [US1] Create role repository boundary without RBAC enforcement in `apps/api/src/modules/auth/`
- [ ] T024 [US1] Create refresh-session repository boundary without refresh behavior in `apps/api/src/modules/auth/`
- [ ] T025 [US1] Create audit repository boundary only if audit persistence prerequisite is included in `apps/api/src/modules/auth/`

**Checkpoint**: Identity persistence primitives exist and are constrained without user-facing auth behavior.

## Phase 4: User Story 2 - Validate Auth Configuration at Startup (Priority: P1)

**Goal**: API config fails safely when auth/database/security values are missing or unsafe.

**Independent Test**: Load config with missing, invalid, and valid values and verify deterministic startup validation behavior.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add tests for missing auth access secret and refresh secret in `apps/api/tests/unit/env.test.ts`
- [ ] T027 [P] [US2] Add tests for invalid access-token TTL range in `apps/api/tests/unit/env.test.ts`
- [ ] T028 [P] [US2] Add tests for invalid refresh-session/token lifetime config in `apps/api/tests/unit/env.test.ts`
- [ ] T029 [P] [US2] Add tests for unsafe production refresh-cookie config in `apps/api/tests/unit/env.test.ts`
- [ ] T030 [P] [US2] Add tests proving valid local/test dummy config passes in `apps/api/tests/unit/env.test.ts`

### Implementation for User Story 2

- [ ] T031 [US2] Add required auth secret validation with no fallback in `apps/api/src/infrastructure/config/`
- [ ] T032 [US2] Add access-token TTL validation for 5-15 minute range in `apps/api/src/infrastructure/config/`
- [ ] T033 [US2] Add refresh-session/token lifetime validation in `apps/api/src/infrastructure/config/`
- [ ] T034 [US2] Add refresh-cookie security config validation in `apps/api/src/infrastructure/config/`
- [ ] T035 [US2] Add optional auth rate-limit config placeholders if needed for Phase 2 continuity in `apps/api/src/infrastructure/config/`
- [ ] T036 [US2] Update safe dummy auth/database configuration examples in `.env.example`

**Checkpoint**: Missing or unsafe auth/database/security config fails before serving traffic.

## Phase 5: User Story 3 - Keep Database Environments Isolated (Priority: P2)

**Goal**: Tests and CI cannot accidentally mutate local, staging, or production databases.

**Independent Test**: Execute database-backed tests in test mode and verify test guards reject non-test targets.

### Tests for User Story 3

- [ ] T037 [P] [US3] Add test for refusing database tests when `NODE_ENV` is not `test` in `apps/api/tests/unit/test-db-guard.test.ts`
- [ ] T038 [P] [US3] Add test for rejecting known non-test database URLs or names in `apps/api/tests/unit/test-db-guard.test.ts`
- [ ] T039 [P] [US3] Add CI/test configuration review test or documented assertion in `apps/api/tests/unit/test-db-guard.test.ts`

### Implementation for User Story 3

- [ ] T040 [US3] Implement isolated test database guard in `apps/api/tests/`
- [ ] T041 [US3] Document database migration and test isolation commands in `README.md` or feature implementation notes
- [ ] T042 [US3] Ensure CI uses safe test database variables or documents database-backed tests as requiring isolated services in `.github/workflows/ci.yml`

**Checkpoint**: Database-backed tests are isolated and fail fast against unsafe targets.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete validation, reporting, and QA handoff evidence.

- [ ] T043 [P] Confirm no public registration, login, token issuance, refresh rotation, logout, RBAC enforcement, admin guard, audit event emission, email verification, or hard account lockout behavior was added in `apps/api/src/`
- [ ] T044 [P] Search/review for hard-coded auth/JWT secrets and fallback secrets across the repository
- [ ] T045 [P] Review repository imports to confirm controllers/services do not depend on Prisma internals in `apps/api/src/`
- [ ] T046 Run lint and record result in `reports/implementation/phase-2/FEAT-002.md`
- [ ] T047 Run typecheck and record result in `reports/implementation/phase-2/FEAT-002.md`
- [ ] T048 Run tests and record result in `reports/implementation/phase-2/FEAT-002.md`
- [ ] T049 Run build and record result in `reports/implementation/phase-2/FEAT-002.md`
- [ ] T050 Map implementation to all FEAT-002 acceptance criteria in `reports/implementation/phase-2/FEAT-002.md`
- [ ] T051 Map implementation to `docs/code-standards.md` and security constraints in `reports/implementation/phase-2/FEAT-002.md`
- [ ] T052 Document known limitations and readiness for QA in `reports/implementation/phase-2/FEAT-002.md`

## Dependencies

- Phase 1 setup tasks must complete before foundational database/config work.
- T006 through T011 block all user stories.
- US1 and US2 are both P1 and may progress in parallel after foundational tasks where file ownership allows.
- US3 depends on foundational test database guard direction and may run after or alongside US1 integration tests.
- Polish tasks require all implementation and tests to be complete.

## Parallel Opportunities

- T003, T004, and T005 can run in parallel.
- T012, T013, and T014 can be written in parallel after schema intent is clear.
- T026 through T030 can be written in parallel because they cover separate config cases.
- T037 through T039 can be written in parallel.
- T043, T044, and T045 can be reviewed in parallel after implementation.

## Traceability

| Task IDs | Requirement/Spec Mapping | Acceptance Criteria |
|----------|--------------------------|---------------------|
| T001-T005 | Requirement scope, FR-001, FR-023 | AC-018, AC-019 |
| T006-T011 | FR-009, FR-011, FR-013 to FR-020 | AC-001, AC-007 to AC-012 |
| T012-T020 | US1, FR-001 to FR-008, FR-011 | AC-001 to AC-006 |
| T021-T025 | US1, FR-009, FR-010 | AC-006, AC-013 |
| T026-T036 | US2, FR-013 to FR-020 | AC-007 to AC-012 |
| T037-T042 | US3, FR-012, FR-021 | AC-014, AC-015 |
| T043 | FR-024 | AC-016 |
| T044 | FR-014, FR-015, FR-020 | AC-009, AC-012 |
| T045 | FR-009, FR-010 | AC-013 |
| T046-T049 | FR-022 | AC-017 |
| T050-T052 | FR-023 | AC-018, AC-019 |

## Implementation Strategy

1. Establish Prisma/config/test isolation prerequisites.
2. Implement identity schema and repositories without behavior from later features.
3. Add configuration validation and safe environment examples.
4. Verify database isolation safeguards.
5. Run full validation and produce implementation report.

## Handoff Rule

Implementation must not begin until Human marks this FEAT-002 spec package as APPROVED.
