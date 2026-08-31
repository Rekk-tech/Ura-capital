# Tasks: Registration & Password Security

**Feature ID**: FEAT-003  
**Status**: APPROVED  
**Input**: `requirement.md`, `spec.md`, `plan.md`, `acceptance.md`  
**Prerequisites**: Human approval of FEAT-003 spec package and FEAT-002 Human Final Gate approval  
**Implementation Agent**: Antigravity after Human approval  
**Tests**: Required because FEAT-003 introduces public registration and password security behavior.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks that touch different files and do not depend on incomplete work.
- **[Story]**: Maps the task to a user story in `spec.md`.
- Every task includes an expected file path.
- Every task maps to requirement/spec/acceptance references in the Traceability section.

## Phase 1: Setup

**Purpose**: Prepare FEAT-003 implementation without changing unrelated application behavior.

- [ ] T001 Review FEAT-003 approved spec package before coding in `.specify/specs/FEAT-003/`
- [ ] T002 Review FEAT-002 repositories, Prisma schema, DB guard, and QA report in `.specify/specs/FEAT-002/` and `reports/qa/phase-2/FEAT-002-QA.md`
- [ ] T003 [P] Create or update FEAT-003 implementation report skeleton in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T004 [P] Verify whether an Argon2id-capable dependency is already available or add the minimal justified dependency in `apps/api/package.json`
- [ ] T005 [P] Confirm route naming and API prefix convention from existing API app in `apps/api/src/server.ts`

## Phase 2: Foundational

**Purpose**: Establish shared registration validation, password policy, hashing, and transaction boundaries that block all user stories.

- [ ] T006 Define registration request/response schemas in `apps/api/src/modules/auth/registration.schema.ts` or approved shared contract location
- [ ] T007 Define password policy constants and validation helper in `apps/api/src/modules/auth/password-policy.ts`
- [ ] T008 Implement Argon2id password hashing boundary for registration in `apps/api/src/modules/auth/password-hashing.service.ts`
- [ ] T009 Define safe registration service interface and transaction strategy in `apps/api/src/modules/auth/registration.service.ts`
- [ ] T010 Ensure registration transaction can create user and credential atomically without exposing Prisma to controllers in `apps/api/src/modules/auth/registration.service.ts`
- [ ] T011 Add reusable duplicate identity error mapping that hides raw Prisma/database errors in `apps/api/src/modules/auth/registration.service.ts`

## Phase 3: User Story 1 - Register a New Account (Priority: P1)

**Goal**: Valid registration creates one user and one credential and returns a safe response.

**Independent Test**: Submit a valid registration request and verify persisted user + credential state in isolated PostgreSQL.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add API contract test for successful registration response shape in `apps/api/tests/integration/registration.test.ts`
- [ ] T013 [P] [US1] Add database-backed test for user + credential creation in isolated PostgreSQL in `apps/api/tests/integration/registration-db.test.ts`
- [ ] T014 [P] [US1] Add normalization test for trimmed/lowercase email persistence in `apps/api/tests/integration/registration.test.ts`

### Implementation for User Story 1

- [ ] T015 [US1] Implement registration service happy path using FEAT-002 repositories in `apps/api/src/modules/auth/registration.service.ts`
- [ ] T016 [US1] Implement registration controller in `apps/api/src/modules/auth/registration.controller.ts`
- [ ] T017 [US1] Implement registration route wiring in `apps/api/src/modules/auth/registration.route.ts`
- [ ] T018 [US1] Attach registration route to the existing API app in `apps/api/src/server.ts`

**Checkpoint**: Valid registration works without login/token/session behavior.

## Phase 4: User Story 2 - Reject Invalid Registration Input (Priority: P1)

**Goal**: Invalid registration payloads fail before persistence or hashing when appropriate.

**Independent Test**: Submit invalid payloads and verify stable error envelopes with no password leakage.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add tests for missing email/password rejection in `apps/api/tests/integration/registration.test.ts`
- [ ] T020 [P] [US2] Add tests for malformed email rejection in `apps/api/tests/integration/registration.test.ts`
- [ ] T021 [P] [US2] Add tests for password policy rejection in `apps/api/tests/unit/password-policy.test.ts`
- [ ] T022 [P] [US2] Add tests proving invalid password values are not logged or returned in `apps/api/tests/integration/registration.test.ts`

### Implementation for User Story 2

- [ ] T023 [US2] Enforce registration input validation in `apps/api/src/modules/auth/registration.schema.ts`
- [ ] T024 [US2] Enforce password policy before hashing in `apps/api/src/modules/auth/registration.service.ts`
- [ ] T025 [US2] Map validation failures to stable error envelopes in `apps/api/src/modules/auth/registration.controller.ts`

**Checkpoint**: Invalid input cannot create user or credential records.

## Phase 5: User Story 3 - Protect Passwords at Rest (Priority: P1)

**Goal**: Persist only Argon2id password hashes and never expose password material.

**Independent Test**: Register users and inspect stored credential records in isolated PostgreSQL.

### Tests for User Story 3

- [ ] T026 [P] [US3] Add unit tests for Argon2id encoded hash format and approved parameters in `apps/api/tests/unit/password-hashing.test.ts`
- [ ] T027 [P] [US3] Add test proving same password produces different hashes due to unique salts in `apps/api/tests/unit/password-hashing.test.ts`
- [ ] T028 [P] [US3] Add database-backed test proving stored credential is not plaintext and starts with Argon2id encoded format in `apps/api/tests/integration/registration-db.test.ts`
- [ ] T029 [P] [US3] Add response/log safety tests proving password hashes are not returned or logged in `apps/api/tests/integration/registration.test.ts`

### Implementation for User Story 3

- [ ] T030 [US3] Implement Argon2id hashing with memoryCost 19456 KiB, timeCost 2, and parallelism 1 in `apps/api/src/modules/auth/password-hashing.service.ts`
- [ ] T031 [US3] Persist only the encoded password hash through the credential repository in `apps/api/src/modules/auth/registration.service.ts`
- [ ] T032 [US3] Ensure registration response mapper excludes credential and hash fields in `apps/api/src/modules/auth/registration.service.ts`

**Checkpoint**: Passwords are protected at rest and absent from responses/logs.

## Phase 6: User Story 4 - Reject Duplicate Identity Safely (Priority: P2)

**Goal**: Duplicate normalized identities are rejected without partial records or raw database leakage.

**Independent Test**: Submit duplicate registration requests and inspect response plus database state.

### Tests for User Story 4

- [ ] T033 [P] [US4] Add duplicate registration test for same normalized email with different casing in `apps/api/tests/integration/registration.test.ts`
- [ ] T034 [P] [US4] Add database-backed test proving duplicate attempt creates no extra credential or partial user in `apps/api/tests/integration/registration-db.test.ts`
- [ ] T035 [P] [US4] Add test proving duplicate response hides raw Prisma/database details in `apps/api/tests/integration/registration.test.ts`

### Implementation for User Story 4

- [ ] T036 [US4] Implement duplicate normalized identity detection and stable conflict response in `apps/api/src/modules/auth/registration.service.ts`
- [ ] T037 [US4] Map database unique constraint conflict to a safe domain error in `apps/api/src/modules/auth/registration.service.ts`
- [ ] T038 [US4] Ensure duplicate failure path rolls back or avoids partial credential persistence in `apps/api/src/modules/auth/registration.service.ts`

**Checkpoint**: Duplicate registration is safe, atomic, and user-visible through stable errors.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Complete validation, documentation, and QA handoff evidence.

- [ ] T039 [P] Confirm no login, token issuance, refresh token, logout, RBAC, admin guard, audit event emission, email verification, account lockout, or FEAT-004 behavior exists in `apps/api/src/`
- [ ] T040 [P] Search/review for plaintext password, password hash, token, secret, or raw database leakage across `apps/api/src/` and tests
- [ ] T041 [P] Review Prisma import boundaries to confirm controllers/services do not directly depend on Prisma internals in `apps/api/src/`
- [ ] T042 [P] Update README or API docs with registration contract and validation commands if required in `README.md`
- [ ] T043 Run Prisma validation and migration/test DB checks and record results in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T044 Run `npm run clean` and record result in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T045 Run lint and record result in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T046 Run typecheck and record result in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T047 Run build and record result in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T048 Run standard tests and DB-backed tests and record results in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T049 Run packaged API runtime smoke and `/health` check if API runtime wiring changed, recording result in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T050 Map implementation to all FEAT-003 acceptance criteria in `reports/implementation/phase-2/FEAT-003.md`
- [ ] T051 Document known limitations, security notes, and readiness for QA in `reports/implementation/phase-2/FEAT-003.md`

## Dependencies

- FEAT-002 must remain PASS/DONE.
- T006 through T011 block all user stories.
- US1, US2, and US3 are all P1 and should be implemented as a secure vertical slice.
- US4 depends on US1 persistence and US2 error handling.
- Polish tasks require implementation and tests to be complete.

## Parallel Opportunities

- T003, T004, and T005 can run in parallel.
- T012 through T014 can be written in parallel after the registration contract is defined.
- T019 through T022 can be written in parallel after schema/policy rules are defined.
- T026 through T029 can be written in parallel after hashing boundary is defined.
- T033 through T035 can be written in parallel after duplicate behavior is specified.
- T039 through T042 can run in parallel during final review.

## Traceability

| Task IDs | Requirement/Spec Mapping | Acceptance Criteria |
|----------|--------------------------|---------------------|
| T001-T005 | Requirement context, FEAT-002 dependency, FR-020 | AC-018, AC-019 |
| T006-T011 | FR-001 to FR-017 | AC-001 to AC-014 |
| T012-T018 | US1, FR-001, FR-002, FR-003, FR-009, FR-013, FR-014 | AC-001, AC-002, AC-008, AC-009, AC-014 |
| T019-T025 | US2, FR-002, FR-004, FR-005, FR-015, FR-016 | AC-003, AC-004, AC-010, AC-011 |
| T026-T032 | US3, FR-006, FR-007, FR-008, FR-014, FR-016 | AC-005, AC-006, AC-007, AC-010, AC-011 |
| T033-T038 | US4, FR-010, FR-011, FR-012, FR-015 | AC-011, AC-012, AC-013, AC-014 |
| T039 | FR-021 | AC-015 |
| T040-T041 | FR-009, FR-014, FR-016 | AC-010, AC-011, AC-016 |
| T042-T051 | FR-018, FR-019, FR-020 | AC-017, AC-018, AC-019 |

## Implementation Strategy

1. Define validation, password policy, hashing, and transaction boundaries first.
2. Implement valid registration as the MVP vertical slice.
3. Add invalid input and duplicate handling.
4. Add DB-backed persistence/hash/atomicity evidence.
5. Run full FEAT-001/FEAT-002 regression validation and produce implementation report.

## Handoff Rule

Implementation must not begin until Human marks this FEAT-003 spec package as APPROVED.
