# FEAT-077 Requirement: Admin Access Boundary & Existing Capability Surface

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED
Phase: Phase 9 - UI Integration & Product Polish
Type: Implementation feature / Human-decision blocked
Planning Owner: Codex

## Goal

Provide a minimal, fail-closed admin access/status surface over the existing PostgreSQL-authorized ADMIN guard without inventing administrative product capabilities.

## Functional Requirements

- FR-001 Add a canonical `/admin` route only after Human approves the minimal existing-capability scope.
- FR-002 Authenticate through the approved session and verify access through the existing server admin guard.
- FR-003 Render distinct safe unauthenticated, denied, allowed, and unavailable states without role enumeration leakage.
- FR-004 Ensure zero-role, USER-only, and ROOT-only users cannot gain ADMIN access through client state.
- FR-005 Reflect same-token ADMIN grant/removal immediately by rechecking server authority.
- FR-006 Expose no administrative command, role-management, CMS, moderation, subscription, audit, or repair operation.
- FR-007 Meet responsive, keyboard, focus, semantic, contrast, and announcement requirements.
- FR-008 Test server-authority, spoof resistance, fail-closed errors, route security, and regressions.

## Non-Functional Requirements

- NFR-001 Preserve approved server-authority and security boundaries.
- NFR-002 Meet responsive mobile, tablet, and desktop behavior without horizontal overflow.
- NFR-003 Meet keyboard, focus, semantic, contrast, announcement, and reduced-motion baseline.
- NFR-004 Add no database migration unless a later Human-approved scope change explicitly assigns one.
- NFR-005 Produce deterministic tests and truthful exact-source evidence with no mandatory skips.

## Dependencies

FEAT-070, FEAT-071, FEAT-007, FEAT-008, and Human approval of P9-D05.

## Scope Boundary

Owns `/admin` status/access presentation only. Excludes CMS, moderation, role/user/subscription mutation, audit viewing, support override, reconciliation, and default credentials.

## Approval Boundary

This package is a proposal. It does not authorize implementation and may not be marked implemented, QA PASS, DONE, or Human approved without later gates.

