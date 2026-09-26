# FEAT-076 Requirement: Community Experience Integration & Polish

Status: APPROVED FOR IMPLEMENTATION
Phase: Phase 9 — Customer MVP UI
Type: Implementation feature
Planning Owner: Antigravity

## Goal

Integrate a rich, accessible, and resilient Community Experience UI into the product shell (/community and /community/posts/:postId), allowing learners to browse financial discussions with cursor pagination and sorting (Latest, Popular), publish posts with character limits and rate-limit resilience, toggle likes with atomic counter updates, participate in threaded comments, and flag content for moderation, without compromising server authority or adding database migrations.

## Functional Requirements

- FR-001 Route Governance & Navigation: Promote `/community` and `/community/posts/:postId` from PLANNED to AVAILABLE in route registry (`owningFeature: "FEAT-076"`). Configure public read access (`requiresAuth: false`) while guarding mutations (posting, commenting, liking) behind authentication. Mount in AppShell.
- FR-002 API Client & Query Hooks: Audit and refine `CommunityApiClient` in `apps/web/src/api/community.api.ts` forwarding native `AbortSignal` across all requests (`listPosts`, `getPostById`, `createPost`, `listComments`, `createComment`, `likePost`, `unlikePost`). Configure TanStack query hooks with `staleTime: 30_000`, `refetchOnWindowFocus: false`, and suppress retries on 401, 403, 404, and 429.
- FR-003 Community Feed Page & Cursor Pagination: Implement `CommunityFeedPage.tsx` with sorting controls (Latest, Popular), cursor-based pagination ("Load More Posts"), and comprehensive 5-state async UI handling (loading skeleton, empty state, unauthenticated mutation prompt, error card with retry, success feed).
- FR-004 Post Composer & Rate Limit Resilience: Implement `PostComposer.tsx` with character counter (max 5,000 characters), validation, duplicate submission protection (pending state), and clear, friendly inline banner handling 429 TOO_MANY_REQUESTS with retry-after.
- FR-005 Post Card Presentation: Implement `PostCard.tsx` rendering author display name, formatted relative/calendar date, sanitized content, comment count link navigating to `/community/posts/:postId`, and integrated `PostLikeButton`.
- FR-006 Atomic Like Toggle: Implement `PostLikeButton.tsx` with heart toggle, accessible ARIA attributes (`aria-pressed`, `aria-label`), atomic server count reflection, and safe fallback prompting unauthenticated users to log in without crashing.
- FR-007 Post Detail Page & Threaded Comments: Implement `PostDetailPage.tsx` rendering full post content, back button to `/community`, integrated `CommentComposer` and `CommentList` / `CommentCard` with validation, delete capability for author, and error isolation.
- FR-008 Moderation & Content Safety: Implement basic reporting mechanism (`ReportDialog`) allowing users to flag abusive or spam posts with client confirmation, preserving server authority.

## Non-Functional Requirements

- NFR-001 Server-Authoritative Authority: Likes, comments, posts, moderation status, and rate-limits are server-authoritative. Client cache/optimistic state never confers authority.
- NFR-002 Responsive & Accessible: WCAG 2.1 AA compliant, ARIA attributes on interactive elements, full keyboard navigation, responsive design from 320px to 4K displays.
- NFR-003 Zero Database Migrations: Zero schema alterations or new migrations. Exactly 10 migrations total.
- NFR-004 Phase 8 AI Freeze: Strict isolation preserved. Zero Gemini/AI imports or invocations.
- NFR-005 Error Privacy & Resilience: Sanitize all error displays; no stack traces, database details, or raw secrets exposed.
