# ADR-004: Authentication and Token Strategy

**Status**: Accepted  
**Date**: 2026-08-25

## Context

The legacy system had unsafe JWT fallback behavior. Aura Capital requires server-enforced authentication, authorization, roles, sessions, premium entitlements, and auditability.

## Decision

Use:

- Short-lived access tokens, 5-15 minutes.
- Rotated, revocable refresh tokens.
- Refresh tokens stored in HttpOnly, Secure, SameSite cookies.
- Refresh-token session state persisted in PostgreSQL.
- Redis only for optional rate-limit/session acceleration or replay-detection cache.

## Rationale

- Limits compromise window for access tokens.
- Supports logout and refresh revocation.
- Keeps durable auth/session auditability in PostgreSQL.
- Protects refresh tokens from browser JavaScript access.

## Rejected Alternatives

- Long-lived access tokens: rejected due to weak revocation and higher compromise impact.
- Browser-readable refresh tokens: rejected due to XSS exposure.
- Stateless refresh-only strategy: rejected due to weak revocation/auditability.
- Client-controlled roles/premium state: rejected by server trust boundary.

## Consequences

- Phase 2 must implement password hashing, registration, login, refresh rotation, logout/revocation, role guards, admin guard, and auth audit events.
- Startup must fail if required auth secrets are missing.
- Authorization must be enforced server-side.
