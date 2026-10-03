# Feature Specification: FEAT-082 — Map 2 (Pro Room) High-Fidelity UI/UX Redesign & Financial Cockpit Architecture

**Feature Branch**: `planning/phase-9-master` (feat/map2-pro-room-figma-redesign)
**Created**: 2026-10-03
**Status**: In-Progress (Approved for Implementation)
**Design Source**: 4 High-Fidelity Figma Mockups (Active Q1 Boom, Active Q5 Stagflation Tightening, Discipline Quiz Check #05, 12-Quarter Completion Comprehensive Report)

---

## 1. Executive Summary & Design Vision
Map 2: Pro Room is the institutional macro asset allocation arena of Aura Capital. While Map 1 focuses on high-frequency psychological FOMO resistance, Map 2 trains macroeconomic cycle awareness, multi-asset diversification, and quantitative discipline over a 12-quarter (3-year) economic journey.

This specification elevates the Map 2 interface from a functional prototype to a Bloomberg/institutional-grade financial simulation desk matching 100% of the Figma design mockups, ensuring rich aesthetics, high logical clarity, micro-interactions, responsive 1080p density, and immersive user experience.

---

## 2. User Scenarios & Acceptance Criteria *(Mandatory)*

### User Story 1: Institutional 4-KPI Metric Ribbon & Macro Cycle Progression (Priority: P1)
As a macro portfolio manager in Map 2, I want a top KPI ribbon and segmented progression bar displaying my total capital pool, unallocated cash, benchmark alpha, drawdown ceiling, and active quarterly cycle phase, so that I maintain immediate situational awareness of my financial standing.

**Acceptance Criteria**:
1. **Given** any active quarter (Q1 to Q12), **When** viewing the top ribbon, **Then** four KPI cards display:
   - `TOTAL CAPITAL POOL` / `TOTAL PORTFOLIO ASSETS` with dot-separated VND formatting (`100.000.000 VND` or current NAV) and QoQ return change.
   - `UNALLOCATED CASH` with amount in VND and percentage of total portfolio.
   - `BENCHMARK ALPHA (VS VN-INDEX)` with dynamic green/rose formatting and contextual badge (e.g. `Top 5% Cohort Performance` or `Defensive Stress Resilience`).
   - `MAX DRAWDOWN LIMIT` showing `< 15.0%` with current drawdown risk indicator (e.g. `Current Risk: 0.0% (Clean)`).
2. **Given** the active quarter header, **When** transitioning from Stage 1 (Boom) to Stage 2 (Stagflation), **Then** the header badge updates dynamically (e.g. `Quarter 1 of 12 [Active Round]` → `Quarter 5 of 12 – Monetary Tightening [Stagflation Phase]`).
3. **Given** the macro progression tracker, **When** each quarter advances, **Then** the progress percentage updates (e.g. `Q1 Completed: 8.3%` → `Q5 in progress: 41.6%`), with remaining quarters count displayed.

---

### User Story 2: Interactive Benchmark Trajectory Chart & Technical Indicators (Priority: P1)
As an asset allocator, I want to observe the benchmark VN-Index composite chart with candlesticks, moving averages (MA20, MA50), RSI, volume histogram, and time horizon selectors, so that I can analyze the market trend before committing my quarterly capital.

**Acceptance Criteria**:
1. **Given** the benchmark chart card, **When** rendering in Q1–Q3 (Boom), **Then** green/upward bullish candles reflect the market expansion (e.g. `1,284.60 (+14.20 / +1.12%)`).
2. **Given** the benchmark chart card, **When** rendering in Q4–Q6 (Monetary Tightening & Stagflation), **Then** red/downward bearish candles with high sell-off volume reflect rate hike pressures.
3. **Given** chart controls, **When** clicking `[Candles]`, `[Line]`, or `[Heikin Ashi]`, **Then** the visualization switches rendering mode.
4. **Given** technical indicator chips, **Then** `MA(20)`, `MA(50)`, `RSI(14)`, and `Vol` display realistic values matching the macro stage.

---

### User Story 3: Macro Climate Panel & Aura Research Insight (Priority: P1)
As an analytical learner, I want clear cards displaying Interest Rate, CPI Inflation, and GDP Growth alongside Aura Research's quarterly macroeconomic commentary, so that I can understand the underlying transmission mechanics.

**Acceptance Criteria**:
1. **Given** the Macroeconomic Climate panel, **When** viewing the 3 indicators, **Then** each displays current level, trend arrow, and policy interpretation:
   - `LÃI SUẤT ĐIỀU HÀNH`: e.g. `5.0%` (`Stable` / `Chính sách trung tính`) or `8.5%` (`+350 bps hike` / `Siết chặt quyết liệt`).
   - `LẠM PHÁT (CPI)`: e.g. `2.5%` (`-0.2% MoM` / `Dưới trần mục tiêu 4.0%`) or `6.0%` (`+6.0% YoY` / `Vượt trần mục tiêu 4.5%`).
   - `TĂNG TRƯỞNG GDP`: e.g. `7.5%` (`+0.4% YoY` / `Công nghiệp bùng nổ`) or `4.5%` (`Giảm tốc YoY` / `Đứt gãy cung ứng`).
2. **Given** the Aura Research callout box, **Then** contextual institutional insights explain how monetary policy impacts growth vs. defensive assets in the current quarter.

---

### User Story 4: CrediFin AI Advisor & Asset Allocation Cockpit (Priority: P1)
As an investor, I want CrediFin AI Advisor's strategic co-pilot guidance, multi-asset allocation sliders with real-time VND calculation, and a segmented asset allocation bar, so that I can configure my portfolio weights with precision.

**Acceptance Criteria**:
1. **Given** CrediFin AI Advisor speech box, **When** rendered, **Then** it features the verified bot avatar, status beacon, core quote (`❝ ... ❞`), and actionable quarterly suggestion (`💡 Gợi ý chiến lược...`).
2. **Given** the 4 asset allocation sliders (`EQ_GROWTH`, `EQ_VALUE`, `BOND`, `CASH`), **When** adjusting percentages:
   - The multi-colored segmented progress bar updates in real time.
   - Each asset displays its computed monetary value in VND based on current NAV (e.g. `35%` -> `35.000.000 VND`).
   - Strict 100% total sum validation unlocks the `XÁC NHẬN & CHỐT QUÝ {N} →` button.
   - If not equal to 100%, an alert badge guides the user, and an "Auto Balance 100%" action resolves discrepancies.

---

### User Story 5: Sổ Lệnh & Biên Bản Khởi Tạo Quý (Order Desk) (Priority: P1)
As an institutional trader, I want a structured order desk ledger at the bottom of the cockpit showing order types, allocation weights, converted VND values, Sharpe/yield metrics, and status badges for all 4 assets, so that I have a professional execution summary before committing.

**Acceptance Criteria**:
1. **Given** the bottom section, **Then** a structured table displays:
   - `MÃ TÀI SẢN`: `$EQ_GROWTH`, `$EQ_VALUE`, `$BOND`, `$CASH` with corresponding asset color dots.
   - `LOẠI LỆNH`: Dynamically contextualized by macro stage (e.g. `Mua phân bổ kỳ hạn`, `Hạ tỷ trọng / Cắt giảm rủi ro`, `Duy trì thanh khoản`).
   - `TỶ TRỌNG DỰ KIẾN`: Percentage allocation matching active sliders.
   - `GIÁ TRỊ QUY ĐỔI`: Explicit amount in dot-separated VND.
   - `RỦI RO / SHARPE`: Expected Sharpe ratio or fixed yield.
   - `TRẠNG THÁI`: Visual pill badge (`Sẵn sàng`, `Tối ưu`, `Giảm vị thế`, `Gia tăng`).

---

### User Story 6: Interactive Discipline Quiz Dialog (Priority: P2)
As a learner facing economic volatility, I want discipline check popups on designated quarters with a realistic scenario card, selectable options, and CrediFin monitoring indicators matching the Figma mockup.

**Acceptance Criteria**:
1. **Given** an even quarter commit, **When** a quiz triggers, **Then** the dialog displays:
   - Green pill badge: `KIỂM TRA KỶ LUẬT ĐẦU TƯ • QUÝ {N}` | `Discipline Check #{N}`.
   - Blue scenario card: `TÌNH HUỐNG THỰC TẾ (SCENARIO)`.
   - Distinct option cards (A, B, C) with radio pills and rationale subtext.
   - Selected option highlighted with deep emerald background and checkmark.
   - Footer note: `🔒 CrediFin AI Advisor đang theo dõi logic ra quyết định của bạn`.

---

### User Story 7: 12-Quarter Simulation Completed: Comprehensive Report (Priority: P1)
As a graduate of Map 2, I want a comprehensive institutional audit report featuring an elite dark navy hero certificate with institutional tier medallion, 4 KPI cards, dual-line macro cycle area chart, CrediFin audit with strengths and recommendations, behavioral competency scores, and action buttons.

**Acceptance Criteria**:
1. **Hero Certificate Header**:
   - Deep navy background (`#0A1128` to `#0D1B2A`).
   - Badge `✓ AUDIT VALIDATED • ZERO DRAWDOWN BREACH`.
   - Title `12-Quarter Simulation Completed: Comprehensive Report`.
   - Subtitle with initial capital, final capital in VND, and total return.
   - Right medallion: `INSTITUTIONAL TIER: Top Performer` (or Value Investor / Defensive Investor).
2. **4 KPI Cards**:
   - `ANNUALIZED RETURN (CAGR)`: e.g. `+15.7% p.a.` (with cohort benchmark note).
   - `ALPHA VS VN-INDEX`: e.g. `+4.65%`.
   - `MAX DRAWDOWN`: e.g. `-12.4% [Safe]`.
   - `SHARPE RATIO`: e.g. `1.82 [Institutional Grade]`.
3. **12-Quarter Performance Chart**:
   - Area chart tracking `● Aura Portfolio` vs. `● VN-Index Benchmark` over 12 quarters.
   - Allocation legend chips across the 4 asset classes.
4. **CrediFin AI Advisor Evaluation**:
   - Left-bordered card with bot icon and awarded investor title.
   - Comprehensive feedback quote.
   - 2-column breakdown: `Điểm mạnh nổi bật` (thumbs up) vs `Khuyến nghị nâng cao` (target).
5. **Trader Behavioral Competency Score**:
   - Three 0–100 progress bars:
     - `Risk Discipline` (e.g. `96/100`)
     - `Macro Timing` (e.g. `82/100`)
     - `Rebalancing Consistency` (e.g. `90/100`)
6. **Action Buttons**:
   - `📥 Tải Báo Cáo Phân Tích (PDF Audit)` / `Chia Sẻ Lên Cộng Đồng`.
   - `← Quay lại Trung tâm Mô phỏng (Simulation Hub)`.

---

## 3. Visual & Technical Design Tokens

### Color Palette (Institutional Light & Dark Contrast):
- **Background**: Slate-50 (`#F8FAFC`) with pure white card surfaces (`#FFFFFF`).
- **Dark Accent Panels**: Midnight Navy (`#0A1128` / `#0D1B2A`) with subtle border `#1E293B`.
- **Primary Action**: Deep Royal/Navy Blue (`#0F172A` / `#1E3A8A` / `#2563EB`).
- **Asset Colors**:
  - Growth Equity (`$EQ_GROWTH`): Vibrant Blue (`#3B82F6` / `#2563EB`)
  - Value Equity (`$EQ_VALUE`): Teal / Cyan (`#06B6D4` / `#0891B2`)
  - Govt Bonds (`$BOND`): Emerald / Mint (`#10B981` / `#059669`)
  - Cash & Reserves (`$CASH`): Amber / Gold (`#F59E0B` / `#D97706`)
- **Status Accents**:
  - Positive / Profit: Emerald-500 (`#10B981`)
  - Warning / Alert: Amber-500 (`#F59E0B`)
  - Risk / Loss / Bearish: Rose-500 (`#EF4444`)

---

## 4. Implementation Plan & File Architecture

1. `apps/web/src/features/simulation/components/map2/ProMacroTopRibbon.tsx`:
   - Top 4 KPI cards + Cycle phase progression bar + Breadcrumb switch map link.
2. `apps/web/src/features/simulation/components/map2/ProBenchmarkChart.tsx`:
   - VN-Index / Multi-Asset composite chart with candlesticks, volume histogram, moving average pills, and timeframe toggles.
3. `apps/web/src/features/simulation/components/map2/ProMacroClimatePanel.tsx`:
   - 3 macro cards (Interest rate, CPI, GDP) + Aura Research macro narrative callout.
4. `apps/web/src/features/simulation/components/map2/ProAllocationCockpit.tsx`:
   - Segmented multi-asset progress bar + 4 sliders with computed VND amounts + 100% confirmation CTA.
5. `apps/web/src/features/simulation/components/map2/ProOrderDeskTable.tsx`:
   - Structured order execution ledger at cockpit base.
6. `apps/web/src/features/simulation/components/map2/ProRoomAiAdvisor.tsx`:
   - Upgraded to CrediFin AI Advisor with dual-tier quote and strategy recommendation.
7. `apps/web/src/features/simulation/components/map2/ProQuizDialog.tsx`:
   - Upgraded to exact Figma discipline check mockup with interactive cards and subtext.
8. `apps/web/src/features/simulation/components/map2/ProRoomReportView.tsx`:
   - Upgraded to full Figma comprehensive report with dual-line trajectory chart, behavioral competency scores, and audit medallion.
9. `apps/web/src/features/simulation/pages/ProRoomPage.tsx`:
   - Orchestrates the components into the rigid 2-column layout matching Figma screenshots 1, 2, 3, and 4.
