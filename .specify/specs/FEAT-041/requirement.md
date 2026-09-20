# FEAT-041 Requirement: Community Persistence Foundation

Status: APPROVED FOR IMPLEMENTATION
Phase: Phase 6 - Community
Type: Implementation
Owner: DEV-B / Antigravity

## Goal

Create the durable PostgreSQL/Prisma foundation for learner Community posts, flat comments, and per-user post likes without exposing product APIs.

## Human-Approved Decision Locks

These decisions are binding under the Human-approved Phase 6 master plan:

- Community reads and writes are authenticated-only.
- One audience tier exists; `VISIBLE`, `HIDDEN`, and `REMOVED` are moderation states, not privacy tiers.
- Post editing and comment editing are deferred.
- Comments are flat; no `parentCommentId` or recursive replies.
- Likes target posts only.
- Public deletion is logical removal; durable rows and relationships are preserved.
- Counts are relational aggregates, not materialized columns.
- Durable Community product audit is deferred for Phase 6.

## Functional Requirements

- FR-001 Add `CommunityPost`, `CommunityComment`, and `CommunityPostLike` to the approved Prisma schema.
- FR-002 Use server-generated UUID primary keys and server-controlled timestamps.
- FR-003 Relate posts and comments to `User` through required author foreign keys with `Restrict` deletion.
- FR-004 Relate comments to posts with a required foreign key and `Restrict` deletion.
- FR-005 Relate likes to users and posts with `Cascade` deletion because a like has no independent history.
- FR-006 Enforce exactly one like per `(userId, postId)` in PostgreSQL.
- FR-007 Enforce non-empty trimmed post content with a maximum of 5,000 Unicode characters.
- FR-008 Enforce non-empty trimmed comment content with a maximum of 2,000 Unicode characters.
- FR-009 Enforce the closed status set `VISIBLE`, `HIDDEN`, `REMOVED` at database level.
- FR-010 Default new posts and comments to `VISIBLE`; public clients cannot provide status or ownership.
- FR-011 Add indexes supporting deterministic post feed order, comment order, ownership checks, status filtering, and like aggregation.
- FR-012 Do not add materialized `likeCount`, `commentCount`, or global `likedByUser` fields.
- FR-013 Extend the FEAT-013 repository factory with Community repository interfaces and Prisma implementations; controllers/services remain absent.
- FR-014 Introduce one forward-only, non-destructive, seed-free FEAT-041 migration.
- FR-015 Validate fresh deployment and upgrade from the approved Phase 5 schema with representative prior rows preserved.
- FR-016 Verify constraints and concurrency against live isolated PostgreSQL.
- FR-017 Preserve Academy, Simulation, Auth, Subscription, AI, Redis, and audit boundaries.
- FR-018 Produce truthful implementation evidence and preserve canonical validation.

## Out Of Scope

Community routes, controllers, services, UI, moderation endpoints, reports, private messaging, public/anonymous reads, post/comment editing, nested replies, comment likes, premium visibility, product audit persistence, Redis durable state, and Phase 7 behavior.

## Dependencies

- Phase 2 authenticated user and PostgreSQL role authority.
- FEAT-012 migration governance.
- FEAT-013 repository/UoW pattern.
- FEAT-014 data constraint standards.
- FEAT-016 product audit governance.
- Phase 5 approved schema and migration checkpoint.
