# FEAT-071 Requirement: Authentication Entry & Account Experience

Status: DONE / HUMAN FEATURE GATE APPROVED (2026-09-25)
Phase: Phase 9 - UI Integration & Product Polish
Type: Implementation feature
Planning Owner: Codex

## Goal

Provide safe registration, login, session recovery, logout, and read-only account identity experiences over the approved Phase 2 contracts.

## Functional Requirements

- FR-001 Add canonical `/login`, `/register`, and `/account` routes integrated with the shared shell.
- FR-002 Use only approved auth endpoints and request/response fields through the centralized auth client.
- FR-003 Apply FEAT-003 email normalization and password-policy UX while treating server validation as final authority.
- FR-004 Preserve uniform invalid-login behavior and safe 400/401/409/429/503/5xx presentation without enumeration leakage.
- FR-005 Keep access tokens in memory and refresh tokens inaccessible to JavaScript; never persist credentials or tokens.
- FR-006 Validate return destinations as same-application relative paths before redirecting after authentication.
- FR-007 Render read-only server-derived account identity and provide logout/session-expiry behavior without client role authority.
- FR-008 Test registration, login, refresh recovery, logout, redirects, accessibility, security, and regressions.

## Non-Functional Requirements

- NFR-001 Preserve approved server-authority and security boundaries.
- NFR-002 Meet responsive mobile, tablet, and desktop behavior without horizontal overflow.
- NFR-003 Meet keyboard, focus, semantic, contrast, announcement, and reduced-motion baseline.
- NFR-004 Add no database migration unless a later Human-approved scope change explicitly assigns one.
- NFR-005 Produce deterministic tests and truthful exact-source evidence with no mandatory skips.

## Dependencies

FEAT-070; FEAT-003 through FEAT-010A approved authentication and rate-limit contracts.

## Scope Boundary

Owns `/login`, `/register`, `/account`, auth form adapters, and account identity presentation. Profile mutation, password reset, email verification, role management, and admin provisioning are excluded.

## Approval Boundary

This package is a proposal. It does not authorize implementation and may not be marked implemented, QA PASS, DONE, or Human approved without later gates.

