# Feature Specification: FEAT-084 — Aura Intelligence AI Membership Entitlement Gating, Request Rate Limiting & Model-Based Guardrails

**Feature Branch**: `feat/FEAT-084-ai-entitlement-guardrails`  
**Created**: 2026-10-13  
**Status**: In-Progress (Master Approved)  
**Scope**: `apps/api/src/modules/ai/`, `apps/api/src/modules/subscription/`, `apps/web/src/features/ai/`, `packages/shared/`  

---

## 1. Executive Summary & Problem Analysis

In the initial implementation, the Aura Intelligence AI Learning Coach endpoint (`POST /api/ai/coach`) was accessible without membership verification, allowing any registered or guest user to execute arbitrary queries. In an educational financial technology platform, this introduces three critical risks:

1. **System Collapse & Resource Exhaustion**: Unbounded public access to AI agents will rapidly deplete token budgets, spike cloud inference costs, and risk denial-of-service (DoS) under concurrent load.
2. **Missing Membership Value Proposition**: Premium subscriptions (`PREMIUM_ACCESS`) must include the AI Coach as a core high-value entitlement; free users must be gated with an elegant, persuasive conversion flow.
3. **Safety & Domain Drift Hazards**: Without robust Model-Based Guardrails, users can submit adversarial prompts, jailbreaks, prompt injection, or completely off-topic requests (e.g. recipes, political persuasion, malware generation, market manipulation schemes) that waste inference capacity and violate regulatory safety standards.

This feature introduces a multi-tier defense architecture:
- **Server-Authoritative Entitlement Verification**: Only users with active `PREMIUM` membership or `ADMIN` roles can query AI endpoints.
- **Sliding-Window Rate Limiting**: Per-user request quotas to prevent bursting and abuse.
- **Two-Tier Model-Based Guardrails**: Pre-execution moderation evaluating domain relevance (finance/education) and content safety (toxicity, injections, market manipulation) before invoking core reasoning agents.
- **Design-System Token-Driven Membership Gating UI**: A luxury glassmorphism gating card inside the Co-Pilot directing non-subscribers to subscribe.

---

## 2. User Stories & Acceptance Criteria

### User Story 1: Membership Entitlement & Role-Based AI Access (Priority: P1)
**As a** platform operator,  
**I want** AI Coach endpoints to strictly verify that the caller holds an active `PREMIUM` membership entitlement or has an `ADMIN` role,  
**So that** only entitled paying members or administrators consume expensive AI agent resources.

**Acceptance Criteria**:
1. **Given** an unauthenticated request to `POST /api/ai/coach`, **Then** the server responds with HTTP 401 `UNAUTHORIZED`.
2. **Given** an authenticated user on the `FREE` tier without an active subscription, **When** they submit an AI query, **Then** the backend rejects the request with HTTP 403 `FORBIDDEN` and structured error code `AI_MEMBERSHIP_REQUIRED`.
3. **Given** an authenticated user with an active `PREMIUM` subscription (`PREMIUM_ACCESS` entitlement) OR role `ADMIN`, **When** they submit a query, **Then** the request passes entitlement verification and proceeds to rate limiting and guardrails.
4. **Given** an unauthenticated user or free user opening the AI Coach Co-Pilot in the frontend, **Then** the interface displays an elegant `AiCoachMembershipGate` card with feature highlights and a direct CTA button to `/subscription` (or `/login`), rather than an open chat input.

---

### User Story 2: Request Rate Limiting & Abuse Throttling (Priority: P1)
**As a** system reliability engineer,  
**I want** request rate limiting enforced on all AI endpoints,  
**So that** no individual user can spam queries or collapse backend services.

**Acceptance Criteria**:
1. **Given** a `PREMIUM` subscriber, **When** they exceed the rate limit (default: 20 requests per minute or 100 requests per hour), **Then** the server returns HTTP 429 `TOO_MANY_REQUESTS` with standard headers (`Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`).
2. **Given** an `ADMIN` user, **When** they query the AI coach, **Then** they enjoy an elevated administrative quota (100 requests per minute).
3. **Given** a rate-limited response, **Then** the payload includes a clear, friendly Vietnamese message explaining that the quota has temporarily been reached and indicating the wait duration.

---

### User Story 3: Model-Based Guardrails (Safety & Domain Moderation Evaluator) (Priority: P1)
**As an** AI safety officer,  
**I want** every query to undergo Model-Based Guardrail evaluation before reaching the core reasoning agents,  
**So that** off-topic inquiries and malicious/harmful prompts are blocked immediately at minimal compute cost.

**Acceptance Criteria**:
1. **Tier 1 (Fast Deterministic Pre-Guardrail)**: Instantly detects obvious adversarial patterns (system prompt leakage, ignore previous instructions, jailbreak keywords, bypass scripts) via regex and returns `UNSUPPORTED_OR_REFUSED` in < 2ms.
2. **Tier 2 (Model-Based Guardrail Prompt Evaluator)**:
   - Evaluates **Domain Relevance**: Verifies query pertains to finance, investing, economics, risk management, market dynamics (VN30, P/E, bonds, FOMO Arena, Pro Room), or Aura Capital features.
   - Evaluates **Safety & Toxicity**: Verifies query contains zero hate speech, harassment, illegal financial schemes (orchestrating pump-and-dump, insider trading hacks, money laundering), or prompt injection.
3. **Given** a query failing domain relevance (e.g., "Cách làm bánh pizza", "Viết thơ tình"), **When** evaluated, **Then** the guardrail returns `isAllowed: false`, reason `OFF_TOPIC`, and an educational refusal politely redirecting the user to financial learning topics.
4. **Given** a query failing safety evaluation, **When** evaluated, **Then** the guardrail returns `isAllowed: false`, reason `UNSAFE`, and a strict safety refusal.
5. **Given** any guardrail refusal, **Then** downstream agentic workflows (Gemini API / multi-turn coach engine) are **NEVER invoked**, saving LLM budget and latency.

---

### User Story 4: Design-System Compliant UI Gating & State Experience (Priority: P2)
**As a** learner on the free plan,  
**I want** a clear, beautiful, and transparent membership upgrade card when I view the AI Co-Pilot,  
**So that** I understand the premium benefits of Aura Intelligence and how to subscribe.

**Acceptance Criteria**:
1. All visual tokens in the membership gate comply with `tokens.css` (e.g. `--color-primary`, `--space-4`, `--radius-lg`, `--shadow-md`).
2. If unauthenticated, displays "Đăng nhập để sử dụng" with CTA leading to `/login`.
3. If authenticated on Free plan, displays "Nâng Cấp Gói Hội Viên Premium" with feature badges: "Cố vấn 24/7", "Phân tích vĩ mô Pro Room", "Chiến lược thoát bẫy FOMO Arena".
4. Includes direct button to `/subscription` (Kích hoạt Gói Premium).

---

## 3. Data Model & Error Codes

### Canonical Error Codes
- `AI_MEMBERSHIP_REQUIRED`: HTTP 403 Forbidden when user lacks `PREMIUM_ACCESS`.
- `AI_RATE_LIMIT_EXCEEDED`: HTTP 429 Too Many Requests when exceeding quota.
- `AI_GUARDRAIL_VIOLATION`: Structured safety / off-topic refusal.

### Guardrail Evaluation Schema
```typescript
export interface GuardrailEvaluationResult {
  isAllowed: boolean;
  reason: "VALID" | "OFF_TOPIC" | "UNSAFE" | "PROMPT_INJECTION";
  explanation: string;
  educationalRefusal?: string;
}
```

---

## 4. Non-Functional Requirements

- **Latency**: Tier 1 deterministic check < 2ms; Tier 2 model guardrail evaluated with strict 3-second timeout and fail-safe fallback to deterministic knowledge engine.
- **Resilience**: If the external LLM guardrail service is unavailable, fallback to strict deterministic domain-keyword matching to ensure 100% platform availability.
- **Security**: Zero prompt leakage; user input sanitized and separated from system instructions.
