# FEAT-067 Acceptance Criteria: AI Observability & Provider Evaluation Harness

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 Every AI request is correlatable while raw input/output/context and sensitive identity remain absent from telemetry.
- AC-002 Approved provider/model/API/prompt/intent/outcome/latency/token/cost fields are recorded in bounded normalized form.
- AC-003 Metric labels are allowlisted and bounded; prohibited high-cardinality or sensitive values cannot be emitted.
- AC-004 Independent diagnostic probes reveal no secret, URL, credential, token, cookie, sensitive path, or context fragment.
- AC-005 One versioned provider-replayable dataset covers Vietnamese response quality, retrieval/citation grounding, intent/schema/safety/injection/secrecy/disclosure/isolation dimensions deterministically.
- AC-006 Evaluation applies exact Human-approved thresholds and reports quality, grounding, structured-output reliability, latency, token use, cost, privacy, and availability comparably; missing, missed, or silently changed criteria fail.
- AC-007 Fakes/fixtures cannot activate in production-like modes, and skipped mandatory live/contract evidence cannot produce PASS.
- AC-008 Observability remains distinct from durable product audit and AuthSecurityAuditRecord/taxonomy remain unchanged.
- AC-009 Telemetry/evaluation changes no authorization, entitlement, grading, progress, trading, provider selection, or response outcome.
- AC-010 Reports identify exact source/provider/model/API/prompt/dataset/fixture/threshold versions, contain no prohibited content, make no automatic production selection, and regression/exact-source CI passes with zero migration.

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

- M2 -> FR-005..006 and FR-010/T005..T006 and T010/AC-005..006 and AC-010: version Vietnamese corpus/relevance/scoring and enforce approved retrieval thresholds.
- M3 -> FR-001..004/T001..T004/AC-001..004: telemetry/provider evaluation obeys the strict data allowlist and synthetic-live-test policy.
- M5 -> FR-002 and FR-006/T002 and T006/AC-002 and AC-006: record bounded attempt/usage/cost outcomes and evaluate global ceiling enforcement.
- M6 -> FR-005/T005/AC-005: evaluation fixtures cover Vietnamese, English fallback, and source-language citations.
- M8 -> FR-002, FR-005..006, and FR-010/T002, T005..T006, and T010/AC-002, AC-005..006, and AC-010: version every model/prompt/contract/corpus/threshold change and rerun affected evaluation.
- P8-D12 proposal -> FR-005..007 and FR-010/T005..T007 and T010/AC-005..007 and AC-010: after explicit Human approval, QA must reproduce section-12.5 scoring from approved manifest hashes and exact source. Unapproved thresholds, unadjudicated labels, or skipped provider evidence cannot pass.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
