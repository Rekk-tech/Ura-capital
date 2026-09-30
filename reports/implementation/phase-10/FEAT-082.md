# FEAT-082 Implementation Report: Simulation Game Mechanics — Map 1 (FOMO Arena) & Map 2 (Pro Room with AI Advisor)

## 1. Executive Summary

| Attribute | Canonical Record |
| :--- | :--- |
| **Feature ID** | FEAT-082 |
| **Feature Title** | Simulation Game Mechanics: Map 1 (FOMO Arena) & Map 2 (Pro Room with AI Advisor) |
| **Phase** | Phase 10 — Advanced Simulation & Behavioral Gaming |
| **Specification Source** | `docs/design/AURA_MAP1_MAP2_GAME_SPEC.md` |
| **Implementation Owner** | ANTIGRAVITY |
| **Branch** | `feat/FEAT-082-map1-map2-simulation-game` |
| **Target Integration** | `planning/phase-9-master` |
| **Migration Invariant** | **ZERO DB Migrations** (Exactly 10 migrations total; in-memory sessions) |
| **Boundary Invariant** | **ZERO Boundary Violations** (Controllers consume services; 0 raw Prisma instantiation) |
| **Aura AI Gateway Integration** | Fully integrated with Phase 8 `AIGatewayService` & `GeminiAdapter` with deterministic fallback |
| **Advisor Rule** | Strictly < 80 words, causal macro reasoning, Benjamin Graham & Warren Buffett philosophy |
| **5 Async UI States** | Loading, Empty, Auth-Required, Error (with retry), Success on all views |
| **Simulation Disclosures** | Persistent "Simulated execution only • Virtual funds • No real capital at risk" banner |
| **Quality Gate Status** | **ALL PASS** (Lint: 0 errors; Typecheck: 0 errors; Build: PASS; 5 Guards: PASS; 1780+ unit/e2e tests: PASS) |

---

## 2. Core Requirements & Specification Matrix

| Requirement ID | Description | Component / Engine | Status |
| :--- | :--- | :--- | :--- |
| **MAP1-ENG-001** | 7 Rounds, 45-second discrete cycles with 4-phase state machine (News & Trap, Trading Window, Trap/Quiz, Ledger Update) | `Map1FomoEngineService` | **VERIFIED** |
| **MAP1-ENG-002** | Initial cash $100M VND, 0.15% fee per transaction, Margin x2 unlocked from Round 3 | `Map1FomoEngineService` | **VERIFIED** |
| **MAP1-ENG-003** | Stop-Out rule triggered immediately when $NAV \le 5M$ VND ($95\%$ drawdown) | `Map1FomoEngineService` | **VERIFIED** |
| **MAP1-ENG-004** | FOMO score algorithm ($w_1=0.5, w_2=0.3, w_3=0.2$) and Discipline score (100 base) with Top 3 real mistakes generation | `Map1FomoEngineService` | **VERIFIED** |
| **MAP1-UI-001** | Real-time circular SVG countdown timer, dynamic price chart, simulated bot chat feed, breaking news banner | `FomoTimer`, `FomoPriceChart`, `FomoNewsFeed` | **VERIFIED** |
| **MAP1-UI-002** | Quick Buy buttons (25%, 50%, 100%), Buy/Sell/Hold order ticket, Margin x2 toggle with lock tooltip, Stop-Loss toggle | `FomoOrderTicket` | **VERIFIED** |
| **MAP1-UI-003** | Interactive Round 0 Tutorial (skipable with 0 score impact), timed Trap popups (R2, R3, R5), 10s Quizzes (R4, R6) | `FomoTutorialModal`, `FomoTrapQuizModal` | **VERIFIED** |
| **MAP1-UI-004** | Comprehensive Debrief screen showing Sống Sót / Cháy Tài Khoản, NAV chart, top 3 real mistakes, FOMO & Discipline scores, badge, and CTA unlocking Map 2 | `FomoDebriefView` | **VERIFIED** |
| **MAP2-ENG-001** | 12 Quarters simulation across 4 macroeconomic regimes: Boom (Q1-Q3), Stagflation (Q4-Q6), Recession (Q7-Q9), Recovery (Q10-Q12) | `Map2MacroEngineService` | **VERIFIED** |
| **MAP2-ENG-002** | 4-Asset model (`EQ_GROWTH`, `EQ_VALUE`, `BOND`, `CASH`) with beta sensitivity matrix returns calculation | `Map2MacroEngineService` | **VERIFIED** |
| **MAP2-ENG-003** | Quantitative metrics: CAGR, Alpha vs 8.5% benchmark, Max Drawdown, Sharpe ratio, and 4 investment style profiles | `Map2MacroEngineService` | **VERIFIED** |
| **MAP2-AI-001** | Benjamin Graham & Warren Buffett value-investing advisor (< 80 words) with causal macro reasoning and Gemini Gateway integration + deterministic fallback | `Map2AiAdvisorService` | **VERIFIED** |
| **MAP2-UI-001** | 4 Macro stages indicator & 12 quarters progress, Rate/Inflation/GDP KPI cards, interactive causality diagram modal | `ProMacroPanel`, `MacroExplanationModal` | **VERIFIED** |
| **MAP2-UI-002** | 4 Asset allocation sliders with Donut chart and real-time 100% sum validation | `ProAllocationSliders` | **VERIFIED** |
| **MAP2-UI-003** | AI Advisor speech box with quarter performance chip and causal feedback | `ProAdvisorSpeechBox` | **VERIFIED** |
| **MAP2-UI-004** | Disciplinary quiz modal on even quarters (+10 Credit Score) and Final Portfolio Review at Q12 | `ProQuizDialog`, `ProPortfolioReport` | **VERIFIED** |
| **ROUTING-001** | Route registration in `route-registry.ts` and `simulation-routes.tsx` with auth enforcement and navigation from MapSelectionView | `route-registry.ts`, `simulation-routes.tsx` | **VERIFIED** |

---

## 3. Server-Authoritative Architecture & Engine Mechanics

### 3.1 Map 1: FOMO Arena Engine (`apps/api/src/modules/simulation/game/map1-fomo-engine.service.ts`)
- **State Machine**: 7 Rounds, 45 seconds per round, divided into 4 non-overlapping phases:
  1. `news_and_trap` (seconds 0 to 10): Market news banner and simulated bot chat stream update; trap options presented.
  2. `trading_window` (seconds 10 to 30): Player can submit market orders (`BUY`, `SELL`, `HOLD`) with quick cash percentage allocations (25%, 50%, 100%).
  3. `trap_or_quiz` (seconds 30 to 40): Trap execution or timed mini-quiz (10s countdown) for risk management bonus/penalties.
  4. `ledger_update` (seconds 40 to 45): Cycle price settlement, balance adjustments, fee accounting (0.15%), Stop-Loss execution, and Stop-Out evaluation.
- **Stop-Out Rule**: If $NAV \le 5,000,000\text{ VND}$ ($95\%$ drawdown from initial $100M$), the session is immediately terminated with status `completed_burned`.
- **FOMO Score Algorithm**:
  $$\text{FOMO Score} = w_1 \times M_1 + w_2 \times M_2 + w_3 \times M_3$$
  where $w_1 = 0.5$ (Chasing high green candles / Buy at top), $w_2 = 0.3$ (Panic selling at bottom red candles), $w_3 = 0.2$ (Aggressive trap responses in R2, R3, R5). Clamped between 0 and 100.
- **Discipline Score**: Starts at 100 points, decremented by -15 for unhedged trades without stop-loss, -20 for buying on margin during market drops, and -10 for incorrect risk management quiz answers.
- **Top 3 Mistakes**: Dynamically generated from execution audit log (e.g., "Mua đuổi tại vùng đỉnh kháng cự", "Bán tháo hoảng loạn khi giá điều chỉnh sâu", "Dùng margin bắt dao rơi không cài stop-loss").

### 3.2 Map 2: Pro Room Macro Value Engine (`apps/api/src/modules/simulation/game/map2-macro-engine.service.ts`)
- **12 Quarters Cycle Timeline**:
  - **Quarters 1–3 (Bùng Nổ / Boom)**: Rate 5.0%, Inflation 2.5%, GDP 7.5%.
  - **Quarters 4–6 (Đình Lạm / Stagflation)**: Rate 8.5%, Inflation 6.0%, GDP 4.0%.
  - **Quarters 7–9 (Suy Thoái / Recession)**: Rate 7.0%, Inflation 4.0%, GDP 3.0%.
  - **Quarters 10–12 (Hồi Phục / Recovery)**: Rate 6.0%, Inflation 3.0%, GDP 6.0%.
- **Sensitivity Matrix Return Formulation**:
  $$R_{i,t} = \beta_{i,\text{rate}} \times \Delta\text{Rate}_t + \beta_{i,\text{inf}} \times \Delta\text{Inf}_t + \beta_{i,\text{gdp}} \times \Delta\text{GDP}_t + \epsilon_i$$
  Calculated across `EQ_GROWTH`, `EQ_VALUE`, `BOND`, and `CASH`.
- **Quantitative Portfolio Analytics**:
  - Compound Annual Growth Rate: $\text{CAGR} = \left(\frac{\text{Final NAV}}{\text{Initial Cash}}\right)^{\frac{1}{3}} - 1$.
  - Alpha vs Benchmark: $\alpha = \text{CAGR} - 0.085$.
  - Maximum Drawdown: $\text{MDD} = \max_{t} \left(\frac{\text{Peak NAV}_t - \text{NAV}_t}{\text{Peak NAV}_t}\right)$.
  - Sharpe Ratio: $\text{Sharpe} = \frac{\text{CAGR} - 0.04}{\sigma_{\text{annualized}}}$.
- **Investment Style Classification**:
  - `AGGRESSIVE_GROWTH`: Equity > 70% during tight liquidity regimes.
  - `BALANCED_STRATEGIST`: Allocation closely balanced, MDD $\le 15\%$.
  - `VALUE_INVESTOR`: Rebalancing towards value and cash during high valuations, Alpha > 0.
  - `DEFENSIVE_PRESERVER`: Bond + Cash > 60% across cycles.

### 3.3 Graham & Buffett AI Advisor (`apps/api/src/modules/simulation/game/map2-ai-advisor.service.ts`)
- Configured with strict value-investing prompt: Margin of safety, circle of competence, emotional temperance, and anti-speculation.
- Calls Phase 8 `AIGatewayService` (`gemini-3.5-flash-lite`) with context hydration and timeout management.
- Implements deterministic fallback ensuring that even if network or gateway fails, advice is guaranteed in under 80 words with causal macro explanation ("Lãi suất tăng 8.5% làm tăng chi phí vốn và chiết khấu định giá P/E...").

---

## 4. Frontend Component & Async States Architecture

### 4.1 5 Async UI States Verification
Both `FomoArenaPage` (`/simulation/map-1`) and `ProRoomPage` (`/simulation/map-2`) implement the complete 5-state lifecycle:
1. **Loading State**: Centered pulsing spinner with contextual message while engine sessions initialize.
2. **Empty State**: Welcoming introductory card detailing the rules, initial virtual balance ($100M VND), and starting CTA.
3. **Auth-Required State**: Intercepted by `ProtectedRoute` and authenticated query handlers with clear sign-in prompts.
4. **Error State with Retry**: Rose-accented error banner displaying the error message with a prominent "Thử lại" button.
5. **Success State**: Fully interactive arena cockpit with real-time SVG charts, sliders, and timers.

### 4.2 Mandatory Disclosures Banner
The persistent `SimulationDisclosureBanner` is prominently displayed at the top of both pages with:
- `SIMULATION ONLY` badge.
- `NO REAL MONEY` badge.
- `NO BROKERAGE EXECUTION` badge.
- Explicit notice: *"Simulated execution only • Virtual funds • No real capital at risk"*.

---

## 5. Verification & Test Evidence

### 5.1 Test Execution Summary

| Test Suite | Files | Tests | Failures | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API Unit & Integration Tests** | 106 | 1279 | 0 | **PASS** |
| • `map1-fomo-engine.test.ts` | 1 | 13 | 0 | **PASS** |
| • `map2-macro-engine.test.ts` | 1 | 9 | 0 | **PASS** |
| **Web Unit, Component & E2E Tests** | 58 | 501 (1 skip) | 0 | **PASS** |
| • `FomoArenaPage.test.tsx` | 1 | 5 | 0 | **PASS** |
| • `ProRoomPage.test.tsx` | 1 | 5 | 0 | **PASS** |
| • `route-registry.test.ts` | 1 | 5 | 0 | **PASS** |
| • `phase-9-integration-gate.spec.tsx` | 1 | 30 | 0 | **PASS** |
| **Total Test Coverage** | **164 Files** | **1780 Tests** | **0 Failures** | **PASS** |

### 5.2 Architectural Guard Verifications

```bash
$ npm run guard:persistence
[PERSISTENCE_GUARD] PASS (14 tests passed)

$ npm run guard:migration
[MIGRATION_GUARD] PASS
[MIGRATION_GUARD] migrations=10
[MIGRATION_GUARD] digests=10

$ npm run guard:boundary
[REPOSITORY_BOUNDARY_GUARD] PASS
[REPOSITORY_BOUNDARY_GUARD] controllers=24, services=32, repositories=10

$ npm run guard:audit-governance
[PRODUCT_AUDIT_GOVERNANCE_GUARD] PASS
[PRODUCT_AUDIT_GOVERNANCE_GUARD] Zero premature product audit schemas, models, or APIs detected.

$ npm run guard:seed-safety
[SEED_SAFETY_GUARD] PASS
[SEED_SAFETY_GUARD] Zero unsafe seed scripts, migration fixtures, or default admin backdoors detected.
```

### 5.3 Linter & TypeScript Compilation

```bash
$ npm run lint
> eslint .
(Clean: 0 errors, 0 warnings)

$ npm run typecheck
> tsc --noEmit
(Clean: 0 errors across root, @aura/shared, @aura/api, and @aura/web)

$ npm run build
> shared, api, and web production bundles built successfully
dist/index.html                   1.02 kB
dist/assets/index-CQkE8UlI.css   81.29 kB
dist/assets/index-CeGKqbgX.js   907.96 kB
```

---

## 6. Route Registry Entries

| Route ID | Path | Owning Feature | Requires Auth | Target Component |
| :--- | :--- | :--- | :--- | :--- |
| `simulationMap1` | `/simulation/map-1` | FEAT-082 | `true` | `FomoArenaPage` |
| `simulationMap2` | `/simulation/map-2` | FEAT-082 | `true` | `ProRoomPage` |

Both routes are registered in `route-registry.ts`, verified by unit tests, protected by `ProtectedRoute`, and linked dynamically from the lobby cards in `MapSelectionView`.

---

## 7. Delivery Commits & Conclusion

All required files, game engines, UI components, tests, and documentation have been implemented with zero regressions and zero boundary or migration violations. The feature is ready for final branch commit, push, and approval.
