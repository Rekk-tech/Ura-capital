# FEAT-059 Plan: Gemini Development Adapter & Failure Isolation

Status: DEPENDENCY BLOCKED BY FEAT-058
Phase: Phase 8 - Aura Intelligence

## Preconditions

- Human approves the Phase 8 master plan, this package, and the listed decision dependencies.
- FEAT-058 approved checkpoint exists.
- Valid replacement development API key is securely configured server-side.
- Actual Gemini credential-access verification passes via synthetic probe.
- Structured-output smoke test against `gemini-3.5-flash-lite` passes.
- Project-specific quota confirmation (RPM 15, TPM 250k, RPD 500 candidate) is completed.
- Work starts from the exact approved dependency checkpoint in an isolated worktree and feature branch.
- Shared-file ownership and integration checkpoint are assigned before edits.
- No implementation uses the planning branch as an application baseline.

## Delivery Plan

1. Record exact baseline SHA, branch, worktree, dependencies, and zero-scope exclusions.
2. Implement the approved architecture and contracts for FR-001 through FR-010 as one isolated Gemini development/test adapter conforming to `LLMProvider`; do not add another adapter, routing, or fallback.
3. Add requirement-mapped tests, security probes, boundary checks, and regression coverage.
4. Verify migration ownership and inspect the diff for scope leakage.
5. Run targeted validation, canonical repository validation, authoritative guards, and exact-source CI.
6. Publish reports/implementation/phase-8/FEAT-059.md with exact evidence and no independent-QA claim.
7. Create an approved checkpoint only after the applicable feature gate and CI policy pass.
8. Keep downstream features blocked until the approved dependency/integration checkpoint exists.

## Proposed File Ownership

Proposed ownership: apps/api/src/modules/ai/infrastructure/gemini/**, provider fixtures/tests, provider package manifest and lockfile changes, and the feature report.

## Parallel And Shared-File Controls

Changes outside proposed ownership require integration-owner coordination. Shared environment schemas, package manifests/lockfiles, root server/router composition, shared AI DTO exports, repository composition, and Redis namespace helpers are serialized according to the master plan.

## Migration Plan

ZERO. No schema or migration change is permitted.

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

- P8-D03: APPROVED FOR DEVELOPMENT ARCHITECTURE - exact Gemini development/test model ID (`gemini-3.5-flash-lite`), API version (`v1`), input/output token limits (4096/1024), and timeout (15000 ms) are approved; no automatic fallback or ambiguous-call retry is allowed. Live credential access, quota confirmation, and structured-output live test are FEAT-059 prerequisites.
- P8-D11: APPROVED WITH BLOCKER - use synthetic test data until provider privacy conditions are approved.
- P8-D15: PENDING - production provider selection remains a future Human gate.
- Implementation readiness: DEPENDENCY BLOCKED BY FEAT-058. Production activation remains blocked by P8-D11 and P8-D15.
