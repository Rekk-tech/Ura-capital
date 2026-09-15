# FEAT-040 Spec: Phase 5 Simulation Integration Gate

## Scope

FEAT-040 validates the complete Phase 5 Simulation Engine integration across FEAT-031 through FEAT-039.

It verifies:

- exact FEAT-031 Simulation schema and migration compatibility
- fixed mock asset universe and deterministic persisted market snapshots
- server-controlled scenario cycles
- session lifecycle and at-most-one-current-session policy
- reset behavior that cancels current history and creates a new `CREATED` session
- portfolio and position accounting
- market order execution at authoritative snapshot price
- idempotency and concurrency safety
- current-only valuation
- learner UI critical journey
- owner-scoped authorization and safe errors
- order rate limiting using Redis transient counters only
- audit deferral and no `AuthSecurityAuditRecord` misuse
- Phase 1-4 regression preservation

## Required End-to-End Flows

1. Register/login or use approved seeded/authenticated user.
2. Create Simulation session.
3. Start session and receive initial cash/portfolio state.
4. Read approved assets and current cycle snapshot.
5. Submit BUY market order.
6. Re-submit same idempotency key/fingerprint and receive original result.
7. Submit conflicting payload with same idempotency key and receive `409 IDEMPOTENCY_CONFLICT`.
8. Submit invalid client-authority fields and receive `400 VALIDATION_ERROR`.
9. Submit SELL market order within position quantity.
10. Reject insufficient cash and oversell.
11. Compute current valuation from current authoritative snapshot.
12. Complete session through explicit learner action.
13. Reset session and verify old session is cancelled, not deleted.
14. Verify another user cannot access the session, portfolio, orders, trades, or valuation.

## Validation Databases

FEAT-040 must use independent QA databases for:

- fresh zero-state migration validation
- approved Phase 4 baseline upgrade validation

Upgrade validation must preserve representative Phase 1-4 rows, relationships, constraints, and migration history while adding Phase 5 schema.

## Product Audit Decision

Durable Simulation product audit remains deferred for Phase 5. FEAT-040 validates zero product audit table, zero product audit migration, zero public audit API/UI, zero Simulation product-event persistence, and zero `AuthSecurityAuditRecord` reuse.

## Report

Codex writes `reports/qa/phase-5/PHASE-5-QA.md`.
