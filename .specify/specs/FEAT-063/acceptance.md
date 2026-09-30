# FEAT-063 Acceptance Criteria: Simulation & Portfolio Context Adapter

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 The Simulation adapter uses approved read abstractions and introduces no direct Prisma access in AI controller/services.
- AC-002 Every owned state read is bound to the authenticated user; cross-user/session access is denied without enumeration leakage.
- AC-003 Only approved bounded asset/scenario/snapshot/portfolio/position/trade fields can enter context.
- AC-004 All Decimal/money/quantity values use stable serialization and preserve authoritative stored meaning.
- AC-005 Simulation context and resulting interpretation inputs are explicitly marked simulated and never represented as real brokerage facts.
- AC-006 Model/client output cannot mutate or become authority for orders, fills, prices, settlement, valuation, or portfolio state.
- AC-007 Provenance/freshness/cycle identifiers are safe and no provider/internal/unrelated-user data leaks.
- AC-008 Item/time-range/token budgets and missing/stale/terminal outcomes are deterministic.
- AC-009 IDOR, cross-session, cross-user, and client context-selection spoofing probes fail safely.
- AC-010 Targeted/live PostgreSQL/security/Phase 5 regression and exact-source CI pass with zero Simulation schema/migration change.

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

- M3 -> FR-003 and FR-007/T003 and T007/AC-003 and AC-007: provider-bound Simulation facts exclude direct identity, unrelated PII, provider IDs, and internals.
- M4 -> FR-008/T008/AC-008: enforce frozen item/time-range/text/token limits.
- P8-D09 proposal -> FR-008/T008/AC-008: independent evidence must reproduce approved section-12.4 Simulation bounds without weakening ownership or disclosure.
- M6 -> FR-005/T005/AC-005: query-language output never removes the mandatory simulation disclosure.
- M7 -> FR-008 and FR-010/T008 and T010/AC-008 and AC-010: no response or user-context cache is permitted.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
