# FEAT-049 Specification: Plan Catalog & Entitlement Resolution

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

## Catalog Contract

Approved plan keys are `FREE` and `PREMIUM`. Safe display metadata may be exposed; provider price IDs, secrets, and operational mappings remain internal. The approved capability map is `FREE -> []` and `PREMIUM -> [PREMIUM_ACCESS]`.

## Effective Entitlement Algorithm

1. Accept only server-derived user identity.
2. Load the user's non-terminal subscription from the repository.
3. If absent, return FREE with no entitlement.
4. Validate the stored plan/status against canonical constants.
5. Evaluate period bounds using an injected server clock.
6. Apply Human-approved trial, past-due, and cancellation policy.
7. Return a safe immutable entitlement context containing plan key, effective status, entitlement keys, and safe period/cancellation facts.

Approved policy: no trial or `TRIALING`; PAST_DUE has no grace and grants no premium; `ACTIVE + cancelAtPeriodEnd` remains active only through valid `currentPeriodEnd`, then is `EXPIRED`; `CANCELLED` is used only for provider-confirmed immediate cancellation before normal expiry. CANCELLED/EXPIRED/invalid state denies.

## Failure Contract

Repository/infrastructure errors map to a safe 5xx and never grant. Invalid durable state is treated as an integrity failure, logged with sanitized correlation data, and denies access. No response/log contains provider customer/subscription IDs or configuration secrets.

## Boundary

The resolver is a service depending on repository interfaces and server-owned catalog/clock ports. It creates no route, schema, migration, cache, provider adapter, or domain gate.
