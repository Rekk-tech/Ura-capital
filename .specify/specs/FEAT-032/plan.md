# FEAT-032 Plan

## Implementation Approach

1. Build authenticated asset catalog read service.
2. Build authenticated scenario snapshot read service.
3. Add strict route params for scenario key and positive integer cycle.
4. Add safe DTOs with `simulated: true`.
5. Add read-only regression tests proving no state mutation.
6. Run canonical validation and write implementation report.

## Expected Files

- `apps/api/src/modules/simulation/*asset*.ts`
- `apps/api/src/modules/simulation/*market*.ts`
- `apps/api/src/modules/simulation/simulation.routes.ts`
- `apps/api/tests/integration/simulation-market-read.test.ts`
- `reports/implementation/phase-5/FEAT-032.md`
