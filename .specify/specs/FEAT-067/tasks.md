# FEAT-067 Tasks: AI Observability & Provider Evaluation Harness

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- [ ] T001 Implement request/trace correlation with content-free identity handling. (FR-001; AC-001).
- [ ] T002 Implement bounded provider/model/API-aware operational telemetry and normalized usage/cost fields. (FR-002; AC-002).
- [ ] T003 Implement label allowlists/cardinality controls. (FR-003; AC-003).
- [ ] T004 Apply diagnostic sanitization and leakage probes. (FR-004; AC-004).
- [ ] T005 Create one versioned deterministic, provider-replayable evaluation dataset and fixtures covering Vietnamese quality and grounding. (FR-005; AC-005).
- [ ] T006 Implement Human-approved threshold evaluation plus quality/grounding/schema/latency/token/cost/privacy/availability comparison evidence and hard-fail rules. (FR-006; AC-006).
- [ ] T007 Implement fake/live-contract isolation and mandatory-evidence checks. (FR-007; AC-007).
- [ ] T008 Enforce observability/product-audit separation and FEAT-009 invariance. (FR-008; AC-008).
- [ ] T009 Test that telemetry/evaluation has zero business-authority effect. (FR-009; AC-009).
- [ ] T010 Run evaluation/security/regression/canonical CI and publish reproducible provider/model/API/dataset-version evidence without selecting the production provider. (FR-010; AC-010).

## M1..M8 Task Traceability

- M2 -> FR-005..006 and FR-010/T005..T006 and T010/AC-005..006 and AC-010: version Vietnamese corpus/relevance/scoring and enforce approved retrieval thresholds.
- M3 -> FR-001..004/T001..T004/AC-001..004: telemetry/provider evaluation obeys the strict data allowlist and synthetic-live-test policy.
- M5 -> FR-002 and FR-006/T002 and T006/AC-002 and AC-006: record bounded attempt/usage/cost outcomes and evaluate global ceiling enforcement.
- M6 -> FR-005/T005/AC-005: evaluation fixtures cover Vietnamese, English fallback, and source-language citations.
- M8 -> FR-002, FR-005..006, and FR-010/T002, T005..T006, and T010/AC-002, AC-005..006, and AC-010: version every model/prompt/contract/corpus/threshold change and rerun affected evaluation.
- P8-D12 proposal -> FR-005..007 and FR-010/T005..T007 and T010/AC-005..007 and AC-010: after Human approval, implement the exact section-12.5 manifests, sample sizes/splits, annotation/adjudication, formulas, quality/safety/latency/cost outputs, skipped-evidence hard fail, and same-dataset provider replay.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
