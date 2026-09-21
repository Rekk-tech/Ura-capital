# FEAT-050 Specification: Subscription Read APIs

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

## Route Contract

- `GET /api/subscriptions/plans`: PUBLIC SAFE READ. It returns canonical plan key, safe display name, safe benefit copy, and availability only. Provider price ID is excluded unless separately and explicitly Human-approved; provider/customer/subscription identifiers are always excluded.
- `GET /api/subscriptions/me`: authenticated current-user read. It returns effective plan, effective status, safe period/cancel-at-period-end facts, and entitlement keys from FEAT-049.

Both routes reject unexpected query/body authority fields under project validation conventions. There is no `/:userId` route. The public plan route does not reveal whether any user has a subscription.

## Layering

Controller validates and formats; service invokes catalog/resolver; repositories remain behind FEAT-049. GET handlers perform no database write, provider call, audit emission, or Redis mutation.

## Error Contract

Missing authentication returns canonical 401. Repository/integrity failure returns sanitized 5xx. A missing subscription is not 404; it is a successful FREE projection. Provider identifiers and configuration remain absent from errors/logs.

## Testing

Unit/controller/API/PostgreSQL-backed tests verify current-user isolation, no mutation, DTO exactness, and FEAT-049 status/time semantics through the HTTP boundary.
