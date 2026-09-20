# FEAT-046 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / DEPENDENCY BLOCKED

- AC-001 `/community` and `/community/posts/:postId` are the only new Community UI routes.
- AC-002 Both routes use the existing application shell and AuthProvider.
- AC-003 Unauthenticated learners see an auth-required state and no Community request is issued.
- AC-004 Access tokens remain in approved in-memory auth state and are never persisted or exposed.
- AC-005 Canonical API errors map to safe UI states.
- AC-006 Community HTTP calls are centralized in one API client.
- AC-007 Client requests use only approved paths and payload fields.
- AC-008 Cursors remain opaque and are not modified by UI code.
- AC-009 API errors expose no server internals.
- AC-010 Feed uses explicit load-more pagination and preserves server ordering.
- AC-011 Like/unlike disables duplicate interaction while pending.
- AC-012 UI does not optimistically mutate authoritative like/comment counts.
- AC-013 Successful mutations invalidate/refetch canonical affected queries.
- AC-014 Loading and empty states are complete and stable.
- AC-015 404 renders a safe unavailable-post state.
- AC-016 429 displays rate-limit guidance without leaking key/source details.
- AC-017 503 displays temporary write unavailability and never reports false success.
- AC-018 Valid post creation works; invalid content receives safe feedback.
- AC-019 Post cards render only approved safe DTO fields.
- AC-020 Owner removal controls work and non-owner UI controls are absent without being treated as authorization.
- AC-021 Feed can traverse multiple pages without duplicates.
- AC-022 Post detail renders canonical post data and flat comments.
- AC-023 Hidden/removed content and moderation internals are never rendered.
- AC-024 Comment create/remove workflows use approved contracts.
- AC-025 Like/unlike state and count match the server after refetch.
- AC-026 Navigation reaches Community routes without breaking Academy/Simulation routes.
- AC-027 Semantic headings, labels, focus, keyboard controls, and reduced-motion expectations pass.
- AC-028 User content renders as text with no unsafe HTML execution or layout overflow.
- AC-029 A real authenticated runtime journey completes feed, create, detail, comment, like/unlike, and owner removal.
- AC-030 No edit, nested reply, comment-like, moderation/admin, public-read, premium, backend, schema, migration, Redis, or audit behavior is introduced.
- AC-031 Canonical 14, frontend regressions, and truthful implementation report pass with no mandatory skips.
