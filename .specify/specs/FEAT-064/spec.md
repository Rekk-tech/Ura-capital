# FEAT-064 Specification: Academy Retrieval / RAG Foundation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Retrieve bounded relevant evidence from approved published Academy content and provide injection-resistant provenance/citations without introducing speculative vector infrastructure.

## Architecture And Ownership

Corpus eligibility, retrieval port, query normalization, deterministic ranking, result budgets, safe citations/provenance, document framing, and retrieval evaluation.

Proposed ownership: apps/api/src/modules/ai/retrieval/**, Academy retrieval adapter/evaluation fixtures/tests, composition wiring, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Define the retrieval corpus as approved published learner-visible Academy content only, with explicit exclusions for drafts, hidden/removed content, answer keys, and internal fields.

### FR-002

Implement one retrieval port and the approved deterministic PostgreSQL-backed lexical strategy over approved Academy read boundaries.

### FR-003

Normalize and bound retrieval queries without trusting user text as SQL, Prisma structure, provider configuration, or system instruction.

### FR-004

Return a bounded top-k evidence set with stable safe citation identifiers, source type, title/label, and freshness/version provenance.

### FR-005

Frame all retrieved text as untrusted evidence that cannot override instructions, authorize actions, or alter context/security policy.

### FR-006

Enforce per-document and aggregate byte/token/result budgets before prompt assembly.

### FR-007

Handle empty, stale, removed, malformed, and unavailable corpus results deterministically without fabricating evidence or citations.

### FR-008

Preserve current-user isolation for any learner-specific retrieval and prevent cross-user or draft-content leakage.

### FR-009

Introduce no external vector database, embedding service, new table, migration, or provider file-store dependency in Phase 8.

### FR-010

Evaluate relevance, citation integrity, injection resistance, answer secrecy, deterministic ranking, live PostgreSQL behavior, and Phase 4 regression.

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

ZERO under the approved PostgreSQL lexical design. Vector/embedding persistence is not approved for Phase 8.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Retrieval Benchmark

After Human approval, FEAT-064 must use section 12.5 without changing sample composition or metric definitions. The corpus manifest contains only eligible published learner-visible Academy records with source version/hash and excludes drafts, hidden/removed content, correct answers, pre-submission answer data, and internal fields. Original citation text is preserved while ranking compares NFKC/lowercase/whitespace-normalized accented and unaccented forms.

The sealed gate is immutable for a dataset version. Recall@5 is macro-averaged relevant-document recall over answerable queries; MRR@5 is macro-averaged reciprocal first-relevant rank with zero when absent. No-evidence accuracy, deterministic tie-breaking, citation validity/authorization, injection safety, and answer secrecy are separate mandatory outputs. Missing or skipped fixtures cannot produce PASS.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D06: APPROVED - PostgreSQL-backed lexical retrieval, no vector persistence, and zero migration.
- P8-D11: APPROVED WITH BLOCKER - published-content allowlist is approved; production provider region/privacy conditions remain required.
- P8-D12: APPROVED WITH BLOCKER - the candidate benchmark is complete but not implementation-authorized before Human confirmation.
- P8-D15: PENDING - retrieval evidence remains provider-neutral and contributes to, but cannot decide, production provider selection.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-060/061/062; final gate evidence is blocked by P8-D12 and production use remains blocked by P8-D11/P8-D15.
