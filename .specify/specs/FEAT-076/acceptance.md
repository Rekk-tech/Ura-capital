# FEAT-076 Acceptance Criteria: Community Experience Integration & Polish

Status: APPROVED FOR IMPLEMENTATION

- AC-001 Route Governance & Navigation: `/community` and `/community/posts/:postId` are registered as AVAILABLE with `owningFeature: "FEAT-076"` in `route-registry.ts`. Public read is allowed (`requiresAuth: false`). Routes are properly integrated into `AppShell.tsx` and verified with route tests.
- AC-002 Query Hooks & AbortSignal: `CommunityApiClient` forwards `AbortSignal` across all endpoints (`listPosts`, `getPostById`, `createPost`, `listComments`, `createComment`, `likePost`, `unlikePost`). TanStack hooks enforce `staleTime: 30_000`, `refetchOnWindowFocus: false`, and suppress retries on 401, 403, 404, and 429 errors.
- AC-003 Community Feed & Cursor Pagination: `CommunityFeedPage` presents discussions with cursor-based pagination ("Load More Posts") and sorting options (Latest, Popular). All 5 async states (loading skeleton, empty, unauthenticated prompt, error with retry, and success feed) render cleanly.
- AC-004 Post Composer & Rate Limit Resilience: `PostComposer` provides content input, real-time character counter (max 5,000), client validation, pending submission lock, and a friendly inline alert on 429 rate limit with retry-after guidance.
- AC-005 Post Card Presentation: `PostCard` displays author display name, formatted relative or calendar date, sanitized content, comment count link navigating to `/community/posts/:postId`, and integrated like button.
- AC-006 Atomic Like Toggle: `PostLikeButton` handles like/unlike toggle with accessible ARIA state (`aria-pressed`, `aria-label`), atomic count updates from server, and unauthenticated safeguard prompting login without page error.
- AC-007 Post Detail & Threaded Comments: `PostDetailPage` renders complete post details, back navigation, threaded comments list, reply composer with validation, and delete action for author.
- AC-008 Quality Gate & Non-Functional: Unit, component, and accessibility test suites pass 100%. Zero database migrations (approved total remains 10). Phase 8 AI frozen. Monorepo lint, typecheck, build, and guards all pass.

## Traceability Matrix

| Requirement | Task | Acceptance |
|---|---|---|
| FR-001 | T001 | AC-001 |
| FR-002 | T002 | AC-002 |
| FR-003 | T003 | AC-003 |
| FR-004 | T004 | AC-004 |
| FR-005 | T005 | AC-005 |
| FR-006 | T006 | AC-006 |
| FR-007 | T007 | AC-007 |
| FR-008 | T008 | AC-008 |
