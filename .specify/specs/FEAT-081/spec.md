# Feature Specification: FEAT-081 — Map 1 (FOMO Arena) Comprehensive Overhaul

**Feature Branch**: `planning/phase-9-master` (feat/map1-fomo-arena-comprehensive-overhaul)

**Created**: 2026-10-02

**Status**: Approved

**Input**: User feedback from live gameplay recording on Map 1 (FOMO Arena) requiring synchronized language, hidden in-game disclaimer banner, real-time 1.5s candlestick tick engine, dynamic streaming VIP hype room, corporate news pool, accessible large quiz modal, rigid 2-column cockpit fitting 1080p viewport, and visual tension mechanics.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Dynamic Candlestick Engine & Tick Animation (Priority: P1)
As a learner trader inside Map 1, I want the candlestick chart to tick continuously every 1.0–1.5s and stretch the active candle with a pulsing price dot, so that I experience the urgency and volatility of a live financial market rather than looking at a static graph.

**Why this priority**: The static chart was the single biggest defect undermining simulation immersion; without continuous ticks, the 45-second timer feels detached from price action.

**Independent Test**: Load Map 1 Round 1. Observe the live candle extending high/low wicks every 1.5s, pulsing dot at current price level, forward candles spawning every 6–8s, and matching ticker tape continuously scrolling trade prints from right to left.

**Acceptance Scenarios**:
1. **Given** an active Round in Map 1, **When** the 45s round is counting down, **Then** a micro-tick update occurs every 1.0–1.5s updating price, candle high/low, and volume.
2. **Given** the rightmost active candle, **When** price ticks fluctuate, **Then** a glowing pulse dot animates at the exact price coordinate on the right Y-axis.
3. **Given** elapsed round time of 6–8s, **When** a candle interval completes, **Then** the current candle finalizes and a new forward candle spawns matching the round's economic trajectory.
4. **Given** the matching ticker strip beneath the chart, **When** trading is in progress, **Then** small matched orders (`+15,000 CP @ 46,200 (BUY)`) scroll continuously from right to left.

---

### User Story 2 - Dynamic Streaming Community VIP Hype Room (Priority: P1)
As a participant in FOMO Arena, I want the community chat to stream realistic, crowd-psychology messages every 3–6s during the 45s round, so that I feel the psychological pressure of peer sentiment and hype.

**Why this priority**: Psychological stress testing requires active crowd noise; static text makes the room feel abandoned.

**Independent Test**: Watch the VIP Hype Room during Round 1 and Round 2. Verify that 2 initial messages appear, followed by new messages sliding up with fade-in every 3–6s from varied personas (`Trader_Shark88`, `FO_DiamondHands`, `Broker_Thanh`, `BigWhale_99`, `Hoang_Nam99`), with relative timestamps updating (`Vừa xong`, `3s trước`, `8s trước`).

**Acceptance Scenarios**:
1. **Given** the start of a round, **When** the view loads, **Then** 2 initial historic messages are visible.
2. **Given** active round countdown, **When** 3–6s elapse, **Then** a new message from the 40+ authentic comment bank slides in with smooth fade-in and the chat container auto-scrolls down.
3. **Given** messages in the feed, **When** time passes, **Then** relative timestamps dynamically refresh.

---

### User Story 3 - Clean Viewport & Disclaimer Optimization (Priority: P2)
As a user trading on desktop, I want the large yellow 100px legal banner hidden during active gameplay and replaced by a subtle footer badge, so that the entire trading cockpit fits cleanly on a standard 1080p display without vertical scrolling.

**Why this priority**: Eliminates layout clutter and prevents awkward scroll jumps during high-pressure 45-second trading rounds.

**Acceptance Scenarios**:
1. **Given** the Simulation Lobby / Map Selection screen, **When** viewing the page, **Then** the standard yellow disclaimer banner remains fully visible for regulatory awareness.
2. **Given** an active Map 1 game (`sessionId && state`), **When** the trading cockpit renders, **Then** the yellow banner is completely hidden, and a subtle badge `🛡️ Sàn đấu thực chiến giả lập • 100% vốn ảo` appears at the bottom.

---

### User Story 4 - Language & Localization Standardization (Priority: P2)
As a Vietnamese retail investor, I want all navigation links in Vietnamese (`Trang Chủ`, `Khóa Học`, `Đấu Trường Giả Lập`, `Danh Mục`, `Cộng Đồng`) and Map 1 adhering to the Vietnamese Financial Hybrid standard (`MUA (BUY)`, `BÁN (SELL)`, `NAV`, `CASH`, `P&L`, `MARGIN`), with 100% Vietnamese instructions and news.

**Why this priority**: Resolves language dissonance and aligns with real Vietnamese brokerage applications (SSI iBoard, TCBS, VPS).

**Acceptance Scenarios**:
1. **Given** the top navbar, **When** rendered, **Then** primary tabs display `Trang Chủ`, `Khóa Học`, `Đấu Trường Giả Lập`, `Danh Mục`, `Cộng Đồng`.
2. **Given** the order desk and KPI cards in Map 1, **When** rendered, **Then** standard hybrid terms `MUA (BUY)`, `BÁN (SELL)`, `TỔNG TÀI SẢN (NAV)`, `TIỀN MẶT (CASH)`, `LÃI/LỖ (P&L)`, `ĐÒN BẨY MARGIN` are used, while all hints, news, and labels are 100% natural Vietnamese.

---

### User Story 5 - Redesigned Accessible Trap & Quiz Modal (Priority: P2)
As a trader facing a 10s decision point, I want a prominent, centered modal (600px wide, dark backdrop blur) with a shrinking 10s progress bar, large question title (18–20px), large clickable option cards with keyboard shortcuts (1, 2, 3, 4 / A, B, C, D), and immediate feedback with psychological takeaways.

**Why this priority**: The previous modal was too cramped and illegible during 45s rounds.

**Acceptance Scenarios**:
1. **Given** second 28–34 of a round, **When** a trap or quiz triggers, **Then** a 600px modal opens with `backdrop-blur-sm bg-black/60`.
2. **Given** the modal header, **When** counting down from 10s, **Then** a visible progress bar smoothly shrinks from 100% to 0%.
3. **Given** options A, B, C, D, **When** clicking an option or pressing keys `1`, `2`, `3`, `4` or `A`, `B`, `C`, `D`, **Then** the option selects, displays instant green/red feedback with a 1-sentence psychological takeaway, and automatically advances.

---

### User Story 6 - Dynamic Corporate News & Ticker Universe (Priority: P3)
As a trader, I want corporate news dynamically selected from a realistic news pool matching the round's narrative, with clear psychological impact tags (`TÍCH CỰC: RẤT CAO`, `ÁP LỰC BÁN THÁO: CỰC ĐỘ`, `MẤT THANH KHOẢN`), avoiding repetitive single-news fatigue.

**Acceptance Scenarios**:
1. **Given** each round, **When** news renders, **Then** it presents categorized headlines, summaries, and impact tags from the enterprise news pool.

---

### User Story 7 - Visual Tension & Special Mechanics (Priority: P3)
As a trader experiencing market crashes, I want visual tension effects (red vignette screen flash during crashes in Round 3 and Round 5) and a locked SELL button in Round 5 ("Múa bên trăng" / liquidity freeze) that shakes on click and displays `LỆNH BÁN BỊ KHÓA DO KHÔNG CÓ BÊN MUA ĐỐI ỨNG (MẤT THANH KHOẢN)`.

**Acceptance Scenarios**:
1. **Given** Round 3 or Round 5 when price plunges to floor, **When** viewing the cockpit, **Then** a subtle pulsing red vignette flash signals market panic.
2. **Given** Round 5 (liquidity freeze), **When** the user clicks `BÁN (SELL)`, **Then** the button shakes with `fomo-shake` animation and displays an alert tooltip explaining that selling is blocked due to zero buy liquidity.

---

### User Story 8 - Post-Match Debrief Breakdown (Priority: P3)
As a learner completing the 7 rounds, I want a post-game debrief comparing my final NAV against the Buy & Hold benchmark, along with a bulleted breakdown of the top 3 psychological mistakes committed during the match.

---

## Functional Requirements

- **FR-001**: System MUST provide a tick engine emitting price and OHLC updates every 1.0–1.5 seconds during Map 1 rounds.
- **FR-002**: System MUST render Japanese candlesticks with live candle stretching and right-edge pulse dot animation.
- **FR-003**: System MUST scroll matching trade executions in the lower ticker tape continuously.
- **FR-004**: System MUST stream community chat messages every 3–6s from the 40+ comment bank across 7 rounds.
- **FR-005**: System MUST hide the 100px top yellow disclaimer banner inside active gameplay and show `🛡️ Sàn đấu thực chiến giả lập • 100% vốn ảo` in the footer.
- **FR-006**: System MUST standardize navigation to Vietnamese (`Trang Chủ`, `Khóa Học`, `Đấu Trường Giả Lập`, `Danh Mục`, `Cộng Đồng`) and Map 1 to Financial Hybrid terminology.
- **FR-007**: System MUST render a 600px accessible Quiz Modal with 10s countdown bar, keyboard shortcuts (1, 2, 3, 4 / A, B, C, D), and immediate feedback.
- **FR-008**: System MUST lock the SELL button in Round 5 with a shake animation and explicit liquidity halt explanation.
- **FR-009**: System MUST trigger a red vignette flash during crash phases in Round 3 and Round 5.
- **FR-010**: System MUST maintain rigid 2-column layout (`65%` left / `35%` right, or `1fr` / `390px`) fitting standard 1080p desktop viewports without unnecessary page scrolling.

---

## Success Criteria

1. **Immersion**: Candlestick chart ticks continuously every 1.0–1.5s with zero perceived stutter or layout jump.
2. **Readability**: Chat streams smoothly with dynamic relative timestamps; quiz dialog is 600px wide with bold typography and 10s progress bar.
3. **Viewport Optimization**: 100px yellow banner hidden in gameplay; trading cockpit fits within 1080p viewport.
4. **Localization**: 100% consistency across Vietnamese navigation and financial hybrid terminology.
5. **Quality Gates**: All tests in `@aura/web` (486+ tests) and API persistence guards pass cleanly; `lint`, `typecheck`, and `build` succeed with 0 errors.
