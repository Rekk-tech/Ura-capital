# FEAT-044 Specification: Like/Unlike Relational Semantics

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041 + FEAT-042

## API Contract

- `PUT /api/community/posts/:postId/like`: no request body; creates the caller/post relation if absent. Returns 200 with canonical state whether newly created or already liked.
- `DELETE /api/community/posts/:postId/like`: no request body; removes the caller/post relation if present. Returns 200 with canonical unliked state whether a row existed or not.

Response data is `{ postId, likedByCurrentUser: boolean, likeCount: integer }`.

## Authority And Idempotency

Authentication supplies user ID. PostgreSQL unique `(userId, postId)` is final duplicate protection. The service may use create-and-catch or an approved atomic upsert, but must safely map the unique race and query canonical count afterward. No client idempotency key is required because the target state is naturally idempotent.

## Visibility And Ownership

Only visible posts are likeable. Missing/hidden/removed posts return safe 404. Unlike deletion predicates include both caller user ID and post ID; no global delete by post is allowed.

## Concurrency

- Five concurrent PUTs by one user/post: one row, all successful canonical liked responses.
- Concurrent PUTs by different users: one row per user.
- Concurrent repeated DELETEs: zero caller rows and deterministic unliked responses.
- Unlike caller A leaves caller B unchanged.

## Boundaries

Counts are relational; Redis is not authority. No migration is expected. Controllers/services use repository interfaces/UoW. FEAT-046 owns transient rate limiting.

## Verification

Live PostgreSQL concurrency is mandatory; mocked concurrency alone is insufficient. Tests also cover malformed IDs, body spoofing, hidden/removed targets, count projection, safe errors, and regressions.
