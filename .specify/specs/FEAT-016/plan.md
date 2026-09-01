# Implementation Plan: FEAT-016 Product Audit Abstraction & Governance

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Implementation Scope**: Documentation, shared abstraction/governance, tests/guards only

## 1. Objective

Create a reusable product audit governance baseline for future product domains while preserving FEAT-009 authentication/security audit behavior and avoiding premature product-domain schema.

## 2. Architecture Decisions

### Decision 1 - Separate Auth/Security Audit From Product Audit

Selected:

- Keep FEAT-009 `AuthSecurityAuditRecord` scoped to authentication/security events only.
- Define product-domain audit as a separate future capability with separate schema activation.

Rationale:

- Prevents auth/security audit from becoming an overloaded generic event table.
- Preserves approved FEAT-009 semantics and QA evidence.

Rejected:

- Reusing `AuthSecurityAuditRecord` for product-domain events.
- Adding a generic catch-all audit table in FEAT-016.

Implication:

- Later domain features must explicitly approve their own audit persistence schema.

### Decision 2 - PostgreSQL Future Durable Authority

Selected:

- Future product audit persistence must be PostgreSQL-backed.

Rationale:

- ADR-003 establishes PostgreSQL as durable source of truth.
- Audit records need relational integrity, migrations, and queryability.

Rejected:

- Redis durable audit state.
- Application logs or JSON files as audit storage.
- Client-side audit state.

Implication:

- Redis remains transient only under FEAT-015.

### Decision 3 - Governance Before Schema

Selected:

- FEAT-016 defines rules, abstractions, and tests/guards but does not create product audit tables.

Rationale:

- Concrete audit rows require domain-specific event taxonomy, retention, metadata, and volume decisions.

Rejected:

- Creating placeholder `ProductAuditRecord` now.
- Creating Academy/Simulation/Community/Subscription/AI audit models now.

Implication:

- Future features must include schema activation criteria before implementation.

### Decision 4 - Explicit Transaction Strategy Per Event

Selected:

- Every future product audit event must choose one strategy: transactionally coupled, state-first, or best-effort.

Rationale:

- FEAT-009 showed that one generic audit-failure rule is unsafe.
- Some operations must roll back on audit failure; others must preserve risk-reducing state.

Rejected:

- Global always-rollback audit policy.
- Global always-best-effort audit policy.

Implication:

- Future specs must include event-level transaction matrices.

## 3. Deliverables

- Product audit governance documentation, recommended path: `docs/product-audit-governance.md`.
- Optional shared product audit abstraction types/interfaces if useful, without runtime product behavior.
- Static/unit tests or guards proving:
  - No product-domain audit schema/migration/API/UI was introduced.
  - `AuthSecurityAuditRecord` semantics remain unchanged.
  - Metadata policy and transaction-classification rules are enforceable.
- Updated `docs/progress-tracker.md`.
- Implementation report at `reports/implementation/phase-3/FEAT-016.md`.

## 4. Work Plan

1. Review approved FEAT-009, FEAT-011, FEAT-012, FEAT-013, FEAT-014, and FEAT-015 artifacts.
2. Add product audit governance documentation.
3. Define future product audit abstraction contracts.
4. Add deterministic tests/guards for scope, metadata, and transaction strategy rules.
5. Verify no Prisma schema or migration changes are made unless Human explicitly approves an unexpected governance-only metadata need.
6. Run full validation.
7. Update implementation report and tracker.

## 5. Migration Plan

Expected migration impact:

- None.

Rules:

- Do not add product-domain audit table/model/migration.
- Do not modify `AuthSecurityAuditRecord`.
- Do not create Academy, Simulation, Community, Subscription, AI, or placeholder domain tables.
- If an unexpected migration appears necessary, stop and request Human approval.

## 6. Test Strategy

Unit/static tests:

- Product audit governance document exists and includes required MUST/SHOULD/DOMAIN-SPECIFIC sections.
- Metadata policy rejects prohibited sensitive field names/examples.
- Transaction strategy policy requires explicit classification.
- Schema/API scope guard detects product audit table/API/UI creep.
- FEAT-009 auth audit taxonomy/record semantics remain unchanged.

Integration/regression tests:

- Existing FEAT-009 audit tests remain green.
- Existing PostgreSQL-backed tests remain green.
- Redis tests remain green to prove FEAT-015 boundary is unaffected.
- Migration guard remains green with no new migrations.

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
npm run guard:boundary
```

## 7. Security And Data Integrity Risks

- Blurring auth/security audit and product audit could weaken incident investigation.
- Premature generic schemas can capture sensitive product data without retention/privacy decisions.
- Best-effort audit misuse can hide critical state changes.
- Transactionally coupled audit misuse can create unnecessary outages.
- Client-controlled operation source or actor/subject fields can corrupt audit trustworthiness.

Mitigation:

- Keep FEAT-016 governance-only.
- Require future domain event-level classification and Human approval.
- Prohibit sensitive metadata and public audit mutation/read APIs.
- Use FEAT-013 repository/transaction patterns and FEAT-014 constraint standards when future schema is activated.

## 8. Rollback Plan

Because FEAT-016 should not create migrations or product runtime behavior, rollback is expected to be documentation/test changes only. If implementation unexpectedly changes runtime behavior, QA must fail the feature and require rework.

## 9. Out-of-Scope Confirmation

FEAT-016 must not:

- Start FEAT-017.
- Create product audit persistence tables.
- Modify auth/security audit semantics.
- Add public audit APIs or UI.
- Add product-domain schema.
- Start Phase 4.

## 10. Completion Criteria

FEAT-016 is ready for Codex QA when all acceptance criteria are mapped, required validation passes, implementation evidence is truthful, and FEAT-017 remains blocked.
