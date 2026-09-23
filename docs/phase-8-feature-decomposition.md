# Phase 8 Feature Decomposition: Aura Intelligence

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED
Planning Owner: Codex
Future Implementation Owner: Antigravity
Final Approval Authority: Human
Planning Baseline: `phase-7-approved` / `c490b3f956fa593a40edf389f8e7a9c5fa9c19c1`
Phase 8 Implementation: NOT STARTED
Phase 9 Implementation: NOT STARTED

## 1. Purpose

Phase 8 turns the roadmap concept of Aura Intelligence into a context-aware learning assistant. It establishes one authenticated provider-independent AI gateway, an isolated Gemini development/test adapter behind that gateway, server-derived Academy and Simulation context, bounded retrieval, structured output validation, abuse controls, and operational evidence. It does not commit Aura Capital to Gemini for production and does not permit model output to become business, financial, subscription, identity, progress, grading, trade, or entitlement authority.

This document records Human approval of the Phase 8 planning direction. It does not authorize implementation while feature-specific blockers remain, and it does not approve unresolved production settings.

## 2. Baseline And ID Allocation

- The local and remote annotated tag `phase-7-approved` resolve to the same tag object and peel to approved commit `c490b3f956fa593a40edf389f8e7a9c5fa9c19c1`.
- The planning branch is `planning/phase-8-master` in `.tmp/phase8-planning`.
- Existing repository IDs end at FEAT-057 on the approved baseline.
- Phase 9 planning reserves FEAT-070 through FEAT-080 and expects Phase 8 to freeze the Aura Intelligence client contract before FEAT-078.
- This proposal allocates FEAT-058 through FEAT-068. FEAT-069 remains reserved and unallocated for a Human-approved Phase 8 gap; it is not an implicit feature.

## 3. Scope Classification

### Approved By Existing Governance

- Aura Intelligence is a context-aware educational assistant rather than generic chat.
- All model calls pass through a server-side internal AI gateway.
- Gemini is the initial development/test provider behind the gateway boundary. Production provider selection is a separate Human decision.
- Authentication, request validation, intent classification, context construction, prompt/version control, rate limits, quotas, structured validation, guardrails, usage/cost observability, and safe error handling are gateway responsibilities.
- Context may consume approved Academy learning context and Simulation/portfolio/trade context through read-only boundaries.
- Simulation-derived statements must be identified as simulated.
- The product must not present guaranteed returns or model output as authoritative real-world investment advice.
- PostgreSQL remains durable business authority. Redis remains transient-only.
- The modular monolith, repository boundaries, server-derived identity, Zod validation, structured logging, and existing security controls remain authoritative.

### Human-Approved Planning Direction

- Eleven features, FEAT-058 through FEAT-068, with FEAT-069 reserved.
- One non-streaming JSON v1 endpoint direction: `POST /api/ai/assist`.
- Stateless request/response behavior with no durable conversation history in Phase 8.
- Retrieval over published Academy content using PostgreSQL-backed lexical retrieval and safe citations; no vector persistence or new migration.
- Authenticated access for all users with mandatory quotas and no Phase 8 premium entitlement requirement.
- The closed intent/context-mode catalog in this plan and a versioned structured JSON response shared with Phase 9.
- Educational and simulated explanations only; no guaranteed returns, real-world execution, or model-controlled business actions.
- A strict provider context/data allowlist, privacy-preserving operational telemetry, no response/user-context cache, and no raw prompt/response/provider payload in ordinary logs.
- Aura Intelligence remains in the Phase 9 MVP, while FEAT-078 stays blocked until Phase 8 independent QA PASS and Human Final Gate approval.
- The gateway exposes one minimal `LLMProvider` contract. Gemini is implemented through an isolated adapter; DeepSeek, provider routing, traffic splitting, and automatic fallback are not approved.
- Production provider candidates are compared against the same versioned evaluation dataset before Human selection.

### Deferred

- Streaming/SSE and multi-turn durable chat history.
- Model tool execution, order placement, Academy progress mutation, grading, subscription mutation, or any other write action.
- Community/user-generated content as AI context.
- External vector databases, embedding pipelines, and semantic retrieval infrastructure.
- Production product-audit persistence for AI events; FEAT-016 governance still applies.
- AI user interface and browser E2E, owned by Phase 9 after contract freeze.
- Existing-domain premium gating unless separately approved.

### Remaining Approval Blockers

- Exact Gemini development/test model ID, API version, input/output token limits, and timeout.
- Exact source/IP protection threshold and window (or explicit decision to omit it), daily-quota reset semantics, and global daily provider-cost ceiling.
- Exact v1 DTO field bounds plus final refusal and HTTP error semantics.
- Exact provider region and accepted provider privacy/retention/training conditions before production traffic.
- Final Vietnamese evaluation corpus and scoring/relevance-judgment methodology before the evaluation gate.
- Production provider selection after comparative quality, grounding, structured-output reliability, latency, token, cost, privacy, and availability evidence.

These are approved architectural directions with unresolved production parameters, not silent unconditional approvals.

## 4. Approved Architecture Direction

### 4.1 Request Flow

```text
authenticated client
  -> AI route/controller
  -> request schema validation
  -> transient rate limit and daily quota reservation
  -> intent classifier
  -> server-side context resolver
       -> Academy read adapter
       -> Simulation/portfolio read adapter
       -> bounded Academy retrieval
  -> versioned prompt assembler
  -> provider-independent LLMProvider port
       -> Gemini development/test adapter with timeout/cancellation
  -> untrusted provider output parser
  -> Zod structured-output validation
  -> safety/financial guardrails
  -> safe response envelope
  -> bounded operational telemetry
```

### 4.2 Module Boundaries

- Phase 8 remains inside the modular monolith under an `ai` module.
- Controllers depend on an orchestration service, never Gemini SDK types.
- The orchestration service depends on `LLMProvider` plus narrow ports for context reads, retrieval, quota, clock, and telemetry.
- `LLMProvider` supports canonical response generation, strict structured-output requests/results, normalized token usage, a closed normalized error taxonomy, and deadline/cancellation propagation. It exposes no provider SDK type.
- The conceptual v1 port has one `generate(request, execution)` operation. Requests select `TEXT` or a versioned `STRUCTURED` schema reference; execution carries the configured deadline and `AbortSignal`; results carry untrusted content plus nullable normalized input/output/total token usage and content-free provider/model/API identifiers.
- Normalized provider errors are closed to `AUTHENTICATION`, `RATE_LIMITED`, `TIMEOUT`, `CANCELLED`, `UNAVAILABLE`, `REFUSED`, `MALFORMED_RESPONSE`, and `UNKNOWN`. FEAT-060 remains the authority for strict structured-output parsing and public DTOs.
- The Gemini SDK is confined to the Gemini adapter. The provider-independent port is a replacement boundary, not a provider marketplace: there is no adapter registry, automatic fallback, traffic splitting, or DeepSeek implementation in Phase 8.
- This is compatible with ADR-006's rejection of speculative provider generality: `LLMProvider` is the single narrow invocation boundary needed by the approved gateway, while Gemini remains the only implemented adapter. A broader provider platform remains rejected.
- Gemini is enabled only as the explicitly selected development/test provider with synthetic data until privacy approval. Missing, unknown, multiple, or conflicting provider selection fails closed.
- Production provider activation requires P8-D11 privacy approval and the separate P8-D15 Human provider-selection decision.
- Context adapters consume approved read contracts and repository abstractions. They do not mutate Academy, Simulation, Subscription, auth, or Community data.
- AI services/controllers do not import Prisma delegates directly and do not bypass FEAT-013 transaction/repository rules.
- Provider output is always untrusted input and cannot be returned before schema and safety validation.

### 4.3 Authority Boundaries

- PostgreSQL remains the durable authority for users, Academy, Simulation, subscriptions, audit records, and all business facts.
- Redis may hold namespaced TTL-bound counters, quota reservations, and short-lived operational state only.
- JWT supplies authenticated identity only; role and entitlement authority remain server-side under their owning modules.
- The client cannot supply authoritative `userId`, roles, entitlements, portfolio facts, progress, correct answers, provider/model settings, or context records.
- The LLM cannot create or mutate trades, grades, progress, rewards, roles, subscriptions, or entitlements.
- Aura output is educational assistance, not a source of truth for financial outcomes.

### 4.4 Data And Privacy

- Context is minimized per classified intent and bounded by explicit item/token limits.
- Academy context may include published lesson/flashcard material, learner progress facts, and completed assessment outcomes. It must not expose draft content or correct answers before submission.
- Simulation context is ownership-scoped and explicitly marked simulated. It may include bounded portfolio, position, trade, asset, and scenario snapshots through approved read contracts.
- RAG documents are delimited untrusted data and cannot override system/developer instructions.
- Raw prompts, responses, retrieval documents, tokens, cookies, secrets, provider payloads, and complete portfolio/content context are prohibited from ordinary logs.
- Durable conversation storage is absent under the approved stateless decision. Any later persistence requires a separate schema, retention, deletion, privacy, migration, and audit decision.

## 5. Feature Decomposition

| ID       | Feature                                                       | Type                              | Hard Dependencies                                                                  | Migration Ownership | Governance State                                     |
| -------- | ------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------- |
| FEAT-058 | Provider-Independent AI Gateway Foundation & Configuration    | Implementation                    | Phase 7 approved, P8-D03 development architecture approved                         | ZERO                | DONE / HUMAN FEATURE GATE APPROVED                   |
| FEAT-059 | Gemini Development Adapter & Failure Isolation                | Implementation                    | FEAT-058 checkpoint plus FEAT-059 live-key/quota prerequisites                     | ZERO                | IMPLEMENTATION COMPLETE / INTERNAL FEATURE GATE PASS |
| FEAT-060 | Prompt Registry, Intent Classification & Structured Contracts | Implementation                    | FEAT-058 plus D09 blocker closure                                                  | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-061 | AI Context Resolver Core & Data Isolation                     | Implementation                    | FEAT-058, D09 context-bound closure; D11 blocks non-synthetic/production traffic   | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-062 | Academy Learning Context Adapter                              | Implementation                    | FEAT-061, Phase 4, D09 context-bound closure; D11 blocks provider use of real data | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-063 | Simulation & Portfolio Context Adapter                        | Implementation                    | FEAT-061, Phase 5, D09 context-bound closure; D11 blocks provider use of real data | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-064 | Academy Retrieval / RAG Foundation                            | Implementation                    | FEAT-060, FEAT-061, FEAT-062, D12 methodology closure                              | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-065 | AI Rate Limits, Daily Quotas & Cost Controls                  | Implementation                    | FEAT-058, FEAT-015, FEAT-010A, D05 decision closure                                | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-066 | Aura Intelligence Orchestration API & Safety Guardrails       | Implementation                    | FEAT-059..FEAT-065 plus D09 contract closure                                       | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-067 | AI Observability & Provider Evaluation Harness                | Implementation/validation support | FEAT-058, FEAT-060; converges after FEAT-066; D12 closure; D11 for real data       | ZERO                | Planning conditionally approved / dependency blocked |
| FEAT-068 | Phase 8 Integration, Security & Phase 9 Handover Gate         | Validation-only gate              | FEAT-058..FEAT-067 and all development/gate blocker closure                        | ZERO                | Planning conditionally approved / dependency blocked |

### FEAT-058 - Provider-Independent AI Gateway Foundation & Configuration

Goal: establish the module boundary, configuration validation, dependency contracts, and disabled/enabled startup behavior without exposing a usable assistant endpoint.

Owns: AI module composition, validated provider configuration, the `LLMProvider` generation/structured-output/usage/error/timeout contract, secrets, timeout/budget configuration contracts, typed supporting ports, safe configuration diagnostics, and test doubles.

Does not own: provider invocation behavior, prompts, context, RAG, quotas, public AI response behavior, or product mutation.

Quality Gate: missing/conflicting configuration fails closed; secrets have no fallback and do not leak; no provider SDK escapes the adapter boundary; no API/provider call is enabled accidentally; production activation is impossible before P8-D11/P8-D15.

### FEAT-059 - Gemini Development Adapter & Failure Isolation

Goal: invoke Gemini for development/test through one isolated `LLMProvider` adapter with timeout, cancellation, bounded retry, safe normalization, and deterministic fake behavior for tests.

Owns: Gemini SDK containment, provider request/response mapping, model selection config, timeout/cancellation, provider error taxonomy, token usage extraction, and local/test fake isolation.

Does not own: production-provider selection, DeepSeek, a provider marketplace/router/fallback chain, prompts, context, route authorization, RAG, or final response safety.

Quality Gate: Gemini conforms to `LLMProvider`; production cannot fall back to Gemini, another provider, or a fake without approval; provider errors and payloads are sanitized; ambiguous billable calls are not blindly retried; SDK imports remain confined.

### FEAT-060 - Prompt Registry, Intent Classification & Structured Contracts

Goal: define closed, versioned server-side prompts, intent taxonomy, request/response schemas, and strict parser behavior.

Owns: prompt IDs/versions, allowed intent values, prompt assembly contracts, structured provider-output schema, safe public response schema, and classification/evaluation fixtures.

Does not own: durable prompts, user-editable system prompts, provider invocation, context retrieval, or UI.

Quality Gate: unknown intents and malformed/model-extra fields fail safely; clients cannot override system prompts/model/context; every response identifies contract and prompt versions internally without leaking hidden prompts.

### FEAT-061 - AI Context Resolver Core & Data Isolation

Goal: create a read-only, server-derived context envelope and adapter registry with strict user isolation and budgets.

Owns: context request policy, context modes, adapter ports, user scoping, field allowlists, size/token budgets, provenance metadata, and parallel read failure policy.

Does not own: concrete Academy/Simulation data mapping, Community context, mutations, or provider invocation.

Quality Gate: spoofed identity/context is rejected or ignored, cross-user reads are impossible, adapter errors fail safely, and no raw Prisma access appears in AI controllers/services.

### FEAT-062 - Academy Learning Context Adapter

Goal: provide bounded learning context through approved Phase 4 read boundaries.

Owns: published content summaries, learner progress/completion facts, safe completed-assessment context, provenance, and Academy-specific redaction/budgeting.

Does not own: Academy schema/migrations, grading, progress mutation, rewards, draft content, or pre-submission correct answers.

Quality Gate: only current-user and published/safe data is exposed; answer secrecy remains intact; Phase 4 behavior regresses green.

### FEAT-063 - Simulation & Portfolio Context Adapter

Goal: provide owned, bounded simulation facts while preserving simulated-world semantics.

Owns: approved session/portfolio/position/trade/asset/scenario read projections, ownership checks, stable decimal serialization, and simulation markers.

Does not own: order placement, pricing, settlement, mutation, real brokerage data, or guaranteed outcome claims.

Quality Gate: IDOR attempts fail, all context is explicitly simulated, bounded, and read-only, and Phase 5 invariants remain green.

### FEAT-064 - Academy Retrieval / RAG Foundation

Goal: retrieve bounded relevant published Academy evidence and provide safe citations to the orchestrator.

Owns: corpus eligibility, deterministic retrieval interface, query normalization, result limits, provenance/citations, injection-resistant document framing, and retrieval evaluation.

Approved v1 direction: deterministic lexical retrieval over approved PostgreSQL-backed Academy reads, with no Phase 8 migration. Vector/embedding persistence is not approved for Phase 8.

Quality Gate: drafts/correct answers/cross-user data never enter corpus results; hostile content cannot override instructions; citations resolve to approved content; empty retrieval degrades safely.

### FEAT-065 - AI Rate Limits, Daily Quotas & Cost Controls

Goal: prevent abuse and uncontrolled provider spend before a provider call.

Owns: endpoint/source/user counters, daily quota, atomic reservation/settlement semantics, namespaced HMAC keys, TTLs, multi-instance behavior, provider-call budget checks, and safe 429/503 contracts.

Does not own: durable business authority, permanent account lockout, entitlement mutation, provider invocation, or raw identity storage in Redis.

Quality Gate: canonical/alias routes share counters if aliases are approved; Redis outage fails closed before provider invocation; concurrency cannot exceed approved limits; no raw identity/prompt/secret leaks.

### FEAT-066 - Aura Intelligence Orchestration API & Safety Guardrails

Goal: expose the authenticated assistant flow by composing provider, contracts, context, RAG, quota, and safety boundaries.

Owns: approved `POST /api/ai/assist` non-streaming JSON v1 direction, authentication, orchestration, context selection, prompt assembly, guardrails/refusals, structured output, simulation disclosure, safe errors, and no-action enforcement.

Does not own: browser UI, durable conversation history, streaming, provider tools, trades, progress/grading, subscription actions, or Community context.

Quality Gate: unknown-user and cross-user attacks fail; malformed/provider/timeout/quota/outage paths never fabricate success; investment-safety and simulation disclosures are deterministic; no model output mutates authority.

### FEAT-067 - AI Observability & Provider Evaluation Harness

Goal: measure reliability, safety, bounded resource use, contract quality, and production-provider comparison dimensions against one versioned dataset without storing sensitive conversation content.

Owns: request/trace correlation, provider/model/API/prompt versions, intent, latency, normalized token/cost estimates, outcome metrics, bounded labels, redacted diagnostics, deterministic provider-replayable eval fixtures, comparison evidence, and release thresholds.

Does not own: raw prompt/response analytics, a product audit table, business authority, automatic provider routing/fallback, production-provider selection, or public admin dashboards.

Quality Gate: telemetry contains no prohibited data; cardinality is bounded; safety/intent/structured-output/provider-failure evaluations meet Human-approved thresholds; candidate evidence uses the same versioned dataset and covers Vietnamese quality, grounding, schema reliability, latency, token use, cost, privacy, and availability; metrics cannot change authorization or select a provider.

### FEAT-068 - Phase 8 Integration, Security & Phase 9 Handover Gate

Goal: independently verify the integrated Phase 8 system and freeze the server/client contract consumed by Phase 9.

Owns: validation only, fresh and regression environments, adversarial flows, mandatory live provider-contract/fake tests, PostgreSQL/Redis regressions, exact-source CI, QA report, and handover evidence.

Does not own: defect implementation, product behavior, schema, migration, UI, or spec relaxation.

Quality Gate: all included features pass, no mandatory skip exists, no P0/P1 remains, authority/security/privacy/cost boundaries hold, Phase 9 contract is frozen, and Human Phase 8 Final Gate remains required.

## 6. Dependency DAG

```text
phase-7-approved -> FEAT-058
FEAT-058 -> FEAT-059, FEAT-060, FEAT-061, FEAT-065
FEAT-061 -> FEAT-062, FEAT-063
FEAT-060 + FEAT-061 + FEAT-062 -> FEAT-064
FEAT-059..FEAT-065 -> FEAT-066
FEAT-058 + FEAT-060 -> FEAT-067 foundations
FEAT-066 -> FEAT-067 convergence/completion
FEAT-067 -> FEAT-068 final gate
FEAT-068 PASS + Human Phase 8 Final Gate -> Phase 9 FEAT-078/080
```

FEAT-067 may establish telemetry/evaluation primitives after FEAT-058 and FEAT-060, but its completion depends on FEAT-066 integration. The graph is acyclic.

Dependency classification:

- HARD: all arrows shown above; Phase 4 for FEAT-062; Phase 5 for FEAT-063; Phase 8 final gate for Phase 9 FEAT-078 when AI remains in MVP.
- SOFT: Phase 7 entitlement contracts only if a later separately approved feature premium-gates AI; no premium dependency exists in approved Phase 8 scope.
- OPTIONAL: vector/embedding infrastructure and durable product audit, both excluded unless separately approved.

## 7. Parallel Execution Strategy

1. Wave 0: Human approves this master plan, decision register, all affected feature specs, and one canonical implementation baseline derived from `phase-7-approved` or a later explicitly approved integration checkpoint.
2. Wave 1: FEAT-058 alone owns AI module composition, the `LLMProvider` contract, shared environment schema, and server composition. It does not add a provider SDK.
3. Wave 2: FEAT-059, FEAT-060, FEAT-061, FEAT-065, and FEAT-067 foundations may use isolated worktrees from the FEAT-058 checkpoint. FEAT-059 owns the Gemini development/test adapter and provider package changes; FEAT-060 owns prompt/contracts; FEAT-061 owns context core; FEAT-065 owns quota/Redis files; FEAT-067 owns telemetry/provider-evaluation files.
4. Wave 3: FEAT-062 and FEAT-063 run in parallel after FEAT-061 using separate adapter files. Domain code remains read-only and domain owners retain schema/mutation ownership.
5. Wave 4: FEAT-064 follows FEAT-060/061/062. Under the default lexical design it owns no schema or package manifest.
6. Wave 5: integrate FEAT-059..065 into a clean checkpoint, resolve shared contracts centrally, and execute exact-source CI before FEAT-066.
7. Wave 6: FEAT-066 composes the route and service; FEAT-067 completes integrated telemetry/evaluation.
8. Wave 7: FEAT-068 runs independent final QA; Human decides the Phase Final Gate.

Every implementation feature requires an isolated worktree/branch, exact baseline SHA, scoped ownership, implementation report, targeted tests, canonical validation, exact-source CI, and an integration checkpoint. The planning branch is never an implementation baseline. Antigravity may self-verify but cannot claim independent QA.

Shared-file ownership requiring serialized coordination:

- `package.json` / lockfile and Gemini SDK: FEAT-059 only. DeepSeek or another provider SDK requires a future approved feature/decision.
- shared environment schema and `.env.example`: FEAT-058, then coordinated additions only.
- `apps/api/src/server.ts` and root AI router: FEAT-058/FEAT-066 integration owner.
- shared AI DTO exports: FEAT-060.
- repository factory/domain read-port wiring: FEAT-061 integration owner.
- Redis namespace helpers: FEAT-065 without weakening existing rate-limit semantics.

## 8. Migration Ownership

- FEAT-058, FEAT-059, FEAT-060, FEAT-061, FEAT-062, FEAT-063, FEAT-065, FEAT-066, FEAT-067, and FEAT-068 own zero migrations.
- FEAT-064 owns zero migrations under the approved PostgreSQL lexical read strategy.
- Vector/embedding persistence is excluded. Any future activation requires a new Human decision, ADR, named migration owner, and revised migration/upgrade/rollback/evaluation plan.
- No Phase 8 feature may modify Academy, Simulation, Community, Subscription, auth, or audit schemas without the owning feature being reopened through Human governance.
- Any approved Phase 8 migration must pass fresh zero-state and real existing-schema upgrade validation. `db push` is not a substitute.

## 9. Security And Failure Strategy

- Authentication is mandatory. User identity is server-derived from FEAT-004 middleware.
- Authorization/context ownership is enforced before data reaches prompts. Client role/admin/premium/context claims are untrusted.
- Prompt injection is addressed through instruction/data separation, allowlisted context fields, bounded retrieval, no tools/actions, output validation, and adversarial evaluation.
- Provider/model output is never authorization, entitlement, grading, progress, trade, subscription, or financial authority.
- Rate/quota checks happen before provider invocation. Redis unavailability fails AI writes/requests closed with a safe unavailable response; unrelated durable reads may remain available.
- Timeouts, cancellations, malformed output, provider refusal, safety refusal, and unavailable errors are distinct normalized `LLMProvider` outcomes but externally bounded and non-sensitive.
- No failure path automatically calls a second model or provider. Production provider selection, switching, rollout, and rollback require explicit Human approval and configuration; they are not runtime fallback.
- Secrets are required server-side environment/secret-store configuration with no fallback/reuse and remain outside version control. Provider keys never reach committed files, browser bundles, logs, reports, Redis keys, or responses.
- Log/metric labels are allowlisted and bounded. Sensitive raw content is not persisted as observability.
- No permanent account lockout is introduced. No authentication behavior is re-owned.

## 10. Testing And QA Strategy

Each implementation feature must include targeted unit and integration tests. Live PostgreSQL tests are mandatory for context/retrieval paths that read durable data; live Redis tests are mandatory for FEAT-065. Provider tests use deterministic `LLMProvider` contract fakes plus Gemini development/test live-contract validation with synthetic data only when the approved credential/cost policy permits it.

AI-specific evaluation covers:

- intent classification against a versioned fixture corpus;
- strict structured-output parsing and unknown-field rejection;
- prompt-injection and hostile retrieved-content resistance;
- cross-user and ownership isolation;
- Academy answer secrecy and draft exclusion;
- Simulation disclosure and no-real-world-authority wording;
- refusal/guardrail behavior for disallowed financial requests;
- latency, timeout, cancellation, token, and cost budgets;
- quota concurrency, multi-instance behavior, and Redis outage;
- no-action/no-mutation guarantees;
- safe telemetry and diagnostic sanitization.
- provider-independent contract conformance and explicit no-fallback behavior;
- candidate comparison against one versioned dataset for Vietnamese response quality, retrieval/citation grounding, structured-output reliability, latency, token consumption, cost, privacy, and availability.

FEAT-068 must run canonical repository validation, all authoritative guards, standard/unit/live PostgreSQL/live Redis suites, provider contract/evaluation suites, runtime E2E/security flows, exact-source CI, and Phase 2-7 regression with zero mandatory skips. Browser E2E of the learner UI remains Phase 9 FEAT-080; FEAT-068 validates only the server handover contract.

The current canonical repository validation baseline is:

```text
npm run clean
npm run lint
npx prisma validate --schema=apps/api/prisma/schema.prisma
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:db
npm run test:redis
npm run guard:persistence
npm run guard:migration
npm run guard:boundary
npm run guard:audit-governance
npm run guard:seed-safety
```

AI provider-contract, evaluation, security, and runtime suites are additional evidence and do not replace any applicable canonical command. A new AI guard is justified only when a concrete static boundary cannot be verified by the existing guards and tests.

Initial quality/safety thresholds are approved in section 12.2. The exact Gemini development/test timeout and token limits, final model-relative latency objective, global cost ceiling, and Vietnamese corpus/scoring methodology remain explicit blockers and cannot be invented by implementation agents. Production provider selection remains P8-D15 and cannot be inferred from development use.

## 11. Phase 8 To Phase 9 Handover Contract

The following direction is Human-approved; fields and semantics explicitly identified below remain blocked pending final confirmation:

- Endpoint: `POST /api/ai/assist`, authenticated, same-origin internal API, non-streaming JSON v1.
- Request: bounded `message` plus an optional allowlisted `contextMode` hint. It contains no client `userId`, role, entitlement, model, provider, system prompt, raw context object, or authoritative domain fact.
- Response: versioned safe envelope containing answer text, classified intent, context disclosure including `isSimulation`, safe citations/provenance, safety/refusal/disclaimer state, and optionally non-sensitive quota information.
- Error families: validation, unauthenticated, rate-limited/quota-exhausted with accurate `Retry-After`, provider/unavailable, safety refusal, malformed provider output, and generic failure. No provider payload, model secret, stack, database/Redis detail, prompt, or hidden context is exposed.
- FEAT-078 must call only this gateway, render all content injection-safely, support cancellation and all error/refusal/quota states, and contain no Gemini/provider SDK or key.
- FEAT-080 must verify gateway-only networking, authentication, cross-user isolation, quota/outage behavior, structured response rendering, simulation disclosure, citation safety, refusal/guardrail behavior, and absence of browser provider access.
- Non-streaming JSON v1 is approved. Exact DTO field bounds, refusal behavior, HTTP error semantics, and quota fields must be frozen before FEAT-060/066 implementation and then revalidated by FEAT-068.

Approved v1 envelope direction, with exact bounds still blocked:

```json
{
  "message": "bounded learner question",
  "contextMode": "AUTO | ACADEMY | SIMULATION"
}
```

`contextMode` is a non-authoritative allowlisted hint. Omission selects `AUTO`; no client-supplied identity, entitlement, model, prompt, portfolio, progress, or raw context is accepted.

```json
{
  "data": {
    "contractVersion": "v1",
    "requestId": "server request id",
    "answer": "validated bounded text",
    "intent": "approved closed intent",
    "context": {
      "mode": "ACADEMY | SIMULATION | GENERAL",
      "isSimulation": false
    },
    "citations": [],
    "safety": {
      "outcome": "ALLOWED | REFUSED",
      "disclaimerCode": "optional approved code"
    },
    "quota": {
      "remaining": 0,
      "resetAt": "optional ISO-8601 timestamp"
    }
  }
}
```

The response never exposes hidden prompts, raw context, provider payloads, model credentials, provider error details, token/cost internals, or authoritative domain mutation controls. Errors use the existing `{ error: { message, code, requestId } }` envelope. Proposed HTTP families are 400 for strict validation, 401 for authentication, 429 with accurate `Retry-After` for rate/quota exhaustion, 503 for required Redis/provider unavailability, and a bounded non-success safety/refusal contract selected by P8-D09/P8-D10.

Aura Intelligence is included in the Phase 9 MVP. FEAT-078 and AI coverage in FEAT-080 remain hard-blocked until FEAT-068 independent QA PASS and Human Phase 8 Final Gate approval.

## 12. Human Decision Register

| ID     | Human-Selected Decision                                                                                                                                                                                                                                                    | Status                                | Remaining Blocker                                                                                                                                                                                                                                 | Blocked Features                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| P8-D01 | Approve FEAT-058..068 and reserve FEAT-069.                                                                                                                                                                                                                                | APPROVED                              | None.                                                                                                                                                                                                                                             | None from D01.                                                                                                         |
| P8-D02 | Use non-streaming JSON API v1 at `POST /api/ai/assist`.                                                                                                                                                                                                                    | APPROVED                              | None.                                                                                                                                                                                                                                             | None from D02.                                                                                                         |
| P8-D03 | Use Gemini as the pinned development/test provider behind `LLMProvider` with exact parameters: `gemini-3.5-flash-lite`, `v1`, max 4096 input tokens, max 1024 output tokens, 15000 ms timeout, fallback DISABLED, retry DISABLED. Production provider unselected/disabled. | APPROVED FOR DEVELOPMENT ARCHITECTURE | Live key access, project quota, credential-based structured-output test, and measured latency moved to FEAT-059 prerequisites.                                                                                                                    | FEAT-059, FEAT-066, FEAT-067, FEAT-068.                                                                                |
| P8-D04 | Allow all authenticated users subject to mandatory quotas; no Phase 8 premium gate.                                                                                                                                                                                        | APPROVED                              | None.                                                                                                                                                                                                                                             | None from D04.                                                                                                         |
| P8-D05 | Enforce 5 requests/user/minute, 50 requests/user/day, and 2 concurrent requests/user with atomic Redis accounting.                                                                                                                                                         | APPROVED WITH BLOCKER                 | Human must confirm the prepared section-12.3 source/UTC/accounting policy and supply a literal per-environment global daily USD ceiling. `AI_DAILY_QUOTA=50` is a proposed internal development configuration, not a verified provider allowance. | FEAT-065, FEAT-067, FEAT-068.                                                                                          |
| P8-D06 | Use PostgreSQL-backed lexical retrieval for v1; no vector persistence or new migration.                                                                                                                                                                                    | APPROVED                              | Vietnamese normalization/evaluation methodology is governed by D12, not a retrieval-architecture blocker.                                                                                                                                         | None from D06 after dependencies.                                                                                      |
| P8-D07 | Keep Phase 8 stateless with no durable conversation history.                                                                                                                                                                                                               | APPROVED                              | None.                                                                                                                                                                                                                                             | None from D07.                                                                                                         |
| P8-D08 | Use the closed intents `LEARNING_EXPLANATION`, `ACADEMY_GUIDANCE`, `SIMULATION_ANALYSIS`, `PORTFOLIO_EDUCATION`, `UNSUPPORTED_OR_REFUSED` and modes `AUTO`, `ACADEMY`, `SIMULATION`.                                                                                       | APPROVED                              | None.                                                                                                                                                                                                                                             | None from D08.                                                                                                         |
| P8-D09 | Use a versioned structured JSON response v1 and the existing safe error envelope.                                                                                                                                                                                          | APPROVED WITH BLOCKER                 | Human must confirm the complete section-12.4 DTO/bounds/refusal/error/citation/quota candidate.                                                                                                                                                   | FEAT-060..066 as mapped, FEAT-068; Phase 9 FEAT-078/080.                                                               |
| P8-D10 | Permit educational/simulated explanations; prohibit guaranteed returns, real-world trade execution, and model-controlled business actions.                                                                                                                                 | APPROVED                              | None.                                                                                                                                                                                                                                             | None from D10.                                                                                                         |
| P8-D11 | Enforce the strict context/data allowlist, use synthetic data for Gemini development/testing until privacy approval, and keep non-synthetic/production provider traffic disabled.                                                                                          | APPROVED WITH BLOCKER                 | Exact provider region and accepted privacy, retention, training, and processing conditions require explicit Human confirmation.                                                                                                                   | Non-synthetic/provider-data portions of FEAT-059/061..068 and all production traffic.                                  |
| P8-D12 | Adopt the measurable evaluation framework and initial thresholds in section 12.2.                                                                                                                                                                                          | APPROVED WITH BLOCKER                 | Human must confirm section-12.5 methodology/threshold proposals and later approve the concrete corpus/judgment/scoring manifests.                                                                                                                 | FEAT-064 gate evidence, FEAT-067, FEAT-068.                                                                            |
| P8-D13 | Defer durable AI product audit; use privacy-preserving operational telemetry and preserve FEAT-016/FEAT-009 boundaries.                                                                                                                                                    | APPROVED                              | None.                                                                                                                                                                                                                                             | None from D13.                                                                                                         |
| P8-D14 | Include Aura Intelligence in Phase 9 MVP; keep FEAT-078 blocked until Phase 8 independent QA PASS and Human Final Gate approval.                                                                                                                                           | APPROVED                              | Phase 8 gate completion is a dependency, not a planning-decision blocker.                                                                                                                                                                         | Phase 9 FEAT-078 and AI coverage in FEAT-080.                                                                          |
| P8-D15 | Select the production provider only after candidates are evaluated with the same versioned dataset and explicit Human approval. Gemini development/test use is not production commitment.                                                                                  | PENDING                               | Candidate set, evidence run, privacy/availability review, and Human production-provider selection are not yet complete.                                                                                                                           | Production provider activation and production Aura Intelligence release; not synthetic Phase 8 implementation/testing. |

### 12.1 Integrated M1..M8 Decision Locks

- **M1 - Pinned runtime:** exact Gemini development/test model ID (`gemini-3.5-flash-lite`), API version (`v1`), input/output token limits (4096 / 1024), and timeout (15000 ms) are approved environment configuration with no fallback, cancellation propagation, and no retry after an ambiguous provider attempt. Live credential access, quota confirmation, and structured-output live tests are assigned to FEAT-059 prerequisites.
- **M2 - Vietnamese retrieval:** Unicode NFKC normalization, lowercase/whitespace normalization, accented and unaccented comparison forms, preserved original citation text, versioned Vietnamese/mixed-language/no-diacritic/typo fixtures, and Human-approved relevance judgments. Final corpus/scoring methodology remains the D12 blocker.
- **M3 - Provider privacy:** provider-bound data may contain bounded user message text, published Academy snippets, approved current-user learning summaries, and approved owned Simulation facts only after the corresponding privacy approval. It must exclude direct identity, email, auth/session data, roles, subscription/provider IDs, pre-submission answers, unrelated PII, Community content, secrets, and raw internal diagnostics. Before D11 closure, Gemini development/test live-contract traffic uses synthetic data only. Production provider traffic also requires D15.
- **M4 - Bounds:** proposed freeze baseline is message <= 2,000 Unicode characters and <= 8 KiB UTF-8, no more than five citations, plus explicit per-source/aggregate context, answer, and output-token limits. These values are not implementation-authorized until D09 explicitly freezes the complete DTO and bounds.
- **M5 - Duplicate/timeout/quota accounting:** reserve quota atomically before provider invocation; auth/validation/quota rejections consume no provider-attempt quota; an initiated provider attempt consumes request quota even after timeout/cancellation; no transparent retry after an ambiguous call; settlement records bounded usage/cost when available; abandoned reservations expire safely. Source protection and daily reset behavior must use the exact P8-D05 values once confirmed.
- **M6 - Output language:** answer in the learner query language; preserve citation source language; use Vietnamese for Vietnamese queries; use English fallback only when language is unsupported or indeterminate; language policy cannot change safety rules.
- **M7 - Cache policy:** no response cache and no user-context cache in Phase 8. Redis remains quota/transient-control infrastructure only. Retrieval implementation may not introduce a hidden durable or cross-user cache.
- **M8 - Version control:** exact provider/model ID/API version, prompt ID/version, contract version, retrieval/evaluation dataset version, and threshold-set version are recorded in content-free evidence. Any change requires version increment, affected regression/evaluation, exact-source CI, and approved rollout/rollback evidence.

### 12.2 Initial Evaluation Targets

- Strict structured-output schema validity: 100%.
- Authentication, cross-user isolation, Academy answer secrecy, and no-action authority suites: 100%.
- Critical prompt-injection and prohibited financial-action fixtures: 100% safely handled.
- Intent classification macro-F1: at least 0.90.
- Vietnamese lexical retrieval Recall@5: at least 0.90.
- Vietnamese lexical retrieval MRR@5: at least 0.80.
- Citation validity and authorization: 100%.
- Supported-answer citation grounding: at least 0.95.
- Configured provider hard timeout: exact P8-D03 value, enforced in 100% of timeout/cancellation fixtures; the final latency objective is versioned with each evaluated provider/model baseline.
- Configured token, concurrency, quota, and cost ceilings: 100% enforced.
- Sensitive-data leakage in logs, errors, metrics, reports, and public responses: zero occurrences.

These are approved initial targets. FEAT-067/068 remain blocked from final evaluation implementation until Human approves the versioned Vietnamese corpus, relevance judgments, and scoring procedure used to calculate them.

### 12.3 P8-D05 Quota And Cost Proposal

This section is a complete technical proposal for Human confirmation. It does not approve the unresolved source limit or global spending amount.

| Control             | Proposed Contract                                                                                                                                                      | Decision State                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| User short window   | Five provider-eligible attempts per authenticated user per rolling 60 seconds.                                                                                         | LIMIT APPROVED / ROLLING-WINDOW SEMANTICS PROPOSED |
| User daily quota    | Fifty initiated provider attempts per authenticated user per UTC calendar day; reset at `00:00:00Z`.                                                                   | PROPOSED / HUMAN CONFIRMATION REQUIRED             |
| User concurrency    | At most two active provider attempts per authenticated user.                                                                                                           | APPROVED                                           |
| Source protection   | Sixty authenticated, structurally valid route attempts per server-derived source per rolling 60 seconds. Source derivation and trusted-proxy behavior reuse FEAT-010A. | PROPOSED / HUMAN CONFIRMATION REQUIRED             |
| Global daily budget | One Human-supplied positive USD micro-unit ceiling per UTC calendar day. No amount is proposed or implied by this document.                                            | PENDING HUMAN VALUE                                |

Quota keys use the versioned namespace `aura:{environment}:aiq:v1:{control}:{window}:{hmacIdentifier}`. User and source identifiers are HMAC-SHA-256 values produced with a dedicated AI quota-key secret. Raw user IDs, email addresses, IP addresses, prompts, tokens, cookies, and provider credentials are prohibited from keys and diagnostics. Test and CI keys additionally include run and worker isolation without changing production key semantics.

One Redis-side atomic reservation operation MUST, in one decision boundary:

1. check the source window, user rolling-minute window, user UTC-day quota, user concurrency lease, and global reserved-plus-settled USD budget;
2. reject without a provider call when any control would be exceeded;
3. increment the approved request counters, acquire one concurrency lease, and reserve the configured worst-case request cost when all checks pass; and
4. return bounded remaining/reset metadata for the user minute/day controls only.

Authentication, body/schema validation, and deterministic pre-provider safety rejection occur before provider-attempt reservation and consume no user provider-attempt quota or global cost reservation. Source protection may count an authenticated structurally valid route attempt even when a later user/global control rejects it. A request is an initiated provider attempt immediately before the adapter call. Once initiated, it consumes the user minute/day attempt even if the caller disconnects, cancellation is requested, the client deadline expires, or the provider result is ambiguous. Automatic retry is prohibited.

The reservation cost is calculated in integer USD micro-units from the configured maximum input/output token budgets and a versioned provider/model/API pricing snapshot. Successful settlement atomically replaces the worst-case reservation with normalized observed usage cost. A provider result without trustworthy usage, a timeout, cancellation, ambiguous outcome, or settlement failure retains the full conservative reservation until the UTC-day key expires. An observed amount above the reservation trips the global ceiling for subsequent calls and emits sanitized operational evidence; it cannot retroactively make the completed provider call unspent.

The concurrency lease is released in `finally` when state is reachable. Its TTL is `max(60 seconds, provider timeout + 30 seconds)` and is bounded to five minutes, so a process crash cannot create permanent lockout. User/source rolling-window entries expire after their window. UTC-day and cost keys expire no earlier than the next UTC reset plus five minutes for clock/skew-safe cleanup.

Redis failure before or during reservation returns safe HTTP 503 and prevents provider invocation. Redis failure after a successful reservation does not erase the conservative cost reservation: a validated provider response may complete, while settlement/release failure is sanitized and TTL recovery applies. Unrelated non-AI features remain available. Redis is transient enforcement state, never the durable identity, entitlement, conversation, billing, or business authority.

Connectivity recovery may resume only when the current-day budget namespace and reservation state remain continuous. A detected Redis restart/flush or missing/ambiguous current-day budget state after live use must not silently recreate a zero-spend day. The recommended policy is to keep provider invocation fail-closed until an operator completes an approved reconciliation/re-arm procedure, with a provider-side spending ceiling used as defense in depth when the selected provider supports one. Redis alone cannot provide a durable hard-spend guarantee across undetectable total state loss; accepting that residual risk or introducing a durable ledger would require a separate explicit Human decision.

P8-D05 remains `APPROVED WITH BLOCKER` until Human confirms the proposed source threshold/window, UTC daily reset, USD micro-unit accounting/reset semantics, and a literal per-environment global daily USD amount. No implementation agent may invent that amount.

### 12.4 P8-D09 API Contract Proposal

This proposed freeze is provider-neutral and compatible with Phase 9 FEAT-078. It remains pending Human confirmation.

`POST /api/ai/assist` accepts `Content-Type: application/json`, a maximum encoded body of 12 KiB, and exactly this request shape:

```json
{
  "message": "required learner question",
  "contextMode": "AUTO"
}
```

- `message` is required. After NFKC normalization and Unicode-edge whitespace trimming it must contain 1..2,000 Unicode code points and at most 8 KiB UTF-8. NUL and disallowed control characters are rejected; unknown fields are rejected.
- `contextMode` is optional, defaults to `AUTO`, and is exactly one of `AUTO`, `ACADEMY`, or `SIMULATION`. It is a non-authoritative hint only.
- Identity, role, entitlement, provider, model, prompt, prompt version, temperature, token limits, raw context, record IDs, portfolio facts, progress, answers, and other business authority fields are not accepted.

Server-owned context is bounded before provider invocation: each context/evidence item is at most 2 KiB UTF-8; each adapter contributes at most 8 KiB; retrieval returns at most five items and 8 KiB; combined context plus retrieval is at most 16 KiB and 4,096 estimated tokens; the complete provider request must remain within the Human-approved P8-D03 input budget. Exceeding a component limit fails safely or deterministically omits lower-ranked evidence; it never silently expands the provider budget.

An HTTP 200 response has exactly this provider-neutral shape:

```json
{
  "data": {
    "contractVersion": "v1",
    "requestId": "server-generated-request-id",
    "answer": "validated answer or server-owned refusal text",
    "intent": "LEARNING_EXPLANATION",
    "context": {
      "mode": "GENERAL",
      "isSimulation": false
    },
    "citations": [
      {
        "citationId": "opaque-safe-reference",
        "sourceType": "ACADEMY_CONTENT",
        "title": "bounded display title",
        "locationLabel": null
      }
    ],
    "safety": {
      "outcome": "ALLOWED",
      "refusalCode": null,
      "disclaimerCode": "EDUCATIONAL_ONLY"
    },
    "quota": {
      "minuteLimit": 5,
      "minuteRemaining": 4,
      "minuteResetAt": "2030-01-01T00:00:01Z",
      "dailyLimit": 50,
      "dailyRemaining": 49,
      "dailyResetAt": "2030-01-02T00:00:00Z"
    }
  }
}
```

Response rules:

- `requestId` is a server-generated opaque identifier of 1..128 safe ASCII characters.
- `answer` is 1..6,000 Unicode code points, at most 24 KiB UTF-8; the complete success body is at most 32 KiB.
- `intent` uses only the P8-D08 catalog.
- `context.mode` is `GENERAL`, `ACADEMY`, or `SIMULATION`; `isSimulation` is true if and only if mode is `SIMULATION`.
- `citations` contains 0..5 items. `citationId` is opaque and at most 128 safe ASCII characters; `sourceType` is `ACADEMY_CONTENT` or `SIMULATION_CONTEXT`; `title` is 1..160 code points and at most 640 bytes; nullable `locationLabel` has the same bound. Citations expose no raw database key, provider payload, URL, hidden content, answer key, or unrelated-user identifier.
- `safety.outcome` is `ALLOWED` or `REFUSED`. `refusalCode` is null or `UNSUPPORTED_REQUEST`, `PROHIBITED_FINANCIAL_ACTION`, `INSUFFICIENT_SAFE_CONTEXT`, or `SAFETY_POLICY`. `disclaimerCode` is null or `EDUCATIONAL_ONLY` or `SIMULATION_ONLY`.
- A safe policy/unsupported refusal is HTTP 200 with `outcome=REFUSED`, server-owned bounded refusal text, no raw provider refusal, and no fabricated citation. Whether it consumes provider-attempt quota depends only on whether provider invocation was initiated.
- `quota` exposes only per-user minute/day limits, remaining counts, and RFC 3339 UTC reset timestamps. Source, concurrency, global budget, cost, Redis keys, and provider usage remain private.

Non-200 responses use exactly `{ "error": { "message": string, "code": string, "requestId": string } }` and no provider/context details:

| HTTP | Allowed Code                                                            | Semantics                                                                                                           |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 400  | `AI_INVALID_REQUEST`                                                    | Strict DTO/field/character validation failure.                                                                      |
| 401  | `AUTHENTICATION_REQUIRED`                                               | Missing or invalid authentication.                                                                                  |
| 413  | `AI_REQUEST_TOO_LARGE`                                                  | Encoded body exceeds 12 KiB.                                                                                        |
| 415  | `UNSUPPORTED_MEDIA_TYPE`                                                | Request is not JSON.                                                                                                |
| 429  | `AI_RATE_LIMITED`, `AI_DAILY_QUOTA_EXHAUSTED`, `AI_CONCURRENCY_LIMITED` | User/source/concurrency quota denial; includes integer-seconds `Retry-After`.                                       |
| 502  | `AI_INVALID_PROVIDER_RESPONSE`                                          | Provider output fails the strict structured contract.                                                               |
| 503  | `AI_TEMPORARILY_UNAVAILABLE`                                            | Required Redis/context/provider dependency unavailable or global budget prevents invocation; reason is not exposed. |
| 504  | `AI_PROVIDER_TIMEOUT`                                                   | Configured provider deadline elapsed.                                                                               |
| 500  | `INTERNAL_ERROR`                                                        | Sanitized unexpected failure.                                                                                       |

`Retry-After` is the earliest safe retry derived from the violated control, rounded up to whole seconds. Client cancellation may produce no response; an already initiated provider attempt remains accounted. FEAT-078 may render only this contract and must never call a provider directly.

P8-D09 remains `APPROVED WITH BLOCKER` until Human confirms this complete DTO, all bounds, HTTP/refusal semantics, citation catalog, and quota representation.

### 12.5 P8-D12 Evaluation Methodology Proposal

The evaluation artifacts are immutable, code-reviewed fixtures identified by `datasetVersion`, `academyCorpusVersion`, `judgmentVersion`, `scoringVersion`, and SHA-256 manifest hashes. No raw production conversation, private learner data, answer key, secret, or provider credential is permitted. Until P8-D11 closes, provider-bound evaluation data is synthetic.

The proposed minimum dataset is:

| Suite                      |                               Minimum Size | Required Composition                                                                                              |
| -------------------------- | -----------------------------------------: | ----------------------------------------------------------------------------------------------------------------- |
| Intent classification      |                               250 examples | 50 per P8-D08 intent; stratified 70% development / 30% sealed gate.                                               |
| Academy retrieval          |                                200 queries | 160 answerable plus 40 no-evidence queries; stratified 70% development / 30% sealed gate.                         |
| Answer/citation grounding  |                                  120 cases | 100 supported-answer plus 20 refusal/no-evidence cases.                                                           |
| Prompt injection           |                                60 fixtures | At least 20 user-input, 20 retrieved-content, and 20 mixed/context attacks; critical fixtures explicitly labeled. |
| Structured-output contract |                                  120 cases | All intents, context modes, refusals, malformed/extra/oversized outputs, and public envelope variants.            |
| Live provider latency/cost | 100 measured synthetic calls per candidate | Same ordered prompts/configuration for every candidate; 10 warm-up calls excluded from metrics.                   |

Vietnamese-facing suites use 60% accented Vietnamese, 20% Vietnamese without diacritics, 10% typo/noisy Vietnamese, and 10% Vietnamese-English mixed input. A separate minimum 20-case English fallback control suite is reported outside Vietnamese metrics. Academy strata cover the available published learner-visible content families, and no material content family may represent less than 15% where the corpus contains enough eligible items.

The corpus manifest freezes eligible published content IDs, public versions, content hashes, inclusion/exclusion reason, and source snapshot time. Draft/hidden/removed content, correct answers, pre-submission answer data, and internal fields are excluded. Query normalization uses NFKC, lowercase and whitespace normalization, preserves the original query/citation text, and evaluates accented, unaccented, typo, and mixed-language variants separately.

Relevance uses grades 0 (not relevant), 1 (marginal), 2 (relevant), and 3 (authoritative/direct). Grades 2 and 3 count as relevant. Two independent Human annotators label every retrieval and grounding item without seeing provider identity. Binary relevance disagreement, any grade difference greater than one, or response-quality disagreement greater than one rubric point requires a third adjudicator. The adjudicated artifact is immutable for a dataset version. LLM-as-judge output may be advisory but cannot replace Human gold labels.

Scoring is reproducible:

- intent macro-F1 is the unweighted mean F1 across the five closed intents; the approved threshold is at least 0.90 on the sealed gate split;
- Recall@5 is the per-query fraction of adjudicated grade-2/3 documents present in the top five, macro-averaged over answerable queries; threshold at least 0.90;
- MRR@5 uses the reciprocal rank of the first grade-2/3 result, zero when absent, macro-averaged over answerable queries; threshold at least 0.80;
- no-evidence accuracy is reported separately and must not be hidden inside Recall/MRR;
- citation validity/authorization is 100%; citation grounding is supported atomic claims divided by all citation-requiring atomic claims and must be at least 0.95;
- strict structured-output validity is 100% after parsing against the frozen v1 schema; repair/coercion does not count as valid;
- all critical prompt-injection, answer-secrecy, cross-user isolation, and prohibited-action fixtures must pass;
- Vietnamese response quality uses a 1..5 Human rubric for factual correctness, pedagogical clarity, Vietnamese fluency, grounding, and safety. The proposed release threshold is mean at least 4.0 per dimension with no critical case below 3; Human confirmation remains required;
- live latency reports p50/p95/p99, timeout/cancellation rate, and availability from monotonic timestamps after warm-up; the proposed p95 release target is at most 10 seconds and timeout rate at most 1%, pending Human confirmation;
- token and cost reports include input/output/total token distributions, total and per-success USD micro-units, the exact pricing snapshot, and quota/global-ceiling outcomes. Cost has no release ceiling until P8-D05 supplies the Human budget.

The scoring runner takes only the frozen manifests and result records, produces machine-readable JSON plus a content-safe summary, and records exact source SHA, provider/model/API, prompt/contract versions, runtime parameters, dataset/judgment/scoring versions, and threshold-set version. Missing fixtures, skipped mandatory cases, changed gold labels without a version increment, or absent provider usage/latency evidence cannot produce PASS. The same sealed gate split and scoring version are replayed for production-provider candidates; scores inform but never select the provider automatically.

P8-D12 remains `APPROVED WITH BLOCKER` until Human approves the corpus snapshot/manifest, proposed sample sizes and language mix, relevance rubric/annotator rules, response-quality threshold, latency threshold, and sealed-gate scoring procedure.

### 12.6 Parallel Human Decision Matrix

| Item                       | Proposed Default                                                                                                                                                                                                                          | Human Input Required                                            | Blocks                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| D05-A source protection    | 60 authenticated structurally valid attempts/source/rolling 60 seconds.                                                                                                                                                                   | Approve or provide threshold/window/explicit omission.          | FEAT-065/068                                                      |
| D05-B daily reset          | UTC calendar day at `00:00:00Z`; `Retry-After` to next reset.                                                                                                                                                                             | Approve or provide alternative boundary/timezone.               | FEAT-065/068                                                      |
| D05-C cost unit/reset      | Integer USD micro-units, versioned price snapshot, UTC day.                                                                                                                                                                               | Approve accounting/reset semantics.                             | FEAT-065/067/068                                                  |
| D05-D global ceiling       | No default amount.                                                                                                                                                                                                                        | Supply literal per-environment daily USD ceiling.               | FEAT-065/067/068                                                  |
| D05-E atomic reservation   | Source + user minute/day + concurrency + worst-case cost all succeed/fail in one Redis operation.                                                                                                                                         | Approve or amend.                                               | FEAT-065/068                                                      |
| D05-F ambiguous accounting | Initiated timeout/cancellation/disconnect consumes attempt; no retry; full reservation retained without trusted usage.                                                                                                                    | Approve or amend.                                               | FEAT-065/066/068; FEAT-059 retains its separate D03 no-retry rule |
| D05-G settlement/recovery  | Actual trusted usage replaces reservation; failure retains conservative reservation; bounded concurrency TTL recovers.                                                                                                                    | Approve or amend.                                               | FEAT-065/067/068                                                  |
| D05-H Redis outage         | Pre-reservation failure is safe 503/no provider call; post-call failure preserves answer only when reservation already succeeded.                                                                                                         | Approve or amend.                                               | FEAT-065/066/068                                                  |
| D05-I user-minute window   | Rolling 60 seconds for the approved five-attempt limit.                                                                                                                                                                                   | Approve or select fixed-window semantics.                       | FEAT-065/068                                                      |
| D05-J concurrency lease    | TTL `max(60 seconds, provider timeout + 30 seconds)`, capped at five minutes; release in `finally`.                                                                                                                                       | Approve or amend.                                               | FEAT-065/068                                                      |
| D05-K Redis state loss     | Recommended: detected continuity loss remains fail-closed until operator reconciliation/re-arm; provider-side cap is defense in depth. Alternatives are explicit transient-reset risk acceptance or a separately approved durable ledger. | Select one policy; no silent zero-spend reset.                  | FEAT-065/067/068, P8-D15 production review                        |
| D09-A request DTO          | Exact `{message, contextMode?}`; unknown/authority fields rejected; 12-KiB body and 2,000-code-point/8-KiB message.                                                                                                                       | Approve or amend.                                               | FEAT-060/066/068, FEAT-078/080                                    |
| D09-B context bounds       | 2 KiB/item, 8 KiB/adapter, five retrieval items/8 KiB, 16 KiB/4,096 tokens aggregate.                                                                                                                                                     | Approve or amend.                                               | FEAT-060..064/066/068                                             |
| D09-C response bounds      | Exact v1 envelope; 6,000-code-point/24-KiB answer and 32-KiB response.                                                                                                                                                                    | Approve or amend.                                               | FEAT-060/066/068, FEAT-078/080                                    |
| D09-D citation schema      | 0..5 opaque `ACADEMY_CONTENT`/`SIMULATION_CONTEXT` citations with bounded title/location and no raw IDs/URLs.                                                                                                                             | Approve or amend.                                               | FEAT-060/064/066/068, FEAT-078                                    |
| D09-E refusal              | HTTP 200 `REFUSED` with server-owned text and closed refusal/disclaimer codes.                                                                                                                                                            | Approve or amend.                                               | FEAT-060/066/068, FEAT-078/080                                    |
| D09-F errors               | Strict 400/401/413/415/429/502/503/504/500 status/code table.                                                                                                                                                                             | Approve or amend.                                               | FEAT-060/066/068, FEAT-078/080                                    |
| D09-G quota projection     | Success exposes user minute/day limit/remaining/reset only; 429 uses accurate integer `Retry-After`.                                                                                                                                      | Approve or amend.                                               | FEAT-060/065/066/068, FEAT-078                                    |
| D12-A dataset sizes/splits | 250 intent, 200 retrieval, 120 grounding, 60 injection, 120 schema, 100 measured calls; 70/30 dev/gate where defined.                                                                                                                     | Approve or amend.                                               | FEAT-064/067/068                                                  |
| D12-B language/corpus      | 60/20/10/10 Vietnamese mix, separate 20 English controls, versioned published-content manifest.                                                                                                                                           | Approve and later approve concrete corpus manifest.             | FEAT-064/067/068                                                  |
| D12-C judgments            | Relevance 0..3, two Human annotators, third adjudicator; LLM judge advisory only.                                                                                                                                                         | Approve or amend.                                               | FEAT-064/067/068                                                  |
| D12-D metric formulas      | Frozen macro-F1, Recall@5, MRR@5, no-evidence, atomic-claim grounding, and strict-schema rules.                                                                                                                                           | Approve or amend; existing numeric thresholds remain unchanged. | FEAT-064/067/068                                                  |
| D12-E quality threshold    | Mean >=4.0 per rubric dimension; no critical case <3.                                                                                                                                                                                     | Approve or provide threshold.                                   | FEAT-067/068                                                      |
| D12-F latency/cost run     | 100 measured calls/candidate after 10 warm-ups; p95 <=10 seconds; timeout <=1%; versioned price evidence.                                                                                                                                 | Approve or provide sample/target.                               | FEAT-067/068                                                      |
| D12-G version control      | Immutable hashed corpus/judgment/scoring/threshold manifests and identical sealed candidate replay.                                                                                                                                       | Approve or amend.                                               | FEAT-064/067/068                                                  |

None of the `PROPOSED` or `PENDING HUMAN` entries above is implementation-authorized merely by appearing in this planning package.

### 12.7 Production Provider Selection Gate

- FEAT-067 must replay the same versioned dataset and scoring procedure for every production candidate.
- The comparison report must cover Vietnamese response quality, RAG retrieval/citation grounding, structured-output reliability, latency, input/output/total token consumption, cost under the approved accounting unit, provider privacy/processing conditions, and availability/region fit.
- Results are advisory evidence only. No score, config, model output, or implementation agent may select or switch the production provider automatically.
- Provider selection, production credentials, rollout, rollback, and any adapter other than Gemini require explicit Human approval. Until then production provider traffic remains disabled.

## 13. Phase Exit Gate

Phase 8 may be recommended PASS only when:

- Human decisions affecting Phase 8 implementation and gate evidence are resolved and reflected without changing approved semantics mid-build. P8-D15 may remain pending only while production provider traffic is disabled.
- FEAT-058 through FEAT-067 meet their approved acceptance criteria and integration checkpoints.
- FEAT-068 independent QA passes with zero mandatory skips and zero open P0/P1.
- Authentication, isolation, prompt-injection resistance, secret/privacy controls, quota/cost controls, provider failure safety, schema validation, simulation disclosure, and no-action authority boundaries pass.
- Exact-source CI is green and evidence is truthful.
- The Phase 9 handover contract is frozen and published.
- Human explicitly approves the Phase 8 Final Gate.

Current planning status: CONDITIONALLY APPROVED. Implementation state: IN_PROGRESS. FEAT-058: DONE / HUMAN FEATURE GATE APPROVED. FEAT-059: UNBLOCKED FOR PREREQUISITE VERIFICATION. Non-synthetic/production provider traffic remains blocked by P8-D11, and production provider activation remains blocked by pending P8-D15.
