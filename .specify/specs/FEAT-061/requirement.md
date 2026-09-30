# FEAT-061 Requirement: AI Context Resolver Core & Data Isolation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation

## Goal

Build the read-only server-derived context envelope and adapter registry with strict ownership, field allowlists, provenance, and resource budgets.

## Functional Requirements

- FR-001 Define a canonical bounded context envelope with explicit source, provenance, simulation marker, freshness, and sensitivity classification.
- FR-002 Bind context resolution to the authenticated server-derived user and reject or ignore client-supplied identity, ownership, role, entitlement, and raw context.
- FR-003 Define narrow read-only adapter ports for approved domain contexts and a deterministic adapter registry keyed by approved context mode/intent.
- FR-004 Enforce per-source and total item/byte/token budgets before prompt assembly.
- FR-005 Allowlist every context field and prohibit secrets, credentials, auth/session data, hidden answer keys, provider IDs, and unrelated PII.
- FR-006 Preserve source provenance and clearly distinguish authoritative facts from derived display summaries and simulated facts.
- FR-007 Define deterministic required/optional adapter failure, timeout, stale-data, and partial-context behavior without fabricating facts.
- FR-008 Prevent cross-user reads and cache/key collisions through explicit user scoping and adversarial ownership tests.
- FR-009 Treat adapter text as untrusted data, delimit it from instructions, and prevent it from introducing executable model actions.
- FR-010 Keep AI controllers/services free of Prisma delegates and mutations; test resolver behavior and existing-domain regression.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

FEAT-058 approved checkpoint; approved FEAT-060 context-mode vocabulary where needed; Human decision P8-D09 for shared context bounds.

## Ownership

Context resolver, context modes, adapter ports/registry, server identity binding, budgets, field allowlists, provenance, failure policy, and read-only enforcement.

## Out Of Scope

Concrete Academy/Simulation mapping, Community context, provider calls, retrieval ranking, mutations, direct Prisma access, and durable context storage.

## Migration Ownership

ZERO. Context is assembled from existing authorities and is not persisted.

## Prepared P8-D09 Context Budget

Pending Human confirmation, each context/evidence item is capped at 2 KiB UTF-8, each adapter at 8 KiB, retrieval at five items/8 KiB, and all context plus retrieval at 16 KiB and 4,096 estimated tokens. The complete provider request must remain within the P8-D03 input budget. These are shared aggregate ceilings; adapters may define stricter item/time limits but may not exceed them.

## Human Decision Lock

- P8-D07: APPROVED - requests are stateless with no durable conversation history.
- P8-D08: APPROVED - context modes are AUTO, ACADEMY, and SIMULATION.
- P8-D09: APPROVED WITH BLOCKER - section-12.4 context budgets await Human confirmation.
- P8-D11: APPROVED WITH BLOCKER - strict context allowlist is approved; production provider region/privacy conditions remain required.
- P8-D15: PENDING - no context adapter may assume Gemini or another provider is the selected production destination.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-058 and the P8-D09 context-budget confirmation; non-synthetic/production provider integration remains blocked by P8-D11 and P8-D15.
