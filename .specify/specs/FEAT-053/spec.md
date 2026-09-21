# FEAT-053 Specification: Subscription Lifecycle Commands

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

## Checkout

Production checkout is deferred. Provider-neutral checkout intent contracts may be exercised only in explicitly gated local/test/CI mock harnesses and never create ACTIVE entitlement. No production route, hosted checkout claim, provider price/customer/session exposure, fake checkout, or mock production fallback exists.

## Cancellation

Provider-neutral mock/test cancellation may affect only the authoritative current test subscription. D5 approved policy: request cancel-at-period-end; subscription remains ACTIVE through valid `currentPeriodEnd` and then becomes EXPIRED through verified provider state. CANCELLED is reserved for provider-confirmed immediate cancellation before normal expiry. Repeated cancel is idempotent. Provider failure returns safe retryable 5xx and produces zero local transition or entitlement grant.

## Reconciliation

An internal operation fetches canonical provider state for known subscriptions/events requiring review, compares trusted ordering facts, and applies transitions through the same processor/UoW as FEAT-052. It is not a public route and cannot grant manual premium.

## Abuse And Failure

Mock/dev/test mutation harnesses use bounded configuration-defined test-safe user/source ceilings, windows, deterministic `Retry-After`, shared Redis atomic counters, HMAC identifiers, trusted proxy policy, and fail closed before provider/DB mutation when unavailable. No production commerce limits are invented. A future production provider requires a new Human-approved numeric/retry/outage policy. Reads remain available from PostgreSQL.

## Audit

FEAT-053 writes transition evidence only for command/reconciliation-originated business transitions. Activation remains transactionally coupled. Cancellation/access reduction is state-first where rollback would keep excessive access. Duplicate requests do not amplify durable audit. FEAT-052 retains provider-event-originated transition ownership; FEAT-055 later hardens/reconciles audit integrity.
