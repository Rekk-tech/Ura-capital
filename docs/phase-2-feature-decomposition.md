# Aura Capital - Phase 2 Feature Decomposition

**Status**: Proposed for Human Review  
**Phase**: Phase 2 - Identity & Security  
**Date**: 2026-08-25  
**Scope**: Planning only. No implementation code. No Antigravity handoff yet.

## 1. Planning Basis

Reviewed context:

- `docs/project-overview.md`
- `docs/architecture-context.md`
- `docs/final-technology-decisions.md`
- `docs/environment-strategy.md`
- `docs/adrs/ADR-003-postgresql-and-prisma.md`
- `docs/adrs/ADR-004-authentication-token-strategy.md`
- `docs/adrs/ADR-005-redis-responsibility.md`
- `docs/code-standards.md`
- `docs/ai-workflow-rules.md`
- `docs/progress-tracker.md`

Phase 2 must establish server-enforced identity, authentication, session management, authorization, and auth auditability before product-domain features depend on user trust boundaries.

Important boundary:

- ADR-003 assigns the broad data foundation to Phase 3.
- ADR-004 requires durable auth/session state in Phase 2.
- Therefore Phase 2 may introduce identity-scoped PostgreSQL/Prisma persistence only for users, credentials, roles, refresh sessions, and authentication audit events. Broader domain persistence remains Phase 3.

## 2. Feature Decomposition

Phase 2 should not be implemented as one large feature. The recommended feature slices are independently specifiable, independently implementable, and independently QA-able.

| Feature ID | Feature Name | Primary Outcome | Dependencies |
|------------|--------------|-----------------|--------------|
| FEAT-002 | Identity Persistence & Auth Configuration | Durable identity foundation and validated auth config | FEAT-001 |
| FEAT-003 | Registration & Password Security | User registration with secure password handling | FEAT-002 |
| FEAT-004 | Login & Access Token Issuance | Credential login and short-lived access tokens | FEAT-002, FEAT-003 |
| FEAT-005 | Refresh Token Rotation & Revocation | Rotated, revocable refresh-token sessions | FEAT-004 |
| FEAT-006 | Logout & Session Invalidation | Logout revokes refresh session and clears cookie | FEAT-005 |
| FEAT-007 | RBAC Authorization Foundation | Role model and server-side role checks | FEAT-002, FEAT-004 |
| FEAT-008 | Admin Authorization Guard | Admin-only API enforcement | FEAT-007 |
| FEAT-009 | Authentication Audit Events | Durable audit trail for auth/security events | FEAT-002, integrates with FEAT-003 to FEAT-008 |
| FEAT-010 | Phase 2 Security Integration Gate | Cross-feature security validation suite and QA gate | FEAT-003 to FEAT-009 |

## 3. Dependency Order

Recommended execution order:

1. FEAT-002 - Identity Persistence & Auth Configuration
2. FEAT-003 - Registration & Password Security
3. FEAT-004 - Login & Access Token Issuance
4. FEAT-005 - Refresh Token Rotation & Revocation
5. FEAT-006 - Logout & Session Invalidation
6. FEAT-007 - RBAC Authorization Foundation
7. FEAT-008 - Admin Authorization Guard
8. FEAT-009 - Authentication Audit Events
9. FEAT-010 - Phase 2 Security Integration Gate

Parallelization note:

- FEAT-009 can be specified after FEAT-002 and designed early, but final QA for audit events should wait until registration, login, refresh, logout, RBAC, and admin guard events exist.
- FEAT-007 can begin after FEAT-004 because role checks require authenticated request context.
- FEAT-010 must remain last because it verifies the integrated Phase 2 security boundary.

Rate limiting ownership note:

- Authentication endpoint rate limiting remains required during Phase 2, but it is not part of FEAT-004 because FEAT-004 is limited to login and access-token issuance/verification.
- FEAT-010 must remain a security integration gate and should not become an implementation feature.
- Governance recommendation: Human should approve a dedicated Phase 2 feature before FEAT-010, tentatively **FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection**.
- Until Human approves that insertion, the approved FEAT-002 through FEAT-010 sequence is preserved.

## 4. Proposed Acceptance Boundaries

### FEAT-002 - Identity Persistence & Auth Configuration

Goal:

Create the durable identity prerequisite for Phase 2 without expanding into the full Phase 3 data foundation.

Scope:

- Identity-scoped Prisma/PostgreSQL baseline.
- User persistence model.
- Credential persistence boundary.
- Refresh-session persistence model or placeholder repository contract required by FEAT-005.
- Role persistence model required by FEAT-007.
- Auth-related environment validation.
- Repository boundaries for identity/auth persistence.

Acceptance boundary:

- User records persist in PostgreSQL.
- User email or login identifier uniqueness is enforced by the database.
- Auth secrets and token settings are loaded from environment only.
- Missing required auth configuration fails startup.
- No fallback JWT or auth secret exists.
- Controllers/services do not directly depend on raw Prisma details.
- Test/CI configuration remains isolated from local/staging/production data.
- Validation suite includes lint, typecheck, tests, and build.

Out of scope:

- Public registration endpoint.
- Login endpoint.
- Token issuance.
- Full application data model for academy, simulation, community, AI, or subscriptions.

### FEAT-003 - Registration & Password Security

Goal:

Allow new users to register with validated input and securely stored credentials.

Scope:

- Registration API contract.
- Registration request validation with Zod.
- Email or username normalization rules.
- Password policy.
- Password hashing with an approved one-way password hashing algorithm and per-password salt.
- Duplicate account rejection.
- Safe error responses.

Acceptance boundary:

- Valid registration creates a user and credential record.
- Invalid registration payloads are rejected.
- Duplicate registration is rejected without exposing sensitive internals.
- Passwords are never stored or returned in plaintext.
- Password hashes are not logged.
- Registration response does not expose sensitive credential/session internals.
- Required registration tests pass.

Out of scope:

- Login.
- Refresh-token cookies.
- Email verification unless explicitly approved as a separate future feature.

### FEAT-004 - Login & Access Token Issuance

Goal:

Authenticate users and issue short-lived access tokens.

Scope:

- Login API contract.
- Credential verification.
- Invalid login rejection.
- Access-token signing.
- Access-token verification middleware.
- Authenticated current-user context for protected endpoints.
- Forged-token and expired-token rejection.

Acceptance boundary:

- Valid credentials return or provide a short-lived access token.
- Invalid credentials are rejected with a stable safe error response.
- Access token lifetime is within the approved 5-15 minute range.
- Forged tokens are rejected.
- Expired tokens are rejected.
- Missing auth secret fails startup.
- Protected endpoints reject unauthenticated requests.
- Token payload does not include sensitive user data.
- Required login/access-token tests pass.

Out of scope:

- Refresh-token rotation.
- Logout.
- Role/admin authorization decisions beyond authenticated identity.

### FEAT-005 - Refresh Token Rotation & Revocation

Goal:

Implement rotated, revocable refresh-token sessions backed by PostgreSQL.

Scope:

- Refresh-token issuance.
- HttpOnly Secure SameSite cookie handling.
- Refresh-session persistence.
- Refresh-token hashing or equivalent server-side protection.
- Token rotation on refresh.
- Refresh-token reuse/replay handling.
- Session revocation model.
- Optional Redis replay/rate-limit acceleration only if PostgreSQL remains authoritative.

Acceptance boundary:

- Login or refresh flow establishes a refresh session.
- Refresh token is not exposed to browser JavaScript.
- Refresh token is rotated on successful refresh.
- Old refresh token cannot be reused.
- Revoked refresh session cannot refresh access.
- Refresh session durability is in PostgreSQL.
- Redis, if used, is transient only and has defined outage behavior.
- Required refresh-token tests pass.

Out of scope:

- User-facing logout endpoint, unless only needed as an internal revocation helper for tests.
- Role/admin authorization.

### FEAT-006 - Logout & Session Invalidation

Goal:

Allow authenticated users to terminate refresh sessions.

Scope:

- Logout API contract.
- Current refresh-session revocation.
- Refresh cookie clearing.
- Idempotent or safely repeatable logout behavior.
- Safe behavior for missing/invalid refresh token.

Acceptance boundary:

- Logout invalidates the active refresh session.
- Refresh after logout is rejected.
- Logout clears the refresh cookie using matching cookie attributes.
- Logout does not require trusting client-provided user identity.
- Access tokens are not treated as immediately revocable unless explicitly designed; they expire naturally.
- Required logout tests pass.

Out of scope:

- Device/session management UI.
- Global logout from all sessions unless separately approved.

### FEAT-007 - RBAC Authorization Foundation

Goal:

Introduce role-based authorization as a server-side capability.

Scope:

- Role model.
- User-role assignment persistence.
- Role constants/types.
- Authorization middleware/guard for required roles.
- Service-level role checks where domain state is involved.
- Test-only or internal protected route as needed to verify behavior.

Acceptance boundary:

- Roles are persisted server-side.
- Authenticated user context includes server-derived roles.
- Client-provided roles are ignored.
- Endpoints can require one or more roles.
- Unauthorized users receive safe authorization errors.
- Normal authenticated users cannot access role-restricted behavior.
- Required RBAC tests pass.

Out of scope:

- Admin-specific protected business APIs.
- Role management UI.
- Subscription/premium entitlement logic.

### FEAT-008 - Admin Authorization Guard

Goal:

Provide a verified admin-only authorization boundary for future admin APIs.

Scope:

- Admin guard using the RBAC foundation.
- Admin-only API route or representative endpoint.
- Server-side enforcement.
- Safe denial for unauthenticated and non-admin users.

Acceptance boundary:

- Unauthenticated requests are rejected.
- Authenticated non-admin users are rejected.
- Authenticated admin users are allowed.
- Admin status cannot be supplied or escalated by the client.
- Admin authorization is enforced on the server, not by hidden UI controls.
- Required admin authorization tests pass.

Out of scope:

- Full admin product functionality.
- Admin dashboard UI unless explicitly specified later.

### FEAT-009 - Authentication Audit Events

Goal:

Create durable auditability for high-value authentication and authorization events.

Scope:

- Auth/security audit event schema.
- Audit event persistence in PostgreSQL.
- Audit event emitter/service boundary.
- Events for relevant registration, login, refresh, logout, RBAC denial, admin denial, token replay/revocation, and security-sensitive auth failures.
- Redaction policy for event metadata.

Acceptance boundary:

- High-value auth actions emit durable audit events.
- Failed login attempts are auditable without storing plaintext passwords or tokens.
- Refresh reuse/replay or revoked-session attempts are auditable.
- Authorization denials are auditable where security-relevant.
- Audit events include request correlation when available.
- Audit events do not contain secrets, plaintext credentials, access tokens, or refresh tokens.
- Required audit tests pass.

Out of scope:

- Full observability dashboards.
- Long-term retention policy.
- SIEM integration.

### FEAT-010 - Phase 2 Security Integration Gate

Goal:

Verify Phase 2 as an integrated security boundary before any dependent product phases proceed.

Scope:

- Cross-feature API/security integration tests.
- Regression checks against Phase 2 acceptance criteria in `progress-tracker.md`.
- Validation suite execution.
- QA-ready evidence for Human Final Gate.

Acceptance boundary:

- Invalid login is rejected.
- Passwords are hashed and never exposed.
- Forged token is rejected.
- Expired token is rejected.
- Refresh flow works.
- Refresh-token rotation prevents reuse.
- Logout invalidates refresh session.
- Normal user cannot access admin API.
- Admin authorization is server-enforced.
- Secrets are environment-only.
- Auth audit events are emitted for required high-value actions.
- Lint passes.
- Typecheck passes.
- Test suite passes.
- Build passes.
- Security tests are included in CI or explicitly documented as required local validation.

Out of scope:

- New auth features.
- Product-domain authorization for academy, simulation, community, subscriptions, or AI.

## 5. Required Security Test Coverage

Each implementation feature must include focused tests. FEAT-010 must then verify the integrated behavior.

Minimum required coverage:

- Registration rejects invalid input.
- Duplicate registration is rejected.
- Stored password is a hash, not plaintext.
- Login rejects wrong password.
- Login rejects unknown user without account enumeration leakage.
- Access token accepts valid token.
- Access token rejects missing, forged, malformed, and expired tokens.
- Refresh succeeds with a valid refresh token.
- Refresh rotates token and invalidates the previous token.
- Refresh rejects reused/revoked token.
- Logout revokes the active refresh session.
- Logout prevents future refresh with the same session.
- RBAC rejects users without required roles.
- Admin guard rejects normal users and unauthenticated requests.
- Admin guard allows admin users.
- Auth and authorization failures use stable safe error envelopes.
- Secrets/tokens/passwords are not logged or returned.
- Required auth configuration missing causes startup failure.
- Audit events are emitted for required high-value auth/security actions.

## 6. Phase 2 Integration Quality Gate

Phase 2 may be proposed for QA PASS only after all Phase 2 features are individually QA-reviewed and FEAT-010 passes.

Required validation suite:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Additional validation expected when implemented:

- API integration tests for auth routes.
- Database-backed integration tests using isolated test database or documented cleanup.
- Redis-backed tests only if Redis is introduced for Phase 2 behavior.
- Runtime health check if the API runtime is materially changed.
- Manual or automated cookie inspection for refresh-token cookie attributes.

Phase 2 Integration Gate decision values:

```text
PASS
CONDITIONAL PASS
FAIL
```

PASS requirements:

- All Phase 2 acceptance criteria in `docs/progress-tracker.md` are satisfied.
- All blocking defects from feature QA reports are resolved.
- No P0 security defects remain.
- No critical auth/authz regression against FEAT-001 foundation exists.
- Validation evidence is current and real.
- Human Final Gate may be requested.

CONDITIONAL PASS may be considered only when:

- No P0 issue exists.
- Any remaining issue is non-blocking, documented, accepted by QA, and tracked for a later feature.
- Human explicitly approves progression with the known condition.

FAIL conditions:

- Any authentication or authorization bypass.
- Any plaintext password storage or token/secret exposure.
- Any accepted auth route relying on client-provided role/admin state.
- Missing required auth secret does not fail startup.
- Refresh-token revocation/rotation does not work.
- Normal user can access admin-only API.
- Critical validation suite failures without accepted justification.

## 7. Human Review Questions

Before creating individual FEAT spec packages, Human review should confirm:

- Whether FEAT IDs FEAT-002 through FEAT-010 are approved.
- Whether email verification is intentionally out of Phase 2.
- Whether password hashing algorithm should be fixed during planning or decided in FEAT-003 spec.
- Whether Human approves inserting **FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection** before FEAT-010. Hard account lockout remains out of scope unless separately approved.
- Whether FEAT-010 should be a formal implementation feature or only a final QA gate artifact.

## 8. Recommendation

Recommended next action after Human approval:

Create the `.specify/specs/FEAT-002/` spec package for **Identity Persistence & Auth Configuration** first.

Do not begin FEAT-003 or later specs until FEAT-002 acceptance boundaries are approved, because every later Phase 2 feature depends on identity persistence and auth configuration rules.
