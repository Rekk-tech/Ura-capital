# FEAT-043 Requirement: Comments API

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041 + FEAT-042
Phase: Phase 6 - Community
Type: Implementation
Owner: DEV-B / Antigravity

## Goal

Allow authenticated learners to read and create flat comments on visible posts and logically remove only their own comments.

## Functional Requirements

- FR-001 Expose only `GET /api/community/posts/:postId/comments`, `POST /api/community/posts/:postId/comments`, and `DELETE /api/community/comments/:commentId`.
- FR-002 Require authentication for every comment endpoint.
- FR-003 Accept exactly `{ content }` on create; trim and enforce 1..2,000 Unicode characters.
- FR-004 Derive post relation, author, status, and timestamps server-side.
- FR-005 Permit reads/creates only when the parent post is `VISIBLE`.
- FR-006 Persist new comments as `VISIBLE` and reject cross-post/forged relation fields.
- FR-007 Return safe comment DTO fields: `id`, safe author display name, `content`, `createdAt`, and `ownedByCurrentUser`.
- FR-008 Use cursor pagination ordered by `createdAt ASC, id ASC`; default 20, maximum 50.
- FR-009 Return only `VISIBLE` comments to ordinary learners.
- FR-010 Allow only the owner to delete; transition atomically to `REMOVED` with `removedAt`.
- FR-011 Use a safe non-enumerating 404 contract for unavailable posts/comments and cross-user delete attempts.
- FR-012 Keep comments flat; do not accept or persist parent/reply/depth fields.
- FR-013 Do not expose comment editing, comment likes, or recursive thread APIs.
- FR-014 Keep post `commentCount` equal to the relational count of visible comments.
- FR-015 Preserve repository/UoW, safe errors, prior feature behavior, and zero-migration expectation.
- FR-016 Add unit, API, live PostgreSQL, authorization, pagination, and regression tests.

## Out Of Scope

Replies, nested threads, editing, comment likes, mentions, notifications, moderation endpoints, anonymous reads, product audit persistence, UI, rate limiting, and schema changes.

## Dependencies

FEAT-041 persistence and FEAT-042 post visibility/DTO contracts must be Human-approved and QA PASS.
