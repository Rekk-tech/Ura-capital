# FEAT-067 Specification: AI Observability & Provider Evaluation Harness

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Objective

Provide privacy-preserving operational telemetry and deterministic quality/safety evaluation with Human-approved release thresholds.

## Architecture And Ownership

Correlation, bounded operational metrics, token/cost estimation, prompt/model/intent/outcome labels, redacted diagnostics, evaluation corpus/runner, thresholds, and evidence format.

Proposed ownership: apps/api/src/modules/ai/observability/**, AI evaluation fixtures/runner/tests, safe metrics/logging integration, and the feature report.

The feature preserves the modular monolith, controller -> service/orchestrator -> port/adapter direction, FEAT-013 repository boundaries, FEAT-014 constraint governance, FEAT-015 Redis authority, FEAT-016 product-audit governance, and ADR-006 AI gateway boundary.

## Functional Contract

### FR-001

Correlate each AI request with approved request/trace identifiers without logging raw user text, response text, full context, or sensitive identity.

### FR-002

Record bounded operational fields for route outcome, intent, prompt version, configured provider/model/API version, latency, provider status class, normalized token usage, and estimated cost.

### FR-003

Use allowlisted bounded-cardinality metric labels and prohibit raw user IDs, emails, IPs, prompts, citations, provider payloads, and arbitrary errors as labels.

### FR-004

Sanitize all AI diagnostics using approved error/logging controls and prevent secrets, URLs, credentials, tokens, cookies, paths, and context fragments from leaking.

### FR-005

Define one deterministic versioned evaluation dataset and fixtures for Vietnamese response quality, retrieval/citation grounding, intent, structured output, safety/refusal, prompt injection, answer secrecy, Simulation disclosure, and cross-user isolation that can be replayed against candidate providers.

### FR-006

Measure Human-approved release thresholds and provider-comparison dimensions for quality, grounding, schema reliability, latency, token consumption, cost, privacy, and availability without inventing or silently lowering them.

### FR-007

Make evaluation/provider fakes explicit and isolated; production behavior cannot select fixtures/fakes or pass because mandatory live/contract evidence was skipped.

### FR-008

Keep operational observability distinct from durable product audit and preserve FEAT-009 AuthSecurityAuditRecord semantics.

### FR-009

Ensure telemetry/evaluation cannot affect authorization, entitlement, grading, progress, trading, provider selection, or response success.

### FR-010

Provide reproducible reports and regression tests that identify provider/model/API/prompt/dataset/fixture/threshold versions and exact source without storing prohibited content; evidence informs but never performs production-provider selection.

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

ZERO under approved telemetry-only P8-D13. Durable AI product audit is deferred and requires separate Human activation and schema governance.

No existing domain schema or authority may be changed by this feature. Any discovered need outside this rule stops implementation for Human review.

## Prepared Evaluation Harness

The candidate harness contract is normative in section 12.5 after Human approval. Manifests and results are immutable/versioned, development and sealed-gate splits cannot overlap, and the same ordered sealed set/configuration is used across provider candidates. Missing cases, changed gold labels without a new version, skipped live evidence, schema repair/coercion, or absent exact-source metadata fails the applicable gate.

Automated checks own structure, closed catalogs, citations, leakage, and reproducible metrics. Human gold labels own relevance and response-quality judgments. The proposed additional release thresholds are mean >=4.0 for each Vietnamese response-quality dimension with no critical case below 3, p95 <=10 seconds, and timeout rate <=1%; these remain pending Human confirmation. Cost is measured but has no release ceiling until P8-D05 supplies a literal Human budget.

## Test Strategy

Implement focused unit, contract, security, boundary, and integration tests appropriate to each requirement. Use live PostgreSQL/Redis only where the feature touches those authorities. Run canonical validation, authoritative guards, relevant Phase 2-7 regressions, and exact-source CI with zero mandatory skips.

## Quality Gate

All FRs and ACs pass; no P0/P1 remains; migration scope is respected; diagnostics are safe; implementation evidence is truthful; and no dependent feature advances before its approved checkpoint.

## Human Decision Lock

- P8-D10 and P8-D13: APPROVED.
- P8-D03, P8-D05, P8-D11, and P8-D12: APPROVED WITH BLOCKER; prepared D05/D12 defaults remain pending Human confirmation.
- P8-D15: PENDING - production provider selection requires Human review of same-dataset comparative evidence.
- Implementation readiness: DEPENDENCY BLOCKED and BLOCKED until model/runtime, remaining quota/cost, and Vietnamese corpus/scoring inputs close. Production activation additionally requires P8-D11 and P8-D15.
