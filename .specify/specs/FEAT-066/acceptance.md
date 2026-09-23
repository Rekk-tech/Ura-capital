# FEAT-066 Acceptance Criteria: Aura Intelligence Orchestration API & Safety Guardrails

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 Only the approved authenticated route exists; missing/invalid auth fails before context resolution or provider invocation.
- AC-002 Client user/role/entitlement/model/prompt/context claims cannot affect server-derived authority.
- AC-003 Instrumentation proves the approved pipeline order, quota/validation failures happen before invocation, and orchestration depends only on `LLMProvider` rather than Gemini or another concrete adapter.
- AC-004 Allowed educational requests and prohibited guarantee/personalized real-world execution requests follow the approved safety matrix deterministically.
- AC-005 Every Simulation-derived response has the approved simulation disclosure and no real-world brokerage authority implication.
- AC-006 Responses/errors conform exactly to the strict versioned safe envelope with bounded citations and only approved quota metadata.
- AC-007 Timeout, cancellation, unavailable, refusal, malformed output, and dependency failures return safe non-success with no fabricated content and no automatic provider/model fallback.
- AC-008 No public/internal model action can mutate any listed domain or become business authority.
- AC-009 Runtime logs/errors contain no raw prompt, response, context, provider payload, secret, token, cookie, or sensitive infrastructure/path.
- AC-010 Valid and adversarial API/runtime/provider-neutral/no-fallback/security/Phase 2-7 regression and exact-source CI pass with zero migration and no Phase 9 UI.

## Traceability

| Requirement | Task | Acceptance |
|---|---|---|
| FR-001 | T001 | AC-001 |
| FR-002 | T002 | AC-002 |
| FR-003 | T003 | AC-003 |
| FR-004 | T004 | AC-004 |
| FR-005 | T005 | AC-005 |
| FR-006 | T006 | AC-006 |
| FR-007 | T007 | AC-007 |
| FR-008 | T008 | AC-008 |
| FR-009 | T009 | AC-009 |
| FR-010 | T010 | AC-010 |

## M1..M8 Acceptance Traceability

- M4 -> FR-001, FR-006, and FR-007/T001, T006, and T007/AC-001, AC-006, and AC-007: enforce frozen request/response/citation/context/output bounds and exact error/refusal semantics.
- M5 -> FR-003 and FR-007/T003 and T007/AC-003 and AC-007: quota reservation precedes provider use and timeout/cancellation follows approved accounting with no ambiguous retry.
- P8-D05/D09 proposals -> FR-001..003, FR-006..007, and FR-010/T001..T003, T006..T007, and T010/AC-001..003, AC-006..007, and AC-010: after explicit Human approval, runtime/API evidence must match sections 12.3/12.4 exactly; prepared values alone do not satisfy acceptance.
- M6 -> FR-004..006/T004..T006/AC-004..006: answer follows query language while citations retain source language and simulation/safety text remains mandatory.
- M7 -> FR-008/T008/AC-008: stateless orchestration has no response or user-context cache.
- M8 -> FR-003, FR-006, and FR-010/T003, T006, and T010/AC-003, AC-006, and AC-010: record and regression-gate model, prompt, contract, corpus, and threshold versions.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
