# FEAT-040 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | FEAT-031..039 reports/checkpoints are present and truthful. | CRITICAL HARD GATE |
| AC-002 | Fresh zero-state migration deploy/status passes. | CRITICAL HARD GATE |
| AC-003 | Upgrade from approved Phase 4 baseline preserves prior rows, relationships, constraints, and migration history. | CRITICAL HARD GATE |
| AC-004 | Canonical validation passes with no mandatory skips. | CRITICAL HARD GATE |
| AC-005 | User can create, start, complete, and reset a Simulation session. | PASS |
| AC-006 | User can read approved fixed mock assets and current market snapshots. | PASS |
| AC-007 | User can place valid BUY and SELL MARKET orders. | PASS |
| AC-008 | Reset cancels current session and creates a new `CREATED` session without deleting history. | CRITICAL HARD GATE |
| AC-009 | Client cannot control price, cash, position, PnL, scenario cycle, lifecycle status, or user authority. | CRITICAL HARD GATE |
| AC-010 | Insufficient cash is rejected. | CRITICAL HARD GATE |
| AC-011 | Oversell is rejected. | CRITICAL HARD GATE |
| AC-012 | Idempotent replay with same fingerprint returns the original result without duplicate mutation. | CRITICAL HARD GATE |
| AC-013 | Same idempotency key with different payload returns `409 IDEMPOTENCY_CONFLICT`. | CRITICAL HARD GATE |
| AC-014 | Concurrent BUY and SELL attempts cannot overspend, oversell, or corrupt portfolio state. | CRITICAL HARD GATE |
| AC-015 | User A cannot access User B sessions, portfolio, positions, orders, trades, or valuation. | CRITICAL HARD GATE |
| AC-016 | Numeric abuse inputs are rejected safely. | CRITICAL HARD GATE |
| AC-017 | Safe errors contain no Prisma, SQL, secret, token, Redis, or sensitive path leakage. | CRITICAL HARD GATE |
| AC-018 | Redis stores transient counters only and is not Simulation business authority. | CRITICAL HARD GATE |
| AC-019 | Order rate limiting follows FEAT-039 and returns safe `429 TOO_MANY_REQUESTS` with `Retry-After`. | CRITICAL HARD GATE |
| AC-020 | Durable Simulation product audit remains deferred and accepted risk is documented. | CRITICAL HARD GATE |
| AC-021 | `AuthSecurityAuditRecord` is not reused for Simulation product events. | CRITICAL HARD GATE |
| AC-022 | Frontend critical journey works and labels all trading data as simulated / not financial advice. | PASS |
| AC-023 | Phase 1-4 regression remains green. | CRITICAL HARD GATE |
| AC-024 | No Phase 6 or Phase 7 behavior is introduced. | CRITICAL HARD GATE |
| AC-025 | No real-money, brokerage, external provider, crypto, options, margin, short, leaderboard, or competition behavior is introduced. | CRITICAL HARD GATE |
| AC-026 | Phase 5 QA report is created at `reports/qa/phase-5/PHASE-5-QA.md`. | CRITICAL HARD GATE |
| AC-027 | Final verdict follows PASS / CONDITIONAL PASS / FAIL policy. | CRITICAL HARD GATE |
| AC-028 | CONDITIONAL PASS is not used for any security, integrity, migration, DB, transaction, order/accounting, Redis, audit misuse, or mandatory-validation failure. | CRITICAL HARD GATE |
