# Requirement: FEAT-006 Logout & Session Invalidation

**Feature ID**: FEAT-006  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-26  
**Phase**: Phase 2 - Identity & Security  
**Scope**: Planning only. No application code implementation.

## 1. Governance Context

FEAT-001 through FEAT-005 are Human Final Gate approved. FEAT-006 is the next active Phase 2 feature and depends on FEAT-005.

FEAT-005 is authoritative for refresh cookie contract, refresh-token verifier design, refresh-session persistence, token-family model, rotation semantics, replay semantics, internal revocation primitives, and PostgreSQL session authority.

FEAT-006 must define user-facing logout/session invalidation without expanding into RBAC, admin authorization, audit events, rate limiting, logout-all, or session/device management.

## 2. Problem Statement

Aura Capital now supports login, short-lived access tokens, refresh-token rotation, replay detection, and PostgreSQL-backed refresh sessions. Users need a safe logout operation that terminates the current refresh session and clears the browser refresh cookie.

After logout:

- the current refresh session must be invalidated server-side
- the refresh cookie must be cleared with compatible cookie attributes
- the previous refresh token must not be usable
- no new access token may be minted from the invalidated refresh session

## 3. In Scope

- Canonical logout endpoint: `POST /auth/logout`.
- Existing API-prefix alias: `POST /api/auth/logout`.
- Logout authority derived from the refresh cookie and PostgreSQL session state.
- Current-session-only logout.
- Reuse of FEAT-005 refresh-token verifier and revocation primitives.
- Durable PostgreSQL revocation of the current active refresh session.
- Distinct revocation reason: `USER_LOGOUT` or approved equivalent.
- Exact refresh-cookie clearing using FEAT-005 cookie identity attributes.
- Idempotent logout response for missing, malformed, unknown, expired, already revoked, or consumed refresh cookies when database state can be safely evaluated or no server-side revocation is required.
- Safe handling of database persistence failures.
- Tests for service, cookie clearing, API routes, PostgreSQL persistence, concurrency, and regression.
- Documentation of stateless access-token behavior after logout.

## 4. Out of Scope

- Logout all devices.
- Public revoke-all-sessions endpoint.
- Session/device management UI.
- Access-token blacklist.
- Access-token `jti` blacklist.
- Redis access-token revocation.
- Redis durable logout authority.
- Refresh-token rotation behavior changes.
- Replay architecture redesign.
- Login behavior changes except regression coverage.
- RBAC enforcement.
- Admin guard.
- Auth audit event emission.
- Email verification.
- Account lockout.
- Rate limiting implementation.
- FEAT-007 or later behavior.

## 5. Logout Contract

Canonical endpoint:

```text
POST /auth/logout
```

Alias endpoint:

```text
POST /api/auth/logout
```

Both endpoints must execute the same logout behavior. FEAT-005 uses refresh cookie `Path=/`, so both routes can receive and clear the same cookie.

Request authority:

- Logout derives session identity from the refresh cookie only.
- A valid access token is not required.
- Access token identity must not be used to choose or revoke an arbitrary refresh session.
- Client-supplied `userId`, `sessionId`, `familyId`, role, admin, or revocation fields must be ignored or rejected as non-authoritative and must not affect which session is revoked.

Selected response contract:

```text
204 No Content
```

Successful/idempotent responses must not include a JSON body, token, session ID, family ID, credential details, or user-sensitive data.

## 6. Session Invalidation Model

Selected scope:

```text
LOGOUT CURRENT SESSION ONLY
```

Normal logout must revoke only the current active refresh session identified by the refresh cookie verifier.

Normal logout must not:

- revoke all user sessions
- revoke the entire token family
- mark logout as `REPLAY_DETECTED`
- expose `revokeAllForUser` publicly

The revocation reason must be `USER_LOGOUT` or an approved equivalent distinct from FEAT-005 replay reasons.

If the presented refresh cookie maps to an already consumed, expired, unknown, or already revoked session, logout should still produce a safe logged-out client state when database evaluation succeeds. It must not mint an access token or reveal the session state.

## 7. Cookie Clear Contract

Logout must reuse the centralized FEAT-005 refresh cookie configuration.

The clear operation must use the same cookie identity attributes as FEAT-005:

- cookie name from `AUTH_REFRESH_COOKIE_NAME`, default `aura_refresh_token`
- `HttpOnly: true`
- `Secure` environment policy
- `SameSite` policy
- `Path=/`
- same `Domain` omission/presence semantics as the set-cookie helper

The clear-cookie response must expire the refresh cookie using an immediately expired date and/or zero max age according to Express/browser-compatible behavior.

The clear helper should be centralized if the existing helper does not already expose a clear-cookie builder.

## 8. Idempotency Decision

Logout is idempotent from the client perspective.

Expected behavior:

- First logout with a valid active refresh cookie revokes the current session, clears the cookie, and returns `204`.
- Repeated logout with no cookie clears/keeps the client in logged-out state and returns `204`.
- Logout with malformed, unknown, expired, already revoked, or consumed cookie returns `204` and clears the cookie when database state can be safely evaluated or no database state is needed.
- Response must not reveal whether a valid session previously existed.

Database persistence failure is the exception to idempotent success. If the server cannot durably revoke or safely evaluate an existing candidate refresh session due to database failure, it must return a safe server error and must not report successful server-side logout.

## 9. Access Token Semantics After Logout

FEAT-004 access tokens are stateless short-lived JWTs.

FEAT-006 must not add access-token blacklist, `jti` blacklist, Redis token revocation, or access-token database lookup.

Logout invalidates refresh continuity, not already-issued access tokens. A previously issued access token may remain valid until its normal expiry unless a later Human-approved feature introduces server-side access-token revocation.

This behavior must be documented and tested so QA does not treat it as a FEAT-006 defect.

## 10. PostgreSQL Authority

PostgreSQL remains authoritative for refresh-session revocation.

Redis must not be introduced as durable logout or revocation authority. If Redis appears in future related features, it may only be transient and must not replace PostgreSQL state.

Controllers must not import Prisma directly. Logout orchestration belongs in auth service/repository boundaries established by FEAT-002 through FEAT-005.

## 11. Transaction and Failure Semantics

For a valid active refresh session:

1. Read refresh token from cookie.
2. Compute verifier using FEAT-005 refresh-token verifier primitive.
3. Locate and validate the refresh session through repository/service boundaries.
4. Durably revoke the current active session in PostgreSQL with reason `USER_LOGOUT`.
5. Commit the revocation.
6. Clear the refresh cookie with matching attributes.
7. Return `204`.

The implementation must avoid false success:

- Do not return `204` for a valid active session if PostgreSQL revocation fails.
- Do not clear the cookie as a successful logout when durable revocation failure leaves the refresh session usable.
- Return a stable safe error envelope/status for database persistence failure.
- Never expose raw database/Prisma details.

## 12. Replay and Concurrency Interaction

FEAT-006 must preserve FEAT-005 replay and concurrency semantics.

Required cases:

- Logout then refresh with the old token: refresh must fail and mint no access token.
- Refresh completes then logout using the newest cookie: newest session is revoked.
- Logout and refresh race using the same refresh token: at most one state transition may produce usable continuity, and the system must not leave multiple unintended active sessions.

Normal logout must not be treated as replay detection. A logout/refresh race must be handled through PostgreSQL conditional updates/transactions consistent with FEAT-005.

## 13. Safe Error and Logging

Responses and logs must never expose raw refresh token, refresh verifier/hash, full Cookie header, access token, auth secrets, raw Prisma errors, DB credentials, or stack traces.

Logs may include safe metadata:

- requestId
- route
- method
- safe event/reason category
- session revocation result category

FEAT-006 must not emit FEAT-009 auth audit events.

## 14. Dependencies

- FEAT-002: identity persistence, auth config, repository boundary, test DB guard.
- FEAT-003: registered users and password credentials.
- FEAT-004: login and stateless short-lived access-token behavior.
- FEAT-005: refresh cookies, verifier, refresh-session persistence, rotation, replay, revocation primitives.
- ADR-003: PostgreSQL and Prisma behind repositories.
- ADR-004: access/refresh token strategy.
- ADR-005: Redis responsibility boundary.

## 15. Success Definition

FEAT-006 is successful when current-session logout works through both approved routes, refresh cookie is cleared correctly, current refresh session is durably revoked in PostgreSQL, refresh after logout fails, logout is safely idempotent without session enumeration, DB failure does not produce false successful logout, access-token-after-logout semantics are documented and tested, and no logout-all/RBAC/admin/audit/rate-limit scope creep is introduced.

## 16. Handoff Rule

Implementation must not begin until Human marks this spec package as APPROVED and separately hands FEAT-006 to Antigravity.
