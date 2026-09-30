# FEAT-065 Acceptance Criteria: AI Rate Limits, Daily Quotas & Cost Controls

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 Every approved limit is enforced before provider-independent `LLMProvider` invocation using Human-approved values, and no unchecked request reaches the provider.
- AC-002 Five-plus concurrent and multi-instance requests cannot exceed the configured atomic allowance.
- AC-003 Redis keys are versioned, TTL-bound, HMAC-scoped, and reveal no raw identity, IP, prompt, token, cookie, or secret.
- AC-004 Canonical and approved alias routes share one logical quota and cannot be used to multiply allowance.
- AC-005 Reservation/accounting/settlement/expiry tests show billable attempts and normalized token/cost usage are neither silently undercounted nor permanently stranded, without Gemini-specific authority.
- AC-006 Redis outage or ambiguous quota state returns a safe unavailable result before any provider call or durable business mutation.
- AC-007 429/quota responses and Retry-After are deterministic, bounded, and do not reveal whether an identity/account exists.
- AC-008 No permanent lockout or Redis authority over identity, entitlement, subscription, conversation, or durable usage is introduced.
- AC-009 Test/CI run/worker namespaces are isolated and cleanup cannot touch another run, worker, environment, or production key.
- AC-010 Live Redis threshold/concurrency/multi-instance/TTL/outage/recovery/sanitization and FEAT-010A/015 regression pass with zero migration.

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

- M5 -> FR-001..007/T001..T007/AC-001..007: reserve atomically before provider invocation; pre-provider rejection consumes no attempt; initiated calls consume request quota after timeout/cancellation; no ambiguous retry; settle bounded usage/cost; expire abandoned reservations; use Human-confirmed source and daily-window semantics.
- P8-D05 proposal -> FR-001..007/T001..T007/AC-001..007: after explicit Human approval, independent evidence must reproduce every section-12.3 threshold, reset, atomic decision, accounting, TTL, failure, isolation, and disclosure rule. Presence of the proposal alone is not acceptance.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
