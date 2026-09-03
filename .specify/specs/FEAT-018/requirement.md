# Requirement: FEAT-018 Phase 3 Data Foundation Integration Gate

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-018  
**Feature Type**: Gate / validation feature  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

FEAT-011 through FEAT-017 have established the Phase 3 data foundation: persistence boundary, migration governance, shared repository and transaction patterns, reusable PostgreSQL constraint standards, Redis transient-state boundary, product audit governance, and non-production seed strategy.

FEAT-018 is the final Phase 3 integration gate. It must independently validate that those pieces work together as a coherent, reproducible, safe foundation for Phase 4 and later product-domain implementation.

FEAT-018 is validation-only. It must not introduce product behavior, product schema, product APIs, UI, durable Redis business state, product audit tables, new auth behavior, new seed behavior, or Phase 4 behavior.

## 2. Goal

Validate the complete Phase 3 Data Foundation across FEAT-011 through FEAT-017 and produce an evidence-backed Phase 3 PASS / CONDITIONAL PASS / FAIL recommendation for Human Final Gate.

The gate must prove:

- PostgreSQL remains the durable authority.
- Redis remains transient only.
- Runtime JSON/file persistence and fallback paths remain prohibited.
- Prisma remains behind approved repository/infrastructure boundaries.
- Migrations are reproducible from zero-state and compatible with existing approved schema.
- Transaction, constraint, Redis, seed, audit-governance, and security regressions are tested together.
- Phase 4 remains blocked until Phase 3 receives Human approval.

## 3. Dependencies

Required completed dependencies before FEAT-018 implementation/final validation:

- FEAT-011 - Persistence Boundary & Legacy Data Elimination: DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-012 - Migration Reproducibility & Schema Governance: DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-013 - Shared Repository & Transaction Pattern: DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-014 - Core Domain Constraint Baseline: DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-015 - Redis Health & Transient State Boundary: DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-016 - Product Audit Abstraction & Governance: DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-017 - Development & Test Seed Strategy: DONE / QA PASS / Human Final Gate APPROVED.

Required governance and architecture inputs:

- `docs/AGENT_WORKFLOW.md`
- `docs/phase-3-feature-decomposition.md`
- `docs/progress-tracker.md`
- `docs/environment-strategy.md`
- `docs/code-standards.md`
- `docs/adrs/ADR-003-postgresql-and-prisma.md`
- `docs/adrs/ADR-005-redis-responsibility.md`
- Approved FEAT-011 through FEAT-017 specs, implementation reports, and QA reports.

## 4. In Scope

- Validation orchestration for Phase 3 final gate.
- Review of FEAT-011 through FEAT-017 approved artifacts and evidence.
- Fresh zero-state PostgreSQL migration validation.
- Existing-schema upgrade validation.
- Migration checksum/drift and ordering validation.
- Persistence boundary validation.
- Repository and Unit of Work boundary validation.
- PostgreSQL transaction integration validation.
- PostgreSQL constraint integration validation.
- Redis readiness, transient-state, namespace, TTL, multi-instance, and isolation validation.
- FEAT-017 seed safety and isolation validation.
- Phase 2 auth/security regression validation.
- FEAT-016 product audit governance validation and FEAT-009 auth audit invariance.
- Static guard suite orchestration.
- Full validation pipeline.
- Defect severity classification and ownership mapping.
- Phase 3 PASS / CONDITIONAL PASS / FAIL recommendation.
- Implementation and QA report requirements for FEAT-018.

## 5. Out of Scope

FEAT-018 MUST NOT create, modify, or specify implementation behavior for:

- New product tables.
- Academy models, APIs, UI, seed data, or behavior.
- Simulation models, APIs, UI, seed data, or behavior.
- Community models, APIs, UI, seed data, or behavior.
- Subscription models, APIs, UI, seed data, or behavior.
- AI models, APIs, UI, seed data, cache behavior, or provider behavior.
- New business APIs.
- New UI.
- New Redis business cache.
- Product audit table or durable product audit persistence.
- New auth behavior.
- New seed behavior.
- Phase 4 behavior.

If validation discovers a defect, FEAT-018 reports the defect and maps it to the owning feature. It must not silently implement product changes to make the gate pass.

## 6. Functional Requirements

- **FR-001**: FEAT-018 MUST remain a validation/integration gate only.
- **FR-002**: FEAT-018 MUST verify FEAT-011 through FEAT-017 are DONE / QA PASS / Human Final Gate APPROVED before implementation/final validation starts.
- **FR-003**: FEAT-018 MUST verify no product-domain schema, API, UI, seed data, product audit table, durable Redis business state, new auth behavior, or Phase 4 behavior is introduced.
- **FR-004**: FEAT-018 MUST validate no runtime dependency on `db.json`, flat-file databases, mutable filesystem persistence, or JSON fallback exists.
- **FR-005**: FEAT-018 MUST validate PostgreSQL remains the durable authority for approved durable state.
- **FR-006**: FEAT-018 MUST validate Redis remains transient-only and is not used as durable business, privilege, seed, or audit authority.
- **FR-007**: FEAT-018 MUST validate controllers and ordinary services remain Prisma-free according to FEAT-013 boundaries.
- **FR-008**: FEAT-018 MUST validate repository factories and Unit of Work/TransactionRunner boundaries remain enforced.
- **FR-009**: FEAT-018 MUST validate zero-state migration reconstruction using fresh isolated PostgreSQL database `aura_capital_test_feat018_fresh` or a stricter equivalent.
- **FR-010**: FEAT-018 MUST validate `prisma migrate deploy`, `prisma migrate status`, and Prisma schema validation.
- **FR-011**: FEAT-018 MUST validate migration checksum/drift, deterministic ordering, and applied migration integrity.
- **FR-012**: FEAT-018 MUST validate existing-schema upgrade compatibility using representative approved rows from FEAT-002 through FEAT-017.
- **FR-013**: FEAT-018 MUST validate seed data is not embedded in migrations and no `db push` governance bypass exists.
- **FR-014**: FEAT-018 MUST validate root UoW commit, rollback, constraint rollback, composed rollback, active context reuse, accidental nested UoW fail-fast, ALS cleanup, and transaction client propagation.
- **FR-015**: FEAT-018 MUST validate transaction-sensitive regressions: registration plus audit, role assignment plus audit, refresh/session security state, and FEAT-017 multi-write seed transaction.
- **FR-016**: FEAT-018 MUST validate live PostgreSQL constraints for UUID/PK, NOT NULL, UNIQUE, composite UNIQUE, FK, one-to-one uniqueness, cascade, restrict/no-action, set-null, closed-set status rules where existing or test-only fixtures apply, and concurrent duplicate protection.
- **FR-017**: FEAT-018 MUST use existing approved schema plus neutral test-only fixtures where needed and MUST NOT create production product-domain tables.
- **FR-018**: FEAT-018 MUST validate Redis readiness, liveness independence, outage recovery, positive TTLs, multi-instance shared state, production namespace rules, test run/worker isolation, and sanitized diagnostics.
- **FR-019**: FEAT-018 MUST validate FEAT-010A rate-limit fail-closed behavior and ensure Redis outage does not incorrectly mutate PostgreSQL auth state or durable audit rows.
- **FR-020**: FEAT-018 MUST validate FEAT-017 seed predicates for local development, test, CI, staging/prod/prod-like rejection, password baseline, no default ADMIN, test ADMIN opt-in, run/worker isolation, cleanup ownership, and no product-domain seed data.
- **FR-021**: FEAT-018 MUST validate Phase 2 security regression: registration, login, access tokens, refresh rotation/replay, logout, RBAC, admin guard, auth audit, and rate limiting.
- **FR-022**: FEAT-018 MUST validate JWT remains role-free and PostgreSQL remains role/admin authority.
- **FR-023**: FEAT-018 MUST validate FEAT-009 auth/security audit semantics remain unchanged.
- **FR-024**: FEAT-018 MUST validate FEAT-016 product audit governance: no product audit table, no product audit public API/UI, no AuthSecurityAuditRecord repurposing, metadata governance, transaction strategy governance, and observability/audit separation.
- **FR-025**: FEAT-018 MUST run the mandatory guard suite: `guard:persistence`, `guard:migration`, `guard:boundary`, `guard:audit-governance`, and `guard:seed-safety`.
- **FR-026**: FEAT-018 MUST default `guard:phase3-integration` to NOT REQUIRED. A new guard may be introduced only if a concrete validation gap cannot be covered by existing guards or integration tests; if introduced, it may only orchestrate or verify existing guards and must not duplicate, replace, or weaken them.
- **FR-027**: FEAT-018 MUST run the full validation pipeline with actual execution evidence and no mandatory skips.
- **FR-028**: FEAT-018 MUST dynamically record actual discovered test file/test counts; historical counts must not be hardcoded as acceptance requirements.
- **FR-029**: FEAT-018 MUST use independent QA databases for both fresh migration validation and existing-schema upgrade validation, including `aura_capital_test_feat018_fresh` and `aura_capital_test_feat018_upgrade` or stricter equivalents, and MUST NOT reuse FEAT-017 DB evidence.
- **FR-030**: FEAT-018 MUST fail or report ENVIRONMENT BLOCKED / NOT VERIFIED if PostgreSQL, Redis, Docker, Prisma engines, or mandatory test infrastructure is unavailable.
- **FR-031**: FEAT-018 MUST verify diagnostics, logs, reports, and failure output do not expose secrets, tokens, cookies, passwords, credential hashes, raw DB URLs, Redis URLs, SQL sensitive values, or sensitive absolute paths.
- **FR-032**: FEAT-018 MUST classify findings using P0/P1/P2/P3 severity rules.
- **FR-033**: FEAT-018 MUST map each defect to the owning feature and must not edit approved earlier specs to hide defects.
- **FR-034**: FEAT-018 MUST define PASS, CONDITIONAL PASS, and FAIL criteria for the Phase 3 gate.
- **FR-035**: FEAT-018 MUST not allow CONDITIONAL PASS for security boundary failure, DB integrity failure, migration failure, transaction failure, Redis authority/fail-closed failure, seed safety failure, auth/RBAC regression, mandatory validation not executed, or unresolved P0/P1 defects.
- **FR-036**: FEAT-018 implementation report MUST be written to `reports/implementation/phase-3/FEAT-018.md`.
- **FR-037**: FEAT-018 QA report MUST be written to `reports/qa/phase-3/FEAT-018-QA.md`.
- **FR-038**: FEAT-018 MUST keep Phase 3 IN_PROGRESS and Phase 4 BLOCKED until FEAT-018 QA PASS and Human Final Gate approval.

## 7. Non-Functional Requirements

- Validation must be reproducible from explicit environment configuration and must not depend on developer-local `.env` secrets.
- DB and Redis evidence must be live evidence where the acceptance criterion depends on PostgreSQL or Redis behavior.
- Mandatory validation failures must not be converted into PASS by using mocks, skipped tests, or stale reports.
- Reports must distinguish actual execution, retained evidence, NOT VERIFIED items, and environment blockers.
- Diagnostics must be sanitized under existing FEAT-013, FEAT-015, and FEAT-017 policies.

## 8. Phase 3 Exit Definition

Phase 3 may be recommended PASS only when:

- FEAT-011 through FEAT-017 remain DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-018 AC-001 through AC-039 pass.
- Fresh zero-state migration passes.
- Existing-schema upgrade and drift checks pass.
- DB integration passes.
- Redis integration passes.
- Transaction regression passes.
- Constraint verification passes.
- Seed safety passes.
- All mandatory guards pass.
- No mandatory skips occur.
- No unresolved P0/P1 blocker exists.
- Governance is consistent.
- Human approves FEAT-018 Final Gate.

## 9. Conditional PASS Policy

CONDITIONAL PASS is permitted only for explicitly accepted non-blocking technical debt such as documented operability polish or already accepted advisory items.

CONDITIONAL PASS is prohibited for:

- Security boundary failure.
- DB integrity failure.
- Migration failure.
- Transaction failure.
- Redis authority or fail-closed failure.
- Seed safety failure.
- Auth/RBAC regression.
- Mandatory validation not executed.
- Unresolved P0/P1 defects.

ADV-001 may remain non-blocking if it is still applicable and does not affect Phase 3 safety.

## 10. Open Questions

No blocking Human decision is required for FEAT-018 planning.

Recommended Human review point: confirm whether CONDITIONAL PASS may be considered for non-blocking technical debt under the policy above, or whether Phase 3 should require strict PASS only.
