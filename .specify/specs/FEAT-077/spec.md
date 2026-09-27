# FEAT-077 Specification: Admin Control Surface UI

Status: IN_PROGRESS (Feature Implementation Branch: feat/FEAT-077-admin-control-surface)

## 1. Architecture Contract

- Objective: Provide a comprehensive, server-authoritative, fail-closed Admin Control Surface UI for Aura Capital operations.
- Routes & Navigation:
  - Canonical entry route: `/admin` (promoted to `AVAILABLE`, `requiresAuth: true`, `requiredRole: "ADMIN"`, `owningFeature: "FEAT-077"`).
  - Sub-views / tabs: Overview (System Metrics), User Management (`/admin/users`), Content Moderation (`/admin/moderation`), Security Audit Log (`/admin/audit`).
- Security & RBAC:
  - Server-authoritative verification: Initial validation checks session authentication and queries `GET /admin/ping` (or user role claim validated by server).
  - Unauthenticated access redirects to `/login?returnTo=%2Fadmin`.
  - Authenticated non-admin learners receive a deterministic 403 Forbidden / Access Denied view without exposing administrative controls or issuing unauthorized queries to admin data endpoints.
- Network & Caching:
  - TanStack Query hooks with `staleTime: 30_000` (30s) and `refetchOnWindowFocus: false`.
  - Suppress automated retries on 401 Unauthorized, 403 Forbidden, and 404 Not Found.
  - Native `AbortSignal` plumbed across all fetch methods in `AdminApiClient`.
- Persistence & Invariants:
  - ZERO database migrations (approved total remains exactly 10).
  - Phase 8 AI track remains strictly FROZEN.
  - All administrative actions display mandatory Server Authority Disclosures.

## 2. Functional Requirements

### FR-001: Route Governance & Sub-route Promotion
Promote `/admin` from `PLANNED` to `AVAILABLE` in `route-registry.ts`. Register sub-routes (`/admin/users`, `/admin/moderation`, `/admin/audit`). Enforce `requiresAuth: true`, `requiredRole: "ADMIN"`, and `owningFeature: "FEAT-077"`.

### FR-002: Authoritative RBAC Guarding
Mount `<AdminRoutes />` in `AppShell.tsx` protected by `<AdminRouteGuard>`. Ensure unauthenticated users are directed to sign in with return path, and authenticated non-admin users receive a deterministic 403 Access Denied view with zero unauthorized query leakage.

### FR-003: Operational Overview Dashboard
Provide system metrics (total registered users, active sessions, moderation queue count, system health status), quick links, and responsive tabs for switching control surface views.

### FR-004: User Management Surface
Present paginated, searchable, and filterable table of registered users with User ID, Display Name, Email, Role, Status, and Created Date. Support user status toggle (Suspend / Reactivate) with accessible confirmation dialog.

### FR-005: Content Moderation Desk
Queue of reported community items (posts, comments) displaying report reason, flag count, and preview snippet. Support moderation actions ("Dismiss Report", "Hide/Delete Content") with server confirmation.

### FR-006: Audit Log Inspection Table
Read-only table of administrative and security events (event type, actor ID, target entity, timestamp, status). Render mandatory Server Authority Notice: "All administrative actions and role evaluations are strictly server-authoritative and immutably audited."

### FR-007: Safe State & Network Handling
Cleanly handle all 5 async UI states across all admin panels: Loading (skeleton), Empty, Auth/Role-required (403), Error (with retry button), and Success. Ensure `AdminApiClient` passes `AbortSignal` and hooks suppress retries on 401/403/404.

### FR-008: Accessibility & Responsive Standards
Ensure single H1 heading per view, valid heading hierarchy, keyboard accessible actions (Tab/Enter/Space/Escape), focus trap in confirmation modals, `@media (prefers-reduced-motion: reduce)`, and responsive layout from 320px+ with zero horizontal overflow.
