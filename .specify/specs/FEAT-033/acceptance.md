# FEAT-033 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | Strict schema rejects userId/status/cash/currentCycle/scenario/timestamp/portfolio authority fields. | CRITICAL HARD GATE |
| AC-002 | Authenticated user can create a `CREATED` session bound to default scenario and `currentCycle = 1`. | CRITICAL HARD GATE |
| AC-003 | Users can list/read only their own sessions. | CRITICAL HARD GATE |
| AC-004 | Valid start transitions `CREATED -> ACTIVE`. | PASS |
| AC-005 | PostgreSQL enforces at most one ACTIVE session per user. | CRITICAL HARD GATE |
| AC-006 | Concurrent starts do not create two active sessions. | CRITICAL HARD GATE |
| AC-007 | Explicit learner completion transitions `ACTIVE -> COMPLETED`. | PASS |
| AC-008 | Cancel supports `CREATED/ACTIVE -> CANCELLED`. | PASS |
| AC-009 | Reset cancels old session and creates new `CREATED` session without deleting history. | CRITICAL HARD GATE |
| AC-010 | Foreign session access is denied safely. | CRITICAL HARD GATE |
| AC-011 | Unknown/foreign errors do not disclose private resource existence where applicable. | PASS |
| AC-012 | No order execution is introduced. | CRITICAL HARD GATE |
| AC-013 | No admin/support visibility is introduced. | PASS |
| AC-014 | No real-money or brokerage behavior is introduced. | CRITICAL HARD GATE |
| AC-015 | PostgreSQL remains session authority; Redis is not durable. | CRITICAL HARD GATE |
| AC-016 | FEAT-031 regressions remain green. | CRITICAL HARD GATE |
| AC-017 | Unit and live DB tests cover lifecycle and reset. | PASS |
| AC-018 | Canonical guards pass. | CRITICAL HARD GATE |
| AC-019 | No Phase 6/7 behavior is introduced. | PASS |
| AC-020 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
