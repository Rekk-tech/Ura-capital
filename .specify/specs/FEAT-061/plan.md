# FEAT-061 Plan: AI Context Resolver Core & Data Isolation

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Preconditions

- Human approves the Phase 8 master plan, this package, and the listed decision dependencies.
- Work starts from the exact approved dependency checkpoint in an isolated worktree and feature branch.
- Shared-file ownership and integration checkpoint are assigned before edits.
- No implementation uses the planning branch as an application baseline.

## Delivery Plan

1. Record exact baseline SHA, branch, worktree, dependencies, and zero-scope exclusions.
2. Implement the approved architecture and contracts for FR-001 through FR-010.
3. Add requirement-mapped tests, security probes, boundary checks, and regression coverage.
4. Verify migration ownership and inspect the diff for scope leakage.
5. Run targeted validation, canonical repository validation, authoritative guards, and exact-source CI.
6. Publish reports/implementation/phase-8/FEAT-061.md with exact evidence and no independent-QA claim.
7. Create an approved checkpoint only after the applicable feature gate and CI policy pass.
8. Keep downstream features blocked until the approved dependency/integration checkpoint exists.

## Proposed File Ownership

Proposed ownership: apps/api/src/modules/ai/context/core/**, context ports/registry/tests, approved composition wiring, and the feature report.

## Parallel And Shared-File Controls

Changes outside proposed ownership require integration-owner coordination. Shared environment schemas, package manifests/lockfiles, root server/router composition, shared AI DTO exports, repository composition, and Redis namespace helpers are serialized according to the master plan.

## Migration Plan

ZERO. Context is assembled from existing authorities and is not persisted.

Fresh/upgrade migration validation is required only if an explicitly Human-approved migration is introduced. Otherwise schema and migration diff must remain zero and existing migration guards stay green.

## Verification Plan

- Map every task to its FR and AC.
- Run targeted unit/contract/security tests.
- Run live authority-backed tests where applicable.
- Run lint, typecheck, build, Prisma validation, all authoritative guards, and relevant regression.
- Record actual counts and exact-source CI; do not copy historical counts.
- Antigravity may self-verify but may not claim independent QA.
- After D09 approval, prove every section-12.4 component and aggregate context ceiling with Unicode/UTF-8/token boundary and deterministic-priority fixtures.

## Rollback And Failure

Application rollout remains disabled until the feature gate passes. Configuration and adapter changes must fail closed. No rollback may edit an applied migration. Any architecture, schema, privacy, cost, or product-scope conflict stops for Human review.

## Human Decision Handoff

- P8-D07: APPROVED - requests are stateless with no durable conversation history.
- P8-D08: APPROVED - context modes are AUTO, ACADEMY, and SIMULATION.
- P8-D09: APPROVED WITH BLOCKER - section-12.4 context budgets await Human confirmation.
- P8-D11: APPROVED WITH BLOCKER - strict context allowlist is approved; production provider region/privacy conditions remain required.
- P8-D15: PENDING - context contracts remain provider-neutral and cannot select the production provider.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-058 and P8-D09 context-budget closure; non-synthetic/production provider integration remains blocked by P8-D11 and P8-D15.
