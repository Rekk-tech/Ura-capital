# FEAT-044 Requirement: Like/Unlike Relational Semantics

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041 + FEAT-042
Phase: Phase 6 - Community
Type: Implementation
Owner: DEV-B / Antigravity

## Goal

Implement idempotent, concurrency-safe per-user likes for visible Community posts with PostgreSQL as final authority.

## Functional Requirements

- FR-001 Expose `PUT /api/community/posts/:postId/like` and `DELETE /api/community/posts/:postId/like` only.
- FR-002 Require authentication and derive `userId` from server context.
- FR-003 Permit likes only for `VISIBLE` posts; unavailable targets use safe 404.
- FR-004 `PUT` is idempotent and converges to one durable `(userId, postId)` row.
- FR-005 `DELETE` is idempotent and removes only the caller's like.
- FR-006 Return canonical `{ postId, likedByCurrentUser, likeCount }` state derived from PostgreSQL.
- FR-007 Treat the FEAT-041 composite unique constraint as duplicate-race authority; pre-check alone is insufficient.
- FR-008 Ensure five concurrent same-user likes produce exactly one row and successful deterministic responses.
- FR-009 Ensure concurrent distinct-user likes each persist independently.
- FR-010 Ensure unlike by one user never removes another user's row.
- FR-011 Immediately reflect canonical state in FEAT-042 feed/detail projections.
- FR-012 Reject forged user/owner/count/status/like IDs and non-empty bodies.
- FR-013 Preserve repository/UoW boundaries, safe errors, and zero-migration expectation.
- FR-014 Add unit, API, live PostgreSQL, concurrency, authorization, and regression tests.
- FR-015 Add no comment likes, Redis authority, product audit, UI, or rate limiting.

## Out Of Scope

Comment likes, reactions, dislike types, anonymous likes, optimistic UI, notifications, rankings, materialized counts, Redis durable state, and moderation behavior.

## Dependencies

FEAT-041 like constraint/repository and FEAT-042 post visibility/projection contracts must be approved and QA PASS.
