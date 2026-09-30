# FEAT-064 Plan: Academy Retrieval / RAG Foundation

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
6. Publish reports/implementation/phase-8/FEAT-064.md with exact evidence and no independent-QA claim.
7. Create an approved checkpoint only after the applicable feature gate and CI policy pass.
8. Keep downstream features blocked until the approved dependency/integration checkpoint exists.

## Proposed File Ownership

Proposed ownership: apps/api/src/modules/ai/retrieval/**, Academy retrieval adapter/evaluation fixtures/tests, composition wiring, and the feature report.

## Parallel And Shared-File Controls

Changes outside proposed ownership require integration-owner coordination. Shared environment schemas, package manifests/lockfiles, root server/router composition, shared AI DTO exports, repository composition, and Redis namespace helpers are serialized according to the master plan.

## Migration Plan

ZERO under the approved PostgreSQL lexical design. Vector/embedding persistence is not approved for Phase 8.

Fresh/upgrade migration validation is required only if an explicitly Human-approved migration is introduced. Otherwise schema and migration diff must remain zero and existing migration guards stay green.

## Verification Plan

- Map every task to its FR and AC.
- Run targeted unit/contract/security tests.
- Run live authority-backed tests where applicable.
- Run lint, typecheck, build, Prisma validation, all authoritative guards, and relevant regression.
- Record actual counts and exact-source CI; do not copy historical counts.
- Antigravity may self-verify but may not claim independent QA.
- After D12 approval, execute the section-12.5 development and sealed-gate retrieval suites from immutable manifests and publish per-language-stratum Recall@5, MRR@5, no-evidence, citation, injection, and secrecy evidence.

## Rollback And Failure

Application rollout remains disabled until the feature gate passes. Configuration and adapter changes must fail closed. No rollback may edit an applied migration. Any architecture, schema, privacy, cost, or product-scope conflict stops for Human review.

## Human Decision Handoff

- P8-D06: APPROVED - PostgreSQL-backed lexical retrieval, no vector persistence, and zero migration.
- P8-D11: APPROVED WITH BLOCKER - published-content allowlist is approved; production provider region/privacy conditions remain required.
- P8-D12: APPROVED WITH BLOCKER - section 12.5 is prepared; Human methodology confirmation and concrete manifest approval remain required.
- P8-D15: PENDING - retrieval evidence remains provider-neutral and contributes to, but cannot decide, production provider selection.
- Implementation readiness: DEPENDENCY BLOCKED by FEAT-060/061/062; final gate evidence is blocked by P8-D12 and production use remains blocked by P8-D11/P8-D15.
