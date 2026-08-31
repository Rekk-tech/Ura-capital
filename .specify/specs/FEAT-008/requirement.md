# Requirement: FEAT-008 Admin Authorization Guard

**Status**: APPROVED  
**Phase**: Phase 2 - Identity & Security  
**Created**: 2026-08-26  
**Owner Role**: Codex Planner / Architect / QA Governance  
**Implementation Agent**: Antigravity after Human approval only

## Human Approval

Human has approved FEAT-008 for implementation.

Approved decisions:

- Canonical route: `GET /admin/ping`.
- Server route composition: `app.use(adminRouter)`.
- Router route composition: `router.get("/admin/ping", authenticate, requireAdmin, handler)`.
- `requireAdmin` delegates to FEAT-007 `requireRole(ROLES.ADMIN)`.
- PostgreSQL is the sole ADMIN authority.
- JWT remains role-free.
- Zero-role and USER-only users receive `403 FORBIDDEN`.
- ADMIN and USER+ADMIN users are allowed.
- DB/repository failure fails closed with a safe 5xx.
- ROOT-only persisted role state receives `403 FORBIDDEN`.
- ROOT+ADMIN persisted role state accepts canonical ADMIN.
- Same-token ADMIN grant/removal is reflected immediately from PostgreSQL.
- No public role management is introduced.
- No default admin credentials are introduced.
- No FEAT-009 audit emission is introduced.
- No rate limiting is introduced.

## 1. Background

FEAT-007 established the RBAC authorization foundation: canonical `RoleCode` values, PostgreSQL-backed `Role`/`UserRole` authority, server-derived authorization context, reusable `requireRole` / `requireAnyRole` primitives, role-free JWTs, zero-role semantics, fail-closed authorization behavior, and server-side operational role provisioning.

FEAT-008 now defines the concrete admin authorization boundary that future admin APIs can reuse. It must prove:

```text
authenticated user
+
server-side ADMIN role
=
authorized admin access
```

while unauthenticated, zero-role, USER-only, spoofed, malformed, and infrastructure-failure paths are denied safely.

## 2. Goal

Create a reusable admin guard and one representative admin-protected API boundary that demonstrates server-enforced ADMIN authorization without expanding into admin product functionality.

## 3. In Scope

- Canonical reusable admin guard, preferably `requireAdmin`, implemented as a thin semantic wrapper over FEAT-007 `requireRole(ROLES.ADMIN)`.
- One minimal representative admin-protected endpoint:

```text
GET /admin/ping
```

- Route wiring proving the expected flow:

```text
authenticate -> requireAdmin -> admin handler -> response
```

- Safe authorization outcomes:
  - unauthenticated: `401 UNAUTHENTICATED`
  - authenticated zero-role: `403 FORBIDDEN`
  - authenticated USER-only: `403 FORBIDDEN`
  - authenticated ADMIN: allowed
  - authenticated USER+ADMIN: allowed
  - role repository/PostgreSQL failure: safe fail-closed 5xx, not ordinary `403`
- PostgreSQL-backed ADMIN assignment/removal immediacy with the same still-valid access token.
- Direct API bypass tests proving UI hiding is not an authorization boundary.
- Client spoofing resistance for body/query/header/token/admin-role claims.
- Unit, integration, PostgreSQL-backed, runtime smoke, security, and regression tests.

## 4. Out of Scope

FEAT-008 must not implement:

- Admin dashboard or admin UI.
- User-management CRUD.
- Role-management HTTP API.
- Grant-admin endpoint.
- Admin self-upgrade behavior.
- Moderation, subscription administration, financial/admin domain workflows, or other product admin features.
- Audit event persistence or emission; FEAT-009 owns auth/security audit events.
- Authentication/admin endpoint rate limiting; this remains a separate unresolved Phase 2 governance item.
- Permission engine, ABAC, tenant authorization, or policy engine.
- Default admin account, default admin credentials, hard-coded admin email/user ID, environment admin-email list, or bypass flags.
- Redis or in-memory admin authority.
- FEAT-009 or later Phase 2 behavior.

## 5. Admin Trust Model

ADMIN authority must come only from FEAT-007 PostgreSQL-backed RBAC context.

The implementation must not trust:

- `body.admin`
- `body.role`
- query `role` or `admin`
- `X-Admin`
- `X-Role`
- browser `localStorage`
- JWT `admin`, `role`, `roles`, `isAdmin`, or `permissions` claims
- hidden frontend controls

Canonical admin role:

```text
ADMIN
```

FEAT-008 must reuse FEAT-007 `ROLES.ADMIN` / `RoleCode`. It must not redefine role constants.

## 6. Representative Route Decision

FEAT-008 approves a single production-available but non-product diagnostic/foundation endpoint:

```text
GET /admin/ping
```

Canonical Express route composition must follow the current repository convention used by `healthRouter` and `authRouter`:

```text
server/app:
app.use(adminRouter)

adminRouter:
router.get("/admin/ping", authenticate, requireAdmin, handler)

final URL:
GET /admin/ping
```

The implementation must not mount `adminRouter` at `/admin` while also declaring `/admin/ping` inside the router, because that would create accidental `/admin/admin/ping` double-prefixing.

Expected successful response:

```json
{
  "status": "ok",
  "scope": "admin"
}
```

The endpoint exists only to prove the reusable admin authorization boundary. It must not expose sensitive system details, user lists, role lists, operational controls, internal DB state, financial data, or product-domain behavior.

Malformed persisted role behavior is inherited exactly from FEAT-007:

- Persisted roles `["ROOT"]` canonicalize to `[]`; ADMIN access is denied with `403 FORBIDDEN` after successful role lookup.
- Persisted roles `["ROOT", "ADMIN"]` canonicalize to `["ADMIN"]`; ADMIN access is allowed.
- Unknown role values never become trusted authority.
- Unknown role filtering is not a database/repository failure. Database/repository failure remains a separate safe 5xx case.

## 7. Dependencies

- FEAT-002: PostgreSQL identity/role persistence.
- FEAT-003: registration remains zero-role by default.
- FEAT-004: authenticated request context and strict role-free access tokens.
- FEAT-005: refresh sessions and safe token/log handling.
- FEAT-006: logout/session invalidation regression baseline.
- FEAT-007: canonical roles, RBAC context, `requireRole`, operational role provisioning, PostgreSQL authority, error taxonomy.

FEAT-008 blocks FEAT-009 final audit-event integration and FEAT-010 security integration gate.

## 8. Success Definition

FEAT-008 can pass QA only when the admin route is accessible to authenticated users with a server-side PostgreSQL `ADMIN` role and denied to every non-admin path with stable safe errors. It must preserve FEAT-007 role-free JWTs, PostgreSQL role authority, zero-role semantics, no public role management, and no FEAT-009/rate-limit scope creep.

## 9. Human Review Notes

- This spec intentionally chooses `GET /admin/ping` as the representative endpoint.
- It intentionally allows a thin `requireAdmin` wrapper for readability, but requires reuse of FEAT-007 logic.
- It intentionally keeps rate limiting separate.
- It intentionally does not create default admin users or credentials.
