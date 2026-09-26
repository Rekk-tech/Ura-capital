# FEAT-075 Requirement: Portfolio & Financial Valuation UI

Status: APPROVED FOR IMPLEMENTATION / IN_PROGRESS
Phase: Phase 9 - UI Integration & Product Polish
Type: Implementation feature
Planning Owner: Antigravity

## Goal

Deliver the dedicated, server-authoritative Portfolio & Financial Valuation experience (`/portfolio`), enabling learners to analyze total equity, cash ratio, asset allocation breakdown, realized/unrealized PnL analytics, and equity curve trends across simulation market cycles while preserving strict server financial authority, zero database migrations, and mandatory simulated capital disclaimers.

## Functional Requirements

- FR-001 Route Governance & Shell Integration: Promote `/portfolio` route in `route-registry.ts` to `AVAILABLE`, enforce `requiresAuth: true`, and integrate into `AppShell.tsx` protected by `<ProtectedRoute>`.
- FR-002 API Client & TanStack Query Hooks: Provide robust portfolio and trade analytics fetch methods forwarding native `AbortSignal`, configured with `staleTime: 15_000`, `refetchOnWindowFocus: false`, and bounded smart retry (skipping 401/403/404).
- FR-003 Portfolio Equity Summary: Render Total Portfolio Equity, Cash Balance, Position Market Value, Total Cost Basis, and Net Asset Value (NAV) with exact Decimal precision matching server DTOs without browser rounding errors.
- FR-004 PnL & Performance Analytics: Provide breakdown of Realized PnL vs. Unrealized PnL, return rate (ROI), and Win/Loss metrics derived strictly from authoritative server trade history and valuation DTOs.
- FR-005 Asset Allocation Breakdown: Provide accessible visual breakdown (progress bars, allocation percentages, asset badges) across holdings, including an explicit 100% cash empty state when no positions are open.
- FR-006 Equity Trend Progression: Track historical equity progression across simulation market cycles and completed trades without client-side financial recalculation.
- FR-007 Regulatory Disclaimers & Financial Authority Notice: Prominently render mandatory virtual capital notices ("Simulated execution only • Virtual funds • No real capital at risk") and server-authority statements.
- FR-008 Async State Matrix & Non-Functional Resilience: Handle all 5 async UI states (Loading skeleton, Empty state, Auth-required redirect, Error with retry, Success), responsive down to 320px+, keyboard-accessible, and 0 database migrations.

## Non-Functional Requirements

- NFR-001 Server-Authoritative Financials: Client UI never calculates cash, positions, equity, or PnL as financial authority; all values derive directly from server DTOs.
- NFR-002 Responsive Design: Fully responsive across 320px mobile up to ultrawide desktop without horizontal overflow or layout breakage.
- NFR-003 Accessibility Baseline: Semantic HTML, ARIA progressbar/status attributes, keyboard focus management, contrast compliant, and support for `prefers-reduced-motion`.
- NFR-004 Zero Database Migrations: Retain approved 10 migrations total; zero Prisma schema changes or DB mutations.
- NFR-005 Deterministic Test Coverage: Unit and component test suites covering formatting, state matrix, and route navigation with 100% pass rate.

## Dependencies

- FEAT-070: Shell navigation & route registry.
- FEAT-071: Authentication provider & ProtectedRoute.
- FEAT-074: Simulation session lifecycle & accounting endpoints.

## Scope Boundary

Owns the dedicated `/portfolio` experience and portfolio analytics presentation. Excludes live brokerage execution, real currency deposits/withdrawals, AI recommendations (Phase 8 frozen), and database schema changes.
