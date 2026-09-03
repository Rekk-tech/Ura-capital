# Acceptance Criteria: FEAT-018 Phase 3 Data Foundation Integration Gate

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-018  
**Gate Type**: Phase 3 integration validation

## 1. Acceptance Criteria

| AC | Criterion | Verification |
| --- | --- | --- |
| AC-001 | FEAT-018 remains validation-only and introduces no product functionality. | Source/diff/report review |
| AC-002 | Approved FEAT-011 through FEAT-017 specs, implementation reports, and QA reports are reviewed. | Report evidence |
| AC-003 | FEAT-011 through FEAT-017 are DONE / QA PASS / Human Final Gate APPROVED before FEAT-018 final validation proceeds. | Tracker/report review |
| AC-004 | No product-domain schema, Academy/Simulation/Community/Subscription/AI models, product API, UI, product audit table, durable Redis business state, new auth behavior, new seed behavior, or Phase 4 behavior is introduced. | Source/schema/route/UI review |
| AC-005 | No runtime `db.json`, flat-file database, mutable filesystem persistence, or JSON fallback exists. | Source search and `guard:persistence` |
| AC-006 | PostgreSQL remains durable authority for approved durable state. | Source/DB review |
| AC-007 | Redis remains transient-only and is not durable business, privilege, seed, or audit authority. | Source/Redis review |
| AC-008 | Controllers and ordinary services remain free of direct Prisma delegate queries, Prisma repository construction, direct `$transaction`, and raw SQL. | Source review and `guard:boundary` |
| AC-009 | Repository factories and Unit of Work/TransactionRunner boundaries remain enforced. | Unit/DB tests |
| AC-010 | Fresh isolated PostgreSQL DB strategy uses explicit FEAT-018 test DB names and does not reuse FEAT-017 DB evidence. | DB setup evidence |
| AC-011 | Test DB safety guard rejects local development, staging, production, production-like, missing, and ambiguous targets before mutation. | Guard/negative tests |
| AC-012 | Zero-state `prisma migrate deploy` succeeds and records ordered migration names/count. | Migration evidence |
| AC-013 | `prisma migrate status` and `prisma validate` pass after deploy. | Command evidence |
| AC-014 | Migration checksum/drift detection, applied migration integrity, and deterministic ordering are verified. | Guard/live DB evidence |
| AC-015 | Migrations contain no environment-specific seed data and `prisma db push` is not used as migration governance. | Migration/source review |
| AC-016 | Existing-schema upgrade preserves representative approved user, credential, role, user-role, refresh session, auth security audit, and seed-compatible rows. | Upgrade DB evidence |
| AC-017 | Existing-schema upgrade preserves approved unique, FK, key, and cascade/restrict/set-null constraints. | DB constraint evidence |
| AC-018 | Root UoW commit, forced rollback, DB constraint rollback, composed rollback, active context reuse, nested UoW fail-fast, no nested transaction, ALS cleanup, parallel isolation, and transaction client propagation pass. | Unit and PostgreSQL-backed tests |
| AC-019 | Transaction-sensitive regressions pass for registration plus audit, role assignment plus audit, refresh/session security state, and FEAT-017 seed multi-write transaction. | DB/integration tests |
| AC-020 | Database errors and transaction diagnostics remain safe and do not expose raw DB URLs, SQL values, credentials, tokens, cookies, passwords, secrets, or sensitive paths. | Error/log review |
| AC-021 | Live PostgreSQL verifies UUID/PK, NOT NULL, unique, composite unique, FK, valid FK acceptance, one-to-one, cascade, restrict/no-action, set-null, closed-set status, and concurrent duplicate protection where applicable. | DB tests |
| AC-022 | Constraint validation uses approved existing schema and neutral test-only fixtures only; no production product-domain migration is added. | Schema/migration/source review |
| AC-023 | Redis readiness, public liveness independence, outage recovery, positive TTLs, multi-instance shared state, namespace rules, run/worker isolation, and cleanup safety pass. | Redis tests |
| AC-024 | Redis diagnostics and test output are sanitized and do not expose raw Redis URL, host/port where prohibited, keys, tokens, cookies, passwords, secrets, or sensitive paths. | Log/output review |
| AC-025 | Redis test cleanup cannot delete unrelated run/worker/environment namespaces. | Redis integration tests |
| AC-026 | FEAT-010A rate limiting remains fail-closed for protected auth endpoints and aliases, with no incorrect PostgreSQL mutation or durable audit amplification during Redis outage/throttling. | Redis/API/DB tests |
| AC-027 | FEAT-017 seed safety passes: local/test/CI predicates, staging/prod/prod-like rejection, password baseline, no default ADMIN, test ADMIN opt-in only, cleanup ownership, run/worker isolation, no product-domain seed data, and no seed data in migrations. | Seed tests and `guard:seed-safety` |
| AC-028 | FEAT-009 auth/security audit semantics remain unchanged. | Source/DB regression |
| AC-029 | FEAT-016 product audit governance remains intact: no product audit table/API/UI, no AuthSecurityAuditRecord repurposing, metadata governance, transaction strategy governance, and observability/audit separation. | `guard:audit-governance` and source review |
| AC-030 | Phase 2 security regression passes for registration, login, JWT, refresh, logout, RBAC, admin guard, auth audit, and rate limiting. | Unit/integration/DB/Redis/runtime |
| AC-031 | Mandatory guard suite passes: persistence, migration, boundary, audit-governance, and seed-safety. | Command evidence |
| AC-032 | `guard:phase3-integration` is NOT REQUIRED by default; if introduced later for a concrete uncovered validation gap, it only orchestrates/verifies existing guards and does not replace or weaken them. | Guard/source review |
| AC-033 | Full validation pipeline passes: clean, lint, Prisma validate, typecheck, build, standard tests, unit tests, DB tests, Redis tests, and mandatory guards. | Command evidence |
| AC-034 | Actual discovered test file/test counts are recorded dynamically; historical counts are not hardcoded as acceptance requirements. | Report review |
| AC-035 | Responses, logs, diagnostics, DB rows, Redis output, and reports do not expose secrets, credentials, tokens, cookies, passwords, credential hashes, raw DB/Redis URLs, SQL sensitive values, or sensitive absolute paths. | Security sentinel review |
| AC-036 | Mandatory infrastructure unavailability is reported as ENVIRONMENT BLOCKED or NOT VERIFIED and cannot be converted into PASS. | Report/QA review |
| AC-037 | Defects are classified with P0/P1/P2/P3 severity and mapped to owning features without editing approved earlier specs to hide them. | Defect report review |
| AC-038 | `reports/implementation/phase-3/FEAT-018.md` truthfully records validation evidence, actual counts, limitations, AC mapping, defects/technical debt, and Phase 3 exit recommendation. | Implementation report review |
| AC-039 | Governance remains consistent: FEAT-018 in review/QA until Human Final Gate, Phase 3 IN_PROGRESS until FEAT-018 approval, and Phase 4 BLOCKED until Phase 3 PASS or Human-approved CONDITIONAL PASS. | Tracker/report review |

## 2. Mandatory PASS Conditions

FEAT-018 may receive QA PASS only when:

- AC-001 through AC-039 pass.
- FEAT-011 through FEAT-017 remain DONE / QA PASS / Human Final Gate APPROVED.
- Fresh zero-state migration passes.
- Existing-schema upgrade and migration drift checks pass.
- DB integration passes.
- Redis integration passes.
- Transaction regression passes.
- Constraint verification passes.
- Seed safety passes.
- All mandatory guards pass.
- Full validation pipeline passes.
- No mandatory skips occur.
- No unresolved P0/P1 blocker exists.
- Governance is consistent.

## 3. Conditional PASS Conditions

CONDITIONAL PASS may be considered only when:

- No P0 issue exists.
- No P1 issue exists.
- No security boundary failure exists.
- No DB integrity failure exists.
- No migration/transaction/Redis/seed/auth/RBAC regression exists.
- All mandatory validations actually executed.
- The remaining issue is non-blocking technical debt.
- Human explicitly accepts the condition.

ADV-001 may remain non-blocking if still applicable and unrelated to Phase 3 safety.

## 4. Mandatory FAIL Conditions

FEAT-018 must FAIL if any of the following are true:

- FEAT-018 introduces product behavior, product schema, product APIs, UI, product audit table, durable Redis business state, new auth behavior, new seed behavior, or Phase 4 behavior.
- Any FEAT-011 through FEAT-017 dependency is not DONE / QA PASS / Human Final Gate APPROVED.
- Runtime JSON/file persistence or fallback exists.
- PostgreSQL is bypassed as durable authority.
- Redis becomes durable business, privilege, seed, or audit authority.
- Migration deploy/status/validate, drift detection, or existing-schema upgrade fails.
- Test DB safety can target local development, staging, production, production-like, missing, or ambiguous targets.
- Required transaction behavior fails.
- Required database constraints fail.
- Redis readiness/transient/rate-limit fail-closed behavior fails.
- Seed safety fails or production/staging seed mutation is possible.
- Phase 2 auth/security regression fails.
- FEAT-009 or FEAT-016 audit boundary regresses.
- Required guards fail.
- Mandatory validation is skipped or not executed.
- Secrets, credentials, tokens, cookies, passwords, hashes, raw URLs, SQL sensitive values, or sensitive paths leak.
- Any unresolved P0/P1 blocker remains.
- Phase 4 starts before Phase 3 Human approval.

## 5. Required Validation Suite

Mandatory sequential validation:

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

If FEAT-018 introduces validation-only integration tests, those commands are mandatory too. If a future approved rework introduces `guard:phase3-integration`, that command is mandatory in addition to the existing guards.

## 6. Human Review Checklist

- [ ] FEAT-018 is validation-only.
- [ ] FEAT-018 does not create product-domain behavior.
- [ ] Fresh and upgrade DB strategies are independent and safe.
- [ ] Redis strategy preserves transient-only authority.
- [ ] Seed strategy validation preserves no default ADMIN and no production/staging seed.
- [ ] Phase 2 security regression is included.
- [ ] Guard suite is complete.
- [ ] Conditional PASS policy is acceptable.
- [ ] Phase 4 remains blocked until Human approves Phase 3.

## 7. Final Gate

Implementation may begin only after Human approval of this spec package.

Phase 4 must not begin until:

1. FEAT-018 receives Codex QA PASS or Human-approved CONDITIONAL PASS.
2. Human explicitly approves Phase 3 Final Gate.
