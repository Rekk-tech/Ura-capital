# Acceptance Criteria: FEAT-017 Development & Test Seed Strategy

**Status**: APPROVED FOR IMPLEMENTATION

## 1. Acceptance Matrix

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-001 | `seed:dev` runs only when all predicates pass: `NODE_ENV=development`, explicit development seed mode, `CI` is not true, and `DATABASE_URL` passes the approved local-development DB target classifier. | Unit/static/runtime guard tests. |
| AC-002 | `seed:test` runs only when all predicates pass: `NODE_ENV=test`, explicit test seed mode, non-CI context unless explicitly using CI seed mode, and `DATABASE_URL` passes the FEAT-012 isolated test-target classifier. | Unit/static/runtime guard tests. |
| AC-003 | CI seed runs only when all predicates pass: `CI=true`, `NODE_ENV=test`, explicit test/CI seed mode, and `DATABASE_URL` passes the FEAT-012 isolated test-target classifier. | Unit/static/runtime guard tests. |
| AC-004 | Seed execution rejects staging, production, production-like, missing, unknown, ambiguous, non-PostgreSQL, unparsable, missing-DB-name, and conflicting environment/seed-mode/CI signals before any PostgreSQL or Redis mutation. | Negative guard/runtime tests with mutation sentinel. |
| AC-005 | Seed execution has no fallback to development when environment signals are missing or invalid. | Negative tests/source review. |
| AC-006 | Command design provides explicit dev/test seed modes and does not introduce `seed:prod`, `seed:staging`, or unsafe generic seed execution. | Package/script review and guard tests. |
| AC-007 | Local-development DB classifier accepts only PostgreSQL URLs on `localhost`, `127.0.0.1`, `::1`, or approved local Docker Compose PostgreSQL service name with database `aura_capital_dev` or `aura_capital_dev_*`, and rejects targets containing test/staging/production/live/shared markers. | Unit tests. |
| AC-008 | Test/CI DB classifier reuses FEAT-012 target-safety logic and rejects development, staging, production, missing, ambiguous, or non-isolated targets. | Unit tests/source review. |
| AC-009 | Seed guard output does not expose DB URLs, Redis URLs, credentials, tokens, cookies, passwords, secrets, or sensitive absolute paths. | Output review/tests. |
| AC-010 | Development fixture users are local-only, non-real, and intentionally provisioned/documented. | Docs/source/test review. |
| AC-011 | Automated test fixture users are test-only and isolated from local/staging/production data. | Test setup and DB-backed evidence. |
| AC-012 | Development seed credentials are local environment-provided only; generated plaintext development credentials are prohibited in FEAT-017. | Source/docs/search review. |
| AC-013 | No default `ADMIN` password, default admin account, hidden admin credential, or signup-as-admin behavior exists. | Source/API/DB-backed tests. |
| AC-014 | Test credentials, if deterministic, are explicit test-only fixtures, are never printed, and cannot be used as real environment credentials. | Source/test/log review. |
| AC-015 | Seeded credentials use the approved FEAT-003 Argon2id hashing pipeline or a Human-approved safer fixture-only mechanism. | Unit/DB-backed tests. |
| AC-016 | Plaintext passwords are not printed, logged, returned, persisted to PostgreSQL, Redis, files, reports, Docker layers, migrations, shell/debug traces, or CI output; credential hashes are not printed, logged, or returned. | DB/log/source/report review. |
| AC-017 | Fixture identifiers and emails use reserved non-real values and contain no real PII. | Source/DB-backed tests. |
| AC-018 | Seed data categories are limited to development fixture users, automated test fixture users, and role/authorization fixture data required by tests. | Source/docs review. |
| AC-019 | `ADMIN` provisioning remains server-controlled operational behavior and no public role/admin assignment API is introduced. | Route/source/security tests. |
| AC-020 | Test `ADMIN` fixtures, if present, exist only inside isolated test setup. | Test/source/DB-backed review. |
| AC-021 | Seed workflows do not automatically assign `ADMIN` to all users or create privileged users by default. | DB-backed tests/source review. |
| AC-022 | Seeded roles use FEAT-007 canonical PostgreSQL role semantics. | Unit/DB-backed RBAC tests. |
| AC-023 | Client-provided role/admin claims remain ignored or rejected and JWT remains role-free. | FEAT-007/FEAT-008 regression tests. |
| AC-024 | Normal FEAT-003 registration semantics remain unchanged: new registrations have zero roles unless a later approved feature changes it. | Registration/RBAC regression tests. |
| AC-025 | Seed execution is deterministic, rerunnable, idempotent where appropriate, and duplicate-safe. | Unit/DB-backed tests. |
| AC-026 | Concurrent duplicate fixture creation is ultimately protected by PostgreSQL constraints and does not corrupt integrity. | PostgreSQL-backed concurrency/duplicate tests. |
| AC-027 | Persistent seed data uses PostgreSQL as durable authority. | Source/DB-backed tests. |
| AC-028 | JSON files, flat files, local mutable stores, in-memory maps, and Redis are not used as durable seed authority. | Source/guard review. |
| AC-029 | Seed data is not embedded in Prisma migrations; migration history remains environment-independent. | Migration SQL review and migration guard. |
| AC-030 | No Academy, Simulation, Community, Subscription, AI, leaderboard, course, trading, product audit, or placeholder product-domain seed data is introduced. | Source/schema/guard review. |
| AC-031 | Cleanup/reset is scoped, FK-safe, and does not delete non-seed-owned local development data. | Unit/DB-backed tests. |
| AC-032 | Test/CI seed setup is isolated across databases, runs, and parallel workers; no cross-run contamination occurs. | DB-backed and CI/test-isolation evidence. |
| AC-033 | Seed implementation respects FEAT-011 persistence, FEAT-012 migration governance, FEAT-013 repository/UoW boundaries, and FEAT-014 constraints. | Source/guard/DB tests. |
| AC-034 | Multi-write seed operations commit atomically or roll back without partial user/credential/role state. | PostgreSQL-backed transaction tests. |
| AC-035 | Seed audit behavior is explicitly defined and does not create misleading production audit records. | Docs/source/DB review. |
| AC-036 | FEAT-009 auth/security audit semantics and FEAT-016 product audit governance remain unchanged. | Regression tests/source review. |
| AC-037 | Seed logs contain only safe labels, counts, fixture IDs, and environment class; no sensitive values are logged. | Log capture tests. |
| AC-038 | Static/runtime guard detects prohibited seed behavior: staging/prod/unknown execution, default admin credentials, public admin APIs, product-domain seeds, seed data in migrations, plaintext credential persistence/logging, Redis durable seed authority, and RBAC semantic changes. | Guard tests. |
| AC-039 | FEAT-001 through FEAT-016 regression validation remains green. | Full validation evidence. |
| AC-040 | FEAT-017 introduces no product-domain schema/API/UI, Redis health behavior, product audit table, FEAT-018 behavior, or Phase 4 behavior. | Source/schema review. |
| AC-041 | `reports/implementation/phase-3/FEAT-017.md` exists and truthfully records commands, seed categories, environment rules, credential strategy, admin boundary, isolation/reset, audit implications, validation, limitations, and AC mapping. | Report review. |
| AC-042 | Governance state remains consistent: FEAT-017 in QA/review after implementation, FEAT-018 blocked, Phase 3 in progress, Phase 4 blocked. | Tracker/report review. |

## 2. PASS Requirements

FEAT-017 may receive QA PASS only when:

- AC-001 through AC-042 pass.
- `seed:dev`, `seed:test`, and CI seed predicates are deterministic and independently tested.
- Seed execution is impossible in staging, production, production-like, unknown, ambiguous, missing, conflicting, non-PostgreSQL, or unparsable environments.
- No mutation can occur before seed environment and DB target guards pass.
- No generated plaintext development credential path exists.
- No default admin credentials, public admin API, signup-as-admin, or privilege backdoor exists.
- Normal registration remains zero-role and RBAC remains PostgreSQL/server-derived.
- Persistent seed state is PostgreSQL-backed only.
- Seed data is not embedded in migrations.
- No product-domain fixture data or Phase 4 behavior is introduced.
- Credential and diagnostic leakage checks pass.
- FEAT-001 through FEAT-016 regressions remain green.
- No unresolved P0/P1 security, data-integrity, privacy, or governance defect remains.

## 3. FAIL Conditions

FEAT-017 must fail QA if any of the following are true:

- Seed execution can run against staging, production, production-like, unknown, ambiguous, missing, conflicting, non-PostgreSQL, or unparsable targets.
- A missing/conflicting environment falls back to development.
- `seed:dev`, `seed:test`, or CI seed can mutate PostgreSQL/Redis before all required predicates pass.
- Development seed credentials can be generated, printed, logged, committed, written to files, or embedded in reports.
- Default admin credentials, hidden admin credentials, automatic admin assignment, or signup-as-admin behavior exists.
- A public role/admin assignment API is introduced.
- Registration starts assigning roles without later Human-approved scope.
- Plaintext password is stored or logged.
- Credential hashes, tokens, cookies, DB URLs, Redis URLs, secrets, or unsafe paths leak to logs/reports.
- Redis, JSON/file persistence, or in-memory maps become durable seed authority.
- Seed data is inserted through migrations.
- Product-domain seed data, schema, API, UI, product audit table, FEAT-018 behavior, or Phase 4 behavior is introduced.
- Test seeds contaminate local/staging/production or parallel test workers collide.
- Seed cleanup can delete non-seed-owned local data.
- Required validation is skipped or reported without evidence.

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
npm run guard:boundary
npm run guard:audit-governance
```

If FEAT-017 adds a seed-specific guard, QA must run it independently.

## 5. Human Review Checklist

- [ ] FEAT-017 scope is limited to development/test/CI seed strategy.
- [ ] Production and staging seed execution are prohibited.
- [ ] DB target classifiers are deterministic and strict enough.
- [ ] Development credentials are environment-provided only.
- [ ] No generated plaintext development credential flow is allowed.
- [ ] No default admin credentials are allowed.
- [ ] `ADMIN` provisioning remains server-controlled.
- [ ] No public role/admin assignment API is specified.
- [ ] Normal registration remains zero-role.
- [ ] No product-domain seed data is specified.
- [ ] Seed data is clearly separated from migrations.
- [ ] Acceptance criteria are independently testable.
- [ ] FEAT-018 remains blocked until FEAT-017 receives QA PASS and Human Final Gate approval.

## 6. Final Gate

Implementation may begin only after Human approval of this spec package. FEAT-018 must not begin until FEAT-017 receives QA PASS and Human Final Gate approval.
