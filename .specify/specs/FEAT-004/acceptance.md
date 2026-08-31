# Acceptance Criteria: FEAT-004 Login & Access Token Issuance

**Status**: APPROVED  
**Created**: 2026-08-25  
**Feature Spec**: `spec.md`  
**Implementation Report Required**: `reports/implementation/phase-2/FEAT-004.md`  
**QA Report Required After Implementation**: `reports/qa/phase-2/FEAT-004-QA.md`

## Acceptance Matrix

| ID | Criterion | Verification Method | Required Evidence |
|----|-----------|---------------------|-------------------|
| AC-001 | The login API contract is documented and implemented with canonical `POST /auth/login`, request validation, and safe success/failure response shapes. | Contract/doc review and API test | Endpoint path, method, request schema, response schema, and test result recorded. |
| AC-002 | Valid login for an existing `ACTIVE` user with correct password succeeds. | API integration and DB-backed test | Successful request result and database-backed credential fixture recorded. |
| AC-003 | Unknown user login is rejected safely. | API integration test | Status, error code, message, and no-leakage checks recorded. |
| AC-004 | Wrong password login is rejected safely and is externally indistinguishable from unknown user. | API/DB-backed test | Response comparison result recorded. |
| AC-005 | Login normalizes email identity by trim/lowercase before lookup. | API/DB-backed test | Mixed-case/whitespace login result recorded. |
| AC-006 | Password verification reuses the FEAT-003 Argon2id verification primitive and introduces no second password implementation. | Code review and test | Import/reuse evidence and valid/wrong password tests recorded. |
| AC-007 | Access tokens use HS256 only. | Unit/API test and source review | Signing algorithm and verification allowlist evidence recorded. |
| AC-008 | Successful login issues a short-lived access token with default 15-minute lifetime and only approved 5-15 minute environment override. | Unit/API test and token decode/verify inspection | TTL, expiry, and no client-controlled expiry evidence recorded. |
| AC-009 | Access-token claims are exactly `sub`, `iat`, `exp`, `iss`, `aud`, and `typ`, with `typ` equal to `access`. | Unit/API test and code review | Claim inspection and validation evidence recorded. |
| AC-010 | Access-token payload excludes password, password hash, credential internals, refresh-session data, auth secrets, `jti`, profile data, roles, admin flags, and client-provided authorization claims. | Unit/API test and code review | Negative claim inspection recorded. |
| AC-011 | Access-token secret, issuer, and audience are required environment configuration and missing/invalid values fail startup/config validation with no fallback secret or fallback issuer/audience. | Config/unit/startup test and source search | Missing-config failure and no-fallback search result recorded. |
| AC-012 | Unknown-user login path avoids obvious fast-fail timing enumeration by performing FEAT-003 Argon2id verification against a fixed server-side dummy encoded hash, or equivalent approved constant-work strategy. | Unit test and source review | Dummy verification/constant-work evidence recorded without requiring strict timing equality. |
| AC-013 | Protected requests use `Authorization: Bearer <access-token>` and reject missing header, wrong scheme, empty bearer token, malformed header, and ambiguous credentials safely. | Middleware integration test | Rejection status/error envelope recorded for each header case. |
| AC-014 | Forged token is rejected safely. | Middleware integration test | Rejection status/error envelope recorded. |
| AC-015 | Malformed token is rejected safely. | Middleware integration test | Rejection status/error envelope recorded. |
| AC-016 | Expired token is rejected safely. | Unit/middleware integration test | Expired-token result recorded. |
| AC-017 | `none` algorithm and unexpected/wrong algorithms are rejected safely; verification never trusts an unverified token header to select behavior. | Unit/middleware integration test and source review | Wrong-algorithm and `none` rejection evidence recorded. |
| AC-018 | Wrong issuer and wrong audience tokens are rejected safely. | Unit/middleware integration test | Wrong-issuer and wrong-audience rejection evidence recorded. |
| AC-019 | Authenticated request context is server-derived from verified token `sub` plus server-side user lookup; nonexistent/deleted users, non-`ACTIVE` users, and client-provided role/admin claims are rejected or ignored safely. | Middleware/API integration test and code review | Context derivation, user lookup, inactive-user rejection, and ignored client-claim evidence recorded. |
| AC-020 | Canonical representative protected endpoint `GET /auth/me` rejects missing/invalid tokens and accepts valid tokens with a safe response. | API integration test | Missing/invalid/valid protected endpoint results and safe response shape recorded. |
| AC-021 | Login/protected responses and logs do not expose password, password hash, credential internals, refresh-session data, roles, auth secrets, full raw tokens, raw JWT errors, raw database errors, or stack traces. | API integration test, log capture, and source review | Response/leakage/log assertions recorded. |
| AC-022 | FEAT-004 does not implement refresh tokens, refresh rotation, refresh-session behavior, logout, RBAC enforcement, admin guard, audit event emission, email verification, account lockout, rate limiting, or FEAT-005 behavior. | Code review and search | Scope review recorded. |
| AC-023 | PostgreSQL-backed login tests use isolated test database and preserve FEAT-002/FEAT-003 DB guard behavior. | DB-backed test | Migration, guard, and DB test results recorded. |
| AC-024 | FEAT-001, FEAT-002, and FEAT-003 regression validation passes. | Command execution | Clean, lint, typecheck, build, standard tests, DB tests, Prisma validation, and runtime health/login smoke recorded as applicable. |
| AC-025 | `reports/implementation/phase-2/FEAT-004.md` maps tasks, tests, validation results, limitations, security notes, and acceptance criteria truthfully. | Documentation review | Report path exists and is complete. |

## QA Decision Rules

### PASS

FEAT-004 may receive PASS only when:

- AC-001 through AC-025 pass, or any exception is explicitly waived by Human.
- Valid login verifies the existing Argon2id credential and issues a short-lived HS256 access token.
- Unknown-user and wrong-password failures are externally indistinguishable.
- Unknown-user handling avoids an obvious fast-fail path using dummy Argon2id verification or equivalent approved constant-work.
- Missing, forged, malformed, expired, wrong-algorithm, wrong-issuer, and wrong-audience tokens are rejected safely.
- Protected endpoint accepts valid tokens and derives request context from verified token plus server-side user lookup.
- Access token contains only the approved claims and no sensitive data or trusted role/admin claims.
- No refresh/logout/RBAC/admin/audit/rate-limit/FEAT-005 behavior is implemented.
- FEAT-001, FEAT-002, and FEAT-003 regression checks pass.
- PostgreSQL-backed tests use an isolated test DB and execute, not skip.

### CONDITIONAL PASS

FEAT-004 may receive CONDITIONAL PASS only when:

- No P0 security issue exists.
- Login, password verification reuse, token issuance, and token rejection core behavior all pass.
- Any remaining issue is non-blocking documentation, reporting, or polish.
- Human explicitly accepts the condition and follow-up tracking.

### FAIL

FEAT-004 must receive FAIL if any of the following are true:

- Valid login cannot authenticate an existing user with correct password.
- Password verification does not reuse the FEAT-003 Argon2id primitive.
- Unknown-user and wrong-password responses leak account existence.
- Unknown-user path uses an obvious fast-fail branch without dummy verification or equivalent approved constant-work.
- Access token lifetime is outside 5-15 minutes or client-controlled.
- Access token does not use HS256-only signing and verification.
- Verification accepts `none`, wrong algorithm, wrong issuer, wrong audience, malformed, forged, or expired tokens.
- Token signing uses a hard-coded or fallback secret, issuer, or audience.
- Token payload includes password, password hash, credential internals, refresh-session data, secrets, `jti`, profile data, or trusted role/admin claims.
- Protected endpoint trusts client-provided role/admin/user context.
- Validly signed tokens for nonexistent/deleted/non-`ACTIVE` users are accepted.
- Password, password hash, full token, or secret is logged.
- Raw JWT/database errors or stack traces leak in responses.
- Refresh-token issuance, refresh rotation, refresh-session behavior, logout, RBAC, admin guard, audit event emission, email verification, account lockout, rate limiting, or FEAT-005 behavior is implemented.
- DB-backed required tests skip or run against unsafe targets.
- Lint, typecheck, tests, or build fail without Human-approved waiver.
- Implementation report is missing or materially inaccurate.

## Required Validation Commands

Implementation must run and report:

- Install/update dependencies if required.
- Generate Prisma client if required.
- Apply migrations to an isolated test database.
- Run PostgreSQL-backed FEAT-002/FEAT-003/FEAT-004 database tests.
- Run login API tests.
- Run access-token service and middleware tests.
- Run secret/password/token leakage tests.
- Run lint.
- Run typecheck.
- Run standard tests.
- Run build.
- Run packaged API runtime health check.
- Run packaged API login and protected-endpoint smoke if API route wiring changes startup behavior.

If a database service is unavailable in the implementation environment, the implementation report must state `NOT VERIFIED` for database execution and provide the exact blocker. QA may not mark related DB acceptance criteria PASS without equivalent evidence.

## Acceptance Traceability

| User Story | Acceptance Criteria |
|------------|---------------------|
| US1 - Log In With Valid Credentials | AC-001, AC-002, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-021 |
| US2 - Reject Invalid Login Without Enumeration | AC-003, AC-004, AC-006, AC-012, AC-021, AC-022 |
| US3 - Verify Access Tokens for Protected Requests | AC-007, AC-009, AC-010, AC-011, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021 |
| Cross-cutting | AC-022, AC-023, AC-024, AC-025 |

## Human Review Checklist

- [ ] FEAT-004 scope is limited to login and access-token issuance/verification.
- [ ] Invalid login behavior prevents account enumeration without relying on strict timing equality.
- [ ] Access-token algorithm, lifetime, issuer, audience, and claims match ADR-004 and this spec.
- [ ] Refresh-token behavior remains out of scope for FEAT-005.
- [ ] RBAC/admin/audit behavior remains out of scope for later Phase 2 features.
- [ ] Rate limiting is intentionally deferred to a later Human-approved Phase 2 boundary.
- [ ] Acceptance criteria are independently testable.
- [ ] Tasks are detailed enough for Antigravity after approval.

## Handoff Rule

Implementation must not begin until Human separately hands FEAT-004 to Antigravity for implementation.
