# FEAT-065 Requirement: AI Rate Limits, Daily Quotas & Cost Controls

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation

## Goal

Enforce atomic transient abuse and spend controls before provider invocation while keeping PostgreSQL as durable authority and avoiding enumeration or sensitive keys.

## Functional Requirements

- FR-001 Enforce Human-approved per-source, per-user, daily, concurrent, and optional global/provider-budget limits before any `LLMProvider` call, independent of the selected adapter.
- FR-002 Use Redis atomic operations/scripts so all API instances share counters and concurrent requests cannot exceed approved limits.
- FR-003 Use namespaced versioned TTL-bound keys with HMAC-derived user/source identifiers and no raw email, IP, prompt, token, cookie, or secret.
- FR-004 Make canonical and approved alias routes consume the same logical quota so route switching cannot bypass limits.
- FR-005 Define atomic reservation, provider-attempt accounting, normalized token/cost settlement, and abandoned-request expiry without undercounting billable attempts or depending on Gemini-specific usage types.
- FR-006 Fail closed with a safe unavailable response before provider invocation when required Redis/quota state is unavailable or ambiguous.
- FR-007 Return deterministic safe 429/quota contracts with accurate Retry-After where applicable and no account/enumeration side channel.
- FR-008 Prohibit permanent account lockout and keep Redis from becoming identity, entitlement, subscription, conversation, or usage-ledger authority.
- FR-009 Isolate local/test/CI namespaces by environment/run/worker and ensure cleanup cannot delete another run or production keys.
- FR-010 Test thresholds, concurrency, multi-instance sharing, alias behavior, TTL/expiry, outage/recovery, key/log sanitization, and FEAT-010A/015 regression.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

FEAT-058; FEAT-015 Redis boundary; FEAT-010A rate-limit patterns; Human decisions P8-D04 and P8-D05.

## Ownership

AI endpoint/source/user counters, daily quota, reservation/settlement policy, Redis namespaces/TTL, multi-instance behavior, outage/recovery semantics, and safe quota responses.

## Out Of Scope

Permanent lockout, durable Redis business state, provider invocation, entitlement mutation, billing, payment, UI, and durable usage/audit tables.

## Migration Ownership

ZERO. Redis state is transient and TTL-bound; no PostgreSQL quota table is introduced.

## Prepared P8-D05 Proposal

Pending Human confirmation, the implementation contract is: preserve 5 initiated provider attempts/user/rolling 60 seconds, 50 initiated attempts/user/UTC calendar day, and two active provider attempts/user; add 60 authenticated structurally valid route attempts/server-derived source/rolling 60 seconds; and enforce one Human-supplied global daily USD ceiling using integer USD micro-units and a versioned provider/model price snapshot.

One atomic Redis reservation must check and acquire source, user minute/day, concurrency, and global cost controls before provider invocation. Auth/schema/pre-provider rejection consumes no user provider-attempt quota. Once provider invocation starts, timeout, cancellation, disconnect, and ambiguous completion consume the attempt and prohibit transparent retry. Missing trustworthy usage retains the conservative worst-case reservation. Pre-reservation Redis failure returns safe 503 with zero provider call; post-call settlement failure retains the reservation and uses TTL recovery. Exact key, TTL, settlement, and response semantics are defined in `docs/phase-8-feature-decomposition.md` section 12.3.

Detected restart/flush or missing current-day budget continuity cannot silently recreate a zero-spend day. The prepared default is fail-closed provider invocation until approved operator reconciliation/re-arm, pending Human choice among that policy, explicit transient-reset risk acceptance, or a separately approved durable ledger.

## Human Decision Lock

- P8-D04: APPROVED - all authenticated users may access Aura Intelligence subject to quotas; no premium gate.
- P8-D05: APPROVED WITH BLOCKER - the complete section-12.3 proposal is prepared, but Human must confirm the source threshold/window, UTC reset/accounting semantics, and a literal per-environment global daily USD ceiling.
- P8-D15: PENDING - production provider selection may change cost/token characteristics but cannot weaken these provider-independent controls.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-058 and BLOCKED from completion by the remaining P8-D05 parameters.
