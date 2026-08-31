# Tasks: FEAT-007 RBAC Authorization Foundation

**Feature ID**: FEAT-007  
**Status**: APPROVED  
**Input**: `requirement.md`, `spec.md`, `plan.md`, `acceptance.md`  
**Prerequisites**: Human approval of this spec package and FEAT-006 Human Final Gate approval  
**Implementation Agent**: Antigravity after Human approval  
**Tests**: Required because FEAT-007 introduces security-sensitive authorization behavior.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks that touch different files and do not depend on incomplete work.
- **[Story]**: Maps the task to a user story in `spec.md`.
- Every task includes an expected file path.
- Every task maps to requirement/spec/acceptance references in the Traceability section.
- T057-T067 are supplemental security/operability tasks added during final spec review. Execute them with the phase where they are listed.

## Phase 1: Setup

**Purpose**: Prepare RBAC foundation work without implementing FEAT-008 admin behavior.

- [ ] T001 Review approved FEAT-007 spec package before coding in `.specify/specs/FEAT-007/`
- [ ] T002 Review FEAT-002 Role/UserRole schema and repositories in `apps/api/prisma/schema.prisma` and `apps/api/src/modules/auth/`
- [ ] T003 Review FEAT-004 authenticated context middleware in `apps/api/src/modules/auth/auth.middleware.ts`
- [ ] T004 [P] Create implementation report skeleton in `reports/implementation/phase-2/FEAT-007.md`

## Phase 2: Foundational

**Purpose**: Establish constants, types, repository interfaces, and test scaffolding used by all RBAC stories.

- [ ] T005 Define canonical role constants/types for `USER` and `ADMIN` in `apps/api/src/modules/auth/authorization.constants.ts`
- [ ] T006 Define authorization context and policy types in `apps/api/src/modules/auth/authorization.types.ts`
- [ ] T007 Define or extend Role/UserRole repository boundary in `apps/api/src/modules/auth/role.repository.ts`
- [ ] T008 Define idempotent canonical role seed/bootstrap helper in `apps/api/src/modules/auth/role.seed.ts`
- [ ] T009 Add shared safe `FORBIDDEN` error code/constant if missing in `packages/shared/src/constants/`
- [ ] T010 Define runtime `RoleCode` validation/type guard or schema in `apps/api/src/modules/auth/authorization.constants.ts`
- [ ] T067 Confirm no Prisma imports are introduced in controllers by planned RBAC files in `apps/api/src/`

## Phase 3: User Story 1 - Load Server-Side Roles for an Authenticated User (Priority: P1)

**Goal**: Build trusted authorization context from FEAT-004 authenticated user plus PostgreSQL role lookup.

**Independent Test**: Authenticate a user, assign roles in PostgreSQL, build authorization context, and verify roles are server-derived.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add unit tests for building authorization context from authenticated user ID in `apps/api/tests/unit/authorization.service.test.ts`
- [ ] T012 [P] [US1] Add tests proving body/query/header role or admin fields are ignored in `apps/api/tests/integration/rbac.test.ts`
- [ ] T013 [P] [US1] Add PostgreSQL-backed test proving role changes are reflected without new access token in `apps/api/tests/integration/rbac-db.test.ts`
- [ ] T057 [P] [US1] Add tests proving unknown persisted role codes cannot authorize in `apps/api/tests/unit/authorization.service.test.ts`
- [ ] T058 [P] [US1] Add tests proving role lists are unique, canonical, and lexical ascending in `apps/api/tests/unit/authorization.service.test.ts`

### Implementation for User Story 1

- [ ] T014 [US1] Implement role lookup repository method for deterministic user role codes in `apps/api/src/modules/auth/role.repository.ts`
- [ ] T015 [US1] Implement authorization context builder in `apps/api/src/modules/auth/authorization.service.ts`
- [ ] T016 [US1] Integrate authorization context with existing FEAT-004 authenticated request context in `apps/api/src/modules/auth/authorization.middleware.ts`
- [ ] T017 [US1] Ensure authorization context excludes credential/session/token/secret internals in `apps/api/src/modules/auth/authorization.types.ts`
- [ ] T059 [US1] Implement runtime role-code validation and deterministic unique canonical role ordering in `apps/api/src/modules/auth/authorization.service.ts`

**Checkpoint**: Authenticated users can receive server-derived role context without trusting client role input.

## Phase 4: User Story 2 - Evaluate Role Requirements Safely (Priority: P1)

**Goal**: Provide reusable role checks that allow users with required roles and deny users without them.

**Independent Test**: Exercise role-protected behavior with no role, matching role, wrong role, and multi-role users.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add unit tests for `hasRole` and `hasAnyRole` behavior in `apps/api/tests/unit/authorization.service.test.ts`
- [ ] T019 [P] [US2] Add integration tests for authenticated user with required role allowed in `apps/api/tests/integration/rbac.test.ts`
- [ ] T020 [P] [US2] Add integration tests for authenticated user without required role denied with 403 in `apps/api/tests/integration/rbac.test.ts`
- [ ] T021 [P] [US2] Add integration tests for any-role matching with multi-role user in `apps/api/tests/integration/rbac.test.ts`
- [ ] T060 [P] [US2] Add integration test proving authenticated zero-role user fails `requireRole(USER)` with 403 in `apps/api/tests/integration/rbac.test.ts`

### Implementation for User Story 2

- [ ] T022 [US2] Implement minimal authorization helpers in `apps/api/src/modules/auth/authorization.service.ts`
- [ ] T023 [US2] Implement `requireRole` or `requireAnyRole` middleware primitive in `apps/api/src/modules/auth/authorization.middleware.ts`
- [ ] T024 [US2] Add representative generic/test-mounted role-protected route wiring for tests only in `apps/api/tests/integration/rbac.test.ts`
- [ ] T025 [US2] Map successful trusted lookup with insufficient-role failures to safe 403 error envelope in `apps/api/src/modules/auth/authorization.middleware.ts`

**Checkpoint**: Generic RBAC role checks are independently testable without implementing FEAT-008 admin business behavior.

## Phase 5: User Story 3 - Fail Closed on Missing or Broken Authorization State (Priority: P1)

**Goal**: Authorization denies access when role state cannot be trusted.

**Independent Test**: Simulate missing auth, role lookup failure, malformed role data, and database failure.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add missing-auth 401 test for role-protected behavior in `apps/api/tests/integration/rbac.test.ts`
- [ ] T027 [P] [US3] Add role lookup failure deny-by-default unit test in `apps/api/tests/unit/authorization.middleware.test.ts`
- [ ] T028 [P] [US3] Add malformed/unknown role data rejection test in `apps/api/tests/unit/authorization.service.test.ts`
- [ ] T029 [P] [US3] Add safe error/log leakage test for authorization failures in `apps/api/tests/integration/rbac.test.ts`
- [ ] T061 [P] [US3] Add test proving DB/role repository failure is not reported as normal insufficient-role 403 in `apps/api/tests/unit/authorization.middleware.test.ts`

### Implementation for User Story 3

- [ ] T030 [US3] Implement deny-by-default handling for repository/service failures in `apps/api/src/modules/auth/authorization.service.ts`
- [ ] T031 [US3] Ensure missing authentication context maps to 401 in `apps/api/src/modules/auth/authorization.middleware.ts`
- [ ] T032 [US3] Ensure role lookup failure or malformed role state maps to safe denial without raw internals in `apps/api/src/modules/auth/authorization.middleware.ts`
- [ ] T033 [US3] Preserve logging sanitizer behavior for authorization failure paths in `apps/api/src/middleware/` and `apps/api/src/infrastructure/logging/`
- [ ] T062 [US3] Ensure role repository/PostgreSQL failure maps to safe infrastructure/internal failure rather than ordinary 403 in `apps/api/src/modules/auth/authorization.middleware.ts`

**Checkpoint**: RBAC fails closed and does not leak sensitive internals.

## Phase 6: User Story 4 - Seed and Preserve Canonical Roles (Priority: P2)

**Goal**: Canonical roles exist reproducibly without creating privileged accounts or changing registration semantics.

**Independent Test**: Run seed/bootstrap twice, inspect DB roles, verify no users/admin credentials are created, and verify duplicate user-role assignment rejection.

### Tests for User Story 4

- [ ] T034 [P] [US4] Add unit test for canonical role seed idempotency in `apps/api/tests/unit/role.seed.test.ts`
- [ ] T035 [P] [US4] Add PostgreSQL-backed role seed idempotency test in `apps/api/tests/integration/rbac-db.test.ts`
- [ ] T036 [P] [US4] Add PostgreSQL-backed duplicate `UserRole` rejection test in `apps/api/tests/integration/rbac-db.test.ts`
- [ ] T037 [P] [US4] Add test proving role seed creates no default admin user/credentials in `apps/api/tests/integration/rbac-db.test.ts`
- [ ] T038 [P] [US4] Add regression test proving FEAT-003 registration does not silently assign role unless Human-approved in `apps/api/tests/integration/rbac-db.test.ts`
- [ ] T063 [P] [US4] Add regression test proving FEAT-003 registration creates a zero-role user under current scope in `apps/api/tests/integration/rbac-db.test.ts`
- [ ] T064 [P] [US4] Add tests for server-side operational role provisioning boundary in `apps/api/tests/unit/role.seed.test.ts`

### Implementation for User Story 4

- [ ] T039 [US4] Implement idempotent canonical role bootstrap in `apps/api/src/modules/auth/role.seed.ts`
- [ ] T040 [US4] Implement repository assignment helper for internal/test/bootstrap use only in `apps/api/src/modules/auth/role.repository.ts`
- [ ] T041 [US4] Document role seed usage and no-default-admin rule in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T042 [US4] Confirm no public role assignment endpoint or role management UI is introduced in `apps/api/src/` and `apps/web/src/`
- [ ] T065 [US4] Define explicit operational role assignment command/helper boundary in `apps/api/src/modules/auth/role.seed.ts`
- [ ] T066 [US4] Document role seed/provisioning usage, zero-role registration consequence, and no-default-admin rule in `reports/implementation/phase-2/FEAT-007.md`

**Checkpoint**: Canonical roles can be established safely and repeated without privilege side effects.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate security, scope, regression, and QA handoff evidence.

- [ ] T043 [P] Search for client-trusted role/admin/body/query/header authorization across `apps/api/src/`
- [ ] T044 [P] Search for role/admin claims added to access tokens in `apps/api/src/modules/auth/`
- [ ] T045 [P] Search for FEAT-008 admin business route, audit emission, rate limiting, role-management UI/API, or default admin credentials across the repository
- [ ] T046 [P] Review Redis usage to confirm no durable role authority in `apps/api/src/`
- [ ] T047 Run `npm run clean` and record result in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T048 Run `npm run lint` and record result in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T049 Run `npx prisma validate --schema=apps/api/prisma/schema.prisma` and record result in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T050 Run `npm run typecheck` and record result in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T051 Run `npm run build` and record result in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T052 Run `npm run test` and record result in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T053 Run `npm run test:db` against an isolated PostgreSQL test database and record result in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T054 Run runtime/API smoke for representative authenticated/role-allowed/role-denied behavior if route wiring changes in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T055 Map implementation to all FEAT-007 acceptance criteria in `reports/implementation/phase-2/FEAT-007.md`
- [ ] T056 Document known limitations, unresolved Human decisions, and readiness for QA in `reports/implementation/phase-2/FEAT-007.md`

## Dependencies

- Phase 1 setup must complete before implementation tasks.
- T005 through T010 and T067 block all user stories.
- US1 blocks US2 and US3 because authorization checks depend on trusted role context.
- US4 can run after foundational repository/seed design is available and may proceed alongside US2/US3 tests where file ownership allows.
- Polish tasks require all implementation and tests to be complete.

## Parallel Opportunities

- T002, T003, and T004 can run in parallel.
- T011 through T013 can be written in parallel.
- T018 through T021 can be written in parallel.
- T026 through T029 can be written in parallel.
- T034 through T038 can be written in parallel.
- T043 through T046 can be reviewed in parallel after implementation.
- T057 through T064 can be written in parallel with their matching user-story test groups after foundational tasks.

## Traceability

| Task IDs | Requirement/Spec Mapping | Acceptance Criteria |
|----------|--------------------------|---------------------|
| T001-T004 | Requirement scope, dependencies, implementation report | AC-024, AC-025, AC-026 |
| T005-T010, T067 | FR-001, FR-002, FR-008, FR-009, FR-030, canonical roles | AC-001, AC-009, AC-010, AC-016, AC-027 |
| T011-T017, T057-T059 | US1, FR-003 to FR-007, FR-016, FR-030, FR-031 | AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-015, AC-027, AC-029 |
| T018-T025, T060 | US2, FR-010 to FR-014, FR-023, FR-025 | AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-028 |
| T026-T033, T061-T062 | US3, FR-014, FR-015, FR-023, FR-024, FR-032 | AC-007, AC-008, AC-011, AC-012, AC-018, AC-026 |
| T034-T042, T063-T066 | US4, FR-011, FR-017 to FR-020, FR-033 to FR-035 | AC-010, AC-013, AC-014, AC-016, AC-017, AC-018, AC-028, AC-030, AC-031, AC-032 |
| T043-T046 | FR-004, FR-007, FR-021, FR-022, FR-026 | AC-004, AC-019, AC-020, AC-021, AC-022 |
| T047-T054 | FR-027, FR-028 | AC-023, AC-024, AC-025 |
| T055-T056 | FR-029, reporting and QA handoff | AC-026 |

## Implementation Strategy

1. Establish constants/types and repository contracts.
2. Build role context from FEAT-004 authenticated user.
3. Add generic authorization primitives and deny-by-default behavior.
4. Add role seed/bootstrap and DB-backed role assignment validation.
5. Run full validation and produce implementation report.

## Handoff Rule

Implementation must not begin until Human marks this FEAT-007 spec package as APPROVED and separately hands FEAT-007 to Antigravity.
