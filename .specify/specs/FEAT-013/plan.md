# Plan: FEAT-013 Shared Repository & Transaction Pattern

**Status**: PROPOSED FOR HUMAN REVIEW  
**Planning Mode**: Specification only  
**Implementation**: Not started

## 1. Technical Approach

FEAT-013 should formalize repository and transaction conventions already emerging from Phase 2:

1. Review existing identity/security repositories, services, and transaction usage.
2. Define shared repository interfaces and construction conventions.
3. Add a transaction runner / Unit of Work abstraction around Prisma transactions.
4. Add a repository factory that can create root and transaction-scoped repositories.
5. Adapt existing repositories only as needed to conform without changing behavior.
6. Add PostgreSQL-backed tests proving commit, rollback, nested transaction policy, and transaction client propagation.
7. Add static boundary checks for controllers, services, Prisma, and raw SQL containment.
8. Run full FEAT-002 through FEAT-012 regression.

## 2. Architecture Decisions

### Decision 1 - Service Layer Owns Transaction Orchestration

Selected:

- Services initiate business transactions through an approved transaction runner / Unit of Work.

Rationale:

- Code standards assign transactions and orchestration to services.
- Controllers should remain HTTP-only.
- Repositories should persist data, not decide cross-repository business workflows.

Rejected:

- Controllers opening database transactions.
- Repositories opening implicit multi-repository transactions without service visibility.

Implication:

- Future domain services can express atomic workflows while keeping persistence details hidden.

### Decision 2 - Repository Factory Creates Root And Transaction-Scoped Repositories

Selected:

- A repository factory constructs repositories from either the root database client or the active transaction client.

Rationale:

- Existing Phase 2 work already uses repository factories for registration and role/audit coupling.
- Transaction client propagation becomes explicit and testable.

Rejected:

- Global singleton repositories that cannot be transaction-bound.
- Passing raw Prisma clients into controllers.

Implication:

- Future domain modules can add repositories without reinventing transaction wiring.

### Decision 3 - No Nested Prisma Transactions By Default

Selected:

- Inner operations that receive an active transaction context must reuse it.
- Calling TransactionRunner/UnitOfWork again while already inside an active Unit of Work without explicitly reusing that context must fail fast.
- Nested Prisma `$transaction` boundaries must never be silently opened.

Rationale:

- Nested transaction behavior can be misleading and can hide rollback semantics.
- Future domain operations need clear all-or-nothing behavior.

Rejected:

- Silently opening nested Prisma transactions.

Implication:

- Service methods that may run inside another transaction need transaction-context-aware signatures or repository factory injection.

### Decision 4 - Raw SQL Is Contained And Exceptional

Selected:

- Raw SQL belongs only in repository/infrastructure/test/migration locations and must be justified, parameterized, and tested.

Rationale:

- ADR-003 permits raw SQL only when justified and contained.
- Controllers/services with embedded SQL violate layering and make review harder.

Rejected:

- Ad hoc SQL in controllers or ordinary service methods.

Implication:

- Future performance or reporting queries need repository-owned contracts and tests.

## 3. Implementation Boundaries

Allowed after Human approval:

- Shared database/transaction runner module.
- Repository factory abstraction or normalization of existing factory.
- Repository interfaces/types where needed.
- Static boundary guard tests/scripts.
- PostgreSQL-backed transaction tests using existing approved tables.
- Documentation and implementation report.

Disallowed:

- Product-domain Prisma models or migrations.
- Public product endpoints.
- UI changes.
- Seed workflows.
- Redis health changes.
- Product audit schema.
- Phase 4 Academy behavior.

## 4. Proposed Source Areas

Implementation may choose final names, but likely source areas include:

```text
apps/api/src/infrastructure/database/
apps/api/src/modules/*/repositories/
apps/api/src/modules/*/*.service.ts
apps/api/tests/unit/
apps/api/tests/integration/
apps/api/tests/helpers/
```

Controllers should not change except for dependency wiring required by the shared pattern, and no public API behavior should change.

## 5. Transaction Validation Strategy

PostgreSQL-backed validation should use an isolated test DB and FEAT-012 migration workflow:

```text
Set DATABASE_URL and TEST_DATABASE_URL to isolated test database
npm run guard:migration
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
npm run test:db
```

Required transaction tests:

- success path commits all writes
- forced failure rolls back all writes, including composed operations sharing an active context
- uniqueness/FK failure rolls back all writes
- transaction-scoped repository receives transaction client
- explicit active-context reuse succeeds
- accidental nested Unit of Work invocation fails deterministically
- only one Prisma transaction boundary is opened for composed operations
- rollback remains atomic across composed operations
- root repository is not used accidentally for transactional writes

## 6. Static Boundary Validation Strategy

Static checks should scan source, not generated build output.

Required checks:

- controllers do not import `@prisma/client` or database infrastructure directly
- controllers do not instantiate Prisma repositories directly
- ordinary services do not perform direct Prisma delegate queries outside repository interfaces, repository factories, TransactionRunner/UnitOfWork, transaction context, or approved low-level infrastructure
- raw SQL usage is restricted to repository/infrastructure/test/migration allowlists
- allowlists are narrow and documented

## 7. Error Mapping Strategy

Implementation should reuse existing safe error envelope conventions. Tests should verify raw Prisma errors are not returned externally, known constraint errors map safely, transaction infrastructure errors are safe, and logs avoid sensitive values.

## 8. Test Strategy

Expected coverage:

- Unit tests for transaction runner behavior, nested policy, repository factory wiring, and error mapping.
- PostgreSQL-backed integration tests for commit/rollback and constraint failure rollback.
- Static guard tests for import and raw SQL boundary rules.
- Regression tests for FEAT-002 through FEAT-012.

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
```

## 9. Risks

- Refactoring existing repositories could accidentally change Phase 2 behavior.
- Transaction runner abstraction could hide errors or make rollback unclear.
- Nested transaction policy could be underspecified and allow partial state.
- Static boundary checks could be too broad or too narrow.
- Using existing auth tables for tests could accidentally couple tests to product behavior; tests must stay fixture-like and isolated.

## 10. Done Criteria

FEAT-013 is ready for QA when all tasks are complete or explicitly marked not applicable, repository/transaction contracts are documented, PostgreSQL-backed transaction tests pass, static boundary checks pass, full validation passes, FEAT-002 through FEAT-012 behavior remains unchanged, and no product-domain schema or behavior is introduced.
