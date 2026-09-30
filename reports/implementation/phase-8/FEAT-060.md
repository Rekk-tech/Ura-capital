# FEAT-060 Implementation Report: Prompt Registry, Intent Classification & Structured Contracts

## 1. Executive Summary

| Attribute | Canonical Record |
|---|---|
| **Feature ID** | FEAT-060 |
| **Feature Title** | Prompt Registry, Intent Classification & Structured Contracts |
| **Phase** | Phase 8 — Aura Intelligence |
| **Implementation Owner** | ANTIGRAVITY |
| **Human Approval Authority** | HUMAN |
| **Independent Phase QA** | FEAT-068 |
| **Baseline** | `feat-059-approved` (`537c77ab752f1d49ca7058efca43ba09a5dc0f72`) |
| **Worktree** | `.tmp/feat060-worktree` |
| **Branch** | `feat/FEAT-060-prompt-contracts` |
| **Delivery Strategy** | Fast-Track Implementation |
| **Migration Ownership** | ZERO (10 migrations total, 0 added) |
| **Database Mutations** | ZERO |
| **Public Assistant Routes** | ZERO (Core contracts and prompt registry; public route orchestration owned by FEAT-066) |
| **Internal Feature Gate Status** | **PASS** (10/10 tasks complete, 10/10 ACs pass, Canonical 14 PASS) |
| **Exact Commit SHA** | `146325df22d7c49399b301fe3dc9084afd38fa27` |
| **GitHub Actions CI Run** | [Run 36026948766](https://github.com/Rekk-tech/Ura-capital/actions/runs/36026948766) (SUCCESS) |
| **QA Independence** | **SELF-VERIFICATION ONLY** (Compensating technical verification; independent phase verification owned by FEAT-068) |
| **Human Final Gate Status** | **READY FOR HUMAN REVIEW / PENDING QA** |

---

## 2. Architecture & Component Structure

FEAT-060 delivers code-versioned, server-owned prompts, a closed intent taxonomy, strict request/provider-output/public-response schemas, and deterministic contract evaluation behind the approved provider-independent `LLMProvider` contract.

```text
apps/api/src/modules/ai/
├── contracts/
│   ├── ai-error.mapper.ts            (Public safe error envelope mapping & HTTP status table)
│   ├── ai-request.validator.ts       (12-KiB body, 8-KiB/2,000-cp message, control char rejection)
│   ├── ai-response.validator.ts      (Provider structured payload validation & response builder)
│   └── index.ts                      (Contracts barrel export)
├── intent/
│   ├── intent-classifier.ts          (Deterministic classifier for closed 5-intent catalog)
│   └── index.ts                      (Intent barrel export)
├── prompts/
│   ├── definitions/
│   │   ├── ai-assist.prompt.ts       (AIAssistPromptV1 educational system instructions)
│   │   └── intent-classifier.prompt.ts (IntentClassifierPromptV1 classification instructions)
│   ├── prompt.assembler.ts           (Strict tag-based assembly: system, context, retrieval, user)
│   ├── prompt.registry.ts            (Immutable, code-versioned prompt registry singleton)
│   ├── prompt.types.ts               (Prompt definitions and assembly context interfaces)
│   └── index.ts                      (Prompts barrel export)
└── index.ts                          (Unified AI module barrel export)

packages/shared/src/
├── constants/
│   └── ai.constants.ts               (Intents, context modes, refusal codes, budget limits)
├── schemas/
│   └── ai.schemas.ts                 (Zod schemas for request, response, citations, safety, quota)
└── types/
    └── ai.types.ts                   (Inferred TypeScript types and DTO interfaces)
```

---

## 3. Closed Intent Taxonomy (FR-001, AC-001, P8-D08)

Implemented the Human-approved 5-value closed intent taxonomy:

| Intent | Scope & Description | Failure / Refusal Mode |
|---|---|---|
| `LEARNING_EXPLANATION` | Educational explanations of financial concepts, valuation (DCF, P/E), risk metrics (Sharpe, Beta), macroeconomics, bonds, stocks. | Allowed |
| `ACADEMY_GUIDANCE` | Aura Academy curriculum navigation, lesson summaries, course pathways, quiz assistance. | Allowed |
| `SIMULATION_ANALYSIS` | Simulated trading mechanics, paper trading history, order analysis, simulation margin and balances. | Allowed |
| `PORTFOLIO_EDUCATION` | Portfolio asset allocation (e.g. 60/40), diversification concepts, rebalancing principles, risk exposure. | Allowed |
| `UNSUPPORTED_OR_REFUSED` | Requests for live trading / financial advice, prompt injections, off-topic, or unrecognizable queries. | Fails closed to HTTP 200 Refusal |

- **Deterministic Classification**: `classifyIntentDeterministic` analyzes user query normalized via NFKC with diacritic stripping.
- **Fail-Closed Rule**: Any query that does not match an approved financial domain or that violates safety/trading policies classifies strictly as `UNSUPPORTED_OR_REFUSED`.

---

## 4. Strict Request Schema & Inbound Validation (FR-002, AC-002, P8-D09-A)

`validateAIAssistRequestBody` enforces the exact candidate freeze for `POST /api/ai/assist`:

1. **Body Size Bound**: Maximum encoded request body is 12 KiB (12,288 bytes). Exceeding this fails with HTTP 413 `AI_REQUEST_TOO_LARGE`.
2. **Strict Object Shape**: Accepts only `{ message: string, contextMode?: "AUTO" | "ACADEMY" | "SIMULATION" }`.
3. **NFKC Normalization**: Message undergoes Unicode NFKC normalization and whitespace trimming.
4. **Code Point and Byte Bounds**:
   - Minimum: 1 code point.
   - Maximum: 2,000 code points.
   - UTF-8 Size: at most 8 KiB (8,192 bytes).
5. **Control Character Rejection**: Disallows NUL (`\0`), ASCII 0x01-0x08, 0x0B, 0x0C, 0x0E-0x1F, and DEL (0x7F).
6. **Anti-Spoofing & Authority Protection**:
   - Rejection of unknown fields (`.strict()`).
   - Rejection of client attempts to pass `userId`, `role`, `entitlements`, `model`, `provider`, `systemPrompt`, `promptId`, or `rawContext`.

---

## 5. Strict Provider-Independent Structured Output & Public Response (FR-003, FR-007, AC-003, AC-007, P8-D09-C)

### 5.1 Provider Structured Output (`ai-assist-v1`)

When `outputMode` is `{ kind: "STRUCTURED", schemaId: "ai-assist-v1", schemaVersion: "1.0" }`, `validateProviderStructuredPayload` validates:

```json
{
  "answer": "string (1..6000 code points, max 24 KiB)",
  "intent": "LEARNING_EXPLANATION | ACADEMY_GUIDANCE | SIMULATION_ANALYSIS | PORTFOLIO_EDUCATION | UNSUPPORTED_OR_REFUSED",
  "suggestedMode": "GENERAL | ACADEMY | SIMULATION",
  "safety": {
    "outcome": "ALLOWED | REFUSED",
    "refusalCode": "UNSUPPORTED_REQUEST | PROHIBITED_FINANCIAL_ACTION | INSUFFICIENT_SAFE_CONTEXT | SAFETY_POLICY | null",
    "disclaimerCode": "EDUCATIONAL_ONLY | SIMULATION_ONLY | null"
  },
  "referencedCitationIds": ["string (safe ASCII)"]
}
```

- **Zero Coercion**: Malformed output, foreign fields, or provider metadata (e.g. Gemini candidates, finishReason) trigger `AIGatewayMalformedResponseError` (HTTP 502 `AI_INVALID_PROVIDER_RESPONSE`).

### 5.2 Public Response Envelope (`AIAssistResponse`)

`buildAIAssistResponse` constructs the strict provider-neutral envelope:

- `contractVersion`: `"v1"`
- `requestId`: 1..128 safe ASCII characters (`SAFE_ASCII_ID_REGEX`)
- `answer`: 1..6,000 code points, at most 24 KiB UTF-8
- `intent`: One of the 5 approved intents
- `context`: `{ mode, isSimulation }` (`isSimulation === true` iff `mode === "SIMULATION"`)
- `citations`: 0..5 items with opaque `citationId`, `sourceType`, bounded `title` (<= 160 cp, <= 640 bytes), and nullable `locationLabel`
- `safety`: `{ outcome, refusalCode, disclaimerCode }`
- `quota`: `{ minuteLimit, minuteRemaining, minuteResetAt, dailyLimit, dailyRemaining, dailyResetAt }`
- **Total Response Size**: Serialized JSON must not exceed 32 KiB (32,768 bytes).

### 5.3 Server-Owned Refusal (P8-D09-E, FR-008, AC-008)

`buildServerOwnedRefusalResponse` returns HTTP 200 with server-owned message, `outcome: "REFUSED"`, non-null `refusalCode`, and empty citations array. Never exposes raw provider refusal or fabricated citations.

---

## 6. Server-Owned Immutable Prompt Registry (FR-004, AC-004)

`PromptRegistry` manages code-versioned, server-owned prompts:

- Pre-registers:
  - `ai-assist-prompt` (version `1.0.0`, default)
  - `intent-classifier-prompt` (version `1.0.0`, default)
- **Deterministic Lookup**: `getPrompt(id, version?)` returns frozen definition or throws `AIGatewayConfigurationError`.
- **Immutability**: Prompt definitions are deeply frozen with `Object.freeze()`.
- **Client Shield**: Runtime callers cannot supply or override system prompts.

---

## 7. Prompt Assembly & Anti-Injection Guards (FR-005, FR-006, AC-005, AC-006)

`assemblePrompt` enforces boundary containment across:

1. `system` role: Immutable system instructions from registered prompt definition.
2. `user` role: Structured sections with security preamble:
   - `<requested_context_mode>`
   - `<trusted_server_context>`: Bounded at 2 KiB per item, 8 KiB per adapter.
   - `<untrusted_retrieved_content>`: Bounded at max 5 items, max 8 KiB total retrieval. Lower-ranked items deterministically omitted (`truncatedRetrievalCount`).
   - `<user_input>`: Normalized user message.
3. **Tag Injection Defense**: Closing tags (`</user_input>`, `</retrieved_document>`) inside user or retrieved text are safely escaped to prevent tag breakout attacks.

---

## 8. Safe Public Error Taxonomy (P8-D09-F, FR-008)

`mapErrorToPublicResponse` maps errors to the strict safe error envelope `{ error: { message, code, requestId } }`:

| HTTP Status | Error Code | Source Error Condition |
|---|---|---|
| 400 | `AI_INVALID_REQUEST` | Inbound DTO / character validation failure |
| 413 | `AI_REQUEST_TOO_LARGE` | Encoded body exceeds 12 KiB |
| 429 | `AI_RATE_LIMITED` | Rate limit or quota exhaustion (includes `Retry-After: 60`) |
| 502 | `AI_INVALID_PROVIDER_RESPONSE` | Provider output violates structured schema |
| 503 | `AI_TEMPORARILY_UNAVAILABLE` | Provider unavailable, auth failure, or configuration error |
| 504 | `AI_PROVIDER_TIMEOUT` | Provider request timed out |
| 500 | `INTERNAL_ERROR` | Unexpected internal failure |

All error messages are scrubbed of secrets, paths, and URLs via `sanitizeAIGatewayMessage`.

---

## 9. Test Verification Matrix

### 9.1 Targeted FEAT-060 Test Suites

| Test Suite | Location | Tests | Status |
|---|---|---|---|
| Prompt Registry Tests | `tests/unit/ai-gateway/prompt-registry.test.ts` | 11 | **PASS** |
| Intent Classification Tests | `tests/unit/ai-gateway/intent-classification.test.ts` | 40 | **PASS** |
| AI Contracts & Validation Tests | `tests/unit/ai-gateway/ai-contracts.test.ts` | 33 | **PASS** |
| Prompt Assembly Tests | `tests/unit/ai-gateway/prompt-assembly.test.ts` | 8 | **PASS** |
| AI Adversarial & Security Tests | `tests/unit/ai-gateway/ai-adversarial.test.ts` | 27 | **PASS** |
| AI Gateway Suite Total | `tests/unit/ai-gateway/` (9 files) | **160** | **PASS** |
| Shared AI Schemas & Constants | `packages/shared/src/index.test.ts` | 69 | **PASS** |

---

## 10. Canonical 14 Validation Results

Executed in the isolated worktree (`.tmp/feat060-worktree`) on branch `feat/FEAT-060-prompt-contracts`:

| Step | Command | Result | Details / Counts |
|---|---|---|---|
| 1 | `npm run clean` | **PASS** | Dist directories cleaned |
| 2 | `npm run lint` | **PASS** | 0 errors, 0 warnings across all workspaces |
| 3 | `npx prisma validate --schema=apps/api/prisma/schema.prisma` | **PASS** | Schema is valid |
| 4 | `npm run typecheck` | **PASS** | All workspaces (@aura/shared, @aura/api, @aura/web) typecheck clean |
| 5 | `npm run build` | **PASS** | All workspaces built successfully |
| 6 | `npm run test` | **PASS** | 119 files, 1,521 tests passed (API: 102/1,243; Web: 16/209; Shared: 1/69) |
| 7 | `npm run test:unit` | **PASS** | 92 files, 1,281 tests passed (API: 75/1,003; Web: 16/209; Shared: 1/69) |
| 8 | `npm run test:db` | **PASS** | 46 files, 578 tests passed |
| 9 | `npm run test:redis` | **PASS** | 6 files, 53 tests passed |
| 10 | `npm run guard:persistence` | **PASS** | 1 file, 14 tests passed |
| 11 | `npm run guard:migration` | **PASS** | 10 migrations, 0 blocking errors |
| 12 | `npm run guard:boundary` | **PASS** | controllers=21, services=29, repositories=9, 0 violations |
| 13 | `npm run guard:audit-governance` | **PASS** | 0 premature product audit schemas |
| 14 | `npm run guard:seed-safety` | **PASS** | 0 unsafe seed scripts |

**Summary**: 14/14 commands passed with zero failures and zero skips.

### GitHub Actions Exact-Source Remote CI Validation
- **Run ID**: [36026948766](https://github.com/Rekk-tech/Ura-capital/actions/runs/36026948766)
- **Workflow**: `Aura Capital CI`
- **Triggering Commit**: `146325df22d7c49399b301fe3dc9084afd38fa27`
- **Branch**: `feat/FEAT-060-prompt-contracts`
- **Status**: `completed`
- **Conclusion**: `success`
- **Execution**: All 15 canonical pipeline steps (clean, prisma validate, lint, typecheck, build, migration guard, isolated migration apply, unit tests, standard tests, test:db, test:redis, and boundary/governance guards) passed cleanly in isolated container environment.

---

## 11. Scope & Boundary Verification

- **Database Migrations**: ZERO (10 migrations total, 0 added)
- **Database Schema Changes**: ZERO (`schema.prisma` untouched)
- **Redis Persistence**: ZERO (no Redis keys or state mutated)
- **Public AI Routes**: ZERO (gateway contract logic only; endpoint orchestration owned by FEAT-066)
- **Phase 9 UI**: ZERO (`apps/web` untouched)
- **FEAT-061+ Functionality**: ZERO context resolvers, RAG vector DBs, or quota enforcement implemented.

---

## 12. Traceability Matrix

| Requirement | Task | Acceptance Criteria | Implementation Component | Verification Evidence |
|---|---|---|---|---|
| FR-001 | T001 | AC-001 | `AI_INTENTS`, `classifyIntentDeterministic` | `intent-classification.test.ts` (40 tests) |
| FR-002 | T002 | AC-002 | `AIAssistRequestSchema`, `validateAIAssistRequestBody` | `ai-contracts.test.ts` (tests 1-13) |
| FR-003 | T003 | AC-003 | `AIAssistProviderStructuredPayloadSchema`, `AIAssistResponseSchema` | `ai-contracts.test.ts` (tests 14-25) |
| FR-004 | T004 | AC-004 | `PromptRegistry`, `AIAssistPromptV1`, `IntentClassifierPromptV1` | `prompt-registry.test.ts` (11 tests) |
| FR-005 | T005 | AC-005 | `assemblePrompt`, tag-based containment | `prompt-assembly.test.ts` (8 tests) |
| FR-006 | T006 | AC-006 | Anti-tampering directive, XML escaping | `ai-adversarial.test.ts` (27 tests) |
| FR-007 | T007 | AC-007 | `validateProviderStructuredPayload`, fail-closed parser | `ai-contracts.test.ts` (tests 14-19) |
| FR-008 | T008 | AC-008 | `mapErrorToPublicResponse`, `buildServerOwnedRefusalResponse` | `ai-contracts.test.ts` (tests 22-33) |
| FR-009 | T009 | AC-009 | Adversarial fixtures, control char tests | `ai-adversarial.test.ts` (27 tests) |
| FR-010 | T010 | AC-010 | Shared package export, Canonical 14 validation | Canonical 14 (14/14 PASS), `index.test.ts` |

---

## 13. Residual Risks & Next Steps

1. **FEAT-061 Dependency**: Context resolver core (FEAT-061) will provide structured, server-derived context items conforming to `TrustedContextItemInput` and `AIResolvedContextEnvelope`.
2. **FEAT-064 Dependency**: Academy retrieval foundation will populate `untrustedRetrieval` conforming to `UntrustedRetrievalItemInput`.
3. **FEAT-065 Dependency**: Quota manager will supply the real `AIQuotaDto` projection.
4. **FEAT-066 Integration**: Orchestrator service will tie together context, retrieval, prompt assembly, gateway call, structured validation, and public response mapping.
5. **Phase 8 Independent QA**: Independent QA for Phase 8 remains strictly owned by FEAT-068.
