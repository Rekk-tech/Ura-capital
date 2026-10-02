# Implementation Plan: FEAT-081 — Map 1 (FOMO Arena) Comprehensive Overhaul

**Branch**: `planning/phase-9-master` (feat/map1-fomo-arena-comprehensive-overhaul) | **Date**: 2026-10-02 | **Spec**: [FEAT-081 Spec](file:///d:/project/ura-capital/.tmp/phase9-planning/.specify/specs/FEAT-081/spec.md)

## Summary

Execute a comprehensive overhaul of Map 1: FOMO Arena across 8 key areas:
1. **Localization**: Vietnamese navigation links (`Trang Chủ`, `Khóa Học`, `Đấu Trường Giả Lập`, `Danh Mục`, `Cộng Đồng`) and Financial Hybrid terminology (`MUA (BUY)`, `BÁN (SELL)`, `NAV`, `CASH`, `P&L`, `MARGIN`).
2. **Clean Viewport**: Hide the 100px yellow disclaimer banner during active gameplay, replace with subtle footer badge `🛡️ Sàn đấu thực chiến giả lập • 100% vốn ảo`.
3. **Tick Engine**: Real-time candlestick animation with 1.0–1.5s tick updates, live candle stretching, pulsing dot, 6–8s forward candle spawn, and continuously scrolling ticker tape.
4. **VIP Hype Room**: Dynamic streaming chat from an authentic 40+ comment bank, 3–6s random message pushes, fade-in animations, auto-scroll, and dynamic relative timestamps.
5. **Corporate News**: Dynamic enterprise news pool with sentiment badges.
6. **Accessible Quiz Modal**: 600px centered modal with 10s countdown progress bar, 18–20px bold typography, large option cards, keyboard shortcuts (1, 2, 3, 4 / A, B, C, D), and immediate psychological feedback.
7. **Rigid 2-Column Grid**: 1fr / 390px (65% / 35%) fitting standard 1080p desktop displays without page scrolling.
8. **Visual Tension & Mechanics**: Red vignette screen flash on crashes (Rounds 3 & 5), Round 5 locked SELL button with shake animation & red warning, and post-match debrief comparing NAV vs Buy & Hold with top 3 mistakes.

---

## Technical Context

- **Frontend Core**: React 19, TypeScript 5.7, Vite 6, Vanilla CSS (with design tokens).
- **Zero Tailwind Runtime Dependency**: All new animations, pills, cards, progress bars, and modal styles must be explicitly defined in `apps/web/src/index.css`.
- **Constraint Guard**: Strict avoidance of prohibited keyword `truncate` as a CSS class or variable name (per API persistence guard `PROHIBITED_WRITE_OPS`).
- **Data Source**: Import and utilize data from `.tmp/phase9-planning/docs/data_map_1` (specifically `aura_capital_map1_fomo_arena_mock_data.json` and `aura_map1_fomo_arena.json`).

---

## Project Structure & File Modifications

### 1. Data Layer
- **Create**: `apps/web/src/features/simulation/data/map1-fomo-dataset.ts`
  - Encapsulate tick series for rounds 1–7 (30 ticks per round at 1.5s intervals).
  - Encapsulate 40+ chat lines categorized by round sentiment with personas (`Trader_Shark88`, `FO_DiamondHands`, `Broker_Thanh`, `BigWhale_99`, `Hoang_Nam99`).
  - Encapsulate news pool with category badges, timestamps, summaries, and impact tags.
  - Encapsulate situational trap & quiz questions for all 7 rounds with option labels, correct answers, and psychological biases.
  - Encapsulate matching ticker tape trade prints.

### 2. Navigation & Localization
- **Update**: `apps/web/src/app/shell/AppHeader.tsx`
  - Support Vietnamese navigation labels: `Trang Chủ`, `Khóa Học`, `Đấu Trường Giả Lập`, `Danh Mục`, `Cộng Đồng`.
  - Maintain compatibility with tests while providing natural Vietnamese default for localized users.

### 3. Chart & Ticker Animation
- **Update**: `apps/web/src/features/simulation/components/map1/FomoPriceChart.tsx`
  - Implement dynamic tick loop (advancing ticks every 1.5s based on round time).
  - Live candle co giãn: updates open, high, low, close in real-time.
  - Pulse Dot Animation on latest price level at right chart edge.
  - Forward candle spawn every 6–8 seconds.
  - Continuously scrolling matching ticker tape with trade executions.

### 4. Community Hype Room & News Feed
- **Update**: `apps/web/src/features/simulation/components/map1/FomoNewsFeed.tsx`
  - `FomoHypeRoom`: Streaming bot appending new messages every 3–6s, smooth fade-in, auto-scroll to bottom, dynamic relative timestamps (`Vừa xong`, `3s trước`, `8s trước`).
  - `FomoNewsCard`: Dynamic news item display with psychological impact indicators (`TÍCH CỰC: RẤT CAO`, `ÁP LỰC BÁN THÁO: CỰC ĐỘ`, `MẤT THANH KHOẢN`).

### 5. Order Desk & Special Mechanics
- **Update**: `apps/web/src/features/simulation/components/map1/FomoOrderTicket.tsx`
  - Financial hybrid labels: `MUA (BUY)`, `BÁN (SELL)`, `TỔNG TÀI SẢN (NAV)`, `TIỀN MẶT (CASH)`, `LÃI/LỖ (P&L)`, `ĐÒN BẨY MARGIN`.
  - Round 5 Lock-Limit Down: When user clicks SELL, button triggers shake animation (`fomo-shake`) and displays red warning tooltip: `LỆNH BÁN BỊ KHÓA DO KHÔNG CÓ BÊN MUA ĐỐI ỨNG (MẤT THANH KHOẢN)`.

### 6. Accessible Large Quiz Modal
- **Update**: `apps/web/src/features/simulation/components/map1/FomoTrapQuizModal.tsx`
  - 600px width (`max-w-xl`), centered, dark backdrop blur (`bg-slate-950/70 backdrop-blur-sm`).
  - 10-second countdown bar running down from 100% to 0%.
  - Bold 18–20px question title.
  - Large interactive option cards with A, B, C, D badges and keyboard listeners (`1`, `2`, `3`, `4` / `A`, `B`, `C`, `D`).
  - Instant feedback banner with 1-sentence psychological takeaway.

### 7. Main Arena Page & Viewport Optimization
- **Update**: `apps/web/src/features/simulation/pages/FomoArenaPage.tsx`
  - Hide yellow disclaimer banner during active gameplay (`sessionId && state`).
  - Add footer disclaimer badge: `🛡️ Sàn đấu thực chiến giả lập • 100% vốn ảo`.
  - Add Red Vignette Flash overlay on screen during crash rounds (Rounds 3 & 5).
  - Add Debrief breakdown comparing final NAV vs Buy & Hold benchmark with top 3 mistakes list.

### 8. Styling System
- **Update**: `apps/web/src/index.css`
  - Add CSS animations: `@keyframes fomo-pulse-dot`, `@keyframes fomo-shake`, `@keyframes fomo-vignette-flash`, `@keyframes fomo-fade-in`, `@keyframes fomo-tape-scroll`.
  - Add classes for quiz modal cards, countdown bar, and subtle footer disclaimer.

---

## Verification & Quality Gates

1. `npm run lint` — 0 errors.
2. `npm run typecheck --workspace=@aura/web` — 0 errors.
3. `npm run test:web` — all tests pass.
4. `npm run test:unit --workspace=@aura/api tests/unit/persistence-guard.test.ts` — 14/14 pass.
5. `npm run build --workspace=@aura/web` — bundle build succeeds.
6. Playwright screenshots: capture live dynamic cockpit, tick action, streaming hype room, and redesigned quiz modal.
7. Git commit and push to `planning/phase-9-master`.
