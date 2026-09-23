# FEAT-061 Acceptance Criteria: AI Context Resolver Core & Data Isolation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 Every context envelope is bounded and identifies source, provenance, simulation status, freshness, and sensitivity class.
- AC-002 Only the authenticated server user controls context ownership; spoofed client identity/role/entitlement/raw context cannot alter it.
- AC-003 Only approved read-only adapters can be selected for an approved mode/intent and unknown adapters fail safely.
- AC-004 Per-source and aggregate item/byte/token budgets are enforced deterministically before provider invocation.
- AC-005 Independent probes show prohibited secrets, auth data, answer keys, provider IDs, and unrelated PII cannot enter context.
- AC-006 Consumers can distinguish authoritative facts, derived summaries, and simulated facts without ambiguity.
- AC-007 Required/optional adapter failures, timeouts, stale data, and partial context produce the approved deterministic outcome without fabrication.
- AC-008 Cross-user and namespace-collision tests prove no context can be read for another user.
- AC-009 Hostile adapter text remains delimited untrusted data and cannot authorize an action or override instructions.
- AC-010 Boundary and regression evidence shows zero Prisma delegate/mutation in AI controller/services and no existing-domain regression or migration.

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

- M3 -> FR-005/T005/AC-005: apply the exact provider-bound field allowlist and prohibited-field set.
- M4 -> FR-004/T004/AC-004: enforce frozen per-source and aggregate item/byte/token context bounds.
- P8-D09 proposal -> FR-004/T004/AC-004: independent evidence must reproduce the Human-approved section-12.4 ceilings; proposal text alone is not acceptance.
- M7 -> FR-001 and FR-010/T001 and T010/AC-001 and AC-010: context is request-scoped only and no response/user-context cache may exist.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
