# FEAT-065 Specification: AI Rate Limits, Daily Quotas & Cost Controls

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Enforce atomic transient abuse and spend controls before provider invocation while keeping PostgreSQL as durable authority and avoiding enumeration or sensitive keys.

## Architecture And Ownership

AI endpoint/source/user counters, daily quota, reservation/settlement policy, Redis namespaces/TTL, multi-instance behavior, outage/recovery semantics, and safe quota responses.

Proposed ownership: apps/api/src/modules/ai/quota/**, approved Redis namespace helpers, AI quota tests, composition/configuration coordination, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Enforce Human-approved per-source, per-user, daily, concurrent, and optional global/provider-budget limits before any `LLMProvider` call, independent of the selected adapter.

### FR-002

Use Redis atomic operations/scripts so all API instances share counters and concurrent requests cannot exceed approved limits.

### FR-003

Use namespaced versioned TTL-bound keys with HMAC-derived user/source identifiers and no raw email, IP, prompt, token, cookie, or secret.

### FR-004

Make canonical and approved alias routes consume the same logical quota so route switching cannot bypass limits.

### FR-005

Define atomic reservation, provider-attempt accounting, normalized token/cost settlement, and abandoned-request expiry without undercounting billable attempts or depending on Gemini-specific usage types.

### FR-006

Fail closed with a safe unavailable response before provider invocation when required Redis/quota state is unavailable or ambiguous.

### FR-007

Return deterministic safe 429/quota contracts with accurate Retry-After where applicable and no account/enumeration side channel.

### FR-008

Prohibit permanent account lockout and keep Redis from becoming identity, entitlement, subscription, conversation, or usage-ledger authority.

### FR-009

Isolate local/test/CI namespaces by environment/run/worker and ensure cleanup cannot delete another run or production keys.

### FR-010

Test thresholds, concurrency, multi-instance sharing, alias behavior, TTL/expiry, outage/recovery, key/log sanitization, and FEAT-010A/015 regression.

## Authority And Security

- Authenticated identity and authorization facts are server-derived.
- Client, retrieved, and model-supplied business facts are untrusted.
- PostgreSQL remains durable business authority; Redis and the model are never durable or authorization authorities.
- Raw prompts, responses, context, provider payloads, credentials, tokens, cookies, secrets, and sensitive paths are prohibited from ordinary diagnostics.
- Provider/model output cannot grant entitlement, place trades, grade work, mutate progress, or authorize any action.

## Failure Contract

Validation, dependency, timeout, unavailable, quota, malformed-output, and safety outcomes must be deterministic and sanitized. The implementation must never fabricate success, silently enable a fallback, or weaken an existing-domain failure policy.

## Environment Contract

Local/test/CI fakes require explicit approved predicates. Staging, production, production-like, unknown, and conflicting environments fail closed for fake or unsafe configuration. Secrets come only from validated environment configuration and have no hard-coded/default fallback.

## Data And Migration

ZERO. Redis state is transient and TTL-bound; no PostgreSQL quota table is introduced.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Quota Algorithm

The candidate P8-D05 contract, pending Human confirmation, is normative in `docs/phase-8-feature-decomposition.md` section 12.3:

- server-derived source protection: 60 authenticated structurally valid route attempts per rolling 60 seconds;
- user controls: 5 initiated attempts per rolling 60 seconds, 50 per UTC calendar day, and 2 active attempts;
- global control: a required Human-supplied daily USD ceiling represented in integer micro-units, with no default/fallback;
- atomic reservation: source, minute, day, concurrency, and worst-case cost succeed or fail together before provider invocation;
- accounting: pre-provider rejection is free; an initiated timeout/cancellation/ambiguous call consumes request quota and keeps the conservative cost reservation; no ambiguous retry;
- settlement: trustworthy normalized usage atomically replaces the reservation using the versioned price snapshot; absent/failed settlement retains the full reservation;
- failure: pre-reservation Redis failure is safe 503/no provider call; post-call settlement failure retains protection and bounded TTL recovery;
- state loss: detected restart/flush or ambiguous current-day budget continuity remains fail-closed until approved reconciliation/re-arm; no silent zero-spend reset;
- isolation: dedicated HMAC identifiers, no raw source/user/content, production namespace unchanged by run/worker test isolation.

Only per-user minute/day limit, remaining, and reset values may be public. Source, concurrency, global budget, price, reserved cost, provider usage, and Redis details remain private.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D04: APPROVED - all authenticated users may access Aura Intelligence subject to quotas; no premium gate.
- P8-D05: APPROVED WITH BLOCKER - the complete quota/cost proposal is prepared, but its Human-decision values are not implementation-authorized.
- P8-D15: PENDING - production provider selection may change cost/token characteristics but cannot weaken these provider-independent controls.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-058 and BLOCKED from completion by the remaining P8-D05 parameters.
