# FEAT-070 Requirement: Application Shell, Navigation & Route Governance

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED
Phase: Phase 9 - UI Integration & Product Polish
Type: Implementation feature
Planning Owner: Codex

## Goal

Deliver a cohesive, responsive application shell and deterministic route governance that replaces stale foundation-era presentation without changing domain behavior.

## Functional Requirements

- FR-001 Define a canonical route registry for home, dashboard, account, Academy, Simulation, Community, Subscription, Admin, and future AI surfaces without claiming unavailable features are implemented.
- FR-002 Replace foundation-era phase/status marketing copy with a product-oriented shell and honest availability states.
- FR-003 Provide responsive desktop and mobile navigation with current-route indication, keyboard operation, focus management, and escape/close behavior.
- FR-004 Provide deterministic route-level loading, unavailable, error-boundary, and not-found presentation.
- FR-005 Establish shared layout and page-state primitives plus semantic design tokens that later Phase 9 features reuse.
- FR-006 Preserve the approved QueryClient and AuthProvider lifecycle without persisting access or refresh tokens in browser storage.
- FR-007 Treat client route visibility as non-authoritative and preserve safe handling of server 401, 403, 429, 503, and 5xx responses.
- FR-008 Add shell, router, navigation, responsive, accessibility, and regression tests with truthful evidence.

## Non-Functional Requirements

- NFR-001 Preserve approved server-authority and security boundaries.
- NFR-002 Meet responsive mobile, tablet, and desktop behavior without horizontal overflow.
- NFR-003 Meet keyboard, focus, semantic, contrast, announcement, and reduced-motion baseline.
- NFR-004 Add no database migration unless a later Human-approved scope change explicitly assigns one.
- NFR-005 Produce deterministic tests and truthful exact-source evidence with no mandatory skips.

## Dependencies

Phase 7 Human Final Gate; approved React/Vite/AuthProvider/TanStack Query foundation.

## Scope Boundary

Owns app shell, route metadata, navigation, global route error/404 boundaries, and shared page-state primitives. Excludes domain workflows, auth forms, backend code, schemas, and migrations.

## Approval Boundary

This package is a proposal. It does not authorize implementation and may not be marked implemented, QA PASS, DONE, or Human approved without later gates.

