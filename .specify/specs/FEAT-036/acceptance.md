# FEAT-036 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | FEAT-035 safety contract is present before FEAT-036 starts. | CRITICAL HARD GATE |
| AC-002 | Same-key concurrent identical requests result in one mutation and replayed result. | CRITICAL HARD GATE |
| AC-003 | Same-key concurrent conflicting requests return deterministic conflict. | CRITICAL HARD GATE |
| AC-004 | Retry after committed transport failure returns original result. | CRITICAL HARD GATE |
| AC-005 | Concurrent distinct BUY stress cannot overspend. | CRITICAL HARD GATE |
| AC-006 | Concurrent distinct SELL stress cannot oversell. | CRITICAL HARD GATE |
| AC-007 | Duplicate database conflict path is safe and deterministic. | CRITICAL HARD GATE |
| AC-008 | Lock ordering is documented and tested. | CRITICAL HARD GATE |
| AC-009 | Deadlock/unavailable DB diagnostics are sanitized. | CRITICAL HARD GATE |
| AC-010 | No SQL, credentials, URLs, tokens, cookies, or local sensitive paths leak. | CRITICAL HARD GATE |
| AC-011 | Redis is not final idempotency or order authority. | CRITICAL HARD GATE |
| AC-012 | FEAT-035 request and response DTOs remain unchanged unless explicitly approved. | PASS |
| AC-013 | No new product behavior or order type is introduced. | PASS |
| AC-014 | Live PostgreSQL high-contention tests pass without mandatory skips. | CRITICAL HARD GATE |
| AC-015 | FEAT-031..035 regressions remain green. | CRITICAL HARD GATE |
| AC-016 | Canonical validation and guards pass. | CRITICAL HARD GATE |
| AC-017 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
| AC-018 | FEAT-036 evidence distinguishes hardening from first-pass implementation. | CRITICAL HARD GATE |
