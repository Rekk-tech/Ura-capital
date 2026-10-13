# Tasks: FEAT-083 — System Admin Governance, Map 2 Redesign & Aura Intelligence Production Integration

Status: CONVERGED (ALL TASKS COMPLETE)
Phase: Phase 9 — Production Convergence

## Phase 1: Admin Governance & Safety Guardrails
- [x] T001 Implement self-suspension guard in backend `AdminService` rejecting actor self-targeting per US1/AC2 (`apps/api/src/modules/admin/admin.service.ts`).
- [x] T002 Implement self-suspension disablement and `(Tài khoản hiện tại / Current User)` badge in `AdminUserTable.tsx` per US1/AC1 (`apps/web/src/features/admin/components/AdminUserTable.tsx`).
- [x] T003 Implement role-aware post-login redirection to `/admin` in `LoginPage.tsx` per US2/AC1, AC2 (`apps/web/src/features/auth/pages/LoginPage.tsx`).
- [x] T004 Implement admin header branding and direct console link in `AppHeader.tsx` per US2/AC3 (`apps/web/src/features/navigation/AppHeader.tsx`).
- [x] T005 Implement complete Vietnamese localization of headings, tabs, cards, tables, and badges per US3/AC1..AC5 (`apps/web/src/features/admin/`).
- [x] T006 Implement role management dialog and learner details inspection drawer per US4/AC1, AC2 (`apps/web/src/features/admin/components/AdminUserTable.tsx`).
- [x] T007 Implement domain simulation oversight and academy metrics widgets per US5/AC1, AC2 (`apps/web/src/features/admin/pages/AdminDashboardPage.tsx`).

## Phase 2: Map 2 Cockpit Redesign & Institutional Standards
- [x] T008 Implement 2-column cockpit layout (~62% / ~38%) with `.pro-room-grid-cockpit` per US6/AC1 (`apps/web/src/features/simulation/pages/ProRoomPage.tsx`).
- [x] T009 Implement cross-browser custom range sliders `.pro-slider-input` with exact percentage & VND tracking per US6/AC2 (`apps/web/src/features/simulation/pages/ProRoomPage.tsx`).
- [x] T010 Implement CrediFin AI Advisor card with directive quote and Q1 60/40 strategy per US6/AC3 (`apps/web/src/features/simulation/pages/ProRoomPage.tsx`).
- [x] T011 Implement SVG candlestick chart with indicators (MA, RSI, Volume) and macro drivers card per US6/AC4 (`apps/web/src/features/simulation/pages/ProRoomPage.tsx`).

## Phase 3: Content Moderation & Security Audit Trail Endpoints
- [x] T012 Implement authenticated `/admin/moderation` & `/admin/audit` routes in backend per US7/AC1, AC2 (`apps/api/src/modules/admin/admin.route.ts`).
- [x] T013 Sanitize error copy text in `AdminAuditLogTable.tsx` and eliminate spurious overview toasts per US7/AC3, AC4 (`apps/web/src/features/admin/components/AdminAuditLogTable.tsx`).

## Phase 4: Aura Intelligence (AI Learning Coach) Production Integration
- [x] T014 Implement authenticated AI coach HTTP endpoints `POST /api/ai/coach` & `POST /ai/coach` in `apps/api/src/modules/ai/http/` and mount in `server.ts` per US8/AC1.
- [x] T015 Implement AI client `apps/web/src/api/ai.api.ts` and React hook `useAiCoach.ts` per US8/AC1, AC2.
- [x] T016 Implement high-fidelity `AiCoachModal.tsx` with quick-prompt chips, interactive conversation history, and simulation disclaimer per US8/AC2.
- [x] T017 Upgrade Landing Page Card 7 from "Coming Soon" to active "SẴN SÀNG" with modal launch trigger per US8/AC3 (`apps/web/src/app/pages/LandingPage.tsx`).
- [x] T018 Add global AI Coach launcher button in `AppHeader.tsx` per US8/AC4 (`apps/web/src/features/navigation/AppHeader.tsx`).
- [x] T019 Verify with unit tests, typecheck, build, and browser verification per US8/AC1..AC4.

## Dependency Order
T001..T013 (Completed) -> T014 -> T015 -> T016 -> T017, T018 -> T019.
