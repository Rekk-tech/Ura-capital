# Aura Capital - Phase 6 Feature Decomposition

Status: HUMAN MASTER PLANNING APPROVED
Phase: Phase 6 - Community
Planning / Architecture Owner: Codex
Implementation Owner: DEV-B / Antigravity
Human Owner: Planning Approval and Phase Final Gate
Baseline: `phase-5-approved`
Application Code Changes: ZERO

## 1. Governance State

```text
Phase 5: DONE / QA PASS / Human Phase Final Gate APPROVED
Phase Checkpoint: phase-5-approved PUBLISHED
Phase 6 Planning: HUMAN MASTER PLANNING APPROVED
Phase 6 Implementation: NOT_STARTED
FEAT-041: APPROVED FOR IMPLEMENTATION
FEAT-042: PLANNED / BLOCKED BY FEAT-041
FEAT-043: PLANNED / BLOCKED BY FEAT-041 + FEAT-042
FEAT-044: PLANNED / BLOCKED BY FEAT-041 + FEAT-042
FEAT-045: PLANNED / BLOCKED BY FEAT-041..FEAT-044
FEAT-046: PLANNED / BLOCKED BY FEAT-042..FEAT-045
FEAT-047: PLANNED / BLOCKED BY FEAT-041..FEAT-046
Phase 7: BLOCKED
```

The titles below preserve the existing Human-approved repository naming. The detailed product decisions in this document are the binding Human-approved Phase 6 planning baseline.

## 2. Phase Boundary

In scope: authenticated learner posts, flat comments, post likes, single-tier visibility with status moderation, safe owner removal, learner Community UI, Redis-backed write abuse protection, and a final integration gate.

Out of scope: anonymous/public feed, post/comment editing, nested replies, comment likes, private/follower/friend/premium visibility, private messaging, live chat, social trading, investment advice, creator monetization, recommendation/ranking, AI moderation, public moderation API/UI, and durable Community product audit.

## 3. Human-Approved Decision Baseline

| Decision | Approved lock |
| --- | --- |
| Read policy | Authenticated-only feed/detail/comments |
| Write policy | Authenticated-only, server-derived user identity |
| Visibility | One audience tier; `VISIBLE`, `HIDDEN`, `REMOVED` are moderation states |
| Post editing | Deferred; no PATCH route |
| Comment editing | Deferred; no PATCH route |
| Comment nesting | Flat comments only; no parent/reply field |
| Like scope | Posts only; one `(userId, postId)` relation |
| Feed order | `createdAt DESC, id DESC` |
| Comment order | `createdAt ASC, id ASC` |
| Pagination | Opaque cursor; default 20, max 50; explicit load-more UI |
| Counters | Relational aggregates; no materialized counters |
| Delete semantics | Owner request logically transitions content to terminal `REMOVED`; no public physical delete |
| Moderation | Option A: status policy and hardening, no public ADMIN API/UI |
| Product audit | Deferred with accepted risk; FEAT-016 preserved; no auth-audit reuse |
| Optimistic UI | Pending state allowed; authoritative counts are not optimistically mutated |
| Rate limiting | Included for all Community writes; exact policy in FEAT-045 |
| Redis outage | Writes fail closed 503 before DB mutation; reads remain available |

## 4. Feature Sequence

| ID | Canonical title | Type | Dependencies | ACs | Tasks | Planning state |
| --- | --- | --- | --- | ---: | ---: | --- |
| FEAT-041 | Community Persistence Foundation | Implementation | Phase 2/3 and Phase 5 checkpoint | 28 | 20 | Approved for implementation |
| FEAT-042 | Posts API & Feed Read Models | Implementation | FEAT-041 | 28 | 19 | Dependency blocked |
| FEAT-043 | Comments API | Implementation | FEAT-041, FEAT-042 | 26 | 17 | Dependency blocked |
| FEAT-044 | Like/Unlike Relational Semantics | Implementation | FEAT-041, FEAT-042 | 24 | 16 | Dependency blocked |
| FEAT-045 | Moderation Baseline | Security/hardening | FEAT-041..044 | 33 | 19 | Dependency blocked |
| FEAT-046 | Community UI | Frontend implementation | FEAT-042..045 | 31 | 19 | Dependency blocked |
| FEAT-047 | Phase 6 Community Integration Gate | Validation gate | FEAT-041..046 | 40 | 24 | Dependency blocked |

Total approved baseline: 210 acceptance criteria and 134 implementation/validation tasks.

## 5. Dependency Graph

```text
phase-5-approved + Phase 2/3 frozen contracts
                    |
                 FEAT-041
                    |
          +---------+---------+
          |                   |
       FEAT-042               |
          |                   |
    +-----+-----+             |
    |           |             |
 FEAT-043    FEAT-044 <-------+
    |           |
    +-----+-----+
          |
       FEAT-045
          |
       FEAT-046
          |
       FEAT-047
          |
 Human Phase Final Gate
```

## 6. Feature Responsibilities

### FEAT-041 - Community Persistence Foundation

Owns the only expected Phase 6 production migration and the `community_posts`, `community_comments`, and `community_post_likes` models, constraints, indexes, deletion policies, and repository interfaces. It introduces no API/UI.

### FEAT-042 - Posts API & Feed Read Models

Owns authenticated feed/detail/create/owner-remove routes, safe DTOs, deterministic cursor pagination, relational counts, and post visibility. It adds no editing or moderation endpoint.

### FEAT-043 - Comments API

Owns authenticated flat comment list/create/owner-remove routes, safe DTOs, deterministic pagination, parent-post visibility, and visible comment counts.

### FEAT-044 - Like/Unlike Relational Semantics

Owns naturally idempotent post-like PUT/DELETE, PostgreSQL uniqueness race handling, caller-scoped unlike, concurrent convergence, and canonical count/state responses.

### FEAT-045 - Moderation Baseline

Preserves the existing canonical title and incorporates Phase 6 authorization/abuse hardening: moderation status policy, spoof/IDOR protections, exact Redis write limits, proxy policy, outage semantics, audit deferral, and no public moderation surface.

### FEAT-046 - Community UI

Owns authenticated learner feed/detail/comments/like UI, explicit cursor loading, centralized API client/hooks, canonical mutation refetch, all UX states, and accessibility. No backend/schema changes.

### FEAT-047 - Phase 6 Community Integration Gate

Validation only. Independently verifies migrations, constraints, ownership, concurrency, moderation, rate limits, UI journey, authority boundaries, upstream regressions, canonical validation, and exact-commit CI. It adds no product behavior.

## 7. Schema And Migration Ownership

- DEV-B owns Community tables only and may add required relations to `User`.
- FEAT-041 owns one additive Community migration using the next real Prisma timestamp and descriptive `feat041_community_foundation` suffix.
- The previously documented `20261006xxxxxx` names are planning reservations, not permission to forge timestamps.
- FEAT-042..047 expect zero migrations; any discovered need returns to Human/Codex review.
- Applied Phase 1-5 migrations remain immutable.
- Fresh deploy and independent Phase 5 upgrade preservation are mandatory in FEAT-041 and FEAT-047.

## 8. Authority And Security Boundaries

- PostgreSQL owns posts, comments, likes, status, ownership, and counts.
- Redis owns only transient distributed rate-limit counters with TTL.
- JWT/client input does not own identity, role, status, counts, timestamps, or relationships.
- Controllers and ordinary services do not access Prisma directly.
- `AuthSecurityAuditRecord` is unchanged and receives no Community product event.
- Author DTOs expose display name only; email, user ID, roles, sessions, credentials, and audit data are prohibited.

## 9. Parallelization And Merge Safety

| Work | Preparation parallelism | Implementation/integration rule | Shared-file risk |
| --- | --- | --- | --- |
| FEAT-041 | Exclusive first | Must merge/pass before dependent implementation | Prisma schema, migration, repository factory |
| FEAT-042 | May prepare contracts after plan approval | Integrate after FEAT-041 | Community routes/module, post repository |
| FEAT-043 | May prepare tests/DTOs with FEAT-044 after FEAT-042 visibility contract freezes | Integrate after FEAT-042 | Community routes, post projection counts |
| FEAT-044 | May prepare tests/DTOs with FEAT-043 | Integrate after FEAT-042; coordinate route/repository files | Community routes, post projection likes |
| FEAT-045 | Test/policy design may prepare early | Implement after 042..044 to cover final writes | Routes, env, Redis limiter infrastructure |
| FEAT-046 | Visual/component planning may prepare against mocks | Implement/integrate after API/hardening contracts freeze | App router, nav, shared auth client |
| FEAT-047 | QA plan may prepare early | Execute only after 041..046 QA/Human gates | QA/report/governance only |

DEV-B remains sole Phase 6 implementation owner. Parallel branches must not create multiple migrations or independently edit shared router/factory files without explicit integration order.

## 10. Start And Completion Gates

- Phase planning gate: Human approval of all proposed decisions and packages.
- FEAT-041 start: Phase 6 master planning Human-approved; clean checkpoint branch from `phase-5-approved`.
- Each implementation feature: predecessor QA PASS plus Human Final Gate.
- FEAT-047 start: FEAT-041..046 QA PASS and Human-approved.
- Phase 6 completion: FEAT-047 PASS plus Human Phase Final Gate approval.
- Phase 7 implementation remains blocked until the Human approves Phase 6 completion or explicitly grants a narrower contract-first exception.

## 11. Human Decision Record

Human master planning approval locks every decision in Section 3, including:

1. Authenticated-only Community reads and writes.
2. Post/comment editing deferred.
3. Flat comments with no replies.
4. Post-only likes.
5. Moderation Option A with no public admin API/UI.
6. Durable Community product audit deferred with the accepted Phase 6 risk.
7. Exact FEAT-045 Redis rate-limit policy and fail-closed writes.
8. Relational aggregate counters.
9. Cursor pagination default 20/max 50.
10. Logical removal and retained durable content.
11. FEAT-046 Community UI included in Phase 6.
12. No optimistic authoritative-count mutation.
13. FEAT-041 owns the only expected Phase 6 production migration.
14. DEV-B / Antigravity remains the implementation owner.

FEAT-041 is approved for implementation. FEAT-042..047 remain planned and dependency-blocked according to Section 4; approval of this master plan does not bypass their predecessor gates.
