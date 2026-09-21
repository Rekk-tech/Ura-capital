# FEAT-043 Implementation Report: Comments API

**Status**: IMPLEMENTATION COMPLETE / INTERNAL FEATURE GATE PASS  
**Phase**: Phase 6 — Community  
**Implementation Owner**: DEV-B / Antigravity  
**Planning / Architecture Owner**: Codex  
**Governance Process**: Fast-Track Feature Delivery  

---

## 1. Executive Summary

FEAT-043 delivers the flat, non-nested Community Comments API for authenticated learners on top of the FEAT-041 persistence foundation and FEAT-042 Posts API baseline. It delivers:
- **Authenticated comments feed read API** (`GET /api/community/posts/:postId/comments`) with ascending deterministic cursor pagination (`createdAt ASC, id ASC`) and opaque versioned cursors.
- **Authenticated comment create API** (`POST /api/community/posts/:postId/comments`) strictly validating 1..2,000 Unicode character content, enforcing parent post visibility, and server-deriving author identity and timestamps.
- **Authenticated owner-only logical removal API** (`DELETE /api/community/comments/:commentId`) enforcing strict owner authorization, atomic transition to `REMOVED`, and durable retention without physical deletion.
- **Safe non-enumerating 404 behavior** for missing, hidden, or removed parent posts, cross-user deletion attempts (IDOR protection), repeated deletions, and nonexistent comment IDs.
- **Post relational `commentCount` consistency**: dynamically reflects visible comments only; increments on comment creation and decrements on comment logical removal.
- **Strict whitelisted `CommunityCommentDto` projection**: exposes only approved fields (`id`, `author: { displayName }` with `"Aura Learner"` fallback, `content`, `createdAt`, `ownedByCurrentUser`), preventing identity and internal database leakage.
- **Strict boundary compliance**: zero nested replies/threading, zero comment editing, zero comment likes (deferred to FEAT-044), zero new database migrations (remains at 9), zero Redis durable authority, and zero product audit persistence.

---

## 2. API Routes & Contracts

| Method | Route | Auth | Request | Response | Status | Error Behavior |
|---|---|---|---|---|---|---|
| `GET` | `/api/community/posts/:postId/comments` | Bearer JWT | Params: `postId: UUID`<br>Query: `cursor?: string`, `limit?: integer` (1..50, default 20) | `{ data: CommunityCommentDto[], pageInfo: { nextCursor: string \| null, hasNextPage: boolean } }` | `200 OK` | `401 UNAUTHENTICATED`, `400 VALIDATION_ERROR`, `404 NOT_FOUND` |
| `POST` | `/api/community/posts/:postId/comments` | Bearer JWT | Params: `postId: UUID`<br>Body: `{ content: string }` (1..2000 chars trimmed) | `{ data: CommunityCommentDto }` | `201 CREATED` | `401 UNAUTHENTICATED`, `400 VALIDATION_ERROR`, `404 NOT_FOUND` |
| `DELETE` | `/api/community/comments/:commentId` | Bearer JWT | Params: `commentId: UUID` | Empty body | `204 NO_CONTENT` | `401 UNAUTHENTICATED`, `400 VALIDATION_ERROR`, `404 NOT_FOUND` |

Disallowed routes (e.g. `PATCH /api/community/comments/:commentId`, `PUT /api/community/comments/:commentId`, `GET /api/community/comments/:commentId`, nested reply paths) are strictly rejected with standard 404 envelopes.

---

## 3. Cursor Pagination & Ascending Deterministic Ordering

1. **Ordering Contract**: Results are ordered chronologically by `(createdAt ASC, id ASC)` — oldest comments first.
2. **Opaque Versioned Codec**:
   - Version: `1`
   - Encoded payload: `{ v: 1, createdAt: ISO8601, id: UUID }` converted to `base64url`.
   - Strict validation: malformed base64, non-JSON strings, missing properties, unsupported versions, invalid dates, and invalid UUIDs reject with `400 VALIDATION_ERROR`.
3. **Database Traversal Query**:
   - Query condition:
     ```sql
     WHERE post_id = $postId
       AND status = 'VISIBLE'
       AND (
         created_at > $cursorCreatedAt
         OR (created_at = $cursorCreatedAt AND id > $cursorId)
       )
     ORDER BY created_at ASC, id ASC
     LIMIT $limit + 1;
     ```
   - Matches composite index `community_comments_post_id_created_at_id_idx`.
   - Guaranteed zero duplicate rows and zero missing rows across identical timestamps.

---

## 4. Safe DTO Projection & Data Privacy

`CommunityCommentDto` exposes exactly 5 approved fields:
```typescript
export interface CommunityCommentDto {
  id: string;
  author: {
    displayName: string;
  };
  content: string;
  createdAt: string;
  ownedByCurrentUser: boolean;
}
```

- **Author fallback**: If `user.displayName` is null, empty, or whitespace-only, safely falls back to `"Aura Learner"`.
- **Identity & Security Protection**: Explicitly excludes `authorId`, `postId`, `status`, `removedAt`, `updatedAt`, emails, role records, credentials, refresh sessions, and Prisma internal fields.

---

## 5. Parent Post Visibility Gate & Anti-Enumeration

- Before listing or creating comments, the parent post's status is verified via `postRepo.findVisiblePostDetail(postId)`.
- If the parent post does not exist, is in `HIDDEN` status, or is in `REMOVED` status, the request immediately terminates with a uniform 404 `NOT_FOUND` error (`"Post not found"`).
- Nonexistent, foreign-authored, or already-removed comment targets on deletion return identical safe 404 `NOT_FOUND` (`"Comment not found"`) envelopes to prevent enumeration of content and ownership.

---

## 6. Creation & Logical Removal

- **Creation**:
  - Validated by Zod `CreateCommunityCommentBodySchema.strict()`.
  - Content must be 1..2,000 characters after trimming.
  - Rejects unknown fields (`parentCommentId`, `replyTo`, `depth`, `authorId`, `status`, `postId`, `removedAt`, `createdAt`).
  - Executed within `txRunner.run` verifying parent post visibility and persisting with `status = 'VISIBLE'`, `removedAt = null`.
- **Logical Removal**:
  - Executed within `txRunner.run` via `removeCommentIfOwner(commentId, authorId)`.
  - Atomically transitions `status = 'REMOVED'`, `removedAt = new Date()`.
  - Row remains permanently durable in PostgreSQL; zero physical deletion.
  - Excluded from subsequent comment feed lists.

---

## 7. Relational Counts Authority

- `commentCount` on `CommunityPostDto` is relationally derived from:
  ```typescript
  _count: {
    select: {
      comments: {
        where: { status: "VISIBLE" },
      },
      likes: true,
    },
  }
  ```
- Adding a visible comment increments the parent post's `commentCount`.
- Logically removing a comment decrements the parent post's `commentCount`.
- No client-supplied counts or durable Redis counters.

---

## 8. Architecture & Boundary Guard Compliance

- **Layering**: Controller (`CommunityCommentController`) → Service (`CommunityCommentService`) → Repository (`ICommunityCommentRepository`, `ICommunityPostRepository`) → PostgreSQL (`PrismaClient`).
- **Boundary Guard**: `scripts/guard-repository-boundary.ts` verifies:
  - Zero `@prisma/client` imports in `community-comment.controller.ts`.
  - Zero `@prisma/client` imports in `community-comment.service.ts`.
  - Zero raw SQL outside allowlisted repository modules.
  - Scanned: 17 controllers, 22 services, 8 repositories — 0 violations.

---

## 9. Boundary Governance Compliance

- **Migrations**: ZERO new database migrations (remains at 9 migrations). Verified by `guard:migration`.
- **Redis State**: ZERO durable authority or comment caching in Redis.
- **Product Audit**: Community product audit remains DEFERRED. Zero entries in `AuthSecurityAuditRecord`. Verified by `guard:audit-governance`.
- **FEAT-044 Boundary**: ZERO like/unlike comment or post reaction endpoints/logic introduced.
- **Flat Architecture**: ZERO nested comment schemas, parentCommentId columns, or recursive reply trees.

---

## 10. Canonical 14 Validation Results

| Step | Command | Result | Details |
|---|---|---|---|
| 1 | `npm run clean` | **PASS** | Cleaned dist and build caches |
| 2 | `npm run lint` | **PASS** | 0 errors, 0 warnings across workspace |
| 3 | `npx prisma validate` | **PASS** | Schema valid with 30 models |
| 4 | `npm run typecheck` | **PASS** | 0 TypeScript errors across all workspaces |
| 5 | `npm run build` | **PASS** | `@aura/shared`, `@aura/api`, and `@aura/web` built |
| 6 | `npm run test` | **PASS** | 75 test files, 860 tests passed |
| 7 | `npm run test:unit` | **PASS** | 50 test files, 640 tests passed |
| 8 | `npm run test:db` | **PASS** | 33 test files, 449 tests passed |
| 9 | `npm run test:redis` | **PASS** | 5 test files, 50 tests passed |
| 10 | `npm run guard:persistence` | **PASS** | 14/14 persistence boundary tests passed |
| 11 | `npm run guard:migration` | **PASS** | 9/9 migrations, 0 blocking risks |
| 12 | `npm run guard:boundary` | **PASS** | 17 controllers, 22 services, 8 repos clean |
| 13 | `npm run guard:audit-governance` | **PASS** | Zero premature product audit schemas/APIs |
| 14 | `npm run guard:seed-safety` | **PASS** | Zero unsafe seed scripts or fixtures |

---

## 11. Acceptance Criteria Traceability Matrix

| AC | Requirement | Implementation & Test Evidence | Status |
|---|---|---|---|
| **AC-001** | Only the three approved comment routes exist | `community.routes.ts`, `community-comments-routes.test.ts` | **PASS** |
| **AC-002** | Every comment endpoint requires authentication | `community.routes.ts`, `community-comments-routes.test.ts` | **PASS** |
| **AC-003** | Comment list uses canonical data/pageInfo envelope | `community-comment.controller.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-004** | Default page size is 20 and maximum is 50 | `community-comment.validation.ts`, `community-comments-routes.test.ts` | **PASS** |
| **AC-005** | Ordering is exactly `createdAt ASC, id ASC` | `community.repository.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-006** | Create accepts only `content` | `CreateCommunityCommentBodySchema.strict()`, `community-comments.unit.test.ts` | **PASS** |
| **AC-007** | Blank and over-2,000-character comments rejected | `CreateCommunityCommentBodySchema`, `community-comments-routes.test.ts` | **PASS** |
| **AC-008** | Parent/author/status/timestamp/reply fields rejected | `CreateCommunityCommentBodySchema.strict()`, `community-comments.unit.test.ts` | **PASS** |
| **AC-009** | No parent/reply/depth field or recursive route exists | `community-comment.validation.ts`, `community.routes.ts` | **PASS** |
| **AC-010** | Cursor traversal has no duplicate or missing comments across equal timestamps | `community-comment-cursor.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-011** | Only `VISIBLE` comments appear to ordinary learners | `community.repository.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-012** | Removed/hidden original comment content is never returned | `community.repository.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-013** | Create is unavailable when parent post is missing, hidden, or removed | `community-comment.service.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-014** | Owners can logically remove their comments | `community.repository.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-015** | Cross-user, repeated, and nonexistent removals share safe 404 behavior | `community-comment.service.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-016** | Removal atomically sets `REMOVED` and `removedAt`, with rollback on DB failure | `community.repository.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-017** | Post `commentCount` equals live relational count of visible comments after create/removal | `community.repository.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-018** | DTOs expose only safe author display name and approved fields | `community-comment.dto.ts`, `community-comments.unit.test.ts` | **PASS** |
| **AC-019** | Controllers/services use repositories/UoW and sanitize infrastructure errors | `guard:boundary`, `community-comments-db.test.ts` | **PASS** |
| **AC-020** | Success and failure responses use canonical envelopes | `community-comment.controller.ts`, `community-comments-routes.test.ts` | **PASS** |
| **AC-021** | Valid creation returns 201 with server-derived ownership/status/timestamps | `community-comment.service.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-022** | Two authenticated users can comment independently without ownership leakage | `community-comment.dto.ts`, `community-comments-db.test.ts` | **PASS** |
| **AC-023** | Parent visibility behavior is proven against live PostgreSQL | `community-comments-db.test.ts` | **PASS** |
| **AC-024** | Spoofed ownership/relation/moderation input causes zero mutation | `community-comment.validation.ts`, `community-comments-routes.test.ts` | **PASS** |
| **AC-025** | No edit, nested reply, comment like, migration, Redis authority, product audit, or UI behavior is introduced | Architecture / Schema review, `guard:migration`, `guard:audit-governance` | **PASS** |
| **AC-026** | Canonical 14 and truthful implementation-report traceability pass with no mandatory skips | Canonical 14 PASS (14/14 commands) | **PASS** |

---

## 12. Task Traceability Matrix

| Task | Description | Status |
|---|---|---|
| **T001** | Freeze comment route, DTO, cursor, and error contracts | **DONE** |
| **T002** | Implement strict body/param/query validation | **DONE** |
| **T003** | Extend comment repository visible-list projection | **DONE** |
| **T004** | Extend comment repository create and owner-removal operations | **DONE** |
| **T005** | Extend post repository/service projection for visible `commentCount` | **DONE** |
| **T006** | Implement safe comment DTO mapper | **DONE** |
| **T007** | Implement comment service with parent visibility and UoW policies | **DONE** |
| **T008** | Implement comment controller and exact authenticated routes | **DONE** |
| **T009** | Add validation/cursor/DTO unit tests | **DONE** |
| **T010** | Add comment list/create API integration tests | **DONE** |
| **T011** | Add parent hidden/removed/missing behavior tests | **DONE** |
| **T012** | Add forged relation/author/status/nesting rejection tests | **DONE** |
| **T013** | Add owner/cross-user/repeated removal and rollback tests | **DONE** |
| **T014** | Add live DB ordering/cursor and visible-count consistency tests | **DONE** |
| **T015** | Prove no edit/reply/comment-like/schema/Redis/audit scope creep | **DONE** |
| **T016** | Run canonical 14 with no mandatory skips | **DONE** |
| **T017** | Create `reports/implementation/phase-6/FEAT-043.md` with exact mappings | **DONE** |

---

## 13. Internal Feature Gate Verdict

**INTERNAL FEATURE GATE**: **PASS**

- All 17 tasks complete.
- All 26 Acceptance Criteria PASS.
- Canonical 14: 14/14 PASS without skips.
- Zero migrations added.
- Zero Redis durable state added.
- Zero FEAT-044+ changes introduced.
- Status: **FEAT-043: DONE / INTERNAL FEATURE GATE PASS**.
- Next Feature: **FEAT-044: UNBLOCKED FOR IMPLEMENTATION**.
