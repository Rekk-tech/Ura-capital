# Tasks: FEAT-084 — Aura Intelligence AI Membership Entitlement Gating, Request Rate Limiting & Model-Based Guardrails

**Feature Branch**: `feat/FEAT-084-ai-entitlement-guardrails`  
**Specification**: [.specify/specs/FEAT-084/spec.md](spec.md)  
**Plan**: [.specify/specs/FEAT-084/plan.md](plan.md)  
**Status**: Ready for Execution  

---

## Phase 1: Setup & Contracts

- [ ] T001 Define error codes `AI_MEMBERSHIP_REQUIRED`, `AI_RATE_LIMIT_EXCEEDED`, `AI_GUARDRAIL_VIOLATION` in `packages/shared/src/errors/error-codes.ts`
- [ ] T002 [P] Export guardrail evaluation types in `packages/shared/src/index.ts`

---

## Phase 2: Foundational Infrastructure

- [ ] T003 Implement sliding-window rate limiter class in `apps/api/src/modules/ai/http/ai-rate-limiter.ts`
- [ ] T004 [P] Unit tests for `aiRateLimiter` in `apps/api/test/unit/ai/ai-rate-limiter.spec.ts`

---

## Phase 3: User Story 1 — Membership Entitlement & Role-Based Access Control

- [ ] T005 [US1] Implement `requireAiEntitlement` middleware checking user roles (`ADMIN`) and active subscription entitlement (`PREMIUM_ACCESS`) in `apps/api/src/modules/ai/http/ai-entitlement.middleware.ts`
- [ ] T006 [P] [US1] Unit tests for `requireAiEntitlement` middleware in `apps/api/test/unit/ai/ai-entitlement.middleware.spec.ts`
- [ ] T007 [US1] Mount `requireAiEntitlement` in `apps/api/src/modules/ai/http/ai.routes.ts`

---

## Phase 4: User Story 2 — Request Rate Limiting & Quota Throttling

- [ ] T008 [US2] Implement `aiRateLimitMiddleware` enforcing subscriber quotas (20 req/min) and admin quotas (100 req/min) in `apps/api/src/modules/ai/http/ai-rate-limit.middleware.ts`
- [ ] T009 [US2] Mount `aiRateLimitMiddleware` in `apps/api/src/modules/ai/http/ai.routes.ts`
- [ ] T010 [P] [US2] Integration test verifying 429 response on quota exhaustion in `apps/api/test/integration/ai/ai-rate-limit.integration.spec.ts`

---

## Phase 5: User Story 3 — Two-Tier Model-Based Guardrails

- [ ] T011 [US3] Implement `AIGuardrailService` with Tier 1 deterministic regex patterns and Tier 2 Model-based domain relevance & safety prompt evaluator in `apps/api/src/modules/ai/http/ai-guardrail.service.ts`
- [ ] T012 [P] [US3] Unit tests for domain relevance filtering (blocking off-topic pizza, gaming, poetry) in `apps/api/test/unit/ai/ai-guardrail.spec.ts`
- [ ] T013 [P] [US3] Unit tests for safety & injection filtering (blocking jailbreaks, prompt leakage) in `apps/api/test/unit/ai/ai-guardrail-safety.spec.ts`
- [ ] T014 [US3] Integrate `AIGuardrailService` into `AICoachService.consult` in `apps/api/src/modules/ai/http/ai-coach.service.ts`

---

## Phase 6: User Story 4 — UI/UX Membership Gating & Design System Integration

- [ ] T015 [P] [US4] Create `AiCoachMembershipGate.tsx` component using design system tokens (`tokens.css`, `--color-primary`, `--space-4`) in `apps/web/src/features/ai/components/AiCoachMembershipGate.tsx`
- [ ] T016 [US4] Integrate subscription entitlement & auth verification inside `AiCoachModal.tsx` in `apps/web/src/features/ai/components/AiCoachModal.tsx`
- [ ] T017 [P] [US4] Add CSS rules for membership gate and rate-limit badges in `apps/web/src/index.css`
- [ ] T018 [P] [US4] Unit tests for membership gating UI in `apps/web/src/features/ai/components/AiCoachModal.test.tsx`

---

## Phase 7: Verification & Build Gates

- [ ] T019 Execute backend test suite `npm run test:unit --workspace=@aura/api`
- [ ] T020 Execute web test suite `npm run test:unit --workspace=@aura/web`
- [ ] T021 Execute typecheck across workspaces `npm run typecheck`
- [ ] T022 Execute web production build `npm run build --workspace=@aura/web`
