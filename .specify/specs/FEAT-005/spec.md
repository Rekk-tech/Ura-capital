# Feature Specification: Refresh Token Rotation & Revocation

**Feature ID**: FEAT-005  
**Feature Branch**: `N/A - repository is not initialized as git`  
**Created**: 2026-08-25  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Input**: Human approved FEAT-004 and requested planning-only spec package for FEAT-005.

## User Scenarios & Testing

### User Story 1 - Establish Refresh Session on Login (Priority: P1)

As a registered user, I can log in successfully and receive session continuity through a secure refresh-token cookie without seeing the refresh token in JSON.

**Why this priority**: Refresh sessions begin at login and must preserve FEAT-004 behavior while adding ADR-004 session continuity.

**Independent Test**: Register or seed a user in an isolated PostgreSQL database, log in with valid credentials, verify the existing access-token response remains valid, verify a refresh session is persisted, and inspect the `Set-Cookie` header for the approved refresh cookie attributes.

**Acceptance Scenarios**:

1. **Given** a valid login, **When** FEAT-005 is active, **Then** login returns the FEAT-004 access-token response and sets a refresh-token cookie.
2. **Given** login succeeds, **When** the JSON body is inspected, **Then** the raw refresh token is absent.
3. **Given** login succeeds, **When** PostgreSQL is inspected, **Then** a refresh session exists with an irreversible token verifier and no raw token.

---

### User Story 2 - Refresh Access Safely (Priority: P1)

As an authenticated session, I can use my refresh cookie to obtain a new short-lived access token and a newly rotated refresh cookie.

**Why this priority**: Access tokens are intentionally short-lived; refresh must be the safe continuity path.

**Independent Test**: Use a valid refresh cookie against `POST /auth/refresh`, verify a new FEAT-004 access token is returned, verify a new refresh cookie is set, and verify the old refresh token/session cannot be used again.

**Acceptance Scenarios**:

1. **Given** a valid unexpired refresh cookie, **When** refresh is called, **Then** a new FEAT-004 access token is returned.
2. **Given** refresh succeeds, **When** response headers are inspected, **Then** a rotated refresh cookie is returned.
3. **Given** refresh succeeds, **When** the old refresh token is reused, **Then** it is rejected and cannot mint another access token.

---

### User Story 3 - Detect Replay and Revoke Family (Priority: P1)

As a security reviewer, I can verify reuse of an already consumed or revoked refresh token is treated as replay and invalidates the token family.

**Why this priority**: Refresh-token replay is a critical security boundary. A stolen old token must not quietly coexist with the valid session chain.

**Independent Test**: Refresh once successfully, then present the old token again. Verify the reused token is rejected, no access token is minted, the family is revoked, and the latest rotated token is no longer usable.

**Acceptance Scenarios**:

1. **Given** an already consumed refresh token, **When** it is presented again, **Then** refresh is denied with a safe authentication error.
2. **Given** a replay is detected for a known family, **When** the latest refresh token in that family is later used, **Then** it is also rejected.
3. **Given** replay handling occurs, **When** persisted state is inspected, **Then** the family-level invalidation is represented for future FEAT-009 audit emission.

---

### User Story 4 - Reject Invalid Refresh Attempts Safely (Priority: P1)

As an attacker or invalid client, I cannot refresh using missing, malformed, unknown, expired, revoked, or tampered refresh tokens.

**Why this priority**: Refresh token endpoints are high-value security targets.

**Independent Test**: Call `POST /auth/refresh` with missing cookie, malformed cookie, random unknown token, expired session, revoked session, and database failure simulation; verify stable safe errors and no sensitive leakage.

**Acceptance Scenarios**:

1. **Given** no refresh cookie, **When** refresh is called, **Then** the request is rejected safely.
2. **Given** a malformed or unknown token, **When** refresh is called, **Then** the request is rejected safely.
3. **Given** an expired or revoked session, **When** refresh is called, **Then** the request is rejected safely and no access token is minted.

---

### User Story 5 - Prevent Concurrent Double Rotation (Priority: P1)

As the system, I can handle concurrent refresh attempts with the same refresh token without minting two valid session continuations.

**Why this priority**: Real clients and attackers can race refresh requests; PostgreSQL state must protect the rotation boundary.

**Independent Test**: Send two concurrent refresh requests using the same cookie and verify at most one succeeds; the other is rejected and cannot leave two active descendants.

**Acceptance Scenarios**:

1. **Given** two concurrent refresh requests with the same token, **When** both reach the server, **Then** no more than one request can successfully rotate.
2. **Given** the loser request is rejected, **When** database state is inspected, **Then** no duplicate active session chain exists.

## Requirements

### Functional Requirements

- **FR-001**: FEAT-005 MUST extend successful FEAT-004 login to create a PostgreSQL-backed refresh session and set a refresh-token cookie.
- **FR-002**: Login access-token behavior MUST remain FEAT-004 compatible: same access-token contract, signing algorithm, issuer, audience, TTL rules, and safe JSON response semantics.
- **FR-003**: Raw refresh tokens MUST be generated using cryptographically secure randomness.
- **FR-004**: Raw refresh tokens MUST be delivered only through the refresh cookie and MUST NOT be returned in JSON.
- **FR-005**: PostgreSQL MUST store only an irreversible verifier of the refresh token, not the raw token.
- **FR-006**: The refresh-token verifier MUST use `AUTH_REFRESH_TOKEN_SECRET` and MUST NOT reuse `AUTH_ACCESS_TOKEN_SECRET` or `JWT_SECRET`.
- **FR-007**: FEAT-005 MUST define or migrate refresh-session fields required for rotation, token-family invalidation, replacement linkage, and replay representation.
- **FR-008**: The feature MUST expose canonical `POST /auth/refresh`; `/api/auth/refresh` MAY exist only as a documented and tested alias.
- **FR-009**: Refresh requests MUST rely on the HttpOnly refresh cookie and server-side PostgreSQL lookup, not client body user/session IDs or access-token identity.
- **FR-010**: Every successful refresh MUST rotate the refresh token, persist new session state, set a new cookie, invalidate/consume the previous token, and return a new FEAT-004 access token.
- **FR-011**: The old refresh token MUST be unusable immediately after successful rotation.
- **FR-012**: Reuse of a known consumed or revoked refresh token MUST be treated as replay and MUST revoke the token family.
- **FR-013**: Revoked refresh sessions MUST never mint access tokens.
- **FR-014**: Expired refresh sessions MUST never mint access tokens.
- **FR-015**: Refresh-session expiration MUST be server-derived from `AUTH_REFRESH_TOKEN_TTL_DAYS`; clients MUST NOT control expiry.
- **FR-016**: Refresh cookie attributes MUST be explicit: name, `HttpOnly`, `Secure`, `SameSite`, `Path`, `Max-Age`/`Expires`, and `Domain` policy.
- **FR-017**: Cookie settings MUST satisfy environment strategy; production must not run with insecure refresh cookies.
- **FR-018**: Rotation MUST be safe against concurrent refresh attempts with the same token.
- **FR-019**: PostgreSQL MUST remain authoritative for refresh-session durability, revocation, and replay state.
- **FR-020**: Redis MUST NOT be introduced for FEAT-005 unless Human approves a scope change; if used later, Redis can only be transient and non-authoritative.
- **FR-021**: Missing, malformed, unknown, expired, revoked, reused, tampered, and database-failure refresh attempts MUST return stable safe errors.
- **FR-022**: Responses/logs MUST NOT expose raw refresh tokens, token hashes/verifiers, database IDs unnecessarily, Prisma errors, stack traces, access/refresh secrets, or raw JWT errors.
- **FR-023**: FEAT-005 MAY implement internal revocation primitives needed for refresh security and tests.
- **FR-024**: FEAT-005 MUST NOT implement public logout endpoint, public logout behavior, RBAC, admin guard, audit event emission, email verification, account lockout, rate limiting, or FEAT-006 behavior.
- **FR-025**: FEAT-005 MUST include unit, service, API integration, PostgreSQL-backed, cookie-inspection, replay, and concurrency tests.
- **FR-026**: Required DB tests MUST run against an isolated PostgreSQL test database and must not silently skip.
- **FR-027**: FEAT-005 MUST preserve FEAT-001 through FEAT-004 regression validation categories: clean, lint, Prisma validate, typecheck, build, standard tests, DB tests, and runtime smoke where applicable.
- **FR-028**: The implementation report MUST map completed work to FEAT-005 requirements, tasks, tests, validation, limitations, security notes, and acceptance criteria truthfully.

### Key Entities

- **RefreshToken**: Opaque high-entropy random token delivered only via HttpOnly cookie.
- **RefreshTokenVerifier**: HMAC-SHA-256 or equivalent irreversible verifier stored in PostgreSQL.
- **RefreshSession**: PostgreSQL session record representing a refresh token in a token family.
- **TokenFamily**: Logical chain of refresh sessions created from one login session and subsequent rotations.
- **RotationResult**: Internal result containing new access token, new refresh token, and updated persistence state.
- **ReplayDetectedState**: Persisted state showing a known consumed/revoked token was reused and the family was invalidated.
- **RefreshCookieContract**: Cookie attributes used by FEAT-005 to set the cookie and by FEAT-006 to clear it.

## Data Model Requirements

FEAT-005 should migrate `RefreshSession` to support at minimum:

- `id`: existing primary key.
- `userId`: existing user FK.
- `tokenHash`: existing unique verifier field, may keep name if it stores HMAC verifier.
- `familyId`: new UUID/string grouping all rotations from a login session.
- `replacedBySessionId`: optional self-reference to the next session.
- `rotatedAt` or `consumedAt`: timestamp when the token was successfully exchanged.
- `isRevoked`: existing revoked flag.
- `revokedAt`: existing revocation timestamp.
- `revocationReason`: optional enum/string such as `ROTATED`, `REPLAY_DETECTED`, `MANUAL`, `EXPIRED_CLEANUP`.
- `reusedAt`: optional timestamp for known replay detection.
- `expiresAt`: existing expiration timestamp.
- `userAgent`, `ipAddress`, `createdAt`, `updatedAt`: existing metadata.

Database constraints should include:

- Unique `tokenHash`.
- Index `userId`.
- Index `familyId`.
- Index `expiresAt`.
- Optional index for active lookup and cleanup.
- Foreign-key integrity to `User`.
- Self-reference integrity for `replacedBySessionId` if implemented.

If implementation chooses a different equivalent model, it must prove AC coverage and document why it still supports safe rotation, replay detection, and family invalidation.

## Token Verifier Decision

Selected:

```text
base64url(random 32+ bytes) raw token
HMAC-SHA-256(raw token, AUTH_REFRESH_TOKEN_SECRET) stored as verifier
```

Rationale:

- Raw token remains unguessable and opaque.
- Database compromise does not reveal usable refresh tokens without the refresh secret.
- Uses existing Node crypto capability; no major dependency required.
- Keeps refresh verification independent from access-token JWT signing.

Rejected:

- Store raw refresh token: rejected due high credential exposure risk.
- Store unsalted fast hash without server secret: weaker if DB is compromised.
- Use access-token JWT secret as verifier key: rejected by secret-boundary requirement.
- Stateless refresh JWT only: rejected by ADR-004 because revocation/auditability require durable PostgreSQL state.

## Cookie Contract

Default cookie:

```text
Name: AUTH_REFRESH_COOKIE_NAME, default aura_refresh_token
HttpOnly: true
Secure: AUTH_REFRESH_COOKIE_SECURE, required true in production
SameSite: AUTH_REFRESH_COOKIE_SAME_SITE, default lax
Path: /auth/refresh
Max-Age/Expires: derived from AUTH_REFRESH_TOKEN_TTL_DAYS
Domain: omitted unless Human approves environment-specific need
```

If `/api/auth/refresh` alias is implemented, the cookie path must still allow that alias or the alias must be explicitly excluded. Preferred option is to keep canonical refresh behavior under `/auth/refresh` and document any alias cookie-path implication.

## Error Contract

All refresh failures use stable safe error envelopes. Recommended public error:

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Invalid or expired refresh session",
    "requestId": "..."
  }
}
```

Specific internal reasons may be used for logs/metadata only after redaction and must not expose raw tokens, hashes, session IDs unnecessarily, secrets, stack traces, raw Prisma errors, or raw JWT errors.

## Concurrency Strategy

Preferred implementation strategy:

- Compute token verifier.
- Look up session by unique verifier inside a transaction.
- Atomically transition the current session from active to consumed/revoked using a conditional update that requires the session is not revoked, not consumed, not expired, and has no replacement.
- Create the replacement session in the same transaction.
- If the conditional update affects zero rows, treat as invalid/replay and deny.
- For known replay of a consumed/revoked token, revoke the entire family in a transaction.

The implementation may use Prisma transactions plus PostgreSQL row-level locking or conditional updates. It must prove with a concurrent test that two simultaneous refreshes using the same token cannot both succeed.

## Redis Boundary

Redis is intentionally out of FEAT-005. PostgreSQL is the durable and authoritative source of refresh-session state. Rate limiting and optional replay-cache acceleration require separate Human-approved scope.

## Success Criteria

- **SC-001**: 100% of valid logins create a refresh session and set a secure HttpOnly refresh cookie when FEAT-005 is active.
- **SC-002**: 100% of tested refresh responses exclude raw refresh tokens and token verifiers from JSON.
- **SC-003**: 100% of successful refresh calls rotate the refresh token and invalidate the previous token.
- **SC-004**: 100% of replay/reuse cases for known consumed/revoked tokens deny refresh and invalidate the family.
- **SC-005**: 100% of expired, revoked, malformed, unknown, and missing-cookie refresh attempts deny safely.
- **SC-006**: Concurrent refresh attempts using the same token result in at most one success.
- **SC-007**: PostgreSQL-backed tests prove migration, persistence, rotation, revocation, replay, and concurrency behavior.
- **SC-008**: FEAT-001 through FEAT-004 regressions remain green.

