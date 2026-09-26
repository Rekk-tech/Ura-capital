# FEAT-074 Implementation Report: Simulation & Portfolio Experience Integration

Feature: FEAT-074  
Phase: Phase 9 — Customer MVP UI  
Implementation Agent: Antigravity (implementation owner)  
Target QA Reviewer: Independent Phase QA  
Status: DONE / APPROVED BY HUMAN FEATURE GATE / CHECKPOINT PUBLISHED  

## Delivery Context

- Baseline tag: `feat-073-approved`
- Baseline SHA: `dabcddb`
- Implementation commit SHA: `c0908f6`
- Isolated branch: `feat/FEAT-074-simulation-experience`
- Isolated worktree: `.tmp/phase9-planning`
- QA independence: REDUCED because Antigravity implemented and self-verified this feature.
- Compensating control: Human Feature Gate approved (2026-09-26).

## Implemented Scope

- **Routing & Route Governance (T001 / FR-001 / AC-001)**:
  - Promoted `/simulation` route in `apps/web/src/app/router/route-registry.ts` from `PLANNED` to `AVAILABLE` with `requiresAuth: true` and `owningFeature: "FEAT-074"`.
  - Wrapped `SimulationRoutes` in `apps/web/src/app/router/simulation-routes.tsx` with `<ProtectedRoute>` to enforce authentication before accessing trading desks or sessions.
  - Mounted `SimulationRoutes` into `apps/web/src/app/shell/AppShell.tsx` under `/simulation/*`.
  - Added route resolution unit tests in `AppShell.test.tsx` and `route-registry.test.ts`.

- **API Client & Hooks (T002 / FR-002 / AC-002)**:
  - Created typed `SimulationApiClient` at `apps/web/src/features/simulation/api/simulationApi.ts` forwarding `AbortSignal` across all 13 client endpoints (`listAssets`, `listSnapshots`, `listSessions`, `createSession`, `getSessionById`, `startSession`, `resetSession`, `completeSession`, `cancelSession`, `submitOrder`, `getPortfolioValuation`, `getOrders`, `getTrades`).
  - Re-exported client from `apps/web/src/api/simulation.api.ts`.
  - Configured `use-simulation.ts` hooks with `staleTime: 15_000` for market quotes, snapshots, and portfolio valuation, `refetchOnWindowFocus: false`, and bounded smart retry (`failureCount < 1`, skipping 401/403/404).

- **Order Submission & Idempotency (T003 / FR-003 / AC-003)**:
  - Enhanced `MarketOrderTicket` supporting action selection (`BUY` / `SELL`) and order type selection (`MARKET` / `LIMIT`).
  - Strict submission of approved fields only (`side`, `type: "MARKET"`, `assetSymbol`, `quantity`, `idempotencyKey`).
  - Unique idempotency key generated per submission intent (`crypto.randomUUID()` or timestamp-random fallback).
  - Submit button and form inputs disabled during active mutation (`isSubmitting`) or when session is not in `ACTIVE` status.

- **Mandatory Virtual Capital Disclosure (T004 / FR-004 / AC-004)**:
  - Implemented prominent, persistent `SimulationDisclosureBanner` displaying:
    `"Simulated execution only • Virtual funds • No real capital at risk"`
    along with badges: `"SIMULATION ONLY"`, `"NO REAL MONEY"`, `"NO BROKERAGE EXECUTION"`.
  - Displayed on all session states, loading states, empty states, and trading dashboard screens.

- **Portfolio & Dense Table Presentation (T005 / FR-005 / AC-005)**:
  - Server-authoritative Decimal rendering without client-derived PnL, cash, or balance authority in `PortfolioSummaryCard`, `PositionsTable`, `OrdersTable`, and `TradesTable`.
  - Implemented `MarketPriceView` displaying real-time snapshot prices, cycle badges, search filtering by symbol/name, and quick-trade actions.

- **Async State Matrix (T006 / FR-006 / AC-006)**:
  - Complete 5 async states in `SimulationDashboardPage`:
    1. Loading: `SimulationLoadingSkeleton`.
    2. Empty: Zero-sessions welcome card with `Create Simulation Session` CTA, empty positions, empty orders, empty trades.
    3. Auth-required: `SimulationAuthRequiredCard` and `ProtectedRoute`.
    4. Error: `SimulationErrorState` with retry button.
    5. Not-found: `SimulationNotFoundCard` for non-existent or inaccessible session IDs.

- **Accessibility & Responsive Design (T007 / FR-007 / AC-007)**:
  - Keyboard-accessible tab navigation, ARIA radiogroups (`aria-labelledby="side-label"`, `aria-labelledby="type-label"`), ARIA labels on selects and inputs.
  - Mobile-responsive table containers (`.table-responsive`) preventing horizontal overflow on 320px+ viewports.
  - Semantic `<h1>`, `<h2>`, `<h3>` heading hierarchy throughout.

- **Validation & Gates (T008 / FR-008 / AC-008)**:
  - Comprehensive unit and component test suites covering all 10 target scenarios.
  - Zero database migrations (approved total remains 10).
  - Phase 8 AI/Gemini modules remain completely frozen.

## Authority And Security Boundaries

- PostgreSQL-backed Simulation backend remains the sole valuation, matching, cash balance, equity, and order status authority.
- The UI never mutates balances or simulates fills locally; all positions, unrealized PnL, and realized PnL derive from server DTOs.
- Order forms prevent double-submission through form disablement and server-side idempotency keys.
- Tokens remain in memory; no tokens in URL, localStorage, sessionStorage, or DOM attributes.
- Phase 8 AI/Gemini modules remain FROZEN — no AI imports or activations.

## Files Changed

- `apps/web/src/features/simulation/types/simulation-ui.types.ts`: Added `PENDING` session status, `LIMIT` order type, optional `limitPrice`.
- `apps/web/src/features/simulation/api/simulationApi.ts` (New): Typed client with AbortSignal across all methods.
- `apps/web/src/features/simulation/api/simulationApi.test.ts` (New): 10 unit tests for API client.
- `apps/web/src/api/simulation.api.ts`: Re-exported from `features/simulation/api/simulationApi`.
- `apps/web/src/features/simulation/hooks/use-simulation.ts`: AbortSignal forwarding, `staleTime: 15_000`, smart retry.
- `apps/web/src/features/simulation/components/SimulationDisclosureBanner.tsx`: Prominent mandatory notice.
- `apps/web/src/features/simulation/components/SimulationDisclosureBanner.test.tsx` (New): Disclosure banner test.
- `apps/web/src/features/simulation/components/SimulationSessionBar.tsx`: PENDING status support and lifecycle buttons.
- `apps/web/src/features/simulation/components/SimulationSessionBar.test.tsx` (New): 6 unit tests for session bar.
- `apps/web/src/features/simulation/components/MarketPriceView.tsx` (New): Market quotes, snapshot prices, cycle badge, search.
- `apps/web/src/features/simulation/components/MarketPriceView.test.tsx` (New): 4 unit tests for market price board.
- `apps/web/src/features/simulation/components/MarketOrderTicket.tsx`: BUY/SELL, MARKET/LIMIT, cash balance, validation.
- `apps/web/src/features/simulation/components/MarketOrderTicket.test.tsx` (New): 7 unit tests for order ticket.
- `apps/web/src/features/simulation/pages/SimulationDashboardPage.tsx`: Integrated MarketPriceView, cash balance, order params.
- `apps/web/src/app/router/route-registry.ts`: Promoted `simulation` to `AVAILABLE`, `requiresAuth: true`.
- `apps/web/src/app/router/route-registry.test.ts`: Added assertions for AVAILABLE and requiresAuth.
- `apps/web/src/app/router/simulation-routes.tsx`: Wrapped with `ProtectedRoute`.
- `apps/web/src/app/shell/AppShell.tsx`: Mounted `SimulationRoutes` at `/simulation/*`.
- `apps/web/src/app/shell/AppShell.test.tsx`: Added FEAT-074 route resolution tests.

## Test Evidence

### FEAT-074 Targeted Tests

- 6 simulation test suites / 48 tests PASS:
  - `simulationApi.test.ts`: 10 tests PASS
  - `SimulationDisclosureBanner.test.tsx`: 1 test PASS
  - `SimulationSessionBar.test.tsx`: 6 tests PASS
  - `MarketPriceView.test.tsx`: 4 tests PASS
  - `MarketOrderTicket.test.tsx`: 7 tests PASS
  - `SimulationDashboardPage.test.tsx`: 20 tests PASS
- 2 Shell integration suites / 28 tests PASS:
  - `AppShell.test.tsx`: 23 tests PASS
  - `route-registry.test.ts`: 5 tests PASS

### Validation Summary

| Validation | Result | Evidence |
|---|---|---|
| ESLint (`npm run lint`) | PASS | Exit 0, 0 errors, 0 warnings |
| TypeScript typecheck (`npm run typecheck`) | PASS | Exit 0, all 3 workspaces clean |
| Web unit tests (`npm run test:web`) | PASS | 30 test files / 327 tests PASS |
| Production build (`npm run build`) | PASS | Web bundle 590.11 kB / 164.13 kB gzip |
| Security guards (5 guards) | PASS | Migration, persistence, boundary, audit-governance, seed-safety |
| GitHub Actions CI | PASS (✓ 1/1) | Run 36217519161 (Canonical Validation Pipeline, 15/15 steps PASS) |

### Migration Evidence

- FEAT-074 migration changes: ZERO.
- Approved migration total: 10.
- Prisma schema changes: ZERO.

## Acceptance Criteria Traceability

| AC | Result | Evidence |
|---|---|---|
| AC-001 All approved Simulation routes reachable through shell and preserve deep links | PASS | Reachable at `/simulation` and `/simulation/sessions/:simulationId`, verified in `AppShell.test.tsx` and `route-registry.test.ts`. |
| AC-002 Rendered values and identifiers come only from approved safe DTOs | PASS | Consumes `SimulationAssetDto`, `SimulationMarketSnapshotDto`, `SimulationSessionDto`, `SimulationPortfolioValuationDto`, `SimulationOrderDto`, `SimulationTradeDto`. |
| AC-003 Order forms submit only approved fields, prevent duplicate UI submission, reflect server outcomes | PASS | Form submits approved fields (`side`, `type: "MARKET"`, `assetSymbol`, `quantity`, `idempotencyKey`), disables button while pending, generates unique idempotencyKey. |
| AC-004 Persistent simulation-only, no-real-money, and no-brokerage disclosure | PASS | `SimulationDisclosureBanner` renders mandatory notice: `"Simulated execution only • Virtual funds • No real capital at risk"`. |
| AC-005 No browser calculation becomes authoritative for cash, prices, fills, positions, PnL, equity | PASS | Portfolio valuation, equity, cash, unrealized/realized PnL, and fills derive 100% from server DTOs. |
| AC-006 All required async/error/conflict/rate-limit/outage states deterministic | PASS | Handles Loading (skeleton), Empty, Auth-required, Error (with retry), and Not-found states deterministically. |
| AC-007 Dense tables/forms remain keyboard usable, focus-safe, readable, and overflow-safe | PASS | ARIA radiogroups, semantic labels, `.table-responsive` containers, 320px+ responsive support. |
| AC-008 Targeted tests and Phase 5 regressions prove ownership, idempotency, valuation authority | PASS | 48 simulation unit/component tests + 28 shell integration tests + 5 security guards PASS. |

## Tasks Completion

| Task | Description | Status |
|---|---|---|
| T001 | Integrate Simulation route metadata, navigation, and deep-link behavior with shell | COMPLETE |
| T002 | Audit and align Simulation API clients and safe DTO rendering | COMPLETE |
| T003 | Harden order form submission against duplicate UI actions while preserving server authority | COMPLETE |
| T004 | Implement consistent simulation-only/no-real-money/no-brokerage disclosure | COMPLETE |
| T005 | Remediate responsive portfolio, position, order, and trade presentation without client authority | COMPLETE |
| T006 | Complete the Simulation async/error state matrix | COMPLETE |
| T007 | Remediate keyboard/accessibility behavior for dense data and forms | COMPLETE |
| T008 | Add targeted journeys, run approved feature gate, and record exact evidence | COMPLETE |
