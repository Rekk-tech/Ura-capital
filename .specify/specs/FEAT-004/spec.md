# Feature Specification: Login & Access Token Issuance

**Feature ID**: FEAT-004  
**Feature Branch**: `N/A - repository is not initialized as git`  
**Created**: 2026-08-25  
**Status**: APPROVED  
**Input**: Human approved FEAT-003 and requested full spec package for FEAT-004.

## User Scenarios & Testing

### User Story 1 - Log In With Valid Credentials (Priority: P1)

As a registered user, I can submit my email and password and receive a short-lived access token plus safe user context.

**Why this priority**: Login is the entry point for authenticated product features and blocks refresh/session work in FEAT-005.

**Independent Test**: Register or seed a user in an isolated PostgreSQL test database, submit valid login credentials, verify the response contains a signed HS256 short-lived access token and safe user fields only.

**Acceptance Scenarios**:

1. **Given** an existing registered user with an Argon2id password hash, **When** valid credentials are submitted, **Then** login succeeds.
2. **Given** login succeeds, **When** the response is returned, **Then** it includes an access token and safe user fields only.
3. **Given** a valid mixed-case email with surrounding whitespace, **When** login is processed, **Then** lookup uses the normalized email identity.

---

### User Story 2 - Reject Invalid Login Without Enumeration (Priority: P1)

As an attacker or invalid client, I cannot learn whether an email exists based on login error shape.

**Why this priority**: Authentication failures must avoid account enumeration while preserving stable client behavior.

**Independent Test**: Submit login with an unknown email and with a known email but wrong password; verify both return the same status, error code, and externally safe message without password or database leakage, and verify the unknown-user path does not use an obvious fast-fail branch that skips expensive password verification work.

**Acceptance Scenarios**:

1. **Given** an unknown email, **When** login is submitted, **Then** the response is the standard safe authentication failure.
2. **Given** an existing email with the wrong password, **When** login is submitted, **Then** the response is indistinguishable from the unknown-email failure.
3. **Given** invalid login input is rejected, **When** logs and responses are inspected, **Then** plaintext password, password hash, and raw database details are absent.

---

### User Story 3 - Verify Access Tokens for Protected Requests (Priority: P1)

As the backend, I can authenticate protected requests using only verified server-issued access tokens.

**Why this priority**: Later features need an authenticated request context before authorization and refresh flows can be added.

**Independent Test**: Call a representative protected endpoint with no token, malformed token, forged token, expired token, and valid token; verify only the valid token succeeds and authenticated context is server-derived.

**Acceptance Scenarios**:

1. **Given** no token is supplied, **When** a protected endpoint is called, **Then** the request is rejected safely.
2. **Given** a malformed, forged, or expired token is supplied, **When** a protected endpoint is called, **Then** the request is rejected safely.
3. **Given** a valid access token is supplied, **When** a protected endpoint is called, **Then** the server derives authenticated user context and returns a safe verification response.

## Edge Cases

- Email normalization must trim whitespace and lowercase before lookup.
- Unknown email and wrong password must use the same external failure contract.
- Password verification must use the existing FEAT-003 Argon2id verification primitive.
- Missing access-token signing secret, issuer, or audience must fail startup/config validation before serving traffic.
- Access-token signing and verification algorithm is HS256 only.
- Verifier must enforce an explicit algorithm allowlist and reject `none` or any unexpected algorithm.
- Access token lifetime must use the configured `AUTH_ACCESS_TOKEN_TTL_MINUTES`, default to the existing approved 15 minutes, and remain within 5-15 minutes.
- Expired tokens must be rejected based on token expiry, not trusted client timestamps.
- Token payload must contain exactly the approved required claims: `sub`, `iat`, `exp`, `iss`, `aud`, and `typ`.
- `typ` must equal `access`.
- `jti` is intentionally omitted from FEAT-004 because access-token revocation/replay tracking belongs to later session/security features.
- Token payload must not contain password, password hash, credential ID, refresh-session fields, auth secrets, profile data beyond the subject, or client-provided role/admin claims.
- Protected requests must authenticate with `Authorization: Bearer <access-token>`.
- Missing header, wrong scheme, empty bearer token, malformed header, and multiple/ambiguous credentials must fail safely.
- User identity in request context must be derived from verified token `sub` plus server-side User lookup/validation.
- A validly signed token whose `sub` no longer maps to an existing user must be rejected safely.
- A validly signed token for a non-`ACTIVE` user must be rejected safely without introducing account lifecycle behavior.
- Client-provided role/admin claims must be ignored in FEAT-004.
- Login must not create refresh sessions, refresh tokens, cookies, logout state, RBAC decisions, admin decisions, or audit event emissions.

## Requirements

### Functional Requirements

- **FR-001**: The feature MUST expose a login API contract for credential authentication.
- **FR-002**: Login request MUST validate email and password before credential lookup.
- **FR-003**: Login MUST normalize the email identity by trimming surrounding whitespace and lowercasing before lookup.
- **FR-004**: Login MUST look up users and credentials using FEAT-002 repository/model boundaries.
- **FR-005**: Login MUST verify passwords using the existing FEAT-003 Argon2id password verification primitive.
- **FR-006**: Login MUST reject unknown email and wrong password with the same externally safe status, code, and message.
- **FR-007**: Login MUST NOT expose whether the email exists.
- **FR-008**: Unknown-user login path MUST perform an Argon2id verification operation against a fixed server-side dummy encoded Argon2id hash, or an equivalent approved constant-work strategy, to avoid obvious timing enumeration.
- **FR-009**: Successful login MUST issue a short-lived access token signed with required environment config.
- **FR-010**: Access tokens MUST use HS256 only.
- **FR-011**: Access-token verification MUST enforce an algorithm allowlist and reject `none` or any unexpected algorithm.
- **FR-012**: Access-token lifetime MUST use the configured `AUTH_ACCESS_TOKEN_TTL_MINUTES`, default to 15 minutes, stay within 5-15 minutes, and never be client-controlled.
- **FR-013**: Access-token claims MUST be exactly `sub`, `iat`, `exp`, `iss`, `aud`, and `typ`.
- **FR-014**: Token claims MUST be server-derived and validated; `sub` identifies the user, `iss` and `aud` must match required config, and `typ` must equal `access`.
- **FR-015**: Access-token payload MUST NOT include password, password hash, credential internals, refresh-session data, auth secrets, `jti`, unnecessary profile data, or client-provided role/admin claims.
- **FR-016**: Missing or invalid access-token signing secret, issuer, or audience MUST fail startup/config validation with no fallback values.
- **FR-017**: The feature MUST provide access-token verification middleware for `Authorization: Bearer <access-token>`.
- **FR-018**: Verification middleware MUST reject missing header, wrong scheme, empty bearer token, malformed header, malformed token, forged token, wrong algorithm, wrong issuer, wrong audience, expired token, and ambiguous credentials safely.
- **FR-019**: Verification middleware MUST attach authenticated request context derived from verified token `sub` plus server-side User lookup/validation.
- **FR-020**: Verification middleware MUST reject a valid token when the `sub` user no longer exists or is not `ACTIVE`.
- **FR-021**: The feature MUST provide canonical `GET /auth/me` as a representative protected endpoint for verification/testing only.
- **FR-022**: Protected endpoint MUST reject missing/invalid tokens and accept valid tokens.
- **FR-023**: Login response and protected response MUST use safe response shapes.
- **FR-024**: Passwords, password hashes, full tokens, auth secrets, and raw database/JWT errors MUST NOT be logged.
- **FR-025**: Error responses MUST use the stable error envelope pattern and MUST NOT expose raw database/JWT errors.
- **FR-026**: The feature MUST include unit, API integration, and PostgreSQL-backed tests for login, timing-enumeration mitigation behavior, token issuance, token verification, and regressions.
- **FR-027**: The feature MUST preserve FEAT-001, FEAT-002, and FEAT-003 validation categories: clean, lint, typecheck, build, standard tests, DB-backed tests, Prisma validation, and runtime health where applicable.
- **FR-028**: The implementation report MUST map completed work to FEAT-004 requirements, tasks, tests, validation, and acceptance criteria.
- **FR-029**: The feature MUST NOT implement refresh tokens, refresh rotation, refresh-session behavior, logout, RBAC enforcement, admin guard, audit event emission, email verification, account lockout, rate limiting, or FEAT-005 behavior.

### Key Entities

- **LoginRequest**: Public input containing email and password.
- **NormalizedEmail**: Canonical email identity used for lookup.
- **CredentialVerificationResult**: Internal result of comparing supplied password with stored Argon2id hash.
- **AccessToken**: Short-lived bearer token signed by the server.
- **AccessTokenClaims**: Exact server-derived claims: `sub`, `iat`, `exp`, `iss`, `aud`, and `typ`.
- **AuthenticatedRequestContext**: Server-derived context attached after access-token verification.
- **ProtectedVerificationEndpoint**: Representative endpoint proving token verification and request context behavior.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of valid login attempts for existing users with correct passwords return a short-lived access token and safe user response.
- **SC-002**: 100% of unknown-email and wrong-password attempts return the same external authentication failure contract.
- **SC-003**: 100% of issued access tokens use HS256 and have a 15-minute default lifetime unless a valid 5-15 minute environment override is configured.
- **SC-004**: 100% of tested missing-header, wrong-scheme, empty bearer, malformed-header, forged, malformed, wrong-algorithm, wrong-issuer, wrong-audience, expired, and unknown-subject tokens are rejected.
- **SC-005**: 100% of accepted protected requests derive user context from server-verified token data, not client-provided role/admin claims.
- **SC-006**: 100% of tested responses/logs exclude password, password hash, auth secrets, raw JWT errors, and raw database errors.
- **SC-007**: FEAT-001, FEAT-002, and FEAT-003 regression validation remains green after implementation.

## Access Token Decision

Selected behavior follows ADR-004:

- Token type: short-lived access token.
- Algorithm: HS256 only.
- Lifetime: environment-configured and validated within 5-15 minutes; default remains the existing approved 15 minutes.
- Signing secret: required from environment via approved auth config; no fallback.
- Issuer: required `AUTH_ACCESS_TOKEN_ISSUER`, no fallback.
- Audience: required `AUTH_ACCESS_TOKEN_AUDIENCE`, no fallback.
- Claims: exact, minimal, server-derived, and validated.
- Token purpose/type: access only.
- Refresh behavior: not included.
- Role/admin claims: not trusted from client; role authorization belongs to FEAT-007.

Required claim contract:

- `sub`: required, server-derived User ID, validated by User repository lookup.
- `iat`: required, generated by server.
- `exp`: required, generated by server from configured TTL.
- `iss`: required, generated by server and validated against `AUTH_ACCESS_TOKEN_ISSUER`.
- `aud`: required, generated by server and validated against `AUTH_ACCESS_TOKEN_AUDIENCE`.
- `typ`: required, must equal `access`.

No other access-token claims are approved for FEAT-004. `jti` is intentionally omitted because FEAT-004 has no access-token revocation/replay state. Any additional claim requires Human-approved spec change.

## Authorization Header Contract

Protected requests must use:

```text
Authorization: Bearer <access-token>
```

Required failure behavior:

- Missing `Authorization` header: reject with stable `UNAUTHENTICATED` error.
- Wrong auth scheme: reject with stable `UNAUTHENTICATED` error.
- Empty bearer token: reject with stable `UNAUTHENTICATED` error.
- Malformed header with too many/few parts: reject with stable `UNAUTHENTICATED` error.
- Multiple or ambiguous credentials where detectable: reject with stable `UNAUTHENTICATED` error.

Client responses must not include raw JWT parser/verifier errors.

## Timing Enumeration Mitigation

Unknown email and wrong password must remain externally indistinguishable. FEAT-004 also requires mitigation for obvious timing-based enumeration:

- Unknown-user path must perform an Argon2id verification operation using a fixed server-side dummy encoded Argon2id hash, or an equivalent approved constant-work strategy.
- The dummy hash must use approved FEAT-003 Argon2id parameters.
- The dummy hash must not be user-specific and must not create any database record.
- The branch reason must not be logged.
- Acceptance does not require strict timing equality because runtime timing is nondeterministic.

## Authenticated Context Contract

Middleware must:

1. Verify token signature, algorithm, expiry, issuer, audience, and `typ`.
2. Read user ID from verified `sub`.
3. Look up the user through FEAT-002 repository boundary.
4. Reject safely if user does not exist.
5. Reject safely if user status is not `ACTIVE`.
6. Attach server-derived safe authenticated context.

Context may include:

- `userId`
- `email`
- `displayName`
- `status`

Context must not include roles, admin flags, credential data, password hash, refresh-session data, or client-provided authorization state.

## Assumptions

- Login endpoint path may follow the existing API route convention, but canonical route should be documented and tested.
- Existing FEAT-003 registered user records are sufficient login fixtures.
- FEAT-004 can add token signing/verification dependency if the current dependency set does not include one, but the choice must be minimal, maintained, and documented in the implementation report.
- Canonical protected endpoint is `GET /auth/me`. If the existing dual route convention is retained, `/api/auth/me` may be added only as a documented and tested alias.
