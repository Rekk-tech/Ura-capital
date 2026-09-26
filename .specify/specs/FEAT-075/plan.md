# FEAT-075 Plan: Portfolio & Financial Valuation UI

Status: APPROVED FOR IMPLEMENTATION / IN_PROGRESS

## 1. Preconditions

- Human approves the FEAT-075 assignment.
- Baseline tag `feat-074-approved` merged into `planning/phase-9-master`.
- Work branch: `feat/FEAT-075-portfolio-valuation-ui`.
- Clean worktree without dirty or unrelated changes.

## 2. Delivery Sequence

1. **Route Governance & Shell (T001)**:
   - Add/promote `portfolio` route in `route-registry.ts` (`/portfolio`, status `AVAILABLE`, `requiresAuth: true`, `owningFeature: "FEAT-075"`).
   - Integrate into `AppShell.tsx` protected by `<ProtectedRoute>`.
   - Update `route-registry.test.ts` and `AppShell.test.tsx`.
2. **API Hooks (T002)**:
   - Expose dedicated hooks in `use-portfolio.ts` or `use-simulation.ts` leveraging `simulationApi`:
     - `usePortfolioValuation(simulationId)`
     - `useSimulationTrades(simulationId)`
     - `useSimulationSessions()`
   - Ensure AbortSignal forwarding, `staleTime: 15_000`, `refetchOnWindowFocus: false`, smart retry.
3. **Core Visual Components (T003 - T006)**:
   - `PortfolioEquitySummary`: Total equity, cash, market value, cost basis, NAV.
   - `PnLAnalyticsCard`: Realized/Unrealized PnL, ROI, Win/Loss stats.
   - `AssetAllocationBreakdown`: Weight bars, asset badges, 100% cash empty state.
   - `EquityTrendViewer`: Cycle & trade progression tracker.
4. **Page Integration & State Matrix (T007)**:
   - `PortfolioPage`:
     - Resolves active session or allows selecting simulation sessions.
     - Handles 5 states: Loading (skeleton), Empty (no session or uninitialized), Auth-required, Error (with retry), Success.
     - Renders mandatory regulatory disclaimer and server-authority notice.
5. **Testing & Quality Gate (T008)**:
   - Unit tests for formatting and calculation helpers.
   - Component tests for each presentation component and `PortfolioPage`.
   - Route resolution tests in `AppShell.test.tsx`.
   - Run `npm run lint`, `npm run typecheck`, `npm run test:web`, `npm run build`, and security guards.
   - Publish implementation report `reports/implementation/phase-9/FEAT-075.md`.

## 3. Invariants & Boundaries

- ZERO database migrations.
- Server-authoritative financials: all numbers from server DTOs.
- Mandatory virtual funds disclaimer: always visible.
- Phase 8 AI remains frozen.
