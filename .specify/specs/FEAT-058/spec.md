# FEAT-058 Specification: Provider-Independent AI Gateway Foundation & Configuration

Status: APPROVED FOR IMPLEMENTATION
Phase: Phase 8 - Aura Intelligence

## Objective

Establish the Aura Intelligence module boundary, validated configuration, dependency contracts, and safe startup behavior without exposing assistant product behavior.

## Architecture And Ownership

AI module composition, configuration schema, provider-independent gateway ports, dependency injection, safe disabled/enabled startup behavior, and deterministic infrastructure test doubles.

Proposed ownership: apps/api/src/modules/ai/core/**, AI composition/configuration wiring, shared environment schema, .env.example, targeted tests, and the Phase 8 implementation report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Create one modular-monolith AI gateway module that is the only authorized entry boundary for future model-backed application behavior.

### FR-002

Validate explicit AI enablement, provider selection, Gemini development/test credentials, exact model identifier, API version, input/output token limits, timeout, and approved budget-related configuration at startup when AI is enabled; no secret, provider, model, or legacy fallback is allowed.

### FR-003

Define a narrow provider-independent `LLMProvider` port for response generation, structured output requests/results, normalized token usage, normalized errors, timeout/cancellation, plus separate context, retrieval, quota, clock, and telemetry ports; no provider SDK type may escape an adapter.

### FR-004

Permit deterministic fake infrastructure only in approved local, test, and CI modes; staging, production, production-like, unknown, or conflicting modes must fail closed.

### FR-005

Keep controllers and ordinary services free of Gemini SDK, Prisma delegate, raw SQL, and direct Redis-client dependencies.

### FR-006

Sanitize startup and dependency-resolution failures so secrets, URLs, credentials, hosts, ports, provider payloads, and sensitive absolute paths are not exposed.

### FR-007

Keep Gemini/provider credentials server-side and outside version control; prevent provider keys and AI secrets from entering committed files, responses, browser bundles, Redis keys, ordinary logs, implementation/QA reports, or test snapshots.

### FR-008

Introduce no assistant endpoint, provider call, business mutation, durable AI state, schema, migration, or Phase 9 UI behavior.

### FR-009

Provide dependency injection and deterministic test doubles that cannot be selected implicitly in production-like environments.

### FR-010

Add unit/static/configuration tests and run canonical regression sufficient to prove the boundary without claiming downstream AI behavior.

## Authority And Security

- Authenticated identity and authorization facts are server-derived.
- Client, retrieved, and model-supplied business facts are untrusted.
- PostgreSQL remains durable business authority; Redis and the model are never durable or authorization authorities.
- Raw prompts, responses, context, provider payloads, credentials, tokens, cookies, secrets, and sensitive paths are prohibited from ordinary diagnostics.
- Provider/model output cannot grant entitlement, place trades, grade work, mutate progress, or authorize any action.

## Failure Contract

Validation, dependency, timeout, unavailable, quota, malformed-output, and safety outcomes must be deterministic and sanitized. The implementation must never fabricate success, silently enable a fallback, or weaken an existing-domain failure policy.

## Environment Contract

Local/test/CI fakes require explicit approved predicates. Staging, production, production-like, unknown, and conflicting environments fail closed for fake or unsafe configuration. Secrets come only from validated server-side environment/secret-store configuration, remain outside version control, and have no hard-coded/default fallback; `.env.example` may contain variable names but never values.

Gemini is the only approved external development/test provider. Selection is explicit and single-provider; missing, unknown, conflicting, or multiple selections fail closed. Production provider activation is disabled until P8-D11 privacy conditions and P8-D15 Human provider selection are complete. No automatic provider/model fallback, provider registry, traffic splitting, or DeepSeek adapter is authorized.

## LLMProvider Contract

The internal port must accept a canonical generation request and return a canonical result independent of any SDK. It must support plain response generation, strict structured-output requests, normalized usage (`inputTokens`, `outputTokens`, `totalTokens` when supplied), a closed normalized error taxonomy, and deadline/cancellation propagation. Provider-specific request, response, safety, usage, and error types stay inside the selected adapter.

Conceptual v1 port (field bounds and public DTOs remain governed by P8-D09):

```ts
interface LLMProvider {
  generate(
    request: LLMGenerateRequest,
    execution: LLMExecutionContext,
  ): Promise<LLMProviderResult>;
}

type LLMOutputMode =
  | { kind: "TEXT" }
  | { kind: "STRUCTURED"; schemaId: string; schemaVersion: string };

type LLMExecutionContext = {
  timeoutMs: number;
  signal: AbortSignal;
};

type LLMTokenUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};
```

`LLMGenerateRequest` contains only canonical server-owned prompt/message parts, the output mode, and approved generation bounds. `LLMProviderResult` contains untrusted text or structured payload, normalized usage, configured provider/model/API identifiers for content-free evidence, and no SDK object. The closed internal error classes are `AUTHENTICATION`, `RATE_LIMITED`, `TIMEOUT`, `CANCELLED`, `UNAVAILABLE`, `REFUSED`, `MALFORMED_RESPONSE`, and `UNKNOWN`. FEAT-060 owns schema definitions and parsing; the provider adapter cannot declare malformed output successful.

## Data And Migration

ZERO. No Prisma schema or migration change is permitted.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D01: APPROVED - FEAT-058..068 are allocated and FEAT-069 is reserved.
- P8-D03: APPROVED FOR DEVELOPMENT ARCHITECTURE - Gemini is the development/test provider behind `LLMProvider` with pinned settings (`gemini-3.5-flash-lite`, `v1`, 4096 in, 1024 out, 15000 ms timeout, fallback DISABLED, retry DISABLED, production activation DISABLED). Live key access, project quota verification, and structured-output live smoke test are delegated to FEAT-059 prerequisites.
- P8-D11: APPROVED WITH BLOCKER - synthetic test data and the strict data allowlist apply now; provider region and privacy/retention/training/processing conditions remain required before non-synthetic or production provider traffic.
- P8-D15: PENDING - production provider selection requires versioned comparative evidence and explicit Human approval.
- Implementation readiness: APPROVED FOR IMPLEMENTATION. Production activation remains separately blocked by P8-D11 and P8-D15.
