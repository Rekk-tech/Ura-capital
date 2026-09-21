# FEAT-050 Requirement: Subscription Read APIs

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED / IMPLEMENTATION NOT_STARTED
Phase: Phase 7 - Subscription / Premium
Type: Backend read API

## Goal

Expose minimal safe plan and current-user subscription/entitlement projections without leaking provider internals or creating mutation authority.

## Functional Requirements

- FR-001 `GET /api/subscriptions/plans` MUST be the canonical PUBLIC SAFE READ plan catalog route.
- FR-002 `GET /api/subscriptions/me` MUST be authenticated and scoped to the current user only.
- FR-003 Plan responses MUST come from the FEAT-049 server-owned catalog.
- FR-004 Current-user responses MUST come from FEAT-049 entitlement resolution and server-derived identity.
- FR-005 No-record users MUST receive an explicit safe FREE/no-entitlement projection.
- FR-006 DTOs MUST omit provider customer/subscription/price IDs, event IDs, audit metadata, roles, email, and security data.
- FR-007 Client user IDs or premium/status query/body/header claims MUST be rejected or ignored and never alter scope.
- FR-008 Reads MUST perform zero durable mutation and zero provider call.
- FR-009 Error envelopes MUST be stable, non-enumerating, and sanitized.
- FR-010 Tests MUST cover auth, ownership, DTO allowlists, malformed input, and repository failure.
- FR-011 FEAT-050 MUST add no schema, migration, Redis authority/cache, checkout/cancel/webhook, guard, or UI.

## Dependencies

FEAT-049 gate and the approved locked read policy.

## Out Of Scope

Mutations, provider calls, premium enforcement, existing-domain gating, UI, audit writes, admin/support views, and Phase 8.
