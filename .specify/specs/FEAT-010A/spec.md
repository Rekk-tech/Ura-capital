# Specification: FEAT-010A Authentication Endpoint Rate Limiting & Progressive Protection

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Feature ID**: FEAT-010A  
**Phase**: Phase 2 - Identity & Security

## 1. User Stories

### Story 1 - Login Abuse Protection

As a platform owner, I need repeated login attempts to be temporarily throttled so that brute-force and credential-stuffing traffic cannot hammer password verification or produce unlimited audit/log volume.

**Independent Test**: Repeated failed login attempts for the same normalized identity and/or source eventually return safe `429` without revealing whether the account exists.

### Story 2 - Registration Spam Protection

As a platform owner, I need registration attempts to be temporarily throttled so that automated account creation spam is slowed without changing approved registration behavior for normal users.

**Independent Test**: Repeated registration attempts exceed the configured policy and receive safe `429`; a normal first registration still works.

### Story 3 - Refresh Abuse Protection

As a platform owner, I need refresh attempts to be throttled so that missing, malformed, invalid, replayed, or high-frequency refresh calls cannot flood the auth boundary.

**Independent Test**: Excessive refresh calls from the same source/session context receive safe `429`; FEAT-005 replay detection remains authoritative and PostgreSQL family revocation remains intact.

### Story 4 - Operational Safety

As an operator, I need rate limiting to be multi-instance safe, Redis-backed, and sanitized so that production traffic is consistently protected without leaking PII or secrets.

**Independent Test**: Redis-backed tests prove counters are shared, keys are non-sensitive, Redis failures behave as approved, and logs/responses contain no raw email/token/password/cookie/secret.

## 2. Functional Requirements

- **FR-001**: FEAT-010A MUST protect `POST /auth/login`, `POST /auth/register`, and `POST /auth/refresh`.
- **FR-002**: Equivalent `/api/auth/login`, `/api/auth/register`, and `/api/auth/refresh` aliases, if present, MUST receive equivalent protection.
- **FR-003**: Redis MUST be used for transient counters/cool-down state; in-memory-only rate limiting MUST NOT be the primary mechanism.
- **FR-004**: PostgreSQL MUST remain the durable authority for identity, credentials, refresh sessions, roles/admin authorization, and audit records.
- **FR-005**: FEAT-010A MUST implement progressive temporary protection and MUST NOT implement permanent account lockout.
- **FR-006**: Rate-limit policy MUST be endpoint-specific and risk-aware.
- **FR-007**: Login throttling MUST avoid account enumeration for unknown user and wrong password paths.
- **FR-008**: Registration throttling MUST avoid exposing whether a normalized email already exists beyond the already approved duplicate-registration contract for non-throttled requests.
- **FR-009**: Refresh throttling MUST NOT weaken FEAT-005 refresh rotation, replay detection, or family revocation semantics.
- **FR-010**: Rate-limit keys MUST NOT include raw email, plaintext password, access token, refresh token, refresh token hash, cookie value, auth secret, JWT secret, Redis URL, or database URL.
- **FR-011**: Identity-aware keys MUST use a keyed HMAC digest over normalized identity with a dedicated environment secret, or another Human-approved non-reversible keyed construction.
- **FR-012**: The rate-limit key secret MUST be required in environments where identity-aware keys are enabled and MUST NOT reuse JWT/access/refresh/audit secrets.
- **FR-013**: Throttled responses MUST use the standard error envelope with code `TOO_MANY_REQUESTS`.
- **FR-014**: Throttled responses MUST include a safe `Retry-After` header when a deterministic retry time is available.
- **FR-015**: Throttled response bodies MUST NOT expose identity, counter values, raw IP, Redis keys, policy internals, tokens, cookies, secrets, or credential state.
- **FR-016**: Default source-key behavior MUST use direct remote address and MUST NOT trust `X-Forwarded-For` unless trusted proxy mode is explicitly configured.
- **FR-017**: Trusted proxy configuration, if supported, MUST be environment-driven, validated at startup, and tested against spoofed forwarding headers.
- **FR-018**: Redis unavailable or Redis operation failure MUST follow approved fail-safe behavior and MUST NOT allow auth bypass, refresh replay bypass, role/admin bypass, or false successful auth responses.
- **FR-019**: Recommended baseline is fail closed for login, register, and refresh when Redis cannot make a safe limiter decision.
- **FR-020**: Redis failure logs MUST be sanitized and MUST NOT expose Redis URL, key material, raw email, password, token, cookie, secret, stack trace in production response, or raw provider error to clients.
- **FR-021**: Rate-limited requests MUST NOT create durable audit amplification.
- **FR-022**: FEAT-010A MUST NOT add a new durable audit event type unless Human explicitly approves the taxonomy change.
- **FR-023**: Existing FEAT-009 audit semantics for non-throttled registration, login, refresh, logout, authorization, and role events MUST remain unchanged.
- **FR-024**: Multi-instance safety MUST be achieved through shared Redis state and atomic Redis operations where counters/cool-down updates require consistency.
- **FR-025**: Rate-limit behavior MUST be configurable by environment using validated settings with safe local/test defaults.
- **FR-026**: Tests MUST cover unit policy evaluation, integration endpoint behavior, Redis-backed counter behavior, Redis failure behavior, proxy spoofing, sensitive-data sanitization, and FEAT-001 through FEAT-009 regression.
- **FR-027**: CI/local validation expectations MUST include Redis-backed tests that fail fast when Redis is required but unavailable; tests must not silently pass with disabled rate limiting.
- **FR-028**: FEAT-010A MUST update implementation documentation and progress tracker state truthfully after implementation.

## 3. Proposed Limit Policy

Human approved these numeric baselines for implementation.

| Endpoint | Key Dimensions | Baseline Window | Progressive Protection |
| --- | --- | --- | --- |
| `POST /auth/login` | source + normalized-identity HMAC, plus source-only fallback | 5 failed attempts per 10 minutes per identity/source pair; 30 attempts per 10 minutes per source | 15 minute cool-down after threshold; repeated threshold within 1 hour escalates to 30 minutes |
| `POST /auth/register` | source + normalized-identity HMAC, plus source-only | 5 attempts per 15 minutes per source; 3 attempts per 1 hour per identity/source pair | 30 minute cool-down after threshold |
| `POST /auth/refresh` | source + refresh-cookie presence bucket; do not key on raw token | 20 attempts per 10 minutes per source; 5 malformed/missing attempts per 10 minutes per source | 15 minute cool-down; replay semantics still handled by FEAT-005/009 |

Notes:

- Login counters should increment on failed login attempts and may also apply a broad source ceiling to all login attempts.
- Successful login may clear or reduce identity/source failure counters only after successful password verification, without exposing existence of unknown identities.
- Registration counters apply before expensive persistence/hashing where possible, while preserving validation/error semantics.
- Refresh counters must not use raw refresh token or token hash in Redis keys.

## 4. Key Strategy

Recommended key components:

```text
rl:v1:{endpoint}:{scope}:{digest-or-source}
```

Allowed key material:

- endpoint category: `login`, `register`, `refresh`
- scope category: `source`, `identity_source`, `cooldown`
- HMAC digest of normalized email for identity-aware login/register keys
- source fingerprint derived from approved proxy/IP policy
- static version prefix

Prohibited key material:

- raw email
- raw password
- raw access token
- raw refresh token
- refresh token hash/verifier
- full Cookie or Authorization header
- JWT payload
- user-agent as sole authority
- database URL
- Redis URL
- any auth/JWT/refresh/audit secret

HMAC secret requirements:

- dedicated environment variable, recommended `AUTH_RATE_LIMIT_KEY_SECRET`
- minimum length validated at startup
- no fallback value
- not reused from access token, refresh token, JWT, audit identity, or database secrets

## 5. Redis Failure Semantics

Recommended Phase 2 baseline:

- login: fail closed with safe `503 SERVICE_UNAVAILABLE` or `429 TOO_MANY_REQUESTS` style protection response when limiter cannot make a safe decision; Human to choose exact external contract
- register: fail closed with safe response
- refresh: fail closed; never mint an access token when limiter state cannot be checked

All Redis failure responses must:

- use the standard error envelope
- include requestId
- avoid credential/account enumeration
- avoid leaking infrastructure details
- emit sanitized operational logs
- not create recursive durable audit amplification

## 6. Proxy / IP Policy

Default:

- do not trust `X-Forwarded-For`, `Forwarded`, or similar client-controlled headers
- use framework-provided direct remote address
- tests must prove spoofed forwarding headers do not bypass limits

Trusted proxy mode:

- disabled by default
- enabled only by explicit environment configuration
- validates allowed proxy configuration at startup
- documents deployment requirement that the application is actually behind the trusted proxy
- tests must prove only trusted proxy-derived source resolution is used when enabled

## 7. Audit Interaction

FEAT-010A must avoid audit amplification.

Baseline:

- Do not add durable audit row for every 429.
- Do not add new event taxonomy by default.
- Existing FEAT-009 events still occur for non-throttled successful/failed auth flows.
- Throttled requests may produce sanitized structured logs with category `RATE_LIMITED`.
- If Human later wants durable rate-limit audit events, that must be a separate approved taxonomy change.

## 8. Success Criteria

- Normal registration, login, and refresh flows still work below thresholds.
- Excessive login/register/refresh attempts receive safe throttling responses.
- Unknown and existing identities cannot be distinguished through throttling behavior.
- Redis-backed counters work across simulated multiple app instances.
- Redis outage behavior follows approved fail-safe contract.
- No sensitive data appears in keys, logs, responses, or audit records.
- FEAT-001 through FEAT-009 regression validation remains green.
- FEAT-010 is unblocked for validation after FEAT-010A QA PASS and Human Final Gate approval.
