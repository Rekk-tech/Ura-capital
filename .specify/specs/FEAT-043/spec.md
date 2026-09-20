# FEAT-043 Specification: Comments API

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041 + FEAT-042

## API Contract

- `GET /api/community/posts/:postId/comments?cursor=&limit=` returns visible comments ordered by `(createdAt ASC, id ASC)` with default 20/max 50.
- `POST /api/community/posts/:postId/comments` accepts exactly `{ content }`, returns 201, and derives post/author/status/timestamps server-side.
- `DELETE /api/community/comments/:commentId` owner-removes the comment and returns 204.

There are no PATCH routes, reply routes, or comment-like routes.

## DTO Contract

`CommunityCommentDto` contains `id`, `author: { displayName }`, `content`, `createdAt`, and `ownedByCurrentUser`. It excludes author/user IDs, email, roles, parent IDs, moderation internals, and original content after removal.

## Parent And Visibility Rules

The parent post must exist and be `VISIBLE` for list or create. Hidden/removed/missing posts share the unavailable response. Ordinary comment reads include only `VISIBLE`. Comment deletion does not change or delete the parent post.

## Thread And Delete Semantics

The model is flat. Any `parentCommentId`, `replyTo`, `depth`, post ID in body, author ID, status, or timestamp field is rejected. Deletion transitions the caller-owned comment to `REMOVED` and sets `removedAt` in one transaction. Repeated/foreign deletes return safe 404.

## Post Count Contract

`commentCount` in post DTOs counts only `VISIBLE` comments. It is derived relationally and changes immediately after create/removal without a materialized counter.

## Error And Boundary Contract

Use canonical 400/401/404/sanitized 5xx envelopes. Controllers/services do not import Prisma. No migration or Redis behavior is expected. FEAT-046 owns rate limiting.

## Verification

Test parent visibility, flat-field rejection, ordering/cursors, cross-user ownership, logical removal, count correctness, forced rollback, DTO privacy, and Phase 2-5/FEAT-041-042 regressions.
