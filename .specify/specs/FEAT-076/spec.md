# FEAT-076 Specification: Community Experience Integration & Polish

Status: APPROVED FOR IMPLEMENTATION
Phase: Phase 9 — Customer MVP UI

## 1. Architecture Contract

- Objective: Integrate the community discussions, post feed, cursor pagination, sorting, atomic like toggling, threaded comments, and content moderation flagging into the application shell.
- API: Consumes existing Phase 6 backend community endpoints:
  - `GET /api/community/posts` (cursor-based pagination, limit)
  - `POST /api/community/posts` (create post, 1..5,000 chars, rate-limited)
  - `GET /api/community/posts/:postId` (single post detail)
  - `DELETE /api/community/posts/:postId` (author post removal)
  - `GET /api/community/posts/:postId/comments` (cursor-based comment pagination)
  - `POST /api/community/posts/:postId/comments` (create comment, rate-limited)
  - `DELETE /api/community/comments/:commentId` (author comment removal)
  - `PUT /api/community/posts/:postId/like` & `DELETE /api/community/posts/:postId/like` (like mutation, rate-limited)
- Persistence: ZERO database or migration changes. Total migrations remain at 10.
- Security: Server remains sole authority on like counts, post ownership, moderation status, and rate limits. Unauthenticated users can read public discussions (`requiresAuth: false`), but mutations require authentication.

## 2. Functional Contract

### FR-001 Route Governance & Navigation
Promote `/community` (`COMMUNITY_FEED`) and `/community/posts/:postId` (`COMMUNITY_POST_DETAIL`) to `AVAILABLE` with `owningFeature: "FEAT-076"` in `route-registry.ts`. Configure public read access (`requiresAuth: false`) while protecting mutations. Mount in `AppShell.tsx` and verify in route tests.

### FR-002 API Client & Query Hooks
Enhance `CommunityApiClient` in `apps/web/src/api/community.api.ts` to plumb native `AbortSignal` across all fetch calls. In `use-community.ts`, set `staleTime: 30_000`, `refetchOnWindowFocus: false`, and suppress retries on 401, 403, 404, and 429 status codes.

### FR-003 Community Feed Page & Cursor Pagination
Implement `CommunityFeedPage.tsx` supporting:
- Sorting tabs: "Latest" (default, server order) and "Popular" (sorted by engagement `likeCount + commentCount`).
- Cursor-based pagination with explicit "Load More Posts" button.
- Comprehensive 5 async states: Loading skeleton, Empty state, Mutation auth prompt, Error card with retry, and Success feed.

### FR-004 Post Composer & Rate Limit Resilience
Implement `PostComposer.tsx` with:
- Textarea with live character counter (up to 5,000 characters).
- Client-side validation before submission.
- Protection against duplicate submissions (disabled button during in-flight requests).
- Friendly inline alert on 429 Rate Limit displaying retry-after duration.

### FR-005 Post Card Presentation
Implement `PostCard.tsx` displaying:
- Author display name (defaults to "Aura Learner" if not provided).
- Formatted relative or calendar date timestamp.
- Sanitized content presentation.
- Interactive comment count link navigating to `/community/posts/:postId`.
- Integrated `PostLikeButton`.
- Optional author deletion button when `ownedByCurrentUser` is true.

### FR-006 Atomic Like Toggle Interaction
Implement `PostLikeButton.tsx`:
- Heart toggle button with accessible ARIA attributes (`aria-pressed`, `aria-label`).
- Atomic server count update from response.
- Safe behavior when user is unauthenticated (prompts to log in without crashing).

### FR-007 Post Detail Page & Threaded Comments
Implement `PostDetailPage.tsx`:
- Full post discussion view with complete content.
- Back button navigating to `/community`.
- Threaded comments list (`CommentList`, `CommentCard`) with cursor pagination.
- `CommentComposer` with input validation, duplicate prevention, and rate-limit handling.
- Delete comment button for author (`ownedByCurrentUser`).

### FR-008 Moderation & Content Safety
Provide a report flag action (`ReportDialog`) on posts enabling learners to flag inappropriate or spam content with client confirmation and clear feedback.

## 3. State and Error Contract

All networked views must handle:
- Loading: Accessible skeleton loader with `role="status"` and `aria-busy="true"`.
- Empty: Helpful illustration / text encouraging learners to start a discussion.
- Auth required: Polite prompt to sign in when attempting to post, comment, or like.
- Error: Inline error banner with explicit retry button without leaking sensitive server traces.
- Rate limited: Specific banner explaining the rate limit with countdown or retry-after advice.

## 4. Quality Gate

All 8 Acceptance Criteria (AC-001..AC-008) must pass, targeted test suites must achieve 100% pass rate, full web suite and API suite must pass, production build must succeed, all 5 security guards must pass, and remote CI must be green.
