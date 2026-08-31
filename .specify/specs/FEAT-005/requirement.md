# Requirement: FEAT-005 Refresh Token Rotation & Revocation

**Feature ID**: FEAT-005  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-25  
**Phase**: Phase 2 - Identity & Security  
**Input**: Human approved FEAT-004 and requested planning-only spec package for FEAT-005.

## 1. Governance Context

FEAT-001, FEAT-002, FEAT-003, and FEAT-004 are Human Final Gate approved. FEAT-005 is the next active Phase 2 feature.

FEAT-005 implements refresh-token session continuity on top of:

- FEAT-002 identity/auth configuration and `RefreshSession` persistence foundation.
- FEAT-003 password credential registration.
- FEAT-004 login, access-token issuance, and access-token verification service.
- ADR-004 authentication/token strategy.
- ADR-005 Redis responsibility boundary.

FEAT-005 must remain separate from public logout behavior, which belongs to FEAT-006.

## 2. Problem Statement

FEAT-004 login issues short-lived access tokens only. Users need session continuity without extending access-token lifetime. Aura Capital needs refresh tokens that are:

- Delivered only in HttpOnly cookies.
- Stored server-side only as irreversible verifiers.
- Backed by PostgreSQL durable session state.
- Rotated on every successful refresh.
- Revocable.
- Replay/reuse aware.
- Safe under concurrent refresh attempts.

## 3. In Scope

- Extend successful login to create a refresh session and set a refresh-token cookie.
- Define and implement the canonical refresh endpoint: `POST /auth/refresh`.
- Preserve existing API prefix alias convention if used, with tests.
- Generate cryptographically secure opaque refresh tokens.
- Store only a hash or irreversible verifier of the refresh token in PostgreSQL.
- Reuse the FEAT-002 `RefreshSession` foundation with documented schema migration if required.
- Rotate refresh tokens on every successful refresh.
- Revoke or consume the previous refresh session/token during rotation.
- Detect refresh-token replay/reuse.
- Define family-level invalidation on replay/reuse.
- Provide internal refresh-session revocation primitives needed for FEAT-005 behavior and tests.
- Reuse FEAT-004 access-token service to mint new access tokens during refresh.
- Validate and use existing refresh-token TTL and cookie config.
- Add unit, API integration, PostgreSQL-backed, cookie, replay, and concurrency tests.
- Update implementation report with validation evidence and acceptance mapping.

## 4. Out of Scope

- Public logout endpoint or logout response contract.
- Refresh cookie clearing for logout, except documenting exact attributes FEAT-006 must reuse.
- RBAC enforcement.
- Admin guard.
- Auth audit event emission.
- Email verification.
- Account lockout.
- Authentication endpoint rate limiting, unless Human separately approves scope.
- Product-domain persistence beyond identity/auth session state.
- FEAT-006 or later behavior.

## 5. Current RefreshSession Gap Analysis

Current FEAT-002 model includes:

- `id`
- `userId`
- unique `tokenHash`
- `isRevoked`
- `revokedAt`
- `expiresAt`
- `userAgent`
- `ipAddress`
- `createdAt`
- `updatedAt`

This is sufficient for a single active hashed refresh-token record, basic expiry, and revocation.

It is not sufficient for robust rotation/replay analysis because it lacks:

- Token family identifier.
- Replacement linkage from old session/token to new session/token.
- Consumed/rotated timestamp separate from revocation timestamp.
- Reuse/replay detection timestamp or reason.
- Optional revocation reason.

FEAT-005 must specify and implement a migration if these fields are needed for safe rotation and family invalidation. The approved design requires adding these fields rather than overloading `isRevoked` ambiguously.

## 6. Required Refresh Session Model Direction

PostgreSQL remains authoritative. The model must support:

- Durable session ID.
- User ID foreign key.
- Unique stored token verifier.
- Token family ID shared across rotations.
- Expiration timestamp.
- Revocation timestamp/status.
- Rotation/consumption timestamp.
- Replacement linkage to the next refresh session when available.
- Replay detection metadata sufficient for FEAT-005 tests and future FEAT-009 audit representation.
- User agent and IP metadata as optional context.
- Timestamps.

## 7. Token Storage Requirement

Raw refresh tokens must never be stored in PostgreSQL, returned in JSON, or logged.

Selected server-side representation:

- Generate an opaque refresh token using cryptographically secure random bytes.
- Store only an irreversible HMAC-SHA-256 verifier derived from the raw refresh token and `AUTH_REFRESH_TOKEN_SECRET`.
- Do not reuse the access-token secret.
- Do not store the raw token, token prefix, or token plaintext.
- Do not expose the token hash/verifier outside repository/service internals.

The raw token is delivered to the browser only through the refresh cookie.

## 8. Cookie Requirement

Refresh token must be set in a cookie with:

- Name: `AUTH_REFRESH_COOKIE_NAME`, default `aura_refresh_token`.
- `HttpOnly: true`.
- `Secure`: from validated `AUTH_REFRESH_COOKIE_SECURE`; must be true in production.
- `SameSite`: from validated `AUTH_REFRESH_COOKIE_SAME_SITE`, default `lax`.
- `Path`: `/auth/refresh` unless implementation requires a broader documented path. FEAT-006 must be able to clear the cookie with identical attributes.
- `Max-Age` and/or `Expires`: derived from server-side refresh-token TTL.
- `Domain`: omitted unless a specific deployment need is documented and approved.

The refresh token must not appear in JSON response bodies.

## 9. Login Integration Requirement

FEAT-005 may extend successful FEAT-004 login to establish refresh continuity:

- Existing login credential validation and access-token semantics must remain unchanged.
- Successful login should return the existing safe JSON response with access token.
- Successful login should additionally set the refresh-token cookie.
- Refresh-session creation must be transactionally safe enough that a failed refresh-session creation does not falsely report a complete session-continuity login.
- If refresh-session creation fails after credential verification, the login request must fail safely or roll back any FEAT-005 session mutation.

FEAT-005 must not alter FEAT-004 access-token claim contract, algorithm, issuer, audience, TTL, or verification behavior.

## 10. Refresh Endpoint Requirement

Canonical endpoint:

```text
POST /auth/refresh
```

Allowed alias:

```text
POST /api/auth/refresh
```

only if the implementation preserves the established API-prefix alias convention and tests both routes.

Request identity must come from the refresh cookie and PostgreSQL session lookup. The endpoint must not trust:

- User ID from request body.
- Refresh session ID supplied by client.
- Role/admin state supplied by client.
- Access-token identity as authoritative refresh identity.

Successful refresh returns:

- A new FEAT-004 access token in JSON.
- Safe user context if consistent with FEAT-004 response patterns.
- A newly rotated refresh-token cookie.

## 11. Rotation Requirement

Every successful refresh must rotate:

```text
old refresh token
-> consumed/invalidated
-> new refresh token
-> new session state persisted
-> new cookie returned
-> new short-lived FEAT-004 access token returned
```

The previous refresh token must not remain usable.

The rotation transaction must ensure the same refresh token cannot be successfully consumed twice, including concurrent requests.

## 12. Replay / Reuse Requirement

If a previously consumed, revoked, expired, unknown, or otherwise invalid refresh token is presented:

- Refresh is denied.
- A stable safe `UNAUTHENTICATED` error is returned.
- No access token is minted.
- No raw token/hash/database details are exposed.
- If the token maps to a known consumed/revoked session, the entire token family must be revoked to contain replay risk.
- The event must be representable for future FEAT-009 audit emission, but FEAT-005 must not emit audit events.

Selected policy: token-family invalidation is required on reuse of a known consumed/revoked refresh token.

## 13. Revocation Requirement

FEAT-005 may implement internal service/repository revocation primitives:

- Revoke one refresh session.
- Revoke a token family.
- Mark a token as consumed/rotated.
- Reject revoked sessions.

FEAT-005 must not expose a public logout endpoint. FEAT-006 owns user-triggered logout and cookie clearing.

## 14. Expiration Requirement

Refresh-session lifetime uses `AUTH_REFRESH_TOKEN_TTL_DAYS`, already validated by FEAT-002 in the approved 1-30 day range with default 7 days.

Rules:

- Server controls expiration.
- Client cannot set or extend expiration.
- Expired sessions are rejected.
- Refresh rotation must not revive expired families.
- New rotated refresh token gets a server-derived expiration according to config.

## 15. Redis Boundary

Redis is not required for FEAT-005.

Selected design:

- PostgreSQL remains the only authoritative store for refresh-session durability, rotation, revocation, replay detection, and tests.
- Redis is kept out of FEAT-005 to avoid adding distributed coordination before necessary.
- Future rate limiting or replay cache may use Redis only with Human-approved scope and PostgreSQL still authoritative.

## 16. Rate Limiting Governance

Authentication endpoint rate limiting remains required during Phase 2, but it is not silently added to FEAT-005.

Governance recommendation:

- Human should approve a dedicated Phase 2 feature before FEAT-010, tentatively `FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection`, or explicitly assign rate limiting to another Phase 2 implementation feature.
- FEAT-010 must remain a security integration gate and must not become a feature that introduces new behavior.

## 17. Assumptions

- FEAT-005 uses existing Express/Zod/Prisma repository conventions.
- FEAT-005 can add minimal Node standard-library crypto usage for random token generation and HMAC hashing.
- If a third-party token/cookie helper is introduced, dependency rationale must be documented.
- Browser-facing frontend refresh orchestration is not required unless needed for API contract tests.
- Future FEAT-009 audit events should be able to observe FEAT-005 state transitions through persisted metadata, but event emission remains out of scope.

