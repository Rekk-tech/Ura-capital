# Requirement: FEAT-028 Academy Authorization & Ownership Hardening

**Feature ID**: FEAT-028  
**Phase**: Phase 4 - Academy  
**Status**: PLANNED / BLOCKED BY FEAT-027 IMPLEMENTATION GATE  
**Planning Owner**: Codex  
**Implementation Status**: NOT_STARTED  

## Goal

FEAT-028 hardens all learner-facing Academy authorization and ownership boundaries introduced by FEAT-020 through FEAT-027.

## Scope

- Endpoint authorization matrix for Academy APIs.
- IDOR and cross-user access hardening.
- Owner-scoped attempts, answers, graded results, progress, XP, and reward history if exposed.
- Role authority regression: JWT role spoofing must not grant access.
- Non-enumerating 403/404 semantics.
- Sensitive DTO leakage regression.

## Out of Scope

- New product functionality.
- Public/admin content authoring.
- New admin/support visibility.
- XP/reward semantics changes.
- Product audit activation.

## Human-Approved Decision

Human has approved deferring ADMIN / SUPPORT learner visibility in Phase 4. FEAT-028 is learner ownership hardening only.

- Zero new admin/support Academy routes.
- No admin content authoring.
- No support read API.
- No public role/admin provisioning surface.

## Functional Requirements

- FR-001: Every Academy route MUST be classified as PUBLIC, AUTHENTICATED, or OWNER-SCOPED. ADMIN/SUPPORT Academy routes are out of scope.
- FR-002: Learner-owned resources MUST derive ownership from authenticated principal and PostgreSQL relationships.
- FR-003: Client-supplied `userId` MUST NOT grant read/write authority.
- FR-004: User A MUST NOT read or mutate User B attempts, draft answers, submissions, results, progress, XP, or rewards.
- FR-005: JWT role/admin spoofing MUST NOT bypass PostgreSQL authorization.
- FR-006: Missing/non-owned resources MUST use non-enumerating error behavior.
- FR-007: Safe DTO boundaries from FEAT-020 through FEAT-027 MUST be preserved.
- FR-008: No Academy admin/support API may be added in FEAT-028.
- FR-009: Cross-user access MUST be non-enumerating. For attempt/result resources, existing canonical generic not-found semantics MUST be preserved and route-specific existence errors MUST NOT be invented.

## Acceptance Baseline

FEAT-028 uses AC-001 through AC-022 from `acceptance.md`.
