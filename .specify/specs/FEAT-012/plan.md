# Plan: FEAT-012 Migration Reproducibility & Schema Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Planning Mode**: Specification only  
**Implementation**: Not started

## 1. Technical Approach

FEAT-012 should be implemented as a migration validation and governance hardening feature:

1. Document and standardize Prisma migration commands.
2. Add or extend validation scripts/tests only where needed for reproducibility and safety.
3. Validate fresh zero-state migration against isolated PostgreSQL.
4. Validate existing-schema upgrade with representative Phase 2 data.
5. Verify migration status, ordering, and drift/checksum safety.
6. Preserve FEAT-002 through FEAT-011 behavior with full regression.
7. Report evidence truthfully.

No product-domain schema or product behavior should be added.

## 2. Architecture Decisions

### Decision 1 - `migrate deploy` Is The Runtime Deployment Command

Selected:

- Use `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma` for deploy-style migration execution.

Rationale:

- ADR-003 selects Prisma migrations.
- `migrate deploy` is deterministic and suited for CI/staging/production-like environments.

Rejected:

- `prisma migrate dev` for CI/staging/production validation.
- `db push` as migration governance.

Implication:

- `migrate dev` may remain local-only if used by developers, but FEAT-012 evidence and QA rely on deploy/status.

### Decision 2 - Explicit Environment Configuration For QA/CI Evidence

Selected:

- Migration validation must pass database URLs explicitly through environment/CI configuration rather than relying on developer-local `.env`.

Rationale:

- Environment strategy requires CI determinism and safe test isolation.

Rejected:

- Validation that only works on one developer machine.

Implication:

- Implementation report must record target class and safe database identifier.

### Decision 3 - Forward-Fix Governance For Shared Environments

Selected:

- Shared/staging/production-like environments use forward-fix migrations, not reset or destructive rollback.

Rationale:

- Durable PostgreSQL data must be protected once migrations are applied.

Rejected:

- Editing applied migrations.
- Resetting shared databases to recover.

Implication:

- Rollback instructions must distinguish disposable test/local databases from shared environments.

### Decision 4 - No Product-Domain Schema

Selected:

- FEAT-012 may add validation/governance helpers but must not add Academy, Simulation, Community, Subscription, AI, or other product-domain tables.

Rationale:

- Human approved later features for constraint standards and domain-specific phases for concrete schemas.

Rejected:

- Using migration governance as a place to sneak in product schema.

Implication:

- Any product-domain migration is blocking scope creep.

## 3. Implementation Boundaries

Allowed implementation areas after Human approval:

- migration validation scripts/tests
- test DB guard extension
- CI workflow updates for migration validation if already within repo baseline
- documentation/reporting updates
- package scripts that expose validation commands

Disallowed implementation areas:

- product-domain Prisma models
- product APIs/UI
- auth behavior changes
- Redis health endpoint
- seed behavior
- FEAT-013 transaction/repository pattern implementation
- Phase 4 work

## 4. Migration Validation Strategy

Fresh zero-state validation:

```text
Create isolated PostgreSQL DB
Set DATABASE_URL and TEST_DATABASE_URL explicitly
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
```

Existing-schema validation:

```text
Create or restore DB at latest approved schema state
Insert representative Phase 2 rows
Run current migrate deploy
Run migrate status
Verify rows remain present and constraints still work
```

Implementation may automate this with tests/scripts, but manual evidence alone is insufficient if repeatable automated validation is feasible.

## 5. Test Strategy

Expected coverage:

- unit tests for unsafe database target detection
- integration tests or scripts for fresh migration
- integration tests or scripts for existing-schema preservation
- checks for migration status/up-to-date behavior
- checks for drift/destructive migration detection if helper is added
- regression tests for FEAT-002 through FEAT-011

Required validation:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
npm run test:redis
npm run guard:persistence
```

FEAT-012 may add a dedicated migration validation command. If added, it must run from repository root and be included in implementation/QA evidence.

## 6. CI/CD Baseline Expectations

CI should be able to validate migrations from a clean checkout using:

- safe CI environment variables
- isolated PostgreSQL service or database
- no developer-local `.env`
- no staging/production data

Staging/production migration governance must be documented even if deployment automation remains future work.

## 7. Risks

- Migration validation accidentally targets a non-test database.
- Existing-schema validation uses empty data and misses data-loss behavior.
- Drift/checksum checks are described but not executable.
- Wrapper scripts hide failed Prisma commands.
- FEAT-012 drifts into product-domain schema.

## 8. Done Criteria

FEAT-012 is ready for QA when:

- all tasks in `tasks.md` are complete or explicitly marked not applicable with rationale
- fresh and existing-schema migration evidence is recorded
- environment isolation rules are tested or otherwise independently verifiable
- acceptance criteria in `acceptance.md` are mapped in the implementation report
- validation evidence is current and truthful
- no product-domain schema or behavior is introduced
