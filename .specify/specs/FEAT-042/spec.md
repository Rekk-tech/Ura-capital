# FEAT-042 Specification: Posts API & Feed Read Models

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-041

## API Contract

### `GET /api/community/posts`

Query: `cursor?: string`, `limit?: integer`. Default 20, maximum 50. Results are ordered by `(createdAt DESC, id DESC)`. The opaque versioned cursor encodes the last row's timestamp and UUID and is strictly decoded/validated; it is not an authorization token.

Response:

```text
data: CommunityPostDto[]
pageInfo: { nextCursor: string | null, hasNextPage: boolean }
```

### `GET /api/community/posts/:postId`

Returns one visible `CommunityPostDto`. Missing, hidden, removed, malformed, and foreign-sensitive resources use safe canonical 404/400 behavior as applicable.

### `POST /api/community/posts`

Body is exactly `{ content: string }`. Unknown properties, user/author IDs, status, counts, timestamps, role/admin claims, and visibility fields are rejected. Success returns 201 and the canonical DTO.

### `DELETE /api/community/posts/:postId`

Owner-only. Success atomically changes status to `REMOVED`, sets `removedAt`, and returns 204. Repeated, foreign, hidden, or nonexistent targets return the same safe 404 contract. No physical delete occurs.

## Safe DTO

`CommunityPostDto` contains:

- `id`
- `author: { displayName: string }`, with server fallback `Aura Learner`
- `content`
- `createdAt`
- `likeCount`
- `commentCount`
- `likedByCurrentUser`
- `ownedByCurrentUser`

It never contains `authorId`, email, account status, roles, credentials, refresh/session data, audit records, Prisma fields, hidden/removed original content, or internal moderation rationale.

## Authorization And Visibility

Authentication middleware derives user ID. Service-layer ownership and visibility checks use PostgreSQL. No client identity/status field is trusted. Feed/detail reads include only `VISIBLE`. A deleted post becomes unavailable immediately.

## Query And Transaction Policy

Repositories produce relational aggregate counts and current-user like state in a deterministic projection. Post creation is one durable write. Removal uses the FEAT-013 transaction runner so status/timestamp cannot diverge. Raw Prisma is prohibited in controllers and ordinary services.

## Error Contract

- 400 `VALIDATION_ERROR`: malformed body, UUID, cursor, or limit.
- 401 `UNAUTHENTICATED`: missing/invalid token.
- 404 `NOT_FOUND`: unavailable post or unauthorized delete target.
- 5xx sanitized database/infrastructure failure.

Rate limiting is owned by FEAT-046 and is not silently added here.

## Tests

Test DTO allowlisting, ordering/tie-breaker, pagination continuity, malformed cursor handling, aggregate correctness, create validation, spoof rejection, own removal, cross-user denial, removed/hidden exclusion, transaction rollback, and FEAT-041/Phase 2-5 regression.
