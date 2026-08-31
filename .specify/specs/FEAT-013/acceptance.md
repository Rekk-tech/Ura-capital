# Acceptance Criteria: FEAT-013 Shared Repository & Transaction Pattern

**Status**: PROPOSED FOR HUMAN REVIEW

## 1. Acceptance Matrix

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-001 | Shared repository conventions are documented and consistent with controller -> service -> repository layering. | Source/docs review and implementation report. |
| AC-002 | Controllers do not import Prisma, Prisma delegates, Prisma clients, transaction clients, or database infrastructure directly. | Static guard and source review. |
| AC-003 | Repository implementations encapsulate persistence queries and database mapping behind explicit methods/interfaces. | Source review and tests. |
| AC-004 | Ordinary services do not perform direct Prisma delegate queries outside repository interfaces, repository factories, TransactionRunner/UnitOfWork, transaction context, or approved low-level infrastructure. | Static guard and source review. |
| AC-005 | Repository factory supports root repository construction for non-transactional usage. | Unit tests or source review. |
| AC-006 | Repository factory supports transaction-scoped repository construction from an active transaction client. | Unit tests and PostgreSQL-backed tests. |
| AC-007 | A transaction runner / Unit of Work contract exists and is used for service-layer transaction orchestration. | Source review and tests. |
| AC-008 | The transaction runner commits only when the operation callback succeeds. | PostgreSQL-backed commit test. |
| AC-009 | A multi-write success path commits all participating writes atomically. | PostgreSQL-backed test. |
| AC-010 | Forced failure after one or more writes, including composed operations sharing an active context, rolls back all participating writes. | PostgreSQL-backed rollback test. |
| AC-011 | Database constraint failure inside a transaction rolls back all participating writes. | PostgreSQL-backed uniqueness/FK failure test. |
| AC-012 | Transaction failures are not reported as successful operations. | Unit/integration tests and error review. |
| AC-013 | Transaction client propagation is explicit and testable. | Unit/integration tests or test doubles. |
| AC-014 | Transaction-scoped repositories do not accidentally use root repositories for transactional writes. | PostgreSQL-backed test or spy/test-double evidence. |
| AC-015 | Nested transaction policy is explicitly implemented: active-context reuse succeeds and accidental nested Unit of Work invocation fails deterministically. | Unit/integration tests. |
| AC-016 | No nested Prisma transaction is silently opened inside an active Unit of Work; composed operations open only one Prisma transaction boundary. | Source review and tests. |
| AC-017 | Existing FEAT-003 registration transaction behavior remains atomic after any repository/transaction refactor. | Regression tests and source review. |
| AC-018 | Existing FEAT-009 role/audit transaction coupling remains atomic after any repository/transaction refactor. | Regression tests and source review. |
| AC-019 | Prisma/PostgreSQL errors are mapped to stable safe application errors where exposed. | Error mapping tests and API/log review. |
| AC-020 | Responses and logs do not expose raw Prisma errors, SQL with sensitive values, stack traces, credentials, database URLs, tokens, cookies, passwords, or secrets. | Log/error capture tests and source review. |
| AC-021 | Raw SQL is contained to approved repository/infrastructure/test/migration locations. | Static guard and source review. |
| AC-022 | Any approved raw SQL is parameterized where applicable, justified, and covered by tests. | Source review and tests. |
| AC-023 | Controllers and ordinary services contain no embedded raw SQL. | Static guard and source review. |
| AC-024 | Static boundary validation fails on injected prohibited controller Prisma imports and raw SQL violations. | Guard self-tests. |
| AC-025 | Static boundary validation detects prohibited ordinary service-layer direct Prisma delegate usage unless it is within repository interfaces, repository factories, TransactionRunner/UnitOfWork, transaction context, or approved low-level infrastructure. | Guard self-tests. |
| AC-026 | Static guard/error/report output does not expose secrets, raw DB URLs, tokens, cookies, passwords, or sensitive local paths. | Output review and tests. |
| AC-027 | FEAT-013 introduces no product-domain schema, product API, UI, seed behavior, Redis health behavior, product audit table, global soft-delete convention, or Phase 4 behavior. | Source/schema review. |
| AC-028 | FEAT-002 through FEAT-012 regression validation remains green. | Clean/lint/Prisma validate/typecheck/build/test/db/redis/guards evidence. |
| AC-029 | PostgreSQL-backed tests use isolated test databases and FEAT-012 migration guard/deploy/status workflow. | Command evidence and implementation report. |
| AC-030 | Governance state remains consistent: FEAT-013 in QA/review after implementation, FEAT-014+ blocked, Phase 3 in progress, Phase 4 blocked. | Tracker/report review. |

## 2. PASS Requirements

FEAT-013 may receive QA PASS only when AC-001 through AC-030 pass, PostgreSQL-backed commit/rollback tests pass, static boundary checks prove prohibited patterns fail, FEAT-003 and FEAT-009 transaction behavior remains green, no product-domain schema or behavior is introduced, FEAT-002 through FEAT-012 regression remains green, and no unresolved P0/P1 data-integrity or security defect remains.

## 3. FAIL Conditions

FEAT-013 must fail QA if any of the following are true:

- Controllers import Prisma/database internals.
- Ordinary services perform direct Prisma delegate queries outside approved repository, transaction, context, or low-level infrastructure boundaries.
- Transaction-scoped repositories accidentally use root database clients for transactional writes.
- Multi-write success or rollback behavior is not proven against live PostgreSQL.
- Forced failure leaves partial records.
- Nested Prisma transactions silently open without explicit spec approval, or accidental nested Unit of Work invocation does not fail fast.
- Raw SQL appears in controllers or ordinary services.
- Raw Prisma/PostgreSQL errors or sensitive values leak externally.
- Product-domain schema/API/UI/seed/Redis health/product audit/Phase 4 behavior is introduced.
- Implementation report claims validation passed without actual evidence.

## 4. Required Validation Suite

Expected validation:

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

FEAT-013 must also provide isolated PostgreSQL transaction validation evidence and static boundary guard evidence.

## 5. Human Review Checklist

- [ ] FEAT-013 scope is limited to repository and transaction pattern.
- [ ] No product-domain schema or behavior is specified.
- [ ] Transaction runner / Unit of Work boundary is acceptable.
- [ ] Nested transaction policy is explicit enough for future domain features.
- [ ] Static boundary checks are strict but not overly broad.
- [ ] Acceptance criteria are independently testable.
- [ ] FEAT-014 remains blocked until FEAT-013 receives Human Final Gate approval.

## 6. Final Gate

Implementation may begin only after Human approval of this spec package. FEAT-014 must not begin until FEAT-013 receives QA PASS and Human Final Gate approval.
