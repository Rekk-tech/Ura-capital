# FEAT-068 Specification: Phase 8 Integration, Security & Phase 9 Handover Gate

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Independently validate integrated Aura Intelligence, freeze the safe Phase 9 client contract, and recommend Phase 8 PASS or FAIL without adding product behavior.

## Architecture And Ownership

Independent integration/security/evaluation evidence, regression, contract freeze, defect ownership, Phase 8 QA report, and Human-gate readiness recommendation.

Proposed ownership: reports/qa/phase-8/PHASE-8-QA.md, Phase 8 gate fixtures/scripts only when validation-only, and the frozen handover artifact; no application product source.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Remain validation-only and verify exact approved checkpoints, decision closure, clean integration source, and zero gate-added product/schema behavior.

### FR-002

Validate authentication, server-derived authority, access policy, user/context isolation, request/response schemas, and no client/model business authority.

### FR-003

Validate provider-independent `LLMProvider` conformance, Gemini development/test adapter isolation, server-side secrets, timeout/cancellation/retry/error behavior, malformed output handling, no DeepSeek implementation, no automatic fallback, and approved provider contract evidence.

### FR-004

Validate prompt/version integrity, intent behavior, injection resistance, RAG/citation safety, Academy answer secrecy, and Simulation ownership/disclosure.

### FR-005

Validate rate limits, daily quota, cost controls, concurrency, multi-instance behavior, Redis outage/recovery, namespace/TTL, and provider-call prevention.

### FR-006

Validate privacy-preserving observability, same-dataset provider-comparison readiness, evaluation thresholds, content-free diagnostics, product-audit decision, and FEAT-009 invariance.

### FR-007

Validate fresh migration history, current-schema compatibility, zero unauthorized Phase 8 migration, live PostgreSQL/Redis behavior, and all authoritative guards.

### FR-008

Run runtime end-to-end assistant flows, adversarial security flows, canonical validation, Phase 2-7 regression, and exact-source CI with zero mandatory skips.

### FR-009

Freeze and publish the Human-approved Phase 8 to Phase 9 request/response/error/cancellation/security contract for FEAT-078 and FEAT-080, including the rule that browser/client contracts remain provider-neutral and production traffic remains disabled until P8-D11/P8-D15 approval.

### FR-010

Classify defects by severity/owning feature and issue PASS or FAIL; PASS requires zero open P0/P1, truthful evidence, and Human Final Gate still pending.

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

ZERO. The gate validates migration history and confirms Phase 8 migration ownership; it introduces none.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Gate Matrix

The gate must reproduce, not reinterpret:

- section 12.3: all approved source/user/day/concurrency/global-cost thresholds, atomic reservation/settlement, timeout/cancellation, TTL, failure, isolation, and disclosure semantics;
- section 12.4: every request/context/response/citation bound, strict field/catalog rule, HTTP 200 refusal, non-200 code mapping, quota projection, cancellation behavior, and FEAT-078 handover rule; and
- section 12.5: approved dataset/corpus/judgment/scoring hashes, suite sizes/splits/strata, exact formulas/thresholds, live latency/cost evidence, skipped-evidence hard fail, and no automatic provider selection.

Human approval records for D05/D09/D12 are mandatory inputs. The gate cannot approve its own defaults.

## Test Strategy

Execute the approved unit, contract, security, boundary, integration, live PostgreSQL, live Redis, provider-contract, evaluation, and runtime suites. Add validation-only fixtures/scripts only when an approved requirement cannot be evidenced otherwise; they must not alter production behavior. Run canonical validation, authoritative guards, Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D01, D02, D04, D06, D07, D08, D10, D13, and D14: APPROVED.
- P8-D03, D05, D09, D11, and D12: APPROVED WITH BLOCKER; D05/D09/D12 proposal completion is not decision closure.
- P8-D15: PENDING - production provider selection remains a Human gate and does not authorize automatic routing/fallback.
- Gate readiness: BLOCKED until D03, D05, D09, and D12 implementation/gate inputs close and FEAT-058..067 are integrated. D11 must close for non-synthetic/production data; otherwise production stays disabled.
