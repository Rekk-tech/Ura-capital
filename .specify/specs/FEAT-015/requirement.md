# Requirement: FEAT-015 Redis Health & Transient State Boundary

**Status**: PROPOSED FOR HUMAN REVIEW  
**Phase**: Phase 3 - Data Foundation & Core Domain  
**Feature Type**: Implementation feature  
**Implementation Agent**: Antigravity after Human approval  
**QA Owner**: Codex  

## 1. Context

ADR-005 approves Redis for transient and distributed state only. FEAT-010A already uses Redis for authentication endpoint rate-limit counters and cooldowns, while PostgreSQL remains the durable authority for identity, credentials, refresh sessions, roles/admin authorization, and audit records.

FEAT-015 extends that approved boundary into a shared Phase 3 infrastructure contract: Redis health/readiness, connection lifecycle, key namespace and isolation rules, TTL expectations, diagnostics sanitization, and regression protection for FEAT-010A. Redis health is internal readiness/validation only and must not expose sensitive infrastructure details through public health responses.

## 2. Goal

Define and validate the Redis operational boundary so future phases can safely use Redis for transient state without turning it into durable business authority or leaking infrastructure details.

## 3. In Scope

- Redis health/readiness contract.
- Liveness versus readiness semantics.
- Redis connection lifecycle expectations.
- Redis unavailable/degraded behavior.
- Internal validation behavior for Redis health.
- Test and CI Redis key isolation.
- Namespace/version strategy for Redis keys.
- TTL expectations for transient keys.
- Key collision prevention.
- Multi-instance Redis behavior.
- FEAT-010A rate-limit regression coverage.
- Redis diagnostics and log/response sanitization.
- Environment rules for local, test, CI, staging, and production.
- Implementation evidence in `reports/implementation/phase-3/FEAT-015.md`.

## 4. Out of Scope

- Moving identity, credentials, refresh sessions, roles, admin authorization, audit records, or product-domain durable authority to Redis.
- Durable Redis business state.
- Public Redis admin/debug APIs.
- Public Redis details in health responses.
- Exposing Redis host, port, URL, password, key names, DB index, latency internals, or provider errors to public clients.
- Product-domain cache behavior.
- Product-domain schema, APIs, UI, seed behavior, or audit table changes.
- FEAT-016 audit extension strategy.
- FEAT-018 final Phase 3 integration gate.

## 5. Functional Requirements

- **FR-001**: FEAT-015 MUST define Redis liveness versus readiness semantics.
- **FR-002**: Redis health MUST be internal readiness/validation only; public health responses MUST NOT expose sensitive Redis details.
- **FR-003**: Redis MUST remain transient-only. PostgreSQL MUST remain durable business authority.
- **FR-004**: FEAT-015 MUST define which current features fail closed when Redis is unavailable.
- **FR-005**: FEAT-015 MUST preserve FEAT-010A fail-closed behavior for `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, and equivalent aliases.
- **FR-006**: FEAT-015 MUST define which application surfaces may remain available when Redis is degraded, provided they do not require Redis-backed protection.
- **FR-007**: FEAT-015 MUST define Redis recovery semantics after connectivity returns.
- **FR-008**: FEAT-015 MUST define Redis connection lifecycle expectations for startup, runtime readiness, shutdown, and tests.
- **FR-009**: FEAT-015 MUST define test/CI Redis isolation through namespace and/or isolated Redis database configuration.
- **FR-010**: Redis keys MUST use an approved namespace/version pattern.
- **FR-011**: Redis keys MUST avoid raw email, password, access token, refresh token, cookie, session secret, JWT secret, Redis URL, database URL, or other sensitive values.
- **FR-012**: Redis keys MUST have TTLs unless a future feature explicitly receives Human approval for a non-expiring transient key.
- **FR-013**: FEAT-015 MUST define collision-prevention expectations across features, environments, tests, and parallel workers.
- **FR-014**: FEAT-015 MUST validate multi-instance behavior through shared Redis state.
- **FR-015**: Redis failure diagnostics MUST be sanitized and MUST NOT expose Redis URL, host, port, password, credentials, raw key values, tokens, cookies, passwords, secrets, or sensitive absolute paths.
- **FR-016**: Environment configuration MUST define local, test, CI, staging, and production Redis rules.
- **FR-017**: Missing or invalid Redis configuration MUST fail validation where Redis-backed protected behavior is required.
- **FR-018**: Redis outage MUST NOT mutate PostgreSQL auth/security state incorrectly.
- **FR-019**: FEAT-015 MUST include deterministic unit, integration, and Redis-backed tests for healthy Redis, unavailable Redis, isolated keys, namespace collision, TTL/expiry, recovery, multi-instance behavior, and FEAT-010A regression.
- **FR-020**: FEAT-015 MUST preserve FEAT-001 through FEAT-014 behavior.
- **FR-021**: Implementation evidence MUST record Redis health/readiness behavior, failure semantics, environment rules, validation commands, exact test counts, limitations, and AC mapping.

## 6. Non-Functional Requirements

- Redis checks must be fast, bounded, and deterministic.
- Health/readiness behavior must be safe for multi-instance deployments.
- Test runs must not share mutable Redis keys across unrelated features, workers, or environments.
- Redis failure must not cause account enumeration, auth bypass, refresh replay bypass, role/admin bypass, or audit corruption.
- Public responses must use generic operational status and request IDs, not infrastructure details.

## 7. Dependencies

- FEAT-014 DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-010A DONE / QA PASS / Human Final Gate APPROVED.
- FEAT-012 migration/environment guard expectations.
- ADR-005 Redis Responsibility Boundary.
- Approved Phase 3 feature decomposition.

## 8. Success Definition

FEAT-015 succeeds when Redis readiness and transient-state rules are documented, validated with live Redis where required, preserve FEAT-010A rate limiting, avoid sensitive leakage, isolate test/CI keys, and keep PostgreSQL as durable authority.

## 9. Open Questions

None blocking for spec review.

Future domain features must still decide their own Redis outage behavior, key namespace suffixes, TTLs, and cache/lock semantics within the FEAT-015 boundary.
