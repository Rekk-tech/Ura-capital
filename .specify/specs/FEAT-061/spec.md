# FEAT-061 Specification: AI Context Resolver Core & Data Isolation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Build the read-only server-derived context envelope and adapter registry with strict ownership, field allowlists, provenance, and resource budgets.

## Architecture And Ownership

Context resolver, context modes, adapter ports/registry, server identity binding, budgets, field allowlists, provenance, failure policy, and read-only enforcement.

Proposed ownership: apps/api/src/modules/ai/context/core/**, context ports/registry/tests, approved composition wiring, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Define a canonical bounded context envelope with explicit source, provenance, simulation marker, freshness, and sensitivity classification.

### FR-002

Bind context resolution to the authenticated server-derived user and reject or ignore client-supplied identity, ownership, role, entitlement, and raw context.

### FR-003

Define narrow read-only adapter ports for approved domain contexts and a deterministic adapter registry keyed by approved context mode/intent.

### FR-004

Enforce per-source and total item/byte/token budgets before prompt assembly.

### FR-005

Allowlist every context field and prohibit secrets, credentials, auth/session data, hidden answer keys, provider IDs, and unrelated PII.

### FR-006

Preserve source provenance and clearly distinguish authoritative facts from derived display summaries and simulated facts.

### FR-007

Define deterministic required/optional adapter failure, timeout, stale-data, and partial-context behavior without fabricating facts.

### FR-008

Prevent cross-user reads and cache/key collisions through explicit user scoping and adversarial ownership tests.

### FR-009

Treat adapter text as untrusted data, delimit it from instructions, and prevent it from introducing executable model actions.

### FR-010

Keep AI controllers/services free of Prisma delegates and mutations; test resolver behavior and existing-domain regression.

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

ZERO. Context is assembled from existing authorities and is not persisted.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Aggregate Bounds

After P8-D09 approval, context composition must enforce the exact section-12.4 item, adapter, retrieval, aggregate byte/token, and complete-input ceilings before provider invocation. Deterministic omission follows server-owned priority/ranking; exceeding bounds cannot expand the provider budget or expose dropped content.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D07: APPROVED - requests are stateless with no durable conversation history.
- P8-D08: APPROVED - context modes are AUTO, ACADEMY, and SIMULATION.
- P8-D09: APPROVED WITH BLOCKER - prepared aggregate bounds are not authorized until Human confirmation.
- P8-D11: APPROVED WITH BLOCKER - strict context allowlist is approved; production provider region/privacy conditions remain required.
- P8-D15: PENDING - context contracts remain provider-neutral and cannot select the production provider.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-058 and P8-D09 context-budget closure; non-synthetic/production provider integration remains blocked by P8-D11 and P8-D15.
