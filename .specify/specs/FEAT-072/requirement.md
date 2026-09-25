# FEAT-072 Requirement: Learner Dashboard & Cross-Domain Summary

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED
Phase: Phase 9 - UI Integration & Product Polish
Type: Implementation feature / Human-decision blocked
Planning Owner: Codex

## Goal

Provide an authenticated learner dashboard composed from approved read contracts while avoiding a new cross-domain persistence or authority layer.

## Functional Requirements

- FR-001 Add an authenticated `/dashboard` route with a useful summary of only the domains included in the Human-approved MVP cut.
- FR-002 Compose bounded existing read requests without adding an aggregate backend endpoint or durable dashboard model.
- FR-003 Display only server-returned facts and link users to owning domain routes for actions.
- FR-004 Handle per-widget loading, empty, unavailable, unauthorized, and error states without failing the entire dashboard.
- FR-005 Bound request fan-out, cancellation, retries, and refresh behavior to avoid request storms.
- FR-006 Keep Academy progress, Simulation portfolio, Community ownership, and Subscription entitlement authority in their owning services.
- FR-007 Meet responsive, keyboard, semantic, focus, contrast, and reduced-motion requirements.
- FR-008 Test composition, partial failure, stale/refetch behavior, security boundaries, performance bounds, and regressions.

## Non-Functional Requirements

- NFR-001 Preserve approved server-authority and security boundaries.
- NFR-002 Meet responsive mobile, tablet, and desktop behavior without horizontal overflow.
- NFR-003 Meet keyboard, focus, semantic, contrast, announcement, and reduced-motion baseline.
- NFR-004 Add no database migration unless a later Human-approved scope change explicitly assigns one.
- NFR-005 Produce deterministic tests and truthful exact-source evidence with no mandatory skips.

## Dependencies

FEAT-070, FEAT-071, included Phase 4-7 domain contracts, and Human approval of P9-D04.

## Scope Boundary

Owns `/dashboard`, summary orchestration, and partial-failure presentation. Excludes aggregate APIs, cross-domain transactions, analytics persistence, ranking, and client-derived authority.

## Approval Boundary

This package is a proposal. It does not authorize implementation and may not be marked implemented, QA PASS, DONE, or Human approved without later gates.

