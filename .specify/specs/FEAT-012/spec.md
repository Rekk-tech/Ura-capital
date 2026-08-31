# Specification: FEAT-012 Migration Reproducibility & Schema Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Scope**: Migration workflow validation and governance only

## 1. User Stories

### Story 1 - Fresh Migration Confidence

As a platform engineer, I need a clean PostgreSQL database to migrate successfully from zero-state so future environments can be created reproducibly.

Independent test:

- Create a fresh isolated PostgreSQL database.
- Run the approved migration deploy command.
- Confirm migration status reports the database is up to date.

### Story 2 - Existing Schema Safety

As a QA reviewer, I need to prove migrations preserve existing approved identity/security rows so Phase 3 does not corrupt Phase 2 data.

Independent test:

- Create or use an existing-schema database with representative users, credentials, roles, refresh sessions, and auth audit rows.
- Apply current migrations.
- Verify representative rows remain present and usable.

### Story 3 - Environment-Safe Migration Execution

As an operator, I need migration commands to be environment-governed so local, test, CI, staging, and production data cannot be mixed or accidentally mutated.

Independent test:

- Migration/test validation accepts isolated test database targets.
- Migration/test validation rejects development, staging, production, or production-like targets when running in test/CI contexts.
- Validation does not require local `.env` values.

### Story 4 - Migration Governance

As an architect, I need applied migrations to be immutable and reviewable so destructive changes, checksum drift, and unordered migrations are caught before they damage data.

Independent test:

- Edited-applied migrations, destructive operation patterns, and unsafe rollback/reset instructions are detected through review or validation.
- Implementation report records any limitations truthfully.

## 2. Functional Specification

### 2.1 Approved Migration Commands

FEAT-012 must standardize validation around:

```text
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
npx prisma validate --schema=apps/api/prisma/schema.prisma
```

Implementation may add wrapper scripts or test helpers only if they preserve the approved commands and improve reproducibility. Wrappers must not hide failures or silently target developer-local `.env`.

### 2.2 Environment Rules

Local:

- May use `.env` for developer convenience.
- Migration validation evidence for QA must state the exact target class.
- Destructive reset is allowed only for disposable local databases.

Test:

- Must use `NODE_ENV=test` or equivalent explicit test context.
- Must use isolated database names, schemas, or service instances.
- Must fail fast if the database target does not clearly identify as test/CI/ephemeral.

CI:

- Must provision isolated PostgreSQL.
- Must not require a developer-local `.env`.
- Must use CI-provided safe test configuration.

Staging:

- Must use dedicated staging PostgreSQL.
- Must require protected secrets/configuration.
- Must run deploy/status with recorded evidence.
- Must not use destructive reset.

Production:

- Must use dedicated production PostgreSQL.
- Must require protected secrets/configuration and Human/release approval.
- Must prefer forward-fix migrations.
- Must not run reset/rollback commands without explicit Human emergency approval.

### 2.3 Fresh Zero-State Validation

Implementation must validate a fresh isolated PostgreSQL database from no application tables to current schema by running migration deploy and status.

Required evidence:

- safe database identifier
- migration command used
- migration list/count applied
- status output summary
- no skipped or simulated migration result unless clearly marked not verified

### 2.4 Existing-Schema Upgrade Validation

Implementation must validate compatibility with the latest approved schema state.

Representative data should include, at minimum:

- user
- credential
- role
- user-role assignment
- refresh session
- auth security audit record

Validation must confirm representative rows survive current migration deployment and remain queryable. Because FEAT-011 introduced no schema migration, the approved existing baseline is the current Phase 2/FEAT-011 schema state.

### 2.5 Test Database Isolation Guard

The existing test database guard must protect database-backed tests and migration validation. It must reject targets that appear to be:

- local development durable database
- staging database
- production database
- missing or ambiguous database name
- connection string containing production-like markers

Guard errors must not expose credentials or raw full connection URLs.

### 2.6 Non-Destructive Migration Review

Migration review must identify:

- `DROP TABLE`, `DROP COLUMN`, `DROP INDEX`, or destructive enum/status changes
- column renames that Prisma may represent as drop/add
- nullable to non-nullable changes without backfill/default strategy
- uniqueness additions that can fail on existing duplicate data
- raw SQL blocks requiring manual reasoning
- data backfills or data migrations

Any destructive or data-loss risk requires explicit Human approval before implementation/deployment.

### 2.7 Ordering And Checksum Integrity

Migration directories must remain ordered and immutable once applied to any shared environment.

Implementation must define or validate:

- deterministic migration ordering
- no edited-applied migration drift
- checksum/status verification through Prisma migration metadata where available
- failure handling when drift is detected

### 2.8 Rollback And Forward-Fix Governance

Shared/staging/production-like environments must use forward-fix governance:

- create a new migration to correct a bad applied migration
- do not edit applied migrations
- do not reset shared databases
- do not drop data to recover unless Human explicitly approves an emergency procedure

Disposable local/test databases may be recreated for validation when clearly isolated.

### 2.9 Regression Boundary

FEAT-012 must preserve:

- FEAT-002 identity schema and repository boundaries
- FEAT-003 registration/password behavior
- FEAT-004 login/access-token behavior
- FEAT-005 refresh session rotation/revocation
- FEAT-006 logout/session invalidation
- FEAT-007 RBAC behavior
- FEAT-008 admin authorization guard
- FEAT-009 auth audit semantics
- FEAT-010A rate limiting
- FEAT-011 persistence guard

## 3. Explicit Non-Goals

FEAT-012 must not implement:

- product-domain tables
- product-domain APIs or UI
- seed data
- repository/transaction pattern changes owned by FEAT-013
- constraint standards owned by FEAT-014
- Redis health owned by FEAT-015
- product audit persistence owned by later approved features
- Phase 4 Academy behavior

## 4. Security And Data Integrity Requirements

- No migration validation may target production, staging, or durable local development data in test/CI mode.
- Raw connection strings and credentials must not appear in test failures or reports.
- Destructive migration risk must be visible before deploy.
- Database constraints from Phase 2 must remain enforced after migration validation.
- No Redis/JWT/client state may become a migration authority.

## 5. Acceptance Mapping

- Fresh zero-state migration: AC-001, AC-002, AC-003
- Existing-schema upgrade: AC-004, AC-005, AC-006
- Environment migration rules: AC-007, AC-008, AC-009, AC-010
- Test DB isolation guard: AC-011, AC-012
- Non-destructive review: AC-013, AC-014, AC-015
- Rollback/forward-fix governance: AC-016
- Ordering/checksum integrity: AC-017, AC-018
- Regression and reporting: AC-019, AC-020, AC-021, AC-022

## 6. Human Review Notes

This spec is intentionally migration-governance focused. It does not ask Antigravity to create product-domain schema. If implementation discovers an existing migration defect requiring data-loss remediation, Antigravity must stop and request Human/Codex review before changing approved schema semantics.
