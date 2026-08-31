# Acceptance Criteria: FEAT-002 Identity Persistence & Auth Configuration

**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-25  
**Feature Spec**: `spec.md`  
**Implementation Report Required**: `reports/implementation/phase-2/FEAT-002.md`  
**QA Report Required After Implementation**: `reports/qa/phase-2/FEAT-002-QA.md`

## Acceptance Matrix

| ID | Criterion | Verification Method | Required Evidence |
|----|-----------|---------------------|-------------------|
| AC-001 | FEAT-002 introduces only identity-scoped persistence and does not add academy, simulation, community, subscription, AI, or other product-domain tables. | Schema/migration review | Implementation report lists all added models/tables and confirms scope. |
| AC-002 | User persistence model exists with durable primary identifier and timestamps. | Schema review and test | Model/table fields and migration result recorded. |
| AC-003 | Normalized identity identifier uniqueness is enforced by the database. | Integration test | Duplicate insert rejection test result recorded. |
| AC-004 | Credential persistence boundary exists without plaintext password storage and without password hashing behavior implementation. | Schema/code review | Credential fields and scope review recorded. |
| AC-005 | Role and user-role persistence structures exist with unique role names and unique user-role pairs. | Schema review and integration test | Constraint test result recorded. |
| AC-006 | Refresh-session persistence prerequisite exists in PostgreSQL without implementing refresh rotation, refresh flow, or logout behavior. | Schema/code review | Model/table and scope review recorded. |
| AC-007 | Auth/security audit persistence prerequisite is included only if structurally required and does not emit audit events. | Schema/code review | Inclusion or omission rationale recorded. |
| AC-008 | Identity dependent records enforce referential integrity to users and roles where applicable. | Integration test | Foreign-key rejection test result recorded. |
| AC-009 | Required database configuration is validated at startup/config load. | Unit or startup validation test | Missing/invalid database config test result recorded. |
| AC-010 | Required auth secrets are validated at startup/config load with no hard-coded or fallback auth/JWT secret. | Unit test and repository search | Failure test and search terms/results recorded. |
| AC-011 | Access-token TTL config is validated against the approved 5-15 minute range, without issuing tokens. | Unit test | Invalid and valid TTL test results recorded. |
| AC-012 | Refresh-session/token lifetime and refresh-cookie security configuration are validated for future refresh behavior. | Unit test | Invalid and valid config test results recorded. |
| AC-013 | Prisma/database access is isolated behind repositories; controllers/services do not directly depend on Prisma internals. | Code review and import search | Review notes and search result recorded. |
| AC-014 | Migration strategy is reproducible from documented commands. | Command execution or documented dry-run review | Migration command/result or limitation recorded. |
| AC-015 | Database-backed tests use isolated test database/schema/namespace and fail fast against unsafe non-test targets. | Unit/integration test | Test database guard result recorded. |
| AC-016 | FEAT-002 does not implement public registration, login, access-token issuance, refresh-token rotation, logout, RBAC enforcement, admin guard, audit event emission, email verification, or hard account lockout. | Code review | Scope review recorded. |
| AC-017 | Lint, typecheck, tests, and build pass after implementation. | Command execution | Commands and successful results recorded. |
| AC-018 | Documentation or implementation report explains migration usage, test DB isolation, configuration variables, and known limitations. | Documentation review | Paths and sections recorded. |
| AC-019 | `reports/implementation/phase-2/FEAT-002.md` maps tasks, tests, validation results, limitations, and acceptance criteria. | File review | Report path exists and is complete. |

## QA Decision Rules

### PASS

FEAT-002 may receive PASS only when:

- AC-001 through AC-019 pass, or any exception is explicitly waived by Human.
- No P0 security issue exists.
- No hard-coded or fallback auth/JWT secret exists.
- Missing required auth configuration fails before serving traffic.
- Identity uniqueness and referential integrity are database-enforced.
- Prisma/database details are isolated behind repositories.
- Database-backed tests are isolated from local/staging/production data.
- Scope does not drift into FEAT-003 through FEAT-010 behavior.
- Implementation report is complete.

### CONDITIONAL PASS

FEAT-002 may receive CONDITIONAL PASS only when:

- No P0 security issue exists.
- Core identity schema, config validation, and repository boundary pass.
- Any remaining issue is non-blocking documentation, reporting, or environment polish.
- Human explicitly accepts the condition and follow-up tracking.

### FAIL

FEAT-002 must receive FAIL if any of the following are true:

- A fallback auth/JWT secret exists.
- Required auth secret absence does not fail startup/config validation.
- Identity uniqueness is not protected by a database constraint.
- Dependent identity records can orphan without database rejection.
- Tests can mutate a non-test database without a guard.
- Controllers or services directly depend on Prisma internals.
- Implementation adds public registration, login, token issuance, refresh rotation, logout, RBAC enforcement, admin guard, audit event emission, email verification, or hard account lockout.
- Lint, typecheck, tests, or build fail without Human-approved waiver.
- Implementation report is missing or materially incomplete.

## Required Validation Commands

The exact commands are finalized during implementation, but FEAT-002 must expose and run validation for:

- Install/update dependencies if required.
- Generate Prisma client if required.
- Apply or verify identity migration in an isolated test database.
- Run database-backed identity schema/repository tests.
- Run environment validation tests.
- Run lint.
- Run typecheck.
- Run test suite.
- Run build.

If a database service is unavailable in the implementation environment, the implementation report must state `NOT VERIFIED` for database execution and provide the exact blocker. QA may not mark related acceptance criteria PASS without equivalent evidence.

## Acceptance Traceability

| User Story | Acceptance Criteria |
|------------|---------------------|
| US1 - Persist Identity Records Safely | AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-013, AC-014 |
| US2 - Validate Auth Configuration at Startup | AC-009, AC-010, AC-011, AC-012 |
| US3 - Keep Database Environments Isolated | AC-015 |
| Cross-cutting | AC-016, AC-017, AC-018, AC-019 |

## Human Review Checklist

- [ ] Requirement scope is limited to Identity Persistence & Auth Configuration.
- [ ] Out-of-scope list correctly blocks FEAT-003 through FEAT-010 behavior.
- [ ] Identity-scoped Prisma/PostgreSQL models are acceptable.
- [ ] Repository boundary expectations are acceptable.
- [ ] Migration and test database isolation expectations are acceptable.
- [ ] Auth configuration validation expectations are acceptable.
- [ ] Acceptance criteria are independently testable.
- [ ] Task mapping is detailed enough for Antigravity after approval.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED.
