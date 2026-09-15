# FEAT-037 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | No historical valuation table is introduced. | CRITICAL HARD GATE |
| AC-002 | No historical valuation chart/history API is introduced. | CRITICAL HARD GATE |
| AC-003 | Current portfolio read returns cash and positions. | PASS |
| AC-004 | Current market value uses current authoritative snapshot price. | CRITICAL HARD GATE |
| AC-005 | Current realized PnL is server-derived from trades. | CRITICAL HARD GATE |
| AC-006 | Current unrealized PnL is server-computed. | CRITICAL HARD GATE |
| AC-007 | Current equity is server-computed. | CRITICAL HARD GATE |
| AC-008 | Orders/trades reads are owner-only. | CRITICAL HARD GATE |
| AC-009 | Foreign user cannot read private valuation state. | CRITICAL HARD GATE |
| AC-010 | GET reads do not mutate portfolio/order/market state. | CRITICAL HARD GATE |
| AC-011 | Decimal values serialize as strings. | PASS |
| AC-012 | DTOs include `simulated: true`. | PASS |
| AC-013 | Redis is not valuation authority. | CRITICAL HARD GATE |
| AC-014 | FEAT-031..036 regressions remain green. | CRITICAL HARD GATE |
| AC-015 | Canonical validation passes. | CRITICAL HARD GATE |
| AC-016 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
