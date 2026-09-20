# FEAT-042 Requirement: Posts API & Feed Read Models

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041
Phase: Phase 6 - Community
Type: Implementation
Owner: DEV-B / Antigravity

## Goal

Provide authenticated learners with safe, deterministic Community feed/detail reads and create/delete-own-post behavior using FEAT-041 persistence.

## Functional Requirements

- FR-001 Expose only `GET /api/community/posts`, `GET /api/community/posts/:postId`, `POST /api/community/posts`, and `DELETE /api/community/posts/:postId`.
- FR-002 Require valid authentication for every endpoint; anonymous reads return the canonical safe 401 contract.
- FR-003 Accept only `{ content }` for creation, trim it, and enforce 1..5,000 Unicode characters.
- FR-004 Derive author, status, timestamps, counts, and ownership server-side.
- FR-005 Create posts as `VISIBLE` in PostgreSQL.
- FR-006 Use cursor pagination ordered by `createdAt DESC, id DESC`; default limit 20, maximum 50.
- FR-007 Reject malformed, mismatched, or oversized cursors/limits with safe 400 errors and no query mutation.
- FR-008 Return safe author projection `{ displayName }`; never expose email, user ID, roles, credentials, sessions, or audit data.
- FR-009 Return post DTO fields: `id`, safe author, `content`, `createdAt`, `likeCount`, `commentCount`, `likedByCurrentUser`, and `ownedByCurrentUser`.
- FR-010 Derive counts and current-user like state from relational queries; no client or Redis authority.
- FR-011 Return only `VISIBLE` posts to ordinary learners; `HIDDEN` and `REMOVED` are unavailable with non-enumerating 404 on detail.
- FR-012 Allow only the owning learner to delete a post; foreign/nonexistent IDs share the safe 404 contract.
- FR-013 Delete means atomic transition to `REMOVED` with server timestamp; comments/likes remain durable and original content is not returned afterward.
- FR-014 Do not expose post editing or status mutation.
- FR-015 Preserve controller-service-repository/UoW boundaries and safe error mapping.
- FR-016 Add unit, API integration, live PostgreSQL, authorization, pagination, and regression tests.
- FR-017 Add no migration, Redis behavior, moderation API, Community product audit, or Phase 7 behavior.

## Out Of Scope

Anonymous/public reads, editing, media, tags, search, ranking, recommendations, private/premium visibility, comments implementation, like mutation, rate limiting, moderation endpoints/UI, product audit persistence, and frontend Community UI.

## Dependencies

FEAT-041 Human-approved and QA PASS; Phase 2 authentication; FEAT-013 repositories/UoW; FEAT-014 constraints.
