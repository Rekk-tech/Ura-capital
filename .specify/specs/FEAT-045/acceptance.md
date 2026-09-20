# FEAT-045 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / DEPENDENCY BLOCKED

- AC-001 The complete status set remains `VISIBLE`, `HIDDEN`, `REMOVED`.
- AC-002 Approved transitions are enforced and `REMOVED` is terminal.
- AC-003 Owner deletes can request only the server-owned remove operation.
- AC-004 No public moderator/admin route or UI exists.
- AC-005 Existing ADMIN role does not implicitly gain a Community endpoint.
- AC-006 Durable Community product audit remains explicitly deferred.
- AC-007 No Community event is written to `AuthSecurityAuditRecord`.
- AC-008 Accepted audit-deferral risk is documented.
- AC-009 Ordinary reads return only visible content.
- AC-010 Hidden/removed content uses safe unavailable semantics.
- AC-011 Visibility predicates are consistent across feed, detail, comments, and likes.
- AC-012 Transition/service policy is server-controlled.
- AC-013 Forged identity/role/admin/status/count/timestamp/relation fields are rejected with zero mutation.
- AC-014 Cross-user deletion and unavailable resources remain non-enumerating.
- AC-015 Missing/reused Community limiter secret fails startup validation with no fallback.
- AC-016 Redis keys use the approved namespace and HMAC identifiers with no raw sensitive values.
- AC-017 Test/CI run and worker namespaces cannot collide or clean each other.
- AC-018 Post-create threshold is exactly 10/user and 60/source per 10 minutes.
- AC-019 Comment-create threshold is exactly 30/user and 180/source per 10 minutes.
- AC-020 Post-delete threshold is exactly 30/user and 180/source per 10 minutes.
- AC-021 Comment-delete threshold is exactly 60/user and 300/source per 10 minutes.
- AC-022 Like/unlike combined threshold is exactly 120/user and 600/source per 10 minutes.
- AC-023 Spoofed forwarded headers cannot bypass source ceilings under either proxy mode.
- AC-024 The first request above a limit returns exact 429, code, and accurate `Retry-After`.
- AC-025 Redis outage returns sanitized 503 before any Community DB mutation.
- AC-026 Throttled requests cause zero PostgreSQL mutation.
- AC-027 Authenticated Community reads remain available during Redis outage.
- AC-028 Writes recover automatically when Redis returns.
- AC-029 429/503 outcomes do not create durable auth/product audit amplification.
- AC-030 Keys, logs, responses, and diagnostics expose no raw user/content/IP/token/cookie/secret/Redis URL.
- AC-031 No schema, migration, report queue, ML moderation, or admin UI is introduced.
- AC-032 PostgreSQL remains durable Community authority; Redis remains transient-only.
- AC-033 Canonical 14, live Redis/PostgreSQL suites, regressions, and truthful report pass with no mandatory skips.
