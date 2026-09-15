# FEAT-031 Plan

## Implementation Approach

1. Start from tag `phase-4-approved`.
2. Implement exact approved Simulation foundation schema.
3. Use actual migration timestamp naming: `<timestamp>_feat031_simulation_foundation`.
4. Add repository interfaces and Prisma implementations.
5. Extend repository factory/UoW container.
6. Add fresh DB migration validation.
7. Add upgrade validation from Phase 4 approved schema with representative rows.
8. Add live PostgreSQL constraint tests for every AC.
9. Run canonical validation.
10. Write `reports/implementation/phase-5/FEAT-031.md`.

## Expected Files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/<timestamp>_feat031_simulation_foundation/migration.sql`
- `apps/api/src/modules/simulation/*`
- `apps/api/src/infrastructure/database/repository-factory.ts`
- `apps/api/tests/integration/simulation-foundation-db.test.ts`
- `reports/implementation/phase-5/FEAT-031.md`

## Non-Goals

No API behavior beyond repository/test scaffolding, no order execution, no UI, no Redis authority, no product audit persistence, no real-money or brokerage behavior.
