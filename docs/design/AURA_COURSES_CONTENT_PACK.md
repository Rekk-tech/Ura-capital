# AURA CAPITAL — COURSES CONTENT PACK (Catalog + Flashcards + Quiz)

> **Đối tượng đọc:** AI Agent triển khai module Courses.
> **Kế thừa:** `AURA_UX_IMPROVEMENTS_SPEC.md` §3 (data model, API, UI lộ trình 9 trạm từ `kiến_thức_courses.docx`). File này **mở rộng thêm** một lớp nội dung mới: các **khoá học độc lập (standalone courses)** theo đúng giao diện Figma vừa gửi (`Aura Academy Courses` — thẻ Stage 1-3 + thẻ khoá học rời `Stock Investing 101`, `Options & Derivatives Trading`; màn học bài có XP, Flashcards, Mark Complete).
> **Ngôn ngữ:** nội dung trong file này viết **tiếng Anh**, đúng với Figma đính kèm. Xem mục 0.3 về cách xử lý song song với nội dung tiếng Việt (9 trạm) đã có.

---

## 0. ĐỐI CHIẾU VỚI CẤU TRÚC ĐÃ CÓ (bắt buộc đọc trước khi code)

### 0.1. Hai lớp nội dung Courses cần phân biệt rõ

| Lớp | Nguồn | Ngôn ngữ | Vai trò |
|---|---|---|---|
| **A. Lộ trình chính (Roadmap)** | `kiến_thức_courses.docx` → đã đặc tả ở `AURA_UX_IMPROVEMENTS_SPEC.md` §3 | Tiếng Việt | 1 khoá duy nhất "Nhập môn Đầu tư Chứng khoán Việt Nam", 3 Chặng / 9 Trạm, có khoá/mở tuần tự, gắn liền Map 1/Map 2 |
| **B. Khoá học độc lập (Catalog)** | File này, theo Figma `Aura Academy Courses` | Tiếng Anh (có thể dịch sau) | Nhiều khoá nhỏ, **không bắt buộc theo thứ tự**, học tự do theo sở thích/trình độ, có flashcard riêng từng khoá |

**🟡 Phát hiện cần xác nhận:** Figma hiển thị 3 thẻ **Stage** (`Stage 1 · Stations 1-3`, `Stage 2 · Stations 4-6`, `Stage 3 · Stations 7-9`) ngay phía trên các thẻ khoá học rời — đây chính là Lộ trình A, nhưng **mô tả nội dung từng Stage trong Figma không khớp hoàn toàn** với 9 Trạm gốc:

| Stage trong Figma | Mô tả Figma | Trạm gốc tương ứng (docx) | Khớp? |
|---|---|---|---|
| Stage 1 (Trạm 1-3) | "Core financial literacy, personal cash flow budgeting, risk profiling, and inflation dynamics" | Trạm 1-3 gốc: Bản chất cổ phiếu, Bảng điện & khớp lệnh, Các loại lệnh & T+2.5 | ❌ Không khớp — Figma mô tả thiên về tài chính cá nhân/budgeting, gốc thiên về cơ chế thị trường |
| Stage 2 (Trạm 4-6) | "Equity valuation, technical indicators, order execution mechanics, volatility management in FOMO Arena" | Trạm 4-6 gốc: Báo cáo tài chính, P/E-P/B, Cổ tức & GDKHQ | ⚠️ Khớp một phần (equity valuation) nhưng thêm "technical indicators" vốn thuộc Trạm 7-8 gốc |
| Stage 3 (Trạm 7-9) | "Macroeconomic cycles, multi-asset portfolio hedging, risk-adjusted returns, and autonomous execution" | Trạm 7-9 gốc: Nến Nhật, Hỗ trợ/kháng cự, Vĩ mô & lãi suất | ⚠️ Khớp phần vĩ mô (Trạm 9) nhưng "multi-asset hedging/autonomous execution" chưa có trong nội dung gốc |

**Yêu cầu xử lý:** đây là mô tả tổng quan (summary blurb) của Stage, không nhất thiết phải liệt kê đúng từng trạm — **không tự sửa nội dung 9 Trạm gốc**. Agent dùng mô tả Figma làm **caption hiển thị ở trang danh sách** (card Stage), còn nội dung chi tiết bên trong mỗi Trạm **vẫn giữ nguyên 100% theo** `AURA_UX_IMPROVEMENTS_SPEC.md` §3.4. Nếu cần, viết lại caption Stage cho khớp nội dung thật thay vì để nguyên văn Figma — ghi `TODO: xác nhận lại caption 3 Stage với chủ dự án`.

### 0.2. Danh mục khoá học độc lập (Lớp B) — nội dung MỚI, file này cung cấp đầy đủ

| # | Khoá học | Level | Số Lesson | Khớp Figma? |
|---|---|---|---|---|
| B1 | **Stock Investing 101** | Beginner | 2 | ✅ Đúng tên, đúng số lesson, Lesson 1 đúng y nguyên nội dung ảnh 2 |
| B2 | **Personal Finance & Risk Profiling** | Beginner | 2 | 🟢 Thêm — lấp đúng mô tả "budgeting, risk profiling, inflation" của Stage 1 Figma |
| I1 | **Reading Financial Statements** | Intermediate | 2 | 🟢 Thêm |
| I2 | **Technical Analysis Essentials** | Intermediate | 2 | 🟢 Thêm — lấp đúng "technical indicators" của Stage 2 Figma |
| A1 | **Options & Derivatives Trading** | Advanced | 1 | ✅ Đúng tên, đúng số lesson |
| A2 | **Macro Cycles & Portfolio Construction** | Advanced | 2 | 🟢 Thêm — lấp đúng "macroeconomic cycles, multi-asset hedging, risk-adjusted returns" của Stage 3 Figma |

### 0.3. Xử lý song song Việt/Anh
- Lớp A (Roadmap 9 Trạm) giữ nguyên tiếng Việt, không dịch sang Anh trong bản MVP (theo quyết định ở `AURA_UX_IMPROVEMENTS_SPEC.md` §9 — nội dung tài chính không tự dịch).
- Lớp B (Catalog, file này) viết sẵn tiếng Anh; nếu bật ngôn ngữ VI, hiển thị kèm chip `English content` (ngược lại với chip `Vietnamese content` ở Lớp A) cho đến khi có bản dịch chính thức.
- Cả 2 lớp dùng chung hệ thống XP/Level/Badge đã đặc tả ở `AURA_UX_IMPROVEMENTS_SPEC.md` §5 — XP cộng dồn vào cùng 1 tổng, không tách riêng.

---

## 1. DATA MODEL MỞ RỘNG (bổ sung cho model ở §3.2 file UX spec)

```ts
// Mở rộng `Course` hiện có để hỗ trợ khoá học độc lập (không có Stage/Station)
interface StandaloneCourse {
  id: string; slug: string; title: string; summary: string;
  level: "beginner" | "intermediate" | "advanced";
  lessons: Lesson[];
  isStandalone: true;              // phân biệt với Course thuộc Roadmap (Lớp A)
  language: "en" | "vi";
}

interface Lesson {
  id: string; slug: string; order: number;           // "Lesson {order} of {total}"
  title: string;                                      // vd "Market Basics & Order Mechanics"
  xpReward: number;                                    // vd 130
  sections: LessonSection[];                           // nội dung đọc
  flashcards: Flashcard[];                             // bộ thẻ ghi nhớ riêng của Lesson
  quiz: Quiz;                                          // quiz cuối Lesson (tái dùng type Quiz đã có)
  nextLessonId?: string;                                // điều hướng nút "NEXT"
}

interface LessonSection {
  id: string; heading: string; body: string;           // Markdown, có thể chứa KaTeX
}

interface Flashcard {
  id: string; term: string; definition: string;
  example?: string;                                     // ví dụ minh hoạ ngắn (tuỳ chọn)
}
```

**API bổ sung:**
```
GET  /api/courses/standalone                 → danh sách khoá học độc lập (đã lọc level/search)
GET  /api/courses/standalone/:slug           → chi tiết khoá + danh sách lesson (chưa gồm quiz answer)
GET  /api/lessons/:id                         → nội dung 1 lesson + flashcards
POST /api/lessons/:id/complete                → đánh dấu hoàn thành (idempotent XP, giống Trạm)
POST /api/lessons/:id/quiz/submit             → chấm điểm quiz, trả xpAwarded (nếu có)
```
Nguyên tắc server-authoritative áp dụng y hệt Lớp A: đáp án đúng, XP, trạng thái hoàn thành đều do server quyết định.

---

## 2. MÀN HÌNH DANH SÁCH `/courses` (khớp ảnh 1)

Giữ nguyên bố cục đã thấy trong Figma, chỉ chỉnh các điểm sau:
- 3 thẻ Stage (Lớp A) hiển thị **trước**, dạng card ngang, viền trái màu theo thứ tự (xanh dương → xanh dương nhạt hơn/teal → xanh lá), đúng tinh thần ảnh 1.
- Bên dưới là lưới thẻ khoá học độc lập (Lớp B), filter `All Levels / Beginner / Intermediate / Advanced` lọc **cả 2 lớp cùng lúc** (Stage card chỉ hiện ở "All Levels" hoặc khi filter khớp phần lớn trạm bên trong — mặc định hiện luôn ở "All Levels").
- Mỗi thẻ khoá học độc lập: badge Level (màu theo bảng dưới), icon sách + số Lesson, tiêu đề, mô tả ngắn, link `View Outline →`.

| Level | Màu badge (nền nhạt / chữ) |
|---|---|
| Beginner | `#DCFCE7` / `#15803D` (xanh lá) |
| Intermediate | `#DBEAFE` / `#1D4ED8` (xanh dương) |
| Advanced | `#F3E8FF` / `#7E22CE` (tím — khớp đúng màu "Options & Derivatives Trading" trong ảnh 1) |

---

## 3. MÀN HÌNH HỌC 1 LESSON (khớp ảnh 2 — áp dụng cho MỌI lesson, không riêng B1-L1)

### 3.1. Bố cục chuẩn

```
┌ 📖 LESSON {order} OF {total}      ⚡ {xpReward} XP      [📑 Study Flashcards] ┐
│                                                                              │
│  H1: {lesson.title}                                                         │
│  ──────────────────────────────────────────────────────────────────────    │
│                                                                              │
│  H2: {section.heading}                                                      │
│  {section.body}                                                             │
│  (lặp lại cho mỗi section)                                                  │
│                                                                              │
│  ┌ ✓ Complete Lesson ──────────────────────────────────────────────────┐   │
│  │ When you have finished reviewing the material, mark this lesson as  │   │
│  │ complete to track your course progression.                          │   │
│  │ [ Mark Lesson as Complete ]                                          │   │
│  └───────────────────────────────────────────────────────────────────  ┘   │
│                                                                              │
│  Course Outline                          [ NEXT: {nextLesson.title} → ]    │
└──────────────────────────────────────────────────────────────────────────┘
```

**🟡 SỬA — bổ sung bước Quiz còn thiếu trong Figma:** Ảnh 2 hiện nút `Mark Lesson as Complete` dẫn thẳng sang lesson kế, **chưa thấy bước Quiz**. Theo nguyên tắc nhất quán với Lớp A (Trạm luôn có mini-quiz trước khi hoàn thành) và theo đúng yêu cầu "sinh thêm câu hỏi dạng quiz" của bạn, bổ sung bước sau:

```
[Đọc xong các section] → [ Làm Quiz (bắt buộc) ] → đúng ≥ 1 câu / pass_score
   → [ Mark Lesson as Complete ] (lúc này mới có thể bấm) → [ NEXT lesson ]
```
- Nút `Mark Lesson as Complete` **disabled** (mờ, kèm tooltip "Hoàn thành Quiz để tiếp tục") cho đến khi quiz đạt `passScore`.
- Nút `Study Flashcards` luôn bật, không bắt buộc, chỉ là công cụ ôn tập hỗ trợ trước khi làm quiz.

### 3.2. Màn `Study Flashcards` (chế độ lật thẻ)
- Modal hoặc trang riêng `/lessons/:id/flashcards`.
- Mỗi thẻ: mặt trước = `term`, mặt sau = `definition` + `example` (nếu có). Nút lật (click/space), điều hướng `← →`, nút `Đã thuộc` / `Cần ôn lại` (tự phân loại vòng ôn tiếp theo kiểu Quizlet, lưu client-side là đủ cho MVP, không cần thuật toán spaced-repetition phức tạp).
- Thanh tiến độ `{current}/{total} thẻ`.

---

## 4. NỘI DUNG 6 KHOÁ HỌC — ĐẦY ĐỦ LESSON, SECTION, FLASHCARD, QUIZ

> Agent import nguyên văn nội dung dưới đây vào seed data. Giữ đúng cấu trúc Markdown trong `body` (in đậm, công thức). Số liệu ví dụ là hư cấu, dùng để minh hoạ khái niệm, không phải tư vấn đầu tư thật.

### B1 — Stock Investing 101 (Beginner · 2 Lessons)
*Summary:* "Master fundamental stock analysis, market dynamics, and portfolio construction."

#### Lesson 1 of 2 — **Market Basics & Order Mechanics** (130 XP) — *khớp nguyên văn ảnh 2*

**Section 1 — Financial Market Foundations**
> Financial markets connect capital allocators with productive enterprise. In this lesson, learn how exchange matching engines process market and limit orders.

**Section 2 — Market Orders vs. Limit Orders**
> A **market order** executes immediately at the best available price — you get speed, not a guaranteed price. A **limit order** only executes at your specified price or better — you get price control, not a guaranteed fill. New investors often default to market orders for liquid, large-cap stocks and switch to limit orders in volatile or thinly-traded names.

**Section 3 — How the Matching Engine Works**
> Exchanges rank orders by **price priority** first, then **time priority**. Two limit buy orders at the same price are filled in the order they were received — this is why professional traders care about order placement speed, even outside high-frequency trading.

**Flashcards (6):**
1. **Market Order** — An order to buy/sell immediately at the best available current price. *Ex: "Buy 100 shares now" with no price limit.*
2. **Limit Order** — An order that only executes at a specified price or better. *Ex: "Buy up to 50,000 VND, not higher."*
3. **Price Priority** — The matching rule where better-priced orders are filled before worse-priced ones.
4. **Time Priority** — Among orders at the same price, the earliest submitted order is filled first.
5. **Order Book** — The live list of all outstanding buy (bid) and sell (ask) orders for a security.
6. **Bid-Ask Spread** — The gap between the highest price a buyer will pay (bid) and the lowest price a seller will accept (ask).

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | You place a market buy order during a fast-moving session. What do you give up? | Price certainty | Speed of execution | The ability to cancel | **A** | Market orders guarantee speed, not the exact fill price. |
| 2 | Two limit buy orders are placed at the identical price of 50,000 VND, one second apart. Which fills first? | The larger order | The one placed first (time priority) | They fill simultaneously always | **B** | At equal price, time priority decides. |
| 3 | A stock's best bid is 49,800 and best ask is 50,000. What is the bid-ask spread? | 200 | 49,800 | 50,000 | **A** | 50,000 − 49,800 = 200. |

#### Lesson 2 of 2 — **Order Book Depth & Spread** (120 XP)

**Section 1 — Reading Order Book Depth**
> "Depth" refers to the volume of buy/sell orders stacked at each price level. A deep order book (large volume near the current price) means large trades can execute with minimal price impact. A thin order book means even modest orders can swing the price significantly — a key risk in illiquid small-cap stocks.

**Section 2 — Why Spreads Widen**
> Spreads widen during high uncertainty (earnings releases, macro shocks) because market makers demand more compensation for the risk of holding inventory in a fast-moving market. Narrow spreads are a sign of high liquidity and competitive market-making.

**Section 3 — Practical Takeaway for Beginners**
> For your first trades, prefer liquid, well-known stocks with narrow spreads and deep order books — the cost of entry/exit (slippage) is much lower, letting you focus on learning strategy rather than fighting execution friction.

**Flashcards (6):**
1. **Market Depth** — The volume of buy/sell orders available at each price level near the current price.
2. **Slippage** — The difference between the expected price of a trade and the price at which it actually executes.
3. **Liquidity** — How easily an asset can be bought or sold without significantly affecting its price.
4. **Market Maker** — A firm that continuously quotes both buy and sell prices to provide liquidity, earning the spread.
5. **Thin Order Book** — An order book with low volume at each price level, prone to large price swings on modest orders.
6. **Price Impact** — How much a trade itself moves the market price, larger for bigger orders in thin markets.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | A stock has very few orders stacked near the current price. This is called a ___ order book. | Deep | Thin | Balanced | **B** | Low volume at each level = thin book. |
| 2 | Why do spreads typically widen right before an earnings announcement? | Lower trading volume overall | Market makers price in higher uncertainty risk | Exchanges charge higher fees that day | **B** | Uncertainty increases the risk market makers must be compensated for. |
| 3 | For a beginner's first few trades, which type of stock minimizes slippage risk? | A thinly-traded small-cap | A liquid, well-known large-cap | Whichever has the highest expected return | **B** | Liquidity and deep order books reduce slippage. |

---

### B2 — Personal Finance & Risk Profiling (Beginner · 2 Lessons) 🟢

*Summary:* "Build the financial foundation before you invest: budgeting, compounding, and understanding your own risk tolerance."

#### Lesson 1 of 2 — **Budgeting & the Power of Compounding** (100 XP)

**Section 1 — Pay Yourself First**
> Before investing a single dong, build an **emergency fund** covering 3–6 months of essential expenses in cash or a savings account. Investing without this buffer forces you to sell investments at the worst possible time — exactly when markets are down and you need cash urgently.

**Section 2 — Compound Interest, Explained Simply**
> Compounding means your returns start earning their own returns. $$FV = PV \times (1 + r)^n$$ A modest 8%/year return doubles your money roughly every 9 years (the "Rule of 72": $72 / 8 ≈ 9$). Starting 10 years earlier can matter more than the amount you invest each month.

**Section 3 — The 50/30/20 Rule**
> A simple budgeting framework: 50% of income to needs (rent, food), 30% to wants (entertainment), 20% to savings/investing. It's a starting template, not a rigid law — adjust based on your actual cost of living.

**Flashcards (6):**
1. **Emergency Fund** — Cash reserve covering 3–6 months of essential expenses, kept outside of investments.
2. **Compound Interest** — Interest calculated on both the initial principal and the accumulated interest from prior periods.
3. **Rule of 72** — A quick estimate: years to double an investment ≈ 72 ÷ annual return rate (%).
4. **50/30/20 Rule** — A budgeting split: 50% needs, 30% wants, 20% savings/investing.
5. **Opportunity Cost** — The potential gain given up by choosing one financial option over another.
6. **Dollar-Cost Averaging (DCA)** — Investing a fixed amount at regular intervals regardless of price, reducing timing risk.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | Why build an emergency fund before investing? | It earns higher returns than stocks | It prevents forced selling of investments during emergencies | It is required by law | **B** | Avoids selling investments at a bad time to cover emergencies. |
| 2 | Using the Rule of 72, approximately how many years to double money at 9%/year? | 4 years | 8 years | 16 years | **B** | 72 ÷ 9 = 8. |
| 3 | In the 50/30/20 rule, what does the "20" represent? | Taxes | Wants/entertainment | Savings and investing | **C** | 20% is allocated to savings/investing. |

#### Lesson 2 of 2 — **Risk Profiles & Inflation Dynamics** (110 XP)

**Section 1 — What Is a Risk Profile?**
> Your risk profile combines **risk capacity** (how much loss you can financially absorb — depends on age, income stability, time horizon) and **risk tolerance** (how much volatility you can psychologically handle without panic-selling). A 25-year-old with stable income typically has higher capacity than a retiree, regardless of personality.

**Section 2 — Why Inflation Erodes "Safe" Cash**
> Holding 100% cash feels safe but guarantees a loss of purchasing power when inflation exceeds your cash's interest rate. If inflation is 4% and your savings account pays 2%, your real return is **−2%/year** — you're losing money in real terms even as the number on your statement grows.

**Section 3 — Matching Assets to Time Horizon**
> Money needed within 1–2 years belongs in cash/short-term instruments. Money not needed for 5+ years can tolerate equity volatility, since historically equities have outpaced inflation over long horizons — though with no guarantee in any single period.

**Flashcards (6):**
1. **Risk Capacity** — The objective financial ability to absorb investment losses, based on income, age, obligations.
2. **Risk Tolerance** — The psychological/emotional comfort with investment volatility.
3. **Real Return** — Nominal return minus inflation — the actual change in purchasing power.
4. **Purchasing Power** — The quantity of goods/services a unit of currency can buy; eroded by inflation.
5. **Time Horizon** — The length of time before an investor expects to need the invested funds.
6. **Inflation** — A sustained increase in the general price level, reducing the value of money over time.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | A young investor with stable income and no dependents likely has ___ risk capacity. | Low | High | Zero | **B** | Fewer near-term obligations and a long horizon raise capacity. |
| 2 | Inflation is 5%, your savings account pays 3%. What is your approximate real return? | +2% | −2% | +8% | **B** | 3% − 5% = −2% real return. |
| 3 | Money you will need in 12 months should generally be held in: | Growth equities | Cash or short-term instruments | Options contracts | **B** | Short time horizons require low-volatility, liquid holdings. |

---

### I1 — Reading Financial Statements (Intermediate · 2 Lessons) 🟢

*Summary:* "Go beyond the stock price — learn to read the three financial statements and spot red flags."

#### Lesson 1 of 2 — **The Three Statements** (140 XP)

**Section 1 — The Income Statement**
> Shows revenue, expenses, and **net profit** over a period. Key insight: profit is an accounting opinion shaped by estimates (depreciation, provisions) — it is not the same as cash actually collected.

**Section 2 — The Balance Sheet**
> A snapshot at one point in time: $$Assets = Liabilities + Equity$$ Watch the **debt-to-equity ratio**; a highly leveraged balance sheet amplifies both gains and losses.

**Section 3 — The Cash Flow Statement — The Lie Detector**
> Splits into Operating, Investing, and Financing activities. A company can report rising profit while **Operating Cash Flow (OCF)** is negative for several periods — often a sign revenue is booked faster than cash is collected (rising receivables), a classic early warning sign.

**Flashcards (7):**
1. **Net Profit** — Revenue minus all expenses, taxes, and costs; the "bottom line" of the income statement.
2. **Balance Sheet** — A snapshot of assets, liabilities, and equity at a specific point in time.
3. **Debt-to-Equity Ratio** — Total liabilities divided by shareholders' equity; measures financial leverage.
4. **Operating Cash Flow (OCF)** — Cash generated from core business operations, excluding financing/investing activities.
5. **Accounts Receivable** — Money owed to a company by customers for goods/services already delivered.
6. **Depreciation** — The systematic allocation of an asset's cost over its useful life; a non-cash expense.
7. **Quality of Earnings** — How well reported profit is backed by actual cash generation, not accounting estimates.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | Which statement is most useful for detecting if "profit" is backed by real cash? | Income Statement | Balance Sheet | Cash Flow Statement | **C** | The cash flow statement reconciles profit with actual cash movement. |
| 2 | A company's profit rises 50% but receivables triple and OCF is negative. What's the likely concern? | Excellent cash generation | Low quality of earnings; revenue not yet collected | The company has no debt | **B** | Rising receivables + negative OCF is a classic earnings-quality red flag. |
| 3 | Depreciation is best described as: | A cash outflow each period | A non-cash expense spreading asset cost over time | A liability on the balance sheet | **B** | It reduces reported profit without an actual cash payment that period. |

#### Lesson 2 of 2 — **Valuation Ratios — P/E & P/B** (140 XP)

**Section 1 — Price-to-Earnings (P/E)**
> $$P/E = \frac{\text{Share Price}}{\text{EPS}}$$ A P/E of 15 implies roughly 15 years to "earn back" the price paid, assuming flat earnings. Low P/E can mean a bargain — or a value trap if earnings are structurally declining.

**Section 2 — Price-to-Book (P/B)**
> $$P/B = \frac{\text{Share Price}}{\text{Book Value per Share}}$$ Most useful for asset-heavy sectors (banks, real estate, steel). A P/B below 1.0 means the market values the company below its net asset value on the books.

**Section 3 — Why Ratios Need Context**
> Never compare P/E across unrelated industries — a tech growth stock and a utility company have structurally different "normal" P/E ranges. Always compare against industry peers and the company's own historical range.

**Flashcards (6):**
1. **P/E Ratio** — Share price divided by earnings per share (EPS); a measure of how much investors pay per dollar of earnings.
2. **EPS (Earnings Per Share)** — Net profit divided by the number of outstanding shares.
3. **P/B Ratio** — Share price divided by book value per share; compares market price to net asset value.
4. **Book Value** — Total assets minus total liabilities — the accounting net worth of a company.
5. **Value Trap** — A stock that looks cheap on ratios but keeps falling because the underlying business is deteriorating.
6. **Peer Comparison** — Evaluating a company's ratios against others in the same industry, not the market overall.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | A stock has a price of 60,000 VND and EPS of 4,000 VND. What is its P/E? | 4 | 15 | 24 | **B** | 60,000 ÷ 4,000 = 15. |
| 2 | A bank trades at P/B = 0.8. What does this suggest? | The market values it above its net assets | The market values it below its net assets (book value) | P/B doesn't apply to banks | **B** | P/B < 1 means price is below book value. |
| 3 | Comparing a tech growth stock's P/E directly to a utility company's P/E is problematic because: | P/E never applies to tech stocks | Different industries have structurally different normal P/E ranges | Utilities don't report earnings | **B** | Valuation multiples should be compared within the same industry context. |

---

### I2 — Technical Analysis Essentials (Intermediate · 2 Lessons) 🟢

*Summary:* "Read candlestick patterns, support/resistance zones, and the two most common technical indicators."

#### Lesson 1 of 2 — **Candlestick Patterns** (130 XP)

**Section 1 — Anatomy of a Candle**
> Each candle shows Open, High, Low, Close for a period. A long body signals one side (buyers or sellers) dominated; a long wick signals a strong price rejection at that extreme.

**Section 2 — Three Key Patterns**
> **Doji** (open ≈ close): indecision between buyers and sellers. **Hammer / Pin Bar** (long lower wick): rejection of lower prices, potential bullish reversal after a downtrend. **Shooting Star** (long upper wick): rejection of higher prices, potential bearish reversal after an uptrend.

**Section 3 — Patterns Need Context, Not Just Shape**
> A hammer appearing randomly mid-trend means little. The same hammer appearing after a sustained downtrend, with above-average volume, is a far stronger reversal signal. Always read candles in the context of trend and volume.

**Flashcards (7):**
1. **Candlestick** — A chart element showing a period's Open, High, Low, and Close prices.
2. **Doji** — A candle where open and close are nearly equal, signaling market indecision.
3. **Hammer (Pin Bar)** — A candle with a small body and long lower wick, often a bullish reversal signal after a downtrend.
4. **Shooting Star** — A candle with a small body and long upper wick, often a bearish reversal signal after an uptrend.
5. **Uptrend** — A price pattern of higher highs and higher lows.
6. **Downtrend** — A price pattern of lower highs and lower lows.
7. **Volume Confirmation** — Using trading volume to validate the strength of a price pattern or signal.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | A candle with a long lower wick and small body, appearing after a steep downtrend, is called a: | Shooting Star | Hammer | Doji | **B** | Long lower wick + small body + after downtrend = hammer. |
| 2 | A Doji candle primarily signals: | Strong bullish momentum | Strong bearish momentum | Indecision between buyers and sellers | **C** | Open ≈ Close reflects a standoff, not a clear winner. |
| 3 | Why does volume matter when interpreting a reversal candle? | It doesn't — shape alone is enough | High volume adds confirmation that the move reflects real conviction | Low volume always means the signal is stronger | **B** | Volume confirms whether a pattern reflects genuine participation. |

#### Lesson 2 of 2 — **Support, Resistance & Indicators (MA, RSI)** (130 XP)

**Section 1 — Support & Resistance Are Zones, Not Lines**
> Think of support/resistance as price zones where supply/demand have historically clashed, not an exact number. A "broken" resistance zone (on strong volume) often flips to become new support — this is called **role reversal**.

**Section 2 — Moving Averages (MA)**
> The MA smooths price noise to reveal trend direction. A common signal: price crossing above its 50-day MA suggests strengthening short/medium-term momentum; crossing below suggests weakening momentum.

**Section 3 — Relative Strength Index (RSI)**
> RSI oscillates 0–100, measuring the speed/magnitude of recent price moves. Conventionally, RSI > 70 suggests "overbought" conditions (potential pullback), RSI < 30 suggests "oversold" (potential bounce) — but in strong trends, RSI can stay extreme for a long time, so it's a supporting signal, not a standalone trade trigger.

**Flashcards (7):**
1. **Support** — A price zone where buying pressure has historically been strong enough to halt declines.
2. **Resistance** — A price zone where selling pressure has historically been strong enough to halt advances.
3. **Role Reversal** — When a broken resistance zone becomes new support (or vice versa).
4. **Moving Average (MA)** — The average price over a set number of periods, used to smooth short-term noise and show trend.
5. **Golden Cross** — When a shorter-term MA crosses above a longer-term MA, often seen as bullish.
6. **RSI (Relative Strength Index)** — A 0–100 momentum oscillator; conventionally >70 = overbought, <30 = oversold.
7. **Overbought / Oversold** — Conditions where price has risen/fallen quickly enough that a pullback/bounce becomes more likely.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | A resistance zone breaks on high volume, and price later pulls back to that same zone. What typically happens? | The zone has no further relevance | The zone often flips to become new support | Price always crashes through it again | **B** | This is the classic "role reversal" pattern. |
| 2 | RSI reads 85 on a stock. What does this conventionally suggest? | Oversold, likely to bounce | Overbought, a pullback is more likely (not guaranteed) | The stock is guaranteed to crash | **B** | RSI > 70 is conventionally read as overbought, a caution signal, not a certainty. |
| 3 | A "Golden Cross" refers to: | A shorter-term MA crossing below a longer-term MA | A shorter-term MA crossing above a longer-term MA | RSI crossing above 70 | **B** | Golden Cross = short-term MA crossing above long-term MA, a bullish signal. |

---

### A1 — Options & Derivatives Trading (Advanced · 1 Lesson)
*Summary:* "Strategic option contracts, risk hedging, and volatility positioning."

#### Lesson 1 of 1 — **Options Fundamentals — Calls, Puts & Hedging** (180 XP)

**Section 1 — Calls and Puts, Simply**
> A **call option** gives the right (not obligation) to **buy** an asset at a fixed **strike price** before expiry — buyers profit if the price rises above the strike plus premium paid. A **put option** gives the right to **sell** at the strike — buyers profit if the price falls below the strike minus premium paid.

**Section 2 — Why Investors Use Options: Hedging**
> A portfolio holder worried about a short-term downturn can buy **put options** as insurance: if the portfolio falls, the puts gain value, offsetting losses — at the cost of the premium paid, similar to an insurance premium that expires worthless if no downturn occurs.

**Section 3 — The Cost of Leverage: Why Options Can Expire Worthless**
> Unlike owning the stock outright, an option has an **expiry date**. If the price doesn't move favorably enough before expiry, the option can lose its entire premium value — this asymmetric, time-limited risk is why options require more risk discipline than straightforward stock ownership.

**Section 4 — Core Vocabulary for Pricing**
> Option premiums are driven by **intrinsic value** (how far in-the-money the option is) plus **time value** (potential for the price to move favorably before expiry) and **implied volatility** (the market's expectation of future price swings — higher expected volatility raises premiums for both calls and puts).

**Flashcards (8):**
1. **Call Option** — A contract giving the right (not obligation) to buy an asset at a fixed strike price before expiry.
2. **Put Option** — A contract giving the right (not obligation) to sell an asset at a fixed strike price before expiry.
3. **Strike Price** — The fixed price at which an option holder may buy (call) or sell (put) the underlying asset.
4. **Premium** — The price paid by the option buyer to the option seller for the contract.
5. **Expiry Date** — The date after which the option contract becomes void.
6. **Hedging** — Using a position (e.g., buying puts) to offset potential losses in another position.
7. **Intrinsic Value** — The amount an option is currently "in the money" — its value if exercised right now.
8. **Implied Volatility** — The market's expectation of future price fluctuation, embedded in an option's premium.

**Quiz (4 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | An investor buys a put option mainly to: | Speculate on unlimited upside | Hedge against a potential decline in a holding | Guarantee a fixed dividend | **B** | Puts gain value as the underlying falls, offsetting portfolio losses. |
| 2 | What is the maximum loss for an option **buyer** (call or put)? | Unlimited | The premium paid | Double the premium paid | **B** | A buyer's downside is capped at the premium paid; it can expire worthless. |
| 3 | Rising implied volatility generally makes option premiums: | Lower | Higher | Unaffected | **B** | Higher expected future price swings raise the value of the optionality. |
| 4 | An option with no intrinsic value is kept solely for its: | Dividend potential | Time value (chance of favorable movement before expiry) | Guaranteed payout at expiry | **B** | Out-of-the-money options derive value purely from remaining time value. |

---

### A2 — Macro Cycles & Portfolio Construction (Advanced · 2 Lessons) 🟢
*Summary:* "Macroeconomic cycles, multi-asset portfolio hedging, and risk-adjusted performance measurement."

#### Lesson 1 of 2 — **Interest Rates, Inflation & Asset Allocation** (160 XP)

**Section 1 — The Rate Transmission Mechanism**
> When a central bank raises policy rates: savings become more attractive → capital rotates out of equities/real estate toward deposits/bonds → corporate borrowing costs rise → earnings growth slows → equity valuations compress. The reverse chain plays out when rates are cut.

**Section 2 — Which Assets Suffer Most From Rising Rates?**
> **Growth equities** (high P/E, profits weighted toward the distant future) are typically hit hardest, since their valuation relies heavily on discounting far-future cash flows at a higher rate. **Value equities** (steady cash flow, high current dividends) and **short-duration bonds** are comparatively more resilient.

**Section 3 — Building a Regime-Aware Allocation**
> Rather than predicting exact turning points, a disciplined investor adjusts **tilts** — modestly increasing defensive/value/bond weight as rates rise and inflation accelerates, and modestly increasing growth-equity weight as rates stabilize/fall and growth data improves — without abandoning diversification entirely in either regime.

**Flashcards (7):**
1. **Policy Rate** — The benchmark interest rate set by a central bank, influencing borrowing costs economy-wide.
2. **Rate Transmission** — The chain of economic effects that follows a change in policy interest rates.
3. **Discount Rate** — The rate used to convert future cash flows into present value; rises with interest rates.
4. **Growth Equity** — A stock whose valuation is weighted toward future earnings growth, often at a high P/E.
5. **Value Equity** — A stock with steady current cash flows/dividends and typically lower P/E.
6. **Duration (Bonds)** — A measure of a bond's price sensitivity to interest rate changes; longer duration = more sensitive.
7. **Regime-Aware Allocation** — Adjusting portfolio tilts based on the current macro environment, without full market timing.

**Quiz (3 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | Why are growth stocks typically hit hardest when interest rates rise sharply? | They pay the highest dividends | Their valuation relies on discounting distant future cash flows at a higher rate | They have no revenue | **B** | Higher discount rates reduce the present value of far-future earnings most. |
| 2 | A bond with longer duration is: | Less sensitive to interest rate changes | More sensitive to interest rate changes | Immune to interest rate changes | **B** | Duration measures rate sensitivity — longer duration = more price movement per rate change. |
| 3 | "Regime-aware allocation" means: | Predicting the exact top/bottom of the market | Adjusting portfolio tilts gradually based on the macro environment | Holding 100% cash during any uncertainty | **B** | It's about gradual tilting, not precise market timing. |

#### Lesson 2 of 2 — **Risk-Adjusted Returns — Sharpe, Alpha, Drawdown** (160 XP)

**Section 1 — Why Raw Returns Can Mislead**
> A portfolio returning 20%/year sounds better than one returning 12%/year — until you learn the first one swung ±40% along the way while the second swung ±8%. Risk-adjusted metrics let you compare returns **per unit of risk taken**.

**Section 2 — Sharpe Ratio**
> $$\text{Sharpe} = \frac{R_p - R_f}{\sigma_p}$$ where $R_p$ = portfolio return, $R_f$ = risk-free rate, $\sigma_p$ = portfolio's standard deviation of returns. A Sharpe above 1.0 is generally considered good; above 2.0 is excellent — but always compare within a similar asset class and time period.

**Section 3 — Alpha vs. Benchmark**
> $$\text{Alpha} = R_p - R_{benchmark}$$ Positive alpha means the portfolio outperformed its benchmark (e.g., VN-Index) on a like-for-like basis. Alpha alone, without considering the risk taken to achieve it, can be misleading — pair it with Sharpe or Max Drawdown.

**Section 4 — Max Drawdown**
> The largest peak-to-trough decline in portfolio value during a period. Two portfolios with identical final returns can have very different "ride" — one with a 40% max drawdown is psychologically and practically far harder to hold through than one with 12%, since recovering from a 40% loss requires a 67% subsequent gain just to break even.

**Flashcards (7):**
1. **Sharpe Ratio** — Excess return (over the risk-free rate) divided by the standard deviation of returns; measures return per unit of risk.
2. **Risk-Free Rate** — The theoretical return of an investment with zero risk, often approximated by government short-term bonds.
3. **Standard Deviation (σ)** — A statistical measure of how much returns vary from their average; a common proxy for volatility/risk.
4. **Alpha** — The excess return of a portfolio relative to its benchmark index.
5. **Benchmark** — A reference index (e.g., VN-Index) used to evaluate relative portfolio performance.
6. **Max Drawdown** — The largest peak-to-trough decline in portfolio value over a given period.
7. **Volatility** — The degree of variation in an asset's or portfolio's returns over time.

**Quiz (4 câu):**
| # | Câu hỏi | A | B | C | Đúng | Giải thích |
|---|---|---|---|---|---|---|
| 1 | Portfolio A returns 20%/year with σ=30%; Portfolio B returns 12%/year with σ=8%. Which likely has the better Sharpe Ratio (assume Rf=3%)? | Portfolio A | Portfolio B | Impossible to tell | **B** | (12−3)/8 = 1.125 vs (20−3)/30 ≈ 0.57 — B has the better risk-adjusted return. |
| 2 | A portfolio returns 15% while its benchmark returns 11%. What is its Alpha? | +4% | −4% | +26% | **A** | Alpha = 15% − 11% = +4%. |
| 3 | After a 40% drawdown, what return is needed just to break even? | 40% | 67% | 100% | **B** | 1/(1−0.40) − 1 ≈ 0.667 = 66.7%. |
| 4 | Why is Max Drawdown important alongside total return? | It shows the true starting capital | It captures the worst "pain" an investor had to endure, affecting ability to stay invested | It replaces the need for Alpha entirely | **B** | Drawdown reflects the psychological/practical difficulty of holding through losses. |

---

## 5. GAMIFICATION & LIÊN KẾT (áp dụng cho Lớp B, nhất quán với Lớp A)

- XP mỗi Lesson cộng **idempotent** (chỉ lần đầu hoàn thành), cùng pool XP/Level với Lớp A — xem `AURA_UX_IMPROVEMENTS_SPEC.md` §5.
- Hoàn thành **cả 2 Lesson** của 1 khoá độc lập → nhận huy hiệu riêng theo khoá, ví dụ:
  - B1 hoàn thành → "Market Mechanics Rookie"
  - I1 hoàn thành → "Financial Statement Detective" (song song với huy hiệu tiếng Việt "Thám tử báo cáo tài chính" ở Lớp A — có thể gộp chung 1 huy hiệu nếu nội dung trùng lặp, Agent xác nhận với chủ dự án)
  - I2 hoàn thành → "Chart Reader"
  - A1 hoàn thành → "Derivatives Strategist"
  - A2 hoàn thành → "Macro Portfolio Architect"
- Liên kết sang Simulation (tương tự Lớp A §3.5): hoàn thành I2 (Technical Analysis) → gợi ý `Thử đọc biểu đồ thật trong Map 1`; hoàn thành A2 (Macro Cycles) → gợi ý `Áp dụng ngay trong Map 2 — Pro Room`.

---

## 6. ACCEPTANCE CRITERIA

- [ ] `/courses` hiển thị đúng 3 thẻ Stage (Lớp A, giữ nguyên nội dung 9 Trạm tiếng Việt) + 6 thẻ khoá học độc lập (Lớp B) theo mục 0.2, đúng badge màu theo level.
- [ ] Lesson 1 của B1 khớp **nguyên văn** với ảnh 2 Figma (tiêu đề, breadcrumb, 130 XP, nội dung "Financial Market Foundations").
- [ ] Mỗi Lesson có đủ: sections, bộ Flashcard riêng (`Study Flashcards` hoạt động, lật được, điều hướng được), Quiz cuối lesson.
- [ ] Nút `Mark Lesson as Complete` **disabled** cho đến khi hoàn thành Quiz đạt `passScore`; sau khi complete, nút `NEXT: {tên lesson kế}` hoạt động đúng thứ tự.
- [ ] XP cộng idempotent, cùng pool với Lớp A; huy hiệu riêng theo từng khoá độc lập được cấp đúng khi hoàn thành đủ lesson.
- [ ] Đáp án quiz **không gửi xuống client** trước khi nộp bài; chấm điểm ở server.
- [ ] Mâu thuẫn mô tả Stage Figma vs nội dung Trạm gốc (mục 0.1) đã được xử lý hoặc đánh dấu `TODO` rõ ràng, không tự sửa nội dung 9 Trạm gốc.
- [ ] Liên kết Courses ↔ Simulation ở mục 5 hoạt động đúng, không ảnh hưởng điều kiện mở khoá Map.

---

## 7. GHI CHÚ CHO AGENT

- Toàn bộ số liệu ví dụ (giá cổ phiếu, EPS, lãi suất...) trong các Lesson là **hư cấu minh hoạ**, không phải tư vấn đầu tư thật — giữ nguyên tinh thần disclaimer đã áp dụng cho toàn hệ thống.
- Nếu muốn dịch Lớp B sang tiếng Việt sau này, giữ nguyên cấu trúc file (course → lesson → section/flashcard/quiz), chỉ thay nội dung text, không đổi `id`/`slug` để không vỡ tiến độ đã lưu của người dùng.
- Khi phát sinh thêm khoá học mới ngoài 6 khoá này, tuân theo đúng khuôn mẫu ở mục 4 (Section → Flashcard → Quiz) để giữ trải nghiệm nhất quán.
