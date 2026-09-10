# Aura Capital - Integration Strategy

Status: HUMAN APPROVED  
Date: 2026-09-07

## 1. Principle

Develop in parallel. Integrate sequentially.

Human Approval:

```text
INTEGRATION STRATEGY: APPROVED
```

```text
DEV-A: Phase 4 -> Phase 5
DEV-B: Phase 6 -> Phase 7

Merge/integration order:
main <- Phase 4 <- Phase 5 <- Phase 6 <- Phase 7
```

## 2. Sequential Merge Rule

Before a later phase can merge:

1. Rebase onto latest approved `main`.
2. Re-run fresh DB migration validation.
3. Re-run upgrade DB validation from latest approved main.
4. Re-run Redis-backed validation if Redis is used or touched.
5. Re-run full validation suite.
6. Re-run cross-phase integration tests for all consumed FROZEN/PROVISIONAL contracts.
7. Produce phase QA report under `reports/qa/phase-N/PHASE-N-QA.md`.
8. Receive Human Phase Final Gate approval.

## 3. Phase QA Strategy

Codex performs QA at phase level under the new workflow.

Each completed phase must produce:

```text
reports/qa/phase-N/PHASE-N-QA.md
```

Phase QA reviews:

- All FEATs in the phase.
- Feature integration behavior.
- Security and authorization boundaries.
- PostgreSQL migrations and constraints.
- Repository/UoW usage.
- Transaction rollback/concurrency.
- Redis boundary and outage behavior.
- Product audit policy.
- Frontend/API integration where applicable.
- Cross-phase contract compliance.
- Full regression from Phase 1 onward.

Human performs Phase Final Gate, not mandatory FEAT-by-FEAT final gates. Feature specs and implementation reports remain mandatory.

## 4. Validation Baseline

Every implementation phase must run, at minimum:

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

This 14-command gate is canonical for phase QA. Changing from feature QA to phase QA must not reduce validation coverage.

If a phase does not use Redis, `test:redis` still runs as regression for Phase 2/3 Redis behavior.

Mandatory skips cannot produce PASS. Environment unavailable must be reported as `ENVIRONMENT BLOCKED` or `NOT VERIFIED`.

## 5. Migration Coordination

Every schema-owning feature or phase gate must prove:

- Fresh zero-state migration.
- Upgrade from latest approved main.
- Migration status is up to date.
- Migration guard passes.
- No destructive/data-loss migration without Human approval.
- Existing rows and constraints are preserved.
- Applied approved migrations are not edited.

Applied/approved migration directories are immutable:

- Never rename.
- Never reorder.
- Never edit.

Parallel branches must reserve migration ranges and rebase before merge. If timestamp conflicts occur, only unapplied migration names may be coordinated before merge.

Reserved future ranges:

- Remaining new Phase 4 work: `20261004xxxxxx_feat025_...` through `20261004xxxxxx_feat030_...`
- Phase 5: `20261005xxxxxx_feat031_...` through `20261005xxxxxx_feat040_...`
- Phase 6: `20261006xxxxxx_feat041_...` through `20261006xxxxxx_feat047_...`
- Phase 7: `20261007xxxxxx_feat048_...` through `20261007xxxxxx_feat054_...`

Existing approved Phase 4 `202609...` migrations are historical/applied artifacts and must not be renamed into a reserved future range.

## 6. Contract Integration

Contract-first branches may use mocks only for SOFT/PROVISIONAL contracts.

When upstream implementation becomes available:

- Remove or isolate mocks from integration path.
- Replace with real API/repository calls.
- Run contract compatibility tests.
- Any contract mismatch maps back to the producing phase/feature.

## 7. Failure Policy

FAIL if any of the following are found:

- Authentication or authorization bypass.
- Client-authoritative business state.
- Durable business authority stored only in Redis.
- Migration integrity failure.
- PostgreSQL constraint gap for approved invariants.
- Data corruption under concurrency/retry.
- Sensitive secret/token/password leakage.
- Audit misuse or `AuthSecurityAuditRecord` repurposing.
- Mandatory validation not executed.

CONDITIONAL PASS is prohibited for P0/P1 security, data-integrity, migration, transaction, Redis authority, seed safety, auth/RBAC regression, or mandatory validation failures.
