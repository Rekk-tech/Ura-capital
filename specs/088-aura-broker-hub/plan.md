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
