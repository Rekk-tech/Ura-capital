# Acceptance Criteria: FEAT-003 Registration & Password Security

**Status**: APPROVED  
**Created**: 2026-08-25  
**Feature Spec**: `spec.md`  
**Implementation Report Required**: `reports/implementation/phase-2/FEAT-003.md`  
**QA Report Required After Implementation**: `reports/qa/phase-2/FEAT-003-QA.md`

## Acceptance Matrix

| ID | Criterion | Verification Method | Required Evidence |
|----|-----------|---------------------|-------------------|
| AC-001 | A registration API contract exists and is documented with request and safe response shape. | Contract/doc review and API test | Endpoint path, method, request schema, response schema, and test result recorded. |
| AC-002 | Valid registration creates exactly one user and one credential record using FEAT-002 persistence boundaries. | API integration and DB-backed test | Successful request result and database state recorded. |
| AC-003 | Invalid payloads are rejected before persistence. | API integration test | Missing/malformed field test results and no-persistence evidence recorded. |
| AC-004 | Password policy is enforced before hashing and persistence. | Unit and API tests | Invalid password cases and no-persistence evidence recorded. |
| AC-005 | Accepted passwords are hashed using Argon2id with approved baseline parameters. | Unit test and DB-backed inspection | Encoded hash format and parameter evidence recorded. |
| AC-006 | Stored credential value is not the plaintext password. | DB-backed test | Persisted credential inspection recorded. |
| AC-007 | Same plaintext password produces different hashes for different users due to unique salt. | Unit or integration test | Distinct hash result recorded. |
| AC-008 | Email identity identifier is normalized consistently before lookup and persistence. | Unit/API/DB-backed test | Trim/lowercase test result recorded. |
| AC-009 | Successful registration response excludes password, password hash, credential internals, tokens, refresh-session data, roles, and auth secrets. | API integration test | Response shape assertion recorded. |
| AC-010 | Passwords and password hashes are not logged during success or failure paths. | Log capture test and code review | Log inspection result and source review recorded. |
| AC-011 | Error responses do not expose raw Prisma/database errors, stack traces, passwords, password hashes, tokens, or secrets. | API integration test | Error envelope and leakage checks recorded. |
| AC-012 | Duplicate normalized identity registration is rejected safely. | API integration and DB-backed test | Duplicate attempt response and final DB state recorded. |
| AC-013 | Duplicate or failed registration does not leave partial user or credential records. | DB-backed test | Atomicity/rollback evidence recorded. |
| AC-014 | Registration persistence uses FEAT-002 repositories/models and keeps Prisma hidden from controllers. | Code review and import search | Prisma import review recorded. |
| AC-015 | FEAT-003 does not implement login, access token issuance, refresh tokens, logout, RBAC enforcement, admin guard, audit event emission, email verification, account lockout, or FEAT-004 behavior. | Code review and search | Scope review recorded. |
| AC-016 | No hard-coded production secrets, fallback auth secrets, plaintext password fixtures in production code, or token-like fake success paths are introduced. | Code review and search | Search terms/results recorded. |
| AC-017 | Database-backed registration tests use isolated PostgreSQL test database and preserve FEAT-002 test DB guard behavior. | DB-backed test | Migration, guard, and DB test results recorded. |
| AC-018 | FEAT-001 and FEAT-002 regression validation passes. | Command execution | Clean, lint, typecheck, build, standard tests, DB tests, Prisma validation, and health check results recorded as applicable. |
| AC-019 | `reports/implementation/phase-2/FEAT-003.md` maps tasks, tests, validation results, limitations, security notes, and acceptance criteria truthfully. | Documentation review | Report path exists and is complete. |

## QA Decision Rules

### PASS

FEAT-003 may receive PASS only when:

- AC-001 through AC-019 pass, or any exception is explicitly waived by Human.
- Registration creates user + credential records atomically.
- Passwords are Argon2id-hashed and never stored in plaintext.
- Passwords and password hashes are never returned or logged.
- Duplicate registration is rejected safely.
- No login, token, refresh, logout, RBAC, admin, audit event, email verification, account lockout, or FEAT-004 behavior is implemented.
- FEAT-001 and FEAT-002 regression checks pass.
- PostgreSQL-backed tests use an isolated test DB and execute, not skip.

### CONDITIONAL PASS

FEAT-003 may receive CONDITIONAL PASS only when:

- No P0 security issue exists.
- Registration core behavior, password hashing, no plaintext storage, and duplicate handling all pass.
- Any remaining issue is non-blocking documentation, reporting, or polish.
- Human explicitly accepts the condition and follow-up tracking.

### FAIL

FEAT-003 must receive FAIL if any of the following are true:

- Plaintext password is persisted.
- Password hash is not Argon2id or uses weaker-than-approved parameters.
- Password or hash is returned in API response.
- Password or hash is logged.
- Duplicate registration can create extra users/credentials or partial records.
- Registration issues access tokens or refresh tokens.
- Login, logout, RBAC, admin guard, audit event emission, email verification, account lockout, or FEAT-004 behavior is implemented.
- Prisma/database internals leak into controllers.
- DB-backed required tests skip or run against unsafe targets.
- Lint, typecheck, tests, or build fail without Human-approved waiver.
- Implementation report is missing or materially inaccurate.

## Required Validation Commands

Implementation must run and report:

- Install/update dependencies if required.
- Generate Prisma client if required.
- Apply migrations to an isolated test database.
- Run PostgreSQL-backed FEAT-002/FEAT-003 database tests.
- Run registration API tests.
- Run password hashing and password policy unit tests.
- Run secret/password leakage tests.
- Run lint.
- Run typecheck.
- Run standard tests.
- Run build.
- Run packaged API runtime health check if API route wiring changes startup behavior.

If a database service is unavailable in the implementation environment, the implementation report must state `NOT VERIFIED` for database execution and provide the exact blocker. QA may not mark related DB acceptance criteria PASS without equivalent evidence.

## Acceptance Traceability

| User Story | Acceptance Criteria |
|------------|---------------------|
| US1 - Register a New Account | AC-001, AC-002, AC-008, AC-009, AC-014 |
| US2 - Reject Invalid Registration Input | AC-003, AC-004, AC-010, AC-011 |
| US3 - Protect Passwords at Rest | AC-005, AC-006, AC-007, AC-010, AC-011 |
| US4 - Reject Duplicate Identity Safely | AC-012, AC-013, AC-014 |
| Cross-cutting | AC-015, AC-016, AC-017, AC-018, AC-019 |

## Human Review Checklist

- [ ] FEAT-003 scope is limited to registration and password security.
- [ ] Argon2id baseline parameters are acceptable.
- [ ] Password policy is acceptable for Phase 2.
- [ ] Successful registration intentionally does not log the user in.
- [ ] Email verification remains out of scope.
- [ ] Acceptance criteria are independently testable.
- [ ] Tasks are detailed enough for Antigravity after approval.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED.
