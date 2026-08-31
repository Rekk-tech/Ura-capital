# Feature Specification: RBAC Authorization Foundation

**Feature ID**: FEAT-007  
**Feature Branch**: `N/A - repository is not initialized as git`  
**Created**: 2026-08-26  
**Status**: APPROVED  
**Input**: Human approved FEAT-006 and requested planning-only spec package for FEAT-007.

## User Scenarios & Testing

### User Story 1 - Load Server-Side Roles for an Authenticated User (Priority: P1)

As the backend, I can derive a trusted authorization context for an authenticated user by loading roles from server-side persistence.

**Why this priority**: FEAT-008 and later protected product features cannot rely on client-provided role/admin state.

**Independent Test**: Create a user and role assignments in an isolated PostgreSQL test database, authenticate through FEAT-004 context, load authorization context, and verify returned roles come from `Role`/`UserRole` only.

**Acceptance Scenarios**:

1. **Given** an authenticated active user with assigned roles, **When** authorization context is built, **Then** the context includes server-derived role codes.
2. **Given** the request includes body/query/header role or admin fields, **When** authorization context is built, **Then** those client values are ignored.
3. **Given** a role assignment changes in PostgreSQL, **When** a later authorization check runs with the same still-valid access token, **Then** the changed server-side role state is reflected.

### User Story 2 - Evaluate Role Requirements Safely (Priority: P1)

As an API implementer, I can protect a route or service action with reusable RBAC primitives that allow users with required roles and deny users without them.

**Why this priority**: Later features need a small, reliable authorization foundation rather than duplicating role checks.

**Independent Test**: Mount or invoke a representative role-protected behavior with users that have no role, one required role, multiple roles, and wrong roles; verify the decision is based on any required role match.

**Acceptance Scenarios**:

1. **Given** an authenticated user has the required role, **When** a role-protected behavior is evaluated, **Then** the request is allowed.
2. **Given** an authenticated user lacks the required role, **When** a role-protected behavior is evaluated, **Then** the request is denied with `403 FORBIDDEN`.
3. **Given** a route accepts any of multiple roles, **When** the user has one of them, **Then** the request is allowed.

### User Story 3 - Fail Closed on Missing or Broken Authorization State (Priority: P1)

As a security reviewer, I can verify authorization denies access when role lookup or role data cannot be trusted.

**Why this priority**: Authorization failure must never become permissive due to database errors, malformed role data, or missing assignments.

**Independent Test**: Simulate role lookup failure, malformed role records, missing user roles, missing authentication, and database unavailability; verify safe denial and no sensitive leakage.

**Acceptance Scenarios**:

1. **Given** no authenticated user context exists, **When** a role-protected behavior is called, **Then** the request returns `401 UNAUTHENTICATED`.
2. **Given** role lookup fails or PostgreSQL is unavailable, **When** authorization is required, **Then** the request is denied without falling back to allow.
3. **Given** role data is malformed or not canonical, **When** authorization is evaluated, **Then** the role is ignored or rejected safely.

### User Story 4 - Seed and Preserve Canonical Roles (Priority: P2)

As an operator or QA reviewer, I can rely on canonical roles existing reproducibly in each environment without creating privileged accounts.

**Why this priority**: Role checks need stable identifiers, but seeding must not introduce default admin credentials or hidden privilege.

**Independent Test**: Run the role seed/bootstrap twice against an isolated database and verify canonical roles exist exactly once, no admin user is created, and duplicate `UserRole` assignments are rejected by the database.

**Acceptance Scenarios**:

1. **Given** a fresh database with FEAT-002 schema, **When** role seed/bootstrap runs, **Then** `USER` and `ADMIN` roles exist.
2. **Given** role seed/bootstrap runs repeatedly, **When** roles are inspected, **Then** it is idempotent and does not create duplicates.
3. **Given** a user is assigned the same role twice, **When** persistence is attempted, **Then** PostgreSQL rejects duplicate user-role pairs.

## Edge Cases

- Access tokens remain role-free. Role claims added by a client or attacker must not be trusted.
- Role names are canonical codes, not display labels.
- Unknown role codes are not equivalent to any known role.
- Duplicate user-role assignments are rejected by the database, not only by application checks.
- Multi-role users are allowed; authorization succeeds when any required role matches.
- Role lists must be deterministic, unique, and canonical. The required order is lexical ascending by role code, for example `[ADMIN, USER]`.
- Role lookup failure, DB outage, deleted user, inactive user, malformed role data, and missing assignment must deny by default.
- Fail closed does not always mean `403`: missing/invalid authentication is `401`; insufficient role after successful trusted lookup is `403`; role repository/PostgreSQL failure is a safe infrastructure/internal failure such as existing `500 INTERNAL_ERROR` unless a project-approved `503 SERVICE_UNAVAILABLE` exists.
- Persisted `Role.name` values must be runtime-validated against the canonical allowlist before entering authorization context. Unknown strings such as `SUPER_ADMIN`, `ROOT`, or any non-canonical role must not authorize requests.
- Error responses must not reveal raw Prisma/database errors, stack traces, DB credentials, token contents, or role internals beyond a safe authorization category.
- FEAT-007 may use test-only representative protected behavior, but must not ship admin business routes or public diagnostic endpoints.

## Requirements

### Functional Requirements

- **FR-001**: The feature MUST define centralized canonical role identifiers `USER` and `ADMIN`, or a Human-approved equivalent.
- **FR-002**: Canonical role identifiers MUST be server-controlled constants/types and MUST NOT be inferred from UI labels or client input.
- **FR-003**: The feature MUST use FEAT-002 `Role` and `UserRole` persistence as the source of truth for role assignments.
- **FR-004**: The feature MUST NOT add roles, admin flags, permissions, or authorization decisions into access-token claims.
- **FR-005**: The feature MUST build authorization context from FEAT-004 authenticated user identity plus server-side role lookup.
- **FR-006**: Authorization context MAY include safe authenticated user fields and role codes, but MUST NOT include password, credential, token, refresh-session, secret, or database internals.
- **FR-007**: Client-provided role/admin values from request body, query, headers, or token payload MUST be ignored or rejected and MUST NOT influence authorization decisions.
- **FR-008**: The feature MUST define repository/service boundaries for role lookup, user-role assignment lookup, and role membership checks.
- **FR-009**: Controllers MUST NOT import Prisma directly or own transaction internals.
- **FR-010**: The feature MUST support multi-role users.
- **FR-011**: Duplicate user-role assignments MUST be prevented by the existing PostgreSQL unique constraint.
- **FR-012**: Authorization checks MUST allow access when the authenticated user has any required role for an any-role policy.
- **FR-013**: Authorization checks MUST deny authenticated users without the required role using `403 FORBIDDEN`.
- **FR-014**: Authorization checks MUST return `401 UNAUTHENTICATED` when authentication context is missing or invalid.
- **FR-015**: Authorization MUST fail closed when role lookup fails, PostgreSQL is unavailable, role data is malformed, or required role data is missing.
- **FR-016**: Role changes in PostgreSQL MUST affect later authorization checks without waiting for access-token expiry.
- **FR-017**: The feature MUST define an idempotent role seed/bootstrap strategy for canonical roles.
- **FR-018**: Role seeding MUST NOT create default admin credentials or privileged users.
- **FR-019**: FEAT-007 MUST NOT silently modify FEAT-003 registration to assign a default `USER` role.
- **FR-020**: If implementation needs role assignments for tests, it MUST use repository/test/bootstrap mechanisms, not public role-management APIs.
- **FR-021**: PostgreSQL MUST remain authoritative for durable role assignment; Redis MUST NOT be introduced as durable role authority.
- **FR-022**: Redis, if mentioned, may only be future cache consideration and MUST NOT be used in FEAT-007 without Human-approved scope change.
- **FR-023**: The feature MUST distinguish authentication failure from authorization failure through stable project error envelopes.
- **FR-024**: Responses/logs MUST NOT expose access tokens, refresh tokens, password hashes, auth secrets, raw Prisma errors, DB credentials, stack traces, or sensitive role internals.
- **FR-025**: The feature MAY include a representative role-protected test route or test-mounted route only for validating generic RBAC foundation behavior.
- **FR-026**: FEAT-007 MUST NOT implement FEAT-008 admin business guard, admin APIs, admin dashboard, role-management UI, permission/ABAC engine, audit event emission, rate limiting, tenant authorization, default admin credentials, or later Phase 2 behavior.
- **FR-027**: The feature MUST include unit, integration, PostgreSQL-backed, security, and regression tests covering the accepted RBAC foundation.
- **FR-028**: FEAT-001 through FEAT-006 regression validation MUST remain green.
- **FR-029**: The implementation report MUST map completed work to FEAT-007 requirements, tasks, tests, validation, limitations, security notes, and acceptance criteria truthfully.
- **FR-030**: Role lookup MUST return unique, runtime-validated canonical role codes in lexical ascending order.
- **FR-031**: Unknown or malformed persisted role codes MUST NOT become trusted authorization context and MUST NOT satisfy `requireRole` or `requireAnyRole`.
- **FR-032**: Role repository/PostgreSQL failure MUST deny access but MUST NOT be misreported as ordinary insufficient-role `403`; it must use a safe existing infrastructure/internal error category.
- **FR-033**: FEAT-007 MUST define a server-side explicit operational provisioning boundary for assigning canonical roles to existing users.
- **FR-034**: Operational role provisioning MUST require an existing target user, canonical allowlisted role, PostgreSQL persistence, safe duplicate handling, safe logs, and no browser/client/public HTTP authority.
- **FR-035**: Operational role provisioning MUST create no users, no credentials, no default admin account, and no automatic privileged assignment.

### Key Entities

- **RoleCode**: Centralized canonical code such as `USER` or `ADMIN`.
- **Role**: FEAT-002 PostgreSQL role catalog row, using `Role.name` as the canonical code.
- **UserRole**: FEAT-002 PostgreSQL assignment linking a user to a role.
- **AuthenticatedRequestContext**: FEAT-004 context derived from verified access-token `sub` and server-side user lookup.
- **AuthorizationContext**: Authenticated context plus server-derived role codes.
- **RoleRepository Boundary**: Persistence boundary for canonical role and user-role lookup/assignment primitives.
- **AuthorizationService Boundary**: Service layer for building authorization context and evaluating role policies.
- **Authorization Primitive**: Minimal reusable helper/middleware for role requirement checks.

## Authorization Context Contract

Conceptual shape:

```text
auth.user -> FEAT-004 authenticated safe user context
auth.roles -> server-derived canonical role codes
```

The implementation may attach this to `req.auth`, `req.authorization`, or another existing safe request context pattern, but it must preserve FEAT-004 authenticated user semantics, keep role values server-derived, avoid sensitive internals, and remain easy for FEAT-008 to consume.

Roles in authorization context must be:

- server-derived
- runtime-validated canonical `RoleCode` values
- unique
- lexical ascending by role code
- never sourced from client role/admin state

## Error Contract

Unauthenticated:

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required",
    "requestId": "..."
  }
}
```

Authenticated but missing required role after successful trusted role lookup:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions",
    "requestId": "..."
  }
}
```

Exact messages may follow existing project constants, but status and category must remain stable and safe.

Role repository/PostgreSQL failure:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Authorization could not be completed",
    "requestId": "..."
  }
}
```

If the project already has an approved service-unavailable contract at implementation time, `503 SERVICE_UNAVAILABLE` may be used instead. The failure must not be reported as ordinary `403 FORBIDDEN`, because that would hide infrastructure failure as user insufficiency.

Malformed persisted authorization state must fail closed with a safe internal/authorization-state failure or ignore the malformed role and deny if no valid required role remains. It must never allow access.

## Role Seeding Strategy

FEAT-007 must define an idempotent seed/bootstrap path for canonical roles:

- Create `USER` and `ADMIN` roles if missing.
- Safe to rerun.
- Does not create users.
- Does not create default admin credentials.
- Does not assign roles to existing users unless explicitly invoked by a test/bootstrap mechanism.
- Works in local/test/CI/staging/production with environment-appropriate execution controls.

## Operational Role Provisioning

FEAT-007 must define a server-side explicit operator command/helper boundary for assigning canonical roles to existing users.

Conceptual operation:

```text
role assign user=<existing user identifier> role=<canonical RoleCode>
```

The exact syntax is implementation-specific. The boundary must:

- require explicit invocation
- require an existing user
- require a canonical allowlisted role
- persist assignment in PostgreSQL
- handle duplicate assignments idempotently or by safe duplicate rejection
- run with explicit controls in local/test/staging/production
- expose no public role-management HTTP API
- accept no browser/client authority
- create no users, credentials, default admin account, or automatic privileged assignment
- produce safe logs only
- be designed so FEAT-009 can later audit role-management events

Initial privileged-role provisioning through this boundary is a prerequisite for FEAT-008 production activation.

## Default Role Decision

FEAT-007 does not change successful registration behavior from FEAT-003. It does not automatically assign a `USER` role during registration.

Rationale:

- Adding `User + Credential + default UserRole` atomicity changes FEAT-003 registration semantics.
- Human has not yet explicitly approved that integration change.
- RBAC foundation can be independently tested using seeded roles and test/internal role assignments.
- Under current FEAT-007 semantics, a newly registered user may authenticate successfully and still have zero RBAC roles.
- Authentication is not equivalent to `USER` membership.
- An endpoint requiring `USER` must deny an authenticated zero-role user until a server-side role assignment exists.

Future option:

- Human may approve a later change to assign `USER` atomically during registration, either as a FEAT-007 revision or a dedicated integration feature.

## Success Criteria

- **SC-001**: 100% of role-protected tests derive roles from PostgreSQL, not client input.
- **SC-002**: 100% of tested users with a required role are allowed by generic RBAC primitives.
- **SC-003**: 100% of tested users without a required role receive `403 FORBIDDEN`.
- **SC-004**: 100% of unauthenticated requests to role-protected behavior receive `401 UNAUTHENTICATED`.
- **SC-005**: 100% of role lookup failure tests deny access safely.
- **SC-006**: 100% of tested duplicate user-role assignments are rejected by PostgreSQL.
- **SC-007**: 100% of tested role changes are reflected in later authorization decisions without requiring a new access token.
- **SC-008**: No FEAT-008 admin business route, audit emission, rate limiting, role claims in JWT, or default admin credential exists.
- **SC-009**: FEAT-001 through FEAT-006 regressions remain green.
- **SC-010**: 100% of tested unknown persisted role codes fail runtime validation and cannot authorize.
- **SC-011**: 100% of tested role repository/PostgreSQL failures deny access without being reported as ordinary insufficient-role `403`.
- **SC-012**: Operational role provisioning is defined and creates no users, credentials, default admin account, or automatic privileged assignment.

## Assumptions

- Existing FEAT-002 Role/UserRole schema is sufficient; no schema migration is expected unless implementation discovers a documented constraint gap.
- `Role.name` is the canonical role code field.
- Users can hold multiple roles.
- Role assignment APIs for humans/admins are outside FEAT-007.
- Authentication endpoint rate limiting remains a separate Human governance decision.
