# AURA CAPITAL — GAME DESIGN SPEC: MAP 1 & MAP 2 (v2, bổ sung & chỉnh sửa)

> **Đối tượng đọc:** AI Agent hiện thực hoá game logic + UI cho `/simulation`.
> **Nguồn gốc:** dựa trên `mô_tả_game_chi_tiết.docx` (bản gốc). File này **giữ nguyên toàn bộ khung ý tưởng gốc**, đồng thời:
> - 🟢 **THÊM** — phần chưa có trong bản gốc, cần thiết để lập trình được (bảng hệ số β, ngân hàng câu hỏi, giá trị mặc định, edge case).
> - 🟡 **SỬA** — phần bản gốc có nhưng mơ hồ/thiếu nhất quán, được làm rõ lại.
> - 🔴 **BỚT** — phần đề xuất cắt hoặc hoãn cho MVP vì độ phức tạp cao, có ghi lý do.
> Mỗi mục quan trọng đều đánh dấu nhãn trên để chủ dự án dễ đối chiếu với bản gốc.
> **Liên quan:** `AURA_UI_REDESIGN_SPEC.md` (giao diện tổng thể), `AURA_UX_IMPROVEMENTS_SPEC.md` (Courses, liên kết Map ↔ bài học). File này là **đặc tả nội dung & luật chơi**; UI/CSS áp theo 2 file kia.

---

## 0. TÓM TẮT THAY ĐỔI SO VỚI BẢN GỐC

| # | Vị trí | Loại | Nội dung |
|---|--------|------|----------|
| 1 | Map 2 §3.2 | 🟢 THÊM | Điền đầy đủ **Bảng Ma Trận Hệ Số Độ Nhạy (β)** — bản gốc để trống |
| 2 | Map 2 | 🟢 THÊM | **Ngân hàng câu hỏi Quiz** (6 câu, bản gốc chỉ có 1 câu ví dụ) |
| 3 | Map 2 §Vĩ mô | 🟢 THÊM | Sơ đồ **chuỗi phản ứng khi tăng/hạ lãi suất** (đã nêu ở lần trước, nay đưa vào đây) |
| 4 | Map 1 §2.3 | 🟡 SỬA | Làm rõ trọng số $w$ trong công thức FOMO Score (bản gốc không cho giá trị) |
| 5 | Map 1 R1–R7 | 🟡 SỬA | Chuẩn hoá lại % biến động giá mỗi round thành chuỗi giá cụ thể, khớp toán học |
| 6 | Cả 2 map | 🟢 THÊM | **State machine (FSM) chi tiết dạng bảng trạng thái/sự kiện/chuyển tiếp**, phục vụ lập trình |
| 7 | Cả 2 map | 🟢 THÊM | **Data model & API** đề xuất (session, order, quiz submit) |
| 8 | Map 1 | 🟢 THÊM | Cơ chế **Tutorial Round (R0)** ẩn để người chơi làm quen nút lệnh trước khi tính điểm — tách khỏi "R1: Khởi Động" cho gọn |
| 9 | Map 2 | 🔴 BỚT (MVP) | AI Advisor gọi model thật mỗi lượt → **MVP dùng phản hồi mẫu (template) có chèn số liệu**, chỉ gọi LLM thật ở bản sau, để tránh phụ thuộc chi phí/độ trễ API ngay từ đầu |
| 10 | Map 1 | 🔴 BỚT (MVP) | Bỏ tính năng Margin **x5** ở MVP đầu, chỉ giữ **x2**; x5 mở ở bản sau — margin cao dễ gây trải nghiệm tiêu cực nếu chưa test kỹ cân bằng số |
| 11 | Map 2 | 🟡 SỬA | "12 Quý" xác nhận là **12 lượt turn-based**, không có đồng hồ đếm giờ thực — ghi rõ để tránh nhầm với Map 1 |
| 12 | Cả 2 map | 🟢 THÊM | Bảng **trạng thái kết thúc & màn hình lỗi/thoát giữa chừng** (đóng app, mất mạng) — bản gốc chưa đề cập |

---

## 1. MAP 1 — ĐẤU TRƯỜNG FOMO (Real-time Engine)

### 1.1. Mục tiêu & khung tổng thể (giữ nguyên bản gốc)
- **Mục tiêu cốt lõi:** nhận diện & vượt qua cạm bẫy tâm lý (bầy đàn, đu đỉnh, hoảng loạn cắt lỗ).
- **Thời lượng:** 7 Round × 45 giây = **~5.5 phút** chơi thực tế (chưa tính thời gian đọc Debrief).
- **Tài sản:** 1 mã giả định `$FOMO`.
- **Vốn khởi điểm:** `V₀ = 10.000.000 VND`, 100% tiền mặt.
- **Điều kiện thắng:** kết thúc 7 round mà `NAV > 5.000.000 VND` (không cháy tài khoản); khuyến khích đạt `NAV ≥ V₀ × 1.05` (+5%) trở lên.
- **Điều kiện thua (Stop-Out):** `NAV_t ≤ 5.000.000 VND` **HOẶC** (nếu dùng margin) `Equity < 0.2 × Total_Asset`.

### 1.2. 🟢 THÊM — Tutorial Round (R0)
Trước Round 1, thêm **R0 – Làm quen (không tính điểm, không giới hạn 45s)**:
- Hiển thị nổi bật: nút BUY/SELL/HOLD, Quick Buy 25/50/100%, cách đọc bảng giá.
- Người chơi bấm thử 1 lệnh mua giả lập (không trừ vốn thật) → hệ thống xác nhận đã hiểu → nút `Bắt đầu Round 1`.
- Có thể bỏ qua (`Bỏ qua hướng dẫn`) nếu server ghi nhận người chơi đã hoàn thành R0 trước đó.

### 1.3. Tham số kỹ thuật (giữ nguyên + làm rõ)

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| Số round | 7 | không đổi |
| Thời gian/round | 45s | 4 pha cố định (xem 1.4) |
| Vốn khởi điểm | 10.000.000 VND | |
| Margin cho phép | Từ Round 3 | 🔴 MVP: chỉ **x2**; ẩn nút x5, hiện tooltip "Mở ở bản cập nhật sau" |
| Lãi vay margin | 0,1%/round | tính trên phần vay |
| Ngưỡng cháy TK | NAV ≤ 5.000.000 VND (−50%) | |
| Phí giao dịch | 🟢 THÊM: 0,15%/lệnh (mua & bán) | bản gốc chưa nêu phí — cần có để công thức P&L đúng thực tế, tham chiếu phí môi giới VN phổ biến; có thể chỉnh ở config |

### 1.4. Chu kỳ 1 Round — FSM 4 pha (🟡 SỬA cho rõ, nội dung số liệu giữ nguyên bản gốc)

```
[ROUND_START]
   │
   ▼
Pha 1 · NEWS_AND_TRAP     00s–10s   đẩy tin, bot chat seeding, giá bắt đầu trôi theo xu hướng mồi
   │
   ▼
Pha 2 · TRADING_WINDOW    10s–30s   user đặt lệnh BUY / SELL / HOLD / MARGIN(x2)
   │
   ▼
Pha 3 · TRAP_OR_QUIZ      30s–40s   dừng đồ thị; popup bẫy HOẶC mini-quiz 10s (tuỳ round, xem bảng 1.5)
   │
   ▼
Pha 4 · LEDGER_UPDATE     40s–45s   khớp lệnh, trừ phí, tính NAV, kiểm tra Margin Call / Stop-Out
   │
   ├─(NAV ≤ 5.000.000 hoặc Equity < 0.2×Total_Asset)→ [GAME_OVER: CHÁY_TK]
   ├─(round = 7)→ [GAME_OVER: KẾT_THÚC_BÌNH_THƯỜNG]
   └─(round < 7)→ [ROUND_START] (round += 1)
```

**Trạng thái hệ thống (state) cần lưu mỗi round:** `round_no, phase, price_open, price_current, price_close, cash, shares, margin_used, nav, pnl_realized, pnl_unrealized, orders[], fomo_score_partial, discipline_score_partial`.

### 1.5. Kịch bản 7 Round (🟡 SỬA — chuẩn hoá số liệu, nội dung tin tức/bot chat giữ nguyên bản gốc)

Giá tham chiếu Round 1 = **10.000 VND/cp** (giả định, để tính được số liệu cụ thể; Agent có thể đổi hằng số này trong config).

| Round | Xu hướng giá (% so với giá mở round) | Giá đóng ước tính | Tin tức (Newsfeed) | Bot chat seeding | Bẫy / Quiz |
|---|---|---|---|---|---|
| **R1 – Khởi Động** | +3% | 10.300 | "Công ty công bố ký kết biên bản ghi nhớ hợp tác chiến lược." | "Kèo này x2 tài khoản nhé", "Vào sớm ăn dày." | Không có bẫy. Chỉ hiển thị gợi ý dùng Quick Buy 25/50/100%. |
| **R2 – FOMO Peak** | +6,9% (chạm trần) | 11.010 | "Cổ đông lớn đăng ký gom thêm 5 triệu cổ phiếu." | "Múc nhanh còn kịp", "Mất hàng rồi!", "Tím lịm tìm sim!" | Popup: *"Cổ phiếu dư mua trần 2 triệu đơn vị. Đặt lệnh mua quét (ATO/MP)?"* → Có/Không. |
| **R3 – Bẫy Margin** | −7,0% (chạm sàn, xảy ra sau giây thứ 15 của pha Trading) | 10.239 | "Tin đồn: cơ quan chức năng tiến hành thanh tra doanh nghiệp." | "Ai xả vậy?", "Đội lái rung cây dọa khỉ thôi, gom thêm đi!" | Popup mời: *"Mở đòn bẩy Margin x2 để trung bình giá, hạ giá vốn ngay!"* (mở khoá nút Margin từ round này). |
| **R4 – Bull-trap** | +4% (hồi kỹ thuật, thanh khoản thấp) | 10.649 | "Chủ tịch đăng đàn phủ nhận toàn bộ tin đồn thất thiệt." | "Thấy chưa, đáy rồi!", "Bắt đáy thành công ăn trọn cây hồi!" | Quiz 10s: *"Giá tăng lại sau phiên sàn nhưng khối lượng thấp — hiện tượng gì?"* A) Tích luỹ bền vững B) **Bull-trap hồi kỹ thuật** ✔. Đúng → tặng 1 lệnh Stop-loss miễn phí. |
| **R5 – Cắt Thanh Khoản** | Giá đứng ở sàn, không khớp | ~9.900 (sàn) | "Sàn giao dịch nghẽn lệnh, lệnh bán không thể khớp." | Chat tê liệt: "Cứu với", "Sao không bán được?" | Bẫy: khoá nút SELL ở giá thị trường, chỉ cho đặt lệnh bán giá sàn xếp hàng — mô phỏng "trắng bên mua". |
| **R6 – Rửa Phèn** | −1% (đi ngang đáy) | 9.801 | "Chuyên gia khuyến nghị nhà đầu tư giữ bình tĩnh, rà soát danh mục." | "Cháy tài khoản rồi", "Thôi bỏ chứng khoán." | Quiz 10s: *"Tài khoản đang lỗ lớn, kỷ luật đầu tiên cần làm gì?"* A) Nạp thêm tiền gỡ gạc B) **Đo mức chịu lỗ & kích hoạt cắt lỗ định trước** ✔. |
| **R7 – Phân Hoá** | +2% | 9.997 | "Báo cáo tài chính quý xác nhận kết quả kinh doanh bình thường." | Dòng tiền tổ chức mua rải rác. | Không có bẫy — chỉ tổng kết, chuyển sang Debrief. |

> **Ghi chú kỹ thuật (🟢 THÊM):** % biến động là **biên trần/sàn theo kịch bản**, không phải random; giúp kết quả game có thể kiểm thử lại (deterministic theo seed) trong khi cảm giác vẫn "random" nhờ thời điểm bật bẫy và phản ứng của người chơi khác nhau. Agent có thể thêm nhiễu ngẫu nhiên nhỏ (±0,3%) quanh các mốc trên để tránh cảm giác máy móc, miễn không đổi hướng xu hướng.

### 1.6. Công thức chỉ số hành vi (🟡 SỬA — cho giá trị trọng số cụ thể; bản gốc chỉ có công thức khung)

**FOMO Score** (càng cao càng "cháy theo đám đông"):
```
S_FOMO = min(100, Σ_{t=1}^{7} [ w1·I_buy_at_high + w2·I_100% + w3·((30 - TimeRemaining)/30) ] × 100/7)

w1 = 0.5   (mua khi giá đang tăng > 5% trong pha Trading)
w2 = 0.3   (lệnh mua dùng 100% tiền mặt khả dụng)
w3 = 0.2   (mua trong 5 giây cuối cửa sổ Trading — TimeRemaining < 5)
```
- `I_x` = 1 nếu điều kiện đúng ở round đó, ngược lại 0.
- Chia đều cho 7 round rồi cộng dồn, chặn trần 100.

**Discipline Score** (khởi điểm 100, trừ dần):
```
S_Discipline = 100
  − 15 điểm / round không đặt Stop-loss khi đang có lệnh mở
  − 30 điểm  nếu kích hoạt Margin lúc danh mục đang lỗ > 15%
  − 10 điểm / câu quiz trả lời sai
(chặn dưới 0, không âm)
```

**Xếp loại kết quả (🟢 THÊM — bản gốc chưa có thang xếp loại):**

| Discipline Score | Nhãn kết quả |
|---|---|
| 80–100 | "Nhà đầu tư kỷ luật thép" |
| 50–79 | "Còn dao động, cần rèn thêm" |
| 0–49 | "Dễ bị cảm xúc chi phối" |

### 1.7. Kết thúc & Debrief (giữ nguyên ý bản gốc, làm rõ nội dung)
- **SỐNG SÓT** (xanh) khi `NAV cuối > 5.000.000`; **CHÁY TÀI KHOẢN** (đỏ) khi chạm Stop-Out bất kỳ lúc nào (kết thúc sớm, không cần đợi hết 7 round).
- Biểu đồ NAV theo thời gian, chồng mốc mua/bán lên đường giá `$FOMO`.
- Hộp "Sai lầm theo Round": liệt kê tối đa 3 sai lầm nặng nhất (ưu tiên: dùng margin lúc lỗ nặng > mua all-in tại đỉnh > bỏ lỡ tín hiệu bull-trap), theo mẫu câu: *"Tại Round 3, bạn đã dùng Margin x2 khi thị trường đang rơi sàn, làm tăng mức lỗ danh mục thêm X%."* — số X tính từ dữ liệu thật của phiên, không hard-code.
- Phần thưởng nếu sống sót: huy hiệu **"Sống sót qua bão FOMO"** + mở khoá Map 2.
- CTA: `Chơi lại Map 1` (ghost) · `Tiến vào Map 2: Học cách đầu tư bài bản` (primary, chỉ hiện nếu sống sót; nếu cháy tài khoản → `Thử lại Map 1` primary, ẩn CTA Map 2).

---

## 2. MAP 2 — PRO ROOM (Macro Simulation & Value Engine)

### 2.1. Mục tiêu & khung tổng thể (giữ nguyên bản gốc, làm rõ nhịp chơi — 🟡 SỬA mục 12 ở bảng tóm tắt)
- **Mục tiêu:** chuyển tư duy từ lướt sóng sang đầu tư giá trị, kỷ luật dài hạn.
- **Cơ chế:** **theo lượt (turn-based)**, KHÔNG có đồng hồ đếm giờ thực. Quý chỉ chuyển khi người chơi bấm `Xác Nhận & Chốt Quý`.
- **Thời lượng:** 12 Quý (≈ 3 năm kinh tế mô phỏng); mỗi quý người chơi có thể suy nghĩ không giới hạn thời gian.
- **Vốn khởi điểm:** `V₀ = 100.000.000 VND`.
- **Mục tiêu thắng:** lợi nhuận ổn định, `Max Drawdown < 15%` trong suốt 12 quý.

### 2.2. Vũ trụ tài sản (giữ nguyên bản gốc)

| Mã | Loại | Beta rủi ro | Đặc điểm |
|---|---|---|---|
| `EQ_GROWTH` | Cổ phiếu Tăng trưởng (Công nghệ/Bán lẻ) | β = 1.4 | Nhạy lãi suất, P/E cao |
| `EQ_VALUE` | Cổ phiếu Giá trị/Phòng thủ (Năng lượng/Tiện ích) | β = 0.7 | Cổ tức 8–10%/năm, P/E thấp, ít vay nợ |
| `BOND` | Trái phiếu DN/Chính phủ kỳ hạn 1 năm | — | Lợi tức cố định 7,5%/năm, rủi ro vỡ nợ thấp |
| `CASH` | Tiền gửi/tiết kiệm linh hoạt | — | Lợi tức 4,0%/năm, an toàn tuyệt đối |

### 2.3. 🟢 THÊM — Bảng Ma Trận Hệ Số Độ Nhạy (β) — bản gốc để trống, nay điền đầy đủ

Công thức gốc (giữ nguyên):
```
R_i,t = α_i + β_i1·ΔRate_t + β_i2·ΔInflation_t + β_i3·ΔGDP_t + ε_i
```
trong đó `Δ` là **thay đổi so với quý trước** (điểm %), `ε_i` là nhiễu ngẫu nhiên nhỏ (mô tả ở dưới bảng).

| Tài sản `i` | α_i (drift nền/quý) | β_i1 (nhạy Lãi suất) | β_i2 (nhạy Lạm phát) | β_i3 (nhạy GDP) |
|---|---|---|---|---|
| `EQ_GROWTH` | +2,0% | **−2,0** (rất nhạy, ngược chiều) | −0,8 | +1,5 |
| `EQ_VALUE`  | +1,5% | −0,5 | **+0,3** (phòng thủ, hưởng lợi nhẹ khi lạm phát) | +0,6 |
| `BOND`      | +1,875% (=7,5%/4) | **−1,0** (giá trái phiếu giảm khi lãi suất tăng) | −0,2 | +0,1 |
| `CASH`      | +1,0% (=4%/4) | **+0,3** (lãi tiết kiệm tăng theo lãi suất điều hành) | 0 | 0 |

- **Nhiễu `ε_i`:** phân phối chuẩn `N(0, σ_i)` với `σ_EQ_GROWTH = 3%`, `σ_EQ_VALUE = 1.5%`, `σ_BOND = 0.5%`, `σ_CASH = 0%` — để mỗi phiên chơi có biến động nhẹ khác nhau dù cùng kịch bản vĩ mô, tránh cảm giác máy móc.
- Toàn bộ hằng số trên đặt trong file config (`map2-asset-model.json`), có thể chủ dự án tinh chỉnh lại theo playtest mà không cần sửa code.

### 2.4. 🟢 THÊM — Sơ đồ chuỗi phản ứng vĩ mô (bản gốc bị thiếu ở đoạn "Hãy nhìn chuỗi phản ứng dây chuyền…")

**Khi NHNN TĂNG lãi suất:**
```
NHNN tăng lãi suất điều hành
        │
        ▼
Lãi suất tiết kiệm hấp dẫn hơn kênh đầu tư rủi ro
        │
        ▼
Dòng tiền rút khỏi cổ phiếu tăng trưởng & bất động sản → đổ vào tiết kiệm/trái phiếu ngắn hạn
        │
        ▼
Chi phí vay vốn của doanh nghiệp tăng → biên lợi nhuận co lại
        │
        ▼
Định giá cổ phiếu (đặc biệt EQ_GROWTH) bị chiết khấu mạnh hơn → giá giảm
```

**Khi NHNN HẠ lãi suất:** (giữ nguyên câu gốc, minh hoạ lại thành sơ đồ)
```
NHNN hạ lãi suất điều hành
        │
        ▼
Tiền gửi tiết kiệm kém hấp dẫn
        │
        ▼
Dòng tiền rẻ tìm kênh sinh lời cao hơn
        │
        ▼
Thanh khoản thị trường chứng khoán tăng mạnh → bước vào chu kỳ tăng điểm (Bull market)
```
Hiển thị sơ đồ này trong popup "Giải thích vĩ mô" mỗi khi có thay đổi lãi suất giữa 2 quý (không bắt buộc đọc, có nút `Bỏ qua`).

### 2.5. Dòng thời gian 12 Quý (giữ nguyên bản gốc, bổ sung bảng số liệu đầu vào cụ thể — 🟡 SỬA)

| Giai đoạn | Quý | Lãi suất | Lạm phát | GDP | Diễn giải |
|---|---|---|---|---|---|
| **1. Bùng nổ** | Q1–Q3 | 5,0% | 2,5% | 7,5% | `EQ_GROWTH` bứt phá; nên vẫn giữ % nhỏ phòng thủ |
| **2. Đình lạm & siết tiền tệ** | Q4–Q6 | 8,5% | 6,0% | 4,0% (🟢 giả định hợp lý, bản gốc không nêu số GDP giai đoạn này) | `EQ_GROWTH` giảm mạnh; `EQ_VALUE`/`CASH` giữ nhịp |
| **3. Suy thoái & tạo đáy** | Q7–Q9 | 7,0% (🟢 giả định — bắt đầu hạ nhẹ cuối giai đoạn) | 4,0% | 3,0% | Cổ phiếu tốt bị bán dưới P/B < 1.0; nên dùng tiền mặt tích luỹ mua vào |
| **4. Hồi phục & tái thiết** | Q10–Q12 | 6,0% | 3,0% (🟢 giả định giảm dần theo đà hạ nhiệt) | 6,0% (🟢 giả định hồi phục) | Gặt hái thành quả nếu phân bổ đúng ở giai đoạn 3 |

> **🟡 Lưu ý:** các số có nhãn 🟢 giả định là suy ra hợp lý từ mạch truyện gốc (do bản gốc chỉ cho đủ số ở 2/4 giai đoạn). Agent áp dụng làm giá trị mặc định; chủ dự án có thể chỉnh trong config, không ảnh hưởng cấu trúc code.

### 2.6. FSM của 1 Quý (🟢 THÊM, phục vụ lập trình)

```
[QUARTER_START: hiển thị Macro Vector quý này + biến động giá kỳ trước]
        │
        ▼
Pha "Đọc số liệu & lọc cổ phiếu"
  - Xem báo cáo tài chính rút gọn từng tài sản
  - (tuỳ chọn) hỏi AI Advisor: "Đánh giá sức khoẻ tài chính doanh nghiệp này"
        │
        ▼
Pha "Tái phân bổ danh mục"
  - Kéo % phân bổ 4 nhóm tài sản, tổng phải = 100%
        │
        ▼
Pha "Quiz tình huống kỷ luật" (không phải quý nào cũng có — xem 2.7)
        │
        ▼
[Người chơi bấm "Xác Nhận & Chốt Quý"]
        │
        ▼
Server tính R_i,t cho từng tài sản → cập nhật NAV, Drawdown
        │
        ▼
AI Advisor phản hồi nhận xét quý (xem 2.8)
        │
        ├─(quý = 12)→ [GAME_OVER: PORTFOLIO_REVIEW]
        └─(quý < 12)→ [QUARTER_START] (quý += 1)
```

### 2.7. 🟢 THÊM — Ngân hàng câu hỏi Quiz tình huống kỷ luật (bản gốc chỉ có 1 câu ví dụ)

Mỗi 2 quý xuất hiện 1 câu (Q2, Q4, Q6, Q8, Q10, Q12) — trả lời đúng cộng **Credit Score +10**, sai không trừ (để không nản, chỉ không được cộng):

| Quý | Tình huống | Đáp án đúng |
|---|---|---|
| Q2 | Doanh nghiệp bạn nắm giữ báo lợi nhuận quý giảm 5% do mở rộng nhà máy. Hành động phù hợp? | Xem xét đây là đầu tư dài hạn cho tăng trưởng tương lai, không vội bán nếu nền tảng tài chính vẫn tốt |
| Q4 | Lãi suất vừa tăng mạnh, `EQ_GROWTH` trong danh mục giảm 12% trong 1 quý. Bạn nên? | Đánh giá lại tỷ trọng theo khả năng chịu rủi ro, không bán tháo hoảng loạn; cân nhắc tăng dần `EQ_VALUE`/`BOND` |
| Q6 | Một cổ phiếu phòng thủ trong danh mục có P/E thấp bất thường so với ngành. Điều đầu tiên cần kiểm tra? | Kiểm tra lý do P/E thấp: lợi nhuận đột biến một lần, hay doanh nghiệp thực sự bị định giá thấp |
| Q8 | Thị trường vào giai đoạn suy thoái, nhiều cổ phiếu tốt có `P/B < 1`. Chiến lược hợp lý? | Giải ngân dần (DCA) vào tài sản tốt bị định giá thấp, không dồn hết vốn một lần |
| Q10 | Danh mục vừa hồi phục sau giai đoạn suy thoái, lãi 18% trong 1 quý. Bạn nên? | Chốt lời một phần theo kế hoạch đã đặt trước, không để lòng tham chi phối giữ 100% vị thế rủi ro |
| Q12 | Kết thúc chu kỳ 12 quý, danh mục có Max Drawdown 14% (dưới ngưỡng 15%). Bài học rút ra? | Kỷ luật phân bổ và kiên nhẫn qua các chu kỳ vĩ mô giúp kiểm soát rủi ro tốt hơn dự đoán thời điểm thị trường |

Mỗi câu có 3 lựa chọn (A/B/C), đáp án đúng ở giữa bảng trên diễn đạt lại thành lựa chọn B (theo phong cách bản gốc: A = hành động cảm tính, B = hành động kỷ luật, C = hành động cực đoan khác). Agent tự soạn văn bản 3 lựa chọn theo mẫu Trạm quiz ở Courses để nhất quán văn phong.

### 2.8. AI Advisor — System Prompt (giữ nguyên bản gốc)

```
BẠN LÀ: Cố vấn tài chính trưởng của CrediFin Pro Room.
PHONG CÁCH: Khách quan, kỷ luật, tư duy đầu tư giá trị (Benjamin Graham & Warren Buffett)
kết hợp quản trị danh mục hiện đại. Không phán đoán thị trường kiểu bói toán,
chỉ tập trung vào phân bổ tài sản, sức khoẻ doanh nghiệp và tương quan vĩ mô.

NGUYÊN TẮC PHẢN HỒI:
1. Không khuyên "mua tất tay" hay "bán tháo".
2. Luôn giải thích quan hệ nhân-quả: Biến số vĩ mô → Định giá tài sản → Quyết định phân bổ.
3. Khi người dùng chịu Drawdown do chu kỳ vĩ mô, động viên dựa trên số liệu lịch sử,
   nhắc kỷ luật tích sản.
4. Tối đa 3–4 câu ngắn gọn, súc tích, mang tính giáo dục tài chính.
```

**Template chốt quý (giữ nguyên bản gốc):**
```
DỮ LIỆU ĐẦU VÀO CỦA QUÝ {quarter_number}:
- Vĩ mô: Lãi suất {interest_rate}%, Lạm phát {inflation}%, GDP {gdp_growth}%.
- Phân bổ: Growth {alloc_growth}%, Value {alloc_value}%, Bond {alloc_bond}%, Cash {alloc_cash}%.
- Hiệu suất quý: NAV biến động {pnl_percent}% (NAV hiện tại: {current_nav} VND).
- Sự kiện phát sinh: {quarter_event_description}.

NHIỆM VỤ: Nhận xét ngắn gọn (<80 từ) về hành động phân bổ trong bối cảnh vĩ mô quý này,
chỉ ra 1 điểm tích cực và 1 điểm rủi ro cần lưu ý cho quý tới.
```

**🔴 BỚT (MVP):** Không gọi LLM thật ngay khi ra mắt. Thay bằng **hàm sinh nhận xét theo template** kết hợp điều kiện số liệu (rule-based), ví dụ:
```ts
function generateAdvisorNote(input): string {
  const risk = input.allocGrowth > 60 && input.interestRate > 7
    ? "tỷ trọng cổ phiếu tăng trưởng đang khá cao trong bối cảnh lãi suất tăng"
    : "danh mục có mức độ phòng thủ hợp lý";
  // ghép câu theo 3-4 mẫu câu cố định, chèn số liệu thật
}
```
Khi backend đã có ngân sách/hạ tầng gọi LLM ổn định, thay bằng system prompt thật ở trên **không đổi giao diện hiển thị**.

### 2.9. Kết thúc & Portfolio Review (giữ nguyên bản gốc)
- Điều kiện kết thúc: hoàn thành 12 quý (không có "cháy tài khoản" ở Map 2 — đây là điểm khác biệt chủ đích với Map 1, vì mục tiêu là dạy kiên nhẫn dài hạn, không phải áp lực sống còn).
- Báo cáo hiệu suất: `CAGR`, so với `VN-Index Benchmark` (→ `Alpha`), `Max Drawdown`, `Sharpe Ratio`.
- Nhận xét AI Advisor tổng kết phong cách đầu tư (ví dụ mẫu giữ nguyên bản gốc): *"Bạn duy trì kỷ luật tốt trước các đợt tăng lãi suất, nhưng tỷ trọng phòng thủ ở quý 6 hơi cao làm giảm hiệu suất sinh lời tối ưu."*
- **Chứng nhận phong cách (🟢 THÊM — quy tắc phân loại cụ thể, bản gốc chỉ cho ví dụ):**

| Điều kiện (trung bình 12 quý) | Nhãn phong cách |
|---|---|
| `alloc_value + alloc_bond + alloc_cash` bình quân ≥ 60% | "Nhà đầu tư phòng thủ kỷ luật" |
| Độ lệch chuẩn tỷ trọng giữa các quý > 15 điểm % (tái cơ cấu tích cực) | "Nhà phân bổ tài sản linh hoạt" |
| `alloc_growth` bình quân ≥ 60% và Sharpe > 1.0 | "Nhà đầu tư tăng trưởng có kỷ luật" |
| `alloc_growth` bình quân ≥ 60% và Sharpe ≤ 1.0 | "Nhà đầu tư tăng trưởng mạo hiểm" |

- CTA cuối: `Chơi lại Map 2` (ghost) · `Về Dashboard` (secondary) · `Chia sẻ thành tích` (primary, xem mục XP/badge ở `AURA_UX_IMPROVEMENTS_SPEC.md`).

---

## 3. QUY TẮC DÙNG CHUNG CHO CẢ 2 MAP (🟢 THÊM)

### 3.1. Trạng thái thoát giữa chừng / mất kết nối
| Tình huống | Xử lý |
|---|---|
| Người chơi đóng tab/mất mạng giữa Map 1 | Server giữ session tối đa 15 phút; nếu quay lại trong thời gian đó → tiếp tục đúng round & thời gian còn lại (tính theo server time, không theo client) đã trôi qua sẽ trừ; nếu quá 15 phút → phiên tự động kết thúc ở trạng thái "Cháy tài khoản do hết thời gian" **không tính là thất bại về kỹ năng** — hiển thị nhãn riêng: *"Phiên đã tự đóng do gián đoạn kết nối"* |
| Người chơi đóng tab giữa Map 2 | Vì turn-based, trạng thái quý hiện tại được lưu ngay sau mỗi lần bấm "Chốt Quý" → quay lại tiếp tục bình thường, không giới hạn thời gian |
| Lỗi mạng khi gửi lệnh (Map 1) | Optimistic UI: hiển thị lệnh "đang gửi", nếu server không xác nhận trong 3s → báo lỗi, cho gửi lại; **không tự ý coi là đã khớp** |

### 3.2. Data model & API đề xuất (điều chỉnh theo backend hiện có)

```ts
interface SimSessionMap1 {
  id: string; userId: string; status: "active"|"completed_survived"|"completed_burned"|"aborted";
  round: number; phase: "news_trap"|"trading"|"trap_quiz"|"ledger";
  cash: number; shares: number; marginUsed: number; nav: number;
  ordersLog: OrderLog[]; fomoScore: number; disciplineScore: number;
  startedAt: string; endedAt?: string;
}
interface SimSessionMap2 {
  id: string; userId: string; status: "active"|"completed"|"aborted";
  quarter: number; // 1..12
  allocation: { growth: number; value: number; bond: number; cash: number }; // %, tổng 100
  nav: number; navHistory: { quarter: number; nav: number }[];
  creditScore: number; maxDrawdown: number;
  startedAt: string; endedAt?: string;
}
```

```
POST /api/sim/map1/start                       → tạo session mới
POST /api/sim/map1/:id/order   {action, qty, margin?}   → đặt lệnh trong pha Trading
POST /api/sim/map1/:id/quiz    {questionId, answer}     → trả lời bẫy/quiz
GET  /api/sim/map1/:id/state                    → poll trạng thái hiện tại (round/phase/giá)
POST /api/sim/map1/:id/finish                   → server chốt kết quả, trả Debrief data

POST /api/sim/map2/start
POST /api/sim/map2/:id/allocate {growth, value, bond, cash}
POST /api/sim/map2/:id/quiz     {questionId, answer}   (chỉ ở quý có quiz)
POST /api/sim/map2/:id/commit-quarter                  → tính R_i,t, trả AI note + số liệu quý mới
GET  /api/sim/map2/:id/report                           → Portfolio Review khi quarter=12
```

Toàn bộ **tính toán giá, NAV, điểm số đều ở server** (đúng nguyên tắc server-authoritative đã áp dụng cho toàn hệ thống); client chỉ gửi hành động và hiển thị kết quả trả về.

### 3.3. Ràng buộc UI (tham chiếu, chi tiết style ở `AURA_UI_REDESIGN_SPEC.md` mục 4.4)
- Map 1: đồng hồ đếm ngược tròn 45s, thanh timeline 4 pha tô màu theo pha hiện tại, popup bẫy/quiz có đếm ngược riêng.
- Map 2: slider phân bổ 4 tài sản + donut chart, validate tổng = 100% trước khi cho bấm "Chốt Quý".
- Cả 2 map: banner "Simulation only · No real money" luôn hiển thị, giữ nguyên.

---

## 4. ACCEPTANCE CRITERIA

**Map 1**
- [ ] R0 (tutorial) hoạt động, có thể bỏ qua, không tính điểm.
- [ ] Đúng trình tự 4 pha × 45s cho cả 7 round, đúng nội dung tin tức/bot chat/bẫy theo bảng 1.5.
- [ ] Margin chỉ có x2 ở bản MVP; nút x5 ẩn hoặc disabled kèm tooltip.
- [ ] FOMO Score & Discipline Score tính đúng công thức 1.6, có xếp loại.
- [ ] Debrief hiển thị đúng SỐNG SÓT/CHÁY TÀI KHOẢN, hộp sai lầm lấy dữ liệu thật của phiên (không hard-code).
- [ ] Sống sót → mở khoá Map 2 + huy hiệu; cháy tài khoản → không mở Map 2.
- [ ] Mất kết nối được xử lý theo bảng 3.1, không tự động tính là thất bại về kỹ năng.

**Map 2**
- [ ] Turn-based, không có đồng hồ đếm giờ thực; quý chỉ chuyển khi bấm "Chốt Quý".
- [ ] `R_i,t` tính đúng công thức với bảng β ở mục 2.3, có nhiễu ε theo σ quy định.
- [ ] Đúng 4 giai đoạn / 12 quý theo bảng 2.5.
- [ ] Quiz xuất hiện đúng Q2/4/6/8/10/12 theo ngân hàng câu hỏi 2.7.
- [ ] AI Advisor (MVP) sinh nhận xét rule-based hợp lý theo số liệu thật, dưới 80 từ, đúng 4 nguyên tắc phản hồi.
- [ ] Portfolio Review tính đúng CAGR/Alpha/Max Drawdown/Sharpe, gắn đúng 1 trong 4 nhãn phong cách ở mục 2.9.

**Chung**
- [ ] Toàn bộ tính toán (giá, NAV, điểm, kết quả quiz) thực hiện ở server; client không tự tính hoặc hiển thị số chưa được server xác nhận.
- [ ] Banner "Simulation only" hiển thị xuyên suốt cả 2 map.
- [ ] Config số liệu (β, σ, vĩ mô theo quý, phí giao dịch Map 1) tách riêng file, chỉnh được không cần sửa logic code.

---

## 5. GHI CHÚ CHO AGENT

- Mọi giá trị đánh dấu 🟢 (THÊM) là **đề xuất hợp lý để lấp khoảng trống của tài liệu gốc**, không phải số liệu bắt buộc tuyệt đối — nếu chủ dự án có số liệu khác, chỉ cần sửa trong file config, không đổi kiến trúc.
- Các mục 🔴 (BỚT) là đề xuất **hoãn cho MVP**, không phải xoá vĩnh viễn — giữ code dễ mở rộng (feature flag) để bật lại `Margin x5` và `LLM Advisor thật` khi sẵn sàng.
- Nếu phát hiện xung đột giữa file này và code hiện có về công thức tài chính (NAV, P&L, margin call) → **ưu tiên logic hiện có đang chạy đúng**, báo lại phần xung đột thay vì tự sửa.
