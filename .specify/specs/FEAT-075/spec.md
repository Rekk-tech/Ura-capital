# FEAT-075 Specification: Portfolio & Financial Valuation UI

Status: APPROVED FOR IMPLEMENTATION / IN_PROGRESS

## 1. Architecture Contract

- Objective: Integrate and polish the dedicated Portfolio & Financial Valuation experience (`/portfolio`) providing total equity summaries, cash ratio analysis, asset allocation breakdowns, realized/unrealized PnL metrics, and cycle-by-cycle equity progression while enforcing strict server financial authority.
- API: Consumes approved authenticated endpoints:
  - `GET /api/simulation/sessions`: To resolve active/historical simulation sessions.
  - `GET /api/simulation/sessions/:simulationId/portfolio`: To retrieve authoritative valuation DTO (`SimulationPortfolioValuationResponseDto`).
  - `GET /api/simulation/sessions/:simulationId/trades`: To retrieve authoritative trade execution history (`SimulationTradeResponseDto[]`).
- Persistence: ZERO database or migration changes (10 migrations total).
- Security & Authority: All balances, positions, valuations, and returns are server-authoritative facts. Client cache and UI components are strictly presentation layers.
- AI Track: Phase 8 AI remains strictly FROZEN. No Gemini or AI imports.

## 2. Functional Contract

### FR-001 Route Governance & Shell Integration
- Register `/portfolio` in `route-registry.ts` with status `AVAILABLE`, `requiresAuth: true`, `owningFeature: "FEAT-075"`, `isNavVisible: true`, and `section: "trading"`.
- Mount in `AppShell.tsx` protected by `<ProtectedRoute>`.

### FR-002 API Client & TanStack Query Hooks
- Expose portfolio query hooks using `SimulationApiClient` (`getPortfolioValuation`, `listSessions`, `getTrades`).
- Pass native `AbortSignal` across all requests.
- Configure TanStack Query: `staleTime: 15_000`, `refetchOnWindowFocus: false`, smart retry: 1 (skipping 401/403/404, disabled in test environment).

### FR-003 Portfolio Equity Summary
- Component `PortfolioEquitySummary`:
  - Total Portfolio Equity
  - Cash Balance vs. Asset Market Value
  - Total Cost Basis (sum of quantity * averageCost across positions)
  - Net Asset Value (NAV) representation
  - Formatted using exact Decimal string representation without precision loss.

### FR-004 PnL & Performance Analytics
- Component `PnLAnalyticsCard`:
  - Cumulative Realized PnL (from closed positions)
  - Unrealized PnL (from current open positions)
  - Return rate percentage (ROI) relative to starting cash
  - Win/Loss ratio and total profitable vs. unprofitable trades derived from authoritative trade history.

### FR-005 Asset Allocation Breakdown
- Component `AssetAllocationBreakdown`:
  - Visual allocation bars and badges indicating percentage of equity in Cash vs. each holding.
  - Informative empty state when portfolio holds 100% cash and 0 open positions.

### FR-006 Equity Trend Viewer
- Component `EquityTrendViewer`:
  - Visual and tabular tracking of equity progression across simulation market cycles and completed trade checkpoints.

### FR-007 Regulatory Disclaimers & Authority Notice
- Component `SimulationDisclosureBanner`:
  - Mandatory virtual capital notice: "Simulated execution only • Virtual funds • No real capital at risk".
  - Authority notice: "All portfolio balances, valuations, and performance metrics are server-authoritative facts. Client UI displays do not confer financial authority."

### FR-008 Async State Matrix & Non-Functional Resilience
- Component `PortfolioPage`:
  - Loading: Accessible skeleton states while resolving sessions or valuation.
  - Empty: Friendly prompt when no active simulation session exists, with direct link to launch or select a session.
  - Auth-required: Protected redirect to `/login` with `returnTo=/portfolio`.
  - Error: Inline error banner with explicit "Retry" action.
  - Success: Full analytical dashboard layout.
  - Responsive: Full layout integrity from 320px mobile to desktop.

## 3. State and Error Contract

Every networked view must distinguish loading, success, empty where meaningful, authentication-required, authorization-denied, not-found, and generic failure. UI copy must be safe, bounded, and must not expose stack traces, database details, secrets, or sensitive tokens.

## 4. Data and Authority Contract

ZERO database or migration changes. Browser state and query caches are presentation mechanisms only. Server denials and owning-domain facts override stale client state.

## 5. Quality Gate

All ACs must pass, targeted tests must be deterministic, relevant earlier-phase regressions and repository checks must remain green, exact-source CI must succeed, and there must be no open P0/P1.
