# FEAT-060 Requirement: Prompt Registry, Intent Classification & Structured Contracts

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation

## Goal

Define versioned server-owned prompts, a closed intent catalog, strict request/provider-output/public-response schemas, and deterministic contract evaluation.

## Functional Requirements

- FR-001 Define a Human-approved closed intent taxonomy with a deterministic unsupported/refusal outcome and no implementation-defined intent values.
- FR-002 Define a bounded versioned request schema that rejects unknown fields and authoritative client identity, role, entitlement, model, provider, prompt, and raw-context inputs.
- FR-003 Define strict versioned provider-independent structured-output and public-response schemas with bounded fields, safe citations, context disclosure, safety outcome, and no provider internals; the structured contract must be consumable through `LLMProvider`.
- FR-004 Create a server-owned immutable prompt registry with explicit prompt IDs/versions and deterministic lookup.
- FR-005 Separate system instructions, trusted server context, untrusted retrieved content, and user text during prompt assembly.
- FR-006 Prevent clients, retrieved documents, and provider output from overriding system instructions or selecting hidden prompt versions.
- FR-007 Validate the canonical provider-independent output strictly, reject unknown/malformed/oversized content, and never coerce provider-specific or malformed output into success.
- FR-008 Define safe error/refusal classifications for validation, unsupported intent, safety refusal, malformed output, and downstream unavailability.
- FR-009 Provide deterministic intent, prompt assembly, schema, hostile-input, and compatibility fixtures without logging raw sensitive content.
- FR-010 Publish one canonical shared client contract for FEAT-066 and later Phase 9 consumption, subject to FEAT-068 freeze.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

FEAT-058 approved checkpoint; Human decisions P8-D02, P8-D08, P8-D09, and P8-D10.

## Ownership

Prompt registry/versioning, intent catalog/classification contract, request schema, provider-output schema, public response/error DTOs, parser behavior, and contract fixtures.

## Out Of Scope

Provider calls, domain context reads, RAG, public route orchestration, UI, durable prompt storage, and user-editable system prompts.

## Migration Ownership

ZERO. Prompts/contracts are code-versioned; no database persistence is introduced.

## Prepared P8-D09 Contract

Pending Human confirmation, the exact public v1 candidate is `POST /api/ai/assist` with strict JSON `{ message, contextMode? }`, unknown-field rejection, a 12 KiB body cap, a normalized 1..2,000-code-point/8-KiB message, and `contextMode` limited to `AUTO`, `ACADEMY`, or `SIMULATION`. The server derives identity and context; no client authority/provider/model/prompt/raw-context field exists.

The candidate success contract is the strict provider-neutral `data` envelope defined in `docs/phase-8-feature-decomposition.md` section 12.4: version/request ID, bounded answer, closed intent, context/simulation disclosure, 0..5 opaque citations, explicit safety/refusal/disclaimer state, and per-user minute/day quota metadata only. Safe policy refusal is HTTP 200 with server-owned text. Transport/dependency failures use the frozen safe error envelope and status/code table. Context, citation, answer, and total body bounds are part of the contract, not implementation choices.

## Human Decision Lock

- P8-D02: APPROVED - non-streaming JSON v1.
- P8-D08: APPROVED - closed intent and context-mode catalogs from the master plan.
- P8-D10: APPROVED - educational/simulated assistance only with prohibited financial/action behavior.
- P8-D09: APPROVED WITH BLOCKER - the complete section-12.4 candidate DTO/bounds/refusal/error/citation/quota contract is prepared and awaits explicit Human confirmation.
- Implementation readiness: BLOCKED until P8-D09 contract closure and FEAT-058 dependency completion.
