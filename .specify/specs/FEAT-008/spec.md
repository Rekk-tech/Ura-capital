# Specification: FEAT-008 Admin Authorization Guard

**Status**: APPROVED  
**Feature ID**: FEAT-008  
**Phase**: Phase 2 - Identity & Security  
**Created**: 2026-08-26

## User Stories & Testing

### US1 - Reuse RBAC Foundation for Admin Guard (Priority: P1)

As a backend developer, I need a canonical admin guard so future admin endpoints can consistently require the server-derived `ADMIN` role without duplicating authorization logic.

**Independent Test**: Invoke the guard with mocked FEAT-007 authorization primitives and verify it delegates to `requireRole(ROLES.ADMIN)` or equivalent rather than reimplementing role lookup.

**Acceptance Scenarios**:

1. **Given** FEAT-007 exposes canonical `ROLES.ADMIN`, **When** FEAT-008 defines admin authorization, **Then** it reuses that role constant and does not redefine `ADMIN`.
2. **Given** FEAT-007 exposes reusable `requireRole`, **When** the admin guard is created, **Then** the guard delegates to `requireRole(ROLES.ADMIN)` or an equivalent thin wrapper.
3. **Given** an admin route handler exists, **When** the route is wired, **Then** its flow is `authenticate -> admin guard -> handler` at final URL `GET /admin/ping`.

### US2 - Enforce Admin API Boundary (Priority: P1)

As the system owner, I need direct API access to admin-protected behavior denied to non-admin users, even when a caller bypasses frontend UI controls.

**Independent Test**: Call `GET /admin/ping` with no auth, zero-role auth, USER-only auth, ADMIN auth, USER+ADMIN auth, and spoofed admin fields.

**Acceptance Scenarios**:

1. **Given** no access token is supplied, **When** `GET /admin/ping` is requested, **Then** the response is `401 UNAUTHENTICATED`.
2. **Given** a valid access token for a zero-role user, **When** `GET /admin/ping` is requested, **Then** the response is `403 FORBIDDEN`.
3. **Given** a valid access token for a USER-only user, **When** `GET /admin/ping` is requested, **Then** the response is `403 FORBIDDEN`.
4. **Given** a valid access token for an ADMIN user, **When** `GET /admin/ping` is requested, **Then** the request succeeds.
5. **Given** a valid access token for a USER+ADMIN user, **When** `GET /admin/ping` is requested, **Then** the request succeeds.
6. **Given** a non-admin caller adds admin-looking headers, query params, body fields, or JWT claims, **When** `GET /admin/ping` is requested, **Then** those spoofed values do not grant access.

### US3 - Preserve PostgreSQL Admin Authority and Immediacy (Priority: P1)

As a security reviewer, I need admin authorization to reflect current PostgreSQL role assignments rather than stale token or client state.

**Independent Test**: Register and log in a user, use the same valid access token across PostgreSQL role grant and removal, and verify admin access changes immediately.

**Acceptance Scenarios**:

1. **Given** a valid token for a USER-only or zero-role user, **When** the user requests `GET /admin/ping`, **Then** access is denied.
2. **Given** PostgreSQL grants `ADMIN` to that same user, **When** the same still-valid token requests `GET /admin/ping`, **Then** access is allowed without token refresh or re-login.
3. **Given** PostgreSQL removes `ADMIN` from that same user, **When** the same still-valid token requests `GET /admin/ping`, **Then** access is denied again.
4. **Given** another user is assigned or removed from ADMIN, **When** this user requests admin access, **Then** unrelated users are unaffected.

### US4 - Fail Closed and Avoid Scope Creep (Priority: P1)

As a QA/security owner, I need admin authorization failures to be safe, stable, and narrow so FEAT-008 cannot accidentally become a broad admin product feature.

**Independent Test**: Simulate DB/repository failure, malformed persisted roles, route search, log search, and source search for bypass patterns.

**Acceptance Scenarios**:

1. **Given** role repository/PostgreSQL lookup fails, **When** admin authorization is required, **Then** the request fails closed with a safe 5xx and is not misreported as ordinary `403`.
2. **Given** malformed persisted role names exist, **When** admin authorization is evaluated, **Then** FEAT-007 approved runtime validation behavior applies: `["ROOT"]` canonicalizes to `[]` and is denied with `403 FORBIDDEN`; `["ROOT", "ADMIN"]` canonicalizes to `["ADMIN"]` and is allowed.
3. **Given** source and routes are reviewed, **When** FEAT-008 is complete, **Then** there is no public role-management API, self-upgrade route, default admin credential, audit emission, rate limiting, permission engine, ABAC, tenant authorization, or later feature behavior.

## Requirements

- **FR-001**: FEAT-008 MUST define a canonical reusable admin guard boundary, preferably `requireAdmin`.
- **FR-002**: The admin guard MUST reuse FEAT-007 `ROLES.ADMIN` and the FEAT-007 generic role authorization primitive; it MUST NOT duplicate role lookup/authorization logic.
- **FR-003**: The admin guard MUST require a FEAT-004 authenticated request context before role authorization runs.
- **FR-004**: The admin guard MUST derive ADMIN authority only from FEAT-007 server-side authorization context backed by PostgreSQL `Role`/`UserRole`.
- **FR-005**: The implementation MUST expose exactly one representative admin-protected endpoint for this feature: `GET /admin/ping`.
- **FR-006**: `GET /admin/ping` MUST use the current repository route convention: `server/app` mounts `app.use(adminRouter)`, and `adminRouter` declares `router.get("/admin/ping", authenticate, requireAdmin, handler)`. The implementation MUST NOT create `/admin/admin/ping`.
- **FR-007**: Successful `GET /admin/ping` MUST return exactly the minimal safe response `{ "status": "ok", "scope": "admin" }` and no additional user, role, token, database, or infrastructure fields.
- **FR-008**: Unauthenticated admin route requests MUST return `401 UNAUTHENTICATED`.
- **FR-009**: Authenticated zero-role admin route requests MUST return `403 FORBIDDEN`.
- **FR-010**: Authenticated USER-only admin route requests MUST return `403 FORBIDDEN`.
- **FR-011**: Authenticated ADMIN admin route requests MUST be allowed.
- **FR-012**: Authenticated USER+ADMIN admin route requests MUST be allowed.
- **FR-013**: Client-provided body/query/header/admin-role values MUST NOT influence admin authorization.
- **FR-014**: JWT admin/role/roles/isAdmin/permissions claims MUST remain prohibited by FEAT-004 strict access-token validation and MUST NOT become admin authority.
- **FR-015**: Direct API requests by non-admin users MUST be denied even if frontend UI would normally hide admin controls.
- **FR-016**: Role repository/PostgreSQL failure MUST fail closed with safe 5xx or approved service-unavailable category and MUST NOT be converted to ordinary insufficient-role `403`. The required test path is: valid access token -> authentication succeeds -> admin guard performs FEAT-007 role lookup -> role repository throws or DB is unavailable -> request is denied with safe 5xx. Handler/controller artificial throws, unrelated database failures, or authentication failures do not satisfy this requirement.
- **FR-017**: Malformed persisted role state MUST follow FEAT-007 approved filtering behavior and MUST NOT grant admin access unless a valid canonical `ADMIN` role remains after filtering. Persisted roles `["ROOT"]` canonicalize to `[]` and must receive `403 FORBIDDEN`; persisted roles `["ROOT", "ADMIN"]` canonicalize to `["ADMIN"]` and must be allowed. Unknown role values never become trusted authority.
- **FR-018**: PostgreSQL MUST remain the durable source of ADMIN assignment truth.
- **FR-019**: ADMIN assignment in PostgreSQL MUST affect the next authorization check with the same still-valid access token.
- **FR-020**: ADMIN removal in PostgreSQL MUST affect the next authorization check with the same still-valid access token.
- **FR-021**: FEAT-008 MUST reuse FEAT-007 server-side operational provisioning for tests/bootstrap and MUST NOT introduce public role-granting behavior.
- **FR-022**: No hard-coded admin email, hard-coded admin user ID, environment admin list, in-memory admin allowlist, Redis admin authority, fallback admin behavior, or bypass flag may exist.
- **FR-023**: The feature MUST NOT create default admin accounts, users, credentials, or automatic privileged assignment.
- **FR-024**: Admin controllers/handlers MUST NOT import Prisma directly; persistence access remains behind FEAT-007 repositories/services.
- **FR-025**: FEAT-008 MUST NOT implement FEAT-009 audit event persistence/emission or authentication/admin rate limiting.
- **FR-026**: Authorization responses/logs MUST NOT expose full role sets, role IDs, raw JWTs, refresh tokens, secrets, credentials, password hashes, raw Prisma errors, DB credentials, stack traces, or full authorization payloads.
- **FR-027**: Unit, integration, PostgreSQL-backed, runtime smoke, security, and regression tests MUST cover the approved admin guard behavior.
- **FR-028**: FEAT-001 through FEAT-007 regression validation MUST remain green.
- **FR-029**: The implementation report MUST truthfully map completed work, tests, validation, limitations, security notes, and acceptance criteria.

## Admin Context Contract

FEAT-008 may attach no new durable state. It consumes the FEAT-007 authorization context:

```text
req.user -> authenticated FEAT-004 user
req.auth.roles -> server-derived FEAT-007 RoleCode[]
```

The admin guard authorizes only when the runtime-validated canonical role list contains `ADMIN`.

## Error Taxonomy

| Case | Required Result |
|---|---|
| Missing/invalid authentication | `401 UNAUTHENTICATED` |
| Authenticated zero-role | `403 FORBIDDEN` |
| Authenticated USER-only | `403 FORBIDDEN` |
| Authenticated ADMIN | Allowed |
| Authenticated USER+ADMIN | Allowed |
| Role repository/PostgreSQL failure | Safe 5xx or approved service-unavailable, not ordinary `403` |
| Persisted roles `["ROOT"]` | Canonical result `[]`; successful lookup followed by `403 FORBIDDEN` |
| Persisted roles `["ROOT", "ADMIN"]` | Canonical result `["ADMIN"]`; allowed |

403 responses must use a safe generic insufficient-permission message and must not reveal the caller's full role set or required internal policy details. Unknown role filtering is not treated as infrastructure failure. True repository/PostgreSQL failure is a separate safe 5xx case.

## Scope Guardrails

FEAT-008 is an authorization boundary feature only. It is not an admin product feature. The representative endpoint must remain minimal and must not expose product data or operational mutation.

## Assumptions

- `GET /admin/ping` is acceptable as a minimal non-product foundation route.
- Route composition follows the existing app convention: `app.use(adminRouter)` and `router.get("/admin/ping", authenticate, requireAdmin, handler)`.
- FEAT-007 `assignRoleToExistingUser` remains the approved server-side operational provisioning boundary for granting ADMIN during tests/bootstrap.
- Existing error envelope conventions and logging sanitizer remain sufficient.
- Authentication endpoint rate limiting will be handled by a separate Human-approved Phase 2 feature or governance update.

## Success Criteria

- **SC-001**: 100% of admin-protected route tests derive ADMIN authority from server-side PostgreSQL role state.
- **SC-002**: 100% of unauthenticated admin route tests return `401 UNAUTHENTICATED`.
- **SC-003**: 100% of zero-role and USER-only admin route tests return `403 FORBIDDEN`.
- **SC-004**: 100% of ADMIN and USER+ADMIN admin route tests succeed.
- **SC-005**: 100% of spoofed client role/admin inputs fail to elevate privileges.
- **SC-006**: ADMIN grant/removal is reflected on the next request using the same still-valid access token, with no token refresh, no re-login, and no JWT role modification.
- **SC-007**: No public role-management, self-upgrade, default admin credential, audit emission, rate limiting, or admin product behavior is introduced.
- **SC-008**: Required validation suite and FEAT-001 through FEAT-007 regressions pass.
