# FEAT-045 Specification: Moderation Baseline

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041..FEAT-044

## Moderation Option A

Phase 6 ships status-aware persistence, visibility filtering, transition policy, and anti-spoofing. It does not expose a route or UI for ADMIN/moderator cross-user actions. `HIDDEN` is reserved for a future Human-approved server-controlled moderation entry point. Existing ADMIN authority is not expanded by inference.

Owner DELETE routes invoke only `VISIBLE -> REMOVED` for caller-owned content. `HIDDEN -> REMOVED` remains reserved for a future Human-approved server-controlled moderation entry point. `REMOVED` is terminal. Ordinary clients cannot send status or transition commands.

## Rate-Limit Policy

| Operation | Per authenticated user | Trusted-source ceiling |
| --- | --- | --- |
| Create post | 10 / 10 minutes | 60 / 10 minutes |
| Create comment | 30 / 10 minutes | 180 / 10 minutes |
| Delete post | 30 / 10 minutes | 180 / 10 minutes |
| Delete comment | 60 / 10 minutes | 300 / 10 minutes |
| Like + unlike combined | 120 / 10 minutes | 600 / 10 minutes |

Canonical route identity is used in keys so equivalent invocation paths cannot create extra quotas. There are no `/community` aliases in Phase 6.

## Redis Key Strategy

Namespace: `aura:{environment}:community-rl:v1:{operation}:{scope}:{hmacIdentifier}`. Identifier HMAC uses required `COMMUNITY_RATE_LIMIT_KEY_SECRET`, distinct from JWT, refresh, auth-rate-limit, and application secrets. Test keys add approved run/worker isolation without changing production semantics.

## Failure Semantics

- Exceeded policy: 429 with `TOO_MANY_REQUESTS`, safe message, integer `Retry-After` matching Redis TTL.
- Redis unavailable/invalid reply: write returns safe 503 before DB mutation.
- Community GET feed/detail/comments remain PostgreSQL-backed and available during Redis outage.
- Recovery requires no restart; subsequent writes resume when Redis is healthy.

## Proxy Policy

Reuse the approved environment `trust_proxy` contract. With trust disabled, ignore `X-Forwarded-For`. With trust enabled, Express resolves only the configured trusted proxy chain. Source identifiers are normalized then HMACed. Spoofed forwarded headers cannot bypass ceilings.

## Audit Decision

Durable Community product audit is deferred. This accepted risk covers post/comment creation and removal and future moderation actions. No Community event enters `AuthSecurityAuditRecord`; ordinary structured logs remain observability only and may not contain content or raw limiter identifiers.

## Verification

Tests must prove transition policy, no public moderation surface, forged field rejection, exact thresholds, shared multi-instance counters, alias absence, TTL/Retry-After, outage no-mutation, recovery, key/log privacy, source spoof resistance, read availability, and FEAT-009/010A/015/016 regressions.
