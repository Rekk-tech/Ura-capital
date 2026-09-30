# FEAT-060 Acceptance Criteria: Prompt Registry, Intent Classification & Structured Contracts

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED

- AC-001 Only Human-approved intent values can be produced; unsupported input has a deterministic non-success/refusal classification.
- AC-002 The request schema rejects unknown fields and all client attempts to supply authoritative identity, role, entitlement, model, provider, system prompt, or raw context.
- AC-003 The `LLMProvider` structured-output and public-response schemas are provider-independent, versioned, bounded, strict, and contain no hidden/provider-sensitive fields.
- AC-004 Every prompt has a stable server-owned ID/version and unknown or duplicate versions fail deterministically.
- AC-005 Prompt assembly preserves explicit separation among instructions, trusted context, untrusted retrieval, and user text.
- AC-006 Client/retrieved/provider text cannot override instructions or choose hidden prompt versions in independent adversarial tests.
- AC-007 Provider-specific, malformed, extra-field, and oversized output is rejected and never returned as successful assistance.
- AC-008 Validation, unsupported, refusal, malformed, and unavailable outcomes map to bounded safe classifications.
- AC-009 Deterministic fixtures cover intent, schemas, hostile input, compatibility, and content-free diagnostics without sensitive logging.
- AC-010 FEAT-066 and Phase 9 can consume one canonical shared contract, and targeted/regression/CI evidence is green with zero migration.

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

- M4 -> FR-002..003 and FR-007/T002..T003 and T007/AC-002..003 and AC-007: enforce the frozen request/context/citation/answer/output limits.
- M6 -> FR-003, FR-008, and FR-009/T003, T008, and T009/AC-003, AC-008, and AC-009: response language follows the query, preserves citation language, and cannot weaken safety.
- M8 -> FR-004 and FR-010/T004 and T010/AC-004 and AC-010: prompt, contract, and fixture versions are immutable and regression-gated.
- P8-D09 proposal -> FR-002..003, FR-007..008, and FR-010/T002..T003, T007..T008, and T010/AC-002..003, AC-007..008, and AC-010: after explicit Human approval, independent contract tests must reproduce section 12.4 exactly. The prepared proposal itself does not satisfy acceptance.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
