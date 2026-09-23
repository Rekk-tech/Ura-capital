# FEAT-058 Requirement: Provider-Independent AI Gateway Foundation & Configuration

Status: DONE / HUMAN FEATURE GATE APPROVED / CHECKPOINT PUBLISHED
Phase: Phase 8 - Aura Intelligence
Type: Implementation foundation

## Goal

Establish the Aura Intelligence module boundary, validated configuration, dependency contracts, and safe startup behavior without exposing assistant product behavior.

## Functional Requirements

- FR-001 Create one modular-monolith AI gateway module that is the only authorized entry boundary for future model-backed application behavior.
- FR-002 Validate explicit AI enablement, provider selection, Gemini development/test credentials, exact model identifier (`gemini-3.5-flash-lite`), API version (`v1`), input/output token limits (4096 / 1024), timeout (15000 ms), and approved budget-related configuration at startup when AI is enabled; no secret, provider, model, or legacy fallback is allowed.
- FR-003 Define a narrow provider-independent `LLMProvider` port for response generation, structured output requests/results, normalized token usage, normalized errors, timeout/cancellation, plus separate context, retrieval, quota, clock, and telemetry ports; no provider SDK type may escape an adapter.
- FR-004 Permit deterministic fake infrastructure only in approved local, test, and CI modes; staging, production, production-like, unknown, or conflicting modes must fail closed.
- FR-005 Keep controllers and ordinary services free of Gemini SDK, Prisma delegate, raw SQL, and direct Redis-client dependencies.
- FR-006 Sanitize startup and dependency-resolution failures so secrets, URLs, credentials, hosts, ports, provider payloads, and sensitive absolute paths are not exposed.
- FR-007 Keep Gemini/provider credentials server-side and outside version control; prevent provider keys and AI secrets from entering committed files, responses, browser bundles, Redis keys, ordinary logs, implementation/QA reports, or test snapshots.
- FR-008 Introduce no assistant endpoint, provider call, business mutation, durable AI state, schema, migration, or Phase 9 UI behavior.
- FR-009 Provide dependency injection and deterministic test doubles that cannot be selected implicitly in production-like environments.
- FR-010 Add unit/static/configuration tests and run canonical regression sufficient to prove the boundary without claiming downstream AI behavior.

## Non-Functional Requirements

- Security and privacy controls fail closed and preserve server authority.
- Resource use is bounded, observable, deterministic under test, and compatible with multi-instance deployment.
- Errors and diagnostics use existing sanitization and disclose no secrets or sensitive infrastructure.
- Existing Phase 2-7 behavior and authoritative guards must remain green.

## Dependencies

P8-D01 approval; P8-D03 approval for development architecture (`gemini-3.5-flash-lite`, `v1`, 4096 in, 1024 out, 15000 ms, fallback/retry disabled); phase-7-approved; ADR-001, ADR-005, and ADR-006. Live Gemini API execution, replacement key validation, project-quota confirmation, and live structured-output smoke tests are delegated to FEAT-059 prerequisites. P8-D11 and P8-D15 block production provider activation, not provider-independent foundation work that uses synthetic data.

## Ownership

AI module composition, configuration schema, the provider-independent `LLMProvider` port, dependency injection, safe disabled/enabled startup behavior, and deterministic infrastructure test doubles.

## Out Of Scope

Gemini adapter invocation behavior, DeepSeek or any second provider adapter, provider routing/fallback, prompts, context retrieval, quotas, a public assistant endpoint, UI, durable AI data, and all product-domain mutations.

## Migration Ownership

ZERO. No Prisma schema or migration change is permitted.

## Human Decision Lock

- P8-D01: APPROVED - FEAT-058..068 are allocated and FEAT-069 is reserved.
- P8-D03: APPROVED FOR DEVELOPMENT ARCHITECTURE - Gemini is the development/test provider behind `LLMProvider` with pinned settings (`gemini-3.5-flash-lite`, `v1`, 4096 in, 1024 out, 15000 ms timeout, fallback DISABLED, retry DISABLED, production activation DISABLED). Live key access, project quota verification, and structured-output live smoke test are delegated to FEAT-059 prerequisites.
- P8-D11: APPROVED WITH BLOCKER - synthetic test data and the strict data allowlist apply now; provider region and privacy/retention/training/processing conditions remain required before non-synthetic or production provider traffic.
- P8-D15: PENDING - the production provider is selected later by Human approval after versioned comparative evaluation; no implementation may assume Gemini is permanent production infrastructure.
- Implementation readiness: APPROVED FOR IMPLEMENTATION. Production activation remains separately blocked by P8-D11 and P8-D15.
