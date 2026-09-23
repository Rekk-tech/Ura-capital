# FEAT-066 Specification: Aura Intelligence Orchestration API & Safety Guardrails

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Expose the authenticated assistant API by composing approved provider, contract, context, retrieval, quota, and safety boundaries without granting model action authority.

## Architecture And Ownership

Authenticated AI route, request orchestration, quota-before-provider flow, intent/context/retrieval composition, safety/refusal policy, structured response, simulation disclosure, and runtime tests.

Proposed ownership: apps/api/src/modules/ai/http/**, orchestration service, safety policies, AI router/server composition, runtime/API/security tests, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Expose only the Human-approved authenticated Aura Intelligence route and strict request contract; unauthenticated requests fail before context, quota identity, or provider work.

### FR-002

Derive user identity, authorization, access policy, and all context server-side; reject client role, entitlement, user, model, prompt, and raw-context authority.

### FR-003

Execute validation, quota reservation, intent classification, context resolution, retrieval, prompt assembly, provider-independent `LLMProvider` invocation, output validation, and guardrails in deterministic order; orchestration must not import or select a concrete provider adapter.

### FR-004

Apply the approved financial-safety matrix, refuse prohibited guarantees/personalized real-world execution, and preserve educational/simulation framing.

### FR-005

Ensure Simulation-derived responses contain the approved explicit simulation disclosure and cannot be presented as real brokerage/market authority.

### FR-006

Return only the strict versioned safe response/error envelope, bounded citations, and approved non-sensitive quota metadata.

### FR-007

Never expose malformed/unvalidated provider output, automatically fall back to another provider/model, or fabricate an answer on timeout, cancellation, unavailable, refusal, or dependency failure.

### FR-008

Prohibit model tools/actions and all mutation of trades, orders, grades, progress, XP, rewards, roles, subscriptions, entitlements, or durable context.

### FR-009

Keep raw prompts/responses/context/provider payloads/secrets out of logs and sanitize all runtime errors and diagnostics.

### FR-010

Test valid flows and adversarial auth, IDOR, prompt injection, context spoofing, quota, provider-neutral invocation, no-fallback provider failure, malformed output, refusal, no-action, and Phase 2-7 regression.

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

ZERO. The API is stateless under the approved P8-D07 decision.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Route And Envelope

After Human approval, orchestration must implement section 12.4 literally rather than inventing route aliases, fields, bounds, errors, or refusal semantics. Pipeline order remains authentication -> strict request validation -> quota reservation -> intent/context/retrieval/prompt -> one provider-independent call -> strict output validation -> deterministic guardrails -> bounded public projection.

The quota projection contains only user minute/day values from the successful atomic reservation. A pre-provider rejection makes no provider attempt. A provider-initiated timeout/cancellation remains charged according to section 12.3. Global cost exhaustion and internal dependency detail map to the same safe unavailable contract and cannot expose provider cost or service state.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D02, P8-D04, P8-D08, and P8-D10: APPROVED.
- P8-D03, P8-D05, P8-D09, and P8-D11: APPROVED WITH BLOCKER; prepared D05/D09 values are not authorized until Human confirmation.
- P8-D15: PENDING - production provider selection remains outside orchestration and requires later Human approval.
- Implementation readiness: DEPENDENCY BLOCKED and additionally BLOCKED until runtime, remaining quota/cost, and exact API contract inputs close. Real-data/production activation remains blocked by P8-D11 and P8-D15.
