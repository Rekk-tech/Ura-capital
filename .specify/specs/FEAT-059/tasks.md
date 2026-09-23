# FEAT-059 Tasks: Gemini Development Adapter & Failure Isolation

Status: DEPENDENCY BLOCKED BY FEAT-058

- [ ] T001 Implement the Gemini development/test adapter against FEAT-058 `LLMProvider` without making Gemini part of caller contracts. (FR-001; AC-001).
- [ ] T002 Add or update boundary enforcement so Gemini SDK imports remain adapter-only. (FR-002; AC-002).
- [ ] T003 Wire exact Human-approved Gemini model/API/token-limit/timeout and server-only credentials into the adapter. (FR-003; AC-003).
- [ ] T004 Implement abort-aware timeout and cancellation propagation. (FR-004; AC-004).
- [ ] T005 Implement the approved bounded retry classifier and ambiguous-call no-retry behavior. (FR-005; AC-005).
- [ ] T006 Map provider failures to safe internal error classes. (FR-006; AC-006).
- [ ] T007 Normalize bounded token/usage metadata for later telemetry. (FR-007; AC-007).
- [ ] T008 Apply sanitization and add sensitive provider-data leakage probes. (FR-008; AC-008).
- [ ] T009 Implement the explicit deterministic fake and production-like activation guard. (FR-009; AC-009).
- [ ] T010 Run provider contract/unit/security tests, including structured output, normalized usage, no DeepSeek, and no-fallback probes; run canonical regression/exact-source CI and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M1 -> FR-003..005/T003..T005/AC-003..005: pin exact Gemini development/test model/API/token-limit/timeout settings, cancellation, and retry policy.
- Provider strategy -> FR-001 and FR-010/T001 and T010/AC-001 and AC-010: verify `LLMProvider` conformance, Gemini adapter isolation, no DeepSeek implementation, and no provider fallback.
- M3 -> FR-008/T008/AC-008: provider requests, errors, and live tests obey the approved allowlist and synthetic-data policy.
- M5 -> FR-004..005/T004..T005/AC-004..005: timeout/cancellation never triggers an ambiguous retry or false success.
- M8 -> FR-003 and FR-010/T003 and T010/AC-003 and AC-010: model/API version changes require versioned contract regression.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
