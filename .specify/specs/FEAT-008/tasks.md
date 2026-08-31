# Tasks: FEAT-008 Admin Authorization Guard

**Status**: APPROVED  
**Feature ID**: FEAT-008  
**Input**: `requirement.md`, `spec.md`, `plan.md`, `acceptance.md`  
**Implementation Rule**: Human has approved this spec package. Do not implement until FEAT-008 is separately handed to Antigravity.

## Format

`- [ ] T### [P?] [Story?] Description with file path`

## Phase 1: Setup

**Purpose**: Confirm approved context and prepare narrow admin-boundary work.

- [ ] T001 Read FEAT-008 approved package in `.specify/specs/FEAT-008/`
- [ ] T002 Review FEAT-007 RBAC implementation in `apps/api/src/modules/auth/authorization.middleware.ts`, `apps/api/src/modules/auth/authorization.constants.ts`, `apps/api/src/modules/auth/authorization.service.ts`, and `apps/api/src/modules/auth/role.seed.ts`
- [ ] T003 Review existing route composition in `apps/api/src/server.ts`, `apps/api/src/modules/auth/auth.route.ts`, and `apps/api/src/modules/health/health.route.ts`; preserve the convention `app.use(adminRouter)` plus full router path `/admin/ping`
- [ ] T004 Confirm no FEAT-009 audit/rate-limit/admin product work is included in planned changes

## Phase 2: Foundational

**Purpose**: Create the minimal admin module boundary without duplicating RBAC.

- [ ] T005 Define admin module route/controller/guard file placement under `apps/api/src/modules/admin/`
- [ ] T006 Define `requireAdmin` thin wrapper in `apps/api/src/modules/admin/admin.guard.ts` using FEAT-007 `requireRole(ROLES.ADMIN)`
- [ ] T007 Confirm `admin.guard.ts` imports FEAT-007 role constants/primitives and does not redefine role constants
- [ ] T008 Confirm admin guard/controller do not import Prisma or query PostgreSQL directly

## Phase 3: US1 - Reuse RBAC Foundation for Admin Guard (Priority: P1)

**Goal**: Provide a canonical reusable admin guard without duplicating authorization policy.

**Independent Test**: Verify `requireAdmin` delegates to FEAT-007 `requireRole(ROLES.ADMIN)` or equivalent thin wrapper behavior.

### Tests for US1

- [ ] T009 [P] [US1] Add unit test for `requireAdmin` delegation/reuse in `apps/api/tests/unit/admin.guard.test.ts`
- [ ] T010 [P] [US1] Add source-level test or assertion proving FEAT-007 `ROLES.ADMIN` is reused in `apps/api/tests/unit/admin.guard.test.ts`
- [ ] T011 [P] [US1] Add test proving admin guard does not manually query Prisma in `apps/api/tests/unit/admin.guard.test.ts` or code review checklist

### Implementation for US1

- [ ] T012 [US1] Implement thin `requireAdmin` wrapper in `apps/api/src/modules/admin/admin.guard.ts`
- [ ] T013 [US1] Export admin guard from an appropriate admin module barrel if project style requires it in `apps/api/src/modules/admin/index.ts`

## Phase 4: US2 - Enforce Admin API Boundary (Priority: P1)

**Goal**: Add one representative admin-protected API route and prove correct 401/403/allowed behavior.

**Independent Test**: Call `GET /admin/ping` with no auth, zero-role auth, USER-only auth, ADMIN auth, USER+ADMIN auth, and spoofed admin values.

### Tests for US2

- [ ] T014 [P] [US2] Add integration test for unauthenticated `GET /admin/ping` returning 401 in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T015 [P] [US2] Add integration test for authenticated zero-role user returning 403 in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T016 [P] [US2] Add integration test for authenticated USER-only user returning 403 in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T017 [P] [US2] Add integration test for authenticated ADMIN user returning 200 and safe body in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T018 [P] [US2] Add integration test for authenticated USER+ADMIN user returning 200 in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T019 [P] [US2] Add spoofing tests for body/query/header admin/role values in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T020 [P] [US2] Add JWT role/admin claim rejection test or verify existing FEAT-004 tests cover admin route path in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T021 [P] [US2] Add direct API bypass test proving non-admin receives 403 without relying on UI in `apps/api/tests/integration/admin-guard.test.ts`

### Implementation for US2

- [ ] T022 [US2] Implement minimal admin ping handler/controller in `apps/api/src/modules/admin/admin.controller.ts`
- [ ] T023 [US2] Implement admin route exactly as `router.get("/admin/ping", authenticate, requireAdmin, handler)` in `apps/api/src/modules/admin/admin.route.ts`
- [ ] T024 [US2] Wire admin route exactly as `app.use(adminRouter)` in existing route entrypoint under `apps/api/src/`; do not create `/admin/admin/ping`
- [ ] T025 [US2] Ensure admin success body is minimal and excludes user roles, role IDs, DB data, tokens, and internals in `apps/api/src/modules/admin/admin.controller.ts`

## Phase 5: US3 - Preserve PostgreSQL Admin Authority and Immediacy (Priority: P1)

**Goal**: Verify ADMIN grant/removal in PostgreSQL affects the next admin authorization check using the same valid JWT.

**Independent Test**: Register/login user, deny admin route, grant ADMIN via FEAT-007 provisioning, allow same token, remove ADMIN, deny same token.

### Tests for US3

- [ ] T026 [P] [US3] Add PostgreSQL-backed zero-role denied test in `apps/api/tests/integration/admin-guard-db.test.ts`
- [ ] T027 [P] [US3] Add PostgreSQL-backed ADMIN grant same-token allowed test with no token refresh, no re-login, and no JWT role mutation in `apps/api/tests/integration/admin-guard-db.test.ts`
- [ ] T028 [P] [US3] Add PostgreSQL-backed ADMIN removal same-token denied test with no token refresh, no re-login, and no JWT role mutation in `apps/api/tests/integration/admin-guard-db.test.ts`
- [ ] T029 [P] [US3] Add PostgreSQL-backed unrelated-user unaffected test in `apps/api/tests/integration/admin-guard-db.test.ts`
- [ ] T030 [P] [US3] Add PostgreSQL-backed malformed role tests proving `["ROOT"]` canonicalizes to `[]` and gets 403, while `["ROOT", "ADMIN"]` canonicalizes to `["ADMIN"]` and gets 200 in `apps/api/tests/integration/admin-guard-db.test.ts`

### Implementation for US3

- [ ] T031 [US3] Reuse FEAT-007 `assignRoleToExistingUser` for PostgreSQL-backed admin provisioning in tests/helpers only
- [ ] T032 [US3] Reuse FEAT-007 `removeRoleFromUser` repository path for ADMIN removal validation in DB tests
- [ ] T033 [US3] Ensure DB tests use isolated test DB guard and do not skip when PostgreSQL is unavailable in `apps/api/tests/integration/admin-guard-db.test.ts`

## Phase 6: US4 - Fail Closed and Avoid Scope Creep (Priority: P1)

**Goal**: Preserve safe failure behavior and prevent FEAT-008 from becoming broader admin/audit/rate-limit work.

**Independent Test**: Simulate DB failure and search source/routes/log behavior for bypasses/scope creep.

### Tests for US4

- [ ] T034 [P] [US4] Add integration/unit test proving DB failure during ADMIN role evaluation follows valid token -> authenticate succeeds -> FEAT-007 role lookup throws -> safe 5xx, not 403, not allowed, in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T035 [P] [US4] Add safe error/log assertion for admin denial and DB failure paths in `apps/api/tests/integration/admin-guard.test.ts`
- [ ] T036 [P] [US4] Add source/route search checklist proving no public role-management API, grant-admin endpoint, self-upgrade, default admin, audit emission, rate limiting, ABAC, permission engine, or tenant authorization

### Implementation for US4

- [ ] T037 [US4] Ensure admin route exposes no product data or operational mutation in `apps/api/src/modules/admin/admin.controller.ts`
- [ ] T038 [US4] Ensure FEAT-008 does not alter FEAT-003 registration, FEAT-004 JWT claims, FEAT-005 refresh behavior, FEAT-006 logout behavior, or FEAT-007 RBAC semantics

## Phase 7: Runtime Smoke and Validation

**Purpose**: Prove the full admin authorization boundary and preserve regressions.

- [ ] T039 [P] Add or update runtime smoke for health/register/login/admin denied/grant ADMIN/same-token allowed/remove ADMIN/same-token denied in `apps/api/tests/smoke/runtime-smoke.ts` or a dedicated admin smoke file
- [ ] T040 [P] Add `admin-guard.test.ts` to the API standard test script in `apps/api/package.json`
- [ ] T041 [P] Add `admin-guard-db.test.ts` to the API DB test script in `apps/api/package.json`
- [ ] T042 Run `npm run clean` and record result in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T043 Run `npm run lint` and record result in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T044 Run `npx prisma validate --schema=apps/api/prisma/schema.prisma` and record result in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T045 Run `npm run typecheck` and record result in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T046 Run `npm run build` and record result in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T047 Run `npm run test` and record result in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T048 Run `npm run test:db` against isolated PostgreSQL and record result in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T049 Run runtime/admin smoke and record result in `reports/implementation/phase-2/FEAT-008.md`

## Phase 8: Reporting

- [ ] T050 Create implementation report at `reports/implementation/phase-2/FEAT-008.md`
- [ ] T051 Map completed implementation to AC-001 through AC-026 in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T052 Document any known limitations and explicitly state no FEAT-009, rate-limit, public role-management, admin product, or default-admin behavior was introduced in `reports/implementation/phase-2/FEAT-008.md`
- [ ] T053 Stop for Codex QA and do not begin FEAT-009

## Dependencies

- Foundational tasks T005-T008 block all user stories.
- US1 blocks US2 because route wiring depends on the admin guard.
- US2 and US3 validate independent dimensions: route behavior and PostgreSQL role immediacy.
- US4 can proceed in parallel after route/guard wiring exists.
- FEAT-009 remains blocked until FEAT-008 receives QA PASS and Human Final Gate approval.

## Parallel Opportunities

- T009-T011 can run in parallel.
- T014-T021 can be written in parallel with admin route contract.
- T026-T030 can be written in parallel after DB helper setup is known.
- T034-T036 can run in parallel with US2/US3 tests.
- T042-T049 are sequential validation commands after implementation is complete.

## Traceability

| Tasks | Requirements | Acceptance Criteria |
|---|---|---|
| T005-T013 | FR-001, FR-002, FR-003, FR-004, FR-024 | AC-001, AC-002, AC-003, AC-021 |
| T014-T025 | FR-005 to FR-015, FR-026 | AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 |
| T026-T033 | FR-017, FR-018, FR-019, FR-020, FR-021 | AC-007, AC-008, AC-009, AC-010, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020 |
| T034-T038 | FR-016, FR-022, FR-023, FR-025, FR-026 | AC-014, AC-022, AC-023, AC-024 |
| T039-T049 | FR-027, FR-028 | AC-025 |
| T050-T053 | FR-029, reporting and handoff | AC-026 |

## Implementation Strategy

1. Reuse FEAT-007 guard primitives first.
2. Add minimal admin route.
3. Write behavior-focused tests for all 401/403/allowed/spoof/failure paths.
4. Add PostgreSQL-backed immediacy tests.
5. Run full validation and document evidence.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED and separately hands FEAT-008 to Antigravity.
