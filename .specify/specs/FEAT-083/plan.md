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

### B. Backend Layer (`apps/api`)
1. **`apps/api/src/modules/admin/admin.service.ts`**:
   - Service to handle admin operations including `updateUserStatus`, `updateUserRole`, `resetSimulationSession`.
   - **Crucial Backend Guard**: If `actorId === targetUserId` (or `actorEmail === targetEmail`), reject with `CANNOT_SUSPEND_SELF`.
2. **`apps/api/src/modules/admin/admin.controller.ts` & `admin.route.ts`**:
   - Add route for status update with self-suspension check and role update endpoints.

---

## 2. Implementation Steps

- [x] Step 1: Spec & Plan creation in `.specify/specs/FEAT-083/`.
- [ ] Step 2: Implement backend guard and service in `apps/api/src/modules/admin/`.
- [ ] Step 3: Implement `adminApi` extensions for role update & session reset in `apps/web/src/api/admin.api.ts`.
- [ ] Step 4: Implement self-suspension guard, Vietnamese localization, role modal, and learner drawer in `AdminUserTable.tsx`.
- [ ] Step 5: Implement Vietnamese localization and domain simulation oversight widgets in `AdminDashboardPage.tsx`.
- [ ] Step 6: Implement admin post-login redirect in `LoginPage.tsx` and header navigation update in `AppHeader.tsx`.
- [ ] Step 7: Run unit and integration tests (`npm run test:web`, `npm run typecheck`, `npm run lint`).
- [ ] Step 8: Commit and verify.
