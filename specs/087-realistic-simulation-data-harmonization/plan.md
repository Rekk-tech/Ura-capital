# Implementation Plan: FEAT-087 Multi-Scenario Realistic Market Simulation Engine & Cross-Tab Language/UI Logic Harmonization

**Feature ID**: `FEAT-087`  
**Created**: 2026-10-13  
**Status**: APPROVED  

---

## 1. Technical Strategy

### 1.1 Cross-Tab Language & UI Logic Harmonization
1. **`AppHeader.tsx`**:
   - Mở rộng `VI_NAV_LABELS` hỗ trợ toàn bộ các route bao gồm `/ai`: "Trợ Lý AI", `/subscription`: "Gói Hội Viên", `/admin`: "Quản Trị".
   - Chuẩn hóa Menu người dùng: "Hồ Sơ Cá Nhân", "Cài Đặt Tài Khoản", "Đăng Xuất", "Trang Quản Trị".
2. **`DashboardPage.tsx` và các Widgets**:
   - `DashboardHeader.tsx`: Hiển thị lời chào song ngữ thanh lịch: "Chào mừng trở lại, {name}", phụ đề "Trạm làm việc tài chính & Tổng quan danh mục giả lập", nút "Làm mới dữ liệu (Refresh)".
   - `AcademySummaryWidget.tsx`: Tiêu đề "Học Viện & Tiến Độ", "Tổng Điểm Kinh Nghiệm (XP)", "Khóa Học Khả Dụng", liên kết "Xem Học Viện →".
   - `SimulationSummaryWidget.tsx`: Tiêu đề "Danh Mục Đấu Trường", "Giá Trị Ròng (Equity)", "Tiền Mặt Khả Dụng (Cash)", "Lãi/Lỗ Tạm Tính (PnL)", liên kết "Mở Đấu Trường →".
   - `CommunitySummaryWidget.tsx`: Tiêu đề "Thảo Luận Cộng Đồng", "Góc Nhìn Nổi Bật", liên kết "Tham Gia Cộng Đồng →".
   - `SubscriptionSummaryWidget.tsx`: Tiêu đề "Gói Hội Viên", "Gói Hiện Tại", liên kết "Quản Lý Gói →".
3. **`SimulationDashboardPage.tsx` và Cockpit Components**:
   - `MapSelectionView.tsx`: Chuẩn hóa 100% sang tiếng Việt tài chính cho cả 2 thẻ Map 1 và Map 2, loại bỏ tiếng Anh lẫn lộn.
   - `MarketPriceView.tsx`: Tiêu đề "Bảng Giá Khớp Lệnh & Thị Giá", các cột "Mã CK", "Tên Doanh Nghiệp", "Nhóm Ngành", "Thị Giá Khớp", "Lệnh Mua / Bán", ô tìm kiếm "Tìm kiếm mã CK hoặc tên...".
   - `PositionsTable.tsx`: Tiêu đề "Danh Mục Vị Thế Đang Mở", các cột "Mã CK", "Khối Lượng", "Giá Vốn TB", "Thị Giá", "Giá Trị TT", "Lãi/Lỗ Tạm Tính", trạng thái rỗng "Chưa có vị thế mở. Tài khoản đang nắm giữ 100% tiền mặt."
   - `MarketOrderTicket.tsx`: Xóa bỏ toàn bộ ký hiệu `$`. Thay bằng VND / ₫. Tiêu đề "Phiếu Đặt Lệnh", "Sức mua khả dụng", "Khối lượng", "Giá đặt lệnh", "Tổng giá trị ước tính", các thông báo lỗi thuần tiếng Việt.
   - `OrdersTable.tsx` & `TradesTable.tsx`: Tiêu đề "Sổ Lệnh Đã Đặt", "Lịch Sử Khớp Lệnh", các cột và trạng thái khớp lệnh tiếng Việt.
4. **`PortfolioPage.tsx`**:
   - Tiêu đề "Định Giá & Báo Cáo Hiệu Quả Danh Mục", các trạng thái đăng nhập, rỗng và thống kê chuyển sang tiếng Việt tài chính.

### 1.2 Multi-Scenario Realistic Market Data Architecture
1. **Map 1 Dataset Expansion (`map1-fomo-dataset.ts`)**:
   - Xây dựng module kịch bản đa dạng:
     - `SCENARIO_VIX_PUMP`: Sóng đầu cơ chứng khoán & penny, bẫy trần ATO, kéo xả, nghẽn lệnh.
     - `SCENARIO_NVL_CRASH`: Khủng hoảng thanh khoản bất động sản, chuỗi phiên giảm sàn, bẫy Bull-trap.
     - `SCENARIO_FPT_EXP`: Siêu cổ phiếu tăng trưởng công nghệ, rũ bùn F0 (shakeout), vượt đỉnh lịch sử.
   - Bổ sung bộ chọn kịch bản trong `FomoArenaPage.tsx` và `MapSelectionView.tsx`.
2. **Map 2 Asset Model Expansion (`map2-asset-model.ts` / `ProRoomPage.tsx`)**:
   - Bổ sung 3 chế độ vĩ mô: Chu kỳ chuẩn 2020-2026, Cú sốc lạm phát 1970s/2022, Siêu chu kỳ QE công nghệ.
   - Thêm bộ hiển thị chỉ số vĩ mô thực tế (Lãi suất, Lạm phát, GDP, Tỷ giá).
3. **Simulation Cockpit Assets**:
   - Bổ sung rổ cổ phiếu mô phỏng VN30: FPT, HPG, VCB, MWG, VNM, SSI, AURA.

---

## 2. Risk Mitigation & Test Gates
- Giữ nguyên các thuộc tính `data-testid`, `aria-label`, và các regex từ khóa mà bộ kiểm thử Vitest hiện tại đang kiểm tra.
- Chạy `npm run test:web` và `npm run typecheck` sau mỗi đợt chỉnh sửa để bảo đảm 100% pass rate.
