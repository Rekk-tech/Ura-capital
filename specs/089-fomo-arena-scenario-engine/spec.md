# Feature Specification: FEAT-089 FOMO Arena Scenario Engine Redesign, Anti-Farming Fairness, and Dynamic Historical Datasets

**Feature ID**: `FEAT-089`  
**Created**: 2026-10-25  
**Status**: APPROVED  
**Target Delivery**: Phase 9 Production Hardening  

---

## 1. Executive Summary & Clarification Formulation (/speckit-clarify)

### 1.1 Vấn Đề Cốt Lõi Được Làm Rõ
1. **Lỗ hổng "Thuộc bài" (Replay Memorization & Scenario Farming)**:
   - Nếu người chơi lặp đi lặp lại một kịch bản duy nhất, họ sẽ nhớ chính xác thời điểm đỉnh, thời điểm bẫy bull-trap (ví dụ: vòng 2 đua trần ATO, vòng 3 bán tháo trước khi sàn tắt thanh khoản, vòng 4 không bắt đáy).
   - Hệ quả: User farm điểm ảo với ROI cao ngất ngưởng mà không phản ánh năng lực quản trị rủi ro thực tế trong thị trường tài chính biến động.

2. **Sự Bất Công Bằng Giữa Các Cấp Độ Khó (Asymmetric Difficulty Scoring)**:
   - User A chọn kịch bản **Trung Bình** (`SVIX_PUMP` - sóng penny), biên độ tăng giá thuận lợi dễ đạt ROI $+15\%$.
   - User B chọn kịch bản **Khốc Liệt** (`SNVL_CRASH` - khủng hoảng trái phiếu bão sàn -48.5%), dù user B giữ kỷ luật phi thường, cắt lỗ sớm và bảo toàn vốn với ROI $+2\%$ hoặc $-3\%$ (vượt trội so với thị trường giảm -48.5%), nhưng nếu xếp hạng chỉ dựa trên ROI danh nghĩa thuần túy thì User B bị xếp dưới User A.
   - Điều này vi phạm nghiêm trọng tính công bằng và triết lý đào tạo của Aura Capital.

---

### 1.2 Giải Pháp Kiến Trúc & Tiêu Chí Chấm Điểm Chuẩn Hóa

#### A. Thuật Toán Biến Động Vi Mô Động (Procedural Micro-Jitter & Noise)
- Mỗi lượt chơi khởi tạo một `scenarioSeed` ngẫu nhiên.
- Dù diễn biến chung vẫn tuân thủ mô hình lịch sử (vòng 3 gãy, vòng 4 hồi bẫy), từng bước giá intra-round và mức độ biến động sẽ dao động ngẫu nhiên $\pm 1.2\% \rightarrow \pm 2.5\%$.
- Lực cầu bot chat, tốc độ khớp lệnh và thời điểm nến rút chân không cố định theo giây, buộc người chơi phải quan sát bảng điện thực tế thay vì học vẹt.

#### B. Công Thức Chấm Điểm Chuẩn Hóa ACPI (Aura Composite Performance Index)
Bảng xếp hạng không dùng ROI danh nghĩa đơn thuần mà tính theo chỉ số ACPI tổng hợp chuẩn hóa:

$$\text{ACPI Score} = \left[ 0.40 \times \text{AlphaROI} + 0.35 \times \text{DrawdownScore} + 0.15 \times \text{DisciplineScore} + 0.10 \times \text{QuizTrapScore} \right] \times W_{\text{diff}} \times D_{\text{replay}}$$

Trong đó:
1. **Alpha ROI**: $\text{ROI}_{\text{user}} - \text{ROI}_{\text{benchmark}}$ (đo lường tỷ suất sinh lời vượt trội so với thị trường chung của kịch bản đó).
   - Trong `SNVL_CRASH`, benchmark thị trường giảm $-48.5\%$. Nếu User B đạt ROI $+2\%$, $\text{AlphaROI} = +50.5\%$!
2. **Difficulty Multiplier ($W_{\text{diff}}$)**:
   - `Trung Bình` (`SVIX_PUMP`): $W_{\text{diff}} = 1.00\times$
   - `Nâng Cao` (`SFPT_EXP`): $W_{\text{diff}} = 1.35\times$
   - `Khốc Liệt` (`SNVL_CRASH`): $W_{\text{diff}} = 1.85\times$
3. **Replay Diminishing Decay ($D_{\text{replay}}$ - Chống cày cuốc)**:
   - Lượt 1 trong ngày/mùa: $D_{\text{replay}} = 1.00$ ($100\%$)
   - Lượt 2 cùng kịch bản: $D_{\text{replay}} = 0.65$ ($65\%$)
   - Lượt 3 cùng kịch bản: $D_{\text{replay}} = 0.35$ ($35\%$)
   - Lượt $\ge 4$: $D_{\text{replay}} = 0.10$ (Chỉ tính luyện tập, không tính đua top mùa giải).

#### C. Bộ Dữ Liệu Mô Phỏng Từ Cổ Phiếu Có Thật Trên Thị Trường Việt Nam
1. **$VIX_PUMP (Sóng Đầu Cơ Penny & Bẫy Kéo Xả ATO)**:
   - Dựa trên dữ liệu thực tế: Sóng penny FLC / BII / TGG / ROS chu kỳ 2021-2022.
   - Đặc điểm: Tin đồn thâu tóm, kéo trần ATO 3 phiên, xả sàn đột ngột, bẫy margin x2 tại đỉnh.
2. **$NVL_CRASH (Đóng Băng Thanh Khoản BĐS & Khủng Hoảng Nợ)**:
   - Dựa trên dữ liệu thực tế: Cổ phiếu bất động sản NVL / PDR / HPX cuối năm 2022 khi thị trường trái phiếu đóng băng.
   - Đặc điểm: Mất thanh khoản bán sàn 5-10 phiên, giải chấp chéo tài khoản, bẫy "giải cứu" bull-trap hụt vòng 3-4.
3. **$SFPT_EXP (Siêu Cổ Phiếu Vượt Đỉnh ATH & Shakeout)**:
   - Dựa trên dữ liệu thực tế: Siêu cổ phiếu FPT / DGC / HPG chu kỳ 2023-2024.
   - Đặc điểm: Nền giá tích lũy chặt, cú rũ cung shakeout đạp thủng MA20 ép nhỏ lẻ cắt lỗ, bứt phá All-Time-High nhờ câu chuyện AI & bán dẫn toàn cầu.

---

## 2. UI/UX Visual Specification (Pixel-Perfect Matching Reference)

### 2.1 Breadcrumb & Room Info Row
- Nút `← Về Sảnh Giả Lập` (Link tới `/simulation`, ArrowLeft icon, font-semibold 13px, text slate-600).
- Huy hiệu phòng bên phải: `ROOM_ID: ARENA-VN30-SIM-07` (font-mono, rounded-md, border slate-200, bg slate-100, text slate-600, px-2.5 py-1 text-xs).

### 2.2 Academic Sandbox Warning Banner
- Hộp cảnh báo màu vàng ấm `#fffbeb`, viền `#fde68a`, icon AlertTriangle.
- Nội dung: `Môi trường mô phỏng học thuật: 100% dòng tiền, danh mục và lệnh khớp mang tính chất huấn luyện tâm lý thực chiến & quản trị rủi ro — Không phát sinh giao dịch tiền tệ thực.`
- Nhãn bên phải: Tag `VIRTUAL ASSETS ONLY` (font-mono, amber pill) và Link `Quy chế Sandbox ↗`.

### 2.3 Hero Section & 4 Metric Cards
- Huy hiệu: `⚡ MÔ PHỎNG THỰC CHIẾN 7 VÒNG` (blue pill `#eff6ff`) và `● 100% Thị Trường Thật` (green dot).
- Tiêu đề: `Đấu Trường Tâm Lý — ` `FOMO Arena` (chữ FOMO Arena màu cyan `#0284c7`).
- Mô tả: `Trải nghiệm cảm xúc mua đỉnh bán đáy trong 7 Vòng sinh tử đầy biến động. Rèn luyện phản xạ cắt lỗ, giữ vững kỷ luật tâm lý trước bẫy Bull-trap và bảo toàn vốn sống sót.`
- Hàng 4 thẻ số liệu (4-column responsive grid):
  1. `VỐN CẤP KHỞI ĐIỂM`: **`10.000.000`** `VND`
  2. `THỜI LƯỢNG MỖI VÒNG`: **`7 Vòng × 45 Giây`**
  3. `CHỈ TIÊU VƯỢT ẢI`: **`ROI ≥ +5.0%`** (màu xanh lá)
  4. `TỶ LỆ SỐNG SÓT F0`: **`34.2%`** `toàn hệ thống` (màu đỏ)

### 2.4 Thanh Lọc Kịch Bản (Scenario Filter Bar)
- Tiêu đề: `● CHỌN KỊCH BẢN THỊ TRƯỜNG MÔ PHỎNG:` (chấm xanh dương, in hoa đậm).
- Phụ đề: `Mỗi kịch bản đại diện cho một mô hình bẫy giá kinh điển của thị trường tài chính`.
- Nút lọc phân loại bên phải:
  - `Tất Cả (3)` (active dark slate pill `#0f172a`, text white)
  - `Độ Khó: Trung Bình`
  - `Khốc Liệt`
  - `Nâng Cao`

### 2.5 3 Horizontal Scenario Cards
Mỗi thẻ bố cục 3 phần theo chiều ngang:
1. **Thông tin kịch bản (Left)**:
   - Tag mã: `SVIX_PUMP`, `SNVL_CRASH`, `SFPT_EXP` (gray mono badge)
   - Badge độ khó kèm chấm màu: `● Trung Bình` (amber), `● Khốc Liệt` (red), `● Nâng Cao` (purple/indigo)
   - Tag đặc trưng: `• Bẫy Margin Call x2`, `• Bán Tháo Chuỗi Sàn`, `• Breakout All-Time-High`
   - Tiêu đề kịch bản: H3 font-bold 18px text-slate-900.
   - Mô tả chi tiết 2 dòng rõ ràng.
   - Hàng pills chỉ số:
     - Thẻ 1: `Biên độ: ±7% kịch trần kịch sàn` | `Rung lắc: Cực Cao` | `Đòn bẩy: Max 1:2`
     - Thẻ 2: `Quy mô: Chuỗi 5 phiên sàn liên tiếp` | `Rủi ro: Call margin chéo` | `Thanh khoản: Tắt hẳn`
     - Thẻ 3: `Chiến lược: Tích lũy nền giá chặt` | `Xu hướng: Bứt phá xu hướng lớn` | `Vol bùng nổ`
2. **Biểu đồ Sparkline mô hình nến (Center)**:
   - Container bo góc, viền nhẹ.
   - Tiêu đề mô hình bên trái (`Mô hình nến: Bơm - Xả`, `Mô hình: Rơi tự do`, `Mô hình: Shakeout & Run`).
   - Tỷ lệ % bên phải (`+18.4% -> -24%`, `-48.5%`, `+32.8%`).
   - Biểu đồ SVG Area Chart với đường cong bezier mượt mà, gradient trong suốt bên dưới, và điểm đánh dấu chú thích (ví dụ `Bẫy đỉnh Vòng 4`, `Bẫy hồi Bull-trap tại Vòng 3`, `Shakeout đáy rũ Vòng 3`).
3. **Trạng thái & Nút chọn (Right)**:
   - Thẻ đang chọn: Nhãn `Tình trạng` + `✓ Đã Kích Hoạt`, nút `✓ Đang chọn` (nền xanh dương `#2563eb`, chữ trắng). Kèm ribbon góc trên bên phải `✓ KỊCH BẢN ĐANG CHỌN`.
   - Thẻ chưa chọn: Nhãn `Sẵn sàng` + `Chưa chọn`, nút `Chọn kịch bản` (viền xám, nền trắng).

### 2.6 Khối Hành Động Sẵn Sàng Tham Chiến (Docked Bottom Action Bar)
- Nền xanh đen Dark Navy `#0b132b`, bo góc `rounded-2xl`, viền mờ `rgba(255,255,255,0.1)`.
- Bên trái:
  - Chấm xanh lá sáng: `● SẴN SÀNG THAM CHIẾN • VÒNG 1/7`
  - Tiêu đề: `Kịch bản:` kèm tên kịch bản được chọn nổi bật màu xanh ngọc `#38bdf8`.
  - Hàng phụ: `⏱️ Thời gian mỗi vòng: 45s` • `💰 Vốn ban đầu: 10.000.000 đ` • `🎯 Chỉ tiêu: ROI > 5%`
- Bên phải:
  - Nút `📖 Xem Luật Chơi & Tâm Lý` (nền tối, viền trắng mờ, mở tutorial).
  - Nút `▶ Bắt Đầu Vòng 1 Ngay` (xanh dương `#2563eb`, font-bold, hiệu ứng hover sáng).

---

## 3. Invariants & Acceptance Criteria
- **AC-001**: Trực quan hóa chính xác 100% theo ảnh tham chiếu của người dùng.
- **AC-002**: Đầy đủ tính năng tương tác: đổi kịch bản khi click vào thẻ hoặc nút `Chọn kịch bản`, lọc theo bộ lọc độ khó.
- **AC-003**: Duy trì 100% pass toàn bộ test case hiện có của `FomoArenaPage`.
- **AC-004**: Trực quan hóa so sánh trực quan qua browser subagent.
