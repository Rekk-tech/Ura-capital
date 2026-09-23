# Phase 8 Master Planning Report: Aura Intelligence

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED
Planning Owner: Codex
Future Implementation Owner: Antigravity
Final Approval Authority: Human
Planning Branch: `planning/phase-8-master`
Planning Worktree: `.tmp/phase8-planning`
Baseline: `phase-7-approved` / `c490b3f956fa593a40edf389f8e7a9c5fa9c19c1`
Phase 8 Implementation: NOT STARTED
Phase 9 Implementation: NOT STARTED

## Baseline Verification

The local annotated tag and remote `phase-7-approved` tag both resolve to tag object `0324bbbcc5804a6b1cc82cf9567b61d408a83e04` and peel to the expected approved commit `c490b3f956fa593a40edf389f8e7a9c5fa9c19c1`. Planning occurs in an isolated worktree and does not use the Phase 9 planning branch.

## Planning Conclusion

The approved roadmap supports a server-side, authenticated, context-aware learning assistant through a provider-independent ADR-006 gateway boundary. Gemini is the initial development/test provider through an isolated adapter, not a permanent production commitment. The repository already supplies the required authentication, PostgreSQL read authorities, Redis transient-state infrastructure, repository/UoW boundaries, logging sanitization, configuration validation, rate-limit patterns, and domain read services. It does not contain an AI module, provider SDK, AI persistence, prompt registry, RAG implementation, or AI route.

The Human-approved Phase 8 plan contains eleven features, FEAT-058 through FEAT-068. FEAT-069 remains reserved but unallocated. The decomposition separates infrastructure, provider isolation, contracts/prompts, context, domain adapters, retrieval, abuse/cost control, orchestration/safety, observability/evaluation, and the independent final gate. Approval is conditional because essential production parameters remain unresolved.

## Actual Scope

Approved scope from existing governance:

- provider-independent internal AI gateway and Gemini initial development/test adapter;
- authenticated server-side requests;
- intent classification, context construction, prompt/version control, structured validation, guardrails, quotas, rate limiting, and observability;
- Academy learning and Simulation/portfolio context through read-only server boundaries;
- RAG as a roadmap capability;
- explicit educational/simulation framing and no guaranteed investment advice.

Human-approved planning direction:

- non-streaming `POST /api/ai/assist`;
- stateless requests with no durable chat history;
- published Academy lexical retrieval with citations, Vietnamese normalization requirements, and zero migration;
- authenticated quota access without a Phase 8 premium gate;
- 5 requests/user/minute, 50 requests/user/day, and 2 concurrent requests/user;
- educational/simulated explanations with no model-controlled business action;
- strict provider data allowlist, no response/user-context cache, query-language output, version-controlled model/prompt/corpus/evaluation artifacts, and no raw prompts/responses in telemetry.
- no automatic provider fallback, no DeepSeek adapter, and a separate Human production-provider selection after same-dataset comparison.

Deferred scope:

- streaming, tools/actions, durable conversations, Community context, vector infrastructure, product-audit persistence, UI, and existing-domain premium gates.

## Feature Sequence

1. FEAT-058 - Provider-Independent AI Gateway Foundation & Configuration.
2. FEAT-059 - Gemini Development Adapter & Failure Isolation.
3. FEAT-060 - Prompt Registry, Intent Classification & Structured Contracts.
4. FEAT-061 - AI Context Resolver Core & Data Isolation.
5. FEAT-062 - Academy Learning Context Adapter.
6. FEAT-063 - Simulation & Portfolio Context Adapter.
7. FEAT-064 - Academy Retrieval / RAG Foundation.
8. FEAT-065 - AI Rate Limits, Daily Quotas & Cost Controls.
9. FEAT-066 - Aura Intelligence Orchestration API & Safety Guardrails.
10. FEAT-067 - AI Observability & Provider Evaluation Harness.
11. FEAT-068 - Phase 8 Integration, Security & Phase 9 Handover Gate.

The dependency graph is acyclic. FEAT-058 is foundational. FEAT-059/060/061/065 and early FEAT-067 work may follow in parallel. FEAT-062/063 follow FEAT-061. FEAT-064 follows FEAT-060/061/062. FEAT-066 integrates FEAT-059 through FEAT-065. FEAT-067 then closes integrated evaluation, and FEAT-068 is the validation-only gate.

## Architecture Decisions Proposed

- Preserve the modular monolith and create one AI module.
- Define one minimal `LLMProvider` port for generation, structured outputs, normalized token usage, normalized errors, and timeout/cancellation.
- Confine Gemini SDK use to a Gemini development/test adapter. Do not construct a provider marketplace, routing layer, traffic split, automatic fallback, or DeepSeek adapter.
- Keep production provider selection outside runtime authority and require Human approval after same-dataset comparative evidence.
- Treat the minimal port as a refinement of ADR-006's gateway boundary, not the speculative provider plug-in platform that ADR-006 rejected.
- Treat provider output and retrieved documents as untrusted input.
- Use server-derived identity and read-only domain adapters.
- Keep all business authority in PostgreSQL and transient quota state in Redis.
- Prohibit model-triggered actions and all client-authoritative context.
- Use strict versioned request/response schemas and fail closed on malformed output.
- Keep context bounded and intent-specific; preserve Academy answer secrecy and Simulation ownership/disclosure.
- Keep ordinary telemetry content-free and bounded; use deterministic evaluation fixtures.

## Migration Ownership

All approved Phase 8 features own zero migrations under the stateless/PostgreSQL-lexical design. Vector/embedding persistence is not approved. Any future activation requires a separate Human decision, ADR, named migration owner, and revised specification. No Phase 8 feature may introduce an AI table or alter an existing domain schema.

## Security Strategy

The plan requires authentication, server-derived identity, context ownership, prompt/context allowlists, instruction-data separation, no tools/actions, strict provider-output parsing, investment-safety guardrails, transient HMAC-namespaced quotas, provider secret isolation, safe timeout/outage behavior, sanitized errors, and logs without raw conversation or context content. Redis and the model are never durable or business authorities. Gemini credentials remain server-side and outside version control; synthetic data is mandatory until provider privacy conditions are approved.

## Testing And QA

Each feature has directly mapped functional requirements, implementation tasks, and acceptance criteria. Testing includes unit, API integration, live PostgreSQL where durable context is read, live Redis for quotas, deterministic `LLMProvider` contracts, Gemini synthetic live-contract checks, prompt-injection/adversarial fixtures, intent and structured-output evaluation, security regression, domain regression, runtime server flows, canonical validation, exact-source CI, and independent FEAT-068 QA. FEAT-067 replays one versioned dataset across future candidates and compares Vietnamese quality, grounding, schema reliability, latency, token use, cost, privacy, and availability. Initial measurable targets are approved; exact Gemini runtime settings, the final Vietnamese corpus/scoring methodology, and model-relative production limits remain blocked.

Fast-Track governance is preserved: Antigravity may implement and self-verify individual features from approved checkpoints, but cannot claim independent QA. Codex owns independent QA/integration-gate evidence; Human owns the Phase Final Gate.

## Phase 9 Compatibility

Phase 9 FEAT-078 requires a frozen authenticated gateway DTO, no browser provider SDK/key, safe structured output, simulation/context disclosure, citations, refusal/guardrail/quota/unavailable states, and cancellation behavior. FEAT-080 requires browser evidence that networking remains gateway-only and all security/error states render safely. Non-streaming JSON v1 is approved; exact fields, bounds, refusal semantics, status codes, and quota fields remain blocked under P8-D09.

Aura Intelligence is included in the Phase 9 MVP. FEAT-078 and the AI portion of FEAT-080 are hard-blocked until FEAT-068 independent QA PASS and Human Phase 8 Final Gate approval.

## Human Decision Outcome

P8-D01, D02, D04, D06, D07, D08, D10, D13, and D14 are `APPROVED`.

P8-D03 is `APPROVED FOR DEVELOPMENT ARCHITECTURE`.

P8-D05, D09, D11, and D12 are `APPROVED WITH BLOCKER`. Their architecture is approved, but implementation, evaluation, or production activation remains blocked by the exact parameters listed below.

P8-D15 is `PENDING`: Human has not selected a production provider. This does not prevent synthetic Gemini development/testing after P8-D03 closes, but it prohibits production provider activation.

M1 through M8 are integrated into the feature packages and decision traceability without weakening the original FR/AC baseline.

| Decision | Status | Human-Selected Direction / Remaining Blocker |
|---|---|---|
| P8-D01 | APPROVED | FEAT-058..068 approved; FEAT-069 reserved. |
| P8-D02 | APPROVED | Non-streaming JSON API v1. |
| P8-D03 | APPROVED FOR DEVELOPMENT ARCHITECTURE | Human-approved pinned development configuration: `AI_PROVIDER=gemini`, `GEMINI_MODEL_ID=gemini-3.5-flash-lite`, `GEMINI_API_VERSION=v1`, `GEMINI_MAX_INPUT_TOKENS=4096`, `GEMINI_MAX_OUTPUT_TOKENS=1024`, `GEMINI_TIMEOUT_MS=15000`, automatic fallback DISABLED, automatic retry DISABLED. Token values are internal budgets. Production provider unselected/disabled. Live key access, project quota, credential-based structured-output test, and measured latency are assigned to FEAT-059 prerequisites. |
| P8-D04 | APPROVED | All authenticated users with mandatory quotas; no Phase 8 premium gate. |
| P8-D05 | APPROVED WITH BLOCKER | 5 requests/minute, 50/day, 2 concurrent/user; source/IP threshold/window, daily reset semantics, and global daily provider-cost ceiling required. `AI_DAILY_QUOTA=50` is a proposed internal development configuration, not a verified provider allowance. |
| P8-D06 | APPROVED | PostgreSQL lexical retrieval; no vector persistence or migration. |
| P8-D07 | APPROVED | Stateless requests; no durable conversation history. |
| P8-D08 | APPROVED | Closed intent and context-mode catalogs from the master plan. |
| P8-D09 | APPROVED WITH BLOCKER | Structured JSON v1; exact DTOs/bounds/refusal/HTTP/quota contract required. |
| P8-D10 | APPROVED | Educational/simulated explanation only; no guarantees, real execution, or model business actions. |
| P8-D11 | APPROVED WITH BLOCKER | Strict context/data allowlist, synthetic-only Gemini tests until privacy approval, and production traffic disabled; provider region/privacy conditions required. |
| P8-D12 | APPROVED WITH BLOCKER | Initial measurable targets approved; final Vietnamese corpus/relevance/scoring methodology required. |
| P8-D13 | APPROVED | Durable AI product audit deferred; privacy-preserving operational telemetry only. |
| P8-D14 | APPROVED | Aura Intelligence included in Phase 9 MVP; FEAT-078 remains Phase-8-gate blocked. |
| P8-D15 | PENDING | Production provider must be selected by Human after same-versioned-dataset comparison; Gemini development/test use is not production commitment. |

Integrated planning gaps:

- M1 pins runtime/version behavior to the approved development architecture settings (`gemini-3.5-flash-lite`, `v1`, 4096 in, 1024 out, 15000 ms timeout, no fallback, no ambiguous retry); live credential verification and quota confirmation are assigned to FEAT-059.
- M2 defines Vietnamese NFKC/accent-aware lexical normalization and versioned evaluation evidence.
- M3 defines the exact data categories allowed/prohibited at the provider boundary and synthetic-only live tests.
- M4 makes request/context/citation/response bounds part of the D09 freeze blocker.
- M5 fixes reservation, attempt charging, timeout/cancellation, no-ambiguous-retry, settlement, and expiry semantics.
- M6 makes output query-language aligned while preserving citation source language and safety disclosures.
- M7 prohibits response and user-context caching in Phase 8.
- M8 versions provider/model/API, prompts, contracts, datasets, relevance judgments, and threshold sets with regression-gated changes.

Provider strategy update:

- `LLMProvider` is the sole application-facing model port and covers generation, structured outputs, normalized usage, normalized errors, and timeout/cancellation.
- Gemini is the only approved external development/test adapter. DeepSeek is not implemented.
- Provider selection is explicit and single-provider; missing/unknown/conflicting configuration fails closed and there is no automatic fallback.
- FEAT-067 owns comparable evidence, not the provider decision. P8-D15 Human approval owns the production choice.

## Parallel Decision Proposals

The normative technical proposals are recorded in `docs/phase-8-feature-decomposition.md` sections 12.3 through 12.6. They prepare Human decisions without changing any decision status.

### P8-D05 - Quotas And Cost

- Preserve the approved numeric limits of 5 attempts/user/minute, 50 attempts/user/day, and two concurrent provider attempts/user; propose a rolling 60-second minute window and UTC calendar-day reset for Human confirmation.
- Proposed source protection is 60 authenticated structurally valid attempts/source/rolling minute using FEAT-010A server-derived source/trusted-proxy semantics and a dedicated HMAC key.
- Proposed daily reset is `00:00:00Z`; Redis returns the next eligible/reset boundary and all daily keys use UTC.
- One Redis atomic operation checks source, user minute/day, concurrency, and global reserved-plus-settled cost before acquiring all counters/leases/reservations.
- Auth/schema/pre-provider deterministic rejection consumes no user provider-attempt quota. Once provider invocation begins, timeout, caller cancellation, disconnect, and ambiguous outcome consume the request attempt and prohibit transparent retry.
- Cost uses integer USD micro-units, a versioned provider/model pricing snapshot, conservative worst-case reservation, observed-usage settlement, and full retained reservation when usage is absent or settlement is ambiguous.
- Redis failure before reservation returns safe 503 with no provider call. Post-call settlement failure retains the conservative reservation and relies on bounded TTL recovery.
- Detected Redis restart/flush or missing current-day budget continuity does not silently reset spend. Recommended recovery remains fail-closed until operator reconciliation/re-arm; a provider-side cap is defense in depth. Human must choose this policy, accept transient-reset residual risk, or authorize a separate durable ledger.
- The global daily USD amount remains deliberately unset. Human must supply a literal per-environment ceiling; no implementation agent may infer one.

### P8-D09 - API Contract

- Freeze candidate endpoint `POST /api/ai/assist` as authenticated, same-origin, non-streaming JSON v1.
- Candidate request is exactly `{ message, contextMode? }`, rejects unknown/authority fields, limits message to 2,000 Unicode code points and 8 KiB UTF-8, and limits the complete body to 12 KiB.
- Server context uses 2 KiB/item, 8 KiB/adapter, five retrieval items/8 KiB, and 16 KiB plus 4,096 estimated tokens aggregate, within P8-D03 total input budget.
- Candidate success envelope freezes answer, intent, context/simulation disclosure, 0..5 opaque citations, structured safety/refusal/disclaimer state, and per-user minute/day quota metadata only.
- Answer is limited to 6,000 code points/24 KiB and the complete success response to 32 KiB.
- Safe policy/unsupported refusal is HTTP 200 with `outcome=REFUSED` and server-owned text. Transport/dependency failures use the strict safe envelope and the proposed 400/401/413/415/429/502/503/504/500 mapping.
- Client identity, provider/model/prompt selection, raw context, record IDs, authoritative business facts, source/global/concurrency budget data, and provider internals are absent.
- FEAT-078 consumes only this provider-neutral contract and never calls Gemini or another provider directly.

### P8-D12 - Evaluation

- Version and hash corpus, dataset, relevance judgments, scoring code, threshold set, prompts/contracts, provider/model/API, and exact source.
- Proposed minimums are 250 intent cases, 200 retrieval queries, 120 answer/citation cases, 60 prompt-injection fixtures, 120 structured-output cases, and 100 measured synthetic provider calls/candidate after 10 excluded warm-ups.
- Vietnamese strata are 60% accented, 20% unaccented, 10% typo/noisy, and 10% mixed Vietnamese-English, with a separate 20-case English control suite.
- Retrieval relevance uses grades 0..3, grades 2/3 as relevant, two independent Human annotators, and third-annotator adjudication for material disagreement. LLM-as-judge evidence is advisory only.
- Scoring definitions freeze intent macro-F1, Recall@5, MRR@5, no-evidence accuracy, atomic-claim citation grounding, strict schema validity, critical injection/safety pass rate, latency percentiles, token usage, and USD micro-unit cost.
- Existing approved thresholds remain unchanged. Proposed additional thresholds of response-quality mean >=4.0/no critical case <3 and p95 <=10 seconds/timeout rate <=1% require Human confirmation.
- Until P8-D11 closes, provider-bound evaluation uses synthetic data only. The same sealed gate split is used for candidate comparison, but scores never select a provider automatically.

### Human Decision Matrix

| Decision Item | Proposed Value | Status |
|---|---|---|
| D05 source threshold/window | 60/source/rolling 60 seconds | PENDING HUMAN CONFIRMATION |
| D05 user-minute semantics | approved count 5; proposed rolling 60-second window | PENDING HUMAN CONFIRMATION |
| D05 daily boundary | UTC calendar day | PENDING HUMAN CONFIRMATION |
| D05 currency/accounting | integer USD micro-units; versioned price snapshot; UTC reset | PENDING HUMAN CONFIRMATION |
| D05 global amount | no proposed amount | PENDING HUMAN VALUE |
| D05 Redis state loss | fail closed until operator reconciliation/re-arm; provider-side cap as defense in depth | PENDING HUMAN CONFIRMATION |
| D09 DTO/bounds | exact candidate in decomposition section 12.4 | PENDING HUMAN CONFIRMATION |
| D09 refusal/error semantics | HTTP 200 structured refusal plus strict status/code table | PENDING HUMAN CONFIRMATION |
| D09 citations/quota | opaque bounded citations; user minute/day metadata only | PENDING HUMAN CONFIRMATION |
| D12 dataset/splits/mix | exact candidate in decomposition section 12.5 | PENDING HUMAN CONFIRMATION |
| D12 judgments | grades 0..3; two annotators; third adjudicator | PENDING HUMAN CONFIRMATION |
| D12 response-quality threshold | mean >=4.0/dimension; no critical <3 | PENDING HUMAN CONFIRMATION |
| D12 latency threshold | p95 <=10 seconds; timeout <=1% | PENDING HUMAN CONFIRMATION |

P8-D05, P8-D09, and P8-D12 therefore remain `APPROVED WITH BLOCKER`. This planning completion does not authorize implementation against an unconfirmed default.

## Parallel Implementation Readiness

- FEAT-058 is unchanged and remains blocked only by P8-D03. This planning operation did not alter its approved contracts.
- P8-D05 confirmation is required before FEAT-065 implementation can complete and before FEAT-067/068 cost-control evidence can pass.
- P8-D09 confirmation is required before FEAT-060/061 contract and context work, their FEAT-062/063 consumers, FEAT-066 orchestration, and the FEAT-078 handover contract are implementation-authorized.
- P8-D12 confirmation plus later concrete corpus/judgment manifest approval is required for FEAT-064 gate evidence, FEAT-067 evaluation completion, and FEAT-068 PASS.
- P8-D11 continues to restrict provider-bound work to synthetic data. P8-D15 continues to prohibit production provider activation.

Recommended next implementation sequence after Human decisions close:

1. FEAT-058 alone from the approved Phase 7 baseline after P8-D03 closes.
2. From the FEAT-058 checkpoint, parallel isolated worktrees for FEAT-059, FEAT-060, FEAT-061, and FEAT-065 after their applicable D03/D05/D09 approvals.
3. FEAT-062 and FEAT-063 after the FEAT-061 context contract; FEAT-067 evaluation foundations after the FEAT-060 contract and D12 methodology approval.
4. FEAT-064 after FEAT-060/061/062 plus the approved D12 manifests.
5. Integrate FEAT-059 through FEAT-065 on clean exact-source checkpoints, then implement FEAT-066.
6. Complete FEAT-067 against the integrated FEAT-066 behavior, then run independent FEAT-068.

No parallel branch may independently edit FEAT-058 contracts, shared AI DTOs, root composition, environment schema, package lockfile, or Redis namespace helpers without the assigned integration owner.

## Proposed Tracker Update

Canonical governance direction for a later tracker-update operation:

- Phase 8: `PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION IN_PROGRESS`.
- FEAT-058: `APPROVED FOR IMPLEMENTATION`.
- FEAT-059: `DEPENDENCY BLOCKED BY FEAT-058`.
- FEAT-060 through FEAT-068: dependency-blocked according to the approved DAG.
- FEAT-069: reserved/unallocated.
- Phase 9: planning may continue, but FEAT-078 and FEAT-080 remain dependency-blocked as described.

`docs/progress-tracker.md` was intentionally not modified during preliminary planning.

## Planning Verification

- Baseline checkpoint: VERIFIED.
- Feature IDs FEAT-058..068: no collision on baseline.
- Specification packages: 11 complete packages x 5 files = 55 files, verified.
- FR -> Task -> AC traceability: 110 FRs, 110 tasks, and 110 ACs with complete direct mapping, verified.
- Dependency DAG: ACYCLIC.
- Migration ownership: EXPLICIT.
- Phase 7 architecture compatibility: VERIFIED by document/code review.
- Phase 9 dependency compatibility: VERIFIED against FEAT-078/080 planning artifacts without modifying that worktree.
- Application code changes: ZERO.
- Progress tracker changes: ZERO.
- Documentation validation: no repository documentation-lint script exists; structural, status, file-set, sequence, mapping, fence, whitespace, and ASCII checks passed.
- Implementation test claims: NONE.

## Outstanding Blockers

- P8-D03: RESOLVED FOR DEVELOPMENT ARCHITECTURE (`gemini-3.5-flash-lite`, `v1`, 4096 in, 1024 out, 15000 ms, fallback/retry disabled). Live credential verification and quota confirmation moved to FEAT-059 prerequisites.
- P8-D05: Human confirmation of the prepared source/UTC/accounting proposal and a literal per-environment global daily USD ceiling.
- P8-D09: Human confirmation of the prepared exact DTO, bounds, refusal/error, citation, and quota contract.
- P8-D11: exact provider region plus accepted privacy, retention, training, and processing conditions.
- P8-D12: Human confirmation of the prepared methodology, response-quality/latency thresholds, and later approval of the concrete versioned corpus/judgment manifest.
- P8-D15: production provider selection after versioned candidate comparison; required before production provider activation, not before synthetic development/testing.
- FEAT-078 and Phase 9 AI E2E remain blocked until FEAT-068 independent QA PASS and Human Phase 8 Final Gate approval.

## Exact Human Inputs Still Required

1. P8-D03: RESOLVED FOR DEVELOPMENT ARCHITECTURE (`gemini-3.5-flash-lite`, `v1`, 4096 input tokens, 1024 output tokens, 15000 ms timeout, fallback DISABLED, retry DISABLED).
2. P8-D05: approve/amend the complete section-12.3 matrix, including rolling user/source windows, UTC reset, atomic reservation, ambiguous-call accounting, lease/TTL recovery, Redis outage/state-loss handling, USD micro-unit settlement, and a literal per-environment global daily USD ceiling.
3. P8-D09: approve/amend the exact section-12.4 request/response DTOs, bounds, HTTP 200 refusal, error table, citation catalog, and quota fields.
4. P8-D11: provider service/region; accepted retention duration; training/use-of-content policy; accepted data-processing/privacy terms; whether obvious PII typed in a learner message is rejected, redacted, or transmitted under those terms; production activation authorization.
5. P8-D12: approve/amend the section-12.5 sizes/mix/judgment/scoring method and proposed quality/latency thresholds; later approve the concrete corpus, gold-judgment, scoring, and sealed-gate manifests.
6. P8-D15: candidate providers/models to evaluate; completed same-dataset comparison evidence; accepted privacy/availability constraints; selected production provider/model; rollout and rollback approval.

Final planning status: CONDITIONALLY APPROVED. Phase 8 implementation: IN_PROGRESS. FEAT-058 implementation readiness: APPROVED FOR IMPLEMENTATION. FEAT-059: DEPENDENCY BLOCKED BY FEAT-058. Production provider activation: BLOCKED by P8-D11 and P8-D15.
