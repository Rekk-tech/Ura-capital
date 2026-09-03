# Specification: FEAT-018 Phase 3 Data Foundation Integration Gate

**Status**: APPROVED FOR IMPLEMENTATION  
**Feature ID**: FEAT-018  
**Feature Type**: Gate / validation feature  
**Phase**: Phase 3 - Data Foundation & Core Domain  

## 1. User Stories

### Story 1 - Phase 3 Foundation Readiness

As a platform owner, I need one final Phase 3 evidence package proving the data foundation is coherent so that Phase 4 product-domain work can begin without carrying hidden persistence, migration, transaction, Redis, seed, or audit-governance risk.

**Independent Test**: Review FEAT-011 through FEAT-017 artifacts, run the required validation suite against fresh isolated PostgreSQL and live Redis, and verify the FEAT-018 report maps every acceptance criterion to evidence.

### Story 2 - Migration And Database Integrity Gate

As a QA governance owner, I need fresh migration, existing-schema upgrade, drift detection, transaction, and constraint evidence so that the approved PostgreSQL/Prisma foundation is reproducible and protects durable data integrity.

**Independent Test**: Use independent FEAT-018 QA databases for zero-state migration and upgrade validation, then run DB-backed transaction and constraint suites with no skips.

### Story 3 - Redis And Seed Boundary Gate

As an architect, I need Redis and seed workflows validated together so that transient state, rate limiting, readiness, test isolation, and non-production seed behavior do not weaken the durable data foundation.

**Independent Test**: Run Redis-backed suites, rate-limit regression, Redis readiness/outage checks, seed safety guard, and seed isolation validations with live Redis and isolated namespaces.

### Story 4 - Regression And Phase Exit Decision

As Human/Product Owner, I need a clear PASS / CONDITIONAL PASS / FAIL recommendation before unblocking Phase 4 so that progression is based on verified evidence rather than stale or partial reports.

**Independent Test**: The final QA report must record actual command results, no mandatory skips, defect ownership, security assessment, governance consistency, and the Phase 3 exit recommendation.

## 2. Functional Requirements

- **FR-001**: FEAT-018 MUST remain validation-only and MUST NOT introduce product functionality.
- **FR-002**: FEAT-018 MUST verify FEAT-011 through FEAT-017 are DONE / QA PASS / Human Final Gate APPROVED before final validation starts.
- **FR-003**: FEAT-018 MUST verify no product-domain schema/API/UI/seed/cache/audit table, new auth behavior, or Phase 4 behavior is introduced.
- **FR-004**: FEAT-018 MUST validate the FEAT-011 persistence boundary: no runtime `db.json`, mutable filesystem persistence, flat-file database, or JSON fallback.
- **FR-005**: FEAT-018 MUST validate PostgreSQL as durable authority and Redis as transient-only.
- **FR-006**: FEAT-018 MUST validate FEAT-013 repository, service, controller, raw SQL, and Unit of Work boundaries.
- **FR-007**: FEAT-018 MUST validate zero-state migration using fresh isolated PostgreSQL database `aura_capital_test_feat018_fresh` or stricter equivalent.
- **FR-008**: FEAT-018 MUST run `prisma migrate deploy`, `prisma migrate status`, and `prisma validate` with explicit database configuration.
- **FR-009**: FEAT-018 MUST validate migration ordering, applied checksum/drift detection, and immutable applied migration policy.
- **FR-010**: FEAT-018 MUST validate representative existing-schema upgrade using `aura_capital_test_feat018_upgrade` or stricter equivalent.
- **FR-011**: FEAT-018 MUST prove existing representative rows are preserved across upgrade and approved constraints remain enforced.
- **FR-012**: FEAT-018 MUST validate seed data is not embedded in migrations and `prisma db push` is not used as migration governance.
- **FR-013**: FEAT-018 MUST validate root UoW commit, rollback, constraint rollback, composed rollback, explicit active-context reuse, accidental nested UoW fail-fast, no nested Prisma transaction, ALS cleanup, and transaction client propagation.
- **FR-014**: FEAT-018 MUST validate transaction-sensitive regressions for registration plus audit, role assignment plus audit, refresh/session security state, and FEAT-017 seed multi-write behavior.
- **FR-015**: FEAT-018 MUST validate live PostgreSQL constraints for UUID/PK, NOT NULL, unique, composite unique, FK, one-to-one, cascade, restrict/no-action, set-null, closed-set status, and concurrent duplicate protection where applicable.
- **FR-016**: FEAT-018 MUST use approved existing schema and neutral test-only fixtures where necessary; production product-domain tables remain prohibited.
- **FR-017**: FEAT-018 MUST validate Redis readiness, public liveness independence, recovery, positive TTL, multi-instance shared state, namespace rules, run/worker isolation, no broad cleanup, and sanitized diagnostics.
- **FR-018**: FEAT-018 MUST validate FEAT-010A fail-closed rate-limiting behavior for protected auth endpoints and aliases.
- **FR-019**: FEAT-018 MUST validate FEAT-017 seed environment safety, credential safety, no default ADMIN, test ADMIN opt-in only, cleanup ownership, run/worker isolation, no production/staging seed, and no product-domain seed data.
- **FR-020**: FEAT-018 MUST validate Phase 2 auth/security regression: registration, login, JWT, refresh rotation/replay, logout, RBAC, admin guard, auth audit, and rate limiting.
- **FR-021**: FEAT-018 MUST validate JWT remains role-free and PostgreSQL remains role/admin authority.
- **FR-022**: FEAT-018 MUST validate FEAT-009 auth/security audit semantics remain unchanged.
- **FR-023**: FEAT-018 MUST validate FEAT-016 product audit governance and no product audit table/API/UI or AuthSecurityAuditRecord repurposing exists.
- **FR-024**: FEAT-018 MUST run all mandatory guards: persistence, migration, boundary, audit-governance, and seed-safety.
- **FR-025**: FEAT-018 MUST default `guard:phase3-integration` to NOT REQUIRED. A new guard may be introduced only if a concrete validation gap cannot be covered by the mandatory guards or integration tests; if introduced, it MUST orchestrate or verify existing guards only and MUST NOT replace or weaken them.
- **FR-026**: FEAT-018 MUST run the full validation pipeline and record actual counts dynamically.
- **FR-027**: FEAT-018 MUST fail or report ENVIRONMENT BLOCKED / NOT VERIFIED when mandatory PostgreSQL, Redis, Docker, Prisma engine, or test infrastructure is unavailable.
- **FR-028**: FEAT-018 MUST verify diagnostic and report output does not leak secrets, credentials, tokens, cookies, passwords, hashes, raw DB/Redis URLs, SQL sensitive values, or sensitive absolute paths.
- **FR-029**: FEAT-018 MUST classify defects using P0/P1/P2/P3 severity rules.
- **FR-030**: FEAT-018 MUST map defects to owning features and must not alter approved earlier specs to hide defects.
- **FR-031**: FEAT-018 MUST produce `reports/implementation/phase-3/FEAT-018.md` during implementation and `reports/qa/phase-3/FEAT-018-QA.md` during Codex QA.
- **FR-032**: FEAT-018 MUST keep Phase 3 IN_PROGRESS and Phase 4 BLOCKED until FEAT-018 QA PASS and Human Final Gate approval.

## 3. Integration Validation Architecture

FEAT-018 sits above completed Phase 3 implementation features and owns only validation evidence.

```text
FEAT-011 persistence boundary
FEAT-012 migration governance
FEAT-013 repository/UoW
FEAT-014 constraints
FEAT-015 Redis boundary
FEAT-016 product audit governance
FEAT-017 seed strategy
        |
        v
FEAT-018 Phase 3 Integration Gate
        |
        v
Codex QA report and Human Phase 3 decision
```

The implementation agent may add validation-only orchestration, tests, smoke scripts, or reports if approved. It must not add new business functionality.

## 4. Security Validation Matrix

| Boundary | Required Proof | Blocking Severity |
| --- | --- | --- |
| Persistence authority | PostgreSQL durable, no JSON/file fallback | P0/P1 |
| Redis authority | Transient only; no durable business/audit/seed authority | P0/P1 |
| Migration reproducibility | Fresh deploy/status, drift detection, upgrade compatibility | P1 |
| Transaction integrity | Commit/rollback/nested/ALS/repository transaction behavior | P1 |
| Constraint integrity | DB-level uniqueness/FK/not-null/cardinality/delete/status enforcement | P1 |
| Seed safety | No prod/staging seed, no default admin, no secret leakage | P0/P1 |
| Auth regression | Registration/login/JWT/refresh/logout/RBAC/admin/audit/rate-limit green | P0/P1 |
| Audit governance | FEAT-009 unchanged; no product audit table/API/UI | P1 |
| Diagnostics | No secrets, URLs, SQL values, paths, tokens, cookies, passwords | P1/P2 |
| Governance | FEAT-011..017 approved; FEAT-018 current; Phase 4 blocked | P1 if progression risk |

## 5. Fresh DB Strategy

Mandatory fresh migration database:

```text
aura_capital_test_feat018_fresh
```

Mandatory existing-schema upgrade database:

```text
aura_capital_test_feat018_upgrade
```

Rules:

- Database names must include explicit `test` and `feat018` markers.
- `DATABASE_URL` and `TEST_DATABASE_URL` must be set explicitly for validation.
- FEAT-018 must not reuse FEAT-017 database evidence.
- Existing-schema upgrade validation is mandatory for FEAT-018 PASS; the exact database name may vary only if the substitute is an independent FEAT-018 upgrade database that passes the same safety criteria.
- Representative row preservation and approved constraint preservation are mandatory upgrade outcomes.
- Safety guards must reject local development, staging, production, production-like, missing, or ambiguous targets before mutation.
- QA must record actual database names used without exposing credentials or full connection strings.

## 6. Redis Strategy

FEAT-018 requires live Redis evidence for Redis-dependent ACs.

Validation must prove:

- Public liveness does not expose or depend on Redis readiness.
- Internal readiness detects healthy Redis and recovers after Redis returns.
- Redis outage fails closed for protected auth rate-limited endpoints.
- Redis keys use approved production namespace semantics.
- Test/CI keys use runId/workerId isolation.
- Cleanup cannot delete keys from other runs/workers/namespaces.
- Transient keys have positive TTLs.
- Multi-instance counters/state are shared through Redis.
- Redis diagnostics are sanitized.

## 7. Regression Matrix

| Prior Feature | FEAT-018 Regression Focus |
| --- | --- |
| FEAT-001 | Build/lint/typecheck/test foundation remains green. |
| FEAT-002 | Auth configuration, Prisma models, repository boundaries remain valid. |
| FEAT-003 | Registration, password hashing, duplicate safety, no plaintext persistence. |
| FEAT-004 | Login, uniform failure, strict role-free JWT. |
| FEAT-005 | Refresh rotation, replay detection, family revocation. |
| FEAT-006 | Logout/session invalidation, stateless access token semantics. |
| FEAT-007 | PostgreSQL RBAC authority and same-token role immediacy. |
| FEAT-008 | Admin guard, no client spoofing, no public privilege API. |
| FEAT-009 | Auth/security audit taxonomy, durability, failure semantics, no sensitive leakage. |
| FEAT-010A | Redis rate limiting, shared alias quotas, fail-closed outage. |
| FEAT-011 | No file/JSON runtime persistence. |
| FEAT-012 | Migration governance and drift detection. |
| FEAT-013 | Repository/UoW boundaries and transaction integrity. |
| FEAT-014 | Constraint standards and live DB constraint enforcement. |
| FEAT-015 | Redis health, transient boundary, TTL, namespace, isolation. |
| FEAT-016 | Product audit abstraction/governance only; no product audit persistence. |
| FEAT-017 | Dev/test seed safety and no default admin/product seed behavior. |

## 8. Guard Matrix

Mandatory guards:

| Guard | Required Proof |
| --- | --- |
| `npm run guard:persistence` | No runtime JSON/file persistence or fallback. |
| `npm run guard:migration` | Safe target, migration risk, checksum/drift governance. |
| `npm run guard:boundary` | Controllers/services/repositories obey Prisma/raw SQL boundaries. |
| `npm run guard:audit-governance` | Product audit table/API/UI and FEAT-009 repurposing prohibited. |
| `npm run guard:seed-safety` | Seed environment, credential, admin, migration, product seed, and logging safety. |

Default decision:

- `guard:phase3-integration` is NOT REQUIRED by default.
- Do not create it unless a concrete validation gap cannot be covered by `guard:persistence`, `guard:migration`, `guard:boundary`, `guard:audit-governance`, `guard:seed-safety`, or integration tests.
- If introduced later, it may only orchestrate or verify existing guards. It must not replace the mandatory guard commands.

## 9. Full Validation Pipeline

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

If FEAT-018 introduces validation-only integration tests, those commands must also run. If a future approved rework introduces `guard:phase3-integration`, that command must run in addition to the existing mandatory guards.

Historical counts are not acceptance baselines. Implementation and QA must record actual discovered counts and explain legitimate count drift.

## 10. Defect Ownership Policy

FEAT-018 defects must use explicit mapping:

```text
DEF-F018-001
Owner: FEAT-015
Regression: Redis namespace violation
Severity: P1
Affected AC: AC-...
Required Fix: ...
```

Rules:

- Do not edit approved earlier specs to hide defects.
- Do not silently implement product changes inside FEAT-018.
- Antigravity may fix the owning implementation area only after Human approves rework.
- Re-run the affected feature regression and FEAT-018 gate after fixes.

## 11. PASS / CONDITIONAL PASS / FAIL

### PASS

Allowed only when:

- AC-001 through AC-039 pass.
- All mandatory validation commands pass.
- Fresh migration, existing-schema upgrade, drift checks, DB suite, Redis suite, and all guards pass.
- No mandatory skips or setup failures occur.
- No unresolved P0/P1 defect remains.
- Governance is consistent.

### CONDITIONAL PASS

Allowed only for explicitly accepted non-blocking technical debt. It is not allowed for security boundary failure, DB integrity failure, migration failure, transaction failure, Redis authority/fail-closed failure, seed safety failure, auth/RBAC regression, mandatory validation not executed, or unresolved P0/P1 defects.

### FAIL

Required if any mandatory validation is missing, any P0/P1 defect remains, Phase 4 starts early, product functionality appears in FEAT-018, or governance/report evidence is false or stale.

## 12. Success Criteria

FEAT-018 succeeds when it produces a complete, truthful, independently reproducible Phase 3 evidence package and Codex QA can recommend Phase 3 PASS or an explicitly accepted CONDITIONAL PASS for Human Final Gate.
