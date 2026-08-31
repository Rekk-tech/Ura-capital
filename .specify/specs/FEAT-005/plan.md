# Implementation Plan: FEAT-005 Refresh Token Rotation & Revocation

**Feature ID**: FEAT-005  
**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-25  
**Scope**: Planning only. No application code implementation.

## 1. Objective

Implement secure session continuity with rotated, revocable refresh tokens while preserving FEAT-004 access-token behavior. PostgreSQL is authoritative for refresh-session durability and replay state. Raw refresh tokens are delivered only through HttpOnly cookies and are never stored or returned in JSON.

## 2. Dependencies

- FEAT-002: User, RefreshSession, auth config, repository boundary, test DB guard.
- FEAT-003: Registered users and Argon2id credentials.
- FEAT-004: Login service, access-token service, authenticated context, safe auth errors.
- ADR-003: PostgreSQL + Prisma behind repositories.
- ADR-004: short-lived access tokens plus rotated/revocable HttpOnly refresh tokens.
- ADR-005: Redis transient only; PostgreSQL durable authority.

## 3. Architecture Decisions

### Decision 1 - Opaque Refresh Token

Use opaque random refresh tokens rather than refresh JWTs.

Rationale:

- Reduces claim validation surface.
- Keeps identity/session state server-side.
- Supports revocation and replay detection through PostgreSQL.

Rejected:

- Refresh JWT without durable lookup: rejected by ADR-004.
- Browser-readable token: rejected by XSS exposure risk.

### Decision 2 - HMAC Verifier Storage

Store only `HMAC-SHA-256(rawRefreshToken, AUTH_REFRESH_TOKEN_SECRET)` or equivalent irreversible verifier.

Rationale:

- Raw token never persists.
- Refresh verifier uses dedicated refresh secret.
- Node crypto is sufficient; no major dependency needed.

Rejected:

- Raw token persistence.
- Access-token secret reuse.
- Unsafely reversible encryption for database verifier.

### Decision 3 - Token Family Invalidation on Replay

Known replay/reuse of a consumed or revoked refresh token revokes the entire token family.

Rationale:

- A reused old refresh token suggests token theft or race/replay.
- Family invalidation contains risk and prepares FEAT-009 audit semantics.

Rejected:

- Reject old token only while leaving latest child active: weaker theft response.

### Decision 4 - PostgreSQL-Only Authority

Do not introduce Redis in FEAT-005.

Rationale:

- PostgreSQL can enforce durable rotation and replay state.
- Redis would add distributed-state semantics before rate limiting or scale requires it.

Rejected:

- Redis as authoritative session store: rejected by ADR-005.

## 4. Refresh Session Model Plan

FEAT-005 should add migration fields to the existing `RefreshSession` model:

```text
familyId
replacedBySessionId
rotatedAt or consumedAt
revocationReason
reusedAt
```

Existing fields retained:

```text
id
userId
tokenHash
isRevoked
revokedAt
expiresAt
userAgent
ipAddress
createdAt
updatedAt
```

Migration implications:

- Existing greenfield data can default `familyId` to `id` or a generated value during migration.
- No production data migration is expected yet, but migration must be reproducible.
- Backward/forward behavior must be documented in implementation report.
- Prisma Client must be regenerated.

## 5. API Contract Plan

### Login Extension

Existing:

```text
POST /auth/login
```

FEAT-005 adds:

- Refresh session creation after successful credential verification.
- `Set-Cookie` header containing raw refresh token.
- Existing access-token JSON response preserved.
- No raw refresh token in JSON.

### Refresh Endpoint

Canonical:

```text
POST /auth/refresh
```

Optional alias:

```text
POST /api/auth/refresh
```

Request:

- Refresh cookie only.
- Empty body allowed.
- Body user/session/role/admin values ignored or rejected.

Success response:

```json
{
  "accessToken": "<short-lived FEAT-004 access token>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "displayName": "User",
    "status": "ACTIVE",
    "createdAt": "..."
  }
}
```

Response also sets a rotated refresh cookie.

Failure response:

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Invalid or expired refresh session",
    "requestId": "..."
  }
}
```

## 6. Cookie Plan

Implementation must use one central cookie helper/config mapper so FEAT-006 can clear the cookie exactly.

Required attributes:

- `httpOnly: true`
- `secure: config.refreshCookie.secure`
- `sameSite: config.refreshCookie.sameSite`
- `path: "/auth/refresh"` unless alias support requires documented broader path
- `maxAge` from `AUTH_REFRESH_TOKEN_TTL_DAYS`
- `expires` consistent with `maxAge` if used
- no `domain` by default

Production must fail startup if secure cookie config is false, as already required by FEAT-002.

## 7. Transaction Strategy

Login:

- Existing credential verification remains outside DB mutation.
- Refresh session creation happens after valid credentials.
- If refresh session persistence fails, do not return a refresh cookie or claim full login/session success.

Refresh rotation:

1. Read refresh token from cookie.
2. Validate token shape bounds.
3. Compute verifier using refresh secret.
4. Start PostgreSQL transaction.
5. Find session by verifier.
6. Reject if missing, expired, revoked, consumed, replaced, or user not active.
7. Atomically mark current session consumed/revoked for rotation using a conditional update.
8. Create replacement session in same family with new verifier and server-derived expiry.
9. Link old session to replacement if model supports it.
10. Commit.
11. Mint FEAT-004 access token using existing service.
12. Set new refresh cookie and return safe JSON response.

Replay:

- If a known consumed/revoked session is presented, revoke all sessions in the family within a transaction.
- Return safe unauthenticated error.
- Do not mint access token.

Concurrency:

- Conditional update or row lock must ensure only one request can consume an active token.
- Concurrent loser receives safe unauthenticated error.
- Tests must prove at most one success.

## 8. Repository Boundary

Expected modules may include:

```text
apps/api/src/modules/auth/refresh-token.service.ts
apps/api/src/modules/auth/refresh-session.repository.ts
apps/api/src/modules/auth/refresh.controller.ts
apps/api/src/modules/auth/refresh.schema.ts
apps/api/src/modules/auth/refresh-cookie.ts
```

Controllers:

- Validate request/cookie presence.
- Call service.
- Set response cookie.
- Return safe response.

Services:

- Generate/hash tokens.
- Orchestrate login refresh-session creation.
- Orchestrate rotation, replay handling, and internal revocation.
- Own transaction boundaries.

Repositories:

- Hide Prisma details.
- Provide conditional consume/revoke-family operations.
- Provide lookup by token verifier.

Controllers must not import Prisma.

## 9. Test Strategy

Unit tests:

- Refresh token generation entropy/shape.
- HMAC verifier deterministic and secret-specific.
- Cookie option builder.
- Config mapping and no access-token secret reuse.
- Service invalid states.

API integration tests:

- Login sets refresh cookie.
- Login response excludes raw refresh token.
- Refresh endpoint requires cookie.
- Valid refresh returns new access token and new cookie.
- Old token reuse rejected.
- Missing/malformed/unknown token rejected.
- Safe error envelope and no sensitive leakage.

PostgreSQL-backed tests:

- Migration applies to isolated DB.
- Refresh session created on login.
- Raw token not persisted.
- Rotation persists replacement and consumes old session.
- Reuse revokes family.
- Revoked/expired session rejected.
- Concurrent same-token refresh allows at most one success.
- Test DB guard remains active and no DB tests silently skip.

Regression tests:

- FEAT-001 health/logging/build baseline.
- FEAT-002 identity constraints and config.
- FEAT-003 registration/password behavior.
- FEAT-004 login/access-token behavior and strict claims.

Validation commands:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
```

Runtime smoke should exercise health, registration/login, refresh success, old-token reuse failure, and protected endpoint with refreshed access token.

## 10. Security Requirements

- No hard-coded secrets.
- No fallback refresh secret.
- No raw refresh token in JSON, logs, database, or implementation reports.
- No token verifier/hash in responses/logs.
- No raw Prisma errors or stack traces in responses.
- Refresh endpoint does not trust client body identity or role/admin state.
- Access token minted from refresh uses FEAT-004 access-token service.
- Refresh does not change RBAC/admin state.
- Refresh does not emit audit events in FEAT-005, but state must represent replay for future audit.

## 11. Rate-Limit Governance Recommendation

Do not add rate limiting to FEAT-005 without Human approval. Recommended governance action remains insertion of a dedicated Phase 2 feature before FEAT-010:

```text
FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection
```

This feature should cover registration/login/refresh/logout/auth-sensitive endpoints and Redis-backed counters if approved.

## 12. Implementation Report Expectations

`reports/implementation/phase-2/FEAT-005.md` must include:

- Files changed.
- Migration details and schema implications.
- Token verifier strategy.
- Cookie contract.
- Rotation and replay behavior.
- Concurrency strategy.
- Tests created/updated.
- Commands executed and real results.
- Known limitations.
- Security notes.
- Acceptance criteria mapping.
