# Requirement: FEAT-010A Authentication Endpoint Rate Limiting & Progressive Protection

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Feature ID**: FEAT-010A  
**Phase**: Phase 2 - Identity & Security  
**Date**: 2026-08-27

## 1. Background

Human selected Option A for the unresolved Phase 2 rate-limiting requirement.

FEAT-010 remains the final Phase 2 Security Integration Gate and must not implement rate limiting itself. FEAT-010A owns authentication endpoint rate limiting and progressive abuse protection before FEAT-010 final validation can begin.

FEAT-002 through FEAT-009 are already Human-approved. FEAT-010A must preserve those approved semantics.

## 2. Goal

Protect high-risk authentication endpoints from brute force, credential stuffing, registration spam, refresh abuse, and audit amplification while preserving safe auth behavior and avoiding account enumeration.

Minimum protected endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`

Alternative `/api/auth/*` routes, if present for the same actions, must receive equivalent protection.

## 3. Scope

In scope:

- Redis-backed transient rate-limit counters.
- Endpoint-specific limit policy for login, register, and refresh.
- Progressive protection using increasing cool-down windows or equivalent temporary throttling.
- Safe rate-limit response contract using `429 TOO_MANY_REQUESTS` and safe `Retry-After`.
- Proxy/IP trust policy.
- Non-PII rate-limit key strategy.
- Redis outage/failure semantics.
- Audit interaction policy that avoids audit amplification.
- Multi-instance safe behavior using shared Redis.
- Unit, integration, Redis-backed, security, and regression tests.

Out of scope:

- Permanent account lockout.
- Manual unlock workflows.
- CAPTCHA.
- Email verification.
- Device fingerprinting.
- Public rate-limit status endpoint.
- Admin management UI.
- Changing FEAT-003 registration behavior beyond throttling.
- Changing FEAT-004 login/token semantics beyond throttling.
- Changing FEAT-005 refresh rotation/replay semantics beyond throttling.
- Changing FEAT-009 durable audit taxonomy unless explicitly required by approved spec.
- FEAT-010 final validation implementation.
- Phase 3 product-domain persistence.

## 4. Core Requirements

### 4.1 Redis Transient Counters Only

Redis may store short-lived counters, cool-down state, and correlation keys required for rate limiting.

PostgreSQL remains the durable authority for:

- users
- credentials
- refresh sessions
- roles/admin authority
- audit records

Redis must never become durable auth/security authority.

### 4.2 Progressive Protection

Rate limiting must apply temporary progressive protection rather than permanent account lockout.

Acceptable protection patterns include:

- per-window request ceilings
- short cool-down after repeated failures
- escalating cool-down for repeated abuse
- endpoint-specific stricter policy for refresh abuse

The system must not permanently disable accounts as part of FEAT-010A.

### 4.3 No Enumeration

Rate-limit behavior must not reveal whether an email account exists.

For login/register identity-aware limits:

- keys must use a secret HMAC or equivalent non-reversible keyed digest over normalized identity, not raw email
- response contract must be generic and stable
- logs must not expose raw email
- metrics/log dimensions must not include raw email

### 4.4 Safe Response Contract

Throttled requests must return:

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests. Please try again later.",
    "requestId": "..."
  }
}
```

The response should include a `Retry-After` header with a bounded integer number of seconds when a reliable retry time is known.

The response must not include identity, counter values, Redis keys, raw IP, email, token, cookie, or internal policy details.

### 4.5 Proxy / IP Trust

Default local/test behavior must use the direct remote address.

Proxy-derived headers such as `X-Forwarded-For` must not be trusted unless an explicit environment configuration enables trusted proxy mode. When trusted proxy mode is disabled, spoofed forwarding headers must not affect rate-limit identity.

If trusted proxy mode is enabled, the accepted proxy configuration must be explicit, validated, documented, and safe for deployment.

### 4.6 Redis Failure Semantics

Redis failure must be safe and explicit.

Required baseline:

- fail closed for high-risk refresh replay/abuse protection if the limiter cannot make a safe decision
- fail closed or controlled degraded throttling for login/register according to approved policy
- never bypass authentication, authorization, or refresh replay protection
- never return a false successful auth response because Redis failed
- log sanitized operational failure without leaking Redis URLs, keys, tokens, cookies, passwords, raw email, or stack traces in production responses

Human approved fail closed for login, register, and refresh Redis outage behavior as the Phase 2 baseline.

### 4.7 Audit Interaction

Rate limiting must not create audit amplification.

FEAT-010A must not add a durable audit row for every throttled request unless Human explicitly approves a new audit taxonomy and volume strategy.

Recommended baseline:

- throttled login/register/refresh requests return safe `429`
- sanitized structured logs record rate-limit decisions
- existing FEAT-009 audit semantics remain unchanged for non-throttled authentication flows
- no raw email/token/cookie/password/secret appears in logs or audit metadata

### 4.8 Multi-Instance Safety

Rate limiting must work across multiple API instances by using shared Redis state. In-memory-only rate limiting is not acceptable as the primary mechanism.

## 5. Dependencies

Required completed dependencies:

- FEAT-002 - Identity Persistence & Auth Configuration
- FEAT-003 - Registration & Password Security
- FEAT-004 - Login & Access Token Issuance
- FEAT-005 - Refresh Token Rotation & Revocation
- FEAT-006 - Logout & Session Invalidation
- FEAT-007 - RBAC Authorization Foundation
- FEAT-008 - Admin Authorization Guard
- FEAT-009 - Authentication Audit Events

Downstream dependency:

- FEAT-010 is blocked until FEAT-010A receives Codex QA PASS and Human Final Gate approval; this dependency is satisfied after Human Final Gate approval.

## 6. Human Decisions

Human approved the following decisions:

1. Redis outage behavior is fail closed for login, register, and refresh.
2. Numeric limits/windows use the proposed baseline in `spec.md`.
3. `Retry-After` is required when deterministic.
4. No new durable audit event type is added for throttled requests in FEAT-010A.
