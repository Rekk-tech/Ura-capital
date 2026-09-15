# FEAT-035 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | Route is `POST /api/simulation/sessions/:simulationId/orders`. | PASS |
| AC-002 | Request body contains only side/type/assetSymbol/quantity/idempotencyKey. | CRITICAL HARD GATE |
| AC-003 | MARKET is the only supported order type. | CRITICAL HARD GATE |
| AC-004 | Whole-share positive integer quantity is enforced. | CRITICAL HARD GATE |
| AC-005 | Canonical request fingerprint is deterministic. | CRITICAL HARD GATE |
| AC-006 | PostgreSQL unique constraint enforces `userId + simulationId + idempotencyKey`. | CRITICAL HARD GATE |
| AC-007 | Same key + same payload returns original result without duplicate mutation. | CRITICAL HARD GATE |
| AC-008 | Same key + different payload returns `409 IDEMPOTENCY_CONFLICT`. | CRITICAL HARD GATE |
| AC-009 | Execution price is current authoritative market snapshot price. | CRITICAL HARD GATE |
| AC-010 | Valid BUY writes order/trade/cash/position atomically. | CRITICAL HARD GATE |
| AC-011 | BUY rejects insufficient cash. | CRITICAL HARD GATE |
| AC-012 | Concurrent BUY cannot overspend. | CRITICAL HARD GATE |
| AC-013 | Valid SELL writes order/trade/cash/position/realized PnL atomically. | CRITICAL HARD GATE |
| AC-014 | SELL rejects quantity greater than owned position. | CRITICAL HARD GATE |
| AC-015 | Concurrent SELL cannot oversell. | CRITICAL HARD GATE |
| AC-016 | Response DTO is safe, deterministic, decimal-string serialized, and `simulated: true`. | PASS |
| AC-017 | Unapproved authority fields return `400 VALIDATION_ERROR`. | CRITICAL HARD GATE |
| AC-018 | Forced failure leaves no partial order/trade/accounting mutation. | CRITICAL HARD GATE |
| AC-019 | Redis is not idempotency/order/portfolio authority. | CRITICAL HARD GATE |
| AC-020 | Minimum row-locking strategy is documented and DB-tested. | CRITICAL HARD GATE |
| AC-021 | PostgreSQL constraints prevent negative cash/positions. | CRITICAL HARD GATE |
| AC-022 | Limit/stop orders are absent. | PASS |
| AC-023 | Short selling/margin/leverage/fractional quantity remain absent. | CRITICAL HARD GATE |
| AC-024 | External market/brokerage/real-money behavior is absent. | CRITICAL HARD GATE |
| AC-025 | Product audit persistence is not introduced. | CRITICAL HARD GATE |
| AC-026 | FEAT-031..034 regressions remain green. | CRITICAL HARD GATE |
| AC-027 | Canonical validation and guards pass. | CRITICAL HARD GATE |
| AC-028 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
