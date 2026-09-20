# FEAT-042 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / DEPENDENCY BLOCKED

- AC-001 Only the four approved `/api/community/posts` routes exist.
- AC-002 Every post endpoint requires valid authentication.
- AC-003 Anonymous feed/detail access returns the canonical safe 401 response.
- AC-004 Feed defaults to 20 and rejects limits above 50.
- AC-005 Feed response uses the canonical data/pageInfo envelope.
- AC-006 Create accepts only `content` and rejects unknown fields.
- AC-007 Blank/whitespace and over-5,000-character content is rejected before persistence.
- AC-008 Malformed UUID, cursor, and limit inputs return safe 400 responses.
- AC-009 Feed ordering is exactly `createdAt DESC, id DESC`.
- AC-010 Cursor traversal has no duplicate or missing rows across equal timestamps.
- AC-011 Feed returns only `VISIBLE` posts.
- AC-012 Hidden and removed post details are unavailable to ordinary learners.
- AC-013 Like/comment counts are derived from PostgreSQL relations.
- AC-014 `likedByCurrentUser` is derived for the authenticated user and cannot be spoofed.
- AC-015 New posts persist with server-derived author, `VISIBLE` status, and server timestamps.
- AC-016 Owners can logically remove their posts.
- AC-017 Removal atomically sets `REMOVED` and `removedAt`, with rollback on forced failure.
- AC-018 Foreign, repeated, or nonexistent delete targets share safe non-enumerating 404 behavior.
- AC-019 DTOs expose only approved fields and safe display name; no user ID/email/security data leaks.
- AC-020 Controllers/services use repositories/UoW and expose no raw database errors.
- AC-021 Success and failure responses use the canonical Aura envelope.
- AC-022 No post edit/status route, anonymous alias, or unapproved route exists.
- AC-023 Valid creation returns 201 and a canonical DTO.
- AC-024 Feed/detail return correct content and ownership flags for two independent users.
- AC-025 Forged author/status/count/role/admin fields are rejected with zero mutation.
- AC-026 Live PostgreSQL tests prove visibility and ownership behavior.
- AC-027 Zero migration, Redis authority, product audit, comment/like mutation, or Phase 7 behavior is introduced.
- AC-028 Canonical 14 and implementation report traceability pass with no mandatory skips.
