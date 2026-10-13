# Implementation Plan: FEAT-084 — Aura Intelligence AI Membership Entitlement Gating, Request Rate Limiting & Model-Based Guardrails

**Feature Branch**: `feat/FEAT-084-ai-entitlement-guardrails`  
**Specification**: [.specify/specs/FEAT-084/spec.md](spec.md)  
**Status**: Ready for Implementation  

---

## 1. Technical Context & Architecture Overview

### Architectural Principles
1. **Defense-in-Depth Pipeline**:
   - `Layer 1: Authentication & Identity` (`authenticate` middleware extracts verified JWT payload).
   - `Layer 2: Entitlement Guard` (`requireAiEntitlement` middleware verifies `user.role === 'ADMIN'` OR user has active `PREMIUM` subscription with `PREMIUM_ACCESS`).
   - `Layer 3: Rate Limiting Guard` (`aiRateLimiter` sliding-window limiter enforcing 20 req/min for subscribers, 100 req/min for admins).
   - `Layer 4: Model-Based Guardrails` (`aiGuardrailService` evaluating Tier 1 regex patterns & Tier 2 domain relevance / content safety).
   - `Layer 5: AI Core Reasoning Agent` (`aiCoachService` executing multi-turn financial guidance).
2. **Server-Side Authority**:
   - The browser client NEVER dictates entitlement; all checks resolve against PostgreSQL subscriptions and token authority.
3. **Design-Token Compliant Frontend**:
   - The UI gating state in `AiCoachModal` uses CSS variables defined in `tokens.css` and `index.css`.

---

## 2. Component Design & Touchpoints

```
[Client Request: POST /api/ai/coach]
         │
         ▼
[1. authenticate] ──(No Auth)──> 401 Unauthorized
         │
         ▼
[2. requireAiEntitlement] ──(Free / No Sub)──> 403 Forbidden (AI_MEMBERSHIP_REQUIRED)
         │
         ▼
[3. aiRateLimiter] ──(Exceeded)──> 429 Too Many Requests (AI_RATE_LIMIT_EXCEEDED)
         │
         ▼
[4. aiGuardrailService] ──(Off-Topic / Unsafe)──> Safe Educational Refusal
         │
         ▼
[5. AICoachService (Reasoning Engine)] ──> 200 OK (Educational Coaching Answer)
```

### Module File Structure:
- `packages/shared/src/errors/error-codes.ts`: Add `AI_MEMBERSHIP_REQUIRED`, `AI_RATE_LIMIT_EXCEEDED`, `AI_GUARDRAIL_VIOLATION`.
- `apps/api/src/modules/ai/http/ai-guardrail.service.ts`: Two-tier Model-based Guardrail implementation.
- `apps/api/src/modules/ai/http/ai-rate-limiter.ts`: Sliding-window rate limiter per user ID.
- `apps/api/src/modules/ai/http/ai-entitlement.middleware.ts`: Entitlement authorization middleware integrating with `SubscriptionEntitlementService`.
- `apps/api/src/modules/ai/http/ai.routes.ts`: Attach middlewares to AI routes.
- `apps/api/src/modules/ai/http/ai.controller.ts`: Integrate guardrail response and error reporting.
- `apps/web/src/features/ai/components/AiCoachMembershipGate.tsx`: Design-System membership gating presentation.
- `apps/web/src/features/ai/components/AiCoachModal.tsx`: Render gate if unentitled; display rate-limit indicators.
