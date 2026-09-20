# FEAT-041 Specification: Community Persistence Foundation

Status: APPROVED FOR IMPLEMENTATION

## Data Model

### CommunityPost

| Field | Contract |
| --- | --- |
| `id` | UUID primary key, server generated |
| `authorId` | Required FK to `users.id`, `onDelete: Restrict` |
| `content` | Required text; trimmed length 1..5000 enforced by DB check |
| `status` | `VISIBLE`, `HIDDEN`, or `REMOVED`; default `VISIBLE`; DB closed set |
| `createdAt` | Server timestamp |
| `updatedAt` | Server-managed timestamp |
| `removedAt` | Nullable; required by transition policy when `REMOVED` |

Indexes: `(status, createdAt DESC, id DESC)` for feed, `(authorId, createdAt DESC)`, and the author FK lookup.

### CommunityComment

| Field | Contract |
| --- | --- |
| `id` | UUID primary key, server generated |
| `postId` | Required FK to `community_posts.id`, `onDelete: Restrict` |
| `authorId` | Required FK to `users.id`, `onDelete: Restrict` |
| `content` | Required text; trimmed length 1..2000 enforced by DB check |
| `status` | Same closed set and default as posts |
| `createdAt` | Server timestamp |
| `updatedAt` | Server-managed timestamp |
| `removedAt` | Nullable; transition-governed |

No parent/reply field is allowed. Indexes: `(postId, createdAt ASC, id ASC)`, `(authorId, createdAt DESC)`, and status-aware post reads.

### CommunityPostLike

| Field | Contract |
| --- | --- |
| `id` | UUID primary key, server generated |
| `postId` | Required FK to post, `onDelete: Cascade` |
| `userId` | Required FK to user, `onDelete: Cascade` |
| `createdAt` | Server timestamp |

PostgreSQL must enforce `UNIQUE(userId, postId)`. Indexes must support count by post and user/post lookup. No status or independent lifecycle is added.

## Status And Delete Semantics

- `VISIBLE`: eligible for authenticated reads.
- `HIDDEN`: not returned to ordinary learners; reserved for FEAT-045 server-controlled moderation.
- `REMOVED`: tombstoned and not returned with original content to ordinary learners.
- Public delete workflows later transition records to `REMOVED`; they do not physically delete rows.
- Physical deletion is not exposed through Phase 6 product APIs.
- Stored content retention and later erasure are accepted deferred governance risks; no global soft-delete convention is created outside Community.

## Repository Boundary

Define `ICommunityPostRepository`, `ICommunityCommentRepository`, and `ICommunityPostLikeRepository`. The same Prisma implementation classes must accept root or transaction clients through the FEAT-013 factory. No raw SQL is allowed outside the migration, repository, or DB test fixture boundaries.

## Constraint Strategy

Zod/service validation in later features provides safe errors. PostgreSQL remains final authority for requiredness, length checks, status integrity, FKs, and like uniqueness. Application pre-checks cannot replace constraints.

## Migration Contract

- Exactly one FEAT-041 Community migration is expected.
- It is additive, forward-only, and does not edit the eight approved Phase 5 migrations.
- It contains no seed or product content.
- Fresh DB and Phase 5 upgrade DB validation are mandatory.
- Upgrade evidence must preserve representative identity, Academy, Simulation, and audit rows and constraints.

## Security And Privacy

- Ownership identifiers are server-derived in later services.
- Repository types must not expose credential/session/audit internals.
- Redis, files, browser state, JWT claims, and logs are not Community authorities.
- `AuthSecurityAuditRecord` is unchanged and receives no Community events.

## Verification

Live PostgreSQL tests must prove UUID generation, length/blank rejection, status rejection, FK behavior, unique like rejection, concurrent duplicate-like convergence, deletion policies, migration reproducibility, and prior-phase preservation.
