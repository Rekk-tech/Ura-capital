# Plan: FEAT-014 Core Domain Constraint Baseline

**Status**: APPROVED FOR IMPLEMENTATION  
**Planning Mode**: Specification only  
**Implementation**: Complete; ready for QA

## 1. Technical Approach

FEAT-014 should establish constraint governance as a reusable Phase 3 baseline:

1. Review existing approved Prisma schema and Phase 2/3 persistence behavior.
2. Produce a concise constraint standards document for future domain features.
3. Add validation that proves the standards against existing approved schema and/or dedicated isolated test fixtures.
4. Confirm application validation remains complementary and cannot replace PostgreSQL constraints.
5. Confirm FEAT-012 migration governance remains intact.
6. Run full FEAT-002 through FEAT-013 regression.
7. Record evidence in `reports/implementation/phase-3/FEAT-014.md`.

## 2. Architecture Decisions

### Decision 1 - Standards Before Product Schema

Selected:

- FEAT-014 defines reusable constraint standards only.
- Product-domain tables are deferred to their owning later features.

Rationale:

- Human explicitly approved Phase 3 as shared data foundation, not product-domain schema creation.
- Future domains need a consistent constraint baseline before adding durable product models.

Rejected:

- Creating Academy, Simulation, Community, Subscription, or AI tables in FEAT-014.
- Creating placeholder product tables only to demonstrate constraints.

Implication:

- Implementation must prove standards through existing approved schema or test-only fixtures, not production product migrations.

### Decision 2 - PostgreSQL Is Final Integrity Authority

Selected:

- Application validation improves request quality, while PostgreSQL constraints enforce durable invariants.

Rationale:

- Code standards and ADR-003 require database constraints for integrity.
- Pre-checks alone cannot prevent concurrent duplicate or relationship races.

Rejected:

- Application-validation-only uniqueness, required-field, FK, or enum enforcement.

Implication:

- Later features must include DB-level constraints for durable invariants and tests that prove them.

### Decision 3 - No Global Soft Delete

Selected:

- FEAT-014 does not establish a global soft-delete convention.
- Soft delete is a domain-specific later decision.

Rationale:

- Deletion semantics affect retention, privacy, auditability, and query behavior differently per domain.

Rejected:

- Adding `deletedAt` everywhere by default.

Implication:

- Later domain specs must explicitly choose restrict/cascade/set-null/archive/soft-delete behavior.

### Decision 4 - Explicit Deletion Policies

Selected:

- Every relationship must document deletion policy.
- Restrict/no-action is the default for independently meaningful records.
- Cascade and set-null require domain rationale.

Rationale:

- Silent default deletion behavior is a data-loss risk.

Rejected:

- Implicit ORM defaults without review.

Implication:

- Future schema reviews must check every relation policy.

## 3. Implementation Boundaries

Allowed after Human approval:

- Documentation such as `docs/data-constraint-standards.md`.
- Constraint validation tests using existing approved schema.
- Test-only PostgreSQL fixtures/helpers that do not create product-domain migrations.
- Static checks or guard extensions for prohibited schema/constraint patterns where practical.
- Implementation report.

Disallowed:

- Product-domain Prisma models or migrations.
- Academy, Simulation, Community, Subscription, AI, or placeholder product tables.
- Product APIs or UI.
- Global soft-delete implementation.
- Destructive migrations without explicit Human approval.
- Seed workflow changes.
- Redis health implementation.
- Product audit table implementation.
- FEAT-015, FEAT-016, FEAT-017, FEAT-018, or Phase 4 behavior.

## 4. Proposed Source Areas

Implementation may choose final names, but likely documentation/test areas include:

```text
docs/data-constraint-standards.md
apps/api/tests/unit/
apps/api/tests/integration/
apps/api/tests/helpers/
scripts/
reports/implementation/phase-3/FEAT-014.md
```

Any Prisma schema or migration edits must be justified by an approved constraint correction to existing schema only. Product-domain schema remains prohibited.

## 5. PostgreSQL Validation Strategy

Use an isolated PostgreSQL database and FEAT-012 migration workflow:

```text
Set DATABASE_URL and TEST_DATABASE_URL to isolated test database
npm run guard:migration
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
npm run test:db
```

Required evidence:

- Fresh migration succeeds.
- Existing approved rows remain compatible.
- UUID primary keys are present and valid.
- `NOT NULL` constraints reject missing required values.
- unique and composite unique constraints reject duplicates.
- foreign key constraints reject invalid references.
- deletion policies are reviewed and verified where existing schema or test fixtures allow.
- constraint errors are safely handled or sanitized in test/report output.

## 6. Static/Guard Strategy

Static validation should focus on patterns that can be detected deterministically:

- New prohibited product-domain models in Prisma schema.
- Use of `db push` as governance.
- Unapproved destructive migration patterns through FEAT-012 guard.
- Missing or undocumented deletion policy in changed relation definitions where practical.
- Runtime fallback to non-PostgreSQL durable persistence through FEAT-011 guard.

Static validation must avoid broad false positives against documentation, reports, generated files, or approved test fixtures.

## 7. Test Strategy

Expected coverage:

- Unit tests for standards/rule classification if implemented as machine-readable checks.
- PostgreSQL-backed tests for representative constraint enforcement.
- Migration compatibility tests for FEAT-002 through FEAT-013 schema.
- Regression tests for auth/security, persistence guard, migration guard, repository boundary guard, DB, and Redis suites.

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
npm run guard:migration
npm run guard:boundary
```

If FEAT-014 adds a dedicated constraint guard command, QA must run it independently and it must be included in implementation evidence.

## 8. Migration Impact

Expected migration impact:

- No product-domain migrations.
- No destructive migrations.
- No global soft-delete migration.

Permitted only with explicit justification:

- Non-destructive correction to existing approved schema constraint metadata.
- Test-only setup structures outside application migrations.

Any destructive/data-loss migration requires explicit Human approval before implementation.

## 9. Risks

- A standards document without live PostgreSQL evidence would be too weak for Phase 3.
- Overly strict global rules could block legitimate future domain designs.
- Test-only fixtures could accidentally become product schema if implemented through application migrations.
- Constraint tests could overfit identity/security schema and miss future-domain needs.
- Static guards could be too broad or too narrow.

## 10. Done Criteria

FEAT-014 is ready for QA when standards are documented, constraint categories are classified, prohibited patterns and exceptions are defined, live PostgreSQL evidence proves representative constraints, migration compatibility is verified, FEAT-002 through FEAT-013 regressions remain green, no product-domain schema or behavior is introduced, and `reports/implementation/phase-3/FEAT-014.md` truthfully maps evidence to AC-001 through AC-032.
