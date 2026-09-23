# FEAT-066 Requirement: Aura Intelligence Orchestration API & Safety Guardrails

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation

## Goal

Expose the authenticated assistant API by composing approved provider, contract, context, retrieval, quota, and safety boundaries without granting model action authority.

## Functional Requirements

- FR-001 Expose only the Human-approved authenticated Aura Intelligence route and strict request contract; unauthenticated requests fail before context, quota identity, or provider work.
- FR-002 Derive user identity, authorization, access policy, and all context server-side; reject client role, entitlement, user, model, prompt, and raw-context authority.
- FR-003 Execute validation, quota reservation, intent classification, context resolution, retrieval, prompt assembly, provider-independent `LLMProvider` invocation, output validation, and guardrails in deterministic order; orchestration must not import or select a concrete provider adapter.
- FR-004 Apply the approved financial-safety matrix, refuse prohibited guarantees/personalized real-world execution, and preserve educational/simulation framing.
- FR-005 Ensure Simulation-derived responses contain the approved explicit simulation disclosure and cannot be presented as real brokerage/market authority.
- FR-006 Return only the strict versioned safe response/error envelope, bounded citations, and approved non-sensitive quota metadata.
- FR-007 Never expose malformed/unvalidated provider output, automatically fall back to another provider/model, or fabricate an answer on timeout, cancellation, unavailable, refusal, or dependency failure.
- FR-008 Prohibit model tools/actions and all mutation of trades, orders, grades, progress, XP, rewards, roles, subscriptions, entitlements, or durable context.
- FR-009 Keep raw prompts/responses/context/provider payloads/secrets out of logs and sanitize all runtime errors and diagnostics.
- FR-010 Test valid flows and adversarial auth, IDOR, prompt injection, context spoofing, quota, provider-neutral invocation, no-fallback provider failure, malformed output, refusal, no-action, and Phase 2-7 regression.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

Approved integrated checkpoints for FEAT-059 through FEAT-065; Human decisions P8-D02, P8-D04, P8-D05, P8-D08, P8-D09, P8-D10, and P8-D11.

## Ownership

Authenticated AI route, request orchestration, quota-before-provider flow, intent/context/retrieval composition, safety/refusal policy, structured response, simulation disclosure, and runtime tests.

## Out Of Scope

Phase 9 UI, streaming unless approved, durable history, tools/actions, trade/progress/grading/subscription mutation, Community context, and product-audit table.

## Migration Ownership

ZERO. The API is stateless under the approved P8-D07 decision.

## Prepared P8-D09 Orchestration Contract

Pending Human confirmation, FEAT-066 exposes only `POST /api/ai/assist` using the exact request/success/refusal/error/citation/quota contract and component bounds in `docs/phase-8-feature-decomposition.md` section 12.4. The controller accepts no client identity, provider, model, system prompt, raw context, record IDs, or authoritative business facts. It returns no provider internals, raw context, source/global/concurrency/cost controls, or hidden diagnostics.

Safe unsupported/policy refusal is an HTTP 200 domain outcome with server-owned text. Validation, authentication, size/media, rate/quota, malformed-provider, dependency, timeout, and unexpected failures use only the frozen status/code combinations. Client cancellation does not trigger another provider call and an already initiated call remains accounted under P8-D05.

## Human Decision Lock

- P8-D02, P8-D04, P8-D08, and P8-D10: APPROVED.
- P8-D03, P8-D05, P8-D09, and P8-D11: APPROVED WITH BLOCKER. D05 and D09 now have complete proposals in sections 12.3/12.4 but still require Human confirmation.
- P8-D15: PENDING - production provider selection is not orchestration authority and must not be embedded in this feature.
- Implementation readiness: DEPENDENCY BLOCKED and additionally BLOCKED until runtime, remaining quota/cost, and exact API contract inputs close. Real-data/production activation remains blocked by P8-D11 and P8-D15.
