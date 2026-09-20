# FEAT-045 Requirement: Moderation Baseline

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041..FEAT-044
Phase: Phase 6 - Community
Type: Security and moderation hardening
Owner: DEV-B / Antigravity

## Goal

Freeze Community moderation-state behavior and harden every write boundary against authorization abuse, IDOR, payload abuse, and rapid writes without adding public moderation administration.

## Human-Approved Decision Locks

- Moderation Option A: persistence/state policy is included; no public ADMIN moderation API or UI.
- `VISIBLE`, `HIDDEN`, `REMOVED` is the complete Phase 6 status set.
- Existing ADMIN role does not automatically gain a new public Community moderation capability.
- Community product audit persistence is deferred; `AuthSecurityAuditRecord` is never reused.
- Redis-backed write rate limiting is included; PostgreSQL remains Community authority.

## Functional Requirements

- FR-001 Enforce ordinary-learner visibility: only `VISIBLE` posts/comments are readable.
- FR-002 Enforce transition rules: `VISIBLE -> HIDDEN|REMOVED`, `HIDDEN -> VISIBLE|REMOVED`, and `REMOVED` terminal.
- FR-003 Owner deletion may request only `REMOVED`; clients cannot set status directly.
- FR-004 Provide no public moderation route, admin dashboard, report queue, or cross-user moderation endpoint.
- FR-005 Reject forged user, role, admin, status, moderation, count, timestamps, and relationship fields.
- FR-006 Apply non-enumerating ownership semantics to foreign post/comment deletion and unavailable content.
- FR-007 Rate limit post create at 10/user/10m plus source ceiling 60/10m.
- FR-008 Rate limit comment create at 30/user/10m plus source ceiling 180/10m.
- FR-009 Rate limit post delete at 30/user/10m and comment delete at 60/user/10m, with source ceilings 180/10m and 300/10m respectively.
- FR-010 Rate limit combined like/unlike mutations at 120/user/10m plus source ceiling 600/10m.
- FR-011 Use Redis atomic shared counters with TTL and multi-instance-safe behavior.
- FR-012 Use HMAC-SHA-256 keys with dedicated required `COMMUNITY_RATE_LIMIT_KEY_SECRET`; never include raw user ID, post/comment ID, IP, content, token, cookie, or credential in keys/logs.
- FR-013 Reuse approved proxy/IP semantics; untrusted forwarded headers cannot bypass source ceilings.
- FR-014 When Redis is unavailable, Community writes fail closed with safe 503 before PostgreSQL mutation; reads remain available.
- FR-015 Return canonical 429 `TOO_MANY_REQUESTS` with accurate `Retry-After`; no durable audit amplification.
- FR-016 Preserve uniform safe errors and sanitized diagnostics.
- FR-017 Preserve FEAT-016 product-audit abstraction while recording accepted deferral risk for Community moderation events.
- FR-018 Add unit, API, Redis-backed multi-instance, PostgreSQL no-mutation, security, and regression tests.
- FR-019 Add no migration, UI, public moderation behavior, product audit table, or Phase 7 behavior.

## Out Of Scope

ML/AI moderation, reporting workflow, moderator queue, admin API/UI, content editing, word filters, recommendation/ranking, durable Community audit table, and identity role changes.

## Dependencies

FEAT-041..044 QA PASS and Human-approved contracts; FEAT-007/008 RBAC principles; FEAT-010A rate-limit infrastructure; FEAT-015 Redis boundary; FEAT-016 audit governance.
