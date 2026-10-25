# Implementation Plan: FEAT-088 Aura Broker Hub & Verified Creator Marketplace

## 1. Technical Architecture & Component Tree

```text
packages/shared/src/
  ├── types/broker.types.ts           # DTOs, Enums, Validation schemas
  └── constants/compliance.ts         # Prohibited keywords, CTCK catalog

apps/api/src/modules/broker/
  ├── broker.service.ts              # Business logic: registration, verification, enrollment, escrow split
  ├── broker.routes.ts               # HTTP REST routes for public, broker, learner, admin
  └── compliance-scanner.service.ts  # In-memory & regex keyword filter for financial compliance

apps/web/src/
  ├── api/broker.api.ts              # API client methods with typed error envelopes
  ├── features/broker/
  │     ├── pages/BrokerHubPage.tsx              # Main marketplace & verified broker catalog (/broker-hub)
  │     ├── pages/BrokerRoomDetailPage.tsx       # Exclusive Room view with lectures, briefs & simulation link
  │     ├── components/BrokerRegisterModal.tsx    # eKYC & UBCKNN CCHN partner application modal
  │     ├── components/RoomEnrollmentModal.tsx    # One-Time Entrance Fee payment & disclaimer dialog
  │     ├── components/BrokerCard.tsx             # Broker passport card with verified badge & metrics
  │     └── components/RoomCard.tsx               # Room summary card with fee, style, and member count
  ├── features/admin/components/
  │     └── AdminBrokerVerificationTable.tsx      # Admin review desk for pending broker applications
  └── app/router/
        ├── route-registry.ts                     # Add CANONICAL_ROUTES.BROKER_HUB & CANONICAL_ROUTES.BROKER_ROOM
        └── AppShell.tsx                          # Mount /broker-hub and /broker-hub/rooms/:roomId
```

## 2. API Contract Endpoints

1. `POST /api/brokers/register`: Nộp hồ sơ đối tác Broker (bắt buộc số CCHN UBCKNN).
2. `GET /api/brokers`: Lấy danh sách các Broker đã duyệt (`status: VERIFIED_ACTIVE`).
3. `GET /api/brokers/rooms`: Lấy danh bạ các phòng độc quyền đang hoạt động.
4. `GET /api/brokers/rooms/:roomId`: Lấy chi tiết phòng, kiểm tra trạng thái ghi danh của user.
5. `POST /api/brokers/rooms/:roomId/enroll`: Ghi danh tham gia phòng, nộp phí 1 lần, hạch toán 10-15% phí sàn.
6. `POST /api/brokers/rooms/:roomId/resources`: Broker đăng bài giảng/nhận định (chạy qua `complianceScanner`).
7. `GET /api/admin/brokers/pending`: Admin lấy danh sách hồ sơ chờ thẩm định.
8. `POST /api/admin/brokers/:brokerId/verify`: Admin phê duyệt hoặc từ chối hồ sơ.
9. `GET /api/admin/brokers/compliance`: Hàng đợi cờ cảnh báo tuân thủ.

## 3. UI/UX Design System Compliance (ui-styling & ui-ux-pro-max)
- Bảng màu: Dark mode chủ đạo (Navy `#0a0e17`, Slate `#1e293b`, Cyan accent `#06b6d4`, Gold badge `#eab308`).
- Thẻ tín nhiệm (Broker Credibility Passport): Gắn huy hiệu vàng rực rỡ, hiển thị rõ số CCHN UBCKNN được bọc trong khung bảo chứng.
- Tuyên bố miễn trừ trách nhiệm pháp lý (Disclaimer): Luôn hiển thị ở chân trang mỗi phòng học để bảo đảm tuân thủ luật pháp Việt Nam.
- Responsive 100%: Hoạt động mượt mà trên cả Mobile, Tablet, và Desktop.

---

## 4. 5-Role RBAC Architecture & Segregation of Duties Extension

### 4.1. Core Role Enum & Backward Compatibility
- **GUEST**: Unauthenticated visitor (handled client-side / public route guards).
- **LEARNER**: Standard authenticated investor (default after OTP; backward-compatible alias `USER`).
- **BROKER**: State-verified creator with UBCKNN license (admin approved).
- **MODERATOR**: Academic curator & content moderation guardian (24h temporary mute, official course editing).
- **SYSTEM_ADMIN**: Supreme platform & audit administrator (backward-compatible alias `ADMIN`).

### 4.2. Backend Authorization Middleware & Governance
- `apps/api/src/modules/auth/authorization.constants.ts`: Expand `ROLES` to include `LEARNER`, `BROKER`, `MODERATOR`, `SYSTEM_ADMIN` alongside `USER` and `ADMIN`. Add role helper predicates (`isSystemAdmin`, `isModerator`, `isBroker`, `isLearner`).
- `apps/api/src/modules/auth/role.seed.ts`: Idempotently seed descriptions for all 5 canonical roles in PostgreSQL.
- `apps/api/src/modules/admin/admin.service.ts`: Enforce invariant preventing `SYSTEM_ADMIN` self-suspension and self-demotion.
- `apps/api/tests/unit/authorization.middleware.test.ts`: Add comprehensive test suite covering the 5-role matrix, multiple-role matching, and fail-closed security.

### 4.3. Frontend UI Guards & Natural Role-Aware UX (ui-styling & ui-ux-pro-max)
- `apps/web/src/features/auth/components/RoleGuard.tsx`: Reusable role gate component displaying natural fallback or redirect with accessible visual hierarchy.
- `apps/web/src/features/admin/components/AdminRouteGuard.tsx`: Updated to admit `SYSTEM_ADMIN`, `ADMIN`, and `MODERATOR` (with scoped tabs).
- `apps/web/src/app/shell/AppHeader.tsx`:
  - Natural, elegant role pill on header: Red shield for `SYSTEM_ADMIN`, Cyan shield for `MODERATOR`, Emerald badge for `BROKER`, Upgrade pill for `LEARNER`.
  - In User Dropdown: Dedicated role badge with subtle glassmorphic background, semantic color borders, and descriptive Vietnamese label.
  - Quick action links contextualized by role: "Phòng Của Tôi" for Brokers, "Kiểm Duyệt Học Thuật" for Moderators, "Admin Console" for Admins.

