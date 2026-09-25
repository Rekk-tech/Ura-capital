# FEAT-078 Specification: Aura Intelligence UI Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION_NOT_STARTED

## 1. Architecture Contract

- Objective: Integrate the Human-approved Aura Intelligence gateway into a safe, accessible learner assistant without moving provider, context, quota, or safety authority into the browser.
- API: Consumes only the future Human-approved Phase 8 gateway contract. Endpoint names, payloads, streaming mode, persistence, and quota fields remain TBD until Phase 8 freezes them; this spec invents none.
- Persistence: ZERO Phase 9 database or migration changes; any conversation persistence is owned by Phase 8.
- Security: No browser Gemini/provider SDK or provider secret. Prompt construction, context resolution, intent classification, quotas, structured validation, and guardrails remain in the server AI gateway.
- Ownership: Owns AI assistant frontend rendering and interaction after Phase 8 contract freeze. Excludes gateway/provider implementation, RAG, prompt/version management, context authority, quota decisions, model selection, and durable conversation storage.

## 2. Functional Contract

### FR-001

Add the AI assistant route only when Human includes AI in the Production MVP and Phase 8 freezes its client contract.

### FR-002

Send requests only to the authenticated internal AI gateway and never directly to Gemini or another provider.

### FR-003

Render only validated structured gateway responses and sanitize all model-supplied text/links before DOM insertion.

### FR-004

Clearly disclose educational/simulation context, uncertainty, and non-advisory limitations without implying guaranteed outcomes.

### FR-005

Represent context availability and provenance at the safe level returned by Phase 8 without exposing private source internals.

### FR-006

Handle loading, cancellation, refusal, guardrail, quota/rate-limit, unavailable, malformed-response, and generic error states.

### FR-007

Meet responsive, keyboard, focus, semantic, live-region, contrast, and reduced-motion requirements for assistant interaction.

### FR-008

Test gateway-only networking, injection-safe rendering, quota/guardrail states, accessibility, privacy, and Phase 8 regressions.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, validation/rate-limit/unavailable, and generic failure as applicable. UI copy must be safe, bounded, and must not expose stack traces, provider details, database details, secrets, tokens, cookies, or sensitive paths.

## 4. Data and Authority Contract

ZERO Phase 9 database or migration changes; any conversation persistence is owned by Phase 8. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1. Self-verification is not independent QA.

