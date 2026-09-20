# FEAT-044 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / DEPENDENCY BLOCKED

- AC-001 Only canonical post-like PUT and DELETE routes exist.
- AC-002 Both routes require authentication.
- AC-003 Both routes accept no client body or ownership input.
- AC-004 Responses contain only `postId`, `likedByCurrentUser`, and relational `likeCount`.
- AC-005 Malformed IDs and non-empty/forged bodies return safe validation errors.
- AC-006 Rejected requests cause zero Community mutation.
- AC-007 First PUT creates one caller/post like.
- AC-008 Repeated PUT returns success and never creates a duplicate.
- AC-009 PostgreSQL composite uniqueness is the final duplicate-race authority.
- AC-010 PUT returns canonical count after durable convergence.
- AC-011 DELETE removes only the caller/post row.
- AC-012 Repeated DELETE is successful and deterministically unliked.
- AC-013 Caller A cannot remove caller B's like.
- AC-014 Hidden, removed, and missing posts are not likeable.
- AC-015 Repository/constraint failures map to sanitized errors without permissive state.
- AC-016 API responses use canonical envelopes.
- AC-017 Feed/detail `likeCount` and `likedByCurrentUser` immediately match durable state.
- AC-018 Two users receive independent like state for the same post.
- AC-019 Unauthenticated requests return safe 401.
- AC-020 Five concurrent PUTs for one user/post produce exactly one durable row.
- AC-021 Concurrent likes from distinct users produce one durable row per user.
- AC-022 Live DB tests prove cross-user unlike isolation.
- AC-023 No migration, comment like, reaction taxonomy, materialized counter, Redis authority, audit persistence, or UI behavior is introduced.
- AC-024 Canonical 14 and truthful implementation-report traceability pass with no mandatory skips.
