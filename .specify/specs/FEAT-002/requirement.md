# Requirement: FEAT-002 Identity Persistence & Auth Configuration

**Status**: PROPOSED FOR HUMAN REVIEW  
**Created**: 2026-08-25  
**Owner**: Codex as Planner + Architect + QA/QC Governance Owner  
**Implementation Agent**: Antigravity after Human approval  
**Phase**: Phase 2 - Identity & Security

## Source Context

This requirement is derived from:

- `docs/project-overview.md`
- `docs/architecture-context.md`
- `docs/final-technology-decisions.md`
- `docs/environment-strategy.md`
- `docs/adrs/ADR-002-monorepo-structure.md`
- `docs/adrs/ADR-003-postgresql-and-prisma.md`
- `docs/adrs/ADR-004-authentication-token-strategy.md`
- `docs/adrs/ADR-005-redis-responsibility.md`
- `docs/code-standards.md`
- `docs/ai-workflow-rules.md`
- `docs/progress-tracker.md`
- `docs/phase-2-feature-decomposition.md`

Human review decisions for Phase 2:

- FEAT-002 through FEAT-010 decomposition is approved.
- Email verification is out of scope for Phase 2.
- Password hashing algorithm is decided in FEAT-003, with Argon2id preferred.
- Authentication endpoint rate limiting must be addressed during Phase 2, but not in FEAT-002 unless configuration placeholders are required.
- FEAT-010 is a formal Phase 2 Security Integration Gate and must not introduce new product functionality.

## Problem

Phase 2 cannot safely implement registration, login, token issuance, refresh sessions, logout, roles, admin authorization, or authentication audit events until the backend has a durable identity persistence foundation and validated auth/security configuration.

FEAT-001 created the engineering foundation. FEAT-002 must now establish the smallest approved identity-scoped PostgreSQL/Prisma foundation needed by later Phase 2 features while avoiding Phase 3 product-domain persistence.

The current risk to close is architectural ambiguity:

- Where identity data lives.
- Which identity records require database constraints.
- Which persistence boundaries later auth features must use.
- Which auth configuration values are required at startup.
- How local/test/CI/staging/production database isolation is protected.
- How Prisma is isolated behind repositories instead of leaking into controllers/services.

## Goal

Define and implement the identity persistence and auth configuration foundation required for later Phase 2 features.

FEAT-002 is successful when the repository has:

- Identity-scoped Prisma/PostgreSQL schema and migration baseline.
- Repository boundaries for future user, credential, role, refresh-session, and optional audit persistence.
- Startup validation for required auth/database/security configuration.
- Test database isolation expectations that prevent accidental local/staging/production mutation.
- QA-ready evidence that no hard-coded auth secrets or fallback auth/JWT secrets exist.

## In Scope

- Prisma setup for identity-scoped persistence inside the API workspace.
- PostgreSQL migration strategy for identity tables only.
- Database models for:
  - Users.
  - Credential persistence boundary.
  - Roles.
  - User-role assignments.
  - Refresh-session persistence prerequisite.
  - Authentication/security audit persistence prerequisite if structurally required.
- Repository interfaces and implementation boundaries that isolate Prisma from controllers and services.
- Environment variables and validation rules required now for:
  - Database connection.
  - Auth/access-token secret presence.
  - Refresh-token secret presence if separate from access-token secret.
  - Access-token TTL range.
  - Refresh-token TTL or session lifetime range.
  - Refresh cookie security defaults.
  - Auth rate-limit configuration placeholders if required for Phase 2 consistency.
- `.env.example` updates with safe dummy values only.
- Test/CI database isolation rules and validation tests.
- Documentation updates required to explain migrations, identity-scoped persistence, and configuration.
- Unit/integration tests needed to verify FEAT-002 boundaries.
- Implementation report mapping tasks, tests, validation, and acceptance criteria.

## Out of Scope

- Public registration endpoint.
- Login endpoint.
- Access-token issuance.
- Access-token verification middleware.
- Refresh-token rotation behavior.
- Refresh-token reuse detection behavior.
- Logout behavior.
- RBAC enforcement middleware.
- Admin guard behavior.
- Authentication audit event emission behavior.
- Password hashing algorithm implementation, except for an interface/contract placeholder if needed by repository boundaries.
- Email verification.
- Account lockout.
- Authentication endpoint rate-limit enforcement.
- Product-domain persistence for academy, simulation, community, subscriptions, AI, or admin product features.
- Production deployment.
- Data migration from legacy prototype files.

## Stakeholders

- Human/Product Owner: approves the FEAT-002 spec package before implementation.
- Codex: specifies and later performs independent QA/QC.
- Antigravity: implements after Human approval.
- Future Phase 2 features: depend on the identity persistence and config contracts.
- Future QA reviewers: verify no scope creep into later auth behavior.

## Primary User Need

As a future auth feature implementer, I need a durable, constrained, and safely configured identity persistence foundation so registration, login, sessions, roles, and audit events can be built without redefining storage or weakening security.

## Key Constraints

- Greenfield rebuild remains the governing strategy.
- Modular monolith and npm workspaces structure from FEAT-001 must remain intact.
- PostgreSQL is the durable source of truth.
- Prisma must be isolated behind repositories.
- Redis may not be used as durable auth/session storage.
- No hard-coded secrets.
- No fallback auth/JWT secrets.
- Startup must fail when required auth or database configuration is missing or invalid.
- Database constraints must protect identity uniqueness and referential integrity.
- Tests and CI must not mutate local, staging, or production data.
- No application behavior from FEAT-003 through FEAT-010 may be implemented in FEAT-002.

## Assumptions

- FEAT-001 has Human Final Gate approval and is the accepted repository baseline.
- FEAT-002 may introduce identity-scoped database infrastructure before Phase 3 because ADR-004 requires durable refresh-session state and Phase 2 depends on users/roles.
- The broad cross-domain database foundation still belongs to Phase 3.
- User-facing auth routes arrive in later Phase 2 features.
- Argon2id remains the preferred password hashing baseline for FEAT-003, but FEAT-002 does not implement password hashing.

