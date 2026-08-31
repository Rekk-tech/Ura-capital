# Feature Specification: FEAT-006 Logout & Session Invalidation

**Feature ID**: FEAT-006  
**Feature Branch**: `N/A - repository is not initialized as git`  
**Created**: 2026-08-26  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Input**: Human approved FEAT-005 and requested planning-only spec package for FEAT-006.

## User Scenarios & Testing

### User Story 1 - Logout Current Session (Priority: P1)

As a signed-in user with a refresh session, I can log out of my current session so that the refresh token for that session can no longer continue authentication.

**Why this priority**: Logout is the user-facing revocation path required after refresh-token sessions exist.

**Independent Test**: Register/login a user in an isolated PostgreSQL test database, capture the refresh cookie, call `POST /auth/logout`, verify `204`, verify cookie clearing header, inspect PostgreSQL revocation state, then attempt refresh with the old cookie and verify no access token is minted.

**Acceptance Scenarios**:

1. **Given** a valid active refresh cookie, **When** `POST /auth/logout` is called, **Then** the matching current refresh session is revoked with reason `USER_LOGOUT`.
2. **Given** logout succeeds, **When** response headers are inspected, **Then** the refresh cookie is cleared with the same cookie identity attributes used by FEAT-005.
3. **Given** logout succeeds, **When** the old refresh token is used on refresh, **Then** refresh is rejected and no access token is minted.

### User Story 2 - Prevent Client Authority Abuse (Priority: P1)

As the system, I must derive logout authority from the refresh cookie and server-side session state, not from client-provided identity fields.

**Why this priority**: Client-provided IDs or role claims could otherwise revoke the wrong session or create authorization bypasses.

**Independent Test**: Call logout with a valid refresh cookie plus misleading request body fields such as another `userId`, `sessionId`, `familyId`, `role`, or `admin`; verify only the cookie-derived session is affected, no other session is revoked, and response remains safe.

**Acceptance Scenarios**:

1. **Given** the request body supplies `userId` or `sessionId`, **When** logout is called with a valid refresh cookie, **Then** body identity is ignored or rejected and cannot select the revoked session.
2. **Given** an access token for a different user is supplied, **When** logout is called with a refresh cookie, **Then** the access token is not used as authority to select a refresh session.
3. **Given** another active session exists for the same user or another user, **When** current-session logout succeeds, **Then** unrelated sessions remain unchanged.

### User Story 3 - Idempotent Safe Logout (Priority: P1)

As a user or browser, I can repeat logout safely without learning whether a session exists.

**Why this priority**: Logout is often triggered multiple times by browsers, tabs, retries, and user actions; responses must not leak session state.

**Independent Test**: Call logout with missing, malformed, unknown, expired, already revoked, and consumed refresh cookies. Verify stable `204` response with cookie clearing where appropriate, no token/session details, and no access token issuance.

**Acceptance Scenarios**:

1. **Given** no refresh cookie exists, **When** logout is called, **Then** the response is `204` and the client is left in logged-out state.
2. **Given** an invalid or non-active refresh cookie, **When** logout is called, **Then** the response does not reveal whether the session existed and no access token is minted.
3. **Given** logout is repeated after a successful logout, **When** it is called again, **Then** it remains safe and idempotent.

### User Story 4 - Preserve Security Boundaries and Failure Safety (Priority: P1)

As a security reviewer, I can verify logout does not claim success when durable revocation fails and does not leak sensitive token or database details.

**Why this priority**: A false successful logout can leave a refresh session active while the user believes they are signed out.

**Independent Test**: Simulate database persistence failure during active-session revocation and verify logout returns a safe error, does not report `204`, does not clear the cookie as a successful logout, and does not leak raw Prisma/DB/token details.

**Acceptance Scenarios**:

1. **Given** PostgreSQL revocation fails for an active session, **When** logout is called, **Then** the server returns a safe failure and does not claim successful logout.
2. **Given** any logout path errors, **When** responses and logs are inspected, **Then** raw refresh tokens, verifiers, cookie headers, access tokens, secrets, raw Prisma errors, DB credentials, and stack traces are absent.
3. **Given** logout is implemented, **When** source and behavior are reviewed, **Then** PostgreSQL remains the durable revocation authority and Redis is not introduced for durable session state.

### User Story 5 - Handle Refresh/Logout Races Safely (Priority: P1)

As the system, I can handle logout and refresh attempts around the same refresh token without leaving unintended active refresh sessions.

**Why this priority**: Auth endpoints are naturally concurrent; logout must not weaken FEAT-005 refresh rotation guarantees.

**Independent Test**: Use PostgreSQL-backed concurrent tests for logout versus refresh on the same token and verify deterministic safe state: at most one continuity-preserving transition can succeed, no duplicate active descendants are left, and revoked sessions cannot refresh.

**Acceptance Scenarios**:

1. **Given** logout completes first, **When** refresh uses the old token, **Then** refresh is rejected.
2. **Given** refresh completes first and returns a newest cookie, **When** logout uses that newest cookie, **Then** the newest session is revoked.
3. **Given** logout and refresh race on the same token, **When** both complete, **Then** the database does not contain multiple unintended active sessions and no revoked session can mint a new access token.

## Requirements

### Functional Requirements

- **FR-001**: FEAT-006 MUST expose canonical `POST /auth/logout`.
- **FR-002**: FEAT-006 MUST expose tested alias `POST /api/auth/logout` to match the established API-prefix alias convention.
- **FR-003**: Logout MUST derive request authority from the refresh cookie and PostgreSQL session lookup.
- **FR-004**: Logout MUST NOT trust client-provided user ID, session ID, family ID, role, admin, revocation reason, or access-token identity to select a refresh session.
- **FR-005**: Logout MUST be current-session-only.
- **FR-006**: Logout MUST NOT expose logout-all, revoke-all-devices, session management UI, or `revokeAllForUser` behavior publicly.
- **FR-007**: Valid current-session logout MUST durably revoke the current active refresh session in PostgreSQL.
- **FR-008**: Normal logout revocation MUST use reason `USER_LOGOUT` or approved equivalent and MUST NOT use `REPLAY_DETECTED`.
- **FR-009**: Logout MUST clear the refresh cookie with attributes compatible with FEAT-005 cookie set behavior.
- **FR-010**: Logout MUST reuse centralized FEAT-005 refresh cookie configuration or extend it with a centralized clear-cookie helper.
- **FR-011**: After successful logout, the old refresh token/session MUST be unable to refresh or mint a new access token.
- **FR-012**: Logout MUST return `204 No Content` for successful current-session logout.
- **FR-013**: Logout MUST be idempotent and return the same externally safe success contract for missing cookie and safely evaluated malformed, unknown, expired, revoked, or consumed refresh cookies.
- **FR-014**: Logout responses MUST NOT reveal whether a valid session previously existed.
- **FR-015**: Logout MUST NOT mint, return, or rotate access tokens or refresh tokens.
- **FR-016**: If PostgreSQL revocation/evaluation fails for a candidate active session, logout MUST NOT return success or clear the cookie as a false successful logout.
- **FR-017**: Database failure responses MUST use stable safe error handling and MUST NOT expose raw database/Prisma details.
- **FR-018**: PostgreSQL MUST remain authoritative for refresh-session revocation; Redis MUST NOT be introduced as durable logout/session authority.
- **FR-019**: Controllers MUST NOT import Prisma directly or own transaction internals.
- **FR-020**: Logout MUST preserve FEAT-004 stateless access-token semantics: already-issued access tokens remain valid until expiry unless a future Human-approved feature adds access-token revocation.
- **FR-021**: FEAT-006 MUST NOT implement access-token blacklist, `jti` blacklist, Redis token revocation, or access-token database lookup.
- **FR-022**: Logout/refresh concurrency MUST be safe and must not leave multiple unintended active refresh sessions.
- **FR-023**: Logout MUST preserve FEAT-005 replay semantics and MUST NOT treat ordinary logout as replay detection.
- **FR-024**: Responses/logs MUST NOT expose raw refresh tokens, refresh verifiers/hashes, full Cookie headers, access tokens, auth secrets, raw Prisma errors, DB credentials, or stack traces.
- **FR-025**: FEAT-006 MUST NOT implement RBAC, admin guard, auth audit event emission, email verification, account lockout, rate limiting, FEAT-007, or later behavior.
- **FR-026**: FEAT-006 MUST include unit, API integration, PostgreSQL-backed, concurrency, runtime smoke, and regression tests.
- **FR-027**: Required DB tests MUST run against isolated PostgreSQL test database and must not silently skip.
- **FR-028**: FEAT-006 MUST preserve FEAT-001 through FEAT-005 regression validation categories.
- **FR-029**: Implementation report MUST truthfully map files, tasks, tests, validation evidence, limitations, security notes, and acceptance criteria.

### Key Entities

- **LogoutRequest**: Request to terminate the current refresh session, authorized only by refresh cookie state.
- **RefreshCookie**: FEAT-005 HttpOnly cookie containing the raw opaque refresh token.
- **RefreshTokenVerifier**: FEAT-005 HMAC verifier derived from raw refresh token and refresh secret.
- **RefreshSession**: PostgreSQL row representing refresh continuity and revocation state.
- **CurrentSessionLogoutResult**: Internal service result for active revoked, already logged out, invalid/no session, or persistence failure.
- **CookieClearInstruction**: Centralized response instruction that clears the refresh cookie using compatible identity attributes.

## API Contract

### Request

```text
POST /auth/logout
POST /api/auth/logout
Cookie: <refresh-cookie>
```

Empty body is expected. If a body is supplied, identity/authority fields must not affect logout target.

Access token is not required. If supplied, it must not be used as authority to select the refresh session.

### Success / Idempotent Success

```text
204 No Content
Set-Cookie: <expired refresh cookie using matching identity attributes>
```

No JSON body.

### Persistence Failure

Recommended safe error:

```json
{
  "error": {
    "code": "LOGOUT_FAILED",
    "message": "Logout could not be completed",
    "requestId": "..."
  }
}
```

The exact HTTP status may follow existing server-error conventions, but it must not be `204` and must not expose sensitive internals.

## Cookie Clear Decision

Selected:

```text
Use the same refresh cookie name, Path=/, Domain policy, SameSite, Secure, and HttpOnly attributes as FEAT-005.
Expire immediately with Max-Age=0 and/or Expires in the past.
```

Rationale:

- Prevents duplicate retained cookies from mismatched path/domain identity.
- Supports both `/auth/logout` and `/api/auth/logout`.
- Keeps cookie behavior centralized for future logout/session features.

## Access Token Decision

Selected:

```text
Logout does not revoke existing stateless access tokens.
```

Rationale:

- ADR-004 selected short-lived access tokens.
- FEAT-004 intentionally omitted access-token `jti` and revocation state.
- Adding blacklist/Redis/DB checks would be new architecture and is out of FEAT-006.

Implication:

- After logout, the refresh token cannot mint new access tokens.
- A previously issued access token may continue to authorize protected endpoints until it expires.
- This must be documented in tests and implementation report.

## Redis Boundary

Redis is intentionally out of FEAT-006 durable logout authority. Rate limiting remains an unresolved Phase 2 governance decision and must not be silently added.

## Success Criteria

- **SC-001**: 100% of valid current-session logout tests revoke the PostgreSQL refresh session and clear the cookie.
- **SC-002**: 100% of refresh-after-logout attempts using the old cookie fail and mint no access token.
- **SC-003**: 100% of tested missing/invalid/repeated logout cases return the approved idempotent safe contract without session enumeration.
- **SC-004**: 100% of tested client-supplied identity/role/admin fields fail to influence logout target.
- **SC-005**: 100% of simulated DB persistence failures avoid false successful logout.
- **SC-006**: Concurrent logout/refresh tests leave no multiple unintended active sessions.
- **SC-007**: Logs and responses in tested logout paths expose no raw tokens, verifiers, cookie headers, secrets, raw DB/Prisma errors, or stack traces.
- **SC-008**: FEAT-001 through FEAT-005 regressions remain green.
