# FEAT-054 Requirement: Premium Entitlement Authorization Guard

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED / IMPLEMENTATION NOT_STARTED
Phase: Phase 7 - Subscription / Premium
Type: Authorization foundation

## Goal

Provide reusable server-side entitlement authorization that fails closed and never trusts client/JWT premium claims.

## Functional Requirements

- FR-001 A reusable `requireEntitlement(entitlementKey)` boundary MUST require authenticated server-derived identity.
- FR-002 The guard MUST call FEAT-049 authoritative entitlement resolution.
- FR-003 JWT/access tokens MUST remain role/entitlement/premium-free as approved; client claims MUST not be trusted.
- FR-004 Missing authentication MUST return canonical 401.
- FR-005 Authenticated users without entitlement MUST return canonical safe 403 without revealing subscription/provider detail.
- FR-006 Repository/integrity failure MUST return sanitized 5xx and deny access.
- FR-007 Subscription status changes MUST affect authorization immediately for the same still-valid access token.
- FR-008 No-record FREE, PAST_DUE, CANCELLED, EXPIRED, invalid-period, and unknown-key cases MUST deny.
- FR-009 The guard MUST not use Redis/JWT/frontend state as authority; any future cache is deny-safe and bounded by PostgreSQL.
- FR-010 Denial observability/audit MUST be bounded and MUST never make denial permissive or amplify durable events.
- FR-011 Tests MUST prove grant/removal immediacy, spoof resistance, failure safety, and composition order.
- FR-012 Under approved D9, FEAT-054 MUST build the reusable guard only and MUST NOT gate any existing Academy, Simulation, Community, or AI route during Phase 7.
- FR-013 FEAT-054 MUST add no schema, migration, public entitlement mutation API, UI, or admin override.
- FR-014 Canonical validation and Phase 2-6/FEAT-048-053 regressions MUST pass.

## Dependencies

FEAT-049 gate and the approved D9 deferral for all existing-domain gates.

## Out Of Scope

Concrete premium feature gates, plan reads, provider flows, entitlement grants, public test route, UI, admin/support overrides, and Phase 8.
