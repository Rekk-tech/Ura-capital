# FEAT-067 Plan: AI Observability & Provider Evaluation Harness

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Preconditions

- Human approves the Phase 8 master plan, this package, and the listed decision dependencies.
- Work starts from the exact approved dependency checkpoint in an isolated worktree and feature branch.
- Shared-file ownership and integration checkpoint are assigned before edits.
- No implementation uses the planning branch as an application baseline.

## Delivery Plan

1. Record exact baseline SHA, branch, worktree, dependencies, and zero-scope exclusions.
2. Implement the approved architecture and contracts for FR-001 through FR-010, keeping the evaluation dataset provider-independent and reproducible across future candidates.
3. Add requirement-mapped tests, security probes, boundary checks, and regression coverage.
4. Verify migration ownership and inspect the diff for scope leakage.
5. Run targeted validation, canonical repository validation, authoritative guards, and exact-source CI.
6. Publish reports/implementation/phase-8/FEAT-067.md with exact evidence and no independent-QA claim.
7. Create an approved checkpoint only after the applicable feature gate and CI policy pass.
8. Keep downstream features blocked until the approved dependency/integration checkpoint exists.

## Proposed File Ownership

Proposed ownership: apps/api/src/modules/ai/observability/**, AI evaluation fixtures/runner/tests, safe metrics/logging integration, and the feature report.

## Parallel And Shared-File Controls

Changes outside proposed ownership require integration-owner coordination. Shared environment schemas, package manifests/lockfiles, root server/router composition, shared AI DTO exports, repository composition, and Redis namespace helpers are serialized according to the master plan.

## Migration Plan

ZERO under approved telemetry-only P8-D13. Durable AI product audit is deferred and requires separate Human activation and schema governance.

Fresh/upgrade migration validation is required only if an explicitly Human-approved migration is introduced. Otherwise schema and migration diff must remain zero and existing migration guards stay green.

## Verification Plan

- Map every task to its FR and AC.
- Run targeted unit/contract/security tests.
- Run live authority-backed tests where applicable.
- Run lint, typecheck, build, Prisma validation, all authoritative guards, and relevant regression.
- Record actual counts and exact-source CI; do not copy historical counts.
- Antigravity may self-verify but may not claim independent QA.
- After D12 approval and concrete manifest approval, run every section-12.5 suite, reproduce scoring from immutable inputs, report language/domain strata and confidence-safe raw counts, and prove provider comparison uses identical ordered fixtures and runtime policy.

## Rollback And Failure

Application rollout remains disabled until the feature gate passes. Configuration and adapter changes must fail closed. No rollback may edit an applied migration. Any architecture, schema, privacy, cost, or product-scope conflict stops for Human review.

## Human Decision Handoff

- P8-D10 and P8-D13: APPROVED.
- P8-D03, P8-D05, P8-D11, and P8-D12: APPROVED WITH BLOCKER; section 12.5 and D05 accounting are prepared but not yet authorized.
- P8-D15: PENDING - this feature produces comparison evidence; Human retains production-provider selection authority.
- Implementation readiness: DEPENDENCY BLOCKED and BLOCKED until model/runtime, remaining quota/cost, and Vietnamese corpus/scoring inputs close. Production activation additionally requires P8-D11 and P8-D15.
