# FEAT-049 Requirement: Plan Catalog & Entitlement Resolution

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED / IMPLEMENTATION NOT_STARTED
Phase: Phase 7 - Subscription / Premium
Type: Domain service foundation

## Goal

Define a server-owned plan catalog and deterministic entitlement resolver that derives premium capability from PostgreSQL subscription facts without a client-controlled flag.

## Functional Requirements

- FR-001 The D2-approved catalog MUST contain only `FREE` and `PREMIUM` plan keys and remain configuration-backed with no database plan table.
- FR-002 The catalog and provider price mapping MUST be server configuration, validated at startup, and not client-authoritative.
- FR-003 The approved initial entitlement set MUST contain only `PREMIUM_ACCESS`; domain-specific keys require a future Human decision.
- FR-004 No subscription record MUST resolve to FREE and zero premium entitlements.
- FR-005 Effective entitlement MUST use PostgreSQL status, plan, period bounds, cancellation facts, and a server-controlled clock.
- FR-006 `ACTIVE` within a valid period MAY grant mapped entitlement; terminal status MUST deny.
- FR-007 D3..D5 MUST resolve exactly as follows: no trial; PAST_DUE grants no premium and has no grace; cancel-at-period-end remains ACTIVE only through valid `currentPeriodEnd` then becomes EXPIRED; provider-confirmed immediate cancellation may become CANCELLED; both terminal states deny.
- FR-008 Client/JWT role, `isPremium`, plan name, entitlement list, dates, and provider values MUST be ignored as authority.
- FR-009 Resolution MUST fail closed on missing/invalid durable state or repository failure.
- FR-010 Redis cache, if later justified, MUST never grant beyond PostgreSQL and is not part of FEAT-049.
- FR-011 Resolution interfaces MUST be reusable by reads and guards without importing Prisma.
- FR-012 Tests and evidence MUST preserve Phase 2-6 and FEAT-048 behavior.

## Dependencies

FEAT-048 gate; Human D2, D3, D4, D5, and D9 decisions.

## Out Of Scope

Public APIs, provider calls/events, checkout/cancel, guard middleware, existing-domain gating, UI, Redis caching, admin grants, schema, and migration.
