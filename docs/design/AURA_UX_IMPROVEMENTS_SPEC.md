# AURA CAPITAL — UX / PRODUCT IMPROVEMENTS SPEC (phần bổ sung)

> **Đối tượng đọc:** AI Agent thực thi front-end (và back-end tối thiểu cho Courses).
> **Đi kèm:** `AURA_UI_REDESIGN_SPEC.md` (Home, Simulation, Design System). File này **kế thừa** design tokens, hệ thống Button và component ở file đó — **không định nghĩa lại**.
> **Nguồn nội dung Courses:** `/mnt/user-data/uploads/kiến_thức_courses.docx` (3 chặng, 9 trạm, mỗi trạm có mini-quiz). Đây là **source of truth**; không tự bịa thêm kiến thức tài chính.
> **Nguyên tắc vàng (giữ nguyên):** chỉ thay đổi UI/UX + nội dung. **Không** phá logic server-authoritative (XP, số dư, quyền truy cập, chấm quiz đều do server quyết định). Nếu code hiện có xung đột với file này về logic nghiệp vụ → ưu tiên code hiện có, ghi chú lại.

---

## 0. BACKLOG THEO ƯU TIÊN

| ID | Hạng mục | Ưu tiên | Mục |
|----|----------|---------|-----|
| B01 | Sửa lỗi hiển thị Dashboard (markdown thô, khoảng trống, chip xuống dòng) | **P0** | 1.1 |
| B02 | Định dạng tiền tệ / số thống nhất (VND, `vi-VN`) | **P0** | 1.2 |
| B03 | Dọn dữ liệu demo lộ ra ngoài (Learner Tour, `@aura.test`) | **P0** | 1.3 |
| B04 | Style lại nút/form trong Simulation cockpit, ẩn thông tin kỹ thuật thô | **P0** | 1.4 |
| B05 | Nút Đăng nhập / Đăng ký trên Navbar + Hero + sticky mobile | **P0** | 2 |
| B06 | **Module Courses** với 9 trạm, quiz, XP, tiến độ | **P0** | 3 |
| B07 | Onboarding 3 bước + checklist Dashboard | P1 | 4 |
| B08 | Gamification: XP, level, streak, badge | P1 | 5 |
| B09 | Viết lại copy hướng học viên (bỏ thuật ngữ dev) | P1 | 6 |
| B10 | Trang pháp lý + FAQ + Liên hệ + 404/500 | P1 | 7 |
| B11 | Profile / Settings | P2 | 8 |
| B12 | i18n VI/EN + toggle | P2 | 9 |
| B13 | SEO, Analytics, Accessibility, Performance | P2 | 10 |

---

## 1. SỬA LỖI & DỌN DẸP (P0)

### 1.1. Dashboard (B01)
- **Bài đăng Community hiện `# Market Volatility Analysis`**: dữ liệu title đang bị gộp ký tự Markdown. Khi render preview, **strip Markdown** (`#`, `*`, `` ` ``, `>`) hoặc render qua parser an toàn. Không hiển thị ký tự thô.
- **Card "Academy Learning"** có khoảng trống lớn giữa XP và "Available Curricula": bỏ khoảng trống, dùng layout dọc `gap: 16px`. Khi có khoá học → hiển thị **khoá đang học dở** (progress bar + nút `Tiếp tục học`); khi chưa → CTA `Bắt đầu Chặng 1`.
- **Header thẻ** (`Simulation Portfolio [ACTIVE] Open Desk →`, `Community [3 RECENT] Join Forum →`) đang xuống dòng lộn xộn. Quy tắc mới: **dòng 1 = tiêu đề + badge (nowrap)**, link `btn-ghost` đặt **góc dưới bên phải card**.
- Tất cả card cùng hàng phải **bằng chiều cao** (`display:grid; align-items:stretch`).
- Đổi `Membership Plan [NONE]` → hiển thị `Free Explorer` rõ ràng; nút `Upgrade to Premium` giữ `btn-primary`, nhưng nếu Subscription đang `SOON` thì đổi thành `Sắp ra mắt` (disabled) + tooltip.

### 1.2. Định dạng số & tiền tệ (B02)
Tạo **một** helper dùng toàn site, cấm format thủ công rải rác:

```ts
// src/lib/format.ts
export const formatVND = (n: number, opts: { compact?: boolean } = {}) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND",
    maximumFractionDigits: 0,
    notation: opts.compact ? "compact" : "standard",
  }).format(n);                         // 10000000 -> "10.000.000 ₫"

export const formatPercent = (n: number, digits = 2) =>
  `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;

export const pnlClass = (n: number) =>
  n > 0 ? "text-green" : n < 0 ? "text-red" : "text-neutral";

export const formatDateVN = (d: string | Date) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
```

- Thay toàn bộ `$100000.0000` bằng `formatVND`. **Đơn vị chuẩn = VND** (khớp tài liệu game: Map 1 = 10.000.000 ₫, Map 2 = 100.000.000 ₫). Nếu backend đang trả USD/số thập phân dài → chỉ đổi cách **hiển thị**, không đổi giá trị lưu.
- Số liệu dùng `font-variant-numeric: tabular-nums`, căn phải trong bảng.
- Lãi = xanh lá, lỗ = đỏ, kèm ký hiệu `+/−` (không chỉ dựa vào màu — accessibility).

### 1.3. Dữ liệu demo (B03)
- Không hiển thị email `alex.demo2026@aura.test` trên navbar: dùng avatar + tên hiển thị (`display_name`), email chỉ nằm trong dropdown, rút gọn.
- Bài đăng "Learner Tour" → chỉ là dữ liệu seed cho môi trường dev. Với môi trường production: seed **6–8 bài mẫu chất lượng** (tên hiển thị tự nhiên, nội dung liên quan 9 trạm học) hoặc hiển thị empty state đẹp. Đặt seed sau flag `SEED_DEMO_DATA=true`, mặc định **false** ở production.
- Ẩn `Session ID`, `Awaiting Snapshot`, `Cycle` thô khỏi người dùng cuối (chuyển vào tooltip "Thông tin kỹ thuật" hoặc chỉ hiện khi `?debug=1`).

### 1.4. Simulation cockpit (B04) — áp dụng khi hiển thị màn in-game
- Nhóm `Complete / Cancel / Reset / New` → gộp thành **menu "⋯ Phiên chơi"** (dropdown): `Hoàn thành` (primary trong menu), `Chơi lại`, `Huỷ phiên` (danger, có modal xác nhận). Không để 4 nút nhỏ nền trắng cạnh nhau.
- `<select>` chọn mã và `<input type="number">` số lượng: dùng component `Select`/`NumberInput` đã style (cao 44px, viền `--border`, focus ring). Thêm stepper `− +` và nút nhanh `25% · 50% · 100%` (khớp "Quick Buy" trong tài liệu Map 1).
- Nút `Place BUY MARKET Order` → `btn-buy` full-width, đổi màu theo Buy/Sell; disabled khi giá chưa có, kèm helper text "Đang chờ giá thị trường…".
- Toggle Buy/Sell dạng segmented control; Market/Limit cũng segmented control.
- Trạng thái chờ giá → **skeleton shimmer** thay cho chữ `Awaiting Snapshot`.

---

## 2. NÚT ĐĂNG NHẬP / ĐĂNG KÝ (B05)

Hiện `Sign In` / `Create Account` chỉ ở footer. Thay đổi:

**2.1. Navbar (chưa đăng nhập)**
```
[A Aura Capital]  Home  Dashboard  Courses  Simulation  Portfolio  Community  Subscription(SOON)     [VI|EN] [Đăng nhập] [Bắt đầu miễn phí ▶]
```
- `Đăng nhập` = `btn-ghost`; `Bắt đầu miễn phí` = `btn-gradient` (không dùng "Create Account").
- Đã đăng nhập: `[🔍] [Avatar ▾]` (dropdown: Hồ sơ, Cài đặt, Đăng xuất).
- Item cần đăng nhập (Dashboard, Portfolio…) khi khách bấm → chuyển tới `/login?redirect=<đường dẫn cũ>`, đăng nhập xong quay lại đúng trang.

**2.2. Lặp CTA (chỉ khi chưa đăng nhập)**
1. Hero (`btn-gradient`)
2. Sau section "Tính năng"
3. CTA band cuối trang
4. **Sticky bottom bar trên mobile** (<768px): `Bắt đầu miễn phí` full-width, ẩn khi form đăng ký đang hiển thị, có nút đóng (nhớ lựa chọn trong `sessionStorage`).

**2.3. Trang `/register` và `/login`** — layout 2 cột:
```
┌───────────────────────────┬──────────────────────────────┐
│ FORM                      │ Nền gradient sáng            │
│ Họ tên / Email / Mật khẩu │ Lợi ích: ✔ Vốn ảo 100 triệu  │
│ (thanh độ mạnh mật khẩu)  │ ✔ 2 Map mô phỏng ✔ AI Advisor│
│ ☐ Đồng ý Điều khoản       │ ✔ 9 trạm học có quiz         │
│ [Tạo tài khoản]           │ (illustration)               │
│ ─── hoặc ───              │                              │
│ [Tiếp tục với Google]     │                              │
│ Đã có tài khoản? Đăng nhập│                              │
└───────────────────────────┴──────────────────────────────┘
```
- Validate inline (email hợp lệ, mật khẩu ≥ 8 ký tự), hiện/ẩn mật khẩu, thông báo lỗi tiếng Việt cụ thể.
- Google login: **chỉ làm nếu backend đã hỗ trợ**; nếu chưa → ẩn nút, để TODO.
- Sau đăng ký thành công → `/onboarding` (mục 4), **không** vào Dashboard trống.
- Không thay đổi cơ chế hash/refresh token hiện có.

---

## 3. MODULE COURSES (B06) — 3 CHẶNG · 9 TRẠM

Trang `/courses` hiện trống ("No Courses Found"). Cần: seed nội dung từ file `kiến_thức_courses.docx` và dựng trải nghiệm học dạng **lộ trình có trạm** (gợi liên tưởng "bản đồ" như Simulation).

### 3.1. Cấu trúc thông tin

```
/courses                       Danh sách + lộ trình 3 chặng
/courses/[courseSlug]          Chi tiết lộ trình (9 trạm dạng đường đi)
/courses/[courseSlug]/[stationSlug]   Trình học 1 trạm (bài đọc → quiz → hoàn thành)
```

- Hiện tại chỉ **1 khoá** hợp nhất: **"Nhập môn Đầu tư Chứng khoán Việt Nam"** gồm 3 chặng / 9 trạm. Cấu trúc dữ liệu vẫn phải hỗ trợ thêm khoá sau này.
- Filter `All / Beginner / Intermediate / Advanced` và ô search giữ nguyên; gán level: Chặng 1 = Beginner, Chặng 2 = Intermediate, Chặng 3 = Intermediate.
- Có thể hiển thị **3 thẻ khoá theo chặng** ở `/courses` (mỗi chặng 1 thẻ, 3 trạm) để trang không trống và người học thấy rõ lộ trình.

### 3.2. Data model (TypeScript — điều chỉnh theo schema/ORM hiện có)

```ts
type Level = "beginner" | "intermediate" | "advanced";

interface Course {
  id: string; slug: string; title: string; summary: string;
  level: Level; coverImage?: string; estimatedMinutes: number;
  stages: Stage[];                    // chặng
  status: "published" | "draft";
}
interface Stage {                     // "Chặng"
  id: string; order: number; title: string; goal: string;
  stations: Station[];                // "Trạm"
  badge: { id: string; name: string; icon: string };
}
interface Station {
  id: string; slug: string; order: number; title: string;
  hook: string;                       // câu hỏi mở đầu 1 dòng
  sections: LessonSection[];          // nội dung
  quiz: Quiz;
  xpReward: number;                   // gợi ý 50
  estimatedMinutes: number;           // gợi ý 8–12
  relatedActions?: { label: string; href: string }[]; // liên kết sang Simulation
}
interface LessonSection {
  id: string;
  kind: "concept" | "case" | "compare" | "formula" | "warning" | "summary";
  title: string;
  contentMd: string;                  // Markdown + KaTeX ($...$ / $$...$$)
}
interface Quiz {
  id: string; passScore: number;      // 1 câu: đúng = pass
  questions: {
    id: string; prompt: string;
    options: { id: "A" | "B" | "C"; text: string }[];
    correctOptionId: "A" | "B" | "C"; // CHỈ nằm ở server, không gửi xuống client
    explanation: string;
  }[];
}
interface UserProgress {
  userId: string; stationId: string;
  status: "locked" | "available" | "in_progress" | "completed";
  bestScore: number; attempts: number; completedAt?: string;
}
```

**Bảo mật/chuẩn server-authoritative:**
- API trả đề **không kèm** `correctOptionId`. Client gửi `POST /api/quiz/:id/submit {answers}`; server chấm, trả `{correct, explanation, xpAwarded, stationCompleted}`.
- XP cộng **idempotent** (mỗi trạm chỉ cộng lần đầu hoàn thành; làm lại không cộng lại) — khớp mô tả "idempotent XP reward tracking" ở trang Home.
- Trạng thái `locked/available` do server tính (trạm n mở khi hoàn thành trạm n−1).

### 3.3. Giao diện

**a) `/courses` — Danh sách**
- Hero nhỏ: tiêu đề "Học viện Aura" + mô tả + thanh tiến độ tổng (`3/9 trạm · 150 XP`).
- Card khoá học: cover, level chip, số trạm, thời lượng, progress bar, CTA `Bắt đầu` / `Tiếp tục học` (`btn-primary`).
- Empty state (khi search không ra): minh hoạ + `Xoá bộ lọc`.

**b) `/courses/[slug]` — Lộ trình dạng đường đi (Roadmap)**
```
CHẶNG 1 · XOÁ MÙ & NHẬP MÔN            ●───●───●     (3 trạm)
   Trạm 1 Bản chất cổ phiếu  ✔ Hoàn thành
   Trạm 2 Bảng điện & khớp lệnh ▶ Đang học
   Trạm 3 Các loại lệnh & T+2.5 🔒 Khoá
CHẶNG 2 · ĐỌC VỊ DOANH NGHIỆP           ●───●───●
CHẶNG 3 · NHỊP ĐẬP THỊ TRƯỜNG           ●───●───●
```
- Mỗi chặng là một section, nền xen kẽ; đường nối gradient giữa các trạm; node có 4 trạng thái (locked xám, available xanh viền, in_progress xanh đặc, completed xanh lá + dấu ✓).
- Cuối mỗi chặng: **huy hiệu** (mờ khi chưa đạt, sáng khi đạt).
- Cột phải (desktop): tóm tắt tiến độ, XP, huy hiệu, nút `Tiếp tục học`.

**c) `/courses/[slug]/[station]` — Trình học 1 trạm**
```
┌ Breadcrumb: Chặng 1 › Trạm 2 ─────────── Tiến độ ●●○ ┐
│  H1: Tên trạm                                        │
│  [Bài đọc]  →  [Mini-Quiz]  →  [Hoàn thành]          │  ← stepper 3 bước
│  ┌ Nội dung (max-width 760px) ┐  ┌ Mục lục (sticky) ┐│
│  │ Section: concept/case/...  │  │ 1. Khái niệm     ││
│  └────────────────────────────┘  │ 2. Tình huống    ││
│                                  └──────────────────┘│
│  [← Trạm trước]                    [Làm Mini-Quiz →] │
└──────────────────────────────────────────────────────┘
```
- Mỗi `LessonSection.kind` có style riêng: `case` = hộp xanh nhạt ("Tình huống thực chiến"), `warning` = hộp amber ("Cạm bẫy"), `compare` = bảng, `formula` = khung công thức (KaTeX), `summary` = hộp xanh lá.
- Render công thức bằng **KaTeX** (nguồn docx có LaTeX như `$\text{P/E}=\frac{Price}{EPS}$`).
- Ước lượng thời gian đọc, nút `Đánh dấu đã đọc` không cần — hệ thống tự ghi nhận khi cuộn hết + bấm `Làm Mini-Quiz`.

**d) Mini-Quiz**
- Mỗi lựa chọn là **card lớn** (không dùng radio thô), chọn xong bấm `Kiểm tra`.
- Đúng: hiệu ứng xanh lá + giải thích + `+XP` (animation nhẹ) + `Hoàn thành trạm`. Sai: viền đỏ nhạt + giải thích + `Học lại nội dung` (ghost) và `Thử lại` (primary). Cho thử lại không giới hạn, chỉ lần đầu đúng mới cộng XP.
- Phím tắt: `A/B/C`, `Enter`.

**e) Màn hoàn thành trạm / chặng**
- Trạm: confetti nhẹ, `+50 XP`, gợi ý bước kế: `Sang Trạm n+1`.
- Hoàn thành chặng: nhận huy hiệu chặng + CTA liên kết game (xem 3.5).

### 3.4. Nội dung seed (rút gọn có cấu trúc — nội dung đầy đủ import từ docx)

> **Cách import:** chuyển docx → Markdown (`pandoc "kiến_thức_courses.docx" -t gfm --wrap=none -o courses.md`), tách theo tiêu đề `CHẶNG` / `TRẠM`, đưa từng đoạn vào `sections[].contentMd`. Giữ nguyên LaTeX, bảng, in đậm. **Không cắt bớt số liệu, ví dụ, công thức.** Mini-quiz lấy đúng nguyên văn bên dưới.

```jsonc
{
  "course": {
    "slug": "nhap-mon-dau-tu-chung-khoan-vn",
    "title": "Nhập môn Đầu tư Chứng khoán Việt Nam",
    "summary": "9 trạm giúp bạn đi từ người mới (F0) đến biết đọc bảng điện, báo cáo tài chính, biểu đồ nến và tác động của lãi suất.",
    "level": "beginner",
    "stages": [
      {
        "order": 1,
        "title": "XOÁ MÙ & NHẬP MÔN THỊ TRƯỜNG",
        "goal": "Hiểu bản chất sở hữu cổ phiếu, đọc bảng điện, biết các loại lệnh và chu kỳ T+2.5.",
        "badge": "Người mới nhập cuộc",
        "stations": [
          { "order": 1, "slug": "ban-chat-co-phieu",
            "title": "Bản chất cổ phiếu — Mua cổ phiếu thực sự là mua gì?",
            "keyPoints": ["Cổ đông = đồng sở hữu doanh nghiệp", "2 nguồn lợi nhuận: chênh lệch giá & cổ tức", "Cổ phiếu (chủ) vs Trái phiếu (chủ nợ)"],
            "case": "Chuỗi cà phê 100 cửa hàng định giá 100 tỷ, 10 triệu cổ phần; mua 1.000 cổ phần = 0,01%",
            "quiz": { "q": "Bạn mua 5.000 cổ phiếu FRT; lợi nhuận công ty tăng gấp đôi. Bạn được hưởng quyền lợi gì?",
              "options": { "A": "Được trả lãi suất cố định hàng tháng như gửi tiết kiệm",
                           "B": "Giá trị phần vốn tăng theo giá thị trường và có quyền nhận cổ tức nếu đại hội cổ đông thông qua",
                           "C": "Trở thành giám đốc điều hành một chi nhánh nhà thuốc" },
              "correct": "B" } },
          { "order": 2, "slug": "bang-dien-va-khop-lenh",
            "title": "Giải mã bảng điện tử & cơ chế khớp lệnh Việt Nam",
            "keyPoints": ["Ưu tiên giá rồi ưu tiên thời gian", "Màu: Vàng (tham chiếu), Tím (trần), Xanh lơ (sàn), Xanh lá (tăng), Đỏ (giảm)", "Biên độ: HOSE ±7%, HNX ±10%, UPCoM ±15%", "Trắng bên bán / trắng bên mua", "3 vùng sổ lệnh: Dư mua – Khớp lệnh – Dư bán"],
            "quiz": { "q": "VNM trên HOSE có giá tham chiếu 70.000 VND. Giá trần và sàn tối đa trong phiên là bao nhiêu?",
              "options": { "A": "Trần 77.000 | Sàn 63.000", "B": "Trần 74.900 | Sàn 65.100", "C": "Trần 80.500 | Sàn 59.500" },
              "correct": "B", "explanation": "Biên độ HOSE ±7%: 70.000×1,07 = 74.900; 70.000×0,93 = 65.100." } },
          { "order": 3, "slug": "cac-loai-lenh-va-t2-5",
            "title": "Khí giới giao dịch — Các loại lệnh & chu kỳ T+2.5",
            "keyPoints": ["LO (giới hạn) vs MP/MTL/MAK (thị trường)", "ATO 09:00–09:15, ATC 14:30–14:45", "T+0 khớp lệnh → T+1 bù trừ → T+2 cổ phiếu về, bán được từ 13:00"],
            "relatedActions": [{ "label": "Thử đặt lệnh trong Map 1", "href": "/simulation" }],
            "quiz": { "q": "Bạn mua HPG sáng Thứ Năm (không nghỉ lễ). Sớm nhất khi nào bán được?",
              "options": { "A": "Chiều Thứ Sáu cùng tuần", "B": "Sáng Thứ Hai tuần kế tiếp", "C": "Chiều Thứ Hai tuần kế tiếp (sau 13:00)" },
              "correct": "C", "explanation": "Thứ Năm = T+0, Thứ Sáu = T+1, Thứ Hai = T+2; cổ phiếu về trước phiên chiều." } }
        ]
      },
      {
        "order": 2,
        "title": "ĐỌC VỊ DOANH NGHIỆP (PHÂN TÍCH CƠ BẢN)",
        "goal": "Đọc 3 bảng báo cáo tài chính, dùng P/E – P/B, hiểu cổ tức và GDKHQ.",
        "badge": "Thám tử báo cáo tài chính",
        "stations": [
          { "order": 4, "slug": "bao-cao-tai-chinh-bo-tui",
            "title": "Báo cáo tài chính bỏ túi — Giải phẫu sức khoẻ doanh nghiệp",
            "keyPoints": ["3 bảng: Cân đối kế toán / Kết quả kinh doanh / Lưu chuyển tiền tệ", "Lợi nhuận là ý kiến, tiền mặt là thực tế (CFO âm 3 năm)", "Tỷ lệ nợ vay tài chính = (Vay ngắn hạn + dài hạn) / Vốn chủ sở hữu; cảnh báo > 1,5–2,0 lần"],
            "quiz": { "q": "Doanh nghiệp thép X báo lãi quý 3 tăng 50%, nhưng Khoản phải thu tăng gấp 3 và CFO âm nặng. Kết luận?",
              "options": { "A": "Doanh nghiệp hoàn hảo, tiền sinh sôi mạnh", "B": "Bán được hàng nhưng chưa thu được tiền; chất lượng lợi nhuận thấp, tiềm ẩn nợ xấu", "C": "Doanh nghiệp đã trả hết nợ ngân hàng" },
              "correct": "B" } },
          { "order": 5, "slug": "dinh-gia-pe-pb",
            "title": "Bộ đôi định giá P/E & P/B — Đắt hay rẻ?",
            "keyPoints": ["Giá cổ phiếu cao ≠ đắt", "P/E = Giá / EPS; P/E 15 ≈ 15 năm hoàn vốn (giả định lợi nhuận không đổi)", "P/E < 10: món hời hoặc bẫy giá trị; P/E > 25: kỳ vọng tăng trưởng hoặc bị thổi phồng", "P/B hiệu quả với Ngân hàng, Chứng khoán, Thép, BĐS; P/B < 1 = giá dưới giá trị sổ sách"],
            "quiz": { "q": "MBB có BVPS 20.000 VND, giá thị trường 22.000 VND. P/B là bao nhiêu và ý nghĩa?",
              "options": { "A": "P/B = 0,9 — bán dưới giá trị thanh lý tài sản", "B": "P/B = 1,1 — trả cao hơn 10% so với giá trị tài sản ròng sổ sách", "C": "P/B = 2,2 — bong bóng đầu cơ nghiêm trọng" },
              "correct": "B", "explanation": "22.000 / 20.000 = 1,1." } },
          { "order": 6, "slug": "co-tuc-va-gdkhq",
            "title": "Cổ tức & bẫy Ngày giao dịch không hưởng quyền (GDKHQ)",
            "keyPoints": ["Cổ tức tiền mặt (chịu thuế TNCN 5%) vs cổ tức bằng cổ phiếu", "Ngày GDKHQ: giá tham chiếu mới = giá đóng cửa hôm trước − cổ tức tiền mặt", "Ví dụ: 30.000 → 27.000 + nhận 3.000 tiền mặt", "Ý nghĩa: tín hiệu dòng tiền khoẻ, tái đầu tư lãi kép"],
            "quiz": { "q": "Bạn giữ 10.000 cổ phiếu VEA giá 40.000 VND. Mai là GDKHQ, cổ tức tiền mặt 4.000 VND/cp. Giá tham chiếu sáng mai?",
              "options": { "A": "44.000 VND", "B": "40.000 VND", "C": "36.000 VND" },
              "correct": "C", "explanation": "Giá tham chiếu bị điều chỉnh giảm đúng bằng cổ tức: 40.000 − 4.000 = 36.000." } }
        ]
      },
      {
        "order": 3,
        "title": "NHỊP ĐẬP THỊ TRƯỜNG (KỸ THUẬT & VĨ MÔ)",
        "goal": "Đọc biểu đồ nến, vùng hỗ trợ/kháng cự và tác động của lãi suất.",
        "badge": "Người đọc vị thị trường",
        "stations": [
          { "order": 7, "slug": "bieu-do-nen-nhat",
            "title": "Biểu đồ nến Nhật & bản đồ tâm lý phe Mua – phe Bán",
            "keyPoints": ["Thân nến dài = lực một phe áp đảo", "Bóng dưới dài (pinbar) = từ chối giá giảm", "Bóng trên dài (shooting star) = từ chối giá cao", "Doji = lưỡng lự", "3 xu hướng: Uptrend (HH/HL), Downtrend (LH/LL), Sideway"],
            "quiz": { "q": "SSI bị bán mạnh có lúc chạm sàn, nhưng ATC có lực mua lớn đẩy giá đóng cửa xanh nhẹ; nến thân nhỏ, râu dưới rất dài. Biểu thị điều gì?",
              "options": { "A": "Phe bán thắng hoàn toàn, thị trường sắp sụp đổ", "B": "Lực cầu bắt đáy hấp thụ hết lực bán, tín hiệu đảo chiều hỗ trợ", "C": "Hệ thống sàn bị lỗi dữ liệu" },
              "correct": "B" } },
          { "order": 8, "slug": "ho-tro-khang-cu",
            "title": "Ngưỡng hỗ trợ & kháng cự — Vùng chiến sự của dòng tiền",
            "keyPoints": ["Hỗ trợ/kháng cự là VÙNG giá tâm lý, không phải 1 con số", "Role Reversal: kháng cự bị phá (volume lớn) → thành hỗ trợ mới; hỗ trợ bị gãy → thành kháng cự"],
            "quiz": { "q": "TCB 3 lần chạm 25.000 rồi quay đầu; lần này bứt phá lên 27.000 với khối lượng kỷ lục. Khi điều chỉnh về 25.000, vùng này đóng vai trò gì?",
              "options": { "A": "Vẫn là kháng cự nguy hiểm, tuyệt đối không động vào", "B": "Đã chuyển thành vùng hỗ trợ mới tiềm năng do hoán đổi vai trò", "C": "Vùng giá phi lý do lỗi thuật toán bảng điện" },
              "correct": "B" } },
          { "order": 9, "slug": "vi-mo-lai-suat",
            "title": "Vĩ mô thực chiến — Lãi suất là trọng lực của mọi loại tài sản",
            "keyPoints": ["Lãi suất điều hành của NHNN chi phối dòng tiền: tiết kiệm ⇄ chứng khoán ⇄ BĐS ⇄ vàng", "Tăng lãi suất → chi phí vốn tăng, tiết kiệm hấp dẫn hơn → áp lực lên giá tài sản; hạ lãi suất → dòng tiền rẻ tìm kênh sinh lời", "Lạm phát (CPI) cao → thắt chặt tiền tệ; USD/VND căng thẳng → khối ngoại bán ròng"],
            "relatedActions": [{ "label": "Xem tác động vĩ mô trong Map 2 (Pro Room)", "href": "/simulation" }],
            "quiz": { "q": "Lạm phát thấp, kinh tế suy giảm, NHNN cắt giảm lãi suất điều hành 4 đợt, lãi tiền gửi về 4%/năm. Tác động tới chứng khoán?",
              "options": { "A": "Lực cản tiêu cực, doanh nghiệp khủng hoảng thiếu vốn", "B": "Tích cực: chi phí vay của doanh nghiệp giảm, dòng tiền nhàn rỗi dịch chuyển từ tiết kiệm sang cổ phiếu", "C": "Không tác động vì chứng khoán độc lập với hệ thống ngân hàng" },
              "correct": "B" } }
        ]
      }
    ]
  }
}
```

**Ghi chú nội dung cần Agent xử lý / báo lại cho chủ dự án:**
1. **Trạm 9:** docx có câu *"Hãy nhìn chuỗi phản ứng dây chuyền khi NHNN quyết định TĂNG LÃI SUẤT:"* nhưng **sơ đồ chuỗi bị thiếu** (khoảng trống). Dựng thành component `FlowDiagram` (ví dụ: `NHNN tăng lãi suất → lãi tiết kiệm hấp dẫn hơn → dòng tiền rút khỏi chứng khoán/BĐS → chi phí vay doanh nghiệp tăng → lợi nhuận giảm → giá cổ phiếu chịu áp lực`), đánh dấu `TODO: chủ dự án xác nhận`.
2. **Trạm 8** có khoảng trống có thể là vị trí hình minh hoạ hỗ trợ/kháng cự → tạo **SVG minh hoạ đơn giản** (đường ngang vùng giá + nến), ghi `TODO: thay ảnh thật`.
3. Câu trích dẫn của Warren Buffett ở Trạm 9 là diễn giải; hiển thị dạng "theo tinh thần lời Warren Buffett" hoặc đánh dấu cần xác minh nguồn trước khi công bố.
4. Số liệu pháp lý (biên độ ±7/10/15%, ATO/ATC, thuế TNCN 5%, T+2.5) có thể thay đổi theo quy định → thêm dòng cuối mỗi trạm: *"Nội dung mang tính giáo dục, có thể thay đổi theo quy định hiện hành."*
5. Quiz hiện **1 câu/trạm**. Cấu trúc dữ liệu cho phép thêm câu; **không tự bịa** thêm câu hỏi — chỉ chừa chỗ mở rộng.

### 3.5. Liên kết Courses ↔ Simulation
| Khi nào | Hiển thị |
|---------|----------|
| Hoàn thành Trạm 3 (Các loại lệnh & T+2.5) | CTA `Thử ngay trong Map 1 — Đấu trường FOMO` |
| Hoàn thành Chặng 1 | Gợi ý chơi Map 1; badge "Người mới nhập cuộc" |
| Hoàn thành Trạm 9 / Chặng 3 | CTA `Vào Map 2 — Pro Room` (Map 2 vẫn khoá nếu chưa qua Map 1 theo logic game) |
| Ở màn Briefing Map 1/2 | Link "Ôn lại kiến thức liên quan" → các trạm tương ứng (Map 1: Trạm 2, 3, 7; Map 2: Trạm 4, 5, 9) |

Điều kiện mở khoá Map **không** thay đổi bởi Courses (giữ logic game: mở Map 2 khi vượt Map 1).

### 3.6. API đề xuất (điều chỉnh theo backend hiện có)
```
GET  /api/courses                         → danh sách + tiến độ user
GET  /api/courses/:slug                   → chặng/trạm + trạng thái locked/available/completed
GET  /api/stations/:slug                  → nội dung trạm (KHÔNG có đáp án)
POST /api/stations/:id/quiz/submit        → { answers } → { correct, explanation, xpAwarded, stationCompleted, nextStation }
POST /api/stations/:id/progress           → ghi nhận đã đọc (optional)
GET  /api/me/progress                     → tổng XP, level, badge, streak
```
Mọi số XP/tiến độ trả từ server; client chỉ hiển thị.

---

## 4. ONBOARDING & CHECKLIST (B07)

**4.1. `/onboarding` (3 bước, có thể bỏ qua, lưu server)**
1. *Mục tiêu:* `Học kiến thức` / `Thử giao dịch mô phỏng` / `Cả hai`.
2. *Trình độ:* `Chưa biết gì (F0)` / `Đã biết cơ bản` / `Đã từng giao dịch`.
3. *Gợi ý bắt đầu:* F0 → `Bắt đầu Trạm 1`; Đã biết cơ bản → `Bắt đầu Chặng 2`; Đã giao dịch → `Thử Map 1`. (Không khoá nội dung theo lựa chọn này, chỉ gợi ý.)

**4.2. Checklist "Bắt đầu" trên Dashboard** (tự tick từ dữ liệu server, ẩn khi hoàn tất 100%)
- [ ] Hoàn thành Trạm 1
- [ ] Hoàn thành Chặng 1
- [ ] Chơi Map 1
- [ ] Đăng bài đầu tiên trong Community
- [ ] Xem Portfolio của bạn

Kèm progress ring `2/5`. Mỗi mục là link tới nơi thực hiện.

**4.3. Empty state có hành động:** Portfolio trống → `Vào Simulation để bắt đầu`; Community trống → `Đăng bài đầu tiên`; Courses chưa học → `Bắt đầu Trạm 1`.

---

## 5. GAMIFICATION (B08)

| Yếu tố | Quy tắc đề xuất |
|--------|-----------------|
| XP trạm | +50 XP khi hoàn thành trạm lần đầu (idempotent) |
| XP chặng | +100 XP khi hoàn thành đủ 3 trạm của chặng |
| Level | `level = floor(sqrt(totalXP / 50)) + 1` (hiển thị tên: Tân binh, Nhà đầu tư tập sự, …) — **tính ở server** |
| Streak | Số ngày học liên tiếp (có hoàn thành ≥ 1 trạm hoặc quiz); hiện icon 🔥 trên navbar/Dashboard |
| Huy hiệu | 3 huy hiệu chặng (mục 3.4) + "Sống sót qua bão FOMO" (Map 1) + huy hiệu Map 2 |
| Bảng huy hiệu | Trang Profile hiển thị lưới huy hiệu; chưa đạt = mờ + điều kiện |
| Chia sẻ | Nút `Chia sẻ thành tích` tạo ảnh (canvas/SVG → PNG) có huy hiệu + tên; **không** kèm dữ liệu nhạy cảm |

UI: thanh XP trên Dashboard (`0 / 50 XP đến Level 2`), toast `+50 XP` khi nhận. Không hiển thị "0 XP" trơ trọi — dùng thanh tiến độ kèm gợi ý hành động.

---

## 6. VIẾT LẠI COPY (B09)

Nguyên tắc: **hướng lợi ích cho học viên**, câu ngắn, tiếng Việt tự nhiên, không thuật ngữ dev. Áp dụng cho Home, Dashboard, footer. Bảng thay thế bắt buộc:

| Vị trí | Hiện tại | Thay bằng |
|--------|----------|-----------|
| Home › Academy | "Interactive financial curriculum, progressive quizzes with server-side validation, flashcard decks, and idempotent XP reward tracking." | "Học từng bước qua 9 trạm có quiz. Làm đúng nhận XP và huy hiệu, theo dõi tiến độ mọi lúc." |
| Home › Simulation | "Server-authoritative simulated market orders, isolated learner trading sessions, deterministic execution matching…" | "Thực hành mua bán với vốn ảo trong 2 Map: rèn tâm lý ở Đấu trường FOMO, rèn tư duy ở Pro Room." |
| Home › Community | "Relational post interactions, moderated financial discussions…" | "Chia sẻ góc nhìn, đặt câu hỏi và học hỏi cùng những người mới như bạn." |
| Home › Membership | "Transparent membership tiers, fair API quotas, simulated entitlement resolution…" | "Bắt đầu miễn phí. Nâng cấp khi bạn cần thêm tính năng." |
| Home › Security | "Strict Argon2id password hashing, revocable refresh token rotation…" | "Tài khoản được bảo vệ theo chuẩn bảo mật cao. Dữ liệu của bạn luôn an toàn." |
| Home › Aura Intelligence | "Context-aware AI financial learning coach powered by isolated gateway adapters…" | "Cố vấn AI đồng hành cùng bạn: phân tích danh mục, giải thích vì sao thị trường biến động." |
| Dashboard › notice | "Server Authority Notice: All XP, simulation balances… are server-authoritative facts…" | "Điểm XP và số dư mô phỏng được hệ thống tính toán để đảm bảo công bằng cho mọi người chơi." |
| Badge | "PLANNED (MVP)" / "Deferred for MVP" | `Sắp ra mắt` hoặc ẩn |
| Footer | "BUILD V0.9.0-MVP" | Chỉ hiện khi `NODE_ENV !== "production"` |
| Empty | "No Courses Found — No published courses available yet." | "Khoá học đang được chuẩn bị. Bạn có thể thử Map 1 trong lúc chờ." + nút |

- **Giữ nguyên** (không diễn giải lại) các câu disclaimer pháp lý "Simulation only · No real money · Educational purposes"; chỉ dịch sang tiếng Việt khi bật VI.
- Thêm section Home **"Vì sao chọn Aura?"** (3 ý): *Học bằng trải nghiệm · Có AI Advisor · Môi trường không rủi ro*.

---

## 7. TRANG PHÁP LÝ, HỖ TRỢ, LỖI (B10)

Tạo route + layout đọc (max-width 760px, mục lục sticky). Nội dung placeholder rõ ràng, đánh dấu `TODO: pháp chế duyệt`:

```
/terms         Điều khoản sử dụng
/privacy       Chính sách bảo mật
/disclaimer    Tuyên bố miễn trừ (mô phỏng, không phải tư vấn đầu tư, không có giao dịch thật)
/faq           Câu hỏi thường gặp (accordion, ≥ 8 câu: XP là gì? Vốn ảo dùng thế nào? Vì sao Map 2 khoá? …)
/contact       Form liên hệ (họ tên, email, nội dung) + email hỗ trợ
/404           Trang không tìm thấy: minh hoạ + [Về trang chủ] + gợi ý link
/500           Lỗi hệ thống: [Thử lại] [Về trang chủ]
```
- Footer thêm cột **Hỗ trợ & Pháp lý** (Điều khoản, Bảo mật, Miễn trừ, FAQ, Liên hệ) + icon mạng xã hội (placeholder) + bản quyền.
- Checkbox đồng ý Điều khoản ở form đăng ký link tới `/terms`, `/privacy`.
- Banner đầu Simulation/Portfolio giữ nguyên, thêm link `Tuyên bố miễn trừ`.

---

## 8. PROFILE / SETTINGS (B11)

Route `/settings` (tab): **Hồ sơ** (tên hiển thị, avatar chữ cái/upload) · **Bảo mật** (đổi mật khẩu) · **Tuỳ chọn** (ngôn ngữ, giao diện sáng/tối, thông báo) · **Huy hiệu & tiến độ** (lưới huy hiệu, XP, streak).
- Toggle **Sáng/Tối** ở navbar (mặc định **Sáng**). Dark mode dùng lại biến CSS (định nghĩa bộ token tối song song, không hard-code màu).
- Nút `Xoá tài khoản` (danger, modal xác nhận) — chỉ hiển thị UI nếu backend hỗ trợ, nếu chưa thì ẩn.

---

## 9. ĐA NGÔN NGỮ VI / EN (B12)

- Mặc định **Tiếng Việt**. Toggle `VI | EN` trên navbar (đặt cạnh nút tìm kiếm / trước nút Đăng nhập).
- Dùng i18n lib có sẵn hoặc `i18next`/`next-intl` (theo stack hiện tại). Toàn bộ chuỗi UI tách ra `locales/vi.json`, `locales/en.json`; không hard-code trong component.
- **Nội dung khoá học chỉ có tiếng Việt** → khi ở EN, hiển thị nội dung VI kèm chip `Vietnamese content`. Không tự dịch nội dung tài chính.
- Ghi nhớ lựa chọn (`localStorage` + lưu vào hồ sơ nếu đã đăng nhập). Thẻ `<html lang>` cập nhật đúng.

```json
// locales/vi.json (mẫu)
{
  "nav.home": "Trang chủ", "nav.courses": "Khoá học", "nav.simulation": "Mô phỏng",
  "nav.portfolio": "Danh mục", "nav.community": "Cộng đồng",
  "cta.start": "Bắt đầu miễn phí", "cta.login": "Đăng nhập",
  "sim.disclaimer": "Chỉ mô phỏng · Không dùng tiền thật · Không thực hiện giao dịch môi giới"
}
```

---

## 10. SEO · ANALYTICS · ACCESSIBILITY · PERFORMANCE (B13)

**SEO/Chia sẻ:** `<title>` + meta description riêng từng trang; Open Graph (`og:title`, `og:description`, `og:image` 1200×630); favicon + `apple-touch-icon`; `sitemap.xml`, `robots.txt`; trang Courses/Station có thể render SSR nếu stack hỗ trợ.

**Analytics** (PostHog/GA4 — theo hạ tầng có sẵn; **có banner đồng ý cookie**, không thu PII):
```ts
track("signup_started"); track("signup_completed");
track("course_started",   { courseSlug });
track("station_completed",{ stationSlug, attempts });
track("quiz_submitted",   { stationSlug, correct });
track("map_started",      { map: "map1-fomo" | "map2-pro" });
track("map_completed",    { map, result });
track("map2_unlocked");
```
Phễu chính: **Đăng ký → Trạm 1 → Chặng 1 → Map 1 → Map 2**.

**Accessibility:** tương phản AA; mọi icon-button có `aria-label` (cờ report, like, comment…); điều hướng bàn phím đầy đủ + `:focus-visible`; quiz thao tác được bằng bàn phím; `alt` cho ảnh; không truyền đạt thông tin chỉ bằng màu (lãi/lỗ có dấu +/−); modal có focus trap + đóng bằng `Esc`; tôn trọng `prefers-reduced-motion`.

**Performance:** ảnh WebP/AVIF + `loading="lazy"` (trừ hero), font subset có tiếng Việt (`subset=vietnamese`), `font-display: swap`, code-split các trang game/quiz/chart, bundle KaTeX chỉ load ở trang học.

---

## 11. ACCEPTANCE CRITERIA

**Sửa lỗi (P0)**
- [ ] Không còn ký tự `#`/Markdown thô trong preview bài đăng; card Dashboard cao bằng nhau, không xuống dòng lộn xộn.
- [ ] Toàn bộ số tiền hiển thị qua `formatVND`; không còn `$100000.0000`.
- [ ] Không còn email `@aura.test` trên navbar; không có "Learner Tour" ở production.
- [ ] Session ID / "Awaiting Snapshot" không hiển thị cho người dùng cuối.
- [ ] Nút Đăng nhập / Bắt đầu miễn phí hiển thị trên navbar khi chưa đăng nhập; sticky CTA trên mobile; redirect sau login hoạt động.

**Courses**
- [ ] `/courses` hiển thị khoá "Nhập môn Đầu tư Chứng khoán Việt Nam" với đủ 3 chặng / 9 trạm.
- [ ] Nội dung 9 trạm import **đầy đủ** từ docx (công thức KaTeX hiển thị đúng, bảng đúng); 9 quiz đúng nguyên văn, đúng đáp án (Trạm 1: B · 2: B · 3: C · 4: B · 5: B · 6: C · 7: B · 8: B · 9: B).
- [ ] Payload đề quiz **không chứa** `correctOptionId`; chấm điểm ở server; XP idempotent.
- [ ] Trạm n+1 khoá đến khi hoàn thành trạm n; trạng thái 4 kiểu hiển thị đúng.
- [ ] Hoàn thành chặng → nhận huy hiệu; Dashboard hiển thị tiến độ/khoá đang học.
- [ ] Các mục "Ghi chú nội dung" (3.4) đã được xử lý hoặc đánh dấu TODO rõ ràng.
- [ ] Liên kết Courses ↔ Simulation (3.5) hoạt động; không thay đổi điều kiện mở khoá Map.

**Sản phẩm & pháp lý**
- [ ] Onboarding 3 bước + checklist Dashboard hoạt động, lưu server.
- [ ] Copy đã thay theo bảng mục 6; không còn "PLANNED (MVP)", "Deferred for MVP", "BUILD V0.9.0-MVP" ở production.
- [ ] Có `/terms`, `/privacy`, `/disclaimer`, `/faq`, `/contact`, 404, 500; footer có link.
- [ ] Toggle VI/EN hoạt động; mọi chuỗi UI nằm trong file locale.
- [ ] Settings có Hồ sơ / Bảo mật / Tuỳ chọn / Huy hiệu.

**Chất lượng**
- [ ] Responsive 360 / 768 / 1024 / 1440px; không cuộn ngang.
- [ ] Lighthouse desktop: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90.
- [ ] Không thay đổi hành vi auth, hash mật khẩu, tính toán số dư/PnL.

---

## 12. THỨ TỰ THỰC HIỆN GỢI Ý

1. **B01–B04:** sửa lỗi hiển thị, `format.ts`, dọn seed, chỉnh cockpit.
2. **B05:** Navbar CTA + trang `/login` `/register`.
3. **B06:** schema Courses → import 9 trạm từ docx → API chấm quiz → giao diện `/courses`, roadmap, trình học, quiz, hoàn thành.
4. **B08 + B07:** XP/level/streak/badge → onboarding + checklist Dashboard.
5. **B09 + B10:** viết lại copy, trang pháp lý/FAQ/404/500.
6. **B11 + B12:** Settings, i18n.
7. **B13:** SEO, analytics, a11y, performance; chạy checklist mục 11 và chụp ảnh từng trang đối chiếu.

**Lưu ý cho Agent:** khi thiếu ảnh/illustration → dùng SVG placeholder theo bảng màu ở `AURA_UI_REDESIGN_SPEC.md` mục 1.1 và ghi `TODO`. Khi phát hiện mâu thuẫn giữa tài liệu game, tài liệu Courses và code hiện có → **không tự quyết định**, ghi vào `docs/OPEN_QUESTIONS.md` để chủ dự án xác nhận.
