# FEAT-076 Plan: Community Experience Integration & Polish

Status: APPROVED FOR IMPLEMENTATION
Phase: Phase 9 — Customer MVP UI

## 1. Preconditions

- Approved baseline: `planning/phase-9-master` with `feat-075-approved` merged.
- Working branch: `feat/FEAT-076-community-experience`.
- Phase 8 AI Track remains strictly FROZEN.
- Zero database migrations (approved total remains 10).

## 2. Architecture & Data Flow

```
[Browser / Learner]
       │
       ▼
 [AppShell / Router] ── (public read allowed, mutations require auth)
       │
       ├── /community ────────► CommunityFeedPage
       │                              ├── Feed Sort Controls (Latest / Popular)
       │                              ├── PostComposer (rate-limited, char count)
       │                              └── Feed List (PostCard -> PostLikeButton, ReportDialog)
       │
       └── /community/posts/:postId ► PostDetailPage
                                      ├── Post View (PostCard, back button)
                                      ├── CommentComposer (rate-limited)
                                      └── CommentList (CommentCard, author deletion)
       │
       ▼
[use-community.ts Query Hooks] ── (staleTime: 30s, smart retry bypass)
       │
       ▼
[CommunityApiClient] ── (AbortSignal forwarding, error mapping)
       │
       ▼
[Express Server: /api/community/*] ── (PostgreSQL repository, Redis rate limits)
```

## 3. Implementation Order

1. **T001 (Route Governance)**: Update `route-registry.ts` to promote `community` and `communityPost` routes to AVAILABLE, `requiresAuth: false`, `owningFeature: "FEAT-076"`. Update `AppShell.tsx` and route tests.
2. **T002 (API Client & Hooks)**: Audit `community.api.ts` ensuring `AbortSignal` forwarding on all calls. Refine `use-community.ts` with `staleTime: 30_000` and error-aware retry predicates.
3. **T003 (CommunityFeedPage)**: Add sorting controls (Latest vs Popular), cursor pagination, and all 5 async states.
4. **T004 (PostComposer)**: Add character counter, validation, pending state lock, and inline 429 banner.
5. **T005 (PostCard)**: Sanitize content, format dates, link to post detail, integrate like button and report button.
6. **T006 (PostLikeButton)**: Heart toggle button with atomic count reflection, ARIA accessibility, and auth safeguard.
7. **T007 (PostDetailPage & Comments)**: Discussion view, back link, threaded comment list, comment composer.
8. **T008 (Moderation & Quality Gate)**: Basic `ReportDialog`, test suites, and canonical verification pipeline.
