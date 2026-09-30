# FEAT-064 Requirement: Academy Retrieval / RAG Foundation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation

## Goal

Retrieve bounded relevant evidence from approved published Academy content and provide injection-resistant provenance/citations without introducing speculative vector infrastructure.

## Functional Requirements

- FR-001 Define the retrieval corpus as approved published learner-visible Academy content only, with explicit exclusions for drafts, hidden/removed content, answer keys, and internal fields.
- FR-002 Implement one retrieval port and the approved deterministic PostgreSQL-backed lexical strategy over approved Academy read boundaries.
- FR-003 Normalize and bound retrieval queries without trusting user text as SQL, Prisma structure, provider configuration, or system instruction.
- FR-004 Return a bounded top-k evidence set with stable safe citation identifiers, source type, title/label, and freshness/version provenance.
- FR-005 Frame all retrieved text as untrusted evidence that cannot override instructions, authorize actions, or alter context/security policy.
- FR-006 Enforce per-document and aggregate byte/token/result budgets before prompt assembly.
- FR-007 Handle empty, stale, removed, malformed, and unavailable corpus results deterministically without fabricating evidence or citations.
- FR-008 Preserve current-user isolation for any learner-specific retrieval and prevent cross-user or draft-content leakage.
- FR-009 Introduce no external vector database, embedding service, new table, migration, or provider file-store dependency in Phase 8.
- FR-010 Evaluate relevance, citation integrity, injection resistance, answer secrecy, deterministic ranking, live PostgreSQL behavior, and Phase 4 regression.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

FEAT-060, FEAT-061, and FEAT-062 approved checkpoints; Human decisions P8-D06 and P8-D12.

## Ownership

Corpus eligibility, retrieval port, query normalization, deterministic ranking, result budgets, safe citations/provenance, document framing, and retrieval evaluation.

## Out Of Scope

Draft/hidden content, correct answers, Community content, external web search, provider-managed file stores, UI, content mutation, and all vector/embedding infrastructure.

## Migration Ownership

ZERO under the approved PostgreSQL lexical design. Vector/embedding persistence is not approved for Phase 8.

## Prepared P8-D12 Retrieval Evaluation

Pending Human confirmation, retrieval uses the versioned methodology in `docs/phase-8-feature-decomposition.md` section 12.5: 200 queries (160 answerable, 40 no-evidence), a stratified 70/30 development/sealed-gate split, Vietnamese variants at 60% accented/20% unaccented/10% typo-noisy/10% mixed, and an immutable published-content corpus manifest. Relevance grades are 0..3, grades 2/3 count as relevant, two independent Human annotators label every item, and material disagreement requires a third adjudicator. Recall@5 and MRR@5 use the exact formulas and approved 0.90/0.80 thresholds; no-evidence accuracy is reported separately.

## Human Decision Lock

- P8-D06: APPROVED - PostgreSQL-backed lexical retrieval, no vector persistence, and zero migration.
- P8-D11: APPROVED WITH BLOCKER - published-content allowlist is approved; production provider region/privacy conditions remain required.
- P8-D12: APPROVED WITH BLOCKER - the section-12.5 methodology is prepared, but Human must confirm it and later approve the concrete corpus/judgment/scoring manifests.
- P8-D15: PENDING - retrieval evidence remains provider-neutral and contributes to, but cannot decide, production provider selection.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-060/061/062; final gate evidence is blocked by P8-D12 and production use remains blocked by P8-D11/P8-D15.
