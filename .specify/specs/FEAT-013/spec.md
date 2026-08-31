# Specification: FEAT-013 Shared Repository & Transaction Pattern

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Scope**: Repository and transaction pattern only

## 1. User Stories

### Story 1 - Prisma-Free Controllers

As an API maintainer, I need controllers to depend on services and request/response contracts only so persistence technology cannot leak into HTTP handlers.

Independent test:

- Static boundary check scans controller files.
- Any direct Prisma/database-client import in a controller fails validation.
- Existing routes still behave as before.

### Story 2 - Transactional Multi-Write Safety

As a future domain implementer, I need a shared transaction pattern so multi-write operations either commit completely or roll back completely.

Independent test:

- A PostgreSQL-backed operation creates multiple related approved-schema records inside one transaction.
- Success commits every record.
- Forced failure after an intermediate write rolls back every record.

### Story 3 - Transaction Client Propagation

As a reviewer, I need transaction-scoped repositories to visibly use the active transaction client so transactional writes cannot accidentally escape through root repositories.

Independent test:

- Repository factory creates transaction-bound repositories inside a Unit of Work.
- Tests or spies prove transactional writes use the propagated transaction client.
- Root repositories are not used for transaction-scoped writes.

### Story 4 - Safe Failure And Query Boundaries

As an operator, I need database failures and raw SQL usage to be contained so errors are safe and future queries remain reviewable.

Independent test:

- Known Prisma/PostgreSQL failures map to stable safe application errors.
- Raw SQL usage is limited to repository/infrastructure allowlisted locations.
- Sensitive values and raw database internals do not appear in responses or logs.

## 2. Functional Specification

### 2.1 Repository Conventions

FEAT-013 must define shared repository conventions for API modules:

- Controllers call services.
- Services call repository interfaces and the transaction runner.
- Repositories own persistence queries and database mapping.
- Infrastructure owns Prisma client construction and low-level database integration.
- `packages/shared` remains for cross-boundary contracts/types, not server persistence logic.

Repositories should expose narrow methods named after domain intent or persistence operation. They must not return raw Prisma delegates or require controllers to understand Prisma query shapes.

### 2.2 Prisma Isolation Boundary

Prisma imports are allowed only in infrastructure/database modules, repository implementations, generated client setup, migration/test helpers, and explicitly approved low-level database utilities.

Controllers must not import `@prisma/client`, Prisma client singletons, Prisma transaction clients, Prisma model delegates, or database connection modules.

Ordinary services must not perform direct Prisma delegate queries. Allowed service dependencies are repository interfaces, repository factories, TransactionRunner/UnitOfWork interfaces, transaction context objects, safe application error types, and approved low-level infrastructure only.

### 2.3 Transaction Runner / Unit of Work

FEAT-013 must define a reusable transaction runner or Unit of Work abstraction with these semantics:

- Accepts an async operation callback.
- Opens a PostgreSQL/Prisma transaction at the boundary.
- Provides transaction-scoped repositories or a transaction context to the callback.
- Commits only when the callback completes successfully.
- Rolls back when the callback throws.
- Propagates the original safe application error where appropriate.
- Maps unknown database errors to stable safe errors.

The implementation may name this `TransactionRunner`, `UnitOfWork`, or equivalent, but the contract must be documented and covered by tests.

### 2.4 Repository Factory Pattern

The repository factory must support root repositories for non-transactional usage and transaction-scoped repositories created from an active transaction client. Transaction-scoped repositories must use the transaction client for all reads/writes that participate in the transaction.

### 2.5 Atomic Commit And Rollback

PostgreSQL-backed tests must use existing approved schema objects, not new product-domain tables, to prove:

- multi-write success commits all records
- forced failure after the first write rolls back all records
- duplicate/constraint errors roll back partial writes
- no partial User/Credential/Role/UserRole/RefreshSession/Audit state remains after rollback probes

### 2.6 Nested Transaction Policy

Locked policy:

- An inner operation that receives an active transaction context must reuse it.
- Calling TransactionRunner/UnitOfWork again while already inside an active Unit of Work without explicitly reusing that context must fail fast deterministically.
- No implementation may silently open a nested Prisma `$transaction` boundary.
- Composed operations sharing the active context must roll back atomically when any participating operation fails.
- Future exceptions require explicit spec approval.

Acceptance tests must prove explicit active-context reuse succeeds, accidental nested Unit of Work invocation fails deterministically, only one Prisma transaction boundary is opened for composed operations, and rollback remains atomic across composed operations.

### 2.7 Error Mapping

Database errors must be mapped to safe application errors. Raw Prisma error messages, SQL, stack traces, credentials, and full local paths must not be exposed externally.

### 2.8 Raw SQL Containment

Raw SQL is allowed only when repository/infrastructure code owns it, it is parameterized where applicable, it is justified, it is tested, and it does not leak sensitive values. Controllers must never contain raw SQL. Ordinary services must call repository methods rather than embedding SQL.

### 2.9 Static Boundary Checks

FEAT-013 must add or extend deterministic validation that fails if:

- controllers import Prisma/database internals
- controllers instantiate repositories directly when service injection/factory conventions should be used
- ordinary services perform direct Prisma delegate queries outside repository interfaces, repository factories, TransactionRunner/UnitOfWork, transaction context, or approved low-level infrastructure
- raw SQL appears outside approved repository/infrastructure/test/migration locations

All allowlists must be narrow and documented.

### 2.10 Regression Boundary

FEAT-013 must preserve FEAT-002 identity persistence, FEAT-003 registration, FEAT-004 login/access-token, FEAT-005 refresh, FEAT-006 logout, FEAT-007 RBAC, FEAT-008 admin guard, FEAT-009 auth audit, FEAT-010A rate limiting, FEAT-011 persistence guard, and FEAT-012 migration guard/reproducibility.

## 3. Explicit Non-Goals

FEAT-013 must not implement product-domain schema, public product APIs, UI behavior, seed behavior, Redis health, product audit tables, global soft-delete convention, or Phase 4 Academy behavior.

## 4. Security And Data Integrity Requirements

- PostgreSQL remains durable persistence authority.
- Redis must not become transaction authority.
- Client input must never select transaction scope or repository authority.
- Transaction tests must use isolated test databases.
- Transaction failures must not be hidden as successful operations.
- Error/log output must remain sanitized.

## 5. Acceptance Mapping

- Repository conventions and layering: AC-001 through AC-006
- Transaction runner / Unit of Work: AC-007 through AC-014
- Nested transactions and propagation: AC-015 through AC-018
- Error mapping and raw SQL containment: AC-019 through AC-023
- Static checks, regression, reporting, governance: AC-024 through AC-030

## 6. Human Review Notes

This feature intentionally uses existing approved identity/security tables for transaction proof. It must not create product-domain tables or behavior.
