# FEAT-068 Acceptance Criteria: Phase 8 Integration, Security & Phase 9 Handover Gate

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 FEAT-058..067 checkpoints and applicable P8 decisions are exact and approved, and the FEAT-068 diff adds zero product/schema/migration behavior.
- AC-002 Auth, access, context ownership, strict schemas, and no client/model business-authority tests pass.
- AC-003 `LLMProvider` conformance, Gemini development/test boundary, secret isolation, timeout/cancellation/retry/error/malformed behavior, no DeepSeek implementation, no automatic fallback, and mandatory provider contract evidence pass.
- AC-004 Prompt/version/intent/injection/RAG/citation, Academy answer secrecy, and Simulation ownership/disclosure evaluations meet approved thresholds.
- AC-005 Live Redis limit/quota/cost/concurrency/multi-instance/outage/recovery/namespace/TTL tests pass and blocked requests never reach the provider.
- AC-006 Telemetry/privacy/evaluation/product-audit controls and same-dataset provider-comparison readiness pass, while FEAT-009 auth-audit schema/taxonomy/semantics remain unchanged.
- AC-007 Fresh migrations, current-schema compatibility, Phase 8 migration ownership, live PostgreSQL/Redis, and all authoritative guards pass with zero mandatory skips.
- AC-008 Runtime E2E, adversarial security, canonical suites, Phase 2-7 regression, and exact-source CI are green with truthful counts.
- AC-009 One frozen provider-neutral Human-approved Phase 9 contract is published; FEAT-078/080 dependencies, security/error/cancellation semantics, and the P8-D11/P8-D15 production block are explicit.
- AC-010 Independent QA reports PASS only with zero open P0/P1 and truthful evidence; Phase 8 remains pending Human Final Gate and Phase 9 implementation is not started.

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

- M1 -> FR-003 and FR-008/T003 and T008/AC-003 and AC-008: verify pinned runtime, timeout, cancellation, retry, model/API/token versions.
- M2 -> FR-004 and FR-008/T004 and T008/AC-004 and AC-008: verify versioned Vietnamese retrieval corpus, scoring, thresholds, and citations.
- M3 -> FR-002..003 and FR-006/T002..T003 and T006/AC-002..003 and AC-006: verify provider allowlist, privacy, synthetic tests, and zero leakage.
- M4 -> FR-002 and FR-009/T002 and T009/AC-002 and AC-009: verify frozen DTOs, bounds, refusal/error/quota semantics, and Phase 9 handover.
- M5 -> FR-003, FR-005, and FR-008/T003, T005, and T008/AC-003, AC-005, and AC-008: verify duplicate/timeout/quota/cost accounting.
- M6 -> FR-004 and FR-009/T004 and T009/AC-004 and AC-009: verify query-language answers, citation language, and invariant safety disclosure.
- M7 -> FR-002 and FR-007/T002 and T007/AC-002 and AC-007: verify no response/user-context cache and Redis transient-only authority.
- M8 -> FR-003..004, FR-006, and FR-009/T003..T004, T006, and T009/AC-003..004, AC-006, and AC-009: verify versioned change control and regression evidence.
- P8-D05/D09/D12 proposals -> FR-002, FR-004..006, FR-008..009/T002, T004..T006, T008..T009/AC-002, AC-004..006, AC-008..009: PASS requires exact Human-approved section-12.3..12.5 evidence and concrete manifest hashes; proposal text alone cannot satisfy any AC.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
