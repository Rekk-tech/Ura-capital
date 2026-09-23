# FEAT-058 Acceptance Criteria: Provider-Independent AI Gateway Foundation & Configuration

Status: APPROVED FOR IMPLEMENTATION

- AC-001 One AI gateway module exists and no other module can invoke future model behavior outside its exposed port.
- AC-002 Enabled startup rejects missing, blank, conflicting, or invalid provider, Gemini development/test model/API/token-limit/timeout, secret, or budget configuration and never falls back to another provider, model, or secret.
- AC-003 The typed provider-independent `LLMProvider` contract covers generation, structured outputs, normalized usage, normalized errors, and timeout/cancellation; all gateway dependencies expose no provider SDK type.
- AC-004 Fakes work only in approved local/test/CI predicates; staging, production, production-like, unknown, and conflicting configurations fail before provider or durable mutation.
- AC-005 AI controllers/services contain no Gemini SDK, Prisma delegate, raw SQL, or direct Redis-client use.
- AC-006 Independent probes show configuration/composition failures are safe and contain none of the prohibited infrastructure or secret data.
- AC-007 Gemini/provider credentials remain server-side and outside version control; no provider key or AI secret appears in a committed file, response, browser artifact, Redis key, log, report, or snapshot evidence.
- AC-008 The feature adds zero endpoint behavior, provider calls, business mutations, AI tables, migrations, or Phase 9 UI.
- AC-009 Dependency injection selects exactly one approved provider or deterministic test double explicitly; unknown/conflicting selection, DeepSeek, automatic fallback, and production Gemini activation without later approval fail closed.
- AC-010 Targeted tests, guards, regression, exact-source CI, and truthful implementation evidence pass with no mandatory skip.

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

- M1 -> FR-002/T002/AC-002: require exact Gemini development/test model/API/token-limit/timeout configuration with no fallback, cancellation propagation, and ambiguous-call no-retry.
- Provider strategy -> FR-003 and FR-009/T003 and T009/AC-003 and AC-009: verify the provider-independent port, explicit single-provider selection, and absence of DeepSeek and automatic fallback.
- M3 -> FR-006..007/T006..T007/AC-006..007: enforce the provider data allowlist and production-provider disablement.
- M7 -> FR-008/T008/AC-008: prove no response or user-context cache is introduced.
- M8 -> FR-002 and FR-010/T002 and T010/AC-002 and AC-010: version runtime configuration and record exact-source change evidence.

## Hard-Fail Conditions

Open P0/P1, mandatory validation skipped, secret/privacy leakage, cross-user access, provider/model/client authority over business state, unsafe fallback, unauthorized schema/migration, scope leakage, or falsified evidence results in FAIL.
