# FEAT-062 Requirement: Academy Learning Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation

## Goal

Expose bounded published Academy and current-learner facts to Aura Intelligence without weakening content ownership, answer secrecy, progression, or reward authority.

## Functional Requirements

- FR-001 Implement the Academy adapter through approved read contracts/repositories without direct Prisma use in AI controllers/services.
- FR-002 Return only published learner-visible Academy content and exclude drafts, removed/hidden content, and internal authoring fields.
- FR-003 Bind learner progress, completion, attempts, and earned outcomes to the authenticated current user.
- FR-004 Preserve quiz answer secrecy by excluding correct-answer data and explanatory answer keys before submission/grade authorization.
- FR-005 Expose only bounded safe completed-assessment summaries needed for approved educational intents.
- FR-006 Preserve server-authoritative progression, grading, XP, and reward facts without allowing model/client mutation or recalculation authority.
- FR-007 Attach stable safe provenance/citation identifiers that do not expose internal-only data.
- FR-008 Apply deterministic item/text/token budgets and safe empty/not-found/stale handling.
- FR-009 Treat Academy content as untrusted prompt data and prevent embedded instructions from overriding system policy.
- FR-010 Test published/draft boundaries, answer secrecy, user isolation, budget/provenance behavior, and full Phase 4 regression.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

FEAT-061 approved checkpoint; Phase 4 approved contracts/checkpoint; FEAT-060 intent/context vocabulary; Human decision P8-D09 for shared context bounds.

## Ownership

Academy read adapter, published-content projection, learner-progress/completion projection, safe completed-assessment summaries, provenance, budgets, and Academy-specific tests.

## Out Of Scope

Academy schema/migrations, draft authoring, grading, progression/reward mutation, pre-submission answers, UI, RAG ranking, and durable AI storage.

## Migration Ownership

ZERO. Phase 4 retains Academy schema ownership.

## Prepared P8-D09 Academy Budget

Pending Human confirmation, Academy projections obey section 12.4: each item at most 2 KiB UTF-8, the Academy adapter at most 8 KiB, and the shared 16 KiB/4,096-token aggregate context ceiling. Stricter answer-secrecy and per-type limits remain mandatory.

## Human Decision Lock

- P8-D08: APPROVED - Academy context is selected only through the closed intent/context-mode catalogs.
- P8-D09: APPROVED WITH BLOCKER - section-12.4 bounds await Human confirmation.
- P8-D11: APPROVED WITH BLOCKER - published Academy/current-user allowlist is approved; production provider region/privacy conditions remain required.
- P8-D15: PENDING - Academy context remains provider-neutral and cannot select the production provider.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-061 and P8-D09 context-budget closure; non-synthetic/production provider use remains blocked by P8-D11 and P8-D15.
