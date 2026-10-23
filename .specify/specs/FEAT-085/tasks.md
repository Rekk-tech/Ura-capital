# Tasks: FEAT-085 Commercial Subscription Center, Gamification Loop & Simulation Scoreboard

**Feature Code**: `FEAT-085`  
**Created**: 2026-10-13  
**Status**: IN_PROGRESS (Option A Commercial Pricing Activation)  

---

## Task List

- [x] **Task 1: Commercial Subscription Activation & Upgrade Flow**
  - [x] T1.1: Update `route-registry.ts`: change `ROUTE_REGISTRY.subscription.status` to `"AVAILABLE"`.
  - [x] T1.2: Update `AppShell.tsx`: mount `<SubscriptionRoutes />` at `/subscription/*`.
  - [x] T1.3: Update `SubscriptionPage.tsx`: implement instant upgrade CTA that sets plan to `PREMIUM`, invalidates queries, and awards +500 XP.
  - [x] T1.4: Update `subscription-learner-journey.spec.tsx` and run tests.

- [x] **Task 2: Gamification Ledger & Service Foundation**
  - [x] T2.1: Implement `apps/web/src/features/simulation/services/gamification.service.ts` with local & reactive state for XP, Level, Badges, Game History, and Leaderboard.
  - [x] T2.2: Implement `apps/web/src/features/simulation/hooks/useGamification.ts` hook for easy component consumption.
  - [x] T2.3: Write unit tests for gamification calculations (`gamification.service.test.ts`).

- [x] **Task 3: Simulation Map 1 & Map 2 Debrief Gamification Integration**
  - [x] T3.1: Connect Map 1 completion in `FomoDebriefView.tsx` to record FOMO score, award +150 XP, and unlock *Survivor Badge*.
  - [x] T3.2: Connect Map 2 completion in `ProRoomReportView.tsx` to record Alpha score, award +200 XP, and unlock *Macro Tactician Badge*.

- [x] **Task 4: Gamification Cockpit & Leaderboard UI Components**
  - [x] T4.1: Create `GamificationCockpit.tsx` displaying Trader Level, XP progress bar, badges collection, and best simulation runs.
  - [x] T4.2: Create `SimulationLeaderboard.tsx` displaying top community simulated traders.
  - [x] T4.3: Integrate `GamificationCockpit` into `DashboardPage.tsx` and `ProfileSettingsPage.tsx`.
  - [x] T4.4: Integrate `SimulationLeaderboard` into `SimulationDashboardPage.tsx` lobby and `CommunityFeedPage.tsx`.

- [x] **Task 5: Styling, End-to-End Validation & Verification**
  - [x] T5.1: Add luxury tokens and classes to `apps/web/src/index.css` (`.gamification-cockpit-card`, `.simulation-leaderboard-card`, `.badge-showcase-item`, etc.).
  - [x] T5.2: Run full unit & integration tests (`npm run test`).
  - [x] T5.3: Run full workspace typecheck (`npm run typecheck`) and web build (`npm run build:web`).
  - [x] T5.4: Visual verification & state synchronization across all surfaces.

- [x] **Task 6 (Option A): Commercial Pricing Plans & Feature Comparison Matrix**
  - [x] T6.1: Add `billingCycle` toggle state and pricing model (`199.000 ₫/tháng` & `1.490.000 ₫/năm`) to `SubscriptionPage.tsx`.
  - [x] T6.2: Build interactive 2-column pricing cards (Standard 0đ vs Premium VIP featured card).
  - [x] T6.3: Build 8-row responsive Feature Comparison Table comparing quotas, AI access, and map limits.
  - [x] T6.4: Add FinTech styling in `index.css` for pricing cards, toggle switch, and comparison matrix.
  - [x] T6.5: Verify `SubscriptionPage.test.tsx`, `npm run typecheck`, and `npm run build:web`.
