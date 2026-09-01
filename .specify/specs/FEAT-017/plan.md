# Implementation Plan: FEAT-017 Development & Test Seed Strategy

**Status**: APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Implementation Scope**: Non-production seed policy, commands/helpers, guards/tests, documentation, and validation evidence

## 1. Objective

Create a safe development/test seed strategy that supports local development and automated validation while preserving all approved security, persistence, migration, repository, Redis, and audit boundaries.

## 2. Architecture Decisions

### Decision 1 - Explicit Non-Production Seed Modes

Selected:

- Provide explicit development and test seed modes only.
- Reject staging, production, production-like, unknown, missing, or conflicting environments before mutation.
- Define deterministic predicates for `seed:dev`, `seed:test`, and CI seed.
- Reuse FEAT-012 isolated test-target safety logic for test and CI database classification.

Rationale:

- Seed workflows mutate durable state and can introduce privileged identities.
- Fail-closed behavior prevents accidental production/staging execution.

Rejected:

- Generic seed command that silently assumes development.
- `seed:prod` or `seed:staging`.
- Environment detection based on one ambiguous variable.

Implication:

- Implementation must validate environment and target DB before any seed mutation.
- Missing or conflicting `NODE_ENV`, seed mode, `CI`, or `DATABASE_URL` signals must fail closed before any PostgreSQL or Redis mutation.

### Decision 2 - No Default Admin Credentials

Selected:

- Dev/test users may exist, but no default `ADMIN` credentials are created.
- Test `ADMIN` fixtures are isolated test setup only.
- Real `ADMIN` provisioning remains server-controlled operational behavior.

Rationale:

- FEAT-007 requires privileged role assignment to be explicit and server-controlled.
- Default admin credentials are high-risk and easy to leak.

Rejected:

- `admin@example.com` / default password style seed.
- Signup-as-admin.
- Automatic admin assignment.
- Public role-management endpoint.

Implication:

- QA must verify zero public admin surface and no committed privileged credential.

### Decision 2A - Environment-Provided Development Credentials Only

Selected:

- FEAT-017 chooses credential contract A: development credentials are supplied through local environment variables only.
- Generated plaintext development credentials are prohibited.
- Deterministic test passwords are allowed only inside isolated test setup and must never be printed.

Rationale:

- Avoids persistent leakage through shell output, debug traces, Docker layers, reports, or captured logs.
- Makes QA expectations deterministic.

Rejected:

- One-time interactive generated development credentials.
- Printing generated passwords to console.
- Any generated credential path in CI, test, non-interactive execution, application logs, files, Redis, or reports.

Implication:

- `seed:dev` must fail closed when required local credential environment variables are missing.

### Decision 3 - PostgreSQL Durable Seed Authority

Selected:

- Persistent seed data uses PostgreSQL only.
- Redis may only support transient test setup/cleanup with namespaced TTL-bound keys.

Rationale:

- ADR-003 and FEAT-011 reject JSON/file durable persistence.
- ADR-005 and FEAT-015 restrict Redis to transient state.

Rejected:

- JSON seed databases.
- Redis durable fixture authority.
- In-memory durable fixture maps.

Implication:

- Seed tests must validate PostgreSQL rows and constraints; guards must reject file/Redis durable persistence.

### Decision 4 - Seeds Are Not Migrations

Selected:

- Seed data is outside Prisma migration SQL.
- Migrations remain schema-only and environment-independent.

Rationale:

- FEAT-012 migration reproducibility depends on environment-neutral migrations.

Rejected:

- Inserting users, roles, credentials, hashes, or fixture data in migration SQL.
- Using `db push` as seed/schema shortcut.

Implication:

- Migration guard/source review must prove no seed data is embedded in migrations.

### Decision 5 - Repository/UoW First, Narrow Seed Infrastructure Exception If Needed

Selected:

- Prefer repository factories and FEAT-013 Unit of Work for seed orchestration.
- Allow direct Prisma only inside explicit seed infrastructure files when narrowly justified and guarded.

Rationale:

- Seeds are operational/test infrastructure, but should not create a loophole for ordinary services.

Rejected:

- Controllers/services constructing Prisma repositories or calling Prisma delegates.
- Broad direct-Prisma exceptions.

Implication:

- Boundary guard must continue to pass and any exception must be documented in implementation evidence.

### Decision 6 - Audit-Aware Fixture Setup

Selected:

- Seed setup may bypass audit as restricted infrastructure, or create clearly isolated fixture audit rows only when tests require them.
- Runtime FEAT-009 audit behavior remains unchanged.

Rationale:

- Seed operations are not production user actions and should not create misleading audit records.

Rejected:

- Product audit event emission.
- Reusing FEAT-009 audit for product-domain seed events.
- Hiding runtime audit regressions behind seed bypass.

Implication:

- QA must verify FEAT-009 invariance and no product-audit behavior.

## 3. Environment Matrix

| Environment | Seed Command | Required Predicates | Expected Result |
|---|---|---|---|
| Local development | `seed:dev` or explicit equivalent | `NODE_ENV=development`; explicit development seed mode; `CI` absent or not `true`; `DATABASE_URL` passes local-development classifier; required local credential env vars present | Allowed after all predicates pass. |
| Automated test | `seed:test` or test setup helper | `NODE_ENV=test`; explicit test seed mode; `CI` absent or not `true`; `DATABASE_URL` passes FEAT-012 isolated test-target classifier | Allowed after all predicates pass. |
| CI | `seed:test` in explicit CI mode | `CI=true`; `NODE_ENV=test`; explicit test/CI seed mode; `DATABASE_URL` passes FEAT-012 isolated test-target classifier | Allowed after all predicates pass. |
| Staging | Any seed command | Any staging signal or DB marker | Reject before PostgreSQL/Redis mutation. |
| Production / production-like | Any seed command | Any production/live/shared marker or unapproved non-local non-test host | Reject before PostgreSQL/Redis mutation. |
| Unknown/conflicting | Any seed command | Missing/unparsable/non-PostgreSQL DB URL, missing DB name, missing seed mode, unknown `NODE_ENV`, conflicting `NODE_ENV`/seed mode/`CI`, or target matching multiple classes | Reject before PostgreSQL/Redis mutation; no fallback to development. |

Local-development safe DB target:

- PostgreSQL URL.
- Host is `localhost`, `127.0.0.1`, `::1`, or approved local Docker Compose PostgreSQL service name.
- Database name is exactly `aura_capital_dev` or starts with `aura_capital_dev_`.
- Full target contains no test/staging/production/live/shared markers.

Test/CI safe DB target:

- Reuse FEAT-012 safe isolated test-target classifier.
- Database name or schema must contain an explicit test marker.
- Development, staging, production, missing, and ambiguous targets must be rejected.

## 4. Deliverables

- FEAT-017 seed strategy implementation under approved infrastructure paths.
- Explicit seed command(s) such as `seed:dev` and `seed:test`, or documented equivalents.
- Environment/DB safety guard for seed execution.
- Development seed documentation.
- Test seed helper documentation.
- Deterministic unit/integration tests.
- Static guard or guard extension for seed-safety rules.
- Implementation report at `reports/implementation/phase-3/FEAT-017.md`.
- Tracker update after implementation evidence is complete.

## 5. Work Plan

1. Review approved FEAT-002 through FEAT-016 artifacts and current repository seed-related code.
2. Inventory any existing seed commands, seed scripts, role seed helpers, test fixtures, and migration SQL.
3. Define environment/DB safety guard for seed execution.
4. Define seed categories and fixture identity conventions.
5. Define credential handling with FEAT-003 Argon2id hashing and environment-provided development credentials only.
6. Define admin fixture boundary preserving FEAT-007.
7. Implement seed command contracts and non-production-only behavior after Human approval.
8. Add tests/guards for unsafe environment rejection and no default admin credentials.
9. Add PostgreSQL-backed tests for deterministic/idempotent seed behavior.
10. Add regression checks for registration zero-role, RBAC, auth audit, persistence, migration, Redis, and product-audit governance.
11. Run full validation.
12. Create implementation report and update tracker.

## 6. Migration Plan

Expected migration impact:

- None.

Rules:

- Do not add seed data to migrations.
- Do not add product-domain schema.
- Do not use `db push` to bypass migration workflow.
- If a schema change unexpectedly appears necessary, stop and request Human approval before implementation.

## 7. Test Strategy

Unit/static tests:

- Environment allowlist and fail-closed cases.
- Deterministic `seed:dev`, `seed:test`, and CI seed predicate tests.
- Local-development DB target classifier tests.
- FEAT-012 test-target classifier reuse tests for test/CI.
- Conflicting environment signal rejection.
- Command naming/safety rules.
- No default admin credentials.
- No public role/admin provisioning route.
- No product-domain fixture strings/seed files.
- Log/report sanitization.
- Password/hash non-leakage.
- Generated plaintext development credential rejection.
- Deterministic test password non-printing.
- Migration SQL contains no seed inserts.

PostgreSQL-backed tests:

- Seed dev/test equivalent creates expected non-sensitive fixture rows in isolated DB.
- Rerun is idempotent and duplicate-safe.
- Concurrent duplicate fixture creation is protected by PostgreSQL constraints.
- Seeded credential uses approved hash format and no plaintext is stored.
- Role fixtures use canonical FEAT-007 roles.
- Test `ADMIN` fixture remains isolated and does not alter normal registration semantics.
- Reset/cleanup is scoped and FK-safe.

Redis-backed tests, only if Redis setup is touched:

- Transient keys use FEAT-015 namespace/TTL/isolation rules.
- Redis is not durable seed authority.

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
npm run guard:audit-governance
```

If implementation adds a seed guard command, QA must run it independently from repository root.

## 8. Security And Data Integrity Risks

- Default admin credentials could become a production backdoor.
- Seed execution against staging/production could corrupt real data.
- Test credentials or hashes could leak through logs/reports.
- Seed fixtures could change registration/RBAC semantics.
- Fixture data in migrations would make schema history environment-dependent.
- Broad cleanup could delete developer data not owned by seed setup.
- Redis/file-backed fixture authority would violate ADR-003/ADR-005.

Mitigation:

- Fail-closed environment and DB guards.
- No default admin credentials.
- Isolated test DBs and worker-safe namespaces.
- Same password hashing pipeline as real credentials.
- PostgreSQL constraints as final duplicate/integrity authority.
- Static/runtime guards and full regression validation.

## 9. Rollback Plan

FEAT-017 should not introduce migrations. Rollback should remove seed scripts/helpers/tests/docs and tracker/report changes. Any accidental schema or migration change must be treated as a QA blocker unless explicitly Human-approved.

## 10. Out-of-Scope Confirmation

FEAT-017 must not:

- Start FEAT-018.
- Create product-domain seed data.
- Create product-domain schema/API/UI.
- Create public role/admin management APIs.
- Create default admin credentials.
- Change registration zero-role semantics.
- Use Redis, files, JSON, or in-memory state as durable seed authority.
- Modify FEAT-009 or FEAT-016 audit semantics.
- Start Phase 4.

## 11. Completion Criteria

FEAT-017 is ready for Codex QA when all acceptance criteria are mapped, mandatory validation passes with real evidence, implementation report is truthful, FEAT-018 remains blocked, and Phase 4 remains blocked.
