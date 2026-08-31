# Specification: FEAT-015 Redis Health & Transient State Boundary

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Scope**: Redis readiness and transient-state boundary only

## 1. User Stories

### Story 1 - Internal Redis Readiness

As an operator, I need internal readiness validation to know whether Redis-backed features are safe to serve.

Independent test:

- A Redis readiness check succeeds against healthy Redis.
- The same check reports not-ready when Redis is unavailable.
- Public health responses do not expose Redis host, port, URL, password, DB index, key names, or raw provider errors.

### Story 2 - Transient State Boundary

As an architect, I need Redis usage to remain transient so durable business data stays auditable in PostgreSQL.

Independent test:

- Redis is documented and validated as transient-only.
- PostgreSQL remains the source of truth for identity, sessions, roles/admin authorization, audit records, and future durable business data.
- No Redis-backed durable business state is introduced.

### Story 3 - Safe Redis Keying

As a QA reviewer, I need Redis keys to be isolated, namespaced, expiring, and non-sensitive.

Independent test:

- Redis-backed tests prove namespace isolation, TTL behavior, and collision prevention.
- Keys do not contain raw email, password, token, cookie, secret, Redis URL, or database URL.

### Story 4 - FEAT-010A Regression Protection

As a security reviewer, I need rate limiting to keep working after Redis health abstraction is introduced.

Independent test:

- FEAT-010A login/register/refresh throttling remains fail-closed, multi-instance safe, and non-enumerating.

## 2. Redis Authority Boundary

Redis is approved only for transient/distributed state under ADR-005.

Allowed FEAT-015 responsibilities:

- Internal readiness/validation checks.
- Transient counters/cooldowns from FEAT-010A.
- Future transient caches, locks, quotas, and coordination only when specified by their owning feature.

Prohibited responsibilities:

- Durable user, credential, session, role, admin authorization, audit, product-domain, entitlement, or financial state authority.
- Redis-only source of truth for business decisions that must survive Redis loss.
- Public Redis management, inspection, flush, debug, metrics-with-secrets, or key-listing API.

## 3. Liveness Versus Readiness

Liveness:

- Indicates the process can respond.
- MUST NOT require Redis.
- MUST NOT expose Redis details.

Readiness:

- Indicates the process is ready to serve routes that depend on required infrastructure.
- MUST include Redis status when Redis-backed protected features are enabled.
- MUST be internal/operator-facing only or otherwise protected by deployment controls.
- Public health may report generic readiness only if approved by existing health conventions, without Redis details.

## 4. Redis Unavailable / Degraded Behavior

Current required fail-closed features:

- `POST /auth/login`
- `POST /api/auth/login`
- `POST /auth/register`
- `POST /api/auth/register`
- `POST /auth/refresh`
- `POST /api/auth/refresh`

When Redis cannot make a safe rate-limit decision for these endpoints:

- The endpoint MUST fail closed with the approved safe FEAT-010A response.
- It MUST NOT authenticate, register, refresh, rotate, revoke, or mutate PostgreSQL as if the limiter had passed.
- It MUST NOT leak Redis details.
- It MUST NOT create durable audit amplification.

Potentially available surfaces while Redis is degraded:

- Liveness endpoint.
- Non-Redis-dependent routes that do not require Redis-backed protection.
- Authenticated routes using already-issued access tokens where no Redis-backed protection is required by the route.

Future features MUST define their own Redis outage behavior. FEAT-015 does not silently decide product-domain cache or lock semantics.

## 5. Recovery Semantics

After Redis connectivity returns:

- Readiness may recover without process restart if the connection/client abstraction can reconnect safely.
- Rate-limit/counter state resumes from Redis state that still exists by TTL.
- Expired counters/cooldowns may be absent; PostgreSQL durable auth/session/audit state remains authoritative.
- Recovery MUST NOT replay stale Redis operations into PostgreSQL.
- Recovery diagnostics must remain sanitized.

## 6. Connection Lifecycle

Implementation SHOULD centralize Redis client creation in approved infrastructure.

Expected lifecycle:

- Startup configuration validation occurs before serving Redis-dependent protected behavior.
- Runtime readiness uses bounded checks such as `PING` or equivalent minimal operation.
- Redis clients shut down cleanly in application/test teardown.
- Tests can create isolated client instances without sharing non-isolated keys.
- Multi-instance use relies on shared Redis, not per-process memory authority.

## 7. Namespace And Key Strategy

Required pattern:

```text
{app}:{env}:{feature}:{version}:{scope}:{digest-or-id}
```

Recommended baseline:

```text
aura:{environment}:rl:v1:{endpoint}:{scope}:{digest}
aura:{environment}:health:v1:{scope}
```

Requirements:

- Namespace MUST include application and environment/test namespace context.
- Feature/version segments MUST prevent cross-feature collisions.
- Parallel tests MUST use isolated namespace suffixes or isolated Redis DB configuration.
- Raw sensitive input MUST NOT appear in keys.
- Identity-aware digests MUST use approved keyed HMAC behavior from FEAT-010A when identity correlation is needed.

## 8. TTL Expectations

- Transient Redis keys MUST have TTLs.
- Rate-limit counters and cooldowns keep FEAT-010A-approved TTL/window behavior.
- Health probe keys, if any, MUST have short TTL and non-sensitive values.
- Future non-expiring Redis keys require explicit Human-approved feature rationale.

## 9. Environment Rules

Local:

- Redis may run through local Docker/developer service.
- Safe defaults may exist only for local development.
- Public health must still hide Redis details.

Test:

- Redis-backed tests MUST use isolated namespace or isolated Redis DB.
- Tests MUST fail fast when Redis is required but unavailable.
- Test output MUST sanitize Redis configuration and keys.

CI:

- CI MUST provision Redis or mark Redis-backed validation unavailable truthfully.
- Required FEAT-015/FEAT-010A Redis tests MUST not silently skip.
- CI namespaces must be isolated per run where practical.

Staging:

- Redis configuration must be environment-provided.
- No developer-local `.env` dependency.
- No sensitive details in health responses or logs.

Production:

- Redis configuration must be environment-provided and validated.
- Public health responses must not expose Redis infrastructure.
- Redis must not be treated as durable system of record.

## 10. Diagnostics Sanitization

Logs/reports/responses MUST NOT expose:

- Redis URL, host, port, password, username, DB index, provider endpoint, or credentials.
- Raw Redis keys that embed derived sensitive context.
- Raw email, password, access token, refresh token, cookie, authorization header, JWT payload, or secrets.
- Database URLs or unrelated infrastructure secrets.
- Sensitive absolute local paths.

Allowed diagnostics:

- Generic categories such as `REDIS_ERROR`, `REDIS_UNAVAILABLE`, `READINESS_DEGRADED`.
- Request ID/correlation ID.
- Safe feature name such as `rate-limit` or `redis-readiness`.

## 11. Validation Strategy

FEAT-015 implementation must include:

- Unit tests for readiness result mapping, namespace/key builder rules, TTL requirement validation, and sanitization.
- Redis-backed tests for healthy Redis, unavailable Redis, isolated keys, namespace collision prevention, TTL expiry, recovery after unavailable state, and multi-instance shared state.
- Integration tests proving FEAT-010A login/register/refresh rate limiting remains unchanged.
- Regression validation for FEAT-001 through FEAT-014.

Required validation commands:

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

If a Redis health-specific guard or test command is added, it must be deterministic and runnable from repository root.

## 12. Regression Boundary

FEAT-015 must preserve:

- FEAT-010A rate-limit thresholds, counters, key secrecy, alias sharing, fail-closed Redis outage behavior, and audit-amplification prevention.
- FEAT-005 refresh rotation/replay/family revocation.
- FEAT-009 auth audit semantics.
- FEAT-011 persistence guard.
- FEAT-012 migration guard.
- FEAT-013 repository/transaction boundary.
- FEAT-014 constraint standards.

## 13. Acceptance Mapping

- Readiness/liveness and failure semantics: AC-001 through AC-008
- Redis authority/key/TTL/isolation: AC-009 through AC-017
- Security/diagnostics/environment: AC-018 through AC-023
- Regression/governance/reporting: AC-024 through AC-030

## 14. Human Review Notes

FEAT-015 is an infrastructure feature. It may add internal readiness validation and tests, but it must not add product-domain cache behavior or expose Redis internals publicly.
