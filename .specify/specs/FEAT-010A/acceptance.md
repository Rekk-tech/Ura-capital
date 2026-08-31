# Acceptance Criteria: FEAT-010A Authentication Endpoint Rate Limiting & Progressive Protection

**Status**: DONE - QA PASS - HUMAN FINAL GATE APPROVED  
**Feature ID**: FEAT-010A

## 1. Acceptance Criteria

| AC | Criterion | Verification |
| --- | --- | --- |
| AC-001 | FEAT-010A scope is limited to authentication endpoint rate limiting and progressive protection. | Source/diff review |
| AC-002 | FEAT-002 through FEAT-009 approved semantics remain unchanged except for approved throttling before protected endpoints. | Regression/spec review |
| AC-003 | Redis is used only for transient counters/cool-down state and not durable auth/security authority. | Source/config review |
| AC-004 | Rate limiting is multi-instance safe through shared Redis state, not process-local memory as primary enforcement. | Redis-backed test |
| AC-005 | Login, registration, and refresh have separate endpoint-specific limits and risk-aware policies. | Config/unit test |
| AC-006 | Progressive protection uses temporary throttling/cool-down and does not permanently lock accounts. | Unit/integration/source review |
| AC-007 | Throttled responses use safe standard envelope with code `TOO_MANY_REQUESTS`. | Integration test |
| AC-008 | Throttled responses include bounded safe `Retry-After` when deterministic and never expose policy internals. | Integration test |
| AC-009 | Rate-limit keys never include raw email, password, access token, refresh token, token hash, cookie, Authorization header, Redis URL, DB URL, or secrets. | Unit/security review |
| AC-010 | Identity-aware keys use a dedicated non-reused HMAC secret over normalized identity. | Unit/config/security test |
| AC-011 | Login throttling does not reveal whether the account exists; unknown user and wrong-password paths remain externally uniform. | Integration/security test |
| AC-012 | Registration throttling does not reveal account existence beyond approved non-throttled duplicate contract. | Integration/security test |
| AC-013 | Default source resolution does not trust `X-Forwarded-For` or similar spoofable headers. | Unit/integration test |
| AC-014 | Trusted proxy mode, if implemented, is explicit, environment-validated, and tested; otherwise it is clearly unsupported/out of scope. | Config/test review |
| AC-015 | Redis unavailable behavior follows Human-approved fail-safe contract and never permits auth/token/refresh bypass. | Redis failure test |
| AC-016 | Refresh throttling never weakens FEAT-005 replay detection or PostgreSQL family revocation. | Integration/DB/runtime |
| AC-017 | Required rate-limit config fails startup when missing or unsafe in environments that require it; no fallback secrets exist. | Unit/config test |
| AC-018 | Redis-backed tests fail fast when Redis is required but unavailable and do not silently disable protection. | Redis-backed test |
| AC-019 | Redis failure and rate-limit logs are sanitized and expose no raw email, password, token, cookie, secret, Redis URL, DB URL, or production stack trace. | Log capture/security test |
| AC-020 | Non-throttled registration, login, refresh, logout, RBAC, admin, and audit behavior remains compatible with FEAT-003 through FEAT-009. | Regression tests |
| AC-021 | Rate-limited requests do not create durable audit amplification or a new audit taxonomy without Human approval. | Source/DB/audit review |
| AC-022 | Existing FEAT-009 audit events still occur for non-throttled approved high-value auth/security actions. | Integration/DB test |
| AC-023 | Sensitive-data sentinel confirms no raw credentials, tokens, cookies, secrets, or raw identity values appear in keys/logs/responses/audit rows. | Security/Redis/DB test |
| AC-024 | Full FEAT-001 through FEAT-009 regression validation passes. | Command evidence |
| AC-025 | Required validation suite passes, including Redis-backed tests and DB-backed tests. | Command evidence |
| AC-026 | Implementation report truthfully records rate-limit architecture, key strategy, limit policy, Redis failure semantics, proxy/IP policy, audit interaction, tests, validation, and AC mapping. | Report review |
| AC-027 | FEAT-010 remains blocked until FEAT-010A receives Codex QA PASS and Human Final Gate approval; after approval, FEAT-010 is unblocked for validation and Phase 3 remains blocked. | Progress tracker review |

## 2. Mandatory PASS Conditions

FEAT-010A may receive QA PASS only when:

- AC-001 through AC-027 pass.
- Protected endpoints include canonical and alias routes where aliases exist.
- Redis-backed tests execute against isolated Redis state with no silent skips.
- No P0/P1 authentication, authorization, token, refresh, or privacy defect remains.
- FEAT-001 through FEAT-009 regression validation remains green.
- Implementation report evidence is truthful.

## 3. Mandatory FAIL Conditions

FEAT-010A must FAIL if any of the following occur:

- Redis keys/logs/responses expose raw email, password, token, cookie, secret, Redis URL, DB URL, or auth internals.
- Login/register throttling reveals whether an account exists.
- Rate limiting permits authentication, authorization, or refresh replay bypass.
- Redis failure silently disables protection contrary to approved policy.
- Refresh throttling prevents FEAT-005 replay/family revocation from executing correctly.
- FEAT-010A adds permanent account lockout.
- FEAT-010A adds audit-on-every-429 durable rows without Human-approved taxonomy change.
- FEAT-010A changes FEAT-003 through FEAT-009 behavior outside approved throttling.
- Redis-backed tests are skipped or mocked while claiming live Redis validation.

## 4. Human Decisions

Human approved:

1. Fail-closed baseline for login/register/refresh Redis outage.
2. Proposed numeric rate limits/windows.
3. `Retry-After` when deterministic.
4. No new durable audit event type for throttled requests in FEAT-010A.
