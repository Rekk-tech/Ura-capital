# FEAT-075 Acceptance Criteria: Portfolio & Financial Valuation UI

Status: APPROVED FOR IMPLEMENTATION / IN_PROGRESS

- AC-001 `/portfolio` is reachable via AppShell navigation, deep links preserve path, and unauthenticated requests safely redirect to `/login?returnTo=%2Fportfolio`.
- AC-002 Portfolio and trade queries pass native `AbortSignal`, configure `staleTime: 15_000`, disable `refetchOnWindowFocus`, and use smart bounded retry.
- AC-003 `PortfolioEquitySummary` accurately renders Total Equity, Cash Balance, Position Market Value, Cost Basis, and NAV directly from server DTOs with exact Decimal formatting.
- AC-004 `PnLAnalyticsCard` displays authoritative Realized PnL, Unrealized PnL, ROI percentage, and trade win/loss distribution without client accounting overrides.
- AC-005 `AssetAllocationBreakdown` displays visual proportion bars and asset weights, with an explicit 100% cash empty state when no positions are open.
- AC-006 `EquityTrendViewer` reflects equity changes across simulation cycles and trade milestones deterministically.
- AC-007 Mandatory regulatory notice ("Simulated execution only • Virtual funds • No real capital at risk") and server-authority notice are prominently and persistently displayed.
- AC-008 All 5 async states (Loading, Empty, Auth-required, Error with Retry, Success) are deterministic, responsive down to 320px+, accessible, with zero database migrations and all checks green.

## Traceability Matrix

| Requirement | Task | Acceptance |
|---|---|---|
| FR-001 | T001 | AC-001 |
| FR-002 | T002 | AC-002 |
| FR-003 | T003 | AC-003 |
| FR-004 | T004 | AC-004 |
| FR-005 | T005 | AC-005 |
| FR-006 | T006 | AC-006 |
| FR-007 | T007 | AC-007 |
| FR-008 | T007, T008 | AC-008 |

## Verdict Rule

PASS requires AC-001 through AC-008 with no mandatory skip, zero P0/P1 defects, zero DB migrations, and exact-source CI green.
