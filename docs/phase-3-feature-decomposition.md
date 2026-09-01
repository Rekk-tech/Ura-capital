# Aura Capital - Phase 3 Feature Decomposition

**Status**: HUMAN APPROVED  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Date**: 2026-08-29  
**Scope**: Planning only. No application implementation code.

## 1. Planning Basis

Reviewed context:

- `docs/AGENT_WORKFLOW.md`
- `docs/progress-tracker.md`
- `docs/project-overview.md`
- `docs/architecture-context.md`
- `docs/final-technology-decisions.md`
- `docs/environment-strategy.md`
- `docs/code-standards.md`
- `docs/adrs/ADR-003-postgresql-and-prisma.md`
- `docs/adrs/ADR-005-redis-responsibility.md`
- Approved FEAT-002 through FEAT-010A spec, implementation, and QA artifacts

Phase 2 already established identity-scoped PostgreSQL/Prisma models, repository boundaries, authentication audit records, Redis-backed rate limiting, and security validation. Phase 3 must extend those foundations into a shared production data foundation for later product domains without duplicating or redesigning the approved identity/security foundation.

## 2. Human Approved Decisions

Human approved the Phase 3 feature sequence FEAT-011 through FEAT-018.

Approved boundary decisions:

1. FEAT-014 must not create Academy, Simulation, Community, Subscription, or AI domain tables. It defines reusable PostgreSQL constraint standards only. Concrete domain schemas belong to their later domain phases.
2. FEAT-016 must not extend `AuthSecurityAuditRecord` for product-domain events. It preserves FEAT-009 auth audit semantics, defines shared product-audit abstraction/governance only, and defers concrete product-domain audit tables until a domain feature requires them.
3. FEAT-015 Redis health is internal readiness/validation only. Public health responses must not expose sensitive Redis details.
4. FEAT-017 may allow dev/test seed users. It must not introduce default ADMIN credentials. Production/staging seed execution is prohibited. Admin provisioning remains server-controlled.
5. There is no global Phase 3 soft-delete convention. Soft delete is decided per domain in later features.

## 3. Phase 3 Architecture Boundary

Phase 3 owns:

- Shared persistence conventions for future product domains.
- Reproducible migration workflow and validation.
- Repository and transaction patterns beyond identity/auth.
- Database constraint strategy for core domain integrity.
- Redis health and transient-state boundary for future phases.
- Audit-log persistence strategy for product-domain events.
- Development seed strategy.
- Final integration validation for the data foundation.

Phase 3 does not own:

- Rebuilding FEAT-002 through FEAT-010A auth behavior.
- Product behavior for Academy, Simulation, Community, Subscription, AI, or UI.
- Redis as durable business authority.
- Public role, audit, or admin management APIs unless separately approved in later phases.

## 4. Approved Feature Sequence

| Feature ID | Feature Name | Feature Type | Primary Dependency |
|------------|--------------|--------------|--------------------|
| FEAT-011 | Persistence Boundary & Legacy Data Elimination | Implementation | Phase 2 approved |
| FEAT-012 | Migration Reproducibility & Schema Governance | Implementation | FEAT-011 |
| FEAT-013 | Shared Repository & Transaction Pattern | Implementation | FEAT-012 |
| FEAT-014 | Core Domain Constraint Baseline | Implementation | FEAT-013 |
| FEAT-015 | Redis Health & Transient State Boundary | Implementation | FEAT-012 |
| FEAT-016 | Product Audit Abstraction & Governance | Implementation | FEAT-013, FEAT-014 |
| FEAT-017 | Development Seed & Test Data Strategy | Implementation | FEAT-012, FEAT-014 |
| FEAT-018 | Phase 3 Data Foundation Integration Gate | Final validation gate | FEAT-011 through FEAT-017 |

## 5. Feature Details

### FEAT-011 - Persistence Boundary & Legacy Data Elimination

Goal:

Ensure the new application has no runtime dependency on legacy JSON-file persistence and document the approved production persistence boundary.

Scope:

- Search and remove or quarantine any runtime `db.json` dependency.
- Establish guard tests or static validation that fail if application runtime reintroduces JSON-file persistence.
- Confirm Phase 2 auth persistence remains PostgreSQL-backed and unchanged.
- Document allowed fixture/test-only JSON usage, if any.

Dependencies:

- FEAT-002 through FEAT-010A Human approved.

Deliverables:

- Source inventory report in implementation evidence.
- Guard test or validation script for no runtime `db.json` dependency.
- Documentation of allowed test fixtures versus prohibited runtime persistence.

Acceptance Criteria:

- No application runtime path reads from or writes to `db.json`.
- Any remaining JSON fixture use is test-only and explicitly documented.
- FEAT-002 through FEAT-010A auth persistence remains unchanged.
- Lint, typecheck, tests, and build pass.

DB/Migration Impact:

- No schema migration expected.

Test Strategy:

- Static source search.
- Unit/guard test for prohibited dependency.
- Regression test suite.

Security/Data-Integrity Risks:

- Accidentally preserving file-backed mutable state would bypass PostgreSQL constraints and auditability.

### FEAT-012 - Migration Reproducibility & Schema Governance

Goal:

Make Prisma/PostgreSQL migration execution reproducible and governed before product-domain schemas expand.

Scope:

- Formalize migration commands for local, test, CI, staging, and production-like environments.
- Validate fresh zero-state migration from a clean PostgreSQL database.
- Validate existing-schema upgrade from the latest approved Phase 2 schema.
- Define migration review rules for non-destructive changes.
- Ensure test database isolation guard remains effective.

Dependencies:

- FEAT-011.

Deliverables:

- Migration workflow documentation.
- Fresh DB migration validation.
- Existing-schema compatibility validation.
- CI/local validation command expectations.

Acceptance Criteria:

- `prisma migrate deploy` succeeds from zero-state.
- `prisma migrate status` reports database schema up to date after deploy.
- Existing Phase 2 rows survive Phase 3 migrations.
- Test/CI DB isolation guard rejects local, staging, and production-like targets.
- Migration validation does not require developer-local `.env` secrets.

DB/Migration Impact:

- May add migration governance helpers or metadata only if required; no product-domain behavior.

Test Strategy:

- Fresh PostgreSQL migration test.
- Existing-schema upgrade test.
- Negative test for unsafe DB target.

Security/Data-Integrity Risks:

- Destructive migrations or unsafe test targeting can cause data loss.

### FEAT-013 - Shared Repository & Transaction Pattern

Goal:

Define and implement the shared repository and transaction pattern for future product-domain modules.

Scope:

- Extend existing repository boundary conventions beyond auth.
- Define a transaction runner/unit-of-work pattern compatible with Prisma.
- Ensure services orchestrate transactions while controllers stay Prisma-free.
- Provide examples/tests using minimal non-product fixture repositories or internal test models only if required.

Dependencies:

- FEAT-012.

Deliverables:

- Shared transaction helper contract.
- Repository factory conventions.
- Tests proving atomic commit/rollback behavior.
- Documentation for future domain modules.

Acceptance Criteria:

- Controllers do not import Prisma internals.
- Services use repository interfaces or repository factories.
- Multi-write operations can execute atomically.
- Forced failure inside a transaction rolls back all writes.
- Raw SQL remains contained, justified, and tested if used.

DB/Migration Impact:

- No product-domain schema expected unless Human approves a minimal test-only strategy.

Test Strategy:

- Unit tests for repository factory/transaction runner.
- PostgreSQL-backed rollback and commit tests.
- Static import boundary checks.

Security/Data-Integrity Risks:

- Incorrect transaction boundaries can create partial product state in later phases.

### FEAT-014 - Core Domain Constraint Baseline

Goal:

Establish database constraint standards and the first approved core-domain schema boundaries needed by upcoming product phases.

Scope:

- Define constraint standards for UUID primary keys, foreign keys, uniqueness, indexes, timestamps, and status enums.
- Define reusable PostgreSQL constraint standards only.
- Do not create Academy, Simulation, Community, Subscription, or AI domain tables.
- Defer concrete domain schemas to their own later phases.
- Avoid implementing Academy, Simulation, Community, Subscription, or AI behavior.

Dependencies:

- FEAT-013.

Deliverables:

- Constraint policy.
- Documentation and/or validation tests for reusable constraint standards.
- No product-domain Prisma schema migrations.

Acceptance Criteria:

- Required unique, foreign-key, not-null, and status constraints are enforced by PostgreSQL.
- Application validation is not treated as a substitute for database integrity.
- Constraint tests exercise live PostgreSQL.
- No product-domain behavior or public APIs are introduced.

DB/Migration Impact:

- No product-domain table migration. Any implementation must avoid adding Academy, Simulation, Community, Subscription, or AI schema.

Test Strategy:

- Live PostgreSQL constraint tests.
- Migration deploy/status tests.
- Regression tests for Phase 2 schemas.

Security/Data-Integrity Risks:

- Premature broad schema design could lock future product phases into weak domain models.

### FEAT-015 - Redis Health & Transient State Boundary

Goal:

Extend the approved Redis responsibility boundary into a shared infrastructure contract for future phases.

Scope:

- Define Redis health checks and failure semantics for infrastructure readiness.
- Keep Redis health as internal readiness/validation only.
- Do not expose sensitive Redis details on public health responses.
- Establish key namespace/isolation conventions for local, test, CI, staging, and production.
- Confirm Redis remains transient-only and PostgreSQL remains durable authority.
- Preserve FEAT-010A rate-limit behavior.

Dependencies:

- FEAT-012.

Deliverables:

- Redis health validation contract.
- Key namespace policy.
- Redis test isolation rules.
- Runtime/health check documentation where approved.

Acceptance Criteria:

- Redis health can be verified by local/CI validation.
- Redis-backed tests use isolated keys or isolated Redis DB.
- Redis is not used as durable business authority.
- FEAT-010A rate-limit regression remains green.

DB/Migration Impact:

- None.

Test Strategy:

- Redis-backed health tests.
- Redis isolation tests.
- Regression tests for FEAT-010A.

Security/Data-Integrity Risks:

- Redis key leakage or accidental durable reliance can weaken recovery and privacy.

### FEAT-016 - Product Audit Abstraction & Governance

Goal:

Define how future product-domain audit events use a shared audit abstraction and governance model without corrupting FEAT-009 semantics.

Scope:

- Define shared product-audit abstraction and governance only.
- Do not extend `AuthSecurityAuditRecord` for product-domain events.
- Preserve FEAT-009 auth audit semantics.
- Defer concrete product-domain audit table creation until a domain feature requires it.
- Define append-only behavior, metadata sanitization, event taxonomy governance, and transaction coupling rules for future domains.
- No public audit read/search/update/delete API.

Dependencies:

- FEAT-013 and FEAT-014.

Deliverables:

- Audit persistence strategy.
- Product-audit abstraction/governance rules.
- Sanitization and metadata limits for future product events.
- Test expectations for future append-only and sensitive-data sentinel behavior.

Acceptance Criteria:

- Existing FEAT-009 audit rows and semantics remain intact.
- Audit persistence is PostgreSQL-backed.
- Metadata is allowlisted/sanitized and size-limited.
- Audit writes never make security denials permissive.
- No public audit management API is introduced.

DB/Migration Impact:

- No migration for product-domain audit tables in FEAT-016.

Test Strategy:

- Existing-schema upgrade test preserving FEAT-009 rows.
- Sensitive-data sentinel tests.
- PostgreSQL-backed append-only tests.

Security/Data-Integrity Risks:

- Audit amplification, sensitive-data persistence, and destructive schema changes.

### FEAT-017 - Development Seed & Test Data Strategy

Goal:

Provide repeatable non-production seed and test-data workflows without introducing default production credentials or unsafe state.

Scope:

- Define local development seed command and idempotency expectations.
- Define test seed helpers for isolated PostgreSQL databases.
- Allow dev/test seed users.
- Ensure no default admin credentials or production-like secrets are introduced.
- Prohibit seed execution in production and staging.
- Keep admin provisioning server-controlled.
- Keep seeds out of runtime authorization authority unless explicitly created through server-controlled paths.

Dependencies:

- FEAT-012 and FEAT-014.

Deliverables:

- Development seed policy.
- Seed command/test helper expectations.
- Safety checks for environment and secrets.
- Documentation for resetting local/test data.

Acceptance Criteria:

- Seeds are idempotent.
- Seed execution is blocked in production/staging.
- Seed data contains no real user PII or production secrets.
- Test data runs only against isolated test DBs.
- Dev/test seed users are allowed.
- No default ADMIN credentials are introduced.
- FEAT-007/FEAT-008 server-controlled admin provisioning remains intact.

DB/Migration Impact:

- No schema migration expected unless seed metadata is approved.

Test Strategy:

- Idempotency tests.
- Environment safety tests.
- Isolated DB seed tests.

Security/Data-Integrity Risks:

- Seeded privileged users or secrets can become production vulnerabilities if not environment-gated.

### FEAT-018 - Phase 3 Data Foundation Integration Gate

Goal:

Validate the integrated Phase 3 data foundation before Phase 4 begins.

Scope:

- Gate/validation only.
- No new product behavior.
- Cross-feature verification for FEAT-011 through FEAT-017.
- Full regression for FEAT-001 through FEAT-010A.

Dependencies:

- FEAT-011 through FEAT-017 QA PASS and Human Final Gate approval.

Deliverables:

- `reports/qa/phase-3/FEAT-018-QA.md`.
- Phase 3 PASS/FAIL recommendation.
- Evidence for Human Final Gate.

Acceptance Criteria:

- No runtime `db.json` dependency exists.
- Migrations are reproducible from zero-state.
- Existing-schema migration compatibility passes.
- Transaction commit/rollback behavior is verified with live PostgreSQL.
- Redis health and isolation are verified.
- Database constraints protect approved core integrity.
- Integration tests use isolated test database and isolated Redis state.
- FEAT-001 through FEAT-010A regression remains green.
- No unresolved P0/P1 data-integrity or security defect remains.

DB/Migration Impact:

- None; validation only.

Test Strategy:

- Clean, lint, Prisma validate, typecheck, build.
- Standard test suite.
- PostgreSQL-backed integration suite.
- Redis-backed suite.
- Runtime health/data-foundation smoke where applicable.

Security/Data-Integrity Risks:

- Passing the phase with unverified migrations, unsafe seed behavior, or weak transaction coverage would compromise later product phases.

## 6. Dependency Order

Recommended order:

1. FEAT-011 - Persistence Boundary & Legacy Data Elimination
2. FEAT-012 - Migration Reproducibility & Schema Governance
3. FEAT-013 - Shared Repository & Transaction Pattern
4. FEAT-014 - Core Domain Constraint Baseline
5. FEAT-015 - Redis Health & Transient State Boundary
6. FEAT-016 - Product Audit Abstraction & Governance
7. FEAT-017 - Development Seed & Test Data Strategy
8. FEAT-018 - Phase 3 Data Foundation Integration Gate

Parallelization note:

- FEAT-015 may be specified after FEAT-012 and can proceed in parallel with FEAT-013/FEAT-014 if it does not change database schema.
- FEAT-016 should wait until repository/transaction conventions are approved.
- FEAT-017 should wait until migration and constraint boundaries are stable.
- FEAT-018 must remain last.

## 7. Phase 3 Final Gate

The Phase 3 final gate should be FEAT-018.

PASS requires:

- FEAT-011 through FEAT-017 are DONE, QA PASS, and Human Final Gate approved.
- All Phase 3 tracker acceptance criteria pass.
- Fresh PostgreSQL migration and existing-schema migration compatibility pass.
- Transaction tests prove atomic rollback/commit behavior.
- Redis health and test isolation pass.
- No runtime `db.json` dependency exists.
- No P0/P1 data-integrity or security defects remain.
- Phase 4 remains unstarted until Human approves Phase 3.

FAIL conditions:

- Runtime file-backed persistence remains.
- Migrations are not reproducible.
- Test/CI can target local, staging, or production data.
- Transaction rollback behavior is unverified or broken.
- Redis is used as durable business authority.
- Database constraints do not protect approved core integrity.
- Phase 2 auth/security regression is found.

## 8. Human Decisions Required

Human has already approved:

1. FEAT-011 through FEAT-018 sequence.
2. FEAT-014 constraint-standards-only boundary.
3. FEAT-016 product-audit governance-only boundary.
4. FEAT-015 internal Redis readiness/validation boundary.
5. FEAT-017 dev/test seed-user allowance with no default ADMIN credentials.
6. No global Phase 3 soft-delete convention.

Current governance state after FEAT-017 Human Final Gate:

- FEAT-016 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-017 is DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-018 is UNBLOCKED FOR PLANNING; implementation remains NOT_STARTED.
- Phase 4 remains blocked until Phase 3 receives PASS or Human-approved CONDITIONAL PASS.

## 9. Readiness

APPROVED FOR FEATURE SPECIFICATION.

The proposed decomposition keeps Phase 3 planning focused on shared data foundations, preserves approved Phase 2 identity/security behavior, and reserves product-domain behavior for later phases.
