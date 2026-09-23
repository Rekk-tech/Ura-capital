# FEAT-067 Requirement: AI Observability & Provider Evaluation Harness

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence
Type: Implementation and validation support

## Goal

Provide privacy-preserving operational telemetry and deterministic quality/safety evaluation with Human-approved release thresholds.

## Functional Requirements

- FR-001 Correlate each AI request with approved request/trace identifiers without logging raw user text, response text, full context, or sensitive identity.
- FR-002 Record bounded operational fields for route outcome, intent, prompt version, configured provider/model/API version, latency, provider status class, normalized token usage, and estimated cost.
- FR-003 Use allowlisted bounded-cardinality metric labels and prohibit raw user IDs, emails, IPs, prompts, citations, provider payloads, and arbitrary errors as labels.
- FR-004 Sanitize all AI diagnostics using approved error/logging controls and prevent secrets, URLs, credentials, tokens, cookies, paths, and context fragments from leaking.
- FR-005 Define one deterministic versioned evaluation dataset and fixtures for Vietnamese response quality, retrieval/citation grounding, intent, structured output, safety/refusal, prompt injection, answer secrecy, Simulation disclosure, and cross-user isolation that can be replayed against candidate providers.
- FR-006 Measure Human-approved release thresholds and provider-comparison dimensions for quality, grounding, schema reliability, latency, token consumption, cost, privacy, and availability without inventing or silently lowering them.
- FR-007 Make evaluation/provider fakes explicit and isolated; production behavior cannot select fixtures/fakes or pass because mandatory live/contract evidence was skipped.
- FR-008 Keep operational observability distinct from durable product audit and preserve FEAT-009 AuthSecurityAuditRecord semantics.
- FR-009 Ensure telemetry/evaluation cannot affect authorization, entitlement, grading, progress, trading, provider selection, or response success.
- FR-010 Provide reproducible reports and regression tests that identify provider/model/API/prompt/dataset/fixture/threshold versions and exact source without storing prohibited content; evidence informs but never performs production-provider selection.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

FEAT-058 and FEAT-060 for foundation; FEAT-066 for integrated completion; Human decisions P8-D10, P8-D11, P8-D12, P8-D13, and the pending production selection P8-D15.

## Ownership

Correlation, bounded operational metrics, token/cost estimation, prompt/model/intent/outcome labels, redacted diagnostics, evaluation corpus/runner, thresholds, and evidence format.

## Out Of Scope

Raw conversation analytics, public/admin dashboards, durable product-audit tables, provider authority, automatic provider routing/fallback, production-provider selection, business mutation, and Phase 9 UI analytics.

## Migration Ownership

ZERO under approved telemetry-only P8-D13. Durable AI product audit is deferred and requires separate Human activation and schema governance.

## Prepared P8-D12 Evaluation Contract

Pending Human confirmation, FEAT-067 uses the section-12.5 versioned methodology: 250 balanced intent cases, 200 retrieval queries, 120 answer/citation cases, 60 injection fixtures, 120 strict-output cases, and 100 measured synthetic provider calls per candidate after 10 excluded warm-ups. It records exact source/provider/model/API/prompt/contract/dataset/judgment/scoring/threshold/pricing versions and reports deterministic macro-F1, Recall@5, MRR@5, no-evidence accuracy, citation validity/grounding, strict schema validity, critical safety pass rate, Vietnamese quality rubric, p50/p95/p99 latency, timeout rate, token usage, and USD micro-unit cost.

Gold labels require two independent Human annotators and third-party adjudication for material disagreement. LLM-as-judge evidence is advisory only. Until P8-D11 closes, provider-bound data is synthetic. Candidate scores never select a production provider.

## Human Decision Lock

- P8-D10 and P8-D13: APPROVED.
- P8-D03, P8-D05, P8-D11, and P8-D12: APPROVED WITH BLOCKER. D05/D12 technical proposals are complete but retain their listed Human decisions.
- P8-D15: PENDING - the Human selects the production provider after reviewing same-dataset comparative evidence.
- Implementation readiness: DEPENDENCY BLOCKED and BLOCKED until model/runtime, remaining quota/cost, and Vietnamese corpus/scoring inputs close. Production activation additionally requires P8-D11 and P8-D15.
