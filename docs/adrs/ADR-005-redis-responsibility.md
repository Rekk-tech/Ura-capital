# ADR-005: Redis Responsibility Boundary

**Status**: Accepted  
**Date**: 2026-08-25

## Context

Aura Capital needs fast transient/distributed capabilities for rate limits, quotas, locks, caching, sessions, simulation coordination, and leaderboards. Durable data must remain auditable and recoverable.

## Decision

Use Redis only for transient and distributed state. PostgreSQL remains the source of truth for durable business data.

## Allowed Responsibilities

- Rate limits.
- Short-lived session/cache metadata.
- Distributed locks.
- Simulation transient state.
- Leaderboard cache.
- AI quota counters.

## Rejected Alternatives

- Redis as durable business store: rejected because it weakens auditability and recovery.
- No Redis: rejected because future simulation, AI quota, and rate-limit workflows need transient distributed state.

## Consequences

- Redis outage behavior must be defined per feature.
- Business-sensitive Redis data must have a PostgreSQL durability/audit counterpart when required.
- Key naming and isolation strategy must be defined before Redis-heavy features.
