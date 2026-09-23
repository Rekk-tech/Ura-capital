# FEAT-060 Specification: Prompt Registry, Intent Classification & Structured Contracts

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Define versioned server-owned prompts, a closed intent catalog, strict request/provider-output/public-response schemas, and deterministic contract evaluation.

## Architecture And Ownership

Prompt registry/versioning, intent catalog/classification contract, request schema, provider-output schema, public response/error DTOs, parser behavior, and contract fixtures.

Proposed ownership: apps/api/src/modules/ai/contracts/**, apps/api/src/modules/ai/prompts/**, shared AI schemas/types, fixtures/tests, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Define a Human-approved closed intent taxonomy with a deterministic unsupported/refusal outcome and no implementation-defined intent values.

### FR-002

Define a bounded versioned request schema that rejects unknown fields and authoritative client identity, role, entitlement, model, provider, prompt, and raw-context inputs.

### FR-003

Define strict versioned provider-independent structured-output and public-response schemas with bounded fields, safe citations, context disclosure, safety outcome, and no provider internals; the structured contract must be consumable through `LLMProvider`.

### FR-004

Create a server-owned immutable prompt registry with explicit prompt IDs/versions and deterministic lookup.

### FR-005

Separate system instructions, trusted server context, untrusted retrieved content, and user text during prompt assembly.

### FR-006

Prevent clients, retrieved documents, and provider output from overriding system instructions or selecting hidden prompt versions.

### FR-007

Validate the canonical provider-independent output strictly, reject unknown/malformed/oversized content, and never coerce provider-specific or malformed output into success.

### FR-008

Define safe error/refusal classifications for validation, unsupported intent, safety refusal, malformed output, and downstream unavailability.

### FR-009

Provide deterministic intent, prompt assembly, schema, hostile-input, and compatibility fixtures without logging raw sensitive content.

### FR-010

Publish one canonical shared client contract for FEAT-066 and later Phase 9 consumption, subject to FEAT-068 freeze.

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

ZERO. Prompts/contracts are code-versioned; no database persistence is introduced.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Public Contract

The candidate P8-D09 freeze is defined exactly in `docs/phase-8-feature-decomposition.md` section 12.4 and remains non-authorized until Human confirmation. FEAT-060 owns matching strict schemas for:

- request `{ message, contextMode? }`, including normalization, body/character/byte bounds, closed enum/default, and unknown/authority-field rejection;
- server context component/aggregate budgets and the P8-D03 total-input ceiling;
- the success envelope with closed intent/context/safety/disclaimer catalogs, bounded answer, opaque bounded citations, and user minute/day quota projection;
- HTTP 200 server-owned structured refusal without raw provider refusal;
- the exact 400/401/413/415/429/502/503/504/500 safe error code mapping;
- cancellation and quota accounting handoff without exposing source, concurrency, global budget, cost, Redis, prompt, model, or provider internals.

Parsing is strict: missing required fields, unknown fields, extra enum values, invalid mode/simulation combinations, malformed timestamps, oversized UTF-8/code-point values, unsafe citation identifiers, or provider-specific payloads fail rather than being repaired into success.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D02: APPROVED - non-streaming JSON v1.
- P8-D08: APPROVED - closed intent and context-mode catalogs from the master plan.
- P8-D10: APPROVED - educational/simulated assistance only with prohibited financial/action behavior.
- P8-D09: APPROVED WITH BLOCKER - section 12.4 contains the proposed exact freeze; Human confirmation remains mandatory.
- Implementation readiness: BLOCKED until P8-D09 contract closure and FEAT-058 dependency completion.
