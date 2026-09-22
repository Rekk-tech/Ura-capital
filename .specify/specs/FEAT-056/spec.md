# FEAT-056 Specification: Subscription Learner UI

Status: DONE / INTERNAL FEATURE GATE PASS / CHECKPOINT PUBLISHED

## Experience Contract

The authenticated learner view is mounted at canonical top-level route `/subscription` and consumes only FEAT-050 safe DTOs. It shows the current server-derived plan/status, approved benefit labels, period information when applicable, and cancellation state. A missing subscription row is displayed as FREE; it is not an error and does not imply a durable FREE row exists. No admin UI exists.

## Approved Commerce Boundary

D10 defers real production checkout and cancellation for the current Phase 7 foundation. The production `/subscription` page is informational and read-only: no checkout, upgrade, subscribe, cancel, renewal, or mock-commerce CTA is rendered. No fake provider or local premium success state is allowed. A future production provider flow requires a separately approved feature and contract.

## State Matrix

- Loading: stable skeleton/progress state with no stale entitlement claim.
- FREE/no record: approved free-plan copy with no production subscribe or checkout action.
- ACTIVE: premium benefits and safe current-period/cancellation information.
- PAST_DUE: restricted copy matching D4 with no client-side grace override.
- Cancellation pending: remains ACTIVE only through the server-approved period boundary.
- CANCELLED/EXPIRED: no premium claim and no production renewal action.
- 401/403/409/429/503/5xx: canonical safe handling; `Retry-After` is honored where supplied.

## Hosted Checkout Safety

FEAT-056 exposes no production hosted-checkout navigation. The browser never constructs provider URLs, sends payment data, or accepts mock/test commerce artifacts in production. Any future hosted flow requires a new Human-approved provider and trusted-destination contract.

## Authority Boundary

TanStack Query/client state may improve presentation only. It cannot authorize protected content, infer entitlement from a successful command, or suppress a server denial. The UI invalidates/refetches authoritative reads after confirmed commands.

## Accessibility And Privacy

Status changes use accessible announcements; controls have clear labels and keyboard/focus behavior. No provider/customer/subscription identifier, raw error, secret, credential, token, cookie, payment datum, or sensitive diagnostic is rendered or logged.
