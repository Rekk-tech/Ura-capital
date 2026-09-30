# FEAT-068 Plan: Phase 8 Integration, Security & Phase 9 Handover Gate

Status: HUMAN MASTER PLANNING CONDITIONALLY APPROVED / IMPLEMENTATION NOT_STARTED
Phase: Phase 8 - Aura Intelligence

## Preconditions

- Human approves the Phase 8 master plan, this package, and the listed decision dependencies.
- Work starts from the exact approved dependency checkpoint in an isolated worktree and feature branch.
- Shared-file ownership and integration checkpoint are assigned before edits.
- No implementation uses the planning branch as an application baseline.

## Delivery Plan

1. Record exact baseline SHA, branch, worktree, dependencies, and zero-scope exclusions.
2. Execute the approved validation contract for FR-001 through FR-010 without adding product behavior.
3. Add only requirement-mapped validation fixtures, security probes, or gate scripts that cannot change runtime behavior.
4. Verify migration ownership and inspect the diff for scope leakage.
5. Run targeted validation, canonical repository validation, authoritative guards, and exact-source CI.
6. Publish `reports/qa/phase-8/PHASE-8-QA.md` with independent evidence, defect ownership, and an exact PASS or FAIL verdict.
7. Freeze the Phase 9 handover contract only if the gate passes; do not create a Phase 8 approved checkpoint before Human Final Gate approval.
8. Keep Phase 9 FEAT-078/080 blocked until the approved dependency and Human Phase 8 checkpoint exist.

## Proposed File Ownership

Proposed ownership: reports/qa/phase-8/PHASE-8-QA.md, Phase 8 gate fixtures/scripts only when validation-only, and the frozen handover artifact; no application product source.

## Parallel And Shared-File Controls

Changes outside proposed ownership require integration-owner coordination. Shared environment schemas, package manifests/lockfiles, root server/router composition, shared AI DTO exports, repository composition, and Redis namespace helpers are serialized according to the master plan.

## Migration Plan

ZERO. The gate validates migration history and confirms Phase 8 migration ownership; it introduces none.

Fresh/upgrade migration validation is required only if an explicitly Human-approved migration is introduced. Otherwise schema and migration diff must remain zero and existing migration guards stay green.

## Verification Plan

- Map every task to its FR and AC.
- Run targeted unit/contract/security tests.
- Run live authority-backed tests where applicable.
- Run lint, typecheck, build, Prisma validation, all authoritative guards, and relevant regression.
- Record actual counts and exact-source CI; do not copy historical counts.
- Codex performs the independent gate. Antigravity implementation/self-verification evidence is input, not a substitute for QA.
- Independently reproduce sections 12.3 through 12.5 only after their Human decision records and concrete evaluation manifests exist; any unapproved parameter or mandatory skipped suite blocks PASS.

## Rollback And Failure

The gate does not repair defects. Any failure is assigned to the owning feature, corrected outside FEAT-068, and independently revalidated. No rollback may edit an applied migration. Any architecture, schema, privacy, cost, or product-scope conflict stops for Human review.

## Human Decision Handoff

- P8-D01, D02, D04, D06, D07, D08, D10, D13, and D14: APPROVED.
- P8-D03, D05, D09, D11, and D12: APPROVED WITH BLOCKER; Human must close prepared D05/D09/D12 matrices before gate execution.
- P8-D15: PENDING - production provider selection remains a Human gate; FEAT-068 verifies provider neutrality and disabled production traffic rather than selecting a provider.
- Gate readiness: BLOCKED until D03, D05, D09, and D12 implementation/gate inputs close and FEAT-058..067 are integrated. D11 must close for non-synthetic/production data; otherwise production stays disabled.
