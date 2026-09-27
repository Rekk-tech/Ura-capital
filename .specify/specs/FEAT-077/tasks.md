# FEAT-077 Tasks: Admin Control Surface UI

Status: COMPLETED (Feature Implementation Branch: feat/FEAT-077-admin-control-surface)

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Route Governance: Promote `/admin` to `AVAILABLE`, register sub-routes (`/admin/users`, `/admin/moderation`, `/admin/audit`), configure `requiresAuth: true`, `requiredRole: "ADMIN"`, and `owningFeature: "FEAT-077"` in `route-registry.ts` and `route-registry.test.ts`. | FR-001 | AC-001 | COMPLETED |
| T002 | RBAC Guarding: Implement `<AdminRouteGuard>` and `<AdminRoutes />`, wire into `AppShell.tsx`, redirect unauthenticated to `/login?returnTo=%2Fadmin`, and render deterministic 403 Forbidden view for non-admin users without dispatching administrative queries. | FR-002 | AC-002 | COMPLETED |
| T003 | API Client & Hooks: Implement `AdminApiClient` with `verifyAdminAccess`, `getSystemMetrics`, `listUsers`, `updateUserStatus`, `listModerationQueue`, `resolveModerationItem`, `listAuditRecords`, forwarding `AbortSignal`. Create TanStack Query hooks in `use-admin.ts` with `staleTime: 30_000`, `refetchOnWindowFocus: false`, and retry suppression on 401, 403, 404. | FR-007 | AC-007 | COMPLETED |
| T004 | Admin Dashboard View: Build `AdminDashboardPage.tsx` with high-level operational overview, system metrics cards, tabbed navigation, 5 async states, and Server Authority Notice banner. | FR-003 | AC-003 | COMPLETED |
| T005 | User Management Panel: Build `AdminUserTable.tsx` with user list, search by email/name, filter by status, and suspend/reactivate action with accessible confirmation modal. | FR-004 | AC-004 | COMPLETED |
| T006 | Content Moderation Desk: Build `AdminModerationQueue.tsx` with flagged items list, snippet preview, report count, and dismiss/hide resolution actions. | FR-005 | AC-005 | COMPLETED |
| T007 | Audit Log Inspection: Build `AdminAuditLogTable.tsx` displaying immutable security and administrative events with timestamp, actor, event type, and status. | FR-006 | AC-006 | COMPLETED |
| T008 | Testing & Quality Gate: Unit and component test suites (`admin.api.test.ts`, `AdminDashboardPage.test.tsx`, `AdminUserTable.test.tsx`, `AdminModerationQueue.test.tsx`, accessibility tests), lint, typecheck, build, and implementation report. | FR-008 | AC-008 | COMPLETED |

## Dependency Order

T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008.
All tasks strictly maintain zero DB migrations and Phase 8 AI isolation.
