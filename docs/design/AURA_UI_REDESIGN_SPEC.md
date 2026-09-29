# AURA CAPITAL — UI REDESIGN SPEC (Home + Simulation + Design System)

> **Đối tượng đọc:** AI Agent thực thi front-end.
> **Mục tiêu:** Thiết kế lại giao diện Aura Capital theo phong cách "corporate landing" của Jabil (hero → giới thiệu → số liệu → tính năng → CTA), tông màu **sáng, tươi**, và biến trang **Simulation** thành màn hình chọn **2 Map** (FOMO Arena / Pro Room).
> **Nguyên tắc vàng:** Chỉ thay đổi **UI/UX (layout, style, copy, component)**. **KHÔNG** đổi logic server-authoritative, API, auth, database, tính toán tài chính.

---

## 0. TÓM TẮT THAY ĐỔI

| # | Hạng mục | Hiện tại | Yêu cầu mới |
|---|----------|----------|-------------|
| 1 | Theme | Dark navy (`#0B1120`) | **Light + bright** (nền trắng/xanh rất nhạt, accent xanh dương – teal – xanh lá) |
| 2 | Home | 6 thẻ nhỏ, badge "PLANNED (MVP)" | Landing nhiều section kiểu Jabil (Hero, About, Stats, Features carousel, Maps, How-it-works, Insights, CTA, Footer) |
| 3 | Simulation | Cockpit giao dịch dạng bảng | **Trang chọn Map**: 2 card lớn (Map 1, Map 2) → click vào từng Map → Briefing → Game |
| 4 | Button/Vị trí | Nhiều nút nhỏ, lệch, input trắng không style | Hệ thống button thống nhất (Primary/Secondary/Ghost/Danger), vị trí cố định theo quy tắc mục 3 |
| 5 | Navbar | Email chip rớt xuống dòng 2 | 1 hàng duy nhất, user menu dạng avatar dropdown ở góc phải |

**Giữ nguyên:** toàn bộ disclaimer "Simulation only / No real money", badge "Server-authoritative", footer disclaimer, route hiện có, tên các trang trong nav.

---

## 1. DESIGN SYSTEM

### 1.1. Màu sắc (CSS variables — đặt trong `:root`)

```css
:root {
  /* Brand */
  --aura-blue-600: #1D6FF2;   /* primary */
  --aura-blue-500: #3B82F6;
  --aura-blue-100: #DBEAFE;
  --aura-teal-500: #06B6D4;   /* secondary */
  --aura-green-500: #22C55E;  /* success / accent (giống xanh lá Jabil) */
  --aura-lime-400:  #A3E635;  /* highlight nhỏ (underline, chip) */
  --aura-amber-500: #F59E0B;  /* cảnh báo / disclaimer */
  --aura-red-500:   #EF4444;  /* danger / lỗ / sell */

  /* Neutral (light) */
  --bg-page:     #F7FAFF;     /* nền trang */
  --bg-surface:  #FFFFFF;     /* card */
  --bg-soft:     #EEF4FF;     /* section xen kẽ */
  --bg-navy:     #0B2A5B;     /* section band tối tương phản (như "CUTTING EDGE" của Jabil) */
  --text-strong: #0B1B3A;
  --text-body:   #41506B;
  --text-muted:  #7B8AA5;
  --border:      #E1E8F5;

  /* Gradient thương hiệu (dùng cho tiêu đề section, CTA, hero) */
  --grad-brand:  linear-gradient(90deg, #1D6FF2 0%, #06B6D4 55%, #22C55E 100%);
  --grad-hero:   linear-gradient(135deg, #EAF3FF 0%, #E6FBF3 100%);
  --grad-navy:   linear-gradient(135deg, #0B2A5B 0%, #0E4C92 100%);

  /* Shape & shadow */
  --radius-sm: 8px; --radius-md: 14px; --radius-lg: 22px; --radius-pill: 999px;
  --shadow-card: 0 6px 24px rgba(29, 111, 242, 0.08);
  --shadow-hover: 0 12px 32px rgba(29, 111, 242, 0.16);
}
```

**Quy tắc màu:**
- Nền trang luôn sáng. Chỉ **1–2 section band** dùng `--bg-navy` để tạo nhịp (giống Jabil).
- Số dương/lãi = `--aura-green-500`; số âm/lỗ = `--aura-red-500`; trung tính = `--text-strong`.
- Tiêu đề section: chữ IN HOA, `font-weight: 800`, tô **gradient text** bằng `--grad-brand` (`background-clip: text`).
- Contrast tối thiểu WCAG AA (4.5:1) cho text thường.

### 1.2. Typography

- Font: **Inter** (body) + **Plus Jakarta Sans** hoặc **Sora** (heading). Fallback `system-ui, sans-serif`. Số liệu tài chính dùng `font-variant-numeric: tabular-nums`.
- Scale: `Hero 56/64` · `H2 section 40/48 (UPPERCASE)` · `H3 24/32` · `Body 16/26` · `Caption 13/20`.
- Mobile: hero 36/44, H2 28/36.

### 1.3. Hệ thống Button (BẮT BUỘC dùng lại, không tự style lẻ)

| Variant | Dùng cho | Style |
|---------|----------|-------|
| `btn-primary` | CTA chính của màn hình (tối đa **1** / khu vực) | nền `--aura-blue-600`, chữ trắng, radius pill, shadow nhẹ, hover: nâng 2px + đậm hơn |
| `btn-gradient` | CTA hero / banner cuối | nền `--grad-brand`, chữ trắng |
| `btn-secondary` | hành động phụ | viền 1.5px `--aura-blue-600`, nền trắng, chữ xanh |
| `btn-ghost` | link-button, "Xem thêm →" | không nền, chữ xanh, mũi tên `→` |
| `btn-danger` | Reset / Cancel / Remove | viền đỏ nhạt, chữ đỏ, hover nền đỏ nhạt |
| `btn-buy` / `btn-sell` | Đặt lệnh | Buy = xanh lá, Sell = đỏ; full-width trong order ticket |

Kích thước: `sm 36px · md 44px (mặc định) · lg 52px`. Padding ngang `20–28px`. Icon (lucide) bên trái 18px, gap 8px. Trạng thái bắt buộc: `hover, focus-visible (ring 3px --aura-blue-100), active, disabled (opacity .5), loading (spinner)`.

**Quy tắc vị trí button:**
1. CTA chính đặt **bên trái**, CTA phụ ngay bên phải (gap 12px). Trên mobile xếp dọc, full-width.
2. Nút nguy hiểm (Reset/Cancel/Remove) luôn **tách xa** nút chính, đặt cuối hàng bên phải và có bước xác nhận (modal).
3. Trong card: link `btn-ghost` ở **góc dưới bên phải**, badge trạng thái ở **góc trên bên phải**.
4. Không đặt quá 2 button cùng cấp trong một hàng.

### 1.4. Component nền tảng

- **Card:** nền trắng, viền `--border`, radius `--radius-lg`, shadow `--shadow-card`; hover nâng + `--shadow-hover`.
- **Badge/Chip:** pill, chữ 12px UPPERCASE, nền nhạt (vd `ACTIVE` = xanh lá nhạt, `SOON` = xám, `LOCKED` = amber).
- **Input/Select/Number:** cao 44px, radius `--radius-md`, viền `--border`, focus viền xanh + ring. **Bắt buộc style lại** `<select>` và `<input type=number>` (hiện đang là control mặc định màu trắng thô).
- **Disclaimer banner:** nền `#FFF8E6`, viền `--aura-amber-500`, chữ nâu đậm, icon cảnh báo — thay cho banner nâu tối hiện tại.
- **Motion:** transition 200ms ease; section fade-up khi scroll (IntersectionObserver); tôn trọng `prefers-reduced-motion`.

---

## 2. NAVBAR & FOOTER (toàn site)

**Navbar (sticky, cao 72px, nền trắng blur, viền dưới `--border`):**

```
[A Aura Capital]  Home  Dashboard  Courses  Simulation  Portfolio  Community  Subscription(SOON)      [🔍] [Avatar ▾]
```

- **Một hàng duy nhất** (fix lỗi email chip rớt dòng). Item active: chữ xanh + gạch chân gradient 3px.
- User: avatar tròn chữ cái đầu → dropdown chứa `email (rút gọn), Account Details, Đăng xuất`.
- Mobile (<1024px): hamburger, menu trượt từ phải.
- Chưa đăng nhập: hiện `Sign In` (secondary) + `Create Account` (primary) thay avatar.

**Footer:** 3 cột (Brand + disclaimer / Platform / Account) trên nền `--bg-navy`, chữ sáng. Giữ nguyên câu disclaimer và badge `BUILD V0.9.0-MVP`. Thêm dải icon social giống Jabil (placeholder).

---

## 3. TRANG HOME — LANDING KIỂU JABIL

Cấu trúc theo thứ tự cuộn (mỗi section cao ~ 480–640px, padding dọc 96px, container max `1200px`):

### S1. HERO
Tham chiếu: khối "MADE POSSIBLE. MADE BETTER." của Jabil.

```
┌───────────────────────────────────────────────────────────┐
│  [Chip: INTERACTIVE INVESTMENT PLATFORM]                  │
│  LEARN SMART.                                             │
│  INVEST SAFE.   ← gradient text                           │
│  Nền tảng học tài chính & mô phỏng đầu tư có AI hỗ trợ.   │
│  [Bắt đầu học]  [Vào Simulation →]        (ảnh/illustr.)  │
└───────────────────────────────────────────────────────────┘
```

- Nền `--grad-hero`, bên phải là illustration/mockup (biểu đồ nến + thẻ portfolio nổi, SVG hoặc ảnh). Cắt chéo cạnh dưới khối bằng `clip-path` (gợi cảm hứng cạnh vát của Jabil).
- Copy H1: **"HỌC THÔNG MINH. ĐẦU TƯ AN TOÀN."** (bản EN: "LEARN SMART. INVEST SAFE."). Sub: *"Học kiến thức tài chính, thực hành trong môi trường mô phỏng không rủi ro, và phát triển cùng cộng đồng nhà đầu tư."*
- CTA: `Khám phá khoá học` (`btn-gradient`, → `/courses`), `Vào Simulation` (`btn-secondary`, → `/simulation`).
- Dòng nhỏ dưới CTA: "Vốn ảo · Không tiền thật · Dành cho học tập".

### S2. "HELLO" — GIỚI THIỆU (About)
Layout 2 cột: trái là tiêu đề + đoạn giới thiệu + nút `Về Aura Capital`; phải là ảnh (người học đang dùng laptop) có cạnh vát chéo.
- Tiêu đề: **XIN CHÀO, AURA**.
- Nội dung: 3–4 câu về sứ mệnh (giáo dục tài chính, mô phỏng, AI Advisor, an toàn).

### S3. "GLOBAL" → **"CON SỐ ẤN TƯỢNG"** (Stats)
Nền `--bg-soft`. Lưới 3×2 (mobile 2×3) — mỗi ô: icon line 40px + **số lớn** gradient + nhãn nhỏ. Có hiệu ứng count-up khi vào viewport.

| Số | Nhãn |
|----|------|
| 2 | Map mô phỏng |
| 7 | Round/phiên FOMO |
| 12 | Quý kinh tế mô phỏng |
| 4 | Nhóm tài sản (Growth, Value, Bond, Cash) |
| 100% | Vốn ảo — an toàn |
| 24/7 | AI Advisor hỗ trợ (Map 2) |

> Số liệu lấy từ tài liệu game; **không bịa số người dùng**. Nếu sau này có số thật từ backend thì thay thế.

### S4. "WHAT WE DO" → **"TÍNH NĂNG CHÍNH"** (Features carousel)
Tham chiếu: hàng thẻ ảnh của Jabil (Design & Engineering / Supply Chain / Manufacturing).
- Carousel ngang, mỗi thẻ 320×380, ảnh nền + overlay gradient xanh + tiêu đề trắng ở giữa/dưới, hover phóng nhẹ; dấu chấm điều hướng bên dưới; swipe được trên mobile.
- **6 thẻ** (thay thế 6 thẻ cũ, **bỏ nhãn "PLANNED (MVP)"** — đổi thành badge trạng thái gọn ở góc trên phải: `Sẵn sàng` / `Sắp ra mắt`):

| Thẻ | Mô tả 1 dòng | Link |
|-----|--------------|------|
| Academy | Khoá học có quiz, flashcard, tích XP | `/courses` |
| Simulation Engine | 2 Map giao dịch mô phỏng | `/simulation` |
| Community | Thảo luận, chia sẻ phân tích | `/community` |
| Aura Intelligence | AI coach cá nhân hoá | (badge: Sắp ra mắt) |
| Membership & Plans | Gói thành viên minh bạch | `/subscription` (SOON) |
| Security & Protection | Argon2id, refresh token, role validation | (badge: Đang hoạt động) |

### S5. "CUTTING EDGE" → **"2 MAP MÔ PHỎNG"** (Featured — nền `--bg-navy`)
Tham chiếu: band xanh đậm + thẻ nổi bật của Jabil.
- Tiêu đề trắng/gradient: **TRẢI NGHIỆM ĐẦU TƯ QUA 2 MAP**.
- 2 thẻ lớn cạnh nhau (xem mô tả chi tiết ở mục 4 — dùng **cùng component `MapCard`**):
  - Map 1 – Đấu Trường FOMO
  - Map 2 – Pro Room
- Bên dưới: nút `Vào trang Simulation →` (`btn-gradient`).

### S6. "HOW IT WORKS" → **LỘ TRÌNH 4 BƯỚC**
Timeline ngang (mobile: dọc), có đường nối gradient:
1. **Học** ở Academy → 2. **Thử** ở Map 1 (FOMO) → 3. **Nâng cấp** tư duy ở Map 2 (Pro Room) → 4. **Chia sẻ** với Community.

### S7. "INSIGHTFUL" → **CỘNG ĐỒNG MỚI NHẤT**
Tham chiếu: carousel tin tức của Jabil. 3 thẻ bài đăng mới nhất lấy từ API community hiện có (tác giả, ngày, tiêu đề, trích đoạn, like/comment). Nếu chưa có dữ liệu → empty state thân thiện + nút `Đăng bài đầu tiên`. Link `Xem tất cả →`.

### S8. "PEOPLE-CENTERED" → **CTA HỌC VIÊN**
Nền trắng, ảnh bên phải cạnh vát; tiêu đề *"Học cùng nhau, tiến bộ mỗi ngày"*; nút `Tạo tài khoản miễn phí` (nếu chưa login) hoặc `Vào Dashboard` (nếu đã login).

### S9. CTA BAND CUỐI
Nền `--grad-navy`, chữ trắng: **"Sẵn sàng thử đầu tư mà không sợ mất tiền?"** + nút `Bắt đầu Map 1` (`btn-gradient`).

### S10. FOOTER (mục 2)

**Yêu cầu chung Home:** cuộn mượt, section xen kẽ nền (trắng / `--bg-soft` / navy), hero LCP < 2.5s (ảnh lazy-load trừ hero), responsive 360 → 1440px.

---

## 4. TRANG SIMULATION — CHỌN MAP

Bản vẽ tay của người dùng: tiêu đề "Simulation" ở trên, **2 ô Map 1 và Map 2** bên dưới. Hiện thực hoá như sau.

### 4.1. Wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  [Disclaimer banner: Simulation only · Virtual funds ...]    │
│                                                              │
│                    SIMULATION                                │
│      Chọn bản đồ để bắt đầu hành trình đầu tư của bạn        │
│                                                              │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   │
│  │ [MAP 1]     [Sẵn sàng]  │   │ [MAP 2]     [🔒 Khoá]   │   │
│  │  (illustration)         │   │  (illustration)         │   │
│  │  ĐẤU TRƯỜNG FOMO        │   │  PRO ROOM               │   │
│  │  Thử thách tâm lý &     │   │  Tư duy đầu tư giá trị  │   │
│  │  đầu cơ ngắn hạn        │   │  & phân tích chuyên sâu │   │
│  │  ⏱ 7 round · 45s/round  │   │  📅 12 quý · theo lượt  │   │
│  │  💰 10.000.000 VND ảo   │   │  💰 100.000.000 VND ảo  │   │
│  │  🎯 Sống sót, +5–10%    │   │  🎯 Drawdown < 15%      │   │
│  │  [Bắt đầu Map 1]        │   │  [Bắt đầu Map 2]        │   │
│  └─────────────────────────┘   └─────────────────────────┘   │
│                                                              │
│  Lộ trình: (1) Hoàn thành Map 1 ──🔑──▶ (2) Mở khoá Map 2    │
└──────────────────────────────────────────────────────────────┘
```

- Desktop: 2 cột bằng nhau, gap 32px. Mobile: xếp dọc, Map 1 trước.
- Thêm **stepper/progress** ở dưới: "Map 1 → 🔑 Chìa khoá → Map 2".

### 4.2. Component `MapCard`

```ts
type MapCardProps = {
  id: "map1-fomo" | "map2-pro";
  order: 1 | 2;
  title: string;
  subtitle: string;
  status: "available" | "locked" | "completed";   // lấy từ server, KHÔNG suy diễn ở client
  stats: { icon: string; label: string; value: string }[];
  goal: string;
  illustration: string;                            // SVG/ảnh
  ctaLabel: string;
  href: string;
  lockedReason?: string;                           // "Hoàn thành Map 1 để mở khoá"
};
```

**Trạng thái:**
- `available`: viền gradient khi hover, CTA `btn-primary`.
- `completed`: badge xanh lá "Hoàn thành ✓", CTA đổi thành `Chơi lại` (`btn-secondary`) + hiện điểm tốt nhất.
- `locked`: overlay mờ + icon khoá, CTA disabled, tooltip `lockedReason`. **Trạng thái khoá phải do server quyết định** (giữ nguyên nguyên tắc server-authoritative).

**Theme từng map (để phân biệt trực quan):**
- Map 1 – FOMO: accent **cam–đỏ ấm** nhạt (`#FFF1E6` nền, icon 🔥/⚡) gợi cảm giác gấp gáp, vẫn nằm trong bảng màu sáng.
- Map 2 – Pro Room: accent **xanh dương–teal** (`#E6F4FF` nền, icon 📊/🧠) gợi cảm giác điềm tĩnh, phân tích.

**Nội dung 2 thẻ (lấy từ tài liệu game):**

| | Map 1 — Đấu Trường FOMO | Map 2 — Pro Room |
|--|------------------------|------------------|
| Tagline | Thử thách tâm lý & đầu cơ ngắn hạn | Tư duy đầu tư giá trị & phân tích kỷ luật |
| Mục tiêu | Nhận diện & vượt qua bẫy tâm lý: bầy đàn, đu đỉnh, hoảng loạn cắt lỗ | Chuyển từ "lướt sóng" sang đầu tư bền vững, kỷ luật dài hạn |
| Cơ chế | Real-time, 7 round × 45s, tin đồn, quiz phản xạ, margin | Turn-based, 12 quý, macro, báo cáo tài chính |
| Tài sản | 1 mã penny `FOMO` | Growth · Value · Bond · Cash |
| Vốn ảo | 10.000.000 VND | 100.000.000 VND |
| Điều kiện thắng | NAV > 5.000.000 VND, khuyến khích +5–10% | Ổn định lợi nhuận, Max Drawdown < 15% |
| AI | — | CrediFin AI Advisor |
| Phần thưởng | Huy hiệu "Sống sót qua bão FOMO" + chìa khoá Map 2 | Báo cáo Sharpe / CAGR / Alpha + chứng nhận phong cách |

### 4.3. Luồng sau khi bấm vào Map

```
/simulation                       → Chọn Map (mục 4.1)
/simulation/map-1                 → Briefing Map 1  → [Bắt đầu Map 1] → Game → Debrief
/simulation/map-2                 → Briefing Map 2  → [Bắt đầu Map 2] → Game → Report
```
> Nếu route thực tế khác, Agent **map theo route hiện có** và chỉ bổ sung route con cần thiết; không phá route cũ.

**Màn Briefing (mỗi map):** hero nhỏ + 3 khối "Mục tiêu / Luật chơi / Cách tính điểm" + nút `Bắt đầu` (primary) và `Quay lại` (ghost). Có checkbox tuỳ chọn "Đã hiểu — không hiện lại".

### 4.4. Giao diện in-game (thiết kế lại đẹp hơn, giữ nguyên logic)

**Map 1 — FOMO Arena (real-time):**
```
┌ Header: Round 3/7 · ⏱ 00:32 (vòng tròn đếm ngược) · NAV · P&L% ┐
│ ┌────────── Chart giá FOMO (60%) ──────────┐ ┌ Newsfeed (40%)┐│
│ │                                          │ │ tin nóng      ││
│ └──────────────────────────────────────────┘ │ chat bot      ││
│ ┌ Order Ticket ────────────────────────────┐ └───────────────┘│
│ │ [BUY] [SELL] [HOLD]  Margin: [x2][x5]    │                  │
│ │ Quick: [25%] [50%] [100%]  Qty: [____]   │                  │
│ │ [ Đặt lệnh ]                             │                  │
│ └──────────────────────────────────────────┘                  │
└ Timeline pha: News&Trap → Trading → Quiz/Trap → P&L Update ───┘
```
- Thanh **timeline 4 pha** (0–10s / 10–30s / 30–40s / 40–45s) tô màu theo pha hiện tại.
- Popup bẫy/Quiz: modal giữa màn hình, đếm ngược 10s, 2 đáp án dạng card lớn (không dùng radio thô).
- Nút Margin bị `disabled` trước Round 3 (kèm tooltip).
- Màn **Debrief:** kết quả `SỐNG SÓT` (xanh) / `CHÁY TÀI KHOẢN` (đỏ), biểu đồ NAV chồng mốc mua/bán, thẻ **FOMO Score** và **Discipline Score** (gauge 0–100), hộp "Sai lầm theo Round", CTA `Tiến vào Map 2: Học cách đầu tư bài bản`.

**Map 2 — Pro Room (turn-based):**
```
┌ Header: Quý 5/12 · Giai đoạn "Đình lạm" · NAV · Drawdown ┐
│ ┌ Macro (Lãi suất/Lạm phát/GDP) ┐ ┌ AI Advisor (chat, ≤80 từ)┐│
│ ┌ Bảng tài sản: Growth/Value/Bond/Cash + P/E, P/B, Nợ ┐      │
│ ┌ Slider phân bổ % (tổng = 100%) + donut chart ┐             │
│ └ [Xác Nhận & Chốt Quý] (primary, lớn, góc dưới phải)         │
└──────────────────────────────────────────────────────────────┘
```
- Slider phân bổ có validate tổng 100%; nút `Chốt Quý` disabled đến khi hợp lệ.
- Màn **Report:** CAGR, Alpha vs VN-Index, Max Drawdown, Sharpe (4 stat card) + biểu đồ so sánh + nhận xét AI + huy hiệu phong cách.

**Trạng thái dùng chung:** loading (skeleton), empty ("Chưa có lệnh nào"), error (banner đỏ nhạt + `Thử lại`). Giữ hiển thị số tiền dạng `100.000.000 ₫` (định dạng `vi-VN`) hoặc `$` tuỳ cấu hình hiện tại.

---

## 5. ÁP DỤNG THEME SÁNG CHO CÁC TRANG CÒN LẠI

| Trang | Việc cần làm |
|-------|--------------|
| **Dashboard** | Card trắng, XP/Portfolio/Community/Membership dạng lưới 2–3 cột; thanh chào "Welcome back" nền `--grad-hero`; giữ "Server Authority Notice" dạng info banner xanh nhạt |
| **Courses** | Empty state minh hoạ + chip filter (All/Beginner/Intermediate/Advanced) kiểu pill; search input bo tròn |
| **Portfolio** | 4 stat card đầu trang, thanh Cash/Equities gradient, bảng milestone zebra nhạt, PnL dương xanh / âm đỏ |
| **Community** | Form đăng bài trong card; nút Like/Comment/Flag là icon-button nhất quán; `Remove` = `btn-danger` nhỏ |
| **Subscription** | Giữ badge `SOON`, có thể tạm trỏ về trang "Coming soon" đẹp |

---

## 6. CẤU TRÚC MÃ NGUỒN ĐỀ XUẤT

```
src/
  styles/
    tokens.css            # biến màu, radius, shadow (mục 1.1)
    globals.css
  components/
    ui/        Button, Badge, Card, Input, Select, Modal, Tooltip, Skeleton
    layout/    Navbar, UserMenu, Footer, Section, Container
    home/      Hero, AboutSection, StatsGrid, FeatureCarousel,
               MapShowcase, HowItWorks, CommunityPreview, CtaBand
    simulation/ MapCard, MapBriefing, PhaseTimeline, OrderTicket,
               QuizModal, DebriefPanel, AllocationSlider
  pages/
    Home, Simulation (map picker), SimulationMap1, SimulationMap2, ...
```

- Ưu tiên tái sử dụng framework/UI lib **đang dùng trong repo** (không thêm thư viện lớn nếu không cần). Icon: `lucide-react` (đã có).
- Nếu dùng Tailwind: ánh xạ token ở mục 1.1 vào `tailwind.config` (`theme.extend.colors`).

---

## 7. ACCEPTANCE CRITERIA (Agent tự kiểm tra trước khi báo hoàn thành)

- [ ] Toàn site dùng theme sáng; không còn nền `#0B1120`/dark trên các trang chính.
- [ ] Home có đủ S1–S10, đúng thứ tự, gradient heading, carousel hoạt động (mũi tên + chấm + swipe).
- [ ] Không còn nhãn "PLANNED (MVP)" / "Deferred for MVP" hiển thị cho người dùng cuối.
- [ ] `/simulation` hiển thị **2 MapCard** (Map 1, Map 2) đúng nội dung mục 4.2; Map 2 khoá/mở theo dữ liệu server.
- [ ] Click MapCard → vào Briefing → Game; nút `Quay lại` hoạt động.
- [ ] Toàn bộ button dùng hệ thống ở mục 1.3; `<select>` / `<input>` đã được style lại.
- [ ] Navbar một hàng ở ≥1024px; avatar dropdown có Đăng xuất.
- [ ] Disclaimer "Simulation only · No real money" vẫn hiển thị ở Simulation, Portfolio, Dashboard, footer.
- [ ] Responsive 360 / 768 / 1024 / 1440px, không cuộn ngang.
- [ ] Contrast AA, focus ring thấy rõ, điều hướng bàn phím được, có `alt` cho ảnh.
- [ ] Không thay đổi hành vi API/auth/tính toán; không hard-code số dư/kết quả ở client.
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 90 (desktop).

---

## 8. THỨ TỰ THỰC HIỆN GỢI Ý CHO AGENT

1. Tạo `tokens.css` + bộ `ui/` (Button, Badge, Card, Input, Modal).
2. Làm lại `Navbar` + `Footer`.
3. Dựng Home theo S1 → S10.
4. Dựng trang `/simulation` (MapCard ×2) + Briefing 2 map.
5. Thiết kế lại giao diện in-game Map 1 / Map 2 (không đổi logic).
6. Áp theme sáng cho Dashboard, Courses, Portfolio, Community.
7. Chạy checklist mục 7, chụp ảnh màn hình từng trang để đối chiếu.

**Lưu ý cho Agent:** Nếu gặp xung đột giữa file này và code hiện có về logic nghiệp vụ, **ưu tiên logic hiện có**; chỉ áp dụng phần thiết kế giao diện. Nếu thiếu ảnh/illustration, dùng SVG placeholder cùng bảng màu ở mục 1.1 và ghi TODO để thay ảnh thật.
