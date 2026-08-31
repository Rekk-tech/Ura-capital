# Tasks: FEAT-006 Logout & Session Invalidation

**Feature ID**: FEAT-006  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-26  
**Scope**: Planning only. No application code implementation.

## Phase 1: Context and Setup

- [ ] T001 Read required governance/context docs before implementation. Maps to FR-028, AC-026, AC-028.
- [ ] T002 Read ADR-003, ADR-004, and ADR-005 before implementation. Maps to FR-018, FR-019, FR-020, AC-019, AC-020, AC-021, AC-025.
- [ ] T003 Read approved FEAT-002 through FEAT-005 specs, implementation reports, and QA reports. Maps to FR-028, AC-026.
- [ ] T004 Confirm no FEAT-007, RBAC, admin, audit, rate-limit, logout-all, or session-management scope is introduced before coding. Maps to FR-006, FR-021, FR-025, AC-012, AC-022, AC-024.

## Phase 2: Cookie and Contract Foundations

- [ ] T005 Add or extend centralized refresh clear-cookie helper using FEAT-005 cookie name, Path=/, Domain, SameSite, Secure, and HttpOnly semantics in `apps/api/src/modules/auth/refresh-cookie.ts`. Maps to FR-009, FR-010, AC-003, AC-004.
- [ ] T006 Add unit tests for clear-cookie attributes and browser-compatible expiry in `apps/api/tests/unit/refresh-cookie.test.ts`. Maps to FR-009, FR-010, AC-003, AC-004.
- [ ] T007 Define logout response constants/error codes without sensitive data in `apps/api/src/modules/auth/auth-errors.ts` or existing auth error module. Maps to FR-012, FR-014, FR-017, FR-024, AC-013, AC-014, AC-016, AC-023.
- [ ] T008 Verify FEAT-005 refresh-token verifier primitive is reused and no second verifier/token implementation is introduced. Maps to FR-003, FR-007, FR-024, AC-005, AC-008, AC-023.

## Phase 3: User Story 1 - Logout Current Session (Priority: P1)

**Goal**: A valid current refresh session can be revoked and the cookie cleared.

**Independent Test**: Login, call logout with refresh cookie, verify `204`, clear-cookie header, DB revocation with `USER_LOGOUT`, and refresh-after-logout rejection.

- [ ] T009 [P] [US1] Add API integration test for `POST /auth/logout` valid current-session logout in `apps/api/tests/integration/logout.test.ts`. Maps to FR-001, FR-007, FR-009, FR-011, FR-012, AC-001, AC-003, AC-005, AC-007.
- [ ] T010 [P] [US1] Add API integration test for `POST /api/auth/logout` alias using the same cookie behavior in `apps/api/tests/integration/logout.test.ts`. Maps to FR-002, FR-009, AC-001, AC-003, AC-004.
- [ ] T011 [P] [US1] Add PostgreSQL-backed test proving logout revokes current session durably with `USER_LOGOUT` in `apps/api/tests/integration/logout-db.test.ts`. Maps to FR-007, FR-008, FR-018, AC-005, AC-006, AC-019, AC-027.
- [ ] T012 [P] [US1] Add PostgreSQL-backed test proving refresh after logout fails and mints no access token in `apps/api/tests/integration/logout-db.test.ts`. Maps to FR-011, FR-015, AC-007.
- [ ] T013 [US1] Implement logout service current active session revocation through existing auth service/repository boundaries in `apps/api/src/modules/auth/logout.service.ts`. Maps to FR-003, FR-007, FR-008, FR-018, FR-019, AC-005, AC-006, AC-008, AC-019, AC-025.
- [ ] T014 [US1] Add logout route/controller for canonical `POST /auth/logout` in existing auth routing/controller files. Maps to FR-001, FR-012, AC-001, AC-008.
- [ ] T015 [US1] Add tested alias `POST /api/auth/logout` through existing alias routing convention. Maps to FR-002, AC-001, AC-004.
- [ ] T016 [US1] Wire successful logout to clear refresh cookie only after durable revocation succeeds. Maps to FR-009, FR-010, FR-016, AC-003, AC-004, AC-016, AC-017.

## Phase 4: User Story 2 - Prevent Client Authority Abuse (Priority: P1)

**Goal**: Logout target is selected only by refresh cookie and server-side session state.

**Independent Test**: Submit misleading body/access-token identity with a valid cookie and prove only the cookie-derived current session is affected.

- [ ] T017 [P] [US2] Add integration test proving body `userId`, `sessionId`, `familyId`, `role`, and `admin` cannot select logout target in `apps/api/tests/integration/logout.test.ts`. Maps to FR-004, AC-008, AC-009.
- [ ] T018 [P] [US2] Add DB-backed test proving unrelated same-user and other-user sessions remain active after current-session logout in `apps/api/tests/integration/logout-db.test.ts`. Maps to FR-005, FR-006, AC-011, AC-012.
- [ ] T019 [US2] Ensure logout controller ignores or rejects client body identity fields without using them as authority. Maps to FR-004, AC-008, AC-009.
- [ ] T020 [US2] Ensure supplied access token is not used to select a refresh session in logout service/controller flow. Maps to FR-004, FR-020, AC-010, AC-021.
- [ ] T021 [US2] Verify no public logout-all or revoke-all endpoint is registered. Maps to FR-006, FR-025, AC-012, AC-024.

## Phase 5: User Story 3 - Idempotent Safe Logout (Priority: P1)

**Goal**: Repeated or invalid logout attempts leave the client logged out without leaking session existence.

**Independent Test**: Missing, malformed, unknown, expired, revoked, and consumed cookies all produce approved idempotent safe response when no DB persistence failure occurs.

- [ ] T022 [P] [US3] Add integration tests for missing refresh cookie idempotent `204` and clear-cookie behavior in `apps/api/tests/integration/logout.test.ts`. Maps to FR-013, FR-014, AC-013, AC-014.
- [ ] T023 [P] [US3] Add integration tests for malformed and unknown refresh cookies returning safe idempotent logout in `apps/api/tests/integration/logout.test.ts`. Maps to FR-013, FR-014, FR-024, AC-015, AC-023.
- [ ] T024 [P] [US3] Add DB-backed tests for expired, already revoked, and consumed sessions returning safe idempotent logout without access-token issuance in `apps/api/tests/integration/logout-db.test.ts`. Maps to FR-013, FR-014, FR-015, AC-015.
- [ ] T025 [US3] Implement idempotent result mapping for missing/invalid/inactive sessions in logout service. Maps to FR-013, FR-014, AC-013, AC-014, AC-015.
- [ ] T026 [US3] Ensure idempotent logout responses contain no JSON body, token, session ID, family ID, or credential data. Maps to FR-012, FR-014, FR-024, AC-013, AC-023.

## Phase 6: User Story 4 - Preserve Security Boundaries and Failure Safety (Priority: P1)

**Goal**: Logout never reports false success on DB revocation failure and never leaks sensitive details.

**Independent Test**: Simulate DB failure during active-session revocation and inspect response/logs for safe failure and absence of cookie-clear false success.

- [ ] T027 [P] [US4] Add unit test for DB failure result mapping in `apps/api/tests/unit/logout.service.test.ts`. Maps to FR-016, FR-017, AC-016, AC-017.
- [ ] T028 [P] [US4] Add integration test simulating repository/DB failure and asserting no `204` and no successful clear-cookie response in `apps/api/tests/integration/logout.test.ts`. Maps to FR-016, FR-017, AC-016, AC-017.
- [ ] T029 [P] [US4] Add log-capture test proving no raw refresh token, verifier/hash, full Cookie header, access token, secrets, raw Prisma error, DB credential, or stack trace leaks in `apps/api/tests/integration/logout.test.ts`. Maps to FR-024, AC-023.
- [ ] T030 [US4] Implement safe database failure handling through existing error middleware/envelope in logout service/controller. Maps to FR-016, FR-017, AC-016, AC-017.
- [ ] T031 [US4] Confirm PostgreSQL remains authoritative and no Redis durable logout authority is introduced in `apps/api/src/`. Maps to FR-018, AC-019, AC-020.
- [ ] T032 [US4] Confirm controllers do not import Prisma directly in logout implementation. Maps to FR-019, AC-025.

## Phase 7: User Story 5 - Handle Refresh/Logout Races Safely (Priority: P1)

**Goal**: Logout and refresh concurrency preserves FEAT-005 state guarantees.

**Independent Test**: PostgreSQL-backed concurrent tests prove no revoked session refreshes and no unintended multiple active sessions are left.

- [ ] T033 [P] [US5] Add DB-backed test for logout then refresh with old token rejection in `apps/api/tests/integration/logout-db.test.ts`. Maps to FR-011, FR-022, AC-007, AC-018.
- [ ] T034 [P] [US5] Add DB-backed test for refresh then logout using newest cookie revoking newest session in `apps/api/tests/integration/logout-db.test.ts`. Maps to FR-007, FR-022, AC-005, AC-018.
- [ ] T035 [P] [US5] Add DB-backed concurrent logout/refresh same-token test proving safe deterministic state in `apps/api/tests/integration/logout-db.test.ts`. Maps to FR-022, FR-023, AC-018.
- [ ] T036 [US5] Use existing FEAT-005 conditional update/transaction semantics for logout state transition. Maps to FR-007, FR-018, FR-022, AC-018, AC-019.
- [ ] T037 [US5] Ensure ordinary logout is not classified as replay and does not family-revoke as `REPLAY_DETECTED`. Maps to FR-008, FR-023, AC-006.

## Phase 8: Regression, Runtime Smoke, and Reporting

- [ ] T038 [P] Add test or runtime assertion documenting existing access token remains valid until expiry after logout in `apps/api/tests/integration/logout.test.ts` or runtime smoke. Maps to FR-020, FR-021, AC-021.
- [ ] T039 [P] Confirm no access-token blacklist, `jti` blacklist, Redis token revocation, or access-token DB lookup was added. Maps to FR-021, AC-022.
- [ ] T040 [P] Confirm no RBAC, admin guard, audit event emission, email verification, account lockout, rate limiting, FEAT-007, or later behavior was added. Maps to FR-025, AC-020, AC-023.
- [ ] T041 Run `npm run clean`. Maps to FR-028, AC-026, AC-028.
- [ ] T042 Run `npm run lint`. Maps to FR-028, AC-026, AC-028.
- [ ] T043 Run `npx prisma validate --schema=apps/api/prisma/schema.prisma`. Maps to FR-018, FR-028, AC-019, AC-026, AC-028.
- [ ] T044 Run `npm run typecheck`. Maps to FR-028, AC-026, AC-028.
- [ ] T045 Run `npm run build`. Maps to FR-028, AC-026, AC-028.
- [ ] T046 Run `npm run test`. Maps to FR-026, FR-028, AC-026, AC-028.
- [ ] T047 Run `npm run test:db` against isolated PostgreSQL test database. Maps to FR-026, FR-027, AC-026, AC-027, AC-028.
- [ ] T048 Run migration deploy/replay against fresh isolated PostgreSQL database if any migration changes are introduced. Maps to FR-027, FR-028, AC-026, AC-027, AC-028.
- [ ] T049 Run packaged API runtime smoke covering health, login, refresh, logout, refresh-after-logout failure, cookie clear behavior, and FEAT-004 access-token semantics. Maps to FR-026, FR-028, AC-003, AC-007, AC-021, AC-026, AC-028.
- [ ] T050 Update `reports/implementation/phase-2/FEAT-006.md` with files changed, behavior summary, tests, validation evidence, security notes, limitations, and AC mapping. Maps to FR-029, AC-029.
- [ ] T051 Update `docs/progress-tracker.md` only for implementation/QA lifecycle state as allowed by governance, without marking Human Final Gate approved. Maps to FR-029, AC-029.

## Dependencies

- T001-T004 must complete before implementation tasks.
- T005-T008 establish shared contract/helpers before route/service behavior.
- US1 tasks T009-T016 create core logout.
- US2 tasks depend on US1 behavior and verify authority boundaries.
- US3 tasks depend on core logout routing/service.
- US4 tasks depend on service/controller error paths.
- US5 tasks depend on FEAT-005 state transitions and core logout implementation.
- T041-T051 run after feature implementation and tests are complete.

## MVP Scope

All listed P1 stories are required before QA PASS because logout is security-critical.
