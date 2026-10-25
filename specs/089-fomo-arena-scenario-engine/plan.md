# Implementation Plan: FEAT-089 FOMO Arena Scenario Selection Redesign

**Feature ID**: `FEAT-089`  
**Created**: 2026-10-25  
**Target Completion**: Single Autonomous Phase  

---

## 1. Technical Architecture & File Targets

1. **`apps/web/src/features/simulation/data/simulation-scenarios-store.ts`**:
   - Verify scenario metadata (tickers, sub-badges, metrics, and sparkline points).
   - Ensure the 3 scenarios `vix_pump`, `nvl_crash`, `fpt_exp` have exact labels matching user screenshot:
     - `vix_pump`:
       - Ticker badge: `SVIX_PUMP`
       - Difficulty: `Trung Bình`
       - Subtitle: `• Bẫy Margin Call x2`
       - Description: `Thao túng tâm lý F0 đua lệnh trần ATO, đội lái kích hoạt bẫy margin x2 tại đỉnh rồi xả hàng tắt thanh khoản. Thử thách phản xạ cắt lỗ ngay trong 3 vòng đầu!`
       - Metric tags: `Biên độ: ±7% kịch trần kịch sàn`, `Rung lắc: Cực Cao`, `Đòn bẩy: Max 1:2`
       - Chart label: `Mô hình nến: Bơm - Xả`, `+18.4% -> -24%`, annotation `Bẫy đỉnh Vòng 4`
     - `nvl_crash`:
       - Ticker badge: `SNVL_CRASH`
       - Difficulty: `Khốc Liệt`
       - Subtitle: `• Bán Tháo Chuỗi Sàn`
       - Description: `Khủng hoảng dòng tiền trái phiếu đáo hạn, bán giải chấp chéo call margin toàn thị trường, chuỗi sàn liên hoàn. Kiểm tra kỷ luật "tuyệt đối không bắt dao rơi".`
       - Metric tags: `Quy mô: Chuỗi 5 phiên sàn liên tiếp`, `Rủi ro: Call margin chéo`, `Thanh khoản: Tắt hẳn`
       - Chart label: `Mô hình: Rơi tự do`, `-48.5%`, annotation `Bẫy hồi Bull-trap tại Vòng 3`
     - `fpt_exp`:
       - Ticker badge: `SFPT_EXP`
       - Difficulty: `Nâng Cao`
       - Subtitle: `• Breakout All-Time-High`
       - Description: `Hành trình tăng trưởng bền vững: Vượt qua cú rũ cung shakeout dữ dội trước khi bứt phá đỉnh lịch sử nhờ hợp đồng AI. Luyện kỹ năng gồng lãi (Trend Following).`
       - Metric tags: `Chiến lược: Tích lũy nền giá chặt`, `Xu hướng: Bứt phá xu hướng lớn`, `Vol bùng nổ`
       - Chart label: `Mô hình: Shakeout & Run`, `+32.8%`, annotation `Shakeout đáy rũ Vòng 3`

2. **`apps/web/src/features/simulation/pages/FomoArenaPage.tsx`**:
   - Re-architect the empty state (when not in active game):
     - Breadcrumb top row: `← Về Sảnh Giả Lập` on left, `ROOM_ID: ARENA-VN30-SIM-07` on right.
     - Academic Sandbox Notice Banner: AlertTriangle, `Môi trường mô phỏng học thuật: ...`, `VIRTUAL ASSETS ONLY`, `Quy chế Sandbox ↗`.
     - Hero Section:
       - Badges: `⚡ MÔ PHỎNG THỰC CHIẾN 7 VÒNG`, `● 100% Thị Trường Thật`.
       - Title: `Đấu Trường Tâm Lý — FOMO Arena` (with cyan gradient/color on `FOMO Arena`).
       - Subtitle: `Trải nghiệm cảm xúc mua đỉnh bán đáy trong 7 Vòng sinh tử đầy biến động. Rèn luyện phản xạ cắt lỗ, giữ vững kỷ luật tâm lý trước bẫy Bull-trap và bảo toàn vốn sống sót.`.
       - 4 Metric cards: `VỐN CẤP KHỞI ĐIỂM`, `THỜI LƯỢNG MỖI VÒNG`, `CHỈ TIÊU VƯỢT ẢI`, `TỶ LỆ SỐNG SÓT F0`.
     - Filter Bar:
       - Title `● CHỌN KỊCH BẢN THỊ TRƯỜNG MÔ PHỎNG:`.
       - Subtitle `Mỗi kịch bản đại diện cho một mô hình bẫy giá kinh điển của thị trường tài chính`.
       - Tabs: `Tất Cả (3)`, `Độ Khó: Trung Bình`, `Khốc Liệt`, `Nâng Cao`.
     - 3 Horizontal Scenario Cards:
       - Left info column with badges, title, description, and metric pills.
       - Center mini SVG sparkline chart with curve, gradient fill, and round annotation markers.
       - Right status column (`Tình trạng / Sẵn sàng`, `✓ Đã Kích Hoạt / Chưa chọn`, Button `✓ Đang chọn / Chọn kịch bản`).
       - Active card ribbon: `✓ KỊCH BẢN ĐANG CHỌN` on top-right border.
     - Bottom Docked Action Bar:
       - Dark Navy `#0b132b` / `#0f172a` container.
       - Left: `● SẴN SÀNG THAM CHIẾN • VÒNG 1/7`, selected scenario name, details `45s`, `10.000.000 đ`, `ROI > 5%`.
       - Right: Button `📖 Xem Luật Chơi & Tâm Lý` and Button `▶ Bắt Đầu Vòng 1 Ngay`.

3. **`apps/web/src/index.css`**:
   - Add specialized styling classes for the FOMO Arena scenario cards, sparklines, metric cards, and docked action bar.

4. **Testing & Browser Subagent**:
   - Typecheck and run tests `npx vitest run src/features/simulation/pages/FomoArenaPage.test.tsx`.
   - Start web dev server if needed and run `browser_subagent` to take screenshots of the rendered page.
   - Compare side-by-side with the uploaded reference image.
