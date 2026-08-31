# Requirement: FEAT-004 Login & Access Token Issuance

**Status**: APPROVED  
**Created**: 2026-08-25  
**Owner**: Codex as Planner + Architect + QA/QC Governance Owner  
**Implementation Agent**: Antigravity after separate Human implementation handoff  
**Phase**: Phase 2 - Identity & Security

## Source Context

This requirement is derived from:

- `docs/project-overview.md`
- `docs/architecture-context.md`
- `docs/final-technology-decisions.md`
- `docs/environment-strategy.md`
- `docs/adrs/ADR-003-postgresql-and-prisma.md`
- `docs/adrs/ADR-004-authentication-token-strategy.md`
- `docs/code-standards.md`
- `docs/ai-workflow-rules.md`
- `docs/progress-tracker.md`
- `docs/phase-2-feature-decomposition.md`
- `.specify/specs/FEAT-002/`
- `.specify/specs/FEAT-003/`
- `reports/qa/phase-2/FEAT-002-QA.md`
- `reports/qa/phase-2/FEAT-003-QA.md`

Human decisions already approved:

- FEAT-002 is Human Final Gate APPROVED/PASS.
- FEAT-003 is Human Final Gate APPROVED/PASS.
- FEAT-004 is the next active Phase 2 feature.
- ADR-004 requires short-lived access tokens with 5-15 minute lifetime.
- Required auth secrets must come from environment only; no fallback secret is allowed.
- Refresh token issuance/rotation/revocation belongs to FEAT-005.
- Logout belongs to FEAT-006.
- RBAC belongs to FEAT-007.
- Admin guard belongs to FEAT-008.
- Auth audit event emission belongs to FEAT-009.
- Email verification and hard account lockout remain out of scope.

## Problem

Aura Capital can register users and store Argon2id password credentials, but users cannot yet authenticate. The platform needs a safe login boundary that verifies credentials and issues short-lived access tokens without implementing refresh sessions, logout, RBAC, admin authorization, audit events, or later Phase 2 behavior.

The key risks are:

- Account enumeration through different unknown-email and wrong-password responses.
- Accepting client-provided identity, role, admin, or authorization claims.
- Issuing tokens with excessive lifetime or sensitive payload.
- Algorithm confusion, `none` algorithm acceptance, or trusting algorithm/header data from an unverified token.
- Using a fallback or hard-coded signing secret.
- Timing-based account enumeration through a fast-fail unknown-user branch.
- Creating a second password hashing or verification implementation instead of reusing FEAT-003.
- Scope creep into refresh/session/logout/RBAC/admin/audit behavior.

## Goal

Define and implement a secure login and access-token capability that:

- Accepts a login request with email and password.
- Normalizes email consistently with registration.
- Looks up user and credential records through approved FEAT-002 repository boundaries.
- Verifies the supplied password using the FEAT-003 Argon2id verification primitive.
- Rejects unknown users and wrong passwords with the same externally safe failure contract.
- Issues a short-lived access token after valid authentication.
- Verifies access tokens in middleware and derives authenticated request context on the server.
- Provides a representative protected endpoint for verification only.
- Rejects missing, malformed, forged, and expired tokens safely.
- Provides focused unit, API integration, and PostgreSQL-backed tests.

## In Scope

- Login API contract.
- Login request validation using Zod or the approved validation approach.
- Email normalization for login lookup.
- Credential lookup through FEAT-002 repositories/models.
- Password verification using the existing FEAT-003 Argon2id password service.
- Invalid login handling that prevents account enumeration.
- Short-lived access-token issuance.
- Explicit access-token algorithm, issuer, audience, and claim contract.
- Access-token verification middleware.
- Authenticated request/user context derived from verified token and server-side lookup.
- Representative protected endpoint for verification.
- Forged, malformed, expired, and missing token rejection.
- Safe login response and safe authentication errors.
- Required tests and implementation report.

## Out of Scope

- Refresh-token issuance.
- Refresh-token rotation.
- Refresh-session behavior.
- HttpOnly refresh cookies.
- Logout.
- RBAC enforcement.
- Admin guard.
- Authentication audit event emission.
- Email verification.
- Hard account lockout.
- Rate limiting implementation.
- Password reset.
- Social/OAuth login.
- User profile management beyond safe identity fields needed in login response/context.
- FEAT-005 or later behavior.

## Rate Limiting Boundary

Authentication endpoint rate limiting remains required during Phase 2, but it is not included in FEAT-004 because the Human-approved FEAT-004 scope is limited to login and access-token issuance. FEAT-010 is intended to remain a security integration gate and must not become an implementation feature. Governance recommendation: insert a dedicated Phase 2 feature, tentatively **FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection**, before the Phase 2 Security Integration Gate. This proposed feature requires explicit Human approval before it changes the approved feature sequence.

## Stakeholders

- Human/Product Owner: approves FEAT-004 spec and final result.
- Codex: produces specification and performs independent QA/QC.
- Antigravity: implements after Human approval.
- Future FEAT-005 implementer: depends on access-token and login boundaries without refresh behavior.
- Future FEAT-007 implementer: depends on authenticated request context, not client-provided roles.

## Primary User Need

As a registered Aura Capital user, I need to log in with my email and password and receive a short-lived access token so I can access authenticated features without exposing my password or relying on untrusted client identity.

## Key Constraints

- FEAT-004 must reuse FEAT-002 identity/credential persistence.
- FEAT-004 must reuse FEAT-003 Argon2id password verification.
- PostgreSQL remains authoritative for user and credential lookup.
- Token signing secret must be required from environment and validated at startup/config load.
- No fallback secret is allowed.
- Access-token signing/verification algorithm must be explicit: HS256 only.
- Token verification must use an algorithm allowlist and reject `none` or any unexpected algorithm.
- Implementation must not trust token algorithm information until signature verification succeeds under the allowlisted algorithm.
- Access-token lifetime must be exactly the configured `AUTH_ACCESS_TOKEN_TTL_MINUTES`, defaulting to the existing approved 15-minute config and always within 5-15 minutes.
- Access-token issuer and audience must be required configuration with no fallback: `AUTH_ACCESS_TOKEN_ISSUER` and `AUTH_ACCESS_TOKEN_AUDIENCE`.
- Token claims must be exact, minimal, validated, and server-derived.
- Token payload must not include password, password hash, credential internals, refresh-session data, auth secrets, or client-provided role/admin claims.
- Unknown email and wrong password must share the same externally safe authentication failure contract.
- Unknown-email handling must avoid an obvious fast-fail timing branch by performing an Argon2id verification operation against a fixed server-side dummy encoded Argon2id hash, or an equivalent approved constant-work strategy.
- Access-token verification must reject forged, malformed, expired, and missing tokens safely.
- Protected requests must use `Authorization: Bearer <access-token>`.
- Valid tokens whose `sub` no longer maps to an existing active user must be rejected safely.
- Registration must not be changed except where tests need shared fixtures.
- Refresh/logout/RBAC/admin/audit behavior must not be implemented.

## Assumptions

- Email remains the login identifier for FEAT-004.
- Registered users from FEAT-003 have `ACTIVE` status by default.
- The representative protected endpoint is for verification/testing only and must not become product-domain functionality.
- Existing FEAT-002 auth config already validates access-token TTL and signing secret prerequisites; FEAT-004 may add token-specific helpers/tests but must not weaken FEAT-002 validation.
- Refresh-token behavior is not required for a successful FEAT-004 login response.
