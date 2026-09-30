# FEAT-062 Acceptance Criteria: Academy Learning Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 The Academy adapter uses approved read abstractions and introduces no direct Prisma access in AI controller/services.
- AC-002 Only published learner-visible content is returned; draft, removed/hidden, and internal authoring fields are absent.
- AC-003 Progress, completion, attempts, and outcomes are scoped to the authenticated user with cross-user probes denied.
- AC-004 No correct answer or answer key is exposed before the owning Academy flow authorizes graded results.
- AC-005 Only approved bounded completed-assessment summaries appear for supported educational intents.
- AC-006 Model/client behavior cannot mutate or become authority for progression, grades, XP, or rewards.
- AC-007 Every included Academy fact/citation has safe stable provenance without internal-only leakage.
- AC-008 Item/text/token budgets and empty/not-found/stale outcomes behave deterministically.
- AC-009 Hostile instructions embedded in Academy content remain untrusted and cannot override system policy.
- AC-010 Targeted/live PostgreSQL/security/Phase 4 regression and exact-source CI pass with zero Academy schema/migration change.

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

- M3 -> FR-002..005/T002..T005/AC-002..005: provider-bound Academy data excludes direct identity, drafts, answer keys, unrelated PII, and internal fields.
- M4 -> FR-008/T008/AC-008: enforce the frozen Academy item/text/token limits.
- P8-D09 proposal -> FR-008/T008/AC-008: independent evidence must reproduce approved section-12.4 Academy bounds without weakening answer secrecy or ownership.
- M6 -> FR-007/T007/AC-007: preserve citation source language for query-language output.
- M7 -> FR-008 and FR-010/T008 and T010/AC-008 and AC-010: no response or learner-context cache is permitted.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
