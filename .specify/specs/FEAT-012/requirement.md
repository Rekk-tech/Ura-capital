# Requirement: FEAT-012 Migration Reproducibility & Schema Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature Type**: Implementation feature  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

Phase 2 is DONE, QA PASS, and Human Final Gate APPROVED. FEAT-002 through FEAT-010A established the approved PostgreSQL/Prisma identity and security schema. FEAT-011 is DONE, QA PASS, and Human Final Gate APPROVED, proving the rebuilt runtime has no legacy `db.json` persistence dependency.

FEAT-012 is the next Phase 3 feature. It must make PostgreSQL migration execution reproducible and governed before later Phase 3 features introduce shared repository, transaction, constraint, Redis-health, audit-governance, and seed workflows.

FEAT-012 is not a product-domain schema feature. It must not create Academy, Simulation, Community, Subscription, AI, or other product-domain tables.

## 2. Goal

Define and validate a governed Prisma/PostgreSQL migration workflow that is reproducible from zero-state, safe for existing approved schemas, and isolated across local, test, CI, staging, and production environments.

## 3. In Scope

- Fresh zero-state PostgreSQL migration validation.
- Existing-schema upgrade validation from the latest approved FEAT-011/Phase 2 schema state.
- `prisma migrate deploy` and `prisma migrate status` workflow rules.
- Local, test, CI, staging, and production migration rules.
- Test database isolation guard review and extension where needed.
- Non-destructive migration review rules.
- No developer-local `.env` dependency for validation.
- Rollback and forward-fix governance.
- Migration ordering and checksum integrity checks.
- FEAT-002 through FEAT-011 regression preservation.
- Implementation evidence in `reports/implementation/phase-3/FEAT-012.md`.

## 4. Out of Scope

- Product-domain schema creation.
- Academy, Simulation, Community, Subscription, or AI tables.
- Redesigning FEAT-002 through FEAT-010A identity/security schema.
- Changing approved auth, session, RBAC, admin, audit, rate-limit, or persistence-guard behavior.
- Development seed strategy; FEAT-017 owns seeds.
- Shared repository or transaction pattern implementation; FEAT-013 owns that.
- Redis health implementation; FEAT-015 owns that.
- Product-domain audit table creation; FEAT-016 owns audit governance only.
- Phase 4 planning or implementation.

## 5. Functional Requirements

- **FR-001**: The implementation MUST define a reproducible migration workflow for Prisma/PostgreSQL using approved project commands.
- **FR-002**: The implementation MUST validate fresh zero-state migration against an isolated PostgreSQL database.
- **FR-003**: The implementation MUST validate existing-schema upgrade compatibility from the latest approved schema state without data loss.
- **FR-004**: The implementation MUST run and record `prisma migrate deploy` evidence.
- **FR-005**: The implementation MUST run and record `prisma migrate status` evidence after deploy.
- **FR-006**: Migration validation MUST NOT depend on developer-local `.env`; required database URLs must be supplied by explicit environment configuration or CI secrets.
- **FR-007**: Test/CI migration validation MUST target isolated test databases and MUST fail fast against local development, staging, production, or production-like database targets.
- **FR-008**: The test database isolation guard MUST protect migration and database-backed validation commands, not only ordinary tests.
- **FR-009**: Non-destructive migration review rules MUST classify destructive operations, rename/drop risks, raw SQL, and data backfill risks before migration execution.
- **FR-010**: Any destructive or data-loss migration MUST require explicit Human approval before implementation or deployment.
- **FR-011**: Applied migration files MUST be treated as immutable; checksum drift or edited-applied migrations MUST be detected and treated as a blocking issue.
- **FR-012**: Migration ordering MUST be deterministic and reviewable by timestamp/order naming.
- **FR-013**: Rollback governance MUST prefer forward-fix migrations for shared/staging/production-like environments; destructive rollback/reset is prohibited unless explicitly Human-approved for disposable local/test databases.
- **FR-014**: CI migration expectations MUST use provisioned isolated PostgreSQL service/database and safe test secrets, never developer-local services.
- **FR-015**: Staging and production migration rules MUST require dedicated data stores, protected secrets, pre-deploy review, and post-deploy status verification.
- **FR-016**: FEAT-012 MUST preserve all existing FEAT-002 through FEAT-011 behavior and validation results.
- **FR-017**: FEAT-012 MUST NOT introduce product-domain tables, product APIs, UI, seed behavior, or Redis health behavior.
- **FR-018**: Implementation evidence MUST include database names or safe identifiers, commands run, migration counts, pass/fail results, regression evidence, limitations, and AC mapping.

## 6. Non-Functional Requirements

- No hard-coded secrets.
- No raw database URLs, credentials, tokens, cookies, passwords, or local absolute paths in logs/reports.
- Validation must be deterministic from a clean checkout.
- Migration checks must be understandable by a QA reviewer without relying on private agent chat.
- Governance rules must be strict enough for future domain migrations but must not block approved documentation/test fixtures.

## 7. Dependencies

- FEAT-011 DONE / QA PASS / Human Final Gate APPROVED.
- ADR-003 PostgreSQL/Prisma accepted.
- Approved environment strategy.
- Existing FEAT-002 through FEAT-010A migrations and database-backed tests.

## 8. Success Definition

FEAT-012 is successful when:

- A clean PostgreSQL database can be migrated from zero-state.
- An existing approved schema with representative Phase 2 data can be upgraded without data loss.
- `migrate deploy` and `migrate status` workflows are documented and verified.
- Test/CI migration validation cannot target local/staging/production data.
- Applied migration integrity and ordering are governed.
- FEAT-002 through FEAT-011 regression remains green.

## 9. Open Questions

None blocking for Human review.

Human may later choose to require a dedicated CI job name for migration validation, but FEAT-012 can specify the required behavior without waiting for that naming decision.
