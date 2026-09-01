# Tasks: FEAT-017 Development & Test Seed Strategy

**Status**: APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 3 - Data Foundation & Core Domain  

## 1. Task List

| ID | Task | Requirement Mapping | Acceptance Mapping |
|---|---|---|---|
| T001 | Read FEAT-017 spec package, FEAT-002..FEAT-016 artifacts, ADR-003, ADR-005, and Phase 3 governance context. | FR-001..FR-037 | AC-042 |
| T002 | Inventory existing seed scripts, role seed helpers, test fixture setup, migration SQL, and package commands. | FR-005, FR-028, FR-035 | AC-025, AC-029, AC-030, AC-040 |
| T003 | Define authoritative seed environment signals, deterministic `seed:dev`/`seed:test`/CI predicates, and conflict handling. | FR-001, FR-002, FR-003, FR-004, FR-004A, FR-004B, FR-004C, FR-004I | AC-001, AC-002, AC-003, AC-004 |
| T004 | Implement or document seed command contract for explicit dev/test/CI modes only, including exact required predicates. | FR-001, FR-002, FR-003, FR-004A, FR-004B, FR-004C | AC-001, AC-002, AC-003, AC-006, AC-009 |
| T005 | Add fail-closed guard behavior before any PostgreSQL or Redis mutation. | FR-002, FR-003, FR-004, FR-004D, FR-004G, FR-004H, FR-004I, FR-030 | AC-004, AC-005, AC-009 |
| T006 | Implement or document local-development DB target classifier and FEAT-012 test/CI target-classifier reuse. | FR-004E, FR-004F, FR-004G, FR-004H, FR-004I | AC-001, AC-002, AC-003, AC-004, AC-007, AC-008 |
| T007 | Define allowed development fixture user category and local-only documentation. | FR-005, FR-007, FR-010, FR-021 | AC-010, AC-012, AC-017 |
| T008 | Define automated test fixture user category and reserved identity convention. | FR-005, FR-008, FR-011, FR-021 | AC-011, AC-014, AC-017, AC-018 |
| T009 | Define role/authorization fixture data category using FEAT-007 canonical roles. | FR-005, FR-016, FR-017, FR-019 | AC-019, AC-020, AC-022, AC-023 |
| T010 | Prohibit product-domain fixture categories and placeholder product seeds. | FR-006 | AC-030 |
| T011 | Define credential source strategy: environment-provided development credentials only, deterministic test-only credentials never printed. | FR-009, FR-010, FR-011, FR-013, FR-014 | AC-012, AC-013, AC-014, AC-016, AC-037 |
| T012 | Ensure seeded credential persistence uses approved FEAT-003 hashing pipeline. | FR-012, FR-013 | AC-015, AC-016 |
| T013 | Add logging/reporting sanitization checks for seed credentials and infrastructure secrets. | FR-013, FR-014, FR-034 | AC-016, AC-037, AC-041 |
| T014 | Preserve server-controlled ADMIN provisioning and reject public privilege-management surfaces. | FR-015, FR-016, FR-017 | AC-019, AC-020, AC-021 |
| T015 | Verify normal registration zero-role semantics remain unchanged. | FR-018 | AC-024 |
| T016 | Define deterministic seed identifiers, repeatability, idempotency, and duplicate-safe behavior. | FR-020, FR-021 | AC-017, AC-025, AC-026 |
| T017 | Implement or document PostgreSQL durable seed authority and reject JSON/file/in-memory/Redis durable authority. | FR-022, FR-023, FR-024 | AC-027, AC-028, AC-032 |
| T018 | Define repository/Unit of Work usage or narrowly scoped seed-infrastructure Prisma exception. | FR-025, FR-026, FR-027 | AC-033, AC-034 |
| T019 | Verify seed operations use transaction-safe multi-write behavior where needed. | FR-027 | AC-026, AC-034 |
| T020 | Verify seed data is not embedded in Prisma migrations and migration governance remains green. | FR-028 | AC-029 |
| T021 | Define local reset safety for seed-owned data only. | FR-029, FR-031 | AC-031 |
| T022 | Define test/CI cleanup and parallel worker isolation strategy. | FR-030, FR-031 | AC-032 |
| T023 | Define audit behavior for seed setup and prove FEAT-009 semantics are unchanged. | FR-032, FR-033 | AC-035, AC-036 |
| T024 | Add deterministic static/runtime guard for seed environment and scope safety, including DB classifier probes and no mutation before guard pass. | FR-001, FR-002, FR-003, FR-004, FR-004A, FR-004B, FR-004C, FR-004D, FR-004E, FR-004F, FR-004G, FR-004H, FR-004I, FR-035 | AC-001, AC-002, AC-003, AC-004, AC-005, AC-009, AC-021, AC-028, AC-029, AC-030, AC-038 |
| T025 | Add unit tests for environment predicates, DB target classifiers, command safety, credential safety, admin boundary, and log sanitization. | FR-001, FR-002, FR-003, FR-004, FR-004A, FR-004B, FR-004C, FR-004D, FR-004E, FR-004F, FR-004G, FR-004H, FR-004I, FR-005..FR-019, FR-034, FR-035 | AC-001..AC-024, AC-037, AC-039 |
| T026 | Add PostgreSQL-backed tests for idempotent seed behavior, duplicate safety, credential hashing, role fixtures, reset scope, and isolation. | FR-020..FR-031 | AC-025, AC-026, AC-027, AC-031, AC-032, AC-033, AC-034 |
| T027 | Add Redis regression tests only if seed setup touches transient Redis fixtures. | FR-024 | AC-028, AC-032 |
| T028 | Run FEAT-007 RBAC and registration regression checks. | FR-015, FR-018, FR-019, FR-037 | AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-039 |
| T029 | Run FEAT-009 and FEAT-016 audit/product-audit governance regression checks. | FR-032, FR-033, FR-037 | AC-035, AC-036, AC-038, AC-039 |
| T030 | Run full validation suite from repository root. | FR-035, FR-037 | AC-039 |
| T031 | Create `reports/implementation/phase-3/FEAT-017.md` with exact evidence, limitations, and AC mapping. | FR-036 | AC-041 |
| T032 | Update `docs/progress-tracker.md` after implementation evidence is complete and truthful. | FR-036, FR-037 | AC-042 |
| T033 | Confirm FEAT-018 remains blocked and Phase 4 remains blocked. | FR-037 | AC-042 |

## 2. Dependency Order

1. T001 through T002
2. T003 through T005
3. T006 through T015
4. T016 through T023
5. T024 through T027
6. T028 through T030
7. T031 through T033

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
npm run guard:audit-governance
```

If implementation adds `guard:seed` or an equivalent command, it must run from repository root and be included in the implementation report.

## 4. Implementation Notes

- Do not create production/staging seed behavior.
- Do not create default admin credentials.
- Do not create public role/admin assignment APIs.
- Do not change FEAT-007 registration/RBAC semantics.
- Do not create product-domain seed data.
- Do not put seed data in migrations.
- Do not use Redis, JSON, files, or in-memory state as durable seed authority.
- Do not start FEAT-018.
- Do not start Phase 4.
