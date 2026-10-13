# Tasks: FEAT-087 Multi-Scenario Realistic Market Simulation Engine & Cross-Tab Language/UI Logic Harmonization

**Feature Code**: `FEAT-087`  
**Created**: 2026-10-13  
**Status**: COMPLETED  

---

## Task List

- [x] **Task 1: Cross-Tab Language & UI Logic Harmonization**
  - [x] T1.1: Chuẩn hóa `AppHeader.tsx`: Cập nhật `VI_NAV_LABELS` cho tất cả các route (`/ai`, `/subscription`, `/admin`), dịch dropdown menu người dùng sang tiếng Việt tài chính.
  - [x] T1.2: Chuẩn hóa `DashboardPage.tsx` và widgets (`DashboardHeader`, `AcademySummaryWidget`, `SimulationSummaryWidget`, `CommunitySummaryWidget`, `SubscriptionSummaryWidget`): Chuyển đổi toàn bộ nhãn, tiêu đề, nút xem thêm sang tiếng Việt chuẩn mà vẫn giữ nguyên test invariants.
  - [x] T1.3: Chuẩn hóa `SimulationDashboardPage.tsx` và các component Cockpit (`MapSelectionView`, `MarketPriceView`, `PositionsTable`, `OrdersTable`, `TradesTable`): Thay thế tiêu đề và cột bảng sang tiếng Việt tài chính.
  - [x] T1.4: Chuẩn hóa `MarketOrderTicket.tsx`: Xóa bỏ 100% ký hiệu `$`, thay bằng `VND` / `₫`, dịch thông báo lỗi và thông tin sức mua sang tiếng Việt.
  - [x] T1.5: Chuẩn hóa `PortfolioPage.tsx`: Chuyển đổi tiêu đề, mô tả và trạng thái rỗng sang tiếng Việt.

- [x] **Task 2: Realistic Multi-Scenario Simulation Data Engine**
  - [x] T2.1: Mở rộng `map1-fomo-dataset.ts`: Xây dựng 3 kịch bản thị trường thực tế ($VIX_PUMP, $NVL_CRASH, $FPT_EXP) với nến OHLC, bảng giá, room chat cá mập và tin tức báo chí chân thực.
  - [x] T2.2: Tích hợp bộ chọn kịch bản trong `FomoArenaPage.tsx`: Cho phép người chơi tự chọn kịch bản hoặc chế độ ngẫu nhiên.
  - [x] T2.3: Mở rộng kịch bản chu kỳ vĩ mô Map 2 (`map2-asset-model.ts` / `ProRoomPage.tsx`): Bổ sung 3 chế độ vĩ mô và chỉ số kinh tế thực tế.
  - [x] T2.4: Mở rộng danh mục cổ phiếu mô phỏng VN30 (FPT, HPG, VCB, MWG, VNM, SSI, AURA).

- [x] **Task 3: Testing & Verification**
  - [x] T3.1: Chạy `npm run test:web` xác nhận toàn bộ 66 test files (553 tests) tiếp tục pass 100%.
  - [x] T3.2: Chạy `npm run typecheck` xác nhận 0 lỗi TypeScript trên toàn monorepo.
  - [x] T3.3: Chạy `npm run build:web` xác nhận bản dựng Vite production thành công.
  - [x] T3.4: Commit và push mã nguồn lên GitHub.
