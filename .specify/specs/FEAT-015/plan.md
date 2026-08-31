# Plan: FEAT-015 Redis Health & Transient State Boundary

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Implementation Constraint**: No implementation before Human approval

## 1. Objective

Establish a shared Redis readiness and transient-state boundary that preserves ADR-005, keeps PostgreSQL as durable authority, and protects FEAT-010A rate limiting from regression.

## 2. Architecture Decisions

1. Redis readiness is internal/operator validation, not a public infrastructure disclosure surface.
2. Liveness does not depend on Redis; readiness does when Redis-backed protected behavior is enabled.
3. Redis remains transient-only; PostgreSQL remains durable authority.
4. FEAT-010A protected auth endpoints continue to fail closed when Redis cannot make a safe limiter decision.
5. Redis keys use namespaced, versioned, non-sensitive, TTL-bound keys.
6. Multi-instance correctness uses shared Redis, not process-local memory.
7. Future domain features must specify their own Redis cache/lock/outage semantics.

## 3. Workstreams

### Workstream A - Redis Boundary Documentation

- Document Redis transient-only authority.
- Document readiness/liveness split.
- Document outage/degraded/recovery behavior.
- Document environment rules.

### Workstream B - Redis Infrastructure Contract

- Define centralized Redis health/check interface.
- Define connection lifecycle and shutdown expectations.
- Define bounded readiness check behavior.
- Define sanitized diagnostics.

### Workstream C - Key Namespace And TTL Governance

- Define key namespace/version format.
- Define test/CI isolation strategy.
- Define TTL requirement and non-expiring-key exception process.
- Define collision-prevention expectations.

### Workstream D - FEAT-010A Regression

- Verify login/register/refresh rate-limit behavior remains unchanged.
- Verify canonical and `/api/auth/*` aliases remain protected by the same quota.
- Verify Redis outage remains fail-closed and does not mutate PostgreSQL incorrectly.

### Workstream E - Validation And Reporting

- Add deterministic unit/integration/Redis-backed tests as required.
- Run full validation suite.
- Produce `reports/implementation/phase-3/FEAT-015.md`.
- Update progress tracker only after implementation evidence is truthful.

## 4. Implementation Boundaries

Allowed:

- Internal readiness/validation code.
- Redis health abstraction or service in infrastructure layer.
- Tests and test helpers for isolated Redis keys.
- Documentation for namespace/TTL/failure semantics.

Prohibited:

- Redis durable business authority.
- Public Redis admin/debug APIs.
- Public exposure of Redis host/port/URL/password/key names/provider errors.
- Product-domain cache behavior.
- Product schema/API/UI/seed/audit-table changes.
- FEAT-016 or FEAT-018 behavior.

## 5. Data And Migration Impact

- No PostgreSQL schema change expected.
- No Prisma migration expected.
- No Redis durable data model.
- Redis keys are transient and TTL-bound.

## 6. Test Strategy

Unit tests:

- readiness result mapping
- liveness/readiness separation
- key namespace validation
- TTL requirement validation
- diagnostics sanitization
- environment config validation

Redis-backed tests:

- healthy Redis readiness
- unavailable Redis readiness failure
- recovery after Redis returns
- isolated namespaces
- collision prevention
- TTL expiry
- multi-instance shared state

Integration/regression tests:

- FEAT-010A login/register/refresh rate limiting
- alias quota sharing
- safe 503/429 behavior as approved
- no durable audit amplification
- no PostgreSQL mutation on Redis failure

Full regression:

- clean, lint, Prisma validate, typecheck, build
- standard tests
- PostgreSQL-backed tests
- Redis-backed tests
- persistence/migration/boundary guards

## 7. Security And Data-Integrity Risks

| Risk | Mitigation |
|---|---|
| Redis becomes accidental durable authority | Explicit boundary tests and docs; PostgreSQL remains durable source of truth. |
| Public health leaks Redis infrastructure | Public response contract forbids Redis details; tests verify sanitization. |
| Test/CI Redis keys collide | Namespace/run isolation required. |
| Missing TTL creates stale transient state | TTL tests and key policy require expiry. |
| Redis outage bypasses auth protection | FEAT-010A fail-closed regression tests. |
| Multi-instance inconsistency | Shared Redis behavior tested with independent clients/instances. |

## 8. Dependencies

- FEAT-010A approved implementation and QA evidence.
- FEAT-014 Human Final Gate approval.
- ADR-005 Redis responsibility boundary.
- Existing environment validation conventions.

## 9. Rollout / QA Notes

Implementation must stop at FEAT-015. FEAT-016 remains blocked until FEAT-015 receives QA PASS and Human Final Gate approval.

QA should independently verify live Redis behavior and ensure no technical evidence is simulated or skipped.
