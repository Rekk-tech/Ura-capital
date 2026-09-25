# FEAT-078 Acceptance Criteria: Aura Intelligence UI Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW

- AC-001 No AI route is implemented before P9-D02 approval and a frozen, QA-passed Phase 8 client contract.
- AC-002 Browser bundles and network behavior contain no Gemini/provider SDK, endpoint, API key, or direct provider request.
- AC-003 Only schema-valid gateway output renders; HTML/script/unsafe URL or malformed structured output is rejected safely.
- AC-004 Every assistant response surface carries clear education/simulation/non-advisory framing and never guarantees outcomes.
- AC-005 Context indicators use only safe gateway fields and reveal no hidden prompt, secret, raw private record, or internal retrieval detail.
- AC-006 Cancellation, refusal, safety, quota, 429, 503, malformed, and generic failures are deterministic and never fabricate an answer.
- AC-007 Assistant input/output/status interaction is responsive and accessible, including keyboard and screen-reader behavior.
- AC-008 Targeted security/browser tests and Phase 8 regressions pass with zero Phase 9 backend/schema/migration/provider change.

## Traceability Matrix

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

## Verdict Rule

PASS requires AC-001 through AC-008 with no mandatory skip, no P0/P1, no scope expansion, truthful evidence, and exact-source CI green. Otherwise FAIL and map each defect to the owning requirement.

