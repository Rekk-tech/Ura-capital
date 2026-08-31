# Acceptance Criteria: FEAT-005 Refresh Token Rotation & Revocation

**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-25  
**Feature Spec**: `spec.md`  
**Implementation Report Required**: `reports/implementation/phase-2/FEAT-005.md`  
**QA Report Required After Implementation**: `reports/qa/phase-2/FEAT-005-QA.md`

## Acceptance Matrix

| ID | Criterion | Verification Method | Required Evidence |
|----|-----------|---------------------|-------------------|
| AC-001 | Successful FEAT-004 login establishes a PostgreSQL-backed refresh session when FEAT-005 is active. | API integration and DB-backed test | Login result, session row, and DB state recorded. |
| AC-002 | Refresh token is delivered through an HttpOnly cookie with approved attributes. | API/cookie inspection test | `Set-Cookie` evidence for HttpOnly, Secure, SameSite, Path, Max-Age/Expires, name, and Domain policy. |
| AC-003 | Raw refresh token is not returned in JSON responses. | API integration test | Login and refresh response shape assertions recorded. |
| AC-004 | Raw refresh token is never stored; PostgreSQL stores only an irreversible verifier using the refresh secret. | DB-backed test and source review | DB inspection and verifier strategy recorded. |
| AC-005 | Refresh-session persistence supports durable session ID, user ID, token verifier, token family, expiry, revocation, rotation/replacement linkage, replay representation, and timestamps. | Schema/migration review and DB-backed test | Migration and model fields recorded. |
| AC-006 | `POST /auth/refresh` exists and relies on the refresh cookie, not client body identity or access-token identity. | API integration test and source review | Route, request handling, and negative body-identity tests recorded. |
| AC-007 | Valid refresh succeeds and returns a new FEAT-004-compatible access token. | API integration and token verification test | Access-token contract, issuer, audience, TTL, claims, and HS256 verification recorded. |
| AC-008 | Successful refresh rotates the refresh token and returns a new refresh cookie. | API/cookie and DB-backed test | Old/new cookie and DB transition recorded. |
| AC-009 | Previous refresh token becomes unusable immediately after rotation. | API integration and DB-backed test | Old-token retry rejection recorded. |
| AC-010 | Reuse/replay of a known consumed or revoked refresh token is rejected safely and mints no access token. | Replay test | Status, error envelope, and absence of access token recorded. |
| AC-011 | Known replay/reuse revokes the token family, causing the latest related refresh token to become unusable. | DB-backed replay/family test | Family revocation state and latest-token rejection recorded. |
| AC-012 | Revoked and expired refresh sessions are rejected and never mint access tokens. | Service/API/DB-backed test | Revoked and expired session rejection recorded. |
| AC-013 | Concurrent refresh attempts using the same refresh token cannot both rotate successfully. | Concurrent DB-backed integration test | At most one success and no duplicate active descendant state recorded. |
| AC-014 | Cookie attributes are centralized and compatible with exact clearing by FEAT-006 logout. | Source review and cookie test | Cookie helper/config evidence recorded. |
| AC-015 | Refresh endpoint rejects missing cookie, malformed token, unknown session, tampered token, and database failure safely. | API integration and failure simulation | Safe error envelope evidence recorded. |
| AC-016 | Responses and logs do not expose raw refresh tokens, token verifiers/hashes, session IDs unnecessarily, password hashes, auth secrets, raw Prisma errors, raw JWT errors, or stack traces. | Log capture, API test, and source review | Leakage checks recorded. |
| AC-017 | PostgreSQL remains authoritative for refresh-session durability, revocation, rotation, replay, expiry, and concurrency behavior. | DB-backed tests and architecture review | DB evidence recorded; Redis not required. |
| AC-018 | Redis is not introduced for FEAT-005, or if Human-approved later, Redis is transient only and PostgreSQL remains authoritative. | Source/config review | Redis boundary evidence recorded. |
| AC-019 | FEAT-005 does not implement a public logout endpoint or FEAT-006 logout behavior. | Code review and route search | Scope review recorded. |
| AC-020 | FEAT-005 does not implement RBAC enforcement, admin guard, audit event emission, email verification, account lockout, rate limiting, or later Phase 2 behavior. | Code review and search | Scope review recorded. |
| AC-021 | FEAT-001 through FEAT-004 regression validation passes. | Command execution | Clean, lint, Prisma validate, typecheck, build, standard tests, DB tests, and runtime smoke recorded. |
| AC-022 | Required validation suite passes after implementation. | Command execution | Commands and results recorded. |
| AC-023 | PostgreSQL-backed tests use isolated test database and do not silently skip required DB validation. | DB-backed test | Test DB name/guard/migration/test result recorded. |
| AC-024 | Prisma/database access remains behind repository boundaries; controllers do not import Prisma or own transaction internals. | Source review/import search | Boundary review recorded. |
| AC-025 | Authentication endpoint rate limiting is not silently added; governance recommendation remains documented until Human assigns ownership. | Scope/doc review | Rate-limit boundary recorded. |
| AC-026 | `reports/implementation/phase-2/FEAT-005.md` maps tasks, tests, validation, limitations, security notes, and acceptance criteria truthfully. | Documentation review | Report path exists and is complete. |

## QA Decision Rules

### PASS

FEAT-005 may receive PASS only when:

- AC-001 through AC-026 pass, or any exception is explicitly waived by Human.
- Refresh-token rotation works and previous tokens are unusable.
- Replay/reuse of known old tokens revokes the family.
- PostgreSQL-backed tests prove persistence, rotation, replay, revocation, expiry, and concurrency behavior.
- Raw refresh tokens are not returned, logged, or stored.
- Access tokens minted by refresh follow FEAT-004 contract.
- No public logout, RBAC, admin, audit emission, email verification, account lockout, rate limiting, or FEAT-006 behavior is implemented.
- Validation evidence is real and current.

### CONDITIONAL PASS

FEAT-005 may receive CONDITIONAL PASS only when:

- No P0 security issue exists.
- Rotation, revocation, no raw token storage, cookie safety, and DB authority all pass.
- Any remaining issue is non-blocking documentation or polish.
- Human explicitly accepts the condition and follow-up tracking.

### FAIL

FEAT-005 must receive FAIL if any of the following are true:

- Raw refresh token is stored in PostgreSQL.
- Raw refresh token is returned in JSON or logged.
- Refresh token verifier reuses access-token secret or legacy `JWT_SECRET`.
- Refresh succeeds without PostgreSQL-authoritative session validation.
- Refresh does not rotate tokens.
- Previous refresh token remains usable after rotation.
- Replay/reuse does not revoke the known token family.
- Revoked or expired sessions can mint access tokens.
- Concurrent same-token refreshes can both succeed.
- Cookie is not HttpOnly or production can run with insecure refresh cookie settings.
- Access tokens minted by refresh diverge from FEAT-004 contract.
- Public logout or FEAT-006 behavior is implemented.
- RBAC/admin/audit/rate-limit/later Phase 2 scope creep is implemented.
- Required DB tests skip or run against unsafe targets.
- Lint, typecheck, tests, build, or Prisma validation fail without Human-approved waiver.
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
- Fresh isolated PostgreSQL migration deploy and replay.
- Runtime smoke for health, login, refresh, old-token rejection, and protected endpoint with refreshed access token.

If a database service is unavailable, implementation must state `NOT VERIFIED` for database execution with exact blocker. QA may not mark DB criteria PASS without equivalent real evidence.

## Acceptance Traceability

| User Story | Acceptance Criteria |
|------------|---------------------|
| US1 - Establish Refresh Session on Login | AC-001, AC-002, AC-003, AC-004, AC-005, AC-014, AC-016 |
| US2 - Refresh Access Safely | AC-006, AC-007, AC-008, AC-009, AC-014, AC-016 |
| US3 - Detect Replay and Revoke Family | AC-010, AC-011, AC-016, AC-017 |
| US4 - Reject Invalid Refresh Attempts Safely | AC-012, AC-015, AC-016 |
| US5 - Prevent Concurrent Double Rotation | AC-013, AC-017, AC-023 |
| Cross-cutting | AC-018, AC-019, AC-020, AC-021, AC-022, AC-024, AC-025, AC-026 |

## Human Review Checklist

- [ ] FEAT-005 scope is limited to refresh-token rotation and revocation.
- [ ] Login extension to set refresh cookie is acceptable.
- [ ] Opaque refresh token plus HMAC-SHA-256 verifier is acceptable.
- [ ] Token-family invalidation on known replay is acceptable.
- [ ] Proposed RefreshSession schema migration is acceptable.
- [ ] Cookie path and alias behavior are acceptable.
- [ ] Redis remains out of FEAT-005.
- [ ] Rate limiting remains a separate governance decision.
- [ ] Acceptance criteria are independently testable.

## Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED and separately hands FEAT-005 to Antigravity.
