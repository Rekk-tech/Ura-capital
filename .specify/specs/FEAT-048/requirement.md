# FEAT-048 Requirement: Subscription Domain Schema & Persistence Foundation

Status: HUMAN MASTER PLANNING APPROVED / APPROVED FOR IMPLEMENTATION / IMPLEMENTATION NOT_STARTED
Phase: Phase 7 - Subscription / Premium
Type: Persistence foundation
Migration Owner: Sole Phase 7 migration owner

## Goal

Create the minimal durable subscription, provider-event, and transition-history foundation required for server-authoritative premium access.

## Functional Requirements

- FR-001 PostgreSQL MUST be the durable authority for subscription status, provider events, and transition history.
- FR-002 A missing subscription record MUST resolve safely to FREE/no premium entitlement without backfill.
- FR-003 The schema MUST support historical terminal subscriptions while enforcing at most one non-terminal subscription per user.
- FR-004 Durable plan and status fields MUST use the Human-approved closed taxonomies and exact `CANCELLED`/`EXPIRED` semantics.
- FR-005 Provider event identity MUST be unique by provider key and provider event ID.
- FR-006 External subscription identity MUST be unique within a provider when present.
- FR-007 Every relationship MUST have explicit cardinality, indexes, nullability, and delete policy under FEAT-014.
- FR-008 User deletion MUST use RESTRICT/NO ACTION while subscription history exists.
- FR-009 Repository primitives for provider events, subscriptions, and transition records MUST support FEAT-013 transaction context propagation without implementing a transition-producing service.
- FR-010 Transition history MUST be append-only and separate from `AuthSecurityAuditRecord`.
- FR-011 No card data, CVV, raw payment credentials, raw webhook payload, or provider secret MAY be persisted.
- FR-012 FEAT-048 MUST own one additive, forward-only Prisma migration; FEAT-049..057 MUST add no Phase 7 migration.
- FR-013 Fresh deploy and real `phase-6-approved` upgrade validation MUST preserve representative Phase 2-6 rows and constraints.
- FR-014 Prisma MUST remain behind repository interfaces/factory and Unit of Work boundaries.
- FR-015 No public API, provider adapter, entitlement guard, UI, admin override, or existing-domain premium gate MAY be implemented.
- FR-016 Implementation evidence MUST map every task and AC and preserve Phase 2-6 regression behavior.

## Approved Durable Entities

- `UserSubscription`
- `SubscriptionProviderEvent`
- `SubscriptionTransitionRecord`

Plans and entitlement mappings are configuration-backed in the proposal; no plan or per-user entitlement table is introduced.

## Approved Decision Locks

D2: `FREE`/`PREMIUM` configuration catalog only. D3: no trial. D4: PAST_DUE grants no premium. D5: cancel-at-period-end reaches `EXPIRED` at `currentPeriodEnd`; provider-confirmed immediate cancellation may become `CANCELLED`; both are terminal. D6: dedicated `SubscriptionTransitionRecord`, no global/auth audit reuse. These Human decisions are approved and immutable during implementation.

## Dependencies

`phase-6-approved`; FEAT-013 repository/UoW; FEAT-014 constraints; FEAT-016 audit governance; Phase 2 authenticated User identity.

## Out Of Scope

APIs, checkout, cancellation command, webhooks, provider integration, entitlement evaluation, premium guard, UI, admin/support tools, payment storage, Redis authority, and Phase 8.
