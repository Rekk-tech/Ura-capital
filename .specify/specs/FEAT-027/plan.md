# Plan: FEAT-027 XP & Idempotent Reward Ledger

**Status**: APPROVED FOR IMPLEMENTATION  
**Implementation Status**: NOT_STARTED  

## Dependency Plan

FEAT-027 starts only from the approved FEAT-026 checkpoint `feat-026-approved`. FEAT-028 and FEAT-029 remain blocked until FEAT-027 implementation completes, internal gate passes, checkpoint is published, and CI is green.

## Implementation Plan

1. Apply locked Human XP/reward decisions.
2. Add shared reward constants/types and safe DTOs.
3. Add reward reconciliation service consuming FEAT-026 completion/progression facts.
4. Extend Academy reward repository methods if needed.
5. Add atomic reward ledger + XP aggregate transaction.
6. Integrate FEAT-026 post-completion internal reward reconciliation.
7. Add canonical `GET /api/academy/me/xp` current-user read endpoint and lightweight read-only learner XP display.
8. Add unit, integration, live PostgreSQL concurrency, and recovery/reconciliation tests.
9. Run canonical 14 validation commands.
10. Produce `reports/implementation/phase-4/FEAT-027.md`.

## Migration Plan

Recommended: no migration. Existing constraints already support semantic reward idempotency. If an invariant gap is found, stop and request Human approval for a minimal additive migration.

## Test Strategy

- duplicate reward fact replay;
- five concurrent applications for same reward identity;
- rollback after ledger create failure injection;
- progression-commit/reward-failure recovery and retry reconciliation;
- no aggregate increment on duplicate ledger;
- no client-authoritative XP input;
- no Redis durable authority;
- FEAT-026 completion regression;
- `GET /api/academy/me/xp` current-user authorization and safe DTO tests;
- read-only learner XP frontend display tests.

## Gate

FEAT-027 internal gate requires canonical 14/14 validation with no mandatory skips.
