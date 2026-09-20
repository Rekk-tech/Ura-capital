# FEAT-045 Plan: Moderation Baseline

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041..FEAT-044

## Delivery Sequence

1. Freeze moderation transition and no-public-admin decisions.
2. Centralize Community authorization/visibility policy and spoof rejection.
3. Define required Community limiter configuration and HMAC key factory.
4. Add atomic Redis limiters to every Community write route.
5. Implement fail-closed outage and recovery behavior while keeping reads available.
6. Add unit, API, Redis multi-instance, PostgreSQL no-mutation, and security tests.
7. Run canonical validation and publish deferral/security evidence.

## Schema And Migration Impact

Zero. FEAT-041 owns statuses and schema. No audit, report, or moderation-history table is created.

## Test Strategy

Unit transition/key/proxy/error tests; API spoof/IDOR/threshold tests; live Redis TTL/outage/recovery/multi-instance tests; live PostgreSQL zero-mutation assertions; source-log sanitization; canonical regression.

## Risks

Fail-closed Redis policy temporarily blocks writes during outage by design. NAT-heavy sources can hit source ceilings; per-user limits remain primary. Deferring durable moderation audit reduces investigation evidence and is an explicit Human risk decision.

## Completion Gate

All authorization, status, rate-limit, outage, privacy, and regression tests pass live. No public moderation API/UI or audit persistence exists.
