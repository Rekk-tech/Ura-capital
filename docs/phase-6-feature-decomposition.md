# Aura Capital - Phase 6 Feature Decomposition

Status: HUMAN APPROVED / PLANNED  
Phase: Phase 6 - Community  
Owner: DEV-B  
Date: 2026-09-07  
Scope: Planning only. Application code changes: ZERO.

Human Master Planning Approval: APPROVED.

Implementation status:

```text
Contract-first preparation AUTHORIZED
Full production implementation pending Phase 6 Human product decisions
```

## 1. Earliest Safe Start

PHASE 6 CONTRACT-FIRST PREPARATION is AUTHORIZED after Human Master Planning Approval.

DEV-B may prepare Phase 6 because Human has approved this master plan and the frozen contracts in `docs/cross-phase-contracts.md`.

Allowed preparation:

- Reading frozen contracts.
- Detailed feature planning.
- Phase-local interfaces.
- Mocks and fixtures.
- Test design.
- Isolated scaffolding that does not commit unresolved product policy.

Constraints:

- Use a separate `phase/6-community` branch.
- Do not modify Phase 4/5 code.
- Do not merge before sequential integration after Phase 5.
- Use phase-local mocks only for SOFT/PROVISIONAL upstream contracts.
- Full production implementation is not automatically approved by master planning.
- Full production implementation requires Human decisions on public feed/read policy, Community UI scope, and moderation baseline.

## 2. Phase Boundary

In scope:

- Posts.
- Comments.
- Relational likes.
- Moderation baseline.
- Community UI if Human keeps it in Phase 6.

Out of scope:

- Simulation trading/social competition.
- Subscription billing.
- AI moderation or AI reply generation.
- Product audit persistence unless approved in a feature.

## 3. Dependency Classification

| Dependency | Type | Reason |
| --- | --- | --- |
| Phase 2 auth/security | HARD | Community writes are authenticated and user-owned. |
| Phase 3 data foundation | HARD | Requires PostgreSQL constraints, repositories, UoW, guards. |
| Phase 4 Academy | INDEPENDENT | Community MVP does not consume Academy data. |
| Phase 5 Simulation | INDEPENDENT | Community MVP does not consume Simulation data. |
| Phase 7 entitlement | SOFT | Premium community features may integrate later. |

## 4. Feature Sequence

| ID | Title | Type | Dependencies |
| --- | --- | --- | --- |
| FEAT-041 | Community Persistence Foundation | Implementation | Phase 2/3 frozen contracts |
| FEAT-042 | Posts API & Feed Read Models | Implementation | FEAT-041 |
| FEAT-043 | Comments API | Implementation | FEAT-041, FEAT-042 |
| FEAT-044 | Like/Unlike Relational Semantics | Implementation | FEAT-041, FEAT-042 |
| FEAT-045 | Moderation Baseline | Implementation | FEAT-041 through FEAT-044 |
| FEAT-046 | Community UI | Implementation | FEAT-042 through FEAT-045; Human UI scope decision |
| FEAT-047 | Phase 6 Community Integration Gate | Validation gate | FEAT-041 through FEAT-046 as applicable |

## 5. Feature Details

### FEAT-041 - Community Persistence Foundation

Goal: Create durable community schema and repositories.

Scope: posts, comments, post likes, moderation status fields, ownership FKs.

Acceptance: `post_likes` uses `(postId, userId)` unique; no `likedByUser` global mutable field; migrations fresh/upgrade pass.

### FEAT-042 - Posts API & Feed Read Models

Goal: Authenticated post creation and safe feed/detail reads.

Scope: create/update/delete own post, list/detail DTOs, pagination, moderation visibility.

Acceptance: Zod validation; owner-only writes; safe error envelopes; no client role trust.

### FEAT-043 - Comments API

Goal: Authenticated comment creation and owner/moderator controls.

Scope: comment create/update/delete, nested or flat read model as approved.

Acceptance: invalid parent rejected; owner isolation; deleted/hidden semantics deterministic.

### FEAT-044 - Like/Unlike Relational Semantics

Goal: Correct per-user like/unlike behavior.

Scope: `PUT like`, `DELETE like`, like count/read state.

Acceptance: duplicate likes prevented; unlike affects only current user; concurrency safe.

### FEAT-045 - Moderation Baseline

Goal: Provide minimal server-side moderation controls.

Scope: status transitions, admin/moderator guard, optional reports if approved.

Acceptance: non-admin cannot moderate; moderation state is auditable or explicitly deferred; hidden content visibility rules tested.

### FEAT-046 - Community UI

Goal: Build learner-facing community screens if Human keeps UI in Phase 6.

Scope: feed, post detail, comments, like/unlike, loading/error/empty states.

Acceptance: centralized API client; no hidden UI-only auth; accessibility baseline.

### FEAT-047 - Phase 6 Community Integration Gate

Goal: Validate integrated Community.

Scope: validation only; ownership, likes, comments, moderation, migrations, UI if included, regression.

Acceptance: no P0/P1 security/integrity defects; full validation PASS; Phase 7 integration readiness assessed.

## 6. Feature Contract Matrix

| Feature | Requirements | Dependencies | Contracts / APIs | Schema Ownership | Acceptance Gate | Integration Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| FEAT-041 | Durable community persistence | Phase 2/3 frozen contracts | Community repository interfaces | Owns `community_posts`, `community_comments`, `community_post_likes`, moderation status columns | Fresh/upgrade migrations; relational likes unique | Must not modify Academy/Simulation/Subscription/Auth schemas |
| FEAT-042 | Posts and feed APIs | FEAT-041 | `GET/POST /community/posts`, `GET/PATCH/DELETE /community/posts/:id` | Post indexes/status fields | Owner-only writes; safe pagination; moderation visibility | May mock premium gates only through provisional entitlement contract |
| FEAT-043 | Comments API | FEAT-041, FEAT-042 | `GET/POST /community/posts/:id/comments`, comment update/delete | Comment indexes/FKs | Invalid parent rejected; owner isolation | Must preserve post visibility rules |
| FEAT-044 | Like/unlike semantics | FEAT-041, FEAT-042 | `PUT /community/posts/:id/like`, `DELETE /community/posts/:id/like` | `post_likes` unique `(postId,userId)` | Duplicate like safe; unlike current user only; concurrent like safe | Must not store global `likedByUser` on posts |
| FEAT-045 | Moderation baseline | FEAT-041..044 | Admin/moderator routes only if approved | Moderation status/report tables if approved | Non-admin denied; hide/report semantics tested | Product audit activation or explicit deferral required |
| FEAT-046 | Community UI | FEAT-042..045 | Central web API client and UI route contracts | No schema | UI smoke/accessibility/loading/error states PASS | Must not rely on UI-hidden authorization |
| FEAT-047 | Final validation gate | FEAT-041..046 | Phase QA report | No schema | Full Phase 6 PASS/FAIL gate | Rebase onto latest Phase 5 main before merge |

## 7. Human Decisions Required

Blocking before implementation:

- Public read policy: anonymous read allowed or authenticated only.
- Community UI in Phase 6 or deferred to Phase 9.
- Moderation baseline: hide-only, report queue, admin actions, or deferred.

Deferred until integration:

- Premium community features.
- Product audit persistence activation for moderation events.
