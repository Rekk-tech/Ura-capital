# FEAT-062 Specification: Academy Learning Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Expose bounded published Academy and current-learner facts to Aura Intelligence without weakening content ownership, answer secrecy, progression, or reward authority.

## Architecture And Ownership

Academy read adapter, published-content projection, learner-progress/completion projection, safe completed-assessment summaries, provenance, budgets, and Academy-specific tests.

Proposed ownership: apps/api/src/modules/ai/context/academy/**, Academy adapter tests/fixtures, composition wiring, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Implement the Academy adapter through approved read contracts/repositories without direct Prisma use in AI controllers/services.

### FR-002

Return only published learner-visible Academy content and exclude drafts, removed/hidden content, and internal authoring fields.

### FR-003

Bind learner progress, completion, attempts, and earned outcomes to the authenticated current user.

### FR-004

Preserve quiz answer secrecy by excluding correct-answer data and explanatory answer keys before submission/grade authorization.

### FR-005

Expose only bounded safe completed-assessment summaries needed for approved educational intents.

### FR-006

Preserve server-authoritative progression, grading, XP, and reward facts without allowing model/client mutation or recalculation authority.

### FR-007

Attach stable safe provenance/citation identifiers that do not expose internal-only data.

### FR-008

Apply deterministic item/text/token budgets and safe empty/not-found/stale handling.

### FR-009

Treat Academy content as untrusted prompt data and prevent embedded instructions from overriding system policy.

### FR-010

Test published/draft boundaries, answer secrecy, user isolation, budget/provenance behavior, and full Phase 4 regression.

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

ZERO. Phase 4 retains Academy schema ownership.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Academy Bounds

After P8-D09 approval, Academy context must fit the exact section-12.4 item/adapter/aggregate ceilings before prompt assembly. Deterministic trimming may remove lower-priority facts but cannot expose drafts, answer keys, pre-submission answers, hidden content, or another learner's facts.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D08: APPROVED - Academy context is selected only through the closed intent/context-mode catalogs.
- P8-D09: APPROVED WITH BLOCKER - prepared bounds are not implementation-authorized yet.
- P8-D11: APPROVED WITH BLOCKER - published Academy/current-user allowlist is approved; production provider region/privacy conditions remain required.
- P8-D15: PENDING - Academy context remains provider-neutral and cannot select the production provider.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-061 and P8-D09 context-budget closure; non-synthetic/production provider use remains blocked by P8-D11 and P8-D15.
