# Plan: FEAT-018 Phase 3 Data Foundation Integration Gate

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-018  
**Planning Mode**: Validation-only. No product functionality.

## 1. Architecture

FEAT-018 is the Phase 3 final integration gate. It validates the combined data-foundation behavior already established by FEAT-011 through FEAT-017.

The feature owns:

- validation orchestration
- cross-feature integration tests where missing
- environment setup for isolated PostgreSQL and Redis evidence
- guard suite execution
- migration and drift evidence
- report generation
- QA/Human gate readiness

The feature does not own:

- new product-domain schema
- new product APIs
- new UI
- product audit persistence
- durable Redis business state
- new auth/session behavior
- new seed behavior
- Phase 4 implementation

## 2. Inputs

Approved Phase 3 feature packages:

- `.specify/specs/FEAT-011/`
- `.specify/specs/FEAT-012/`
- `.specify/specs/FEAT-013/`
- `.specify/specs/FEAT-014/`
- `.specify/specs/FEAT-015/`
- `.specify/specs/FEAT-016/`
- `.specify/specs/FEAT-017/`

Implementation and QA evidence:

- `reports/implementation/phase-3/FEAT-011.md` through `reports/implementation/phase-3/FEAT-017.md`
- `reports/qa/phase-3/FEAT-011-QA.md` through `reports/qa/phase-3/FEAT-017-QA.md`

Governance and architecture:

- `docs/AGENT_WORKFLOW.md`
- `docs/progress-tracker.md`
- `docs/phase-3-feature-decomposition.md`
- `docs/environment-strategy.md`
- `docs/code-standards.md`
- `docs/adrs/ADR-003-postgresql-and-prisma.md`
- `docs/adrs/ADR-005-redis-responsibility.md`
- `docs/data-constraint-standards.md`
- `docs/product-audit-governance.md`

## 3. Validation Strategy

### 3.1 Governance Preflight

Verify:

- FEAT-011 through FEAT-017 are DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-018 is approved for implementation before Antigravity starts.
- FEAT-018 remains validation-only.
- Phase 3 remains IN_PROGRESS until FEAT-018 Human Final Gate.
- Phase 4 remains BLOCKED.

### 3.2 Static Scope Review

Search and review for:

- product-domain Prisma models or migrations
- Academy/Simulation/Community/Subscription/AI schema
- new product API routes/controllers
- new UI screens
- product audit table/API/UI
- durable Redis business state
- public role/admin/audit surfaces
- new seed behavior beyond validation-only usage
- runtime JSON/file persistence
- direct Prisma use in controllers/ordinary services
- raw SQL outside approved scope

### 3.3 Fresh PostgreSQL Migration

Use:

```text
aura_capital_test_feat018_fresh
```

Run:

```text
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
npx prisma validate --schema=apps/api/prisma/schema.prisma
```

Record:

- migration count and ordered names
- status result
- drift/checksum validation result
- database target safety result
- any review-only migration risks

### 3.4 Existing-Schema Upgrade

Use:

```text
aura_capital_test_feat018_upgrade
```

Seed or create representative approved rows:

- user
- credential
- role
- user-role
- refresh session
- auth security audit row
- seed fixture row(s) if needed to prove FEAT-017 compatibility

Apply current migrations and verify:

- rows preserved
- unique constraints enforced
- FK constraints enforced
- refresh/session operations still work
- audit records remain valid
- no destructive/data-loss migration

### 3.5 Transaction Integration

Validate:

- root UoW opens exactly one Prisma transaction
- successful root run commits
- thrown failure rolls back
- DB constraint failure rolls back
- composed rollback is atomic
- active transaction context reuse succeeds
- accidental nested UoW fails fast
- no second nested Prisma transaction opens
- ALS context clears after commit and rollback
- sequential and parallel transactions do not leak contexts
- transaction-scoped repositories receive transaction client

Regression flows:

- FEAT-003 registration atomicity
- FEAT-009 role assignment plus audit transactional coupling
- FEAT-005 refresh/session security state
- FEAT-017 seed multi-write transaction

### 3.6 Constraint Integration

Use existing approved schema plus neutral test-only fixtures where needed.

Validate live PostgreSQL evidence for:

- UUID primary keys
- NOT NULL
- unique
- composite unique
- foreign keys
- valid FK acceptance
- one-to-one uniqueness
- cascade
- restrict/no-action
- set-null
- closed-set status/check behavior
- concurrent duplicate protection

No production product-domain schema may be introduced to prove constraints.

### 3.7 Redis Integration

Use live Redis with isolated FEAT-018 run/worker namespace.

Validate:

- internal readiness
- public liveness independence
- outage and recovery
- fail-closed protected auth rate limiting
- positive TTLs
- multi-instance shared counters/state
- production namespace semantics remain unchanged
- test namespace includes runId and workerId isolation
- cleanup cannot delete unrelated namespaces
- diagnostics redact host/port/URL/key/token/secret/path data

### 3.8 Seed Integration

Validate:

- `seed:dev` allowed only with local-development predicates
- `seed:test` allowed only with isolated test predicates
- CI seed allowed only under CI test predicates
- staging/prod/prod-like/unknown/conflicting targets fail before mutation
- dev password length >= 12
- no generated plaintext dev credential
- no default ADMIN
- test ADMIN opt-in only
- normal registration remains zero-role
- explicit cleanup ownership
- unrelated users survive cleanup
- no product-domain seed data
- seed data not embedded in migrations

### 3.9 Phase 2 Security Regression

Validate:

- registration
- login
- short-lived role-free JWT
- refresh rotation and replay family revocation
- logout/session invalidation
- RBAC server-side PostgreSQL authority
- admin guard
- auth/security audit events
- authentication endpoint rate limiting

### 3.10 Audit Governance Integration

Validate:

- `AuthSecurityAuditRecord` remains unchanged and auth-only.
- FEAT-009 taxonomy remains unchanged.
- Product audit table/model/migration is absent.
- Product audit public API/UI is absent.
- Metadata governance and transaction strategy governance pass.
- Observability logs are not treated as durable audit records.

## 4. Guard Strategy

Run mandatory guards:

```text
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```

Default decision:

```text
guard:phase3-integration = NOT REQUIRED
```

Do not add a new Phase 3 integration guard unless a concrete validation gap cannot be covered by the mandatory guards or integration tests.

If a future approved rework introduces:

```text
npm run guard:phase3-integration
```

it may only orchestrate or verify execution of existing guards and cannot create a weaker duplicate source of truth.

## 5. Full Validation Pipeline

Run sequentially:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```

If FEAT-018 adds validation-only integration tests, run those too. If a future approved rework introduces `guard:phase3-integration`, run it in addition to the mandatory guards.

No mandatory skips are allowed. Actual counts must be discovered and reported at execution time.

## 6. Environment Failure Policy

FEAT-018 cannot PASS if mandatory infrastructure is unavailable.

If PostgreSQL, Redis, Docker, Prisma engines, or mandatory test infrastructure cannot run, reports must state:

```text
ENVIRONMENT BLOCKED
```

or:

```text
NOT VERIFIED
```

Missing execution must not be converted into PASS.

## 7. Defect Severity Rules

- **P0 Blocker**: data loss, auth/authz bypass, plaintext credential persistence, public privilege escalation, production/staging seed mutation, durable Redis authority, or secret/token/password leak.
- **P1 Blocker**: migration failure, drift undetected, DB constraint failure, transaction rollback failure, Redis fail-closed regression, seed safety failure, missing required live DB/Redis validation, or false report evidence.
- **P2 Non-blocking only with explicit acceptance**: minor documentation mismatch, advisory diagnostics polish, or non-critical test organization issue with equivalent evidence.
- **P3 Advisory**: naming, cleanup, or future hardening note.

## 8. PASS / CONDITIONAL PASS / FAIL Gate

PASS requires:

- AC-001 through AC-039 pass.
- All mandatory commands pass.
- Fresh and upgrade DB evidence pass.
- Redis evidence pass.
- Guard suite passes.
- Phase 2 regression passes.
- No unresolved P0/P1 remains.
- Governance is consistent.

CONDITIONAL PASS may be recommended only for explicitly accepted non-blocking technical debt and never for mandatory validation gaps or security/data-integrity failures.

FAIL is required for any P0/P1 blocker, missing mandatory execution, product scope creep, false evidence, or early Phase 4 work.

## 9. Report Requirements

Antigravity implementation report:

```text
reports/implementation/phase-3/FEAT-018.md
```

Must include:

- files changed
- proof validation-only scope is preserved
- fresh DB migration evidence
- existing-schema upgrade evidence
- drift/checksum evidence
- transaction evidence
- constraint evidence
- Redis evidence
- seed evidence
- auth/security regression evidence
- guard results
- actual validation counts
- defects/technical debt
- AC-001 through AC-039 mapping
- Phase 3 exit recommendation
- confirmation FEAT-019/Phase 4 not started

Codex QA report:

```text
reports/qa/phase-3/FEAT-018-QA.md
```

Must independently verify acceptance criteria and issue final verdict PASS or FAIL.

## 10. Governance Plan

1. Codex creates FEAT-018 spec package.
2. Human reviews and approves or requests changes.
3. Antigravity performs validation-only implementation after approval.
4. Codex performs independent FEAT-018 QA.
5. Human performs FEAT-018 and Phase 3 Final Gate.
6. Phase 4 remains blocked until Human approval.
