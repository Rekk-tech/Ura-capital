# FEAT-078 Plan: Aura Intelligence UI Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION_NOT_STARTED

## 1. Preconditions

- Human approves the Phase 9 master plan and FEAT-078 package.
- Dependencies are satisfied: FEAT-070, FEAT-071, Phase 8 AI gateway/contracts QA PASS and Human Final Gate, plus Human approval of P9-D02.
- Work starts from the approved Phase 9 integration baseline in an isolated worktree.
- The implementation agent confirms zero unrelated dirty changes.

## 2. Delivery Sequence

1. Freeze consumed contracts and feature-owned file paths.
2. Implement or execute the eight FRs in task order with tests/evidence alongside work.
3. Run targeted security, accessibility, responsive, and contract verification.
4. Run relevant monorepo regression and authoritative guards.
5. Publish an exact-source CI-green checkpoint or QA result only after the defined gate passes.

## 3. File Ownership

Owns AI assistant frontend rendering and interaction after Phase 8 contract freeze. Excludes gateway/provider implementation, RAG, prompt/version management, context authority, quota decisions, model selection, and durable conversation storage.

Shared shell, global tokens, root router, and package-manifest changes require integration-owner coordination. No parallel feature may silently rewrite those files.

## 4. Test Strategy

- Unit: pure mapping, state, validation, and safety helpers where implementation exists.
- Component: interaction, async state, accessibility, and safe rendering.
- Integration: authenticated API-client and route behavior with authoritative errors.
- Browser E2E: critical journey at desktop and mobile breakpoints.
- Regression: owning upstream phases plus auth/session, RBAC/entitlement, and all authoritative guards affected by the source.

## 5. Migration and Rollback

ZERO Phase 9 database or migration changes; any conversation persistence is owned by Phase 8. No database rollback is owned by this feature.

## 6. Risks

- Contract drift between approved APIs and frontend assumptions.
- Client presentation accidentally treated as authorization or durable authority.
- Shared-file merge conflicts during parallel work.
- Incomplete async, mobile, keyboard, or failure-state coverage.

## 7. Exit

The feature gate requires AC-001..AC-008 PASS, all tasks complete, exact-source CI green, zero P0/P1, truthful evidence, and no scope expansion. A validation-only gate must not repair defects itself.

