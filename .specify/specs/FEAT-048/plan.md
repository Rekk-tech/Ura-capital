# FEAT-048 Plan: Subscription Domain Schema & Persistence Foundation

Status: HUMAN MASTER PLANNING APPROVED / APPROVED FOR IMPLEMENTATION

## Delivery Sequence

1. Implement the Human-approved D2..D6 schema contract without semantic changes.
2. Add Prisma models/enums/relations and one additive migration.
3. Add repository interfaces, Prisma implementations, and repository-factory bindings only; add no transition-producing service.
4. Add static boundary and audit-governance protections for the new module.
5. Add unit/schema and isolated PostgreSQL constraint/concurrency tests.
6. Validate fresh deploy and real Phase 6 upgrade preservation.
7. Run canonical validation, guards, and Phase 2-6 regressions; publish implementation evidence.

## Test Strategy

Use independent fresh and upgrade PostgreSQL databases. Prove UUIDs, required fields, FKs, unique provider events, unique external IDs, one-current-subscription concurrency, distinct terminal-state retention, delete restrictions, transaction-client propagation, append-only behavior, migration immutability, and safe diagnostics. Repository fixtures may prove transaction participation but must not implement FEAT-052/053 transition behavior.

## Completion Gate

All AC-001..AC-024 pass with no mandatory skip. No FEAT-049 behavior begins before FEAT-048 gate approval.
