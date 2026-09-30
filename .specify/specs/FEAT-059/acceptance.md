# FEAT-059 Acceptance Criteria: Gemini Development Adapter & Failure Isolation

Status: DEPENDENCY BLOCKED BY FEAT-058

- AC-001 Gateway callers use only `LLMProvider`, receive no Gemini SDK type, and do not encode Gemini as the permanent production contract.
- AC-002 Static and runtime evidence shows Gemini SDK imports exist only in the approved adapter infrastructure.
- AC-003 Exact Gemini model/API/token-limit/timeout settings and credentials are server-controlled, validated before startup, and unaffected by client input.
- AC-004 Timeout and cancellation terminate the adapter flow deterministically and cannot yield a fabricated success.
- AC-005 Retry tests prove only approved safe failures retry within bounds and ambiguous potentially billable calls do not retry.
- AC-006 Every provider failure class maps deterministically to a safe internal error without raw provider leakage.
- AC-007 Usage metadata is bounded and available internally while provider internals and hidden prompts remain absent from public responses.
- AC-008 Logs/errors contain no provider credentials, raw payloads, request/response content, URLs, or sensitive diagnostics.
- AC-009 The deterministic fake works in approved test modes and fails closed in staging, production, production-like, unknown, or conflicting modes.
- AC-010 Targeted provider tests prove plain and structured generation, normalized usage/errors, import isolation, no DeepSeek adapter, no automatic fallback, security/regression, exact-source CI, truthful evidence, and zero migration.

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

- M1 -> FR-003..005/T003..T005/AC-003..005: pin exact Gemini development/test model/API/token-limit/timeout settings, cancellation, and retry policy.
- Provider strategy -> FR-001 and FR-010/T001 and T010/AC-001 and AC-010: verify provider-independent conformance, Gemini isolation, no DeepSeek implementation, and no fallback.
- M3 -> FR-008/T008/AC-008: provider requests, errors, and live tests obey the approved allowlist and synthetic-data policy.
- M5 -> FR-004..005/T004..T005/AC-004..005: timeout/cancellation never triggers an ambiguous retry or false success.
- M8 -> FR-003 and FR-010/T003 and T010/AC-003 and AC-010: model/API version changes require versioned contract regression.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
