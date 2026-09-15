# FEAT-039 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | Session IDOR is blocked. | CRITICAL HARD GATE |
| AC-002 | Portfolio/position/order/trade/current valuation IDOR is blocked. | CRITICAL HARD GATE |
| AC-003 | Safe non-enumerating errors are preserved where appropriate. | PASS |
| AC-004 | Client price/cash/position/PnL/status/cycle/user tampering is rejected. | CRITICAL HARD GATE |
| AC-005 | Numeric abuse inputs are rejected safely. | CRITICAL HARD GATE |
| AC-006 | Idempotency and concurrency protections remain green. | CRITICAL HARD GATE |
| AC-007 | Order submission rate limit is 60 requests / 10 minutes per authenticated user. | CRITICAL HARD GATE |
| AC-008 | Rate-limit response is safe `429 TOO_MANY_REQUESTS` with `Retry-After`. | PASS |
| AC-009 | Rate-limited request causes zero Simulation business mutation. | CRITICAL HARD GATE |
| AC-010 | Redis stores transient counters only and is not business authority. | CRITICAL HARD GATE |
| AC-011 | Durable Simulation product audit deferral and accepted risk are documented. | CRITICAL HARD GATE |
| AC-012 | No product audit table is introduced. | CRITICAL HARD GATE |
| AC-013 | No product audit migration/API/UI is introduced. | CRITICAL HARD GATE |
| AC-014 | No Simulation product-event persistence is introduced. | CRITICAL HARD GATE |
| AC-015 | `AuthSecurityAuditRecord` is not reused. | CRITICAL HARD GATE |
| AC-016 | No admin/support Simulation API exists. | PASS |
| AC-017 | No Phase 6/7 behavior is introduced. | PASS |
| AC-018 | Real-money/brokerage hard boundary remains intact. | CRITICAL HARD GATE |
| AC-019 | Rate-limit diagnostics do not leak Redis keys/secrets/URLs. | CRITICAL HARD GATE |
| AC-020 | Audit-governance guard passes. | CRITICAL HARD GATE |
| AC-021 | Redis tests pass if limiter uses Redis. | CRITICAL HARD GATE |
| AC-022 | FEAT-031..038 regressions remain green. | CRITICAL HARD GATE |
| AC-023 | Canonical validation passes. | CRITICAL HARD GATE |
| AC-024 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
