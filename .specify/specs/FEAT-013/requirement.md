# Requirement: FEAT-013 Shared Repository & Transaction Pattern

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature Type**: Implementation feature  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

FEAT-002 through FEAT-010A established approved identity/security persistence, PostgreSQL-backed auth/session/audit state, Redis transient-state rules, and security validation. FEAT-011 removed legacy mutable JSON persistence, and FEAT-012 made Prisma/PostgreSQL migrations reproducible and governed.

FEAT-013 formalizes the shared repository and transaction pattern that later product-domain modules will use. It must deepen the existing repository boundary without redesigning Phase 2 auth behavior or creating product-domain schema.

## 2. Goal

Define and validate a reusable repository and transaction orchestration pattern so future multi-write domain operations can commit atomically, roll back safely, and keep Prisma isolated from controllers.

## 3. In Scope

- Shared repository conventions.
- Prisma isolation from controllers.
- Service-layer transaction orchestration.
- Transaction runner / Unit of Work contract.
- Repository factory pattern for root and transaction-scoped repositories.
- Explicit transaction client propagation.
- Atomic multi-write commit validation.
- Rollback validation on forced failure.
- Nested transaction policy.
- Error mapping for Prisma/PostgreSQL errors to safe application errors.
- Raw SQL containment rules.
- PostgreSQL-backed transaction tests using existing approved schema.
- Static import boundary checks.
- FEAT-002 through FEAT-012 regression preservation.
- Implementation evidence in `reports/implementation/phase-3/FEAT-013.md`.

## 4. Out of Scope

- Product-domain schema creation.
- Academy, Simulation, Community, Subscription, AI, or Phase 4 domain tables.
- Product-domain API behavior.
- UI behavior.
- Development seed strategy; FEAT-017 owns seeds.
- Constraint standards beyond transaction/repository needs; FEAT-014 owns reusable constraint baseline.
- Redis health; FEAT-015 owns Redis health and transient-state boundary.
- Product audit persistence extension; FEAT-016 owns audit governance.
- Phase 3 final integration gate; FEAT-018 owns it.
- Redesigning FEAT-002 through FEAT-010A auth/session/RBAC/audit/rate-limit behavior.

## 5. Functional Requirements

- **FR-001**: The implementation MUST document shared repository conventions for API modules.
- **FR-002**: Controllers MUST NOT import Prisma client internals, Prisma delegates, transaction clients, or database clients directly.
- **FR-003**: Services MUST orchestrate business transactions through an approved transaction runner or Unit of Work boundary.
- **FR-004**: Repositories MUST encapsulate persistence queries and database mapping.
- **FR-005**: A repository factory MUST support creating repositories bound to either the root database client or an active transaction client.
- **FR-006**: Transaction-scoped repositories MUST use the provided transaction client for all writes inside the transaction.
- **FR-007**: Multi-write operations requiring atomicity MUST commit all writes together when the transaction succeeds.
- **FR-008**: Forced failure after one or more writes inside a transaction MUST roll back all writes.
- **FR-009**: Nested transaction behavior MUST follow the locked policy: an inner operation that receives an active transaction context MUST reuse it; calling TransactionRunner/UnitOfWork again while already inside an active Unit of Work without explicitly reusing that context MUST fail fast; nested Prisma `$transaction` boundaries MUST never be opened silently; future exceptions require explicit spec approval.
- **FR-010**: Transaction client propagation MUST be explicit enough for code review and tests to prove root repositories are not accidentally used for transactional writes.
- **FR-011**: Prisma/PostgreSQL errors MUST be mapped to stable safe application errors without leaking raw Prisma errors, SQL, stack traces, credentials, or local paths.
- **FR-012**: Raw SQL MUST remain contained in repository/infrastructure helpers, parameterized where applicable, justified, and tested.
- **FR-013**: Existing Phase 2 repositories may be adapted only to conform to the shared pattern without changing approved behavior.
- **FR-014**: PostgreSQL-backed tests MUST verify transaction commit, rollback, transaction client propagation, and nested transaction policy.
- **FR-015**: Static import boundary checks MUST fail if controllers import Prisma/database internals directly.
- **FR-016**: Static or test checks MUST prevent ordinary service-layer direct Prisma delegate usage. Allowed service dependencies are repository interfaces, repository factories, TransactionRunner/UnitOfWork, transaction context, and approved low-level infrastructure only.
- **FR-017**: FEAT-013 MUST preserve FEAT-002 through FEAT-012 behavior and validation results.
- **FR-018**: FEAT-013 MUST NOT introduce product-domain schema, public APIs, UI, seed behavior, Redis health behavior, or Phase 4 behavior.
- **FR-019**: Implementation evidence MUST include changed files, repository/transaction contracts, PostgreSQL test evidence, static boundary check evidence, regression results, limitations, and AC mapping.

## 6. Non-Functional Requirements

- Strict TypeScript, no unbounded `any`.
- Explicit interfaces and narrow module boundaries.
- No hard-coded secrets.
- No raw database URL, token, cookie, password, secret, stack trace, raw Prisma error, SQL statement with sensitive values, or sensitive local path leakage.
- Tests must use isolated PostgreSQL databases and FEAT-012 migration governance.
- The pattern must be understandable to future implementers without private chat context.

## 7. Dependencies

- FEAT-012 DONE / QA PASS / Human Final Gate APPROVED.
- ADR-003 PostgreSQL/Prisma accepted.
- FEAT-002 repository baseline and identity/security models.
- FEAT-003 registration transaction evidence.
- FEAT-009 role/audit transaction coupling evidence.
- FEAT-011 persistence guard and FEAT-012 migration guard.

## 8. Success Definition

FEAT-013 is successful when controllers remain Prisma-free, ordinary services do not perform direct Prisma delegate queries, a shared repository factory and transaction runner/Unit of Work are defined, PostgreSQL-backed tests prove commit/rollback behavior, nested transactions are governed by explicit reuse/fail-fast semantics, raw SQL is contained, FEAT-002 through FEAT-012 regressions remain green, and no product-domain schema or behavior is introduced.

## 9. Open Questions

None blocking for Human review. Implementation may choose exact module names if the approved boundaries and acceptance criteria remain testable.
