# Implementation Plan: Login & Access Token Issuance

**Feature ID**: FEAT-004  
**Branch**: `N/A - repository is not initialized as git`  
**Date**: 2026-08-25  
**Spec**: `spec.md`  
**Status**: APPROVED

## Summary

Implement secure credential login and short-lived access-token verification on top of FEAT-002 identity persistence and FEAT-003 password security. FEAT-004 adds login validation, normalized credential lookup, Argon2id password verification reuse, safe invalid-login handling, access-token signing, access-token verification middleware, authenticated request context, and a representative protected endpoint.

FEAT-004 does not implement refresh tokens, refresh rotation, refresh-session behavior, logout, RBAC enforcement, admin guard, auth audit event emission, email verification, account lockout, rate limiting, or FEAT-005 behavior.

## Technical Context

**Language/Version**: TypeScript on Node.js 22 baseline from FEAT-001.

**Primary Dependencies**: Express API foundation, Zod validation, FEAT-002 repositories/Prisma models, FEAT-003 Argon2id password hashing service, approved token signing/verification library if not already present.

**Storage**: PostgreSQL identity tables from FEAT-002.

**Testing**: Vitest for unit and integration tests, Supertest for API contract tests, PostgreSQL-backed DB tests for credential lookup and login behavior.

**Target Platform**: API workspace in the npm workspaces monorepo.

**Project Type**: Modular monolith with `apps/api`, `apps/web`, and `packages/shared`.

**Constraints**:

- Access-token lifetime must be 5-15 minutes.
- Access-token secret must be required from environment only.
- Access-token algorithm is HS256 only.
- Access-token issuer and audience must be required environment config.
- No fallback auth secret.
- Token claims must be exact, minimal, server-derived, and validated.
- Password verification must reuse FEAT-003; no duplicate password implementation.
- Invalid login must avoid response-based enumeration and obvious fast-fail timing enumeration.
- No later Phase 2 behavior may be implemented.

## Architecture Decisions

### Decision 1: Login Service Owns Credential Verification and Token Issuance

Use a login/auth service boundary to coordinate normalized lookup, password verification, invalid-login mapping, and access-token issuance.

**Rationale**: Controllers should parse/validate and delegate. Repositories should persist/query. Token issuance is authentication orchestration and belongs in the service layer or a dedicated token service called by it.

**Rejected Alternatives**:

- Verify password or sign token directly in controller: rejected by layering standards.
- Put token signing in repository: rejected because repositories should not own authentication behavior.

**Implications**:

- FEAT-005 can later add refresh-token behavior without changing login password verification.
- FEAT-007 can later consume authenticated context without trusting client role claims.

### Decision 2: Short-Lived Access Token Only

Issue only a short-lived access token in FEAT-004.

**Rationale**: ADR-004 requires short-lived access tokens, but refresh-token rotation/revocation is a separate FEAT-005 boundary.

**Rejected Alternatives**:

- Issue refresh token during login in FEAT-004: rejected as FEAT-005 scope creep.
- Long-lived access token: rejected by ADR-004.

**Implications**:

- Users can authenticate protected requests until access-token expiry.
- Session continuity and refresh cookies arrive in FEAT-005.

### Decision 2A: HS256 Algorithm Allowlist

Use HS256 for access-token signing and verification.

**Rationale**: Current approved auth configuration uses symmetric access-token secrets, not an asymmetric keypair/JWKS model. HS256 is consistent with that architecture when the signing secret is required, strong, environment-provided, and never defaulted.

**Rejected Alternatives**:

- Algorithm selected by implementation agent: rejected because auth algorithms must be explicit.
- Trusting token header algorithm dynamically: rejected due to algorithm-confusion risk.
- `none`: rejected.
- RS256/ES256: good options for asymmetric/public-verifier architectures, but not selected because current architecture has no key management/JWKS boundary.

**Implications**:

- Signing must set HS256 explicitly.
- Verification must allow only HS256.
- Tests must cover wrong algorithm and `none` rejection.

### Decision 2B: Issuer and Audience Required

Require issuer and audience claims for access tokens.

**Rationale**: FEAT-004 is a production-oriented auth boundary. Issuer and audience validation narrows where a token is valid and prevents accidental token reuse across services/environments.

**Config Source**:

- `AUTH_ACCESS_TOKEN_ISSUER`
- `AUTH_ACCESS_TOKEN_AUDIENCE`

Both are required. No fallback values are allowed.

**Implications**:

- Token service signs `iss` and `aud`.
- Verifier checks `iss` and `aud`.
- Tests must reject wrong issuer and wrong audience.

### Decision 3: Enumeration-Safe Invalid Login

Unknown email and wrong password use the same external failure contract.

**Rationale**: Prevents attackers from learning whether an identity exists through login responses.

**Rejected Alternatives**:

- Different messages for unknown user and wrong password: rejected because it leaks account existence.

**Implications**:

- Logs must remain safe and must not include password values.
- Unknown-user path must avoid obvious fast-fail timing enumeration by performing FEAT-003 Argon2id verification against a fixed dummy encoded hash or equivalent approved constant-work strategy.
- Internal metrics/audit events are deferred to FEAT-009.

### Decision 4: Server-Derived Authenticated Context

Authenticated request context is derived from a verified access token and server-side lookup/validation.

**Rationale**: Server trust boundary forbids relying on browser-provided identity, role, admin, premium, or authorization state.

**Rejected Alternatives**:

- Trust client-supplied user ID, role, or admin fields: rejected.

**Implications**:

- FEAT-004 context may include only authenticated user identity and safe fields.
- Role loading/enforcement belongs to FEAT-007.

## Constitution Check

The `.specify/memory/constitution.md` file is still a placeholder, so no ratified constitution gates can be enforced from that file.

Applied governance from project context:

- Greenfield rebuild: PASS.
- Modular monolith first: PASS.
- PostgreSQL durable source of truth: PASS.
- Prisma behind repositories: PASS.
- Zod validation: PASS.
- No fallback secrets: PASS.
- Server trust boundary preserved: PASS.
- No scope creep into FEAT-005 through FEAT-010: REQUIRED.
- No fake validation evidence: REQUIRED.
- Human approval before implementation: REQUIRED.

## Project Structure

Expected source areas, subject to existing FEAT-001 through FEAT-003 layout:

```text
apps/api/
  src/
    modules/
      auth/
        login.controller.ts
        login.route.ts
        login.schema.ts
        login.service.ts
        access-token.service.ts
        auth.middleware.ts
        password-hashing.service.ts
        credential.repository.ts
    modules/
      users/
        user.repository.ts
    shared/
      errors/
  tests/
    unit/
    integration/
packages/shared/
  src/
    schemas/
    types/
    constants/
```

Rules:

- Public request/response schemas may live in `packages/shared` only if they are true cross-boundary contracts.
- Domain orchestration belongs in `apps/api/src/modules/auth`.
- Prisma access remains in FEAT-002 repository modules.
- Token signing/verification should be isolated behind a dedicated service boundary.
- Auth middleware may live under `apps/api/src/modules/auth` or `apps/api/src/middleware` following existing conventions.

## API Contract

Canonical routes:

```text
POST /auth/login
GET /auth/me
```

If the existing dual route convention is retained, the implementation may also expose and test:

```text
POST /api/auth/login
GET /api/auth/me
```

Any alternate route must be documented and tested. No other public auth endpoints are approved in FEAT-004.

Request:

```json
{
  "email": "user@example.com",
  "password": "correct horse battery staple"
}
```

Validation:

- `email`: required, syntactically valid email, trimmed, lowercased before lookup.
- `password`: required non-empty string; FEAT-004 must not redefine FEAT-003 password policy for login beyond safe payload bounds.

Success response:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "displayName": "Optional Name",
    "status": "ACTIVE"
  }
}
```

Forbidden response fields:

- password
- passwordHash
- credential ID
- role/user-role internals
- refresh token
- refresh session
- auth secret values
- raw database/JWT error details

Invalid login response:

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Invalid email or password",
    "requestId": "..."
  }
}
```

Unknown email and wrong password must use this same external contract unless Human explicitly approves a different one.

Representative protected route:

```text
GET /auth/me
```

Purpose:

- Verify access-token middleware.
- Return safe authenticated user context.
- Not a profile management endpoint.

## Access Token Strategy

Token requirements:

- Signed using required `AUTH_ACCESS_TOKEN_SECRET`.
- Algorithm `HS256` only.
- Verification allowlist contains only `HS256`; `none` and unexpected algorithms are rejected.
- Lifetime from `AUTH_ACCESS_TOKEN_TTL_MINUTES`, validated within 5-15 minutes, default 15 minutes.
- Required issuer from `AUTH_ACCESS_TOKEN_ISSUER`.
- Required audience from `AUTH_ACCESS_TOKEN_AUDIENCE`.
- Exact minimal payload.
- No password, password hash, credential internals, refresh-session fields, secrets, `jti`, profile data, or role/admin claims.
- Must reject missing header, wrong scheme, empty bearer, malformed header, malformed token, forged token, wrong algorithm, wrong issuer, wrong audience, expired token, and unknown/inactive subject.

Required claims:

- `sub`: user ID.
- `iat`: issued-at timestamp.
- `exp`: expiry timestamp.
- `typ`: `access`.
- `iss`: configured issuer.
- `aud`: configured audience.

No additional claims are approved for FEAT-004. Any future roles, permissions, premium status, admin state, or token IDs must be server-derived in later features and not trusted from FEAT-004 token payload.

## Authorization Header Contract

Protected requests authenticate with:

```text
Authorization: Bearer <access-token>
```

Failure cases must use a stable `UNAUTHENTICATED` envelope without raw JWT errors:

- Missing header.
- Wrong scheme.
- Empty bearer value.
- Malformed header.
- Multiple or ambiguous credentials where detectable.
- Malformed token.
- Forged signature.
- Wrong algorithm.
- Wrong issuer.
- Wrong audience.
- Expired token.

## Data and Repository Strategy

FEAT-004 reuses FEAT-002 models:

- `User`
- `Credential`

Login flow:

1. Validate request.
2. Normalize email.
3. Look up user by normalized email through repository.
4. If no user, run Argon2id verification against a fixed dummy encoded hash or equivalent approved constant-work strategy, then return same safe invalid-login result as wrong password.
5. Look up credential by user ID through repository.
6. Verify password using FEAT-003 Argon2id verification.
7. If verification fails, return same safe invalid-login result.
8. Sign short-lived access token from server-derived user ID.
9. Return access token and safe user response.

No database mutation is required for FEAT-004 login success.

## Validation Strategy

Implementation must provide evidence for:

- Login request schema validation.
- Email normalization.
- Credential lookup through repositories.
- Password verification using FEAT-003 service.
- Unknown user and wrong password share same external error.
- Unknown-user path avoids obvious fast-fail timing enumeration.
- Valid login issues a short-lived signed access token.
- Token uses HS256 only.
- Token payload contains exactly approved claims.
- Missing auth secret, issuer, or audience fails startup/config validation.
- Middleware rejects missing header, wrong scheme, empty bearer, malformed header, malformed token, forged token, wrong algorithm, wrong issuer, wrong audience, expired token, and unknown/inactive subject.
- Middleware accepts valid token and attaches server-derived context from verified `sub` plus User repository lookup.
- Protected verification endpoint behavior.
- Safe logging and error envelopes.
- No refresh/logout/RBAC/admin/audit/rate-limit scope creep.
- FEAT-001, FEAT-002, and FEAT-003 regression validation.

Required validation commands:

- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:db`
- Packaged API runtime health check.
- Packaged API login/protected-endpoint smoke if route wiring changes startup behavior.

## Rate Limiting Decision

Rate limiting is required during Phase 2 but is not included in FEAT-004. The approved FEAT-004 boundary does not list rate limiting, and adding it would introduce Redis/outage/progressive-protection behavior not required to prove login/access-token correctness.

FEAT-010 must remain a security integration/QA gate and must not introduce new implementation behavior. Governance recommendation: Human should approve insertion of a dedicated Phase 2 feature, tentatively **FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection**, before the Phase 2 Security Integration Gate. Until Human approves that insertion, FEAT-004 records the dependency but does not implement rate limiting.

## Implementation Report Requirements

Antigravity must create/update:

```text
reports/implementation/phase-2/FEAT-004.md
```

The report must include:

- Files changed.
- Dependency additions and rationale.
- Token signing/verification design.
- Acceptance criteria mapping.
- Test evidence with counts.
- DB-backed evidence.
- Validation command results.
- Known limitations.
- Explicit no-scope-creep statement.
- Ready for QA: YES/NO.
