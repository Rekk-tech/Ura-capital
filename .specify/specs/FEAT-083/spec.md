# Feature Specification: FEAT-083 — System Admin Console Governance, RBAC Safety Guards, Domain Oversight & Vietnamese Localization

**Feature Branch**: `planning/phase-9-master` (feat/admin-console-safety-and-features)  
**Created**: 2026-10-03  
**Status**: In-Progress (Approved for Implementation)  
**Scope**: `apps/web/src/features/admin/`, `apps/web/src/features/auth/`, `apps/api/src/modules/admin/`

---

## 1. Executive Summary & Problem Analysis
Audit and review of the System Admin console (`admin.aura2026@aura.internal`) revealed 5 critical governance, UX, and operational defects:
1. **Critical RBAC Security Flaw**: System Admin can accidentally suspend themselves because the [Suspend] button is active on their own user row, risking permanent system lockout.
2. **Irrational Post-Login Routing**: Admin login routes to the Learner Dashboard (`/dashboard`), showing blank learner states ("Chưa đăng ký khóa học nào", "Chưa có danh mục mô phỏng") instead of the Admin Control Surface (`/admin`).
3. **Missing Vietnamese Localization**: The entire Admin Console is in English, inconsistent with the platform's Vietnamese and bilingual EdTech standard.
4. **Limited User Management Table**: Lacks role switching/promotion (LEARNER <-> ADMIN), learner detail inspection (XP, enrolled courses, Map 1 survival badges, NAV), and password reset assistance.
5. **Absence of Core EdTech & Simulation Oversight**: Metrics only display static numbers with no operational visibility into Map 1 (FOMO Arena) vs Map 2 (Pro Room) sessions, course completion rates, or broken session recovery.

This feature resolves all five defects with server-authoritative safety guards, rich UI/UX ergonomics (via `@ui-ux-pro-max` and `@ui-styling`), and domain-specific oversight tools.

---

## 2. User Scenarios & Acceptance Criteria *(Mandatory)*

### User Story 1: Self-Suspension Protection & Current User Badge (Priority: P1)
As an authenticated System Admin, I must never be able to suspend my own account, and my account row must clearly identify me as the current active operator, so that administrative access cannot be accidentally severed.

**Acceptance Criteria**:
1. **Given** the User Governance table in `AdminUserTable.tsx`, **When** the row matches the authenticated user (`authUser.id === user.id` or `authUser.email === user.email`), **Then**:
   - The `[Khóa tài khoản / Suspend]` button is disabled (`disabled={true}`, visually subdued, not clickable).
   - A distinct pill badge `(Tài khoản hiện tại / Current User)` is rendered beside their name/email.
2. **Given** any direct API request to suspend a user, **When** the actor targets their own ID (`actorId === targetUserId`), **Then** the backend rejects the request with HTTP 400/403 and error code `CANNOT_SUSPEND_SELF`.

---

### User Story 2: Role-Aware Post-Login Redirection & Navigation (Priority: P1)
As an administrator signing in at `/login`, I want to be redirected directly to `/admin` (Bảng Điều Khiển Quản Trị Hệ Thống) rather than the learner dashboard, and I want the header brand logo/links to prioritize administrator destinations.

**Acceptance Criteria**:
1. **Given** a user with `role === "ADMIN"` or `roles.includes("ADMIN")` logging in without an explicit `returnTo` URL, **When** login succeeds, **Then** they are redirected to `/admin`.
2. **Given** an authenticated admin visiting `/login` directly, **Then** they are routed to `/admin`.
3. **Given** the global header `AppHeader.tsx`, **When** logged in as an Admin, **Then**:
   - Clicking the brand logo (`Aura Capital`) navigates directly to `/admin`.
   - The header displays the active red `Admin Console` badge pill and the user dropdown offers instant navigation to the Admin Console.

---

### User Story 3: Complete Vietnamese Localization of the Admin Console (Priority: P2)
As a Vietnamese operations administrator, I want all console headings, navigation tabs, stat cards, table columns, filter options, and status badges in clear, professional Vietnamese terminology.

**Acceptance Criteria**:
1. **Title & Header**: `Bảng Điều Khiển Quản Trị Hệ Thống` with operational subtitle and server authority badge.
2. **Navigation Tabs**: `Tổng Quan (Overview)`, `Quản Lý Người Dùng (Users)`, `Kiểm Duyệt Nội Dung (Moderation)`, `Nhật Ký Kiểm Toán (Audit Logs)`.
3. **Stat Cards**:
   - `Người Dùng Đăng Ký` / `Người Dùng Hoạt Động (24h)`
   - `Phiên Giả Lập Đang Chạy`
   - `Báo Cáo Chờ Xử Lý`
   - `Trạng Thái Hệ Thống` (`HOẠT ĐỘNG TỐT / HEALTHY`)
4. **Table Columns**: `NGƯỜI DÙNG`, `EMAIL`, `VAI TRÒ`, `TRẠNG THÁI`, `NGÀY TẠO`, `THAO TÁC`.
5. **Badges**: `HOẠT ĐỘNG (ACTIVE)`, `BỊ KHÓA (SUSPENDED)`, `HỌC VIÊN (LEARNER)`, `QUẢN TRỊ VIÊN (ADMIN)`.

---

### User Story 4: Role Assignment & Learner Detail Drawer (Priority: P1)
As a platform administrator, I want to promote or reassign user roles between LEARNER and ADMIN with confirmation, and inspect full learner stats in a slide-out drawer, so that I can govern users effectively.

**Acceptance Criteria**:
1. **Role Switching**:
   - Admin can trigger a role change modal for any user (except demoting oneself).
   - Confirmation dialog clearly outlines the permissions change before calling `adminApi.updateUserRole(userId, newRole)`.
2. **Learner Detail Drawer**:
   - Clicking any user opens an inspection drawer showing:
     - Total XP earned & current rank.
     - Enrolled Academy courses and completion percentages.
     - Map 1 (FOMO Arena) survival status (`Survivor of FOMO Storm` badge or active round).
     - Map 2 (Pro Room) portfolio NAV, cash balance, and benchmark Alpha.
3. **Password Reset Action**:
   - Admin can trigger a simulated password reset / activation link trigger with instant feedback notification.

---

### User Story 5: Domain Simulation & Academy Oversight (Priority: P2)
As an EdTech and Financial Game administrator, I want operational visibility into running Map 1 and Map 2 sessions and course completions, with the ability to reset stalled sessions.

**Acceptance Criteria**:
1. **Simulation Oversight Widget in Overview**:
   - Displays real-time breakdown of Map 1 (FOMO Arena) active sessions and survival rate.
   - Displays Map 2 (Pro Room) active sessions and portfolio averages.
   - Provides a `[Khởi Động Lại Phiên Lỗi]` (Reset Stalled Session) action that clears hung sessions and restores user access.
2. **Academy Oversight Widget in Overview**:
   - Displays completion statistics for core courses (`Stock Investing 101`, `Options & Derivatives`).

---

## 3. Non-Functional Requirements & Design Tokens
- **Theme**: Inherits Aura Capital dark financial cockpit theme (`--bg-primary: #0a0e17`, `--border-subtle: rgba(255,255,255,0.08)`, `--accent-cyan: #06b6d4`, `--accent-primary: #3b82f6`).
- **Accessibility**: All interactive elements have descriptive `aria-label`, keyboard focus rings, role attributes, and semantic table markup.
- **Self-Suspension Guard**: Strict dual-layer defense (UI disabled button + backend validation guard).
