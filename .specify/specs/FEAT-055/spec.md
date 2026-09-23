# FEAT-055 Specification: Subscription Audit & Reconciliation

Status: DONE / SELF-VERIFICATION PASS / INTERNAL FEATURE GATE PASS / CHECKPOINT PUBLISHED

## Approved Taxonomy

- `SUBSCRIPTION_ACTIVATED`
- `SUBSCRIPTION_PLAN_CHANGED`
- `SUBSCRIPTION_PAST_DUE`
- `SUBSCRIPTION_CANCELLATION_REQUESTED`
- `SUBSCRIPTION_CANCELLED`
- `SUBSCRIPTION_EXPIRED`
- `SUBSCRIPTION_RECONCILED`

No provider retry/invalid-signature event is automatically durable product audit; those remain sanitized operational observations unless they cause a durable transition.

## Transaction Classification

- FEAT-052 owns provider-event-originated transition records; FEAT-053 owns command/reconciliation-originated transition evidence.
- Activated/upgrade grant: origin writer uses `TRANSACTIONALLY_COUPLED`; FEAT-055 verifies/hardens that invariant.
- Past-due, cancellation, expiry, downgrade, and other access reduction: origin writer uses `STATE_FIRST`; FEAT-055 verifies/hardens and reconciles audit-pending evidence.
- Reconciliation with no state change and duplicate observations: `BEST_EFFORT` or no durable event, per explicit taxonomy rule.

FEAT-055 never re-emits a correctly persisted normal transition and is not required for FEAT-052's signature, idempotency, state-transition, or origin-audit correctness.

## Metadata Contract

Allowed examples: previous/new plan, previous/new status, provider key, provider event ID or safe digest, cancel-at-period-end, period-boundary category, reconciliation reason code. Raw payloads, customer identifiers, payment data, identity email, secrets, tokens, cookies, URLs, and arbitrary nested metadata are prohibited.

## Reconciliation

An internal service lists FEAT-052/053 audit-pending evidence, attempts an idempotent transition-record append keyed to the source event/transition, and marks audit completion without reapplying subscription state. Concurrent workers converge through durable uniqueness. No public or admin route is introduced.

## Failure Safety

Grant audit failure rolls back grant. Revocation audit failure leaves reduced access committed and pending evidence. Audit/observability failures never make an entitlement denial permissive.
