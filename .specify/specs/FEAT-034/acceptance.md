# FEAT-034 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | Durable accounting uses Decimal/NUMERIC and approved rounding. | CRITICAL HARD GATE |
| AC-002 | Portfolio state is server-authoritative current state. | CRITICAL HARD GATE |
| AC-003 | Position state is server-authoritative current state. | CRITICAL HARD GATE |
| AC-004 | BUY average cost excludes fees because fee = 0. | CRITICAL HARD GATE |
| AC-005 | SELL realized PnL uses `(executionPrice - averageCost) * quantity`. | CRITICAL HARD GATE |
| AC-006 | Current market value uses current authoritative snapshot price. | CRITICAL HARD GATE |
| AC-007 | Unrealized PnL is server-computed. | CRITICAL HARD GATE |
| AC-008 | Equity is server-computed. | CRITICAL HARD GATE |
| AC-009 | Negative cash is rejected. | CRITICAL HARD GATE |
| AC-010 | Negative positions are rejected while shorting is deferred. | CRITICAL HARD GATE |
| AC-011 | NaN/Infinity are rejected. | CRITICAL HARD GATE |
| AC-012 | Negative zero is rejected or normalized before persistence. | CRITICAL HARD GATE |
| AC-013 | Scientific notation in public request payloads is rejected. | PASS |
| AC-014 | Precision/overflow abuse is rejected safely. | CRITICAL HARD GATE |
| AC-015 | Reconciliation from trades to materialized state is tested where practical. | CRITICAL HARD GATE |
| AC-016 | Client/frontend calculations are not authoritative. | CRITICAL HARD GATE |
| AC-017 | Forced accounting failure rolls back transaction-scoped mutations. | CRITICAL HARD GATE |
| AC-018 | Historical valuation chart/table/API is not introduced. | CRITICAL HARD GATE |
| AC-019 | FEAT-031..033 regressions remain green. | CRITICAL HARD GATE |
| AC-020 | Live PostgreSQL tests cover constraints and rollback. | CRITICAL HARD GATE |
| AC-021 | Canonical guards pass. | CRITICAL HARD GATE |
| AC-022 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
