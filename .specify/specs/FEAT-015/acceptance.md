# Acceptance Criteria: FEAT-015 Redis Health & Transient State Boundary

**Status**: PROPOSED FOR HUMAN REVIEW

## 1. Acceptance Matrix

| ID | Criterion | Verification |
|---|---|---|
| AC-001 | Redis liveness versus readiness semantics are documented and implemented consistently. | Docs/source/test review. |
| AC-002 | Redis readiness can be verified internally with healthy Redis and reports not-ready when Redis is unavailable. | Redis-backed tests. |
| AC-003 | FEAT-010A-protected auth endpoints fail closed when Redis cannot make a safe limiter decision. | Integration/Redis tests. |
| AC-004 | Redis outage does not cause false successful registration, login, refresh, rotation, revocation, or PostgreSQL auth/security mutation. | Integration/DB/Redis tests. |
| AC-005 | Redis connection lifecycle covers startup validation, bounded runtime check, and clean shutdown/test teardown. | Source/test review. |
| AC-006 | Missing or invalid Redis configuration fails validation where Redis-backed protected behavior is required. | Unit/integration tests. |
| AC-007 | Liveness and non-Redis-dependent surfaces remain available when Redis is degraded, only where they do not require Redis-backed protection. | Integration tests/docs review. |
| AC-008 | Redis readiness recovers after Redis connectivity returns without replaying stale operations into PostgreSQL. | Redis-backed recovery test. |
| AC-009 | Redis remains transient-only; PostgreSQL remains durable authority for auth, sessions, roles, audit, and future durable business data. | Source/docs review. |
| AC-010 | No durable Redis business state, public Redis admin/debug API, or product-domain cache behavior is introduced. | Source/API/docs review. |
| AC-011 | Redis keys use approved namespace/version structure. | Unit/Redis key tests. |
| AC-012 | Test/CI Redis keys are isolated by namespace and/or isolated Redis DB and do not collide across runs/workers. | Redis-backed tests. |
| AC-013 | Redis keys do not contain raw email, password, access token, refresh token, cookie, secrets, Redis URL, or database URL. | Unit/Redis key scan tests. |
| AC-014 | Namespace strategy prevents cross-feature and cross-environment key collisions. | Unit/Redis tests. |
| AC-015 | Transient Redis keys have TTLs; any non-expiring key requires explicit Human-approved exception. | Redis TTL tests/docs review. |
| AC-016 | Multi-instance behavior uses shared Redis state rather than in-memory authority. | Redis-backed multi-client tests. |
| AC-017 | FEAT-010A rate-limit counters/cooldowns, endpoint thresholds, alias quota sharing, and no-enumeration behavior remain unchanged. | Regression tests. |
| AC-018 | Redis diagnostics are sanitized and do not expose Redis URL, host, port, password, credentials, raw key values, tokens, cookies, passwords, secrets, database URLs, or sensitive absolute paths. | Test/log/output review. |
| AC-019 | Public health responses do not expose sensitive Redis infrastructure details. | Integration/API tests. |
| AC-020 | Local Redis rules are documented and safe for development. | Docs review. |
| AC-021 | Test and CI Redis rules require isolated namespaces/DBs and fail fast when Redis-backed validation is mandatory. | Docs/tests/CI review. |
| AC-022 | Staging and production Redis rules require environment-provided configuration and prohibit developer-local `.env` dependency as deployment evidence. | Docs/config review. |
| AC-023 | Environment validation prevents ambiguous Redis mode where protected behavior is enabled without required Redis configuration. | Unit/integration tests. |
| AC-024 | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, and `/api/auth/*` aliases preserve FEAT-010A fail-closed protection. | Integration tests. |
| AC-025 | Redis health changes do not create durable audit amplification for throttled or readiness-failed requests. | Audit regression tests. |
| AC-026 | FEAT-005 refresh rotation/replay/family revocation remains intact under Redis health boundary changes. | Regression tests. |
| AC-027 | FEAT-009 auth audit semantics remain intact and PostgreSQL remains audit system of record. | Regression tests. |
| AC-028 | No FEAT-016 product audit abstraction/table, FEAT-017 seed behavior, FEAT-018 gate behavior, or Phase 4 product behavior is introduced. | Source/docs review. |
| AC-029 | Full validation passes: clean, lint, Prisma validate, typecheck, build, standard tests, DB tests, Redis tests, persistence guard, migration guard, boundary guard. | Command evidence. |
| AC-030 | Implementation report and tracker truthfully record FEAT-015 evidence, exact counts, limitations, QA readiness, FEAT-016 blocked, Phase 3 in progress, and Phase 4 blocked. | Report/tracker review. |

## 2. PASS Requirements

FEAT-015 may receive QA PASS only when:

- AC-001 through AC-030 pass.
- Redis health/readiness is internal and non-leaky.
- Redis remains transient-only.
- PostgreSQL remains durable authority.
- FEAT-010A auth rate limiting remains green.
- Redis-backed tests use live Redis and do not silently skip mandatory validation.
- No unresolved P0/P1 security, data-integrity, or governance defect remains.

## 3. FAIL Conditions

FEAT-015 must fail QA if any of the following are true:

- Redis becomes durable authority for business/auth/session/audit data.
- Public health/admin/debug responses expose Redis infrastructure details.
- Redis outage permits auth/rate-limit bypass or false successful auth behavior.
- Redis keys contain raw sensitive data.
- Mandatory Redis-backed tests are skipped while reported as passed.
- Product-domain cache behavior or FEAT-016 behavior is introduced.
- FEAT-010A rate-limit behavior regresses.
- Implementation evidence claims validation that was not actually run.

## 4. Required Validation Suite

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

If implementation adds a Redis health-specific command, QA must run it independently.

## 5. Human Review Checklist

- [ ] Redis readiness is internal/validation only.
- [ ] Public health does not expose Redis details.
- [ ] Redis remains transient-only.
- [ ] PostgreSQL remains durable authority.
- [ ] FEAT-010A fail-closed rate limiting remains protected.
- [ ] Namespace/TTL/isolation rules are objectively testable.
- [ ] FEAT-016 remains blocked until FEAT-015 receives Human Final Gate approval.

## 6. Final Gate

Implementation may begin only after Human approval of this spec package. FEAT-016 and later Phase 3 implementation must not begin from this package.
