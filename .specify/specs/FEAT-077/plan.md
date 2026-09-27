# FEAT-077 Plan: Admin Control Surface UI

Status: IN_PROGRESS (Feature Implementation Branch: feat/FEAT-077-admin-control-surface)

## 1. Preconditions & Baseline
- Approved Baseline: `planning/phase-9-master` (tag: `feat-076-approved`, SHA: `b409562`).
- Working Directory: `d:\project\ura-capital\.tmp\phase9-planning`.
- Feature Branch: `feat/FEAT-077-admin-control-surface`.
- Zero database migrations (all 10 original Prisma migrations remain untouched).
- Phase 8 AI Track: Strictly FROZEN.

## 2. Delivery Sequence
1. **Route Governance & Sub-routes (T001)**:
   - Update `apps/web/src/app/router/route-registry.ts`: promote `/admin` to `AVAILABLE`, set `requiresAuth: true`, `requiredRole: "ADMIN"`, and register sub-routes `/admin/users`, `/admin/moderation`, `/admin/audit`.
   - Update `route-registry.test.ts` to assert admin route metadata and role constraints.
2. **RBAC Guarding & Shell Mounting (T002)**:
   - Create `<AdminRouteGuard>` and `<AdminRoutes />` in `apps/web/src/features/admin/routes/admin-routes.tsx`.
   - Mount `<AdminRoutes />` in `apps/web/src/app/shell/AppShell.tsx`.
   - Unauthenticated visitors are redirected to `/login?returnTo=%2Fadmin`.
   - Non-admin authenticated learners receive deterministic 403 Forbidden / Access Denied view without issuing administrative queries.
   - Update `AppShell.test.tsx` to assert admin routes resolve correctly for admins and reject non-admins.
3. **API Client & React Query Hooks (T003)**:
   - Create `apps/web/src/api/admin.api.ts` with `AdminApiClient` supporting:
     - `verifyAdminAccess(accessToken, options)`
     - `getSystemMetrics(accessToken, options)`
     - `listUsers(params, accessToken, options)`
     - `updateUserStatus(userId, data, accessToken, options)`
     - `listModerationQueue(params, accessToken, options)`
     - `resolveModerationItem(itemId, action, accessToken, options)`
     - `listAuditRecords(params, accessToken, options)`
     - Forwarding native `AbortSignal` across all fetch calls.
   - Create `apps/web/src/features/admin/hooks/use-admin.ts` with TanStack Query hooks:
     - `staleTime: 30_000` (30s), `refetchOnWindowFocus: false`.
     - Suppress retries on 401, 403, and 404.
4. **Admin Dashboard Page & Panels (T004 - T007)**:
   - `AdminDashboardPage.tsx`: operational overview, system metrics, tabs, 5 async states (Loading skeleton, Empty, Auth/Role-required 403, Error with retry, Success), and Server Authority Notice banner.
   - `AdminUserTable.tsx`: user table with search, status filter, and suspend/reactivate confirmation dialog.
   - `AdminModerationQueue.tsx`: flagged items with report reason, snippet, dismiss/delete actions.
   - `AdminAuditLogTable.tsx`: read-only immutable event log.
5. **Testing & Quality Verification (T008)**:
   - Unit tests for `admin.api.test.ts`.
   - Component tests for `AdminDashboardPage.test.tsx`, `AdminUserTable.test.tsx`, `AdminModerationQueue.test.tsx`.
   - Accessibility tests (single H1, keyboard navigation, modal focus trap, ARIA labels).
   - Validation checks: `npm run lint`, `npm run typecheck`, `npm run test:web`, `npm run build`.
   - Generate implementation report: `reports/implementation/phase-9/FEAT-077.md`.
