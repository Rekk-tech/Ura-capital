# FEAT-057 Specification: Phase 7 Independent Integration QA

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

## Gate Architecture

FEAT-057 is the mandatory independent compensating Phase QA. It consumes approved artifacts and executable evidence from FEAT-048..FEAT-056 after those features are implemented, pass their approved Fast-Track internal feature gates, publish green exact-source CI/checkpoints, and integrate. Individual independent feature QA is not a universal prerequisite; it occurs only for the approved escalation conditions. Discovered defects are reported against their owning feature and corrected outside this gate before targeted revalidation.

Feature-level independent QA escalation conditions are: P0/P1, self-upgrade bypass, authentication/entitlement bypass, provider-signature bypass, idempotency failure, state corruption, migration failure, audit-integrity failure, payment/secret leakage, or canonical validation failure. Documentation-only findings use governance correction plus Human targeted review.

## Mandatory Environments

- Fresh isolated PostgreSQL database for zero-state migration and full DB suites.
- Independent upgrade database restored/reproduced at exact `phase-6-approved`, populated with representative Phase 2-6 rows, then upgraded by the real FEAT-048 migration.
- Isolated live Redis namespace and workers for transient-state tests.
- Deterministic isolated mock/test provider-contract environment. No production provider sandbox, adapter, webhook, checkout, or cancellation surface is required or permitted by the approved deferred branch.
- Exact source SHA for CI publication.

Unavailable mandatory infrastructure is `ENVIRONMENT BLOCKED` / `NOT VERIFIED`, never PASS.

## Cross-Feature Flows

1. FREE/no-record user reads safe status and lacks premium entitlement.
2. Production provider adapter, webhook/signature surface, checkout/cancel APIs, and commerce CTAs are absent.
3. Isolated mock/dev/test verified-event behavior remains non-production, cannot self-grant, and rejects invalid verification, replay, and out-of-order state corruption.
4. Verified test activation updates authoritative state, coupled audit, reads, and same-token authorization.
5. Duplicate/concurrent provider-neutral test delivery converges exactly once.
6. Cancel-at-period-end and period expiry follow D5 without premature or stale access.
7. Past-due behavior follows D4, reconciliation cannot overwrite newer state, and state-first revocation remains denied if audit persistence fails.
8. Learner UI is read-only for production commerce, remains server-authoritative, and cannot self-upgrade.

## Migration Method

Fresh validation records ordered migration names/count/status. Upgrade validation captures before/after row IDs, counts, relationships, and constraints for representative identity/auth/audit/Academy/Simulation/Community data. It must be classified as a real Phase 6-to-Phase 7 upgrade, not a no-op compatibility check.

## Verdict Rules

Final Verdict is PASS or FAIL. No conditional pass is allowed for security, payment/provider trust, entitlement authority, migration/data integrity, audit coupling, Redis fail-closed behavior, mandatory validation, P0/P1 defects, or unresolved Human decisions. Phase 7 remains IN_PROGRESS and Phase 8 BLOCKED until Human approval.

## Output

Codex writes `reports/qa/phase-7/PHASE-7-QA.md` with decision register, environment evidence, migration evidence, feature/AC matrix, defect ownership, exact counts, CI SHA/run, advisories, blockers, and final verdict.
