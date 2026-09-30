# FEAT-068 Tasks: Phase 8 Integration, Security & Phase 9 Handover Gate

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Verify checkpoints, Human decisions, exact integration source, and validation-only diff. (FR-001; AC-001).
- [ ] T002 Test auth/access/context/schema and server/model/client authority boundaries. (FR-002; AC-002).
- [ ] T003 Test `LLMProvider` conformance, Gemini development/test isolation, secrets, failure/retry/malformed behavior, no DeepSeek implementation, no fallback, and provider contract behavior. (FR-003; AC-003).
- [ ] T004 Run prompt/intent/injection/RAG/citation/Academy/Simulation security evaluation. (FR-004; AC-004).
- [ ] T005 Run live Redis quota/cost/concurrency/outage/recovery validation. (FR-005; AC-005).
- [ ] T006 Validate telemetry/privacy/same-dataset provider-comparison readiness/evaluation/product-audit and FEAT-009 invariance. (FR-006; AC-006).
- [ ] T007 Validate migrations/live PostgreSQL/live Redis and all authoritative guards. (FR-007; AC-007).
- [ ] T008 Run runtime E2E, adversarial flows, canonical suites, Phase 2-7 regression, and exact-source CI. (FR-008; AC-008).
- [ ] T009 Freeze and publish the provider-neutral Phase 9 handover contract/evidence and explicit P8-D11/P8-D15 production block. (FR-009; AC-009).
- [ ] T010 Publish the independent Phase 8 QA report with defect ownership and PASS/FAIL recommendation. (FR-010; AC-010).

## M1..M8 Task Traceability

- M1 -> FR-003 and FR-008/T003 and T008/AC-003 and AC-008: verify pinned runtime, timeout, cancellation, retry, model/API/token versions.
- M2 -> FR-004 and FR-008/T004 and T008/AC-004 and AC-008: verify versioned Vietnamese retrieval corpus, scoring, thresholds, and citations.
- M3 -> FR-002..003 and FR-006/T002..T003 and T006/AC-002..003 and AC-006: verify provider allowlist, privacy, synthetic tests, and zero leakage.
- M4 -> FR-002 and FR-009/T002 and T009/AC-002 and AC-009: verify frozen DTOs, bounds, refusal/error/quota semantics, and Phase 9 handover.
- M5 -> FR-003, FR-005, and FR-008/T003, T005, and T008/AC-003, AC-005, and AC-008: verify duplicate/timeout/quota/cost accounting.
- M6 -> FR-004 and FR-009/T004 and T009/AC-004 and AC-009: verify query-language answers, citation language, and invariant safety disclosure.
- M7 -> FR-002 and FR-007/T002 and T007/AC-002 and AC-007: verify no response/user-context cache and Redis transient-only authority.
- M8 -> FR-003..004, FR-006, and FR-009/T003..T004, T006, and T009/AC-003..004, AC-006, and AC-009: verify versioned change control and regression evidence.
- P8-D05/D09/D12 proposals -> FR-002, FR-004..006, FR-008..009/T002, T004..T006, T008..T009/AC-002, AC-004..006, AC-008..009: after Human approval, independently reproduce sections 12.3..12.5 and reject any unapproved value, skipped mandatory evidence, shifted metric, or Phase 9 contract drift.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its independent validation and mapped evidence pass on the exact source. FEAT-068 PASS establishes readiness only; it does not imply Human Final Gate approval.
