# Feature Implementation Plan: FEAT-083 — System Admin Console Governance, RBAC Safety Guards, Domain Oversight & Vietnamese Localization

**Feature Directory**: `.specify/specs/FEAT-083`  
**Status**: In-Progress  
**Branch**: `planning/phase-9-master`

---

## 1. Technical Architecture & Component Boundaries

### A. Frontend Layer (`apps/web`)
1. **`apps/web/src/features/admin/pages/AdminDashboardPage.tsx`**:
   - Translate all tabs, headers, subheadings, and stat cards to Vietnamese.
   - Add Domain Simulation Oversight widget (Map 1 active vs Map 2 active sessions, survival stats, broken session reset button).
   - Add Academy Course Completion widget (completion rates, learner counts).
2. **`apps/web/src/features/admin/components/AdminUserTable.tsx`**:
   - Translate table columns, filters, status pills, and action modals to Vietnamese.
   - **Self-Protection Guard**: Check `isCurrentUser` (`user.id === authUser.id || user.email === authUser.email`). If true, disable Suspend button and display `(Tài khoản hiện tại / Current User)` badge.
   - **User Role Management**: Add modal to promote/demote users between LEARNER and ADMIN, with guard preventing self-demotion.
   - **Learner Profile Drawer**: Slide-out drawer or modal displaying real-time XP, courses progress, Map 1 survival badge, and active portfolio NAV.
   - **Password Reset Tool**: Action to trigger credential reset with confirmation banner.
3. **`apps/web/src/api/admin.api.ts` & `use-admin.ts`**:
   - Add `updateUserRole(userId, role, accessToken)` to `adminApi` and `useUpdateUserRole` hook in `use-admin.ts`.
   - Add `resetSimulationSession(sessionId, accessToken)` to `adminApi` and hook.
4. **`apps/web/src/features/auth/pages/LoginPage.tsx` & `AppHeader.tsx`**:
   - In `LoginPage.tsx`: If authenticated user has `ADMIN` role and no specific `returnTo` parameter is passed, redirect directly to `/admin`.
   - In `AppHeader.tsx`: For Admin users, clicking the logo/home routes directly to `/admin`.

### C. Aura Intelligence Layer (`apps/api` & `apps/web`)
1. **`apps/api/src/modules/ai/http/` & `server.ts`**:
   - `ai.controller.ts`: Validates input (`query`, `topic`, `mapContext`), enforces authorization, invokes AI Gateway or deterministic educational reasoning engine, formats response with required simulation & educational disclaimer.
   - `ai.routes.ts`: Exposes `POST /coach` (and alias `POST /chat`) protected by `authenticate` middleware.
   - `server.ts`: Mounts `aiRouter` at `/api/ai` and `/ai`.
2. **`apps/web/src/api/ai.api.ts` & `use-ai-coach.ts`**:
   - `aiApi.askCoach`: Client method posting query to `/api/ai/coach` with bearer token.
   - `useAiCoach`: React hook maintaining message history (user and coach), loading state, suggestions, and send query action.
3. **`apps/web/src/features/ai/components/AiCoachModal.tsx`**:
   - High-fidelity interactive modal with backdrop blur, preset quick-prompts (P/E & P/B, FOMO mitigation, Graham 60/40 allocation, macro drivers), conversation feed, typing indicator, and disclaimers.
4. **`apps/web/src/app/pages/LandingPage.tsx` & `AppHeader.tsx`**:
   - `LandingPage.tsx`: Upgrade Card 7 from "Coming Soon / Đang Phát Triển" to active "SẴN SÀNG" with interactive button triggering `AiCoachModal`.
   - `AppHeader.tsx`: Add AI Coach quick launcher button in the global navigation bar.

---

## 2. Implementation Steps

- [x] Step 1: Spec & Plan creation in `.specify/specs/FEAT-083/`.
- [x] Step 2: Implement backend guard and service in `apps/api/src/modules/admin/`.
- [x] Step 3: Implement `adminApi` extensions for role update & session reset in `apps/web/src/api/admin.api.ts`.
- [x] Step 4: Implement self-suspension guard, Vietnamese localization, role modal, and learner drawer in `AdminUserTable.tsx`.
- [x] Step 5: Implement Vietnamese localization and domain simulation oversight widgets in `AdminDashboardPage.tsx`.
- [x] Step 6: Implement admin post-login redirect in `LoginPage.tsx` and header navigation update in `AppHeader.tsx`.
- [x] Step 7: Map 2 Cockpit redesign & institutional slider restoration (US6).
- [x] Step 8: Admin moderation & audit endpoints and sanitized error copy (US7).
- [ ] Step 9: Implement authenticated AI coach HTTP endpoints in `apps/api/src/modules/ai/http/` and mount in `server.ts` (US8).
- [ ] Step 10: Implement `ai.api.ts` and `use-ai-coach.ts` in `apps/web` (US8).
- [ ] Step 11: Implement `AiCoachModal.tsx` component with Vanilla CSS design tokens (US8).
- [ ] Step 12: Upgrade Landing Page Card 7 & add global header AI coach trigger (US8).
- [ ] Step 13: Run verification tests, typecheck, and validate via browser.
- [ ] Step 14: Commit and converge.

