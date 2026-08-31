# Implementation Plan: FEAT-008 Admin Authorization Guard

**Status**: APPROVED  
**Feature ID**: FEAT-008  
**Phase**: Phase 2 - Identity & Security  
**Created**: 2026-08-26

## Summary

Implement the admin authorization boundary by adding a canonical admin guard that reuses FEAT-007 RBAC primitives and wiring one minimal admin-protected endpoint, `GET /admin/ping`. The endpoint proves server-side ADMIN authorization without introducing admin product functionality.

Human has approved this spec package for implementation. Application code may be implemented only when FEAT-008 is separately handed to Antigravity.

## Technical Context

**Frontend**: React + TypeScript + Vite; no frontend implementation required for FEAT-008.  
**Backend**: Node.js + TypeScript + Express.  
**Database**: PostgreSQL via existing FEAT-002/FEAT-007 Prisma repositories.  
**ORM Boundary**: Prisma stays behind repositories; admin route/controller does not import Prisma.  
**Auth**: FEAT-004 authenticate middleware and strict role-free access tokens.  
**RBAC**: FEAT-007 `ROLES.ADMIN`, `RoleCode`, authorization context, `requireRole` / `requireAnyRole`, `assignRoleToExistingUser`.  
**Redis**: Not used for admin authority.  
**Validation**: Zod where external input exists; `GET /admin/ping` has no request body.  
**Testing**: Vitest, Supertest, PostgreSQL-backed tests, runtime smoke.  
**Observability**: Existing structured logs and sanitizer only; no FEAT-009 audit event emission.

## Architecture Decisions

### Decision 1: Thin Semantic Admin Guard

Selected: define `requireAdmin` as a thin wrapper over FEAT-007 `requireRole(ROLES.ADMIN)`, or use `requireRole(ROLES.ADMIN)` directly if that better matches code style.

Rationale: FEAT-007 already owns role lookup, context construction, runtime validation, error taxonomy, and fail-closed behavior. FEAT-008 should make admin intent clear without duplicating authorization logic.

Rejected alternatives:

- Duplicated `roles.includes("ADMIN")` checks in each handler: rejected because it fragments policy and weakens testability.
- Direct Prisma query in admin guard/controller: rejected by repository boundary and FEAT-007 authority model.
- Email/admin-ID allowlist: rejected as bypass-prone and not role-authoritative.

### Decision 2: Production Minimal `GET /admin/ping`

Selected: expose one minimal production route `GET /admin/ping`.

Rationale: FEAT-008 needs a representative admin-protected API boundary. A small ping endpoint gives QA/runtime a real route without adding admin domain behavior.

Rejected alternatives:

- Test-only route only: weaker proof for production route wiring.
- Admin dashboard/user-management route: out of scope and belongs to later product/admin features.

Implication: The endpoint must return only minimal safe data and must not disclose internals.

### Decision 3: PostgreSQL ADMIN Authority Only

Selected: ADMIN authority is current PostgreSQL `Role`/`UserRole` state loaded per FEAT-007.

Rationale: This preserves role-change immediacy and avoids stale JWT/admin flags.

Rejected alternatives:

- JWT role/admin claims: rejected by ADR-004 and FEAT-004/007.
- Redis/in-memory admin authority: rejected by ADR-005 and FEAT-007.
- Environment admin list: rejected because it bypasses durable role authority and auditability.

### Decision 4: Rate Limiting Remains Separate

Selected: FEAT-008 does not implement authentication/admin rate limiting.

Rationale: Human explicitly required rate limiting to remain separate unless approved. FEAT-010 remains a gate and must not introduce product behavior.

Implication: The unresolved rate-limit governance issue still needs a Human decision, likely a dedicated Phase 2 feature before FEAT-010.

## Proposed Source Areas

Expected implementation areas after approval:

```text
apps/api/src/modules/admin/
  admin.route.ts
  admin.controller.ts
  admin.guard.ts

apps/api/src/server.ts or app/router composition
apps/api/tests/unit/
apps/api/tests/integration/
apps/api/tests/smoke/
```

The file layout may adapt to existing module naming, but route composition is locked to the current repository convention: `createApp()` mounts `app.use(adminRouter)`, and `adminRouter` declares the full route path `router.get("/admin/ping", authenticate, requireAdmin, handler)`. Do not mount `app.use("/admin", adminRouter)` with an internal `/admin/ping` route, because that would create `/admin/admin/ping`.

## API Contract

### GET /admin/ping

Purpose: minimal representative admin-protected endpoint.

Request:

```text
Authorization: Bearer <valid access token>
```

No request body is required.

Success:

```http
200 OK
```

```json
{
  "status": "ok",
  "scope": "admin"
}
```

Failure examples:

```http
401 UNAUTHENTICATED
403 FORBIDDEN
500 INTERNAL_ERROR
```

All failures use the existing stable project error envelope.

Canonical route composition:

```text
createApp():
app.use(adminRouter)

admin.route.ts:
router.get("/admin/ping", authenticate, requireAdmin, adminController.ping)
```

## Data Model

No new data model or migration is expected.

FEAT-008 consumes existing FEAT-002/FEAT-007 models:

- `User`
- `Role`
- `UserRole`

PostgreSQL remains the durable source of truth for ADMIN assignment.

## Guard Flow

```text
GET /admin/ping
  -> authenticate
  -> requireAdmin
       -> FEAT-007 requireRole(ROLES.ADMIN)
       -> FEAT-007 role lookup from PostgreSQL
       -> FEAT-007 runtime RoleCode validation
  -> admin ping handler
```

`requireAdmin` must be direct approved use of `requireRole(ROLES.ADMIN)` or a thin semantic wrapper delegating to it. It must not perform a second Prisma role query, duplicate FEAT-007 role lookup logic, redefine `ADMIN`, or trust request body/query/header/token role state.

## Test Strategy

### Unit Tests

- `requireAdmin` delegates to FEAT-007 `requireRole(ROLES.ADMIN)` or behaves equivalently through a thin wrapper.
- Unauthenticated request maps to 401.
- Zero-role and USER-only map to 403.
- ADMIN and USER+ADMIN are allowed.
- Repository/DB failure propagates to safe 5xx handling, not 403, specifically through a valid-token path where authentication succeeds and FEAT-007 role lookup fails inside admin authorization.
- Spoofed client admin values do not affect guard behavior.

### API Integration Tests

- `GET /admin/ping` without auth returns 401.
- Valid zero-role user returns 403.
- Valid USER-only user returns 403.
- Valid ADMIN user returns 200 with safe minimal body.
- Valid USER+ADMIN user returns 200.
- Spoofed headers/query/body cannot elevate a non-admin caller.
- JWT with role/admin claim remains rejected by FEAT-004 strict validation.
- Direct API request bypassing UI remains denied.

### PostgreSQL-Backed Tests

- Seed canonical roles.
- Register/login user with no roles; same token denied.
- Grant ADMIN through FEAT-007 operational provisioning; same token allowed.
- Remove ADMIN in PostgreSQL; same token denied.
- Unrelated users are unaffected by role changes.
- Persisted `["ROOT"]` canonicalizes to `[]` and receives 403.
- Persisted `["ROOT", "ADMIN"]` canonicalizes to `["ADMIN"]` and receives 200.
- Unknown role values never become trusted authority.
- DB/repository failure fails closed safely.

### Runtime Smoke

- Health.
- Register/login regular user.
- `GET /admin/ping` denied.
- Operator/server-side provisioning grants ADMIN.
- Same access token allowed.
- ADMIN removed.
- Same access token denied.
- No token refresh, re-login, or JWT role mutation occurs in the grant/removal sequence.

## Validation Commands

Implementation must run and report:

- `npm run clean`
- `npm run lint`
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:db`
- Fresh isolated PostgreSQL migration deploy/status if route or DB test setup changes.
- Runtime/API smoke for admin route grant/removal behavior.

## Security Review Checklist

- No client role/admin trust.
- No JWT role/admin authority.
- No hard-coded admin email/user ID.
- No environment admin list.
- No default admin account or credentials.
- No public grant-admin/self-upgrade endpoint.
- No Prisma imports in admin controller/guard.
- No Redis or in-memory admin authority.
- No leakage of roles, role IDs, tokens, secrets, raw DB errors, or stack traces.
- No audit event emission or rate limiting scope creep.

## Dependencies and Ordering

1. FEAT-007 must remain Human-approved DONE.
2. FEAT-008 spec must be Human-approved.
3. Antigravity may implement only after approval.
4. FEAT-009 remains blocked until FEAT-008 passes QA and Human Final Gate.

## Risks

- Accidentally creating a public admin/role-management API.
- Duplicating RBAC logic instead of using FEAT-007 primitives.
- Trusting JWT/client admin claims.
- Hiding DB outage as ordinary 403.
- Satisfying DB-failure coverage with a handler throw, unrelated DB failure, or authentication failure instead of FEAT-007 role lookup failure.
- Creating a production diagnostic endpoint that leaks internals.
- Forgetting role removal immediacy tests.

## Quality Gates

FEAT-008 cannot pass QA unless:

- Admin authorization is server-side and PostgreSQL-backed.
- `GET /admin/ping` has correct 401/403/allowed behavior.
- Role grant/removal is reflected immediately with same token.
- No public role management, default admin, audit emission, rate limiting, or admin product behavior is introduced.
- FEAT-001 through FEAT-007 regressions pass.
