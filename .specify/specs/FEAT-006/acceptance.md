# Acceptance Criteria: FEAT-006 Logout & Session Invalidation

**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-26  
**Feature Spec**: `spec.md`  
**Implementation Report Required**: `reports/implementation/phase-2/FEAT-006.md`  
**QA Report Required After Implementation**: `reports/qa/phase-2/FEAT-006-QA.md`

## Acceptance Matrix

| ID | Criterion | Verification Method | Required Evidence |
|----|-----------|---------------------|-------------------|
| AC-001 | Canonical `POST /auth/logout` endpoint exists. | API integration test and route review | Status/result evidence recorded. |
| AC-002 | `POST /api/auth/logout` alias exists and executes the same logout behavior. | API integration test and route review | Alias route evidence recorded. |
| AC-003 | Successful current-session logout clears the refresh cookie. | API/cookie inspection test | `Set-Cookie` clear evidence recorded. |
| AC-004 | Clear-cookie uses FEAT-005-compatible cookie identity attributes: name, Path=/, Domain semantics, SameSite, Secure, and HttpOnly. | Unit/API cookie test and source review | Attribute comparison evidence recorded. |
| AC-005 | Logout of a valid active refresh session revokes that session durably in PostgreSQL. | PostgreSQL-backed integration test | DB row state and revocation reason recorded. |
| AC-006 | Revocation reason for normal logout is `USER_LOGOUT` or approved equivalent, not `REPLAY_DETECTED`. | DB-backed test/source review | Reason evidence recorded. |
| AC-007 | Refresh using the old token after logout is rejected and mints no access token. | API/DB-backed integration test | Refresh failure and absence of access token recorded. |
| AC-008 | Logout authority is derived from refresh cookie and server-side session lookup. | Source review and negative integration test | Request authority evidence recorded. |
| AC-009 | Client body user/session/family/role/admin fields are ignored or rejected and cannot select logout target. | Negative integration and DB-backed test | Body authority rejection/ignore evidence recorded. |
| AC-010 | Access token is not required for logout and is not trusted to select arbitrary refresh session. | API integration test/source review | Access-token authority evidence recorded. |
| AC-011 | Logout is current-session-only; unrelated same-user and other-user sessions remain active. | PostgreSQL-backed integration test | DB comparison evidence recorded. |
| AC-012 | No public logout-all, revoke-all-devices, session management UI, or public `revokeAllForUser` behavior exists. | Route/source review | Scope review recorded. |
| AC-013 | Repeated logout is safe and idempotent under the approved `204 No Content` contract. | API integration test | First and repeated response evidence recorded. |
| AC-014 | Missing refresh cookie returns the approved idempotent safe response without revealing session existence. | API integration test | Status/header evidence recorded. |
| AC-015 | Malformed, unknown, expired, already revoked, or consumed refresh cookie returns approved safe behavior and mints no tokens. | API/DB-backed tests | Case matrix evidence recorded. |
| AC-016 | Database persistence failure during active-session revocation does not return `204` or claim successful logout. | Failure simulation test | Safe failure evidence recorded. |
| AC-017 | Cookie is not cleared as a false successful logout when revocation failure may leave the session usable. | Failure simulation/cookie assertion | Absence of success clear-cookie evidence recorded. |
| AC-018 | Logout and refresh concurrency cannot leave multiple unintended active sessions or allow revoked session refresh. | PostgreSQL-backed concurrent test | Race result and DB state evidence recorded. |
| AC-019 | PostgreSQL remains authoritative for logout/session revocation state. | Source review and DB-backed test | DB authority evidence recorded. |
| AC-020 | Redis is not introduced as durable logout or revocation authority. | Source/config review | Redis boundary evidence recorded. |
| AC-021 | Existing access tokens are not blacklisted/revoked by logout and remain governed by FEAT-004 stateless expiry semantics. | Integration test/source review | Post-logout access-token behavior evidence recorded. |
| AC-022 | No access-token blacklist, `jti` blacklist, Redis token revocation, or access-token database lookup is introduced. | Source/config review | Scope review recorded. |
| AC-023 | Responses/logs do not expose raw refresh token, verifier/hash, full Cookie header, access token, auth secrets, raw Prisma errors, DB credentials, or stack traces. | Log capture, API test, and source review | Leakage checks recorded. |
| AC-024 | FEAT-006 does not implement RBAC, admin guard, auth audit event emission, email verification, account lockout, rate limiting, FEAT-007, or later behavior. | Code review and search | Scope review recorded. |
| AC-025 | Controllers do not import Prisma directly or own transaction internals. | Source/import review | Layering evidence recorded. |
| AC-026 | FEAT-001 through FEAT-005 regression validation passes. | Command execution and targeted regression tests | Clean/lint/typecheck/build/test/DB/runtime evidence recorded. |
| AC-027 | PostgreSQL-backed tests use isolated test database and do not silently skip required DB validation. | DB-backed test and guard review | Test DB name/guard/migration evidence recorded. |
| AC-028 | Required validation suite passes after implementation. | Command execution | Command results recorded. |
| AC-029 | `reports/implementation/phase-2/FEAT-006.md` maps tasks, tests, validation, limitations, security notes, and acceptance criteria truthfully. | Documentation review | Report completeness evidence recorded. |

## QA Decision Rules

### PASS

FEAT-006 may receive PASS only when:

- AC-001 through AC-029 pass, or any exception is explicitly waived by Human.
- Logout revokes the current refresh session in PostgreSQL.
- Refresh after logout is rejected.
- Cookie clearing uses exact compatible identity attributes.
- Logout is idempotent without session enumeration.
- DB persistence failure does not create false successful logout.
- Access-token-after-logout semantics match FEAT-004/ADR-004.
- No logout-all, access-token blacklist, Redis durable authority, RBAC, admin, audit, rate-limit, or later Phase 2 scope creep is introduced.
- Validation evidence is real and current.

### CONDITIONAL PASS

FEAT-006 may receive CONDITIONAL PASS only when no P0/P1 security issue exists, current-session revocation/cookie clearing/no leakage/refresh-after-logout rejection all pass, and Human explicitly accepts any tracked non-blocking condition.

### FAIL

FEAT-006 must receive FAIL if any of the following are true:

- Logout endpoint is missing.
- Logout does not revoke the current refresh session.
- Refresh after logout can mint an access token from the invalidated session.
- Cookie clearing uses mismatched path/domain/name attributes that can leave the refresh cookie active.
- Logout trusts client-provided user/session/role/admin identity.
- Logout affects all sessions without Human-approved scope.
- Normal logout is recorded as replay detection.
- DB failure returns false successful logout.
- Raw tokens, verifiers, secrets, raw DB/Prisma errors, or stack traces leak.
- Access-token blacklist/Redis revocation is added without approved scope.
- Redis is used as durable revocation authority.
- RBAC, admin, audit, rate limiting, FEAT-007, or later behavior is implemented.
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
- Runtime smoke for health, login, refresh, logout, refresh-after-logout failure, cookie clearing, and post-logout access-token semantics.

If a database service is unavailable, implementation must state `NOT VERIFIED` for database execution with exact blocker. QA may not mark DB criteria PASS without equivalent real evidence.

## Acceptance Traceability

| User Story | Acceptance Criteria |
|------------|---------------------|
| US1 - Logout Current Session | AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007 |
| US2 - Prevent Client Authority Abuse | AC-008, AC-009, AC-010, AC-011, AC-012 |
| US3 - Idempotent Safe Logout | AC-013, AC-014, AC-015 |
| US4 - Preserve Security Boundaries and Failure Safety | AC-016, AC-017, AC-019, AC-020, AC-023, AC-025 |
| US5 - Handle Refresh/Logout Races Safely | AC-018 |
| Cross-cutting | AC-021, AC-022, AC-024, AC-026, AC-027, AC-028, AC-029 |

## Human Review Checklist

- [ ] FEAT-006 scope is limited to current-session logout and session invalidation.
- [ ] `POST /auth/logout` and `POST /api/auth/logout` alias are acceptable.
- [ ] Logout requires refresh cookie only, not access token.
- [ ] Idempotent `204 No Content` is acceptable for missing/invalid/already logged-out cases.
- [ ] DB failure must not return false successful logout.
- [ ] Existing access tokens remain valid until expiry after logout.
- [ ] No logout-all, access-token blacklist, Redis durable authority, audit event, RBAC, admin, or rate-limit behavior is included.
- [ ] Acceptance criteria are independently testable.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED and separately hands FEAT-006 to Antigravity.
