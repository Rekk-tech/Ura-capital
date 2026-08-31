# Tasks: FEAT-013 Shared Repository & Transaction Pattern

**Status**: PROPOSED FOR HUMAN REVIEW  
**Implementation Rule**: Do not create product-domain schema or APIs. Do not begin FEAT-014.

## 1. Preparation

- [ ] T001 Read `docs/AGENT_WORKFLOW.md`, `docs/phase-3-feature-decomposition.md`, `docs/progress-tracker.md`, ADR-003, FEAT-002 through FEAT-012 approved specs, implementation reports, and QA reports. Maps to FR-017, AC-028, AC-030.
- [ ] T002 Confirm FEAT-012 is DONE / QA PASS / Human Final Gate APPROVED and FEAT-014+ remain blocked. Maps to FR-017, AC-030.
- [ ] T003 Record FEAT-013 scope boundaries before implementation, including no product-domain schema, APIs, UI, seed, Redis health, product audit, or Phase 4 behavior. Maps to FR-018, AC-027, AC-030.

## 2. Existing Boundary Review

- [ ] T004 Inventory existing repository implementations, repository factories, services, controller imports, Prisma imports, transaction usage, and raw SQL usage under `apps/api/src`. Maps to FR-001, FR-002, FR-004, FR-012, AC-001, AC-002, AC-021.
- [ ] T005 Identify existing FEAT-003 and FEAT-009 transaction flows that must be preserved while moving toward the shared pattern. Maps to FR-013, FR-017, AC-017, AC-018.
- [ ] T006 Document approved allowlist locations for Prisma imports and raw SQL usage. Maps to FR-002, FR-012, AC-002, AC-021, AC-024.

## 3. Shared Repository Pattern

- [ ] T007 Define shared repository convention documentation or module contracts in the appropriate API documentation/source area. Maps to FR-001, FR-004, AC-001, AC-003.
- [ ] T008 Define repository interfaces or interface conventions for root and transaction-scoped use without exposing Prisma delegates to controllers. Maps to FR-004, FR-005, AC-003, AC-004.
- [ ] T009 Implement or normalize a repository factory capable of producing root repositories and transaction-scoped repositories. Maps to FR-005, FR-006, AC-005, AC-006.
- [ ] T010 Adapt existing identity/security repository construction only where necessary to conform to the shared factory pattern without behavior changes. Maps to FR-013, FR-017, AC-017, AC-018, AC-028.

## 4. Transaction Runner / Unit of Work

- [ ] T011 Define the transaction runner / Unit of Work interface and behavior contract. Maps to FR-003, FR-007, FR-008, FR-009, AC-007, AC-008, AC-015.
- [ ] T012 Implement the transaction runner / Unit of Work around the existing Prisma database boundary. Maps to FR-003, FR-005, FR-006, AC-007, AC-008.
- [ ] T013 Ensure the transaction runner provides transaction-scoped repositories or transaction context to callbacks. Maps to FR-006, FR-010, AC-013, AC-014.
- [ ] T014 Implement locked nested transaction policy: inner operations with an active transaction context reuse it; accidental nested TransactionRunner/UnitOfWork invocation without explicit context reuse fails fast; nested Prisma `$transaction` is never silently opened. Maps to FR-009, AC-015, AC-016.
- [ ] T015 Ensure successful Unit of Work callbacks commit all participating writes together. Maps to FR-007, AC-009.
- [ ] T016 Ensure thrown errors inside Unit of Work callbacks roll back all participating writes. Maps to FR-008, AC-010, AC-011, AC-012.

## 5. Error Mapping And Raw SQL Containment

- [ ] T017 Reuse or extend safe database error mapping for transaction and repository failures. Maps to FR-011, AC-019, AC-020.
- [ ] T018 Verify uniqueness, foreign-key, and transaction infrastructure failures do not leak raw Prisma/PostgreSQL details. Maps to FR-011, AC-019, AC-020.
- [ ] T019 Define and enforce raw SQL containment rules for repository/infrastructure/test/migration locations. Maps to FR-012, AC-021, AC-022, AC-023.
- [ ] T020 Ensure any approved raw SQL remains parameterized, justified, and tested. Maps to FR-012, AC-022, AC-023.

## 6. Static Boundary Checks

- [ ] T021 Add or extend a static guard that fails when controllers import Prisma/database internals directly. Maps to FR-002, FR-015, AC-002, AC-024.
- [ ] T022 Add or extend static checks that prevent ordinary service-layer direct Prisma delegate usage outside repository interfaces, repository factories, TransactionRunner/UnitOfWork, transaction context, or approved low-level infrastructure. Maps to FR-003, FR-016, AC-004, AC-025.
- [ ] T023 Add or extend static checks for raw SQL outside approved locations. Maps to FR-012, AC-021, AC-024.
- [ ] T024 Add negative self-tests or injected-fixture tests proving static guards fail on prohibited controller/service/raw SQL patterns. Maps to FR-015, FR-016, AC-024, AC-025.
- [ ] T025 Ensure static guard output does not expose secrets, raw DB URLs, tokens, cookies, passwords, or sensitive local paths. Maps to FR-011, AC-026.

## 7. PostgreSQL-Backed Transaction Tests

- [ ] T026 Prepare isolated PostgreSQL test database using FEAT-012 migration guard/deploy/status workflow. Maps to FR-014, AC-029.
- [ ] T027 Add PostgreSQL-backed test proving multi-write success commits all records. Maps to FR-007, FR-014, AC-008, AC-009.
- [ ] T028 Add PostgreSQL-backed test forcing failure after intermediate write and proving rollback leaves no partial records. Maps to FR-008, FR-014, AC-010.
- [ ] T029 Add PostgreSQL-backed test proving database constraint failure rolls back all writes in the Unit of Work. Maps to FR-008, FR-011, FR-014, AC-011, AC-019.
- [ ] T030 Add test proving transaction-scoped repositories use the propagated transaction client and do not accidentally use root repositories for transactional writes. Maps to FR-006, FR-010, FR-014, AC-013, AC-014.
- [ ] T031 Add tests proving nested transaction policy is enforced: explicit active-context reuse succeeds, accidental nested Unit of Work invocation fails deterministically, only one Prisma transaction boundary is opened, and rollback remains atomic across composed operations. Maps to FR-008, FR-009, FR-010, FR-014, AC-010, AC-015, AC-016.
- [ ] T032 Confirm tests use existing approved identity/security schema only and add no product-domain tables. Maps to FR-018, AC-027.

## 8. Regression Validation

- [ ] T033 Run `npm run clean` from repository root. Maps to FR-017, AC-028.
- [ ] T034 Run `npm run lint` from repository root. Maps to FR-017, AC-028.
- [ ] T035 Run `npx prisma validate --schema=apps/api/prisma/schema.prisma`. Maps to FR-017, AC-028.
- [ ] T036 Run `npm run typecheck` from repository root. Maps to FR-017, AC-028.
- [ ] T037 Run `npm run build` from repository root. Maps to FR-017, AC-028.
- [ ] T038 Run `npm run test` from repository root. Maps to FR-017, AC-028.
- [ ] T039 Run `npm run test:db` against isolated PostgreSQL. Maps to FR-014, FR-017, AC-028, AC-029.
- [ ] T040 Run `npm run test:redis`. Maps to FR-017, AC-028.
- [ ] T041 Run `npm run guard:persistence`. Maps to FR-017, AC-028.
- [ ] T042 Run `npm run guard:migration`. Maps to FR-017, AC-028.

## 9. Reporting And Governance

- [ ] T043 Create `reports/implementation/phase-3/FEAT-013.md` with files changed, pattern decisions, transaction evidence, static guard evidence, validation counts, limitations, and AC mapping. Maps to FR-019, AC-029, AC-030.
- [ ] T044 If any PostgreSQL/static/regression validation is environment-blocked, mark it `NOT VERIFIED` with exact blocker and do not claim PASS. Maps to FR-019, AC-029.
- [ ] T045 Update governance state only as allowed: FEAT-013 ready for QA after implementation; FEAT-014 remains blocked until FEAT-013 Human Final Gate approval. Maps to FR-019, AC-030.

## 10. Prohibited Work

- Do not create Academy, Simulation, Community, Subscription, AI, or other product-domain tables.
- Do not add product-domain public APIs.
- Do not change Phase 2 auth/session/RBAC/admin/audit/rate-limit semantics.
- Do not use Redis as transaction authority.
- Do not allow controllers to import Prisma/database internals.
- Do not hide failed transaction validation.
- Do not start FEAT-014 or Phase 4.
