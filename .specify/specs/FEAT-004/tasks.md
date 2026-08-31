# Tasks: Login & Access Token Issuance

**Feature ID**: FEAT-004  
**Status**: APPROVED  
**Input**: `requirement.md`, `spec.md`, `plan.md`, `acceptance.md`  
**Prerequisites**: Human approval of FEAT-004 spec package; FEAT-002 and FEAT-003 Human Final Gate approval  
**Implementation Agent**: Antigravity after separate Human implementation handoff  
**Tests**: Required because FEAT-004 introduces authentication and token verification behavior.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks that touch different files and do not depend on incomplete work.
- **[Story]**: Maps the task to a user story in `spec.md`.
- Every task includes an expected file path.
- Every task maps to requirement/spec/acceptance references in the Traceability section.

## Phase 1: Setup

**Purpose**: Prepare FEAT-004 implementation without changing unrelated behavior.

- [ ] T001 Review FEAT-004 approved spec package before coding in `.specify/specs/FEAT-004/`
- [ ] T002 Review FEAT-002 repositories/config and FEAT-003 password hashing/registration QA in `.specify/specs/FEAT-002/`, `.specify/specs/FEAT-003/`, `reports/qa/phase-2/FEAT-002-QA.md`, and `reports/qa/phase-2/FEAT-003-QA.md`
- [ ] T003 [P] Create FEAT-004 implementation report skeleton in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T004 [P] Verify whether token signing/verification dependency already exists or add the minimal justified dependency in `apps/api/package.json`
- [ ] T005 [P] Confirm route naming and alternate prefix convention from existing auth/health routes in `apps/api/src/server.ts` and `apps/api/src/modules/auth/`

## Phase 2: Foundational

**Purpose**: Establish login contracts, token service, middleware, and security boundaries that block all user stories.

- [ ] T006 Define login request/response schemas and safe user context contract in `packages/shared/src/schemas/index.ts` or `apps/api/src/modules/auth/login.schema.ts`
- [ ] T007 Export login/auth types from `packages/shared/src/types/index.ts` if schemas are shared
- [ ] T008 Define or confirm stable auth error codes/constants in `packages/shared/src/constants/index.ts`
- [ ] T009 Add required `AUTH_ACCESS_TOKEN_ISSUER` and `AUTH_ACCESS_TOKEN_AUDIENCE` validation with no fallback in `packages/shared/src/schemas/index.ts` and `apps/api/src/infrastructure/config/auth.config.ts`
- [ ] T010 Implement access-token signing and verification boundary with HS256-only allowlist in `apps/api/src/modules/auth/access-token.service.ts`
- [ ] T011 Ensure access-token service validates exact claims (`sub`, `iat`, `exp`, `iss`, `aud`, `typ`) and has no fallback secret/config in `apps/api/src/modules/auth/access-token.service.ts`
- [ ] T012 Ensure access-token service rejects `none`, wrong algorithm, wrong issuer, wrong audience, malformed, forged, and expired tokens in `apps/api/src/modules/auth/access-token.service.ts`
- [ ] T013 Define fixed dummy Argon2id hash or equivalent constant-work strategy for unknown-user login path in `apps/api/src/modules/auth/login.service.ts`
- [ ] T014 Implement authenticated request context type augmentation or local request type in `apps/api/src/modules/auth/auth.types.ts` or approved existing location
- [ ] T015 Implement access-token verification middleware skeleton for `Authorization: Bearer <access-token>` in `apps/api/src/modules/auth/auth.middleware.ts` or `apps/api/src/middleware/auth.ts`
- [ ] T016 Define login service interface using FEAT-002 repositories and FEAT-003 password verification in `apps/api/src/modules/auth/login.service.ts`

## Phase 3: User Story 1 - Log In With Valid Credentials (Priority: P1)

**Goal**: Valid credentials return a short-lived access token and safe user response.

**Independent Test**: Seed/register a user in isolated PostgreSQL, submit valid login, inspect response/token claims.

### Tests for User Story 1

- [ ] T017 [P] [US1] Add API contract test for successful login response shape in `apps/api/tests/integration/login.test.ts`
- [ ] T018 [P] [US1] Add database-backed valid login test using real PostgreSQL and FEAT-003 Argon2id hash in `apps/api/tests/integration/login-db.test.ts`
- [ ] T019 [P] [US1] Add token claim/lifetime/HS256 test for valid login in `apps/api/tests/unit/access-token.test.ts` or `apps/api/tests/integration/login.test.ts`
- [ ] T020 [P] [US1] Add issuer/audience/token type claim test for valid login in `apps/api/tests/unit/access-token.test.ts`
- [ ] T021 [P] [US1] Add email normalization login test in `apps/api/tests/integration/login-db.test.ts`

### Implementation for User Story 1

- [ ] T022 [US1] Implement login service happy path using user and credential repositories in `apps/api/src/modules/auth/login.service.ts`
- [ ] T023 [US1] Reuse FEAT-003 `passwordHashingService.verifyPassword` for credential verification in `apps/api/src/modules/auth/login.service.ts`
- [ ] T024 [US1] Implement login controller in `apps/api/src/modules/auth/login.controller.ts`
- [ ] T025 [US1] Wire canonical `POST /auth/login` route in `apps/api/src/modules/auth/login.route.ts` or existing auth router
- [ ] T026 [US1] Attach login route to the existing Express app without disrupting health/register routes in `apps/api/src/server.ts`

**Checkpoint**: Valid login works without refresh-token, session, logout, RBAC, admin, audit, or rate-limiting behavior.

## Phase 4: User Story 2 - Reject Invalid Login Without Enumeration (Priority: P1)

**Goal**: Unknown email and wrong password return the same safe authentication failure and avoid an obvious fast-fail branch.

**Independent Test**: Submit unknown-email and wrong-password attempts and compare status, error code, and message; verify unknown-user path performs dummy Argon2id verification or equivalent approved constant-work.

### Tests for User Story 2

- [ ] T027 [P] [US2] Add unknown-user rejection test in `apps/api/tests/integration/login.test.ts`
- [ ] T028 [P] [US2] Add wrong-password rejection test in `apps/api/tests/integration/login-db.test.ts`
- [ ] T029 [P] [US2] Add assertion that unknown-user and wrong-password responses are externally identical in `apps/api/tests/integration/login.test.ts`
- [ ] T030 [P] [US2] Add dummy Argon2id verification or constant-work test for unknown-user path in `apps/api/tests/unit/login.service.test.ts`
- [ ] T031 [P] [US2] Add safe error/log leakage tests for invalid login in `apps/api/tests/integration/login.test.ts`

### Implementation for User Story 2

- [ ] T032 [US2] Implement stable invalid-login mapping in `apps/api/src/modules/auth/login.service.ts`
- [ ] T033 [US2] Implement unknown-user dummy Argon2id verification or equivalent approved constant-work path in `apps/api/src/modules/auth/login.service.ts`
- [ ] T034 [US2] Ensure raw password, hash, Prisma, and token errors are not returned in `apps/api/src/modules/auth/login.controller.ts` and error middleware
- [ ] T035 [US2] Ensure invalid login does not create refresh sessions, audit events, account lockout state, or rate-limit state in `apps/api/src/modules/auth/login.service.ts`

**Checkpoint**: Invalid login is safe and enumeration-resistant within the approved FEAT-004 boundary.

## Phase 5: User Story 3 - Verify Access Tokens for Protected Requests (Priority: P1)

**Goal**: Protected representative endpoint accepts valid tokens and rejects missing/invalid tokens.

**Independent Test**: Call representative protected endpoint with missing, malformed, forged, wrong-algorithm, wrong-issuer, wrong-audience, expired, nonexistent-user, inactive-user, and valid access tokens.

### Tests for User Story 3

- [ ] T036 [P] [US3] Add unit tests for access-token signing and verification in `apps/api/tests/unit/access-token.test.ts`
- [ ] T037 [P] [US3] Add missing-header, wrong-scheme, empty-bearer, malformed-header, and ambiguous-credential rejection tests in `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T038 [P] [US3] Add malformed-token rejection test in `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T039 [P] [US3] Add forged-token rejection test in `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T040 [P] [US3] Add expired-token rejection test in `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T041 [P] [US3] Add wrong-algorithm and `none` algorithm rejection tests in `apps/api/tests/unit/access-token.test.ts` or `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T042 [P] [US3] Add wrong-issuer and wrong-audience rejection tests in `apps/api/tests/unit/access-token.test.ts` or `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T043 [P] [US3] Add nonexistent-token-subject rejection test in `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T044 [P] [US3] Add non-`ACTIVE` user rejection test in `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T045 [P] [US3] Add valid-token protected endpoint acceptance test in `apps/api/tests/integration/auth-middleware.test.ts`
- [ ] T046 [P] [US3] Add server-derived request context test proving client-provided role/admin claims are ignored in `apps/api/tests/integration/auth-middleware.test.ts`

### Implementation for User Story 3

- [ ] T047 [US3] Complete access-token verification middleware in `apps/api/src/modules/auth/auth.middleware.ts` or approved middleware location
- [ ] T048 [US3] Implement safe authenticated request context derivation from verified token `sub` plus server-side user lookup in `apps/api/src/modules/auth/auth.middleware.ts`
- [ ] T049 [US3] Implement canonical representative protected verification endpoint `GET /auth/me` in `apps/api/src/modules/auth/me.route.ts` or existing auth router
- [ ] T050 [US3] Wire protected route to the existing Express app without adding product-domain behavior in `apps/api/src/server.ts`

**Checkpoint**: Access-token verification works and remains authentication-only.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete validation, docs, regression, and QA handoff evidence.

- [ ] T051 [P] Confirm no refresh-token issuance, refresh rotation, refresh-session behavior, logout, RBAC enforcement, admin guard, audit event emission, email verification, account lockout, rate limiting, or FEAT-005 behavior exists in `apps/api/src/`
- [ ] T052 [P] Search/review for password, passwordHash, token, secret, raw JWT, and raw database leakage across `apps/api/src/` and tests
- [ ] T053 [P] Review Prisma import boundaries to confirm controllers do not import Prisma and service persistence uses repositories in `apps/api/src/modules/auth/`
- [ ] T054 [P] Update README or API docs with login/access-token contract and validation commands if required in `README.md`
- [ ] T055 Run Prisma validation and migration/test DB checks and record results in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T056 Run `npm run clean` and record result in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T057 Run lint and record result in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T058 Run typecheck and record result in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T059 Run build and record result in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T060 Run standard tests and DB-backed tests and record results in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T061 Run packaged API runtime health/login/protected-endpoint smoke and record result in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T062 Map implementation to all FEAT-004 acceptance criteria in `reports/implementation/phase-2/FEAT-004.md`
- [ ] T063 Document known limitations, security notes, and readiness for QA in `reports/implementation/phase-2/FEAT-004.md`

## Dependencies

- FEAT-002 must remain PASS/DONE.
- FEAT-003 must remain PASS/DONE.
- T006 through T016 block all user stories.
- US1, US2, and US3 are all P1 and should be implemented as one secure authentication slice.
- US2 depends on login service error mapping.
- US3 depends on access-token service and route/middleware wiring.
- Polish tasks require implementation and tests to be complete.

## Parallel Opportunities

- T003, T004, and T005 can run in parallel.
- T017 through T021 can be written in parallel after login contract is defined.
- T027 through T031 can be written in parallel after invalid-login contract is defined.
- T036 through T046 can be written in parallel after access-token service/middleware contract is defined.
- T051 through T054 can run in parallel during final review.

## Traceability

| Task IDs | Requirement/Spec Mapping | Acceptance Criteria |
|----------|--------------------------|---------------------|
| T001-T005 | Requirement context, FEAT-002/FEAT-003 dependency, FR-026 to FR-029 | AC-022, AC-023, AC-024, AC-025 |
| T006-T016 | FR-001 to FR-020 | AC-001 to AC-021 |
| T017-T026 | US1, FR-001 to FR-006, FR-009 to FR-016, FR-023 | AC-001, AC-002, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-021 |
| T027-T035 | US2, FR-002 to FR-008, FR-023 to FR-025, FR-029 | AC-003, AC-004, AC-006, AC-012, AC-021, AC-022 |
| T036-T050 | US3, FR-010 to FR-023, FR-025 | AC-007, AC-009, AC-010, AC-011, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021 |
| T051 | FR-029 | AC-022 |
| T052-T054 | FR-021 to FR-025 | AC-020, AC-021, AC-025 |
| T055-T063 | FR-026 to FR-028 | AC-023, AC-024, AC-025 |

## Implementation Strategy

1. Define login schemas, token service, middleware contract, and request context first.
2. Implement valid login as the MVP vertical slice.
3. Add invalid-login enumeration-safe behavior.
4. Add access-token verification middleware and representative protected endpoint.
5. Add DB-backed and token edge-case tests.
6. Run full FEAT-001/FEAT-002/FEAT-003 regression validation and produce implementation report.

## Handoff Rule

Implementation must not begin until Human separately hands FEAT-004 to Antigravity for implementation.
