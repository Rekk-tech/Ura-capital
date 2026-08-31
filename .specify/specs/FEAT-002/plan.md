# Implementation Plan: Identity Persistence & Auth Configuration

**Feature ID**: FEAT-002  
**Branch**: `N/A - repository is not initialized as git`  
**Date**: 2026-08-25  
**Spec**: `spec.md`  
**Status**: PROPOSED FOR HUMAN REVIEW

## Summary

Build the identity-scoped persistence and auth configuration foundation for Phase 2. This feature introduces only the durable storage, repository boundaries, migration strategy, test isolation rules, and startup configuration validation required by later identity/security features.

FEAT-002 does not implement public registration, login, token issuance, refresh-token rotation, logout, RBAC enforcement, admin guard, audit event behavior, password hashing, email verification, or product-domain persistence.

## Technical Context

**Language/Version**: TypeScript on Node.js LTS, preserving the FEAT-001 baseline.

**Primary Dependencies**: Express API foundation, Zod for configuration validation, Prisma for identity-scoped database access and migrations.

**Storage**: PostgreSQL for durable identity state. Redis is not required for FEAT-002 durable behavior.

**Testing**: Vitest for unit tests, database-backed integration tests for migration/repository behavior when an isolated test database is available, and existing FEAT-001 validation categories.

**Target Platform**: API workspace in the npm workspaces monorepo.

**Project Type**: Modular monolith web platform with `apps/api`, `apps/web`, and `packages/shared`.

**Performance Goals**: Configuration validation completes before the API serves traffic; identity uniqueness and referential integrity are enforced by the database.

**Constraints**:

- Identity persistence only; no Phase 3 product-domain persistence.
- PostgreSQL is the source of truth for durable auth/session state.
- Prisma is hidden behind repositories.
- No fallback auth/JWT secrets.
- No hard-coded secrets.
- Test and CI database usage must be isolated.
- No user-facing auth behavior from later Phase 2 features.

## Architecture Decisions

### Decision 1: Identity-Scoped Prisma Foundation in FEAT-002

Use Prisma migrations and schema only for identity/security prerequisite tables.

**Rationale**: ADR-004 requires durable auth/session state in Phase 2. Deferring all identity persistence to Phase 3 would block registration, login, refresh sessions, roles, and auditability.

**Alternatives Considered**:

- Wait until Phase 3 for all database work: rejected because Phase 2 cannot implement secure auth without durable identity/session state.
- Add full product-domain schema now: rejected as Phase 3 scope creep.

**Implications**:

- FEAT-002 migration must be narrowly reviewed for identity-only scope.
- Phase 3 remains responsible for academy, simulation, community, subscription, AI, and broader database patterns.

### Decision 2: Repository Boundary Before Auth Behavior

Define repositories for identity persistence before controllers/services consume them.

**Rationale**: ADR-003 and code standards require Prisma isolation behind repositories. Later Phase 2 features can then use stable interfaces instead of coupling to database internals.

**Alternatives Considered**:

- Direct Prisma access in controllers/services: rejected by ADR-003 and code standards.
- Shared package domain logic: rejected because `packages/shared` must not become a domain logic dumping ground.

**Implications**:

- Repository interfaces should be explicit and minimal.
- Future services can orchestrate auth behavior without owning raw query details.

### Decision 3: Startup Auth Configuration Validation Now

Validate auth/database/security configuration before auth endpoints exist.

**Rationale**: The legacy fallback-secret weakness must be eliminated before login/token behavior is added.

**Alternatives Considered**:

- Add secrets later with login: rejected because FEAT-004 would inherit uncertain startup behavior.
- Use fallback development secrets: rejected by governance and security rules.

**Implications**:

- Safe test/local dummy values may exist in `.env.example`.
- Production-like environments must not accept unsafe cookie or secret defaults.

### Decision 4: Test Database Isolation as a Feature Requirement

Make test database isolation a first-class acceptance boundary.

**Rationale**: Identity tests mutate security-sensitive records. Tests must not run against local, staging, or production data by accident.

**Alternatives Considered**:

- Rely on developer caution: rejected as unsafe and unverifiable.
- Use only mocks: rejected because database constraints and migrations must be verified.

**Implications**:

- Integration tests must identify test database usage clearly.
- CI must use isolated database services or documented safe substitutes.

## Constitution Check

The `.specify/memory/constitution.md` file is still a placeholder, so no ratified constitution gates can be enforced from that file.

Applied governance from project context:

- Greenfield rebuild: PASS.
- Modular monolith first: PASS.
- PostgreSQL durable source of truth: PASS.
- Prisma behind repositories: PASS.
- Redis transient-only boundary: PASS.
- No fallback auth/JWT secrets: PASS.
- Server trust boundary preserved: PASS.
- No scope creep into later Phase 2 features: PASS.
- No fake validation evidence: PASS.
- Human approval before implementation: PASS.

## Project Structure

### Documentation

```text
.specify/specs/FEAT-002/
  requirement.md
  spec.md
  plan.md
  tasks.md
  acceptance.md
```

### Proposed Source Areas

```text
apps/api/
  prisma/
    schema.prisma
    migrations/
  src/
    infrastructure/
      config/
      database/
    modules/
      users/
      auth/
    shared/
      validation/
  tests/
    integration/
    unit/
packages/shared/
  src/
    constants/
    schemas/
    types/
```

The exact source paths may follow the implemented FEAT-001 structure, but the architectural boundaries must remain:

- Prisma/database client belongs in infrastructure/database.
- User/auth persistence belongs behind module repositories.
- Controllers and services may not import Prisma client internals directly.
- Shared package contains cross-boundary contracts/constants only, not domain persistence logic.

## Data Model

FEAT-002 defines identity-scoped database models only. Field names are conceptual and may be adapted to project naming conventions during implementation, but required constraints must remain.

### User

Purpose: Durable identity root for future auth and product ownership.

Required data:

- Durable primary identifier.
- Normalized identity identifier, initially normalized email.
- Display name or profile-safe name if already needed by foundation.
- Status field for future account lifecycle, without implementing lifecycle behavior.
- Created timestamp.
- Updated timestamp.

Required constraints:

- Primary key.
- Unique normalized identity identifier.
- Non-null created/updated timestamps.

### Credential

Purpose: Persistence boundary for future password credentials.

Required data:

- Durable primary identifier.
- User reference.
- Credential type or provider type for future extensibility.
- Password hash field or reserved equivalent field for FEAT-003.
- Password hash metadata fields only if needed for FEAT-003 compatibility.
- Created timestamp.
- Updated timestamp.

Required constraints:

- Foreign key to user.
- At most one active password credential per user unless explicitly justified.
- No plaintext password field.

### Role

Purpose: Server-owned role catalog for future RBAC.

Required data:

- Durable primary identifier.
- Role name or code.
- Description or metadata only if needed.
- Created timestamp.
- Updated timestamp.

Required constraints:

- Unique role name or code.

### UserRole

Purpose: Relationship assigning roles to users.

Required data:

- User reference.
- Role reference.
- Created timestamp.

Required constraints:

- Foreign key to user.
- Foreign key to role.
- Unique user-role pair.

### RefreshSession

Purpose: Durable prerequisite for future refresh-token rotation, revocation, and logout.

Required data:

- Durable primary identifier.
- User reference.
- Stored refresh-token verifier/hash placeholder, or equivalent future-safe token binding field.
- Session status or revocation fields.
- Expires timestamp.
- Created timestamp.
- Updated timestamp.
- Revoked timestamp if structurally needed.

Required constraints:

- Foreign key to user.
- Expiry must be represented.
- Durable state must live in PostgreSQL, not only Redis.

### AuthSecurityAuditRecord

Purpose: Optional structural prerequisite for FEAT-009 audit behavior.

Required data if included:

- Durable primary identifier.
- Optional user reference.
- Event type.
- Request correlation identifier if available.
- Safe metadata field.
- Created timestamp.

Required constraints:

- Optional foreign key to user.
- Metadata must not require storing secrets, plaintext credentials, access tokens, or refresh tokens.

## Repository Boundaries

Required repository boundaries:

- User repository: identity lookup and persistence primitives.
- Credential repository: credential record lookup/persistence primitives without hashing behavior.
- Role repository: role and user-role persistence primitives without RBAC enforcement behavior.
- Refresh-session repository: persistence primitives without rotation/revocation business behavior.
- Audit repository: persistence primitives only if FEAT-002 includes audit storage structure.

Rules:

- Repositories may depend on Prisma/database client.
- Services/controllers must depend on repositories or service interfaces, not Prisma internals.
- Repositories must expose domain-safe return shapes.
- Repositories must avoid returning secret-like fields unless explicitly needed by a future service.

## Configuration Contract

FEAT-002 must define and validate the following configuration categories:

- `DATABASE_URL`: required for non-mocked database runtime.
- Auth access-token secret: required; no fallback allowed.
- Auth refresh-token secret: required if separate from access-token secret; no fallback allowed.
- Access-token TTL: required or defaulted only through documented non-secret config; must remain within 5-15 minutes.
- Refresh-session/token lifetime: required or documented non-secret default for later refresh features.
- Refresh cookie name: documented non-secret value.
- Refresh cookie `HttpOnly`: must be fixed true when cookies are issued later.
- Refresh cookie `Secure`: must be true for production-like environments.
- Refresh cookie `SameSite`: must be explicitly configured or safely defaulted.
- Auth rate-limit configuration placeholders: optional in FEAT-002, but if introduced they must be validated and documented because Phase 2 requires endpoint rate limiting later.

Secret policy:

- `.env.example` may contain safe dummy values only.
- `.env` remains local-only and uncommitted.
- Secret values are never logged.
- Missing or invalid required config fails before serving traffic.

## Migration Strategy

Implementation must:

- Use Prisma migrations for identity-scoped schema changes.
- Keep migrations reproducible from a clean checkout.
- Avoid hand-editing generated migration outputs except through approved Prisma workflow.
- Document migration commands in the implementation report or project docs.
- Include rollback or reset guidance for local/test only if supported by existing project tooling.
- Avoid any migration for academy, simulation, community, subscription, AI, or other product domains.

## Test Database Isolation Strategy

Implementation must:

- Use an isolated test database, isolated schema, or equivalent clean test database strategy for database-backed tests.
- Refuse to run destructive test setup when `NODE_ENV` is not `test`.
- Refuse to run database tests against known local/staging/production database names or URLs when detectable.
- Ensure CI uses safe test database configuration.
- Ensure no test requires production secrets.
- Clean test data deterministically or rebuild the isolated schema/database per run.
- Document any manual setup needed to run database-backed tests.

## Interface Contracts

FEAT-002 does not expose public product auth endpoints.

Internal contracts to define:

- Repository method contracts for identity persistence.
- Configuration validation contract for auth/database/security settings.
- Migration/test setup contract for isolated database validation.

Public API routes are out of scope except existing FEAT-001 health/runtime behavior.

## Validation Strategy

Implementation must provide evidence for:

- Prisma schema/migration review.
- Identity migration application in isolated test database, or a documented equivalent if database service is unavailable.
- User uniqueness constraint verification.
- Referential integrity verification for dependent identity records.
- Repository boundary tests or code review evidence.
- Missing auth secret config failure.
- Missing/invalid database config failure.
- Invalid token/cookie config failure.
- Test DB isolation safety checks.
- Search/review for hard-coded/fallback auth secrets.
- Lint pass.
- Typecheck pass.
- Test pass.
- Build pass.

## Risks

- Over-expanding into Phase 3 database foundation.
- Implementing user-facing auth behavior too early.
- Storing password-related data in a way that constrains FEAT-003 before Argon2id is explicitly decided.
- Leaking Prisma details into controllers/services.
- Allowing test setup to mutate non-test databases.
- Adding Redis durability or auth behavior without a PostgreSQL source of truth.

## Quality Gates

FEAT-002 cannot pass QA unless:

- Every acceptance criterion in `acceptance.md` is PASS or explicitly waived by Human.
- Implementation remains within FEAT-002 scope.
- `reports/implementation/phase-2/FEAT-002.md` exists and maps requirements, tasks, tests, validation, limitations, and acceptance.
- Lint, typecheck, test, and build evidence is reported truthfully.
- No P0 security issue exists.
