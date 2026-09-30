# FEAT-059 Specification: Gemini Development Adapter & Failure Isolation

Status: DEPENDENCY BLOCKED BY FEAT-058
Phase: Phase 8 - Aura Intelligence

## Objective

Implement Gemini as the isolated initial development/test adapter behind the provider-independent `LLMProvider` boundary, with safe timeout, cancellation, error normalization, usage capture, and deterministic testing.

## Architecture And Ownership

Gemini SDK containment, canonical invocation mapping, configured model selection, timeout/cancellation, bounded retry policy, provider error normalization, usage extraction, and provider contract tests.

Proposed ownership: apps/api/src/modules/ai/infrastructure/gemini/**, provider fixtures/tests, provider package manifest and lockfile changes, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Implement Gemini as the initial development/test provider behind the FEAT-058 `LLMProvider` port without exposing Gemini SDK types or making Gemini the permanent production contract.

### FR-002

Confine all Gemini SDK imports and provider request/response mapping to the approved adapter infrastructure.

### FR-003

Use only Human-approved environment configuration for the exact Gemini model ID, API version, input/output token limits, timeout, endpoint, credentials, and safety settings; client input cannot choose or override them.

### FR-004

Apply deterministic timeout and cancellation behavior and stop downstream success processing after cancellation or timeout.

### FR-005

Allow only explicitly approved bounded retries for safe pre-response failures and never blindly retry an ambiguous potentially billable success.

### FR-006

Normalize authentication, quota, timeout, unavailable, refusal, malformed, and unknown provider failures into safe internal error classes.

### FR-007

Extract bounded usage metadata needed for later telemetry without returning provider internals or hidden prompts to clients.

### FR-008

Keep raw provider payloads, credentials, request content, response content, URLs, and diagnostics out of ordinary logs and errors.

### FR-009

Provide a deterministic fake provider for tests that is explicit and impossible to activate in staging/production-like/unknown environments.

### FR-010

Test success, structured output, normalized usage, malformed output, timeout, cancellation, refusal, provider errors, retry boundaries, sanitization, SDK-import containment, no DeepSeek adapter, and no automatic provider fallback.

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

Gemini external calls are approved only for development/test evaluation using synthetic data until P8-D11 is closed. Production provider selection and activation require P8-D15 Human approval. The factory selects one explicit adapter; it contains no fallback chain, provider router, traffic split, or DeepSeek implementation.

## Data And Migration

ZERO. No schema or migration change is permitted.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D03: APPROVED FOR DEVELOPMENT ARCHITECTURE - Gemini is the development/test adapter with pinned settings (`gemini-3.5-flash-lite`, `v1`, 4096 in, 1024 out, 15000 ms timeout, fallback DISABLED, retry DISABLED). Live credential access, project quota verification, and structured-output live smoke testing are prerequisites for FEAT-059.
- P8-D11: APPROVED WITH BLOCKER - synthetic-only contract tests apply until real-data and production privacy conditions are approved.
- P8-D15: PENDING - production provider selection is outside this feature and requires Human approval after comparative evaluation.
- Implementation readiness: DEPENDENCY BLOCKED BY FEAT-058. Production activation remains blocked by P8-D11 and P8-D15.
