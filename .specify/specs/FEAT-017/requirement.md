# Requirement: FEAT-017 Development & Test Seed Strategy

**Status**: APPROVED FOR IMPLEMENTATION  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature Type**: Implementation feature  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

Phase 3 has established PostgreSQL persistence, Prisma migration governance, repository/Unit of Work boundaries, reusable database constraint standards, Redis transient-state boundaries, and product audit governance. Future phases need reliable development and automated-test seed data, but seed workflows are a common source of security drift: default admin accounts, committed credentials, production seed execution, fixture leakage, and migration pollution.

FEAT-017 defines a safe, deterministic development and test seed strategy for non-production environments only. It must preserve FEAT-007 RBAC semantics, FEAT-009 auth/security audit boundaries, FEAT-011 persistence rules, FEAT-012 migration governance, FEAT-013 repository/transaction boundaries, FEAT-014 constraints, FEAT-015 Redis transient boundary, and FEAT-016 product-audit governance.

## 2. Goal

Provide governed, repeatable local-development and automated-test seed workflows without creating default admin credentials, production/staging seed execution, public role-management surfaces, product-domain fixtures, or durable non-PostgreSQL seed authority.

## 3. Human Decisions Already Locked

- Dev/test seed users are allowed.
- No default `ADMIN` credentials.
- No production seed execution.
- No staging seed execution.
- `ADMIN` provisioning remains server-controlled.
- No public role/admin assignment API.
- FEAT-007 RBAC semantics must not be weakened.
- No product-domain seed data for Academy, Simulation, Community, Subscription, AI, or placeholder domains.

## 4. In Scope

- Environment allowlist and fail-closed seed runner rules.
- Authoritative environment detection and conflict handling.
- Deterministic database target classification for local development, test, CI, staging, production, production-like, and ambiguous targets.
- Local development seed workflow.
- Automated test/CI seed workflow.
- Role/authorization fixture data required by tests.
- Credential safety policy for seed users.
- Test-only `ADMIN` fixture boundary.
- Deterministic, rerunnable, duplicate-safe seed behavior.
- PostgreSQL durable seed authority.
- Redis transient setup boundary where existing tests require it.
- Repository/Unit of Work or narrowly approved seed-infrastructure boundary.
- Migration separation: seed data is not schema migration data.
- Test/CI/parallel worker isolation and cleanup/reset rules.
- Audit implications for seed setup.
- Password hashing expectations for seeded credentials.
- Stable fixture identifiers and reserved test identity domains.
- Safe logging and implementation report evidence.
- Static/runtime guards and tests for seed safety.
- FEAT-001 through FEAT-016 regression preservation.

## 5. Out of Scope

- Production or staging seed execution.
- Default `ADMIN` user/password or hidden privileged backdoor.
- Public role/admin assignment API.
- Signup-as-admin or automatic `ADMIN` assignment.
- Changing registration semantics; new registrations remain zero-role under FEAT-007 unless a later approved feature changes it.
- Product-domain seed data: Academy, Simulation, Community, Subscription, AI, leaderboard, course, trading, community, entitlement, or prompt fixtures.
- Product-domain schemas, APIs, UI, cache behavior, or Phase 4 behavior.
- Redis as durable fixture authority.
- Fixture data embedded in Prisma migration SQL.
- FEAT-018 final integration gate.

## 6. Functional Requirements

- **FR-001**: Seed execution MUST be allowed only in local development, automated test, and CI isolated test environments.
- **FR-002**: Seed execution MUST be prohibited in staging, production, production-like, and ambiguous/unknown environments.
- **FR-003**: Environment detection MUST use the existing environment governance signals together, including `NODE_ENV`, explicit seed mode, CI signal, and deterministic database target classification; it MUST fail closed on missing, conflicting, or ambiguous configuration.
- **FR-004**: Seed execution MUST NOT fall back to development mode when environment signals are missing or invalid.
- **FR-004A**: `seed:dev` MUST require all predicates: `NODE_ENV=development`, explicit development seed mode, `CI` is absent or not true, and `DATABASE_URL` passes the approved local-development target classifier.
- **FR-004B**: `seed:test` MUST require all predicates: `NODE_ENV=test`, explicit test seed mode, `CI` is absent or not true unless the command is explicitly running CI seed mode, and `DATABASE_URL` passes the existing FEAT-012 safe isolated test-target classifier.
- **FR-004C**: CI seed execution MUST require all predicates: `CI=true`, `NODE_ENV=test`, explicit test or CI seed mode, and `DATABASE_URL` passes the existing FEAT-012 safe isolated test-target classifier.
- **FR-004D**: All seed predicates MUST be evaluated before any PostgreSQL or Redis mutation.
- **FR-004E**: The local-development DB target classifier MUST accept only PostgreSQL URLs whose host is local (`localhost`, `127.0.0.1`, `::1`) or the approved local Docker Compose PostgreSQL service name, whose database name is exactly `aura_capital_dev` or starts with `aura_capital_dev_`, and whose full target contains no staging/production/test markers.
- **FR-004F**: The test/CI DB target classifier MUST reuse FEAT-012 test-target safety logic and accept only explicit isolated test targets, such as database name or schema containing a `test` marker, while rejecting development, staging, production, missing, or ambiguous targets.
- **FR-004G**: Staging targets include any seed target where the environment signal is staging or the database host/name contains staging markers such as `staging`, `stage`, `stg`, or equivalent approved deployment labels.
- **FR-004H**: Production or production-like targets include any seed target where the environment signal is production or the database host/name contains production/live/shared markers such as `prod`, `production`, `live`, `main`, `master`, `primary`, `shared`, or any non-local host that is not explicitly classified as isolated CI/test infrastructure.
- **FR-004I**: Ambiguous/unknown targets include missing `DATABASE_URL`, unparsable URLs, non-PostgreSQL URLs, missing database name, missing seed mode, unknown `NODE_ENV`, conflicting `NODE_ENV`/seed mode/`CI` signals, or a database name that matches multiple environment classes.
- **FR-005**: FEAT-017 MUST define separate seed data classes for development fixture users, automated test fixture users, and role/authorization fixture data required by tests.
- **FR-006**: FEAT-017 MUST NOT create product-domain seed data or placeholder product-domain entities.
- **FR-007**: Development seed users MUST be intentionally provisioned and documented as local-only.
- **FR-008**: Automated test fixture users MUST be explicitly test-only and isolated from local, staging, and production data.
- **FR-009**: Seed credentials MUST NOT include committed reusable production-style passwords, default `ADMIN` passwords, secrets, tokens, cookies, or credential material that could be reused in real environments.
- **FR-010**: FEAT-017 chooses the canonical development credential contract: development seed credentials MUST be provided by local environment variables only. Generated plaintext development credentials are not allowed in FEAT-017.
- **FR-011**: Test credentials MAY use deterministic test-only values only inside isolated test setup and reserved test identity domains; they MUST NOT be represented as production-suitable credentials.
- **FR-012**: Seeded credentials stored in PostgreSQL MUST use the same approved Argon2id password hashing pipeline as FEAT-003 unless a future Human-approved exception creates a safer fixture-only mechanism.
- **FR-013**: Plaintext passwords MUST NOT be printed, logged, returned, persisted to PostgreSQL, Redis, files, reports, Docker image layers, migrations, shell/debug traces, or any non-interactive output. Credential hashes MUST NOT be printed.
- **FR-014**: Credential hashes, reset tokens, access tokens, refresh tokens, cookies, DB URLs, Redis URLs, and secrets MUST NOT be logged or written to reports.
- **FR-015**: `ADMIN` provisioning MUST remain server-controlled operational behavior and MUST NOT be exposed through public HTTP routes or client-controlled input.
- **FR-016**: FEAT-017 MUST distinguish test fixture `ADMIN` data from real operational `ADMIN` provisioning.
- **FR-017**: Test fixture `ADMIN` data, if required, MUST exist only inside isolated test setup and MUST NOT create default admin credentials for local, staging, or production use.
- **FR-018**: Seed workflows MUST NOT automatically assign `ADMIN` to all users, assign roles during normal registration, or weaken zero-role registration semantics.
- **FR-019**: Seeded roles MAY exist only when explicitly required by development or test scenarios and MUST use FEAT-007 canonical role semantics.
- **FR-020**: Seed operations MUST be deterministic, rerunnable, duplicate-safe, and avoid uncontrolled data accumulation.
- **FR-021**: Stable fixture identifiers SHOULD be used where useful for tests, with reserved non-real identity values and no real PII.
- **FR-022**: Persistent seed data MUST use PostgreSQL as durable authority.
- **FR-023**: Seed workflows MUST NOT use JSON files, flat files, local mutable stores, in-memory maps, or Redis as durable seed authority.
- **FR-024**: Redis MAY be touched only for transient test setup/cleanup required by existing Redis-backed features and MUST use FEAT-015 key isolation and TTL rules.
- **FR-025**: Seed implementation MUST respect FEAT-011 persistence guard, FEAT-012 migration governance, FEAT-013 transaction boundaries, and FEAT-014 database constraints.
- **FR-026**: Seed scripts MAY use a narrowly scoped low-level infrastructure exception for Prisma only if the implementation records the rationale, keeps it out of ordinary services/controllers, and proves boundary guards still pass.
- **FR-027**: Seed operations that perform multiple related writes MUST use FEAT-013 Unit of Work/transaction semantics or an equivalently approved infrastructure transaction boundary.
- **FR-028**: Seed data MUST NOT be embedded in Prisma migrations; migrations remain schema-only and environment-independent unless explicit Human approval says otherwise.
- **FR-029**: Local development reset MUST protect non-seed-owned developer data from accidental deletion.
- **FR-030**: Test/CI reset MAY use isolated disposable databases and deterministic cleanup; it MUST NOT target staging, production, or production-like databases.
- **FR-031**: Cleanup MUST be FK-safe, transaction-aware where needed, and scoped by isolated DB or seed ownership markers.
- **FR-032**: Seed setup MUST define whether auth/security audit records are emitted, bypassed as test infrastructure, or isolated as fixture data; it MUST NOT create misleading production audit records.
- **FR-033**: Any audit bypass MUST be limited to local/test/CI seed infrastructure and MUST NOT weaken runtime FEAT-009 audit behavior.
- **FR-034**: Seed logs MUST include only safe operational information such as fixture names, counts, and non-sensitive IDs.
- **FR-035**: Static/runtime guards MUST prove staging/prod/unknown environments reject seed execution, no default `ADMIN` credentials exist, no public admin provisioning API exists, product-domain seeds are absent, seeds are not embedded in migrations, plaintext credentials are not persisted/logged, Redis is not durable seed authority, and FEAT-007 semantics remain unchanged.
- **FR-036**: FEAT-017 implementation evidence MUST record commands, environment matrix, seed categories, credential strategy, admin boundary, isolation/reset strategy, audit implications, validation results, limitations, and AC mapping truthfully.
- **FR-037**: FEAT-017 MUST preserve FEAT-001 through FEAT-016 behavior and keep FEAT-018 blocked until QA PASS and Human Final Gate approval.

## 7. Non-Functional Requirements

- Seed commands must be explicit, deterministic, and safe to run repeatedly.
- Seed failure must be fail-closed and must not partially create privileged state.
- Validation must be independently reproducible by Codex QA using isolated PostgreSQL and Redis where required.
- Errors and logs must be sanitized under existing diagnostic policies.
- The strategy must support multi-worker CI without fixture collision.

## 8. Dependencies

- FEAT-002 through FEAT-010A DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-011 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-012 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-013 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-014 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-015 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-016 DONE / QA PASS / Human Final Gate APPROVED.
- ADR-003 PostgreSQL/Prisma repository boundary.
- ADR-005 Redis responsibility boundary.
- Approved Phase 3 feature decomposition.

## 9. Success Definition

FEAT-017 succeeds when local/test/CI seed workflows are safe, deterministic, non-production-only, PostgreSQL-backed, credential-safe, RBAC-safe, migration-separated, audit-aware, and independently validated without introducing product-domain fixtures or public privilege escalation paths.

## 10. Open Questions

None blocking for Human review.

Recommended default for implementation: use explicit `seed:dev` and `seed:test` commands only. Avoid a generic `seed` command unless it is a fail-closed wrapper that requires an explicit allowed seed mode.

Canonical credential decision: **A - environment-provided development credentials only**. One-time generated plaintext credentials are intentionally out of scope for FEAT-017.
