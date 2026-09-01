# Specification: FEAT-017 Development & Test Seed Strategy

**Status**: APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature ID**: FEAT-017  
**Scope**: Non-production development and automated-test seed strategy only

## 1. User Stories

### Story 1 - Run Safe Local Development Seeds

As a developer, I need a local-only seed workflow that creates useful non-production fixture users without risking production data, committed secrets, or default admin credentials.

Independent test:

- Seed command rejects staging, production, production-like, unknown, missing, and conflicting environment signals.
- Local development seed can run only with explicit local seed mode and safe database target.
- Logs and reports do not expose plaintext credentials, hashes, URLs, tokens, cookies, or secrets.

### Story 2 - Create Deterministic Test Fixtures

As a test author, I need automated fixture users and roles that can be created repeatably in isolated test databases without cross-run contamination.

Independent test:

- Test seed setup is rerunnable and duplicate-safe.
- Parallel or worker-isolated runs do not collide.
- Cleanup is scoped to isolated test DBs or seed-owned rows.

### Story 3 - Preserve RBAC And Admin Safety

As a security reviewer, I need seeded roles and test `ADMIN` fixtures to preserve FEAT-007 semantics and avoid any public or default privilege escalation path.

Independent test:

- Normal registration still creates zero-role users.
- No public role/admin assignment route exists.
- No default admin user/password exists.
- Any test `ADMIN` fixture is isolated test setup only and uses canonical PostgreSQL roles.

### Story 4 - Keep Seeds Out Of Migrations And Product Domains

As an architect, I need seed data to stay separate from schema migrations and future product domains so Phase 3 does not smuggle in Academy, Simulation, Community, Subscription, AI, or placeholder behavior.

Independent test:

- Prisma migrations contain no fixture inserts or environment-specific data.
- Source/schema scan finds no product-domain seed data, APIs, UI, or placeholder tables.
- Migration governance and persistence guards remain green.

## 2. Environment Matrix

| Environment | Required Predicates | DB Target Classifier | Failure Behavior |
|---|---|---|---|
| Local development `seed:dev` | `NODE_ENV=development`; explicit development seed mode; `CI` absent or not `true`; `DATABASE_URL` present and classified local-development safe | PostgreSQL URL; host is `localhost`, `127.0.0.1`, `::1`, or approved local Docker Compose PostgreSQL service name; database name is exactly `aura_capital_dev` or starts with `aura_capital_dev_`; target contains no `test`, staging, production, live, shared, main, master, or primary markers | Exit non-zero before PostgreSQL/Redis mutation |
| Automated test `seed:test` | `NODE_ENV=test`; explicit test seed mode; `CI` absent or not `true`; `DATABASE_URL` present and accepted by FEAT-012 isolated test-target classifier | Reuse FEAT-012 target-safety logic. Database name or schema must contain an explicit test marker and must reject development, staging, production, missing, or ambiguous targets | Exit non-zero before PostgreSQL/Redis mutation |
| CI seed | `CI=true`; `NODE_ENV=test`; explicit test or CI seed mode; `DATABASE_URL` present and accepted by FEAT-012 isolated test-target classifier | Reuse FEAT-012 target-safety logic plus CI-provisioned isolated service evidence | Exit non-zero before PostgreSQL/Redis mutation |
| Staging | Any staging signal or staging DB marker | Environment signal is staging, or host/name contains `staging`, `stage`, `stg`, or equivalent approved deployment label | Always reject before mutation |
| Production / production-like | Any production signal, production marker, live/shared marker, or non-local host not explicitly classified as isolated CI/test infrastructure | Environment signal is production, or host/name contains `prod`, `production`, `live`, `main`, `master`, `primary`, `shared`, or equivalent deployment label | Always reject before mutation |
| Unknown / ambiguous | Missing or conflicting signal | Missing `DATABASE_URL`, unparsable URL, non-PostgreSQL URL, missing database name, missing seed mode, unknown `NODE_ENV`, conflicting `NODE_ENV`/seed mode/`CI`, or target matching multiple classes | Always reject before mutation; no fallback to development |

Authoritative environment signals must include at least:

- Runtime environment (`NODE_ENV` or approved project environment variable).
- Explicit seed mode (`development`, `test`, or `ci`).
- Database target classifier: local-development classifier for `seed:dev`; FEAT-012 safe isolated test-target classifier for `seed:test` and CI seed.
- CI signal when running CI fixtures.

Conflicts between signals are blocking. Example: `NODE_ENV=production` with `seed:test` must fail closed.

## 3. Seed Categories

### A. Development Fixture Users

Allowed:

- Local-only non-real fixture users for manual development.
- Optional non-admin role assignments only when documented.
- Development credentials supplied only through local environment variables.

Prohibited:

- Default admin user.
- Default admin password.
- Production-style reusable password committed to source.
- Real user email or PII.
- Product-domain data.

### B. Automated Test Fixture Users

Allowed:

- Deterministic users in isolated test databases.
- Reserved test identity domains such as `*.test` or project-approved test-only domains.
- Deterministic IDs where useful for assertions.
- Test-only credentials that exist only in test setup and are clearly unsuitable for real environments.

Prohibited:

- Use outside `NODE_ENV=test` or CI isolated test mode.
- Reuse in local/staging/production.
- Real PII.

### C. Role / Authorization Fixture Data

Allowed:

- Canonical FEAT-007 `USER` and `ADMIN` role fixtures required by tests.
- Test-only `ADMIN` assignment inside isolated test setup.
- Server-controlled operational helper boundaries already approved for role provisioning tests.

Prohibited:

- Public HTTP role management.
- Signup-as-admin.
- Automatic `ADMIN` assignment to every user.
- Changing normal registration to assign roles.

## 4. Credential Strategy

Canonical development approach:

- FEAT-017 chooses **A - environment-provided development credentials only**.
- Development seed credentials must be supplied through local environment variables.
- Generated plaintext development credentials are not allowed in FEAT-017.
- Documentation may describe variable names and local-only setup without containing usable secrets.

Test approach:

- Test-only credentials may be deterministic for isolated automated tests.
- Test passwords must be visibly reserved for test use and must never be valid in staging/production.
- Test passwords must not be printed.
- Test credentials must not appear in application logs or reports beyond safe fixture labels.

Persistence:

- Seeded credential records must store Argon2id hashes through the same approved FEAT-003 hashing pipeline.
- Plaintext passwords and credential hashes must not be returned from seed commands, API responses, application logger output, files, PostgreSQL plaintext columns, Redis values, implementation reports, QA reports, Docker image layers, shell/debug traces, or CI output.

## 5. Admin Provisioning Boundary

FEAT-017 preserves FEAT-007:

- PostgreSQL remains the role authority.
- JWT remains role-free.
- Client-provided role/admin claims remain ignored or rejected.
- Newly registered users remain zero-role.
- `ADMIN` provisioning remains server-controlled operational behavior.

Test fixture `ADMIN` is not a real operational admin account. If needed, it exists only inside isolated test setup and must be deleted/reset with that test scope.

FEAT-017 must not introduce:

- Public grant-admin endpoint.
- Public role-management API.
- Signup-as-admin.
- Default admin account or password.
- Hidden admin backdoor.
- Automatic admin assignment.

## 6. Determinism And Idempotency

Seed behavior must be:

- Rerunnable without creating duplicate uncontrolled rows.
- Duplicate-safe through PostgreSQL constraints and deterministic conflict handling.
- Predictable for tests where stable IDs/emails are useful.
- Scoped so local development seed reruns do not delete non-seed-owned developer data.
- Able to report safe counts and fixture labels.

Durable uniqueness must rely on PostgreSQL constraints, not only pre-checks.

## 7. Persistence And Repository Boundary

Persistent seed data uses PostgreSQL only.

Allowed implementation approaches:

1. Preferred: seed orchestration uses approved repository factories and FEAT-013 Unit of Work transaction boundaries.
2. Narrow exception: seed infrastructure may use Prisma directly only inside explicit seed infrastructure files, never in ordinary controllers/services, with implementation report rationale and guard coverage.

Controllers and ordinary services must not receive any seed-specific Prisma exception.

Redis may be used only for transient test setup or cleanup required by existing Redis-backed features, with FEAT-015 namespace/TTL/isolation rules.

## 8. Migration Boundary

Seeds are not migrations.

Rules:

- Prisma migration SQL must not contain environment-specific fixture inserts, role assignments, seed users, passwords, hashes, or product-domain seed data.
- Migration history remains environment-independent.
- `db push` must not be used to bypass migration governance.
- Destructive migration behavior is out of scope.

## 9. Test / CI Isolation

Local:

- Development seed data should be visibly seed-owned or safely scoped.
- Reset must not delete non-seed-owned local data.

Test:

- Use isolated PostgreSQL DBs or deterministic cleanup within disposable DBs.
- Parallel workers must isolate by database name, schema, fixture namespace, worker ID, or equivalent safe strategy.
- Cleanup must be FK-safe and transaction-aware.

CI:

- Create or target isolated test DB/Redis.
- Run migrations.
- Run seed/test setup non-interactively.
- Run required tests.
- Destroy or abandon disposable state after the run.

## 10. Audit Implications

Seed actions must not create misleading production audit records.

Allowed approaches:

- Local/test seed setup may bypass FEAT-009 audit emission as infrastructure setup if clearly documented and restricted to approved seed environments.
- Test cases that verify audit behavior may intentionally create isolated audit fixture rows.
- If seed behavior emits auth/security audit rows in local/test, rows must be clearly fixture/test scoped and must preserve FEAT-009 taxonomy.

Product audit:

- FEAT-017 must not create product audit records, product audit tables, or product audit event emissions.
- FEAT-016 governance remains unchanged.

## 11. Command Design

Recommended commands:

```text
npm run seed:dev
npm run seed:test
```

Allowed alternatives may follow repository conventions if they preserve explicit mode separation.

Prohibited:

```text
npm run seed:prod
npm run seed:staging
```

A generic `seed` wrapper is allowed only if it fails closed without explicit approved seed mode and environment validation.

## 12. Logging And Diagnostics

Allowed log/report content:

- Fixture category.
- Fixture label.
- Non-sensitive fixture IDs.
- Counts.
- Safe environment class.

Prohibited log/report content:

- Plaintext passwords.
- Password hashes.
- Access or refresh tokens.
- Cookies.
- DB URLs or Redis URLs.
- Host/port/credential details where existing sanitization policy prohibits them.
- Secrets, API keys, stack traces, raw Prisma/database errors, or sensitive absolute paths.

## 13. Guard And Test Strategy

Implementation must include deterministic tests/guards proving:

- `seed:dev` rejects staging, production, production-like, unknown, missing, and conflicting environment signals.
- `seed:test` requires isolated test DB/CI target.
- Safe local development seed can run only against approved local target.
- Test seed is rerunnable, idempotent, duplicate-safe, and isolated across parallel workers.
- No default `ADMIN` credentials exist.
- No public admin or role provisioning API exists.
- FEAT-007 zero-role registration semantics remain unchanged.
- Seeded credentials use approved hashing and no plaintext is persisted/logged.
- No real PII is used.
- PostgreSQL is durable seed authority.
- JSON/file/in-memory/Redis durable seed authority is prohibited.
- Seeds are not embedded in migrations.
- No product-domain seed data exists.
- Audit semantics are documented and do not alter FEAT-009.
- FEAT-001 through FEAT-016 regression remains green.

## 14. FEAT-018 Handoff Evidence

FEAT-017 must hand FEAT-018:

- Seed environment allowlist and fail-closed evidence.
- Local/test/CI seed behavior evidence.
- Credential safety evidence.
- No default admin credential evidence.
- No public role/admin API evidence.
- Test isolation and cleanup evidence.
- PostgreSQL migration/constraint compatibility evidence.
- Redis transient-boundary evidence if Redis test setup is touched.
- FEAT-007/FEAT-009/FEAT-011 through FEAT-016 regression evidence.

## 15. Acceptance Mapping

- Environment, DB classifier, and command boundary: AC-001 through AC-009
- Seed categories and credential safety: AC-010 through AC-018
- RBAC/Admin boundary: AC-019 through AC-024
- Determinism, persistence, migration, and isolation: AC-025 through AC-034
- Audit, logging, guards, regression, and governance: AC-035 through AC-042

## 16. Human Review Notes

FEAT-017 is allowed to create dev/test seed mechanisms after Human approval. It must not create production/staging seed behavior, product-domain fixtures, default admin credentials, public privilege-management APIs, or Phase 4 product behavior.
