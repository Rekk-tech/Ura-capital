# FEAT-032 Implementation Report: Asset Universe & Market Snapshot Read Model

Feature: FEAT-032
Phase: Phase 5 - Simulation Engine
Planning Owner: Codex
Implementation Owner: Codex - Human-authorized temporary implementation owner
Target QA Reviewer: Phase-level / Human compensating review
Status: IMPLEMENTATION COMPLETE
Self-Verification: PASS
QA Independence: REDUCED

## Scope

Implemented only the FEAT-032 read-model surface for the Phase 5 Simulation Engine:

- Authenticated asset catalog read route.
- Authenticated scenario/cycle market snapshot read route.
- Safe DTO projection for fixed simulated equities and persisted market snapshots.
- Decimal-string price serialization.
- Deterministic ordering.
- Repository/service/controller boundaries.
- Unit, API integration, and live PostgreSQL tests.

FEAT-033 session lifecycle was not implemented.

## Baseline

- Baseline tag: `feat-031-approved`
- Branch: `feat/FEAT-032-market-read-model`
- Worktree: `D:\project\ura-capital-feat032`
- FEAT-031 checkpoint: verified from `reports/implementation/phase-5/FEAT-031.md`
- FEAT-031 schema authority: actual Prisma models inspected, including `SimulationScenario`, `SimulationAsset`, and `SimulationMarketSnapshot`

## Routes

- `GET /api/simulation/assets`
- `GET /api/simulation/scenarios/:scenarioKey/snapshots/:cycle`

Both routes require the existing `authenticate` middleware. No public Simulation read route was added.

## DTOs

Asset DTO whitelist:

- `symbol`
- `name`
- `assetType`
- `status`
- `displayOrder`
- `simulated: true`

Snapshot DTO whitelist:

- `scenarioKey`
- `cycle`
- `assetSymbol`
- `price`
- `occurredAt`
- `simulated: true`

Internal database IDs, Prisma objects, `createdAt`, `updatedAt`, scenario IDs, and internal relations are not returned.

## Query Semantics

Asset catalog:

- Reads existing FEAT-031 `SimulationAsset` records.
- Returns only active equity assets.
- Orders deterministically by `displayOrder ASC`, then `symbol ASC`.
- Does not create, update, or delete simulation state.

Scenario snapshots:

- Validates `scenarioKey` and positive integer `cycle`.
- Resolves only active `SimulationScenario` records by key.
- Reads persisted `SimulationMarketSnapshot` rows for `(scenarioId, cycle)`.
- Filters to active equity assets.
- Orders deterministically by asset `displayOrder ASC`, then asset `symbol ASC`.
- Returns safe 404 errors for unknown scenario, archived scenario, or missing cycle snapshots.

## Market Authority

- PostgreSQL remains the durable market snapshot authority.
- Redis usage for FEAT-032 is zero.
- External market provider usage is zero.
- Client-supplied `price`, `cycle`, scenario availability, or market state is rejected rather than trusted.
- Returned data is explicitly marked `simulated: true`.

## Decimal Serialization

Snapshot prices use Prisma Decimal values and are serialized with fixed decimal-string formatting (`toFixed(6)`). No JavaScript floating-point value is used as the authoritative persisted price.

## Repository Boundary

Implemented flow:

```text
Route -> authenticate -> Controller -> Service -> Repository -> PostgreSQL
```

Controllers and services do not import Prisma directly. The repository implementation remains the only Simulation layer that talks to Prisma delegates.

## Files Changed

- `apps/api/package.json`
- `apps/api/src/server.ts`
- `apps/api/src/modules/simulation/simulation.dto.ts`
- `apps/api/src/modules/simulation/simulation.validation.ts`
- `apps/api/src/modules/simulation/simulation-market-read.service.ts`
- `apps/api/src/modules/simulation/simulation-market.controller.ts`
- `apps/api/src/modules/simulation/simulation.routes.ts`
- `apps/api/src/modules/simulation/simulation.repository.ts`
- `apps/api/tests/unit/simulation-market-read.service.test.ts`
- `apps/api/tests/integration/simulation-market-read.test.ts`
- `apps/api/tests/integration/simulation-market-read-db.test.ts`
- `apps/api/tests/helpers/migration-guard.ts`
- `docs/progress-tracker.md`
- `docs/phase-5-feature-decomposition.md`

Note on `apps/api/tests/helpers/migration-guard.ts`: the checksum helper was corrected to compare migration file content the same way Prisma records `_prisma_migrations` checksums. This is a test/governance guard fix only and does not change runtime application behavior.

## Test Evidence

Fresh PostgreSQL database:

- Database: `aura_capital_test_feat032`
- `prisma migrate deploy`: PASS
- `prisma migrate status`: PASS
- Migrations applied: 8

Validation:

- `npm run clean`: PASS
- `npm run lint`: PASS
- `npx prisma validate --schema=apps/api/prisma/schema.prisma`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run test`: PASS
- `npm run test:unit`: PASS - 50 files / 582 tests
- `npm run test:db`: PASS - 22 files / 274 tests, 0 skipped
- `npm run test:redis`: PASS - 5 files / 50 tests, 0 skipped
- `npm run guard:persistence`: PASS - 1 file / 14 tests
- `npm run guard:migration`: PASS - 8 migrations, 35 review-only historical uniqueness risks, 0 blocking risks
- `npm run guard:boundary`: PASS - controllers=12, services=16, repositories=7
- `npm run guard:audit-governance`: PASS
- `npm run guard:seed-safety`: PASS

Standard suite count:

- API: 61 files / 599 tests, 0 skipped
- Web: 10 files / 112 tests, 0 skipped
- Shared: 1 file / 30 tests, 0 skipped
- Total: 72 files / 741 tests, 0 skipped

Targeted FEAT-032 tests:

- Unit service tests: 1 file / 4 tests PASS
- API route tests: 1 file / 8 tests PASS
- Live PostgreSQL read-model tests: 1 file / 6 tests PASS

## Acceptance Traceability

| AC | Status | Evidence |
| --- | --- | --- |
| AC-001 | PASS | Authenticated `GET /api/simulation/assets` route returns active fixed mock equities. |
| AC-002 | PASS | Authenticated scenario/cycle snapshot route returns persisted PostgreSQL snapshots. |
| AC-003 | PASS | `scenarioKey` and positive integer `cycle` are validated with safe 400 errors. |
| AC-004 | PASS | Asset DTO uses stable `symbol` and omits internal IDs. |
| AC-005 | PASS | Snapshot DTO serializes Decimal price as string and includes `simulated: true`. |
| AC-006 | PASS | DB test verifies GET routes do not mutate assets, snapshots, sessions, portfolios, positions, orders, or trades. |
| AC-007 | PASS | Query/body attempts to supply authoritative fields are rejected. |
| AC-008 | PASS | Unknown, archived, or unavailable scenario/cycle states return safe not-found errors. |
| AC-009 | PASS | No session-scoped read behavior or session endpoint was added. |
| AC-010 | PASS | No external market provider/live feed dependency was introduced. |
| AC-011 | PASS | Returned catalog is limited to active equity assets; crypto/options/derivatives remain out of scope. |
| AC-012 | PASS | Redis is unused by FEAT-032 market read model. |
| AC-013 | PASS | FEAT-031 regression preserved by live Simulation DB tests and full suite. |
| AC-014 | PASS | Unit, API integration, and PostgreSQL-backed tests cover the read model. |
| AC-015 | PASS | Persistence, migration, boundary, audit-governance, and seed-safety guards pass. |
| AC-016 | PASS | This report records implementation scope, validation evidence, and reduced QA independence. |

## FEAT-033 Isolation

FEAT-033 application changes: ZERO.

No session lifecycle route, session start flow, session ownership rule, current-session market API, portfolio behavior, order behavior, valuation behavior, or UI behavior was implemented.

## Risks / Notes

- QA independence is reduced because Codex implemented the feature under temporary Human authorization.
- Independent verification should occur through Human compensating review and later Phase 5 integration review.
- Existing non-blocking advisory remains: Express `res.clearCookie` deprecation warning appears during legacy auth tests and is unrelated to FEAT-032.

Ready for integration review: YES.
