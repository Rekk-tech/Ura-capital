# FEAT-058 Plan: Provider-Independent AI Gateway Foundation & Configuration

Status: DONE / HUMAN FEATURE GATE APPROVED / CHECKPOINT PUBLISHED
Phase: Phase 8 - Aura Intelligence

## Preconditions

- Human approves the Phase 8 master plan, this package, and the listed decision dependencies.
- Work starts from the exact approved dependency checkpoint in an isolated worktree and feature branch.
- Shared-file ownership and integration checkpoint are assigned before edits.
- No implementation uses the planning branch as an application baseline.

## Delivery Plan

1. Record exact baseline SHA, branch, worktree, dependencies, and zero-scope exclusions.
2. Implement the approved architecture and contracts for FR-001 through FR-010, including one minimal `LLMProvider` port and explicit single-provider selection with no routing or fallback.
3. Add requirement-mapped tests, security probes, boundary checks, and regression coverage.
4. Verify migration ownership and inspect the diff for scope leakage.
5. Run targeted validation, canonical repository validation, authoritative guards, and exact-source CI.
6. Publish reports/implementation/phase-8/FEAT-058.md with exact evidence and no independent-QA claim.
7. Create an approved checkpoint only after the applicable feature gate and CI policy pass.
8. Keep downstream features blocked until the approved dependency/integration checkpoint exists.

## Proposed File Ownership

Proposed ownership: apps/api/src/modules/ai/core/**, AI composition/configuration wiring, shared environment schema, .env.example, targeted tests, and the Phase 8 implementation report.

## Parallel And Shared-File Controls

Changes outside proposed ownership require integration-owner coordination. Shared environment schemas, package manifests/lockfiles, root server/router composition, shared AI DTO exports, repository composition, and Redis namespace helpers are serialized according to the master plan.

## Migration Plan

ZERO. No Prisma schema or migration change is permitted.

Fresh/upgrade migration validation is required only if an explicitly Human-approved migration is introduced. Otherwise schema and migration diff must remain zero and existing migration guards stay green.

## Verification Plan

- Map every task to its FR and AC.
- Run targeted unit/contract/security tests.
- Run live authority-backed tests where applicable.
- Run lint, typecheck, build, Prisma validation, all authoritative guards, and relevant regression.
- Record actual counts and exact-source CI; do not copy historical counts.
- Antigravity may self-verify but may not claim independent QA.

## Rollback And Failure

Application rollout remains disabled until the feature gate passes. Configuration and adapter changes must fail closed. No rollback may edit an applied migration. Any architecture, schema, privacy, cost, or product-scope conflict stops for Human review.

## Human Decision Handoff

- P8-D01: APPROVED - FEAT-058..068 are allocated and FEAT-069 is reserved.
- P8-D03: APPROVED FOR DEVELOPMENT ARCHITECTURE - Gemini is the development/test provider behind `LLMProvider` with pinned settings (`gemini-3.5-flash-lite`, `v1`, 4096 in, 1024 out, 15000 ms timeout, fallback DISABLED, retry DISABLED, production activation DISABLED). Live key access, project quota verification, and structured-output live smoke test are delegated to FEAT-059 prerequisites.
- P8-D11: APPROVED WITH BLOCKER - synthetic-only provider testing may proceed; non-synthetic and production traffic await provider privacy approval.
- P8-D15: PENDING - production provider selection is a separate Human gate based on versioned comparative evaluation.
- Implementation readiness: APPROVED FOR IMPLEMENTATION. Production activation remains blocked by P8-D11 and P8-D15.
