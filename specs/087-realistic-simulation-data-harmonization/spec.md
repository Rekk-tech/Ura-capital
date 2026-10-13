# Feature Specification: FEAT-087 Multi-Scenario Realistic Market Simulation Engine & Cross-Tab Language/UI Logic Harmonization

**Feature ID**: `FEAT-087`  
**Created**: 2026-10-13  
**Status**: APPROVED  
**Target Delivery**: Phase 9 Production Hardening  

---

## 1. Executive Summary & Problem Statement

### 1.1 Problems Addressed
1. **Lẫn lộn ngôn ngữ & thiếu logic giữa các tab**:
   - Khi người học di chuyển giữa các tab (`/dashboard`, `/academy`, `/simulation`, `/portfolio`, `/community`, `/ai`, `/subscription`), giao diện bị lẫn lộn giữa tiếng Anh và tiếng Việt không có quy chuẩn thống nhất (ví dụ: một số thẻ có tiêu đề tiếng Anh "Academy Learning", "Simulation Portfolio", "Open Desk", "No Open Positions", trong khi các tab khác lại dùng tiếng Việt).
   - Biểu mẫu đặt lệnh (`MarketOrderTicket.tsx`) còn tồn tại ký hiệu `$` và lỗi định dạng số tiền thay vì định dạng đồng nhất VND (`100.000.000 ₫` / `100.000.000 VND`).
   - `AppHeader.tsx` thiếu định danh tiếng Việt cho các route `/ai`, `/subscription`, `/admin` và menu tài khoản.
2. **Thiếu tính đa dạng & chân thực của dữ liệu mô phỏng**:
   - Map 1 (FOMO Arena) chỉ có duy nhất 1 kịch bản đơn điệu ($FOMO/VIN). Người học không được trải nghiệm các biến số thực tế như sóng kéo xả penny/chứng khoán, khủng hoảng thanh khoản bất động sản, hay sóng vượt đỉnh siêu cổ phiếu.
   - Map 2 (Pro Room) chỉ có duy nhất 1 bộ số liệu vĩ mô tĩnh cho 12 quý, thiếu các kịch bản chu kỳ kinh tế thay thế (như Cú sốc lạm phát hoặc Siêu chu kỳ nới lỏng).
   - Sảnh giao dịch chung (`/simulation/cockpit`) cần được bổ sung rổ tài sản thực tế mô phỏng thị trường chứng khoán Việt Nam (FPT, HPG, VCB, MWG, VNM, SSI, AURA) với thị giá và sổ lệnh chân thực.

---

## 2. Requirements & Acceptance Criteria (AC)

### AC-001: Chuẩn Hóa Ngôn Ngữ & UX Toàn Bộ Các Tab (Institutional Vietnamese-English Hybrid)
- Toàn bộ các tiêu đề, thẻ tóm tắt, nút hành động, thông báo rỗng (empty state) trên Dashboard (`/dashboard`), Simulation (`/simulation`), Portfolio (`/portfolio`), Community (`/community`), Subscription (`/subscription`), AI Studio (`/ai`), và Header/Footer phải được chuẩn hóa nhất quán sang **tiếng Việt tài chính chuẩn mực**.
- Các thuật ngữ quốc tế chuyên ngành (P/E, DCF, Stop-loss, Margin, Bull-trap, PnL, Limit/Market Order, Equity, Cash) được giữ nguyên chuẩn mực và đặt trong ngữ cảnh tiếng Việt tự nhiên.
- Duy trì 100% các từ khóa accessibility và data-testid để bảo đảm kiểm thử tự động không bị đứt gãy.

### AC-002: Chuẩn Hóa Tiền Tệ & Sức Mua Khả Dụng (100% VND & No Hardcoded Dollar Signs)
- Loại bỏ triệt để mọi ký hiệu `$` cứng trong `MarketOrderTicket.tsx` và các component liên quan.
- Hiển thị sức mua khả dụng, giá đặt lệnh, tổng giá trị ước tính và thông báo lỗi bằng đơn vị `VND` / `₫` đồng bộ.

### AC-003: Mở Rộng Kịch Bản Đấu Trường FOMO Arena (Multi-Scenario Real-Market Engine)
- Bổ sung tối thiểu 3 kịch bản thị trường thực tế cho Map 1:
  1. **Kịch bản A: $VIX_PUMP — Sóng Đầu Cơ & Kéo Xả Chứng Khoán**: Đua lệnh trần ATO, tin đồn room ngoại, bẫy margin x2, nghẽn lệnh thanh khoản, rũ bùn tạo đáy.
  2. **Kịch bản B: $NVL_CRASH — Khủng Hoảng Thanh Khoản & Vực Thẳm Trái Phiếu**: Mất thanh khoản sàn, tin đồn thanh tra, bẫy Bull-trap hồi kỹ thuật, bài học cắt lỗ dứt khoát.
  3. **Kịch bản C: $FPT_EXP — Siêu Cổ Phiếu Tăng Trưởng Vượt Đỉnh**: Lợi nhuận bứt phá, quỹ gom ròng, rung lắc rũ bỏ F0 đu bám, vượt đỉnh lịch sử.
- Cho phép người chơi linh hoạt chọn kịch bản hoặc chế độ ngẫu nhiên trước khi vào trận.

### AC-004: Mở Rộng Kịch Bản Chu Kỳ Vĩ Mô Pro Room (Multi-Regime Macro Engine)
- Bổ sung 3 chế độ chu kỳ vĩ mô cho Map 2:
  1. **Chu Kỳ 2020-2026 Chuẩn Mực**: Bùng nổ -> Đình lạm tăng lãi suất -> Suy thoái tạo đáy -> Hồi phục mở rộng.
  2. **Cú Sốc Lạm Phát & Lãi Suất Neo Đỉnh (Stagflation Shock)**: Lạm phát phi mã, thắt chặt tiền tệ gay gắt, ưu tiên Tiền mặt & Cổ phiếu phòng thủ.
  3. **Siêu Chu Kỳ Nới Lỏng Tiền Tệ (QE Tech Supercycle)**: Lãi suất siêu rẻ, cổ phiếu tăng trưởng bùng nổ.

### AC-005: Mở Rộng Bảng Điện Thực Tế Rổ Cổ Phiếu Trụ (Realistic Market Universe)
- Bổ sung rổ tài sản trụ VN30 vào bảng giá và sổ lệnh với đầy đủ thông số ngành và biến động giá thị trường thực tế.

---

## 3. Non-Functional Requirements & Invariants
- **Server Authority**: Mọi tính toán số dư và xác thực lệnh tiếp tục tuân thủ nghiêm ngặt Server Authority của Hiến pháp dự án.
- **Test Integrity**: Duy trì 100% tỷ lệ pass của toàn bộ 1,574 kiểm thử hiện có.
