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

### User Story 6: Map 2 (Pro Room) 2-Column Cockpit Layout, Allocation Sliders & CrediFin AI Advisor (Priority: P1)
As a systematic value investor in Map 2 (Pro Room), I want a faithful implementation of the 12-Quarter Macro Cockpit matching the Figma mockup, with an intact 2-column layout, responsive allocation sliders, CrediFin AI Advisor card, and candlestick chart with macro indicators.

**Acceptance Criteria**:
1. **Intact 2-Column Grid Layout**:
   - The desktop layout (>= 1024px) strictly enforces a 2-column grid (`~62%` left column, `~38%` right column) with Vanilla CSS tokens:
     - Left column: `VN30 Index & Multi-Asset Benchmark` [LIVE FEED] above `Macroeconomic Climate & Systemic Drivers (Q1)` [Macro Engine v3.4].
     - Right column: `CrediFin AI Advisor` [AI Strategic Co-Pilot • Level 2 Verified] above `Phân Bổ Danh Mục Quý 1` [Hợp lệ: 100%].
     - Bottom row: Full-width `Sổ Lệnh & Biên Bản Khởi Tạo Quý (Order Desk)` with audit hash.
   - On screens < 1024px, collapses smoothly into a responsive 1-column layout without clipping or horizontal overflow.
2. **Portfolio Allocation Sliders**:
   - Custom styled range slider inputs with cross-browser CSS (no raw unstyled default appearance), no overflow, and smooth tracking.
   - 4 asset allocation rows:
     - `1. Growth Equity ($EQ_GROWTH)`: VinAlpha, Tech Leaders, Clean Energy | 35% | 35.000.000 VND
     - `2. Value Equity ($EQ_VALUE)`: Ngân hàng, Tiêu dùng, BĐS Khu Công Nghiệp | 25% | 25.000.000 VND
     - `3. Government Bonds ($BOND)`: Trái phiếu chính phủ 5Y (Lợi suất 4.8%) | 20% | 20.000.000 VND
     - `4. Cash & Reserves ($CASH)`: Tiền gửi thanh khoản cao & Quản trị rủi ro | 20% | 20.000.000 VND
   - Total verification pill: `100% / 100%` (green if valid, red if != 100%).
   - CTA button: `XÁC NHẬN & CHỐT QUÝ 1 →` with safety lock disclosure text below.
3. **CrediFin AI Advisor Card**:
   - Renders dark bot glyph badge with green online status dot, title `CrediFin AI Advisor`, and subtitle `AI Strategic Co-Pilot • Level 2 Verified`.
   - Renders quote bubble: `"Ở Map này, tốc độ không quan trọng bằng sự kiên nhẫn và logic phân tích." — CrediFin Core Directive`.
   - Renders strategy recommendation box: `Gợi ý chiến lược Q1: Cân bằng 60/40 giữa Cổ phiếu (Growth & Value) và Tài sản phòng thủ (Bonds & Cash) để tối ưu hóa Sharpe Ratio và giữ vững kỷ luật vốn.`
4. **Candlestick Chart & Macro Drivers**:
   - Renders VN30 live rate (`1,284.60 (+14.20 / +1.12%)`), chart toggles (`[Candles] [Line] [Heikin Ashi]` and `[1Q] [2Q] [1Y] [3Y]`), and indicator strip (`MA(20): 1,262.15`, `MA(50): 1,218.40`, `RSI(14): 54.2`, `Vol: 145.2M shares`).
   - SVG candlestick chart with wicks, bullish/bearish color encoding, volume histogram, and cycle timeline markers.
   - Macro drivers card renders 3 metric tiles (Lãi Suất 5.0%, Lạm Phát CPI 2.5%, Tăng Trưởng GDP 7.5%) and Aura Research insight callout.

---

### User Story 7: Admin Content Moderation & Security Audit Log Routes & Error Copy Polish (Priority: P1)
As a platform administrator, I want the Content Moderation and Security Audit Trail tabs to load real backend data via authenticated `/admin/moderation` and `/admin/audit` routes without 404 errors, with accurate non-copy-pasted error messages and no unwanted red toast banners on the overview screen.

**Acceptance Criteria**:
1. **Backend Route Mounting**:
   - `GET /admin/moderation` & `GET /api/admin/moderation`: authenticated admin route returning `ListModerationResponse`.
   - `POST /admin/moderation/:itemId/resolve` & `POST /api/admin/moderation/:itemId/resolve`: authenticated admin route handling dismiss/hide/delete actions.
   - `GET /admin/audit` & `GET /api/admin/audit`: authenticated admin route returning `ListAuditResponse`.
2. **Repository Boundary Compliance**:
   - All moderation and audit database queries are encapsulated inside `IAdminRepository` / `PrismaAdminRepository`, maintaining zero boundary violations.
3. **Error Copy-Paste Bug Fix**:
   - In `AdminAuditLogTable.tsx`, error heading and text are corrected from moderation queue copy to:
     - Title: `Không thể tải nhật ký kiểm toán (Unable to load audit records)`
     - Text: `Không thể kết nối đến kho lưu trữ sự kiện bảo mật hoặc phiên đăng nhập. Vui lòng thử lại.`
4. **Overview Toast Stabilization**:
   - The Overview tab does not trigger any red 404 toast notifications during initial loading or normal administration workflows.

---

### User Story 8: Aura Intelligence (AI Learning Coach) Full Production Transition (Priority: P1)
As an active learner and simulation participant, I want to interact directly with the Aura Intelligence AI Learning Coach to receive real-time financial education, tactical debriefs, and market explanations, moving beyond the static "Coming Soon" MVP placeholder.

**Acceptance Criteria**:
1. **Backend Authenticated AI Route (`POST /api/ai/coach` & `POST /ai/coach`)**:
   - Requires valid bearer authentication (`authenticate` middleware); rejects unauthenticated calls with 401.
   - Accepts request payload `{ query: string, topic?: string, mapContext?: "MAP1" | "MAP2" | "GENERAL" }`.
   - Enforces strict input validation: `query` must be a non-empty string under 1,000 characters.
   - Defends against prompt injection and jailbreak attempts; rejects system prompt exfiltration.
   - Invokes server-side AI engine: uses Gemini provider if `GEMINI_API_KEY` is present, or the high-fidelity deterministic value/macro reasoning engine if in test/fake/offline mode.
   - Appends mandatory educational and simulation disclaimers: `"Tất cả phản hồi từ Cố vấn Aura Intelligence chỉ mang tính chất giáo dục mô phỏng đầu tư, không cấu thành lời khuyên đầu tư tài chính thực tế."`.
   - Never leaks provider secrets, API keys, or raw provider errors to client.
2. **Frontend AI Coach Modal / Drawer Widget (`AiCoachModal.tsx`)**:
   - High-fidelity interactive UI modal adhering to Vanilla CSS design tokens (`--bg-card`, `--border-subtle`, `--accent-primary`, `--accent-purple`, glassmorphism backdrop).
   - Dynamic quick-prompt chips:
     - `"Giải thích chỉ số P/E & P/B trong đầu tư"`
     - `"Làm thế nào để tránh bẫy FOMO ở Map 1?"`
     - `"Chiến lược phân bổ tài sản Graham 60/40 ở Map 2"`
     - `"Tác động của Lãi suất và Lạm phát tới VN30"`
   - Interactive conversation history with distinct User vs AI Coach bubbles and typing indicator during inference.
   - Suggested follow-up prompt chips returned by the coach.
   - Accessible keyboard controls (Escape to close, autofocus, aria-modal, focus trap).
3. **Landing Page Card 7 Upgrade (`LandingPage.tsx`)**:
   - Remove `card-deferred` visual disabling class.
   - Update badge from `Phase 8 Intelligence — Coming Soon` to `SẴN SÀNG` (`badge-success-subtle`).
   - Replace static `Đang Phát Triển` text with an active trigger button `Trò Chuyện Cùng Cố Vấn →` that opens the interactive AI Coach modal.
4. **Global Quick Access in Header (`AppHeader.tsx`)**:
   - Add an AI Coach trigger button (`[Trợ Lý AI]` with CPU/sparkles icon) allowing learners to summon the coach from any page.

---

## 3. Non-Functional Requirements & Design Tokens
- **Theme**: Light & Bright Corporate FinTech (`--bg-primary: #F7FAFF`, `--bg-card: #FFFFFF`, `--border-subtle: #E1E8F5`, `--accent-primary: #1D6FF2`, `--text-primary: #0B1B3A`).
- **CSS Architecture**: Pure Vanilla CSS tokens and scoped utility classes in `apps/web/src/index.css`. No reliance on uncompiled TailwindCSS classes.
- **Accessibility**: All interactive elements have descriptive `aria-label`, keyboard focus rings, role attributes, and semantic table markup.
- **Self-Suspension Guard**: Strict dual-layer defense (UI disabled button + backend validation guard).

