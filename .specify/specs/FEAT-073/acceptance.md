# FEAT-073 Acceptance Criteria: Academy Experience Integration & Polish

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW

- AC-001 All approved Academy learner routes are reachable through the shared shell without route duplication or broken deep links.
- AC-002 Academy clients use only approved contracts and no backend, schema, migration, CMS, or audit behavior is added.
- AC-003 No correct answer leaks before submission; grading, completion, XP, and reward results are server-derived.
- AC-004 Continue-learning/progress UI reflects approved persisted facts and never computes authoritative completion or reward state.
- AC-005 Educational content remains sanitized and errors expose no draft state, SQL, secrets, tokens, or internal details.
- AC-006 Every required async/error state is deterministic and offers safe retry/navigation where appropriate.
- AC-007 Catalog, reading, flashcard, and quiz/progression journeys are keyboard accessible and responsive without overflow.
- AC-008 Targeted tests and Phase 4 regressions prove answer secrecy, ownership, grading, reward idempotency, and no authority drift.

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

