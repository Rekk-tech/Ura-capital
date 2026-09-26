# FEAT-076 Tasks: Community Experience Integration & Polish

Status: COMPLETED
Phase: Phase 9 — Customer MVP UI

| Task | Work | Requirement | Acceptance | State |
|---|---|---|---|---|
| T001 | Promote `/community` and `/community/posts/:postId` to AVAILABLE, configure public read in `route-registry.ts` and mount in `AppShell.tsx` | FR-001 | AC-001 | DONE |
| T002 | Audit and refine `CommunityApiClient` and TanStack Query hooks with AbortSignal and smart retry suppression | FR-002 | AC-002 | DONE |
| T003 | Enhance `CommunityFeedPage.tsx` with sorting controls (Latest, Popular), cursor pagination, and all 5 async UI states | FR-003 | AC-003 | DONE |
| T004 | Enhance `PostComposer.tsx` with live character counter, client validation, and 429 rate-limit resilience | FR-004 | AC-004 | DONE |
| T005 | Enhance `PostCard.tsx` with safe content rendering, author details, formatted timestamp, and navigation links | FR-005 | AC-005 | DONE |
| T006 | Implement `PostLikeButton.tsx` with atomic server count reflection, ARIA accessibility, and auth prompt safeguard | FR-006 | AC-006 | DONE |
| T007 | Enhance `PostDetailPage.tsx` and comment components (`CommentComposer`, `CommentList`, `CommentCard`) with threaded discussions | FR-007 | AC-007 | DONE |
| T008 | Implement `ReportDialog.tsx` for moderation flagging, add comprehensive test suites, and run repository quality gate | FR-008 | AC-008 | DONE |

## Dependency Order

T001 establishes route governance. T002 equips the data layer. T003 through T007 deliver user-facing components. T008 finishes moderation dialog, test suites, and quality verification.
