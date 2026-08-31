# Tasks: FEAT-015 Redis Health & Transient State Boundary

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  

## 1. Task List

| ID | Task | Requirement Mapping | Acceptance Mapping |
|---|---|---|---|
| T001 | Read FEAT-015 spec package, ADR-005, FEAT-010A artifacts, and Phase 3 governance context. | FR-001..FR-021 | AC-030 |
| T002 | Document Redis transient-only authority and PostgreSQL durable authority boundaries. | FR-003 | AC-009, AC-010 |
| T003 | Define liveness versus readiness behavior. | FR-001, FR-002 | AC-001, AC-002 |
| T004 | Define internal readiness response contract and public health non-disclosure rules. | FR-002, FR-015 | AC-002, AC-018, AC-019 |
| T005 | Define Redis connection lifecycle for startup, runtime checks, shutdown, and tests. | FR-008 | AC-005 |
| T006 | Define startup/config validation for required Redis-backed protected behavior. | FR-016, FR-017 | AC-006, AC-023 |
| T007 | Define Redis unavailable/degraded behavior for FEAT-010A protected endpoints. | FR-004, FR-005, FR-018 | AC-003, AC-004, AC-024 |
| T008 | Define availability expectations for non-Redis-dependent surfaces during Redis degradation. | FR-006 | AC-007 |
| T009 | Define Redis recovery semantics after connectivity returns. | FR-007 | AC-008 |
| T010 | Define namespace/version/key strategy. | FR-009, FR-010, FR-013 | AC-011, AC-012, AC-014 |
| T011 | Define sensitive-data prohibitions for Redis keys. | FR-011 | AC-013, AC-018 |
| T012 | Define TTL expectations and exception process for non-expiring keys. | FR-012 | AC-015 |
| T013 | Define test/CI isolation strategy for Redis keys and parallel workers. | FR-009, FR-013 | AC-012, AC-014 |
| T014 | Define multi-instance validation approach using shared Redis state. | FR-014 | AC-016 |
| T015 | Define diagnostics sanitization requirements for logs/responses/reports. | FR-015 | AC-018, AC-019 |
| T016 | Define local/test/CI/staging/production Redis environment rules. | FR-016, FR-017 | AC-020, AC-021, AC-022, AC-023 |
| T017 | Add or update documentation required for Redis health and transient-state boundary. | FR-001..FR-018 | AC-001..AC-023 |
| T018 | Add unit tests for readiness mapping, key namespace, TTL requirements, and sanitization. | FR-019 | AC-001, AC-011, AC-015, AC-018 |
| T019 | Add Redis-backed tests for healthy Redis, unavailable Redis, recovery, isolated keys, collision prevention, TTL expiry, and multi-instance behavior. | FR-019 | AC-002, AC-008, AC-012, AC-014, AC-015, AC-016, AC-017 |
| T020 | Add FEAT-010A regression tests or evidence for login/register/refresh protected endpoints and aliases. | FR-005, FR-018, FR-020 | AC-003, AC-004, AC-024, AC-025 |
| T021 | Verify Redis outage does not incorrectly mutate PostgreSQL auth/session/audit state. | FR-018, FR-020 | AC-004, AC-026 |
| T022 | Verify no durable audit amplification is introduced for Redis health/rate-limit behavior. | FR-020 | AC-027 |
| T023 | Verify no public Redis admin/debug API or product-domain cache behavior is introduced. | FR-002, FR-003 | AC-010, AC-028 |
| T024 | Run full validation suite from repository root. | FR-019, FR-020 | AC-029 |
| T025 | Create `reports/implementation/phase-3/FEAT-015.md` with exact evidence and limitations. | FR-021 | AC-030 |
| T026 | Update `docs/progress-tracker.md` only after implementation evidence is complete and truthful. | FR-021 | AC-030 |
| T027 | Confirm FEAT-016 remains blocked and FEAT-018 remains blocked. | FR-020, FR-021 | AC-030 |

## 2. Dependency Order

1. T001
2. T002 through T016
3. T017
4. T018 through T023
5. T024
6. T025 through T027

## 3. Required Validation Commands

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

If implementation adds a Redis health-specific command, add it to the validation report and ensure it runs from repository root.

## 4. Implementation Notes

- Do not create Prisma migrations unless Human explicitly approves an unexpected need.
- Do not create product-domain Redis cache behavior.
- Do not expose Redis details publicly.
- Do not start FEAT-016.
