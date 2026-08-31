# Requirement: FEAT-007 RBAC Authorization Foundation

**Feature ID**: FEAT-007  
**Phase**: Phase 2 - Identity & Security  
**Status**: APPROVED  
**Created**: 2026-08-26  
**Owner**: Codex as Architect / Planner / QA Governance Owner  
**Implementation Agent**: Antigravity only after Human approval and explicit handoff

## 1. Background

FEAT-002 established identity persistence, including `Role` and `UserRole` models. FEAT-004 established authenticated request context from verified short-lived access tokens and server-side user lookup. FEAT-005 and FEAT-006 established refresh-session lifecycle, logout, and logging safety.

FEAT-007 must create the reusable authorization foundation for later features. It must answer:

```text
Given an authenticated user, what server-side roles does the user have, and should this request be allowed?
```

FEAT-007 does not implement the admin-specific business guard owned by FEAT-008.

## 2. Goal

Create a server-enforced RBAC foundation using:

```text
authenticated identity
+
server-side role assignment
+
authorization policy evaluation
=
trusted authorization decision
```

## 3. In Scope

- Canonical server-controlled role identifiers.
- Role and user-role lookup using FEAT-002 PostgreSQL/Prisma persistence.
- Repository/service boundary for user role lookup and role membership checks.
- Authorization context containing authenticated user plus server-derived roles.
- Minimal reusable authorization primitives such as `hasRole`, `requireRole`, and `requireAnyRole`, if they fit the implementation design.
- Deny-by-default behavior when role lookup fails, role data is malformed, or the required role is missing.
- Safe distinction between unauthenticated `401 UNAUTHENTICATED` and authenticated-but-insufficient `403 FORBIDDEN`.
- Role seeding/bootstrap strategy for canonical roles.
- Secure operational role provisioning boundary for assigning canonical roles to existing users without public HTTP/API authority.
- Unit, integration, PostgreSQL-backed, security, and regression tests.
- Implementation report mapping requirements, tasks, tests, validation, and acceptance criteria.

## 4. Out of Scope

FEAT-007 must not implement:

- FEAT-008 Admin Authorization Guard or admin business route behavior.
- Admin dashboard, admin APIs, or admin product functionality.
- Public role-management UI.
- Public role assignment endpoint unless Human explicitly approves a scope change.
- Permission tables, ABAC engine, policy language, tenant authorization, or entitlement/premium checks.
- Audit event persistence/emission; FEAT-009 owns audit behavior.
- Rate limiting or progressive protection.
- Access-token role claims.
- Default admin credentials or automatic privileged user creation.
- Registration/login/refresh/logout behavior changes except where tests use existing flows as fixtures.
- FEAT-009 or later behavior.

## 5. Human Decisions Reflected

- Authentication endpoint rate limiting remains a separate unresolved Phase 2 governance item and is not part of FEAT-007.
- FEAT-008 remains the owner of admin-specific authorization guard/application.
- Access tokens remain minimal and do not include roles.
- Client-provided role/admin state is never trusted.

## 6. FEAT-007 Architectural Decisions

### AD-001: PostgreSQL Role Authority

Roles and user-role assignments are authoritative in PostgreSQL via FEAT-002 `Role` and `UserRole`.

### AD-002: Canonical Role Codes

FEAT-007 uses centralized server-controlled role codes:

```text
USER
ADMIN
```

These are stored in `Role.name` and must not be inferred from UI labels or client input.

### AD-003: Multi-Role Users

Users may have multiple roles. Duplicate assignments are prevented by the existing `UserRole(userId, roleId)` unique constraint.

### AD-004: Server-Side Role Lookup Per Authorization

Authorization loads roles server-side from PostgreSQL after FEAT-004 authenticates the user. Roles are not embedded in access tokens in FEAT-007, so role changes should affect authorization without waiting for access-token expiry.

### AD-005: No Registration Default Role Mutation Yet

FEAT-007 does not silently change FEAT-003 registration semantics to automatically assign a `USER` role. Role assignment in FEAT-007 is limited to seed/bootstrap/test/admin-internal foundations. Whether registration should atomically assign a default `USER` role requires explicit Human approval before implementation changes FEAT-003 behavior.

Consequence:

- Newly registered users may be authenticated but have zero RBAC roles.
- Authentication does not imply `USER` role membership.
- Any endpoint requiring `USER` must deny an authenticated zero-role user until a server-side role assignment exists.

### AD-006: Explicit Operational Role Provisioning

FEAT-007 defines a secure server-side operational provisioning boundary for assigning canonical roles to existing users.

Conceptual operation:

```text
role assign:
  user=<existing user>
  role=<canonical RoleCode>
```

The exact command/helper syntax is implementation-specific. Required properties:

- Explicit operator invocation only.
- No browser/client/public HTTP authority.
- Target user must already exist.
- Role must be in the canonical allowlist.
- Assignment persists in PostgreSQL.
- Duplicate assignment is idempotent or safely rejected.
- Safe for local/test/staging/production with explicit environment controls.
- Safe logs only; no secrets, tokens, raw DB errors, or credentials.
- Designed so FEAT-009 can later audit role-management events.

This provisioning boundary is a prerequisite for FEAT-008 production activation. FEAT-007 owns the foundation; FEAT-009 owns durable audit emission for this operation later.

## 7. Dependencies

- FEAT-002: authoritative User, Role, UserRole models and repository boundary patterns.
- FEAT-004: authenticated request context and verified access-token identity.
- FEAT-005/006: session lifecycle and logging/security constraints for regression only.

## 8. Required Deliverables

- Source implementation after Human approval only.
- Unit tests for role membership and authorization helpers/middleware.
- API integration tests for authenticated role-protected behavior.
- PostgreSQL-backed tests for role/user-role persistence, duplicate assignment rejection, multi-role lookup, and role change effect.
- Regression tests for registration, login, access-token verification, refresh, logout, and logging sanitizer behavior.
- `reports/implementation/phase-2/FEAT-007.md` after implementation.

## 9. Acceptance Summary

FEAT-007 can pass only when roles are loaded from PostgreSQL, client-supplied role/admin claims are ignored, allowed/denied decisions match server-side assignments, failure modes deny by default, no FEAT-008/admin business behavior is introduced, and FEAT-001 through FEAT-006 regressions remain green.

## 10. Unresolved Human Decisions

- Decision A: approve canonical role set `USER` and `ADMIN`.
- Decision B: approve multi-role users.
- Decision C: approve FEAT-007 current scope where registration continues creating authenticated users with zero roles.
- Decision D: approve server-side operational role provisioning as the way to assign `ADMIN` before FEAT-008 production activation.
- Decision E: confirm automatic `USER` assignment remains deferred.
- Whether a later feature should modify registration to atomically assign the baseline `USER` role to every new user.
- Whether to insert a dedicated Phase 2 rate-limiting feature before FEAT-010, tentatively `FEAT-010A - Authentication Endpoint Rate Limiting & Progressive Protection`.
