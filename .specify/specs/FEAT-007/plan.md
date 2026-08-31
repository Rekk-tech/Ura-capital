# Implementation Plan: FEAT-007 RBAC Authorization Foundation

**Feature ID**: FEAT-007  
**Branch**: `N/A - repository is not initialized as git`  
**Date**: 2026-08-26  
**Spec**: `spec.md`  
**Status**: APPROVED

## Summary

Build the reusable RBAC foundation for Phase 2. FEAT-007 introduces canonical role constants/types, server-side role lookup, authorization context, deny-by-default role checks, idempotent canonical role seeding, and tests.

It must not implement FEAT-008 admin-specific guard/application behavior, public role management, audit event emission, rate limiting, or JWT role claims.

## Technical Context

**Language/Version**: TypeScript on Node.js LTS, preserving FEAT-001 through FEAT-006 baseline.  
**Backend**: Express modular monolith.  
**Primary Dependencies**: Existing Zod/shared contracts, Prisma/PostgreSQL, FEAT-004 auth middleware, FEAT-002 repository patterns.  
**Storage**: PostgreSQL authoritative Role/UserRole state.  
**Redis**: Not used for FEAT-007 durable role authority.  
**Testing**: Vitest, Supertest, PostgreSQL-backed integration tests, existing regression suites.  
**Target Platform**: `apps/api` with shared constants/types only when truly cross-boundary.

## Architecture Decisions

### Decision 1: Server-Side RBAC Authority

Authorization decisions load roles from PostgreSQL after authentication.

**Rationale**: Prevents role/admin spoofing and makes role changes effective without waiting for access-token expiry.

**Rejected**:

- JWT role claims as authority: rejected because FEAT-004 access tokens are minimal and role changes would be stale.
- Client-provided role/admin flags: rejected by server trust boundary.
- Redis/in-memory maps as durable authority: rejected by ADR-005.

### Decision 2: Existing FEAT-002 Schema Is Sufficient

Use `Role.name` as the canonical code and `UserRole` as the multi-role assignment join table.

**Rationale**: FEAT-002 already provides unique role names and unique user-role pairs.

**Implications**:

- No FEAT-007 schema migration is expected.
- If implementation finds an unavoidable schema gap, it must document the gap and preserve identity-only scope.

### Decision 3: Multi-Role Semantics

Users may have multiple roles. A required-any-role check passes when at least one required role exists in the server-derived role set.

### Decision 4: No Automatic Default Role in Registration

FEAT-007 will not mutate FEAT-003 registration to assign `USER`.

**Rationale**: That changes registration transaction semantics and requires explicit Human approval.

**Consequence**: Newly registered users may authenticate but have zero RBAC roles. Authentication is not `USER` membership; a role-protected endpoint requiring `USER` denies the user until a server-side role assignment exists.

### Decision 5: Idempotent Role Seeding Without Users

Canonical roles are created through an idempotent seed/bootstrap mechanism. Seed creates roles only and no privileged users.

### Decision 6: Explicit Operational Role Provisioning

FEAT-007 defines a server-side operator command/helper boundary for assigning canonical roles to existing users. It is not a public HTTP API.

**Rationale**: FEAT-008 needs a way to activate an admin-capable user in production, but FEAT-007 must not create default admin credentials or public role-management functionality.

**Implication**: Initial privileged-role provisioning is a prerequisite for FEAT-008 production activation. FEAT-009 will later audit these events.

## Constitution Check

The `.specify/memory/constitution.md` file is still a placeholder, so no ratified constitution gates can be enforced from that file.

Applied governance gates:

- Greenfield modular monolith: PASS.
- PostgreSQL durable source of truth: PASS.
- Prisma hidden behind repositories/controllers Prisma-free: PASS.
- Redis transient-only boundary: PASS.
- No role/admin client trust: PASS.
- No access-token role claims: PASS.
- No FEAT-008 scope creep: PASS.
- No audit/rate-limit scope creep: PASS.
- Operational role provisioning is server-side only: PASS.
- No fake validation evidence: PASS.
- Human approval before implementation: PASS.

## Proposed Source Areas

```text
apps/api/src/modules/auth/
  authorization.constants.ts
  authorization.types.ts
  authorization.service.ts
  authorization.middleware.ts
  role.repository.ts
  role.seed.ts

apps/api/tests/unit/
  authorization.service.test.ts
  authorization.middleware.test.ts
  role.seed.test.ts

apps/api/tests/integration/
  rbac.test.ts
  rbac-db.test.ts
```

Exact file names may follow the current implementation style.

## Data Model

FEAT-007 uses existing FEAT-002 models.

### Role

- `id`: durable primary key.
- `name`: unique canonical role code.
- `description`: optional.
- `createdAt`, `updatedAt`.

Required canonical role codes:

```text
USER
ADMIN
```

### UserRole

- `id`: durable primary key.
- `userId`: FK to User.
- `roleId`: FK to Role.
- `createdAt`.
- Unique `(userId, roleId)`.

Semantics:

- Multiple rows per user are allowed.
- Duplicate pairs are rejected.
- Role lookup returns a deterministic unique role-code list.
- Persisted role names are runtime-validated against the canonical allowlist before entering authorization context.
- Unknown persisted role names do not authorize and do not become trusted role context.

## Repository / Service Contracts

### Role Repository

Required conceptual methods:

- Find role by code.
- List role codes for a user.
- Ensure canonical roles exist idempotently.
- Assign role to user for seed/test/internal use.
- Check duplicate assignment behavior through PostgreSQL constraint.

### Authorization Service

Required conceptual methods:

- Build authorization context from authenticated user ID.
- Check whether a context has a role.
- Check whether a context has any required role.
- Produce deny-by-default outcomes for missing or failed role lookup.
- Validate persisted role strings against canonical `RoleCode`.
- Return unique role codes in lexical ascending order.

### Authorization Middleware / Primitive

Required conceptual behavior:

- Requires FEAT-004 authenticated context first.
- Loads server-derived roles.
- Allows required-role match.
- Denies missing required role with `403 FORBIDDEN`.
- Denies missing auth context with `401 UNAUTHENTICATED`.
- Denies role repository/PostgreSQL failure with a safe infrastructure/internal failure, not ordinary insufficient-role `403`.
- Does not trust client-provided role/admin values.

## API / Test Contract

FEAT-007 does not need a permanent production business endpoint.

Allowed verification approaches:

- Test-mounted Express route protected by generic RBAC middleware.
- Test-only route active only in test environment.
- Existing representative route if implementation can verify without exposing production diagnostics.

Any route used for verification must remain generic RBAC foundation behavior and must not become FEAT-008 admin business guard.

Permanent production diagnostic endpoints solely for RBAC testing are not approved.

## Environment and Seeding Strategy

- Role seed/bootstrap must run through an explicit command/helper/script or documented startup-safe mechanism.
- Seed is idempotent.
- Seed creates roles only, not users.
- No default admin credentials.
- Test/CI DB usage must remain isolated.
- Staging/production execution must be explicit and safe.

## Operational Provisioning Strategy

Implementation must provide or document an explicit server-side command/helper boundary for role assignment:

```text
role assign user=<existing user> role=<canonical RoleCode>
```

Required behavior:

- User must already exist.
- Role must be canonical and allowlisted.
- Assignment persists in PostgreSQL.
- Duplicate assignment is idempotent or safely rejected.
- No public HTTP endpoint or browser authority.
- No users, credentials, or privileged accounts are created.
- Logs are safe and suitable for later FEAT-009 audit integration.

## Validation Strategy

Implementation must provide evidence for:

- Lint.
- Typecheck.
- Build.
- Standard tests.
- PostgreSQL-backed DB tests.
- Prisma validation.
- Migration deploy/replay if a migration is introduced.
- Runtime/API smoke for authenticated/authorized/denied representative behavior if route wiring changes.
- Regression for FEAT-001 through FEAT-006.
- Runtime role-code validation and deterministic role ordering tests.
- DB outage/failure test proving access is denied without being misreported as normal `403` insufficient-role.

## Risks

- Accidentally implementing FEAT-008 admin guard/business endpoint.
- Trusting client role/admin claims or JWT role claims.
- Making role lookup failures permissive.
- Misreporting DB outage as ordinary insufficient-role denial.
- Trusting unknown persisted role strings.
- Silently changing registration default-role semantics.
- Creating default admin credentials.
- Adding Redis/in-memory durable role authority.
- Leaking raw database errors or sensitive auth material.

## Quality Gates

FEAT-007 cannot pass QA unless:

- Every acceptance criterion in `acceptance.md` passes or is explicitly waived by Human.
- Role authority is PostgreSQL-backed.
- Role checks deny by default.
- Client role/admin claims are ignored or rejected.
- No FEAT-008/admin/audit/rate-limit scope creep exists.
- Regression validation for FEAT-001 through FEAT-006 passes.
- `reports/implementation/phase-2/FEAT-007.md` exists and is truthful.
