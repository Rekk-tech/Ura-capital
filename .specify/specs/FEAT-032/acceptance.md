# FEAT-032 Acceptance Criteria

| AC | Criterion | Gate |
| --- | --- | --- |
| AC-001 | `GET /api/simulation/assets` requires authentication and returns approved mock equities. | CRITICAL HARD GATE |
| AC-002 | `GET /api/simulation/scenarios/:scenarioKey/snapshots/:cycle` requires authentication and returns persisted snapshots. | CRITICAL HARD GATE |
| AC-003 | `cycle` must be a positive integer and scenario key must be validated. | PASS |
| AC-004 | Asset DTO uses stable symbol and does not expose internal scenario IDs. | PASS |
| AC-005 | Snapshot DTO serializes Decimal price as string and includes `simulated: true`. | CRITICAL HARD GATE |
| AC-006 | GET routes do not mutate assets, snapshots, sessions, cycles, orders, or portfolio state. | CRITICAL HARD GATE |
| AC-007 | Client cannot provide authoritative price/cycle/scenario/availability. | CRITICAL HARD GATE |
| AC-008 | Missing/archived assets or snapshots return safe errors. | PASS |
| AC-009 | No session-scoped read behavior is introduced in FEAT-032. | CRITICAL HARD GATE |
| AC-010 | No external market provider or live feed is introduced. | CRITICAL HARD GATE |
| AC-011 | Crypto/options/derivatives remain out of scope. | CRITICAL HARD GATE |
| AC-012 | Redis is not price authority. | CRITICAL HARD GATE |
| AC-013 | FEAT-031 regressions remain green. | CRITICAL HARD GATE |
| AC-014 | Unit/API/DB tests cover the read model. | PASS |
| AC-015 | Canonical guards pass. | CRITICAL HARD GATE |
| AC-016 | Implementation report is complete and truthful. | CRITICAL HARD GATE |
