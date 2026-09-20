# FEAT-041 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / APPROVED FOR IMPLEMENTATION

- AC-001 The implementation records the exact approved Phase 5 schema baseline.
- AC-002 All previously applied migration files remain byte-for-byte immutable.
- AC-003 Every Community table uses a server-generated UUID primary key.
- AC-004 Posts have required server-controlled author ownership.
- AC-005 Comments have required server-controlled author ownership.
- AC-006 Post/comment author FKs use `Restrict` and reject unsafe User deletion.
- AC-007 Comment-to-post FK is required and uses `Restrict`.
- AC-008 Like FKs use the approved dependent `Cascade` semantics.
- AC-009 PostgreSQL rejects blank or whitespace-only post content.
- AC-010 PostgreSQL rejects post content above 5,000 Unicode characters.
- AC-011 PostgreSQL rejects blank comments and comments above 2,000 Unicode characters.
- AC-012 PostgreSQL rejects status values outside `VISIBLE`, `HIDDEN`, `REMOVED`.
- AC-013 Required feed/comment/ownership/like indexes exist and match specified ordering.
- AC-014 PostgreSQL enforces one like per `(userId, postId)`.
- AC-015 No materialized like/comment counters, global liked flag, nested-comment field, or product schema outside Community is introduced.
- AC-016 Exactly one additive, forward-only FEAT-041 migration is introduced.
- AC-017 The migration contains no seed data, destructive operation, or product API behavior.
- AC-018 Repository interfaces exist for posts, comments, and post likes.
- AC-019 The same repository implementations support root and transaction clients and map DB errors safely.
- AC-020 The approved repository factory exposes Community repositories without controller/service Prisma access.
- AC-021 Errors and diagnostics expose no SQL, credentials, URLs, content values, or sensitive paths.
- AC-022 Live DB tests prove every FK and delete policy.
- AC-023 Five concurrent duplicate likes for one user/post produce exactly one durable row.
- AC-024 Academy, Simulation, Auth, Subscription, AI, Redis, and auth-audit boundaries remain unchanged.
- AC-025 A fresh isolated PostgreSQL database deploys all migrations and reports up to date.
- AC-026 An independent Phase 5 upgrade DB preserves representative rows, relationships, and prior constraints while creating Community schema correctly.
- AC-027 Canonical 14 passes with no mandatory skips.
- AC-028 The implementation report maps every criterion truthfully and FEAT-042 is not started.
