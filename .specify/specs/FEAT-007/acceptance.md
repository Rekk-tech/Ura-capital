# Acceptance Criteria: FEAT-007 RBAC Authorization Foundation

**Status**: APPROVED  
**Created**: 2026-08-26  
**Feature Spec**: `spec.md`  
**Implementation Report Required**: `reports/implementation/phase-2/FEAT-007.md`  
**QA Report Required After Implementation**: `reports/qa/phase-2/FEAT-007-QA.md`

## Acceptance Matrix

| ID | Criterion | Verification Method | Required Evidence |
|----|-----------|---------------------|-------------------|
| AC-001 | Canonical server-controlled role identifiers exist for `USER` and `ADMIN`, or Human-approved equivalents. | Source/constants review and tests | Centralized constants/types and tests recorded. |
| AC-002 | Roles are sourced from PostgreSQL `Role`/`UserRole` persistence. | Source review and DB-backed test | Repository lookup and DB rows recorded. |
| AC-003 | Authenticated user roles are loaded server-side from FEAT-004 authenticated user identity. | Integration and DB-backed test | Auth context plus role lookup evidence recorded. |
| AC-004 | Client-provided role/admin values from body, query, headers, or token claims are ignored or rejected and cannot influence authorization. | Negative integration/security test | Spoofing attempts and denial/ignore evidence recorded. |
| AC-005 | Access tokens remain free of role/admin authority claims; FEAT-007 does not add role claims to JWTs. | Token inspection and source review | Claim inspection and source search recorded. |
| AC-006 | User with a required role is allowed by generic RBAC authorization primitive. | Unit/integration test | Allowed request/service result recorded. |
| AC-007 | Authenticated user without required role is denied with `403 FORBIDDEN`. | Unit/integration test | Status/error envelope recorded. |
| AC-008 | Unauthenticated request to role-protected behavior returns `401 UNAUTHENTICATED`. | Integration test | Status/error envelope recorded. |
| AC-009 | `requireAnyRole` or equivalent any-role policy allows access if any required role matches. | Unit/integration test | Multi-required role scenario recorded. |
| AC-010 | Multi-role users are supported and role list behavior is deterministic. | DB-backed/unit test | Multiple roles and deterministic ordering evidence recorded. |
| AC-011 | Authorization denies by default when role lookup fails, PostgreSQL is unavailable, role data is malformed, or required role is missing. | Unit/failure simulation/integration test | Fail-closed evidence recorded. |
| AC-012 | Authentication and authorization failures use stable safe error envelopes and do not expose sensitive internals. | API/log test and source review | 401/403 envelope and no-leakage evidence recorded. |
| AC-013 | Duplicate `UserRole(userId, roleId)` assignment is prevented by PostgreSQL constraint. | PostgreSQL-backed test | Duplicate rejection evidence recorded. |
| AC-014 | Canonical role seeding/bootstrap is reproducible and idempotent. | Unit and DB-backed test | Repeated seed result recorded. |
| AC-015 | Role changes in PostgreSQL affect later authorization decisions without waiting for access-token expiry. | DB-backed integration test | Same token with changed role assignment evidence recorded. |
| AC-016 | Controllers remain Prisma-free; Prisma/database access is isolated behind repositories. | Import/source review | Import search and boundary review recorded. |
| AC-017 | Role seeding does not create default admin credentials or privileged users. | DB-backed/source review | User/credential absence evidence recorded. |
| AC-018 | FEAT-007 does not silently change FEAT-003 registration to assign a default `USER` role. | Regression/source/DB review | Registration behavior evidence recorded. |
| AC-019 | PostgreSQL remains authoritative for durable role assignment state. | Architecture/source/DB review | DB authority evidence recorded. |
| AC-020 | Redis is not introduced as durable role authority. | Source/config review | Redis boundary evidence recorded. |
| AC-021 | FEAT-007 does not implement FEAT-008 admin business guard, admin APIs, admin dashboard, public role management, permission/ABAC engine, tenant authorization, or default admin credentials. | Scope/source/route review | Scope search evidence recorded. |
| AC-022 | FEAT-007 does not implement auth audit event emission, rate limiting, FEAT-009, FEAT-010, or later behavior. | Scope/source review | Scope search evidence recorded. |
| AC-023 | PostgreSQL-backed tests use isolated test database and do not silently skip required DB validation. | DB-backed test and guard review | Test DB name/guard/migration evidence recorded. |
| AC-024 | FEAT-001 through FEAT-006 regression validation passes. | Command execution | Clean/lint/typecheck/build/test/DB/runtime evidence recorded. |
| AC-025 | Required validation suite passes after implementation. | Command execution | Command results recorded. |
| AC-026 | `reports/implementation/phase-2/FEAT-007.md` maps tasks, tests, validation, limitations, security notes, and acceptance criteria truthfully. | Documentation review | Report path exists and is complete. |
| AC-027 | Persisted role names are runtime-validated against canonical `RoleCode`; unknown/malformed role codes cannot authorize. | Unit and DB-backed test | Unknown role code rejection evidence recorded. |
| AC-028 | Newly registered users have zero RBAC roles under current approved FEAT-007 semantics, and authenticated zero-role users fail `requireRole(USER)`. | DB-backed/integration regression test | Registration role state and 403 evidence recorded. |
| AC-029 | Role list returned in authorization context is unique, canonical, and deterministic in lexical ascending order. | Unit/DB-backed test | Ordering and de-duplication evidence recorded. |
| AC-030 | Server-side operational role provisioning boundary is defined for assigning canonical roles to existing users. | Source/doc/test review | Command/helper boundary and no public HTTP authority evidence recorded. |
| AC-031 | Operational role provisioning requires existing user, canonical allowlisted role, PostgreSQL persistence, and safe duplicate handling. | Unit/DB-backed test | Existing-user, allowlist, persistence, duplicate evidence recorded. |
| AC-032 | Privileged role assignment is never automatic; role seed/provisioning creates no users, credentials, default admin account, or automatic `ADMIN` assignment. | DB-backed/source review | No-user/no-credential/no-admin evidence recorded. |

## QA Decision Rules

### PASS

FEAT-007 may receive PASS only when:

- AC-001 through AC-032 pass, or any exception is explicitly waived by Human.
- Roles are PostgreSQL-backed and server-derived.
- Client role/admin spoofing does not affect authorization.
- Missing auth returns 401 and insufficient role returns 403.
- Role lookup failure denies by default.
- Role repository/PostgreSQL failure denies access without being misreported as ordinary insufficient-role `403`.
- Unknown/malformed persisted role codes cannot authorize.
- Role lists are unique, canonical, and deterministic.
- Authenticated zero-role users are denied by role requirements.
- Canonical role seeding is idempotent and creates no default admin credentials.
- Operational role provisioning is server-side only and creates no privileged account automatically.
- No FEAT-008 admin business guard, audit emission, rate limiting, JWT role claims, public role management, or later Phase 2 behavior is introduced.
- FEAT-001 through FEAT-006 regressions pass.
- Validation evidence is real and current.

### CONDITIONAL PASS

FEAT-007 may receive CONDITIONAL PASS only when no P0/P1 authorization or security issue exists, role authority/deny-by-default/no client trust all pass, and Human explicitly accepts any tracked non-blocking condition.

### FAIL

FEAT-007 must receive FAIL if any of the following are true:

- Authorization trusts client-provided role/admin state.
- Roles are not loaded from server-side persistence.
- Access tokens become role authority without Human-approved spec change.
- User without required role is allowed.
- Missing authentication is treated as authorized.
- Role lookup/DB failure allows access.
- Role lookup/DB failure is hidden as ordinary insufficient-role `403`.
- Unknown or malformed persisted role code satisfies authorization.
- Role list contains duplicate, non-canonical, or nondeterministically ordered values.
- Duplicate user-role assignment is not database-protected.
- Default admin credentials or privileged users are created.
- Privileged role is assigned automatically without explicit operator action.
- FEAT-003 registration is silently changed to assign roles without Human approval.
- FEAT-008 admin business behavior, audit emission, rate limiting, public role management, permission/ABAC engine, or later behavior is implemented.
- Redis or in-memory maps become durable role authority.
- Raw tokens, secrets, password hashes, raw DB/Prisma errors, stack traces, or DB credentials leak.
- Required DB tests skip or run against unsafe targets.
- Lint, typecheck, tests, build, Prisma validation, DB tests, or required runtime smoke fail without Human-approved waiver.
- Implementation report is missing or materially inaccurate.

## Required Validation Commands

Implementation must run and report:

- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:db`
- Fresh isolated PostgreSQL migration deploy/replay if migrations change.
- Runtime/API smoke for representative authenticated, role-allowed, role-denied, unauthenticated, and client-role-spoofing cases if route wiring changes.

If a database service is unavailable, implementation must state `NOT VERIFIED` for database execution with the exact blocker. QA may not mark DB criteria PASS without equivalent real evidence.

## Acceptance Traceability

| User Story | Acceptance Criteria |
|------------|---------------------|
| US1 - Load Server-Side Roles | AC-001, AC-002, AC-003, AC-004, AC-005, AC-015, AC-016, AC-019, AC-027, AC-029 |
| US2 - Evaluate Role Requirements | AC-006, AC-007, AC-008, AC-009, AC-010, AC-012, AC-028 |
| US3 - Fail Closed | AC-008, AC-011, AC-012, AC-020, AC-027 |
| US4 - Seed Canonical Roles | AC-013, AC-014, AC-017, AC-018, AC-030, AC-031, AC-032 |
| Cross-cutting | AC-021, AC-022, AC-023, AC-024, AC-025, AC-026 |

## Human Review Checklist

- [ ] FEAT-007 scope is limited to RBAC foundation.
- [ ] FEAT-008 remains responsible for admin-specific guard/application behavior.
- [ ] PostgreSQL remains role authority.
- [ ] Access tokens remain role-free.
- [ ] `USER` and `ADMIN` canonical role codes are acceptable.
- [ ] Multi-role semantics are acceptable.
- [ ] No automatic default role assignment during registration is acceptable for this feature.
- [ ] Newly registered zero-role users being denied by `requireRole(USER)` is acceptable for this feature.
- [ ] Server-side operational role provisioning is acceptable for assigning `ADMIN` before FEAT-008 production activation.
- [ ] Role seed creates no admin users or credentials.
- [ ] Rate limiting remains separate.
- [ ] Acceptance criteria are independently testable.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED and separately hands FEAT-007 to Antigravity.
