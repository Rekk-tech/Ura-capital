# FEAT-058 Tasks: Provider-Independent AI Gateway Foundation & Configuration

Status: APPROVED FOR IMPLEMENTATION

- [x] T001 Create the isolated AI module shell and composition boundary. (FR-001; AC-001).
- [x] T002 Extend the shared environment contract and startup validation with explicit fail-closed provider, Gemini development/test runtime, secret, token-limit, and timeout configuration. (FR-002; AC-002).
- [x] T003 Define the provider-independent `LLMProvider` generation/structured-output/usage/error/timeout contract plus context, retrieval, quota, clock/cancellation, and telemetry ports. (FR-003; AC-003).
- [x] T004 Implement environment classification and fake-adapter isolation rules. (FR-004; AC-004).
- [x] T005 Add or extend boundary checks for SDK, Prisma, raw SQL, and Redis-client imports. (FR-005; AC-005).
- [x] T006 Apply approved diagnostic sanitization to AI configuration/composition failures. (FR-006; AC-006).
- [x] T007 Add secret-leakage checks covering tracked files/source control, responses, bundles, Redis keys, logs, reports, and snapshots. (FR-007; AC-007).
- [x] T008 Verify the diff contains no endpoint, provider call, durable state, schema, migration, or UI behavior. (FR-008; AC-008).
- [x] T009 Implement deterministic dependency injection fixtures with production-like rejection. (FR-009; AC-009).
- [x] T010 Run targeted tests, authoritative guards, canonical regression, exact-source CI, and publish the implementation report. (FR-010; AC-010).

## M1..M8 Task Traceability

- M1 -> FR-002/T002/AC-002: require exact Gemini development/test model/API/token-limit/timeout configuration with no fallback, cancellation propagation, and ambiguous-call no-retry.
- Provider strategy -> FR-003 and FR-009/T003 and T009/AC-003 and AC-009: prove one provider-independent port, explicit single-provider selection, no DeepSeek adapter, and no automatic fallback.
- M3 -> FR-006..007/T006..T007/AC-006..007: enforce the provider data allowlist and production-provider disablement.
- M7 -> FR-008/T008/AC-008: prove no response or user-context cache is introduced.
- M8 -> FR-002 and FR-010/T002 and T010/AC-002 and AC-010: version runtime configuration and record exact-source change evidence.

## Dependency Order

T001 -> T002/T003 -> T004..T009 -> T010.

## Completion Rule

A task is complete only when its implementation and mapped evidence pass on the exact source. Task completion does not imply independent QA or Human Final Gate approval.
