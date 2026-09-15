# FEAT-040 Plan

## Execution Plan

1. Review approved specs, implementation reports, QA reports, checkpoints, and governance state for FEAT-031 through FEAT-039.
2. Create independent fresh and upgrade PostgreSQL QA databases.
3. Run Prisma validate, migrate deploy, and migrate status for fresh and upgrade paths.
4. Run the canonical validation suite and all Simulation-specific test suites.
5. Execute runtime/API E2E flows for lifecycle, orders, valuation, rate limiting, authorization, and UI where applicable.
6. Inspect schema, migrations, Redis usage, audit boundaries, public API surface, and Phase 6/7 absence.
7. Produce `reports/qa/phase-5/PHASE-5-QA.md` with explicit PASS / CONDITIONAL PASS / FAIL and defect ownership mapping.

## Mandatory Validation

- Fresh DB migration validation.
- Existing-schema upgrade validation from approved Phase 4 baseline.
- PostgreSQL-backed Simulation tests.
- Redis-backed rate-limit/boundary tests.
- Frontend Simulation critical journey if FEAT-038 introduced UI.
- Canonical guards: persistence, migration, boundary, audit-governance, seed-safety.

## No Implementation

FEAT-040 does not implement fixes. Any discovered defect must be mapped to the owning feature and revalidated after correction.
