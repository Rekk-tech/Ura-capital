# FEAT-077 Acceptance Criteria: Admin Control Surface UI

Status: VERIFIED / READY_FOR_GATE_REVIEW (Feature Implementation Branch: feat/FEAT-077-admin-control-surface)

## Acceptance Criteria

- **AC-001**: `/admin` is promoted to `AVAILABLE` in `route-registry.ts` with `requiresAuth: true`, `requiredRole: "ADMIN"`, and `owningFeature: "FEAT-077"`. Sub-routes (`/admin/users`, `/admin/moderation`, `/admin/audit`) are defined and recognized by route resolution.
- **AC-002**: Unauthenticated visitors navigating to `/admin` are redirected to `/login?returnTo=%2Fadmin` or prompted with authentication-required UI. Authenticated non-admin learners navigating to `/admin` receive a deterministic 403 Forbidden / Access Denied view without exposing administrative controls or issuing unauthorized queries to admin endpoints.
- **AC-003**: The Admin Dashboard (`AdminDashboardPage.tsx`) provides high-level system metrics overview (Total Users, Active Sessions, Flagged Items, System Status), tabbed navigation between operational panels, and gracefully handles all 5 async UI states: Loading (skeleton), Empty, Auth/Role-Required (403), Error (with retry button), and Success.
- **AC-004**: The User Management panel (`AdminUserTable.tsx`) displays user details (User ID, Display Name, Email, Role, Status, Created Date), supports filtering by status, search by email/display name, and status toggle action (Suspend / Reactivate) backed by a keyboard-accessible confirmation dialog.
- **AC-005**: The Content Moderation Desk (`AdminModerationQueue.tsx`) presents flagged community items (posts/comments) with reported reasons, flag counts, and preview snippets. Offers resolution actions ("Dismiss Report", "Hide/Delete Content") with server confirmation.
- **AC-006**: The Audit Log Viewer (`AdminAuditLogTable.tsx`) presents an immutable, read-only table of security and administrative events (event type, actor ID, target entity, timestamp, status). Explicitly renders the Server Authority Notice: "All administrative actions and role evaluations are strictly server-authoritative and immutably audited."
- **AC-007**: `AdminApiClient` forwards native `AbortSignal` across all fetch methods. TanStack Query hooks in `use-admin.ts` configure `staleTime: 30_000`, `refetchOnWindowFocus: false`, and suppress automated retries on 401, 403, and 404.
- **AC-008**: The interface satisfies accessibility and responsive standards: single H1 heading, valid heading hierarchy, keyboard accessible actions (Tab/Enter/Space/Escape), modal focus trap, `@media (prefers-reduced-motion: reduce)`, responsive design down to 320px with zero horizontal overflow, and passes all unit, component, and regression tests.

## Traceability Matrix

| Requirement | Task | Acceptance | State |
|---|---|---|---|
| FR-001 | T001 | AC-001 | PASS |
| FR-002 | T002 | AC-002 | PASS |
| FR-003 | T003 | AC-003 | PASS |
| FR-004 | T004 | AC-004 | PASS |
| FR-005 | T005 | AC-005 | PASS |
| FR-006 | T006 | AC-006 | PASS |
| FR-007 | T007 | AC-007 | PASS |
| FR-008 | T008 | AC-008 | PASS |

## Verdict Rule

PASS requires AC-001 through AC-008 with no mandatory skip, zero database migrations, Phase 8 AI isolation preserved, truthful evidence, and exact-source CI green.
Status: PASS (All AC-001..AC-008 verified with 409 passing unit/component tests, clean lint, clean typecheck, and clean build).
