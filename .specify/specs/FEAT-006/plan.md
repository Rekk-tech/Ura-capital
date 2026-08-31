# Implementation Plan: FEAT-006 Logout & Session Invalidation

**Feature ID**: FEAT-006  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-26  
**Scope**: Planning only. No application code implementation.

## 1. Objective

Define and implement current-session logout for Aura Capital. Logout must revoke the cookie-derived refresh session in PostgreSQL, clear the refresh cookie with FEAT-005-compatible attributes, behave idempotently for already-logged-out states, and avoid false success when durable revocation fails.

## 2. Dependencies

- FEAT-002: identity/auth persistence and repository boundary.
- FEAT-003: registered users and credentials for test setup.
- FEAT-004: login and stateless short-lived access-token semantics.
- FEAT-005: refresh cookie helper, refresh-token verifier, refresh-session repository/service primitives, rotation/replay/concurrency behavior.
- ADR-003: PostgreSQL + Prisma behind repositories.
- ADR-004: access token plus rotated/revocable HttpOnly refresh token strategy.
- ADR-005: Redis transient only.

## 3. Architecture Decisions

### Decision 1 - Refresh Cookie Authority Only

Logout uses the refresh cookie and PostgreSQL session state as authority. Access tokens and request bodies do not select the session.

**Rationale**: The refresh cookie represents the session continuity credential. Access tokens are stateless and may not identify the current refresh session. Client body identity is untrusted.

**Rejected**: access-token-only logout, body-provided session/user IDs, and mandatory access-token-plus-refresh-cookie logout.

### Decision 2 - Current Session Only

FEAT-006 logs out only the current refresh session identified by the cookie.

**Rationale**: This is the smallest independently testable logout boundary after FEAT-005.

**Rejected**: logout all devices and public `revokeAllForUser`.

### Decision 3 - Session Revocation, Not Family Replay

Valid current-session logout revokes the active session with `USER_LOGOUT` or equivalent. It does not revoke the whole family and does not mark `REPLAY_DETECTED`.

**Rationale**: Ordinary logout is a user action, not replay evidence.

### Decision 4 - Idempotent Public Contract

Logout returns `204 No Content` for successful and safe already-logged-out cases.

**Exception**: Database persistence failure for a candidate active session must not return `204`.

### Decision 5 - No Access Token Revocation

Existing FEAT-004 access tokens remain stateless and valid until expiry after logout.

**Rationale**: Blacklists or `jti` revocation would be new architecture and is out of FEAT-006.

## 4. API Contract Plan

Canonical:

```text
POST /auth/logout
```

Alias:

```text
POST /api/auth/logout
```

Success/idempotent response:

```text
204 No Content
Set-Cookie: expired refresh cookie
```

Failure response for database persistence failure:

```json
{
  "error": {
    "code": "LOGOUT_FAILED",
    "message": "Logout could not be completed",
    "requestId": "..."
  }
}
```

## 5. Service Flow

### Missing Cookie

1. No refresh cookie present.
2. Build clear-cookie response for defensive cleanup.
3. Return `204`.

### Malformed Token

1. Token shape is invalid.
2. Do not attempt to trust or decode client identity.
3. Build clear-cookie response.
4. Return `204`.

### Unknown / Expired / Already Revoked / Consumed Token

1. Compute verifier if token shape permits.
2. Look up session through repository.
3. If lookup/evaluation succeeds and no active session can be revoked, build clear-cookie response.
4. Return `204` without revealing state.

### Valid Active Token

1. Compute FEAT-005 verifier.
2. Start PostgreSQL transaction or conditional update.
3. Revoke current active session with reason `USER_LOGOUT`.
4. Commit.
5. Clear cookie.
6. Return `204`.

### Database Failure

1. If persistence/evaluation fails before logout can be durably completed or safely classified, do not return `204`.
2. Do not send a success clear-cookie response if doing so would imply server-side logout while session may remain active.
3. Return stable safe server error through existing error handler.

## 6. Repository Boundary Plan

FEAT-006 should reuse or extend existing FEAT-005 repository/service APIs behind the auth module:

- find session by token verifier
- revoke current session with conditional active-state guard
- report active revoked, already inactive, not found, or persistence failure

Controllers must remain thin and must not import Prisma directly.

## 7. Cookie Plan

Reuse FEAT-005 cookie configuration:

```text
name: AUTH_REFRESH_COOKIE_NAME default aura_refresh_token
httpOnly: true
secure: validated environment policy
sameSite: validated policy
path: /
domain: omitted unless configured equivalently
```

If current helper only sets cookies, extend the helper with a clear-cookie builder. The builder must be covered by unit tests and used by both `/auth/logout` and `/api/auth/logout`.

## 8. Concurrency Plan

Required PostgreSQL-backed cases:

- logout then refresh with old token: refresh fails
- refresh then logout with newest cookie: newest session revoked
- same-token logout/refresh race: at most one continuity-producing transition succeeds

Implementation should rely on FEAT-005 conditional state transitions. If logout wins the race, refresh fails. If refresh wins first, logout with the old token should safely clear and return idempotent success, while logout with the newest cookie revokes the newest session. Tests must document the exact race behavior observed.

## 9. Security and Logging Plan

Use existing structured logging and sanitizer. Do not log raw refresh token, token verifier/hash, full Cookie header, access token, auth secrets, raw Prisma/DB errors, or stack traces.

Do not emit FEAT-009 audit events.

Safe logs may include requestId, route, method, category `AUTH_LOGOUT`, and result category such as `REVOKED`, `NO_ACTIVE_SESSION`, or `DB_FAILURE`.

## 10. Test Plan

Unit:

- logout service valid active revocation
- missing cookie idempotency
- malformed/unknown/revoked/expired/consumed cookie idempotency
- database failure mapping
- clear-cookie builder attributes
- no access-token revocation behavior

Integration:

- `POST /auth/logout`
- `POST /api/auth/logout`
- cookie clearing header
- client-body authority ignored/rejected
- missing/invalid cookie behavior
- safe response shape
- DB failure safe error

PostgreSQL:

- session revoked durably
- old refresh token unusable
- unrelated sessions remain active
- no logout-all behavior
- transaction/conditional-update consistency
- concurrent logout/refresh behavior

Runtime:

- login
- refresh
- logout
- refresh after logout fails
- browser-equivalent cookie clear behavior
- existing access token remains FEAT-004-compatible until expiry

Regression:

- FEAT-004 login/access token
- FEAT-005 refresh/rotation/replay
- FEAT-005 logging sanitization
- FEAT-001 through FEAT-003 validation categories

## 11. Validation Commands

Implementation must run and report:

- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:db`
- Fresh isolated PostgreSQL migration deploy and replay if migrations change.
- Runtime smoke covering login, refresh, logout, refresh-after-logout, and cookie clearing.

If a required database service is unavailable, implementation must report `NOT VERIFIED` with the exact blocker.

## 12. Rate Limiting Governance

Do not implement rate limiting in FEAT-006.

Current governance still records authentication endpoint rate limiting as required during Phase 2, but not assigned to FEAT-006. FEAT-010 must remain an integration gate and should not introduce new implementation behavior.

Recommendation: Human should approve a dedicated Phase 2 implementation feature for authentication endpoint rate limiting and progressive protection before FEAT-010, or explicitly assign it to another future Phase 2 feature.

## 13. Implementation Report Expectations

Antigravity must report files changed, route contract, cookie-clear attributes, logout service/repository behavior, DB state transitions, idempotency behavior, access-token-after-logout semantics, concurrency behavior, security/logging evidence, validation command results, acceptance criteria mapping, and known limitations.

## 14. Risks

- Cookie clear attributes can mismatch set-cookie attributes and leave stale browser cookies.
- False successful logout can occur if cookie is cleared before durable revocation succeeds.
- Treating logout as replay can incorrectly revoke a token family.
- Access-token expectations can be misunderstood; stateless access tokens are not revoked by logout in FEAT-006.
- Logout-all behavior can accidentally appear if existing internal `revokeAllForUser` primitives are exposed.
