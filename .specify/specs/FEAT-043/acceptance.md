# FEAT-043 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / DEPENDENCY BLOCKED

- AC-001 Only the three approved comment routes exist.
- AC-002 Every comment endpoint requires authentication.
- AC-003 Comment list uses the canonical data/pageInfo envelope.
- AC-004 Default page size is 20 and maximum is 50.
- AC-005 Ordering is exactly `createdAt ASC, id ASC`.
- AC-006 Create accepts only `content`.
- AC-007 Blank and over-2,000-character comments are rejected with zero mutation.
- AC-008 Parent/author/status/timestamp/reply fields are rejected.
- AC-009 No parent/reply/depth field or recursive route exists.
- AC-010 Cursor traversal has no duplicate or missing comments across equal timestamps.
- AC-011 Only `VISIBLE` comments appear to ordinary learners.
- AC-012 Removed/hidden original comment content is never returned.
- AC-013 Create is unavailable when the parent post is missing, hidden, or removed.
- AC-014 Owners can logically remove their comments.
- AC-015 Cross-user, repeated, and nonexistent removals share safe 404 behavior.
- AC-016 Removal atomically sets `REMOVED` and `removedAt`, with rollback on DB failure.
- AC-017 Post `commentCount` equals the live relational count of visible comments after create/removal.
- AC-018 DTOs expose only safe author display name and approved fields.
- AC-019 Controllers/services use repositories/UoW and sanitize infrastructure errors.
- AC-020 Success and failure responses use canonical envelopes.
- AC-021 Valid creation returns 201 with server-derived ownership/status/timestamps.
- AC-022 Two authenticated users can comment independently without ownership leakage.
- AC-023 Parent visibility behavior is proven against live PostgreSQL.
- AC-024 Spoofed ownership/relation/moderation input causes zero mutation.
- AC-025 No edit, nested reply, comment like, migration, Redis authority, product audit, or UI behavior is introduced.
- AC-026 Canonical 14 and truthful implementation-report traceability pass with no mandatory skips.
