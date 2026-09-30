# AURA CAPITAL — FIGMA DESIGN REVIEW: MAP 1 & MAP 2

> **Đối tượng đọc:** AI Agent thực hiện chuyển thiết kế Figma thành sản phẩm.
> **Trạng thái:** Đây là **bản review thiết kế Figma** (5 ảnh chụp: Map 1 lúc chơi, Map 2 màn Quý 1, Map 2 màn Debrief 12 quý) — **CHƯA build vào sản phẩm**. Mục tiêu file này là liệt kê điểm cần sửa **trước khi chuyển thành code**.
> **Liên quan:** `AURA_MAP1_MAP2_GAME_SPEC.md` (luật chơi & công thức gốc), `AURA_UI_REDESIGN_SPEC.md` (design system). File này bổ sung lớp "kiểm tra chéo thiết kế Figma vs 2 file spec trên" — khi có mâu thuẫn, coi đây là danh sách lỗi cần Agent xử lý hoặc hỏi lại chủ dự án, **không tự chọn phương án**.

---

## 0. TÓM TẮT ƯU TIÊN

| # | Vấn đề | Mức độ | Loại |
|---|--------|--------|------|
| 1 | "Top 5%/Top 8% Cohort Performance" hiện ra khi chưa có dữ liệu / chưa có leaderboard thật | 🔴 Cao | Sai lệch dữ liệu |
| 2 | Lẫn lộn VN30 và VN-Index trong cùng luồng | 🔴 Cao | Sai lệch dữ liệu |
| 3 | Lợi suất & kỳ hạn trái phiếu trong Figma khác spec gốc (4,8%/5 năm vs 7,5%/1 năm) | 🔴 Cao | Sai lệch dữ liệu |
| 4 | "Total Assets" không khớp "Unrealized P&L" ở Map 1 | 🔴 Cao | Lỗi tính toán hiển thị |
| 5 | Margin x2/x5 mở sẵn từ Round 2 thay vì Round 3 | 🔴 Cao | Sai logic game |
| 6 | Phí giao dịch "Miễn phí" chưa thống nhất với đề xuất phí 0,15%/lệnh | 🟠 Trung bình | Cần quyết định |
| 7 | Sharpe Ratio hiện ngay ở Quý 1, trước khi có dữ liệu lợi nhuận | 🟠 Trung bình | Sai logic hiển thị |
| 8 | Nhãn "LIVE FEED" + khung thời gian tháng cho Map 2 (turn-based) gây hiểu lầm | 🟠 Trung bình | Nhầm cơ chế |
| 9 | Thuật ngữ "Round" dùng cho cả Map 2 (nên là "Quý") | 🟠 Trung bình | Nhất quán thuật ngữ |
| 10 | Trộn ngôn ngữ Anh–Việt trong cùng màn dù chọn "EN" | 🟠 Trung bình | i18n |
| 11 | Mã cổ phiếu "VIN — VinAlpha Corp" gần giống mã thật ngoài đời | 🟡 Thấp | Rủi ro liên tưởng |
| 12 | Nhãn phong cách đầu tư cần tính trên bình quân 12 quý, không phải quý cuối | 🟡 Thấp | Cần xác nhận công thức |
| 13 | Thiếu màn hình: popup Bẫy/Quiz Map 1, thanh tiến trình 4 pha, Debrief Map 1 | 🟡 Thấp | Thiếu thiết kế |

---

## 1. 🔴 VẤN ĐỀ MỨC ĐỘ CAO

### 1.1. "Top 5% / Top 8% Cohort Performance" — dữ liệu không có thật

**Quan sát:**
- Màn Quý 1 (chưa chạy vòng nào) đã hiện `BENCHMARK ALPHA (VS VN30): +1.85% · Top 5% Cohort Performance`.
- Màn Debrief 12 quý hiện `ANNUALIZED RETURN +15.7% p.a. · Top 8% cohort, beat 3-year term deposit by +9.2%`.

**Vấn đề:**
- Ở Quý 1, game chưa có kết quả nào để so sánh → con số "Top 5%" chắc chắn là placeholder, không thể đưa vào sản phẩm thật dưới dạng cố định.
- Nếu hệ thống **chưa có bảng xếp hạng (leaderboard) thật** giữa nhiều người chơi, hiển thị "Top X% cohort" là công bố một tuyên bố không có cơ sở dữ liệu thật — với sản phẩm giáo dục tài chính, việc này ảnh hưởng trực tiếp đến độ tin cậy và có thể vi phạm nguyên tắc "server-authoritative facts" đã đặt ra cho toàn hệ thống.

**Yêu cầu xử lý:**
- [ ] Nếu **có** hạ tầng leaderboard thật (đủ số người chơi để so sánh có ý nghĩa thống kê) → chỉ hiển thị "Top X%" **sau khi** người chơi hoàn thành ít nhất 1 quý/round, tính từ dữ liệu thật, ẩn hoàn toàn ở Quý 1.
- [ ] Nếu **chưa có** leaderboard thật → bỏ hẳn nhãn "Top X% cohort" khỏi cả 2 màn. Thay bằng so sánh cố định và kiểm chứng được: **Alpha vs benchmark** (đã có sẵn) và **so với lãi suất tiết kiệm kỳ hạn** (chỉ nếu số liệu này là hằng số cấu hình, không phải thống kê chéo người dùng).
- [ ] Ghi chú lại quyết định cuối cùng vào `docs/OPEN_QUESTIONS.md` nếu Agent không tự quyết định được.

### 1.2. Lẫn lộn VN30 và VN-Index

**Quan sát:**
- Màn Quý 1: `VN30 Index & Multi-Asset Benchmark`, `BENCHMARK ALPHA (VS VN30)`.
- Màn Debrief: `ALPHA VS VN-INDEX`, chú thích biểu đồ `VN-Index Benchmark`, mô tả report `VN-Index return: +11.05% vs Portfolio: +15.70%`.

**Vấn đề:** VN30 (30 mã vốn hoá lớn nhất HOSE) và VN-Index (toàn bộ sàn HOSE) là hai chỉ số khác nhau về thành phần và mức biến động. Sản phẩm đang dạy người học phân biệt các chỉ số này ở phần Courses (liên quan Trạm về thị trường) — nếu chính game dùng lẫn lộn, sẽ dạy sai khái niệm ngay trong trải nghiệm mà đáng lẽ phải củng cố kiến thức.

**Yêu cầu xử lý:**
- [ ] Chọn **một chỉ số duy nhất** làm benchmark chính thức cho Map 2 (khuyến nghị: **VN-Index**, vì tài liệu game gốc `AURA_MAP1_MAP2_GAME_SPEC.md` §2.9 đã dùng "VN-Index Benchmark").
- [ ] Sửa toàn bộ nhãn ở màn Quý 1 (biểu đồ, "Benchmark Alpha") cho khớp; không dùng "VN30" ở bất kỳ đâu trừ khi chủ dự án xác nhận đổi toàn bộ game engine sang dùng VN30.
- [ ] Rà lại các trạm Courses có nhắc tới VN-Index/VN30 để đảm bảo nhất quán giữa nội dung học và nội dung game.

### 1.3. Thông số trái phiếu (`$BOND`) không khớp spec gốc

**Quan sát:** Order Desk Quý 1 ghi `$BOND — Phòng vệ lãi suất — Trái phiếu chính phủ kỳ hạn 5 năm (Lợi suất 4.80%)`.

**Spec gốc** (`AURA_MAP1_MAP2_GAME_SPEC.md` §2.2, §2.3): `$BOND` = "Trái phiếu doanh nghiệp/Chính phủ kỳ hạn **1 năm** — Lợi tức cố định **7,5%/năm**", dùng để tính `α_BOND = 1,875%/quý` trong công thức `R_i,t`.

**Vấn đề:** Đây không phải lỗi hiển thị nhỏ — kỳ hạn và lợi suất trái phiếu là **tham số đầu vào trực tiếp của công thức tính lợi nhuận danh mục mỗi quý**. Nếu Figma dùng số khác mà code lại theo spec cũ (hoặc ngược lại), kết quả game và số liệu hiển thị trên UI sẽ không khớp nhau.

**Yêu cầu xử lý:**
- [ ] Xác nhận với chủ dự án: đây là **thay đổi có chủ đích** (đổi tham số `$BOND` sang kỳ hạn 5 năm, lợi suất 4,8%) hay chỉ là **số liệu demo ngẫu nhiên** khi dựng Figma.
- [ ] Nếu đổi có chủ đích → cập nhật lại `α_BOND` và toàn bộ bảng β trong `AURA_MAP1_MAP2_GAME_SPEC.md` §2.3 cho khớp (α_BOND mới = 4,8%/4 = 1,2%/quý).
- [ ] Nếu là demo → sửa lại Figma cho khớp `7,5%/năm, kỳ hạn 1 năm` trước khi bàn giao code.
- [ ] Dù chọn phương án nào, **một nguồn số liệu duy nhất** (file config) phải là nơi cả UI và logic tính toán cùng đọc — không hard-code số ở component hiển thị.

### 1.4. "Total Assets" không khớp "Unrealized P&L" ở Map 1

**Quan sát:** Header Round 2 hiện `TOTAL ASSETS: 10.000.000 VND` và `UNREALIZED P&L: +689.000 VND (+6,89%)` cùng lúc.

**Vấn đề:** Nếu đang lãi +6,89% chưa hiện thực hoá, `Total Assets` (NAV hiện tại) phải xấp xỉ `10.000.000 + 689.000 = 10.689.000 VND`, không thể vẫn là 10.000.000. Nhiều khả năng ô này đang hiển thị **vốn gốc (V₀)** thay vì **NAV hiện tại**, hoặc nhầm giữa "Total Assets" và "Available Cash".

**Yêu cầu xử lý:**
- [ ] Làm rõ 3 ô cần tách biệt: `NAV hiện tại (= Cash + Giá trị thị trường cổ phiếu)`, `Available Cash (tiền mặt khả dụng)`, `Unrealized P&L (= NAV hiện tại − V₀ − phần đã hiện thực hoá)`.
- [ ] `Total Assets` phải **luôn bằng** `Available Cash + Giá trị thị trường vị thế đang mở`, tự động cộng dồn theo P&L — không phải số tĩnh.
- [ ] Viết unit test đơn giản: given cash, shares, giá hiện tại → `Total Assets` phải khớp công thức trên trong mọi round.

### 1.5. Margin mở sẵn từ Round 2 thay vì Round 3

**Quan sát:** Ở Round 2/7 (FOMO Peak), nút `MARGIN x2` và `MARGIN x5 HIGH RISK` đã hiển thị active/chọn được.

**Spec gốc** (`AURA_MAP1_MAP2_GAME_SPEC.md` §1.3, §1.5): Margin chỉ mở từ **Round 3** trở đi — đây chính là round có kịch bản "Bẫy Margin" (popup mời gọi margin đúng lúc giá giảm sàn). Nếu margin đã mở sẵn từ Round 2, thời điểm "cài bẫy" ở Round 3 sẽ mất tác dụng bất ngờ tâm lý — vốn là mục đích thiết kế cốt lõi của cả Map 1.

**Yêu cầu xử lý:**
- [ ] Khoá nút Margin (mờ + không bấm được) ở Round 1–2, kèm tooltip: `"Mở khoá đòn bẩy từ Round 3"`.
- [ ] Chỉ mở khoá đúng lúc bước vào Round 3, đồng bộ với thời điểm popup "Bẫy Margin" xuất hiện.
- [ ] MVP: chỉ mở `MARGIN x2`; ẩn hoặc để `MARGIN x5 HIGH RISK` ở trạng thái "Sắp mở" theo quyết định 🔴 BỚT đã thống nhất trong `AURA_MAP1_MAP2_GAME_SPEC.md` mục 0 dòng #10 — nếu chủ dự án muốn giữ x5 ngay từ đầu, cần xác nhận lại quyết định đó.

---

## 2. 🟠 VẤN ĐỀ MỨC ĐỘ TRUNG BÌNH

### 2.1. Phí giao dịch "Miễn phí" chưa thống nhất

Figma ghi `Phí giao dịch mô phỏng: Miễn phí`. Spec trước đề xuất phí 0,15%/lệnh để P&L thực tế hơn (không bắt buộc). **Quyết định cần chốt một trong hai:**
- [ ] Giữ miễn phí (đơn giản hoá MVP) → xoá đề xuất phí 0,15% khỏi spec, hoặc
- [ ] Áp phí 0,15%/lệnh → cập nhật lại Figma, hiển thị rõ phí trong "Tổng tiền thanh toán" thay vì ghi "Miễn phí".
Không để 2 tài liệu (Figma và spec) nêu 2 phương án khác nhau.

### 2.2. Sharpe Ratio hiện ở Quý 1 — chưa có cơ sở tính toán

**Quan sát:** Sổ Lệnh Quý 1 hiển thị `$EQ_GROWTH — Sharpe 1.84 (Tích cực)`, `$EQ_VALUE — Sharpe 2.10 (Bền vững)` **ngay tại thời điểm đặt lệnh lần đầu**, trước khi có bất kỳ kết quả lợi nhuận nào của phiên chơi.

**Vấn đề:** Sharpe Ratio về bản chất là `(lợi nhuận trung bình − lãi suất phi rủi ro) / độ lệch chuẩn lợi nhuận`, cần chuỗi dữ liệu lợi nhuận theo thời gian. Không thể có giá trị Sharpe cho phiên chơi hiện tại khi chưa chạy quý nào.

**Yêu cầu xử lý:**
- [ ] Nếu con số 1.84/2.10 là **Sharpe lịch sử tham khảo** của loại tài sản đó ngoài đời thực (không phải Sharpe của phiên chơi) → đổi nhãn rõ ràng thành `Sharpe lịch sử 3 năm (tham khảo)` để tránh hiểu lầm là kết quả của phiên chơi này.
- [ ] Nếu dự định là Sharpe của chính phiên chơi → chỉ hiển thị cột này **từ Quý 2 trở đi** (khi đã có ít nhất 1 điểm dữ liệu lợi nhuận), ẩn hoặc để "—" ở Quý 1.

### 2.3. Nhãn "LIVE FEED" và khung thời gian tháng cho cơ chế turn-based

**Quan sát:** Biểu đồ VN-Index/VN30 ở Map 2 gắn badge `LIVE FEED`, kèm chú thích trục thời gian `Month 1 (Allocated) / Month 2 (Consolidation) / Current Target (Q1 End)`.

**Vấn đề:** Map 2 là turn-based theo quý (đã xác nhận ở `AURA_MAP1_MAP2_GAME_SPEC.md` §2.1) — người chơi không thao tác gì trong nội bộ 1 quý, không có "tháng 1, tháng 2" để theo dõi real-time. Nhãn "LIVE FEED" dễ khiến người dùng nghĩ có thể phản ứng theo thời gian thực như Map 1, sai với thiết kế cốt lõi (mục đích dạy sự kiên nhẫn, không phải phản xạ nhanh).

**Yêu cầu xử lý:**
- [ ] Đổi `LIVE FEED` → `DỮ LIỆU MÔ PHỎNG QUÝ {n}` hoặc tương tự, bỏ hàm ý thời gian thực.
- [ ] Bỏ chia nhỏ "Month 1/Month 2" trong nội bộ 1 quý; biểu đồ nến nên hiển thị theo đơn vị **quý đã qua** (trục X = Q1, Q2, …), không chia nhỏ hơn đơn vị mà game cho phép người chơi ra quyết định.
- [ ] Tương tự, cân nhắc bỏ bớt các nút khung thời gian `1s / 5s / 15s / 1m` ở biểu đồ Map 1 — round chỉ kéo dài 45 giây, khung "1 phút" gần như không có ý nghĩa thực tế trong ngữ cảnh này.

### 2.4. Thuật ngữ "Round" áp cho cả Map 2

**Quan sát:** Badge trạng thái Quý 1 ghi `Active Round`.

**Vấn đề:** "Round" nên dành riêng cho Map 1 (7 Round × 45 giây, nhịp độ nhanh); Map 2 dùng đơn vị "Quý" (12 Quý, turn-based). Dùng chung từ "Round" cho cả 2 map làm mờ đi sự khác biệt nhịp độ mà thiết kế game cố tình tạo ra giữa 2 trải nghiệm.

**Yêu cầu xử lý:**
- [ ] Đổi `Active Round` → `Đang mở Quý` hoặc `Quý đang hoạt động` trong toàn bộ Map 2.
- [ ] Rà soát các nhãn khác có thể bị lẫn "Round"/"Quý" giữa 2 map trong toàn bộ Figma.

### 2.5. Trộn ngôn ngữ Anh–Việt dù đang chọn "EN"

**Quan sát:** Selector ngôn ngữ ở navbar chọn `EN`, nhưng phần lớn nội dung (tiêu đề thẻ, tin tức, nhận định AI Advisor, nhãn nút) vẫn là tiếng Việt; chỉ một số nhãn UI khung (TOTAL ASSETS, UNREALIZED P&L, Sharpe Ratio…) là tiếng Anh.

**Yêu cầu xử lý:** áp dụng đúng theo `AURA_UX_IMPROVEMENTS_SPEC.md` mục 9 (Đa ngôn ngữ VI/EN):
- [ ] Toàn bộ chuỗi UI khung (nhãn nút, tiêu đề cố định) tách vào file locale `vi.json`/`en.json`.
- [ ] Nội dung động sinh ra từ dữ liệu game (tin tức, nhận định AI, tên tài sản mô tả) **hiện tại chỉ có tiếng Việt** — khi người dùng chọn `EN`, hiển thị kèm chip nhỏ `Vietnamese content` thay vì để lẫn 2 ngôn ngữ không rõ lý do như hiện tại.

---

## 3. 🟡 VẤN ĐỀ MỨC ĐỘ THẤP

### 3.1. Tên mã cổ phiếu "VIN — VinAlpha Corp" gần giống mã thật

Tài liệu gốc dùng mã hư cấu `$FOMO`. Figma đổi thành `VIN — VinAlpha Corp`, khá gần về mặt liên tưởng với các mã thật ngoài đời (VIC – Vingroup, VHM – Vinhomes, VFS – VinFast). Với một sản phẩm mô phỏng tài chính công khai, nên **giữ mã và tên doanh nghiệp rõ ràng là hư cấu**, tránh liên tưởng đến doanh nghiệp/mã cổ phiếu thật đang niêm yết.

**Yêu cầu xử lý:**
- [ ] Đổi tên mã sang một cái tên trung tính hơn, không gần giống mã thật (ví dụ giữ nguyên tinh thần "penny sôi động" nhưng tên khác hẳn).
- [ ] Áp dụng tương tự cho các mã ở Map 2 (`$EQ_GROWTH`, `$EQ_VALUE`) — đây là tên nhóm tài sản chung chung nên ổn, không cần đổi.

### 3.2. Công thức tính nhãn "phong cách đầu tư" cuối game

Màn Debrief gắn nhãn `Nhà đầu tư phòng thủ kỷ luật`, nhưng phân bổ hiển thị cuối cùng là `Growth Stocks 45% / Value 25% / Bonds 20% / Cash 10%` — tức tỷ trọng tấn công (Growth) khá cao ở thời điểm cuối.

**Theo spec** (`AURA_MAP1_MAP2_GAME_SPEC.md` §2.9), nhãn phong cách phải tính trên **tỷ trọng bình quân của cả 12 quý**, không phải chỉ tỷ trọng ở quý cuối. Nếu người chơi chuyển dần từ phòng thủ sang tấn công theo thời gian (đúng chiến lược "gia tăng Growth khi CPI hạ nhiệt" mà AI Advisor gợi ý), nhãn cuối cùng hoàn toàn có thể vẫn là "phòng thủ kỷ luật" nếu tính bình quân — nhưng cần Agent **xác nhận lại logic tính đúng theo công thức trong spec**, không suy diễn từ phân bổ hiển thị ở màn cuối.

**Yêu cầu xử lý:**
- [ ] Khi lập trình, đảm bảo nhãn phong cách được tính từ **chuỗi phân bổ 12 quý** lưu trong `navHistory`/`allocationHistory`, không phải chỉ từ giá trị `allocation` cuối cùng.

### 3.3. Thiếu thiết kế cho một số màn quan trọng

Bộ ảnh review hiện chỉ có: Map 1 lúc đang chơi (Round 2), Map 2 màn Quý 1, Map 2 màn Debrief. **Chưa có thiết kế cho:**
- Popup Bẫy/Quiz của Map 1 (ví dụ popup "Bull-trap" ở Round 4, quiz 10 giây).
- Thanh tiến trình 4 pha trong 1 round (News & Trap → Trading → Trap/Quiz → Ledger Update) — hiện Figma chỉ có đồng hồ đếm ngược tổng, chưa thấy pha nào đang diễn ra.
- Màn Debrief của Map 1 (kết quả Sống sót/Cháy tài khoản, hộp phân tích sai lầm theo Round, FOMO Score/Discipline Score).
- Màn Briefing trước khi vào mỗi map (giải thích luật chơi, mục tiêu) theo `AURA_UI_REDESIGN_SPEC.md` mục 4.3.

**Yêu cầu xử lý:** đề nghị chủ dự án bổ sung thiết kế Figma cho các màn còn thiếu trước khi Agent bắt tay dựng toàn bộ luồng game; nếu buộc phải dựng trước, Agent tự thiết kế theo đúng design system + nội dung đã mô tả trong `AURA_MAP1_MAP2_GAME_SPEC.md`, đánh dấu `TODO: đối chiếu lại khi có Figma chính thức`.

---

## 4. ACCEPTANCE CRITERIA (trước khi chuyển Figma → code)

- [ ] Không còn nhãn "Top X% cohort" hiển thị khi chưa có dữ liệu thật hoặc chưa có leaderboard; đã có quyết định rõ ràng giữ/bỏ tính năng này.
- [ ] Toàn bộ màn Map 2 chỉ dùng **một** chỉ số benchmark (VN-Index hoặc VN30, đã chốt), không lẫn cả hai.
- [ ] Thông số `$BOND` (kỳ hạn, lợi suất) đã được xác nhận và đồng bộ giữa Figma, spec game, và file config tính toán.
- [ ] `Total Assets` luôn bằng `Cash + giá trị vị thế mở`, khớp với `Unrealized P&L` hiển thị cùng lúc.
- [ ] Margin bị khoá ở Round 1–2, chỉ mở đúng từ Round 3, đúng thời điểm kịch bản "Bẫy Margin".
- [ ] Đã chốt phương án phí giao dịch (miễn phí hoặc 0,15%/lệnh), áp dụng nhất quán UI + logic.
- [ ] Sharpe Ratio không hiển thị sai ngữ cảnh (ẩn ở Quý 1 hoặc ghi rõ là số liệu lịch sử tham khảo).
- [ ] Không còn badge "LIVE FEED" hay chia nhỏ theo tháng cho cơ chế turn-based của Map 2.
- [ ] Nhãn "Round" chỉ dùng cho Map 1; Map 2 dùng "Quý" xuyên suốt.
- [ ] Nội dung động (tin tức, nhận định AI) có xử lý rõ ràng khi người dùng chọn ngôn ngữ EN.
- [ ] Mã cổ phiếu Map 1 không còn gần giống mã thật ngoài đời.
- [ ] Nhãn phong cách đầu tư cuối game tính từ dữ liệu bình quân 12 quý, có unit test xác nhận.
- [ ] Đã có (hoặc đã yêu cầu bổ sung) thiết kế cho: popup Bẫy/Quiz Map 1, thanh tiến trình 4 pha, Debrief Map 1, màn Briefing.

---

## 5. GHI CHÚ CHO AGENT

- File này là **danh sách vấn đề cần sửa**, không phải đặc tả thay thế — sau khi xử lý xong các mục trên, quay lại đối chiếu với `AURA_MAP1_MAP2_GAME_SPEC.md` và `AURA_UI_REDESIGN_SPEC.md` để đảm bảo không có mâu thuẫn mới phát sinh.
- Với các mục 🔴 (mức cao), **không tự chọn phương án** nếu ảnh hưởng đến công thức tính toán tài chính hoặc tuyên bố dữ liệu (leaderboard, benchmark) — cần xác nhận từ chủ dự án, ghi lại quyết định vào `docs/OPEN_QUESTIONS.md`.
- Với các mục 🟠/🟡, Agent có thể tự sửa theo hướng đề xuất trong file, miễn giữ đúng nguyên tắc server-authoritative và design system đã thống nhất.
