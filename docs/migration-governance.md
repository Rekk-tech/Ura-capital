# Aura Capital Migration Governance

**Status**: FEAT-012 implementation baseline  
**Scope**: Prisma/PostgreSQL migration execution, validation, and review rules

## Approved Commands

Deploy-style migration validation and shared-environment execution use:

```text
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
npx prisma validate --schema=apps/api/prisma/schema.prisma
```

`prisma db push` is not a substitute for migration governance.

## Environment Rules

Local:

- May use `.env` for developer convenience.
- Destructive reset is allowed only for disposable local databases.
- Shared data must not be reset to recover from a migration problem.

Test:

- Must run with explicit test configuration.
- Must use an isolated PostgreSQL database whose name clearly contains a test marker.
- Must run the migration guard before migration validation.

CI:

- Must provision an isolated PostgreSQL service/database.
- Must use CI-provided safe environment variables.
- Must not depend on a developer-local `.env`.

Staging:

- Must use dedicated staging PostgreSQL and protected configuration.
- Must run deploy/status and preserve evidence.
- Must not use reset.

Production:

- Must use dedicated production PostgreSQL and protected configuration.
- Must require release/Human approval.
- Must use forward-fix migrations for recovery.
- Must not edit applied migrations or reset data stores.

## Guard Rules

Run before migration validation:

```text
npm run guard:migration
```

The guard rejects:

- missing database URLs
- ambiguous database names
- development, staging, production, or production-like targets
- execution outside test/CI validation context
- blocking destructive migration SQL

Guard output must not expose raw database credentials.

## Migration Risk Review

Blocking risks require Human approval before implementation/deployment:

- `DROP TABLE`
- `DROP COLUMN`
- `DROP INDEX`
- destructive enum/status removal

Review risks must be called out in implementation evidence:

- column/table rename
- nullable to required changes
- new uniqueness constraints
- data backfill or mutation
- raw SQL requiring manual reasoning

## Applied Migration Integrity

Applied migrations are immutable once used by any shared environment.

If drift is detected:

- do not edit the applied migration to hide the drift
- create a new forward-fix migration
- preserve the drift/status evidence
- request Human review if data loss is possible

Disposable local/test databases may be recreated for validation when clearly isolated.
