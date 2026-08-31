# Plan: FEAT-010A Authentication Endpoint Rate Limiting & Progressive Protection

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Feature ID**: FEAT-010A  
**Implementation Boundary**: Authentication rate limiting only

## 1. Architecture

FEAT-010A introduces an authentication rate-limiting boundary in the API layer before expensive or sensitive authentication work executes.

Recommended architecture:

```text
HTTP Request
  -> request ID / logging middleware
  -> rate-limit middleware for auth endpoint
  -> existing validation/controller/service flow
  -> existing PostgreSQL-backed auth/session/audit behavior
```

Redis is used only for transient counters and temporary cool-down state. PostgreSQL remains the durable authority for identity, credentials, refresh sessions, roles/admin authorization, and audit records.

## 2. Protected Routes

Minimum:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`

Also protect equivalent aliases if present:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`

## 3. Module Boundaries

Expected implementation boundaries, without prescribing exact file names:

- rate-limit configuration validation
- source/proxy resolver
- non-sensitive key builder
- Redis counter repository/client wrapper
- rate-limit policy evaluator
- Express middleware/route composition
- test helpers for isolated Redis keys

Controllers and auth services should not own Redis key construction or counter mutation directly.

## 4. Configuration Strategy

Configuration must be environment-driven and validated at startup:

- Redis connection URL or existing Redis config
- rate-limit enablement for local/test/CI/staging/production
- endpoint windows and thresholds
- cool-down durations
- trusted proxy mode
- dedicated identity-key HMAC secret

No production fallback secrets are allowed.

## 5. Limit Policy

Use endpoint-specific policies:

- login: strict failure-focused identity/source protection plus source ceiling
- register: source and normalized-identity protection against spam
- refresh: source and malformed/missing-cookie protection without raw token keys

The policy must be configurable, but defaults should match the approved FEAT-010A spec.

## 6. Redis Operations

Redis operations should be multi-instance safe:

- atomic increment with TTL
- atomic cool-down check/set where needed
- explicit key expiry
- clear namespace/version prefix
- no reliance on process memory for primary enforcement

Redis key namespace should support isolated tests through prefixing or dedicated Redis DB.

## 7. Failure Semantics

Recommended fail-safe contract:

- Redis unavailable before protected auth operation: do not continue silently.
- Return safe error response according to approved Human decision.
- Do not perform password verification, registration persistence, refresh rotation, or token issuance if the limiter is required and unavailable.
- Log sanitized operational failure.

The implementation report must clearly state that fail closed was approved and implemented for login, register, and refresh Redis outage behavior.

## 8. Audit Interaction

No durable audit row for every rate-limited request.

Existing FEAT-009 audit events remain unchanged for non-throttled flows.

Rate-limit decisions may be logged as sanitized operational logs, not durable audit records, unless Human separately approves an audit taxonomy extension.

## 9. Test Plan

Unit tests:

- policy evaluation
- key construction redaction
- HMAC identity digest
- Retry-After calculation
- proxy source resolution
- Redis failure classification

Integration tests:

- login threshold and uniform unknown/wrong-password behavior
- register threshold and duplicate-contract preservation
- refresh threshold and replay semantic preservation
- alias route protection
- safe response envelopes
- no raw sensitive data in responses/logs

Redis-backed tests:

- counters persist across app instances/client instances
- TTL is set
- cool-down is enforced
- Redis unavailable path follows approved fail-safe behavior
- isolated Redis namespace avoids cross-test pollution

Regression:

- FEAT-001 through FEAT-009 standard, DB, runtime smoke, and security regressions.

## 10. Validation Suite

Required:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:db
Redis-backed rate-limit tests
runtime smoke/E2E auth flow
```

## 11. Risks

- Overly strict fail-closed behavior may reduce availability during Redis outages.
- Bounded fail-open behavior may reduce protection during attacks.
- Identity-aware keys can become privacy-sensitive if raw identifiers leak.
- Rate-limited login/register behavior can accidentally reveal account existence.
- Audit-on-every-429 would amplify attack traffic into durable storage.

## 12. Governance

FEAT-010A must receive Codex QA PASS and Human Final Gate approval before FEAT-010 final validation starts.

FEAT-010 remains blocked while FEAT-010A is not complete.
