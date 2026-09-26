# FEAT-075 Tasks: Portfolio & Financial Valuation UI

Status: APPROVED FOR IMPLEMENTATION / IN_PROGRESS

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Promote `/portfolio` route to AVAILABLE, requiresAuth in route-registry, and integrate into AppShell with ProtectedRoute. | FR-001 | AC-001 | TODO |
| T002 | Audit and configure portfolio and trade query hooks in use-simulation.ts / use-portfolio.ts with AbortSignal and TanStack options. | FR-002 | AC-002 | TODO |
| T003 | Implement PortfolioEquitySummary with exact Decimal formatting and zero floating-point error. | FR-003 | AC-003 | TODO |
| T004 | Implement PnLAnalyticsCard with Realized/Unrealized PnL breakdown and trade win/loss metrics. | FR-004 | AC-004 | TODO |
| T005 | Implement AssetAllocationBreakdown with visual percentages and 100% cash empty state. | FR-005 | AC-005 | TODO |
| T006 | Implement EquityTrendViewer for cycle and trade progression tracking. | FR-006 | AC-006 | TODO |
| T007 | Implement PortfolioPage unifying analytical components with 5 async states and mandatory regulatory disclaimers. | FR-007, FR-008 | AC-007, AC-008 | TODO |
| T008 | Add targeted test suites (unit, component, accessibility, route integration) and run canonical quality gate. | FR-008 | AC-008 | TODO |

## Dependency Order

T001 establishes the route contract. T002 establishes data contracts. T003-T006 build analytical presentation components. T007 integrates components into the dashboard page with async error matrix. T008 closes validation with test suites and feature gate.

## Traceability Rule

No task may be marked complete without evidence for its mapped FR and AC.
