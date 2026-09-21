# FEAT-054 Specification: Premium Entitlement Authorization Guard

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

## Guard Contract

```text
authenticate
-> requireEntitlement(PREMIUM_ACCESS)
-> handler
```

The middleware accepts a canonical compile-time entitlement key and an injected resolver interface. It reads `req.user` established by FEAT-004, resolves current PostgreSQL-backed entitlement through FEAT-049, optionally attaches a trusted entitlement context, and calls the handler only when the requested capability is present.

## Failure Semantics

- No authenticated principal: 401 `UNAUTHENTICATED`.
- Authenticated but not entitled: 403 `ENTITLEMENT_REQUIRED` with generic safe message.
- Invalid key or durable/infrastructure failure: sanitized 5xx; never 403 success/fallback.
- No subscription/provider IDs, period details, plan internals, or upgrade hint in denial errors unless a later UI contract explicitly approves safe copy.

## Immediacy

The access token identifies the user only. Grant/removal/status changes in PostgreSQL are reflected with the same token on the next check. Redis and frontend flags cannot extend access.

## Integration Boundary

Production route integration is deferred for all Academy, Simulation, Community, and AI routes by D9. Tests use an isolated non-public harness; no public test/premium endpoint or existing-domain behavior is added.
