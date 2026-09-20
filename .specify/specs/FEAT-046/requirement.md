# FEAT-046 Requirement: Community UI

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-042..FEAT-045
Phase: Phase 6 - Community
Type: Frontend implementation
Owner: DEV-B / Antigravity

## Goal

Provide an authenticated learner-facing Community feed and post-detail experience for creating/removing posts and comments and liking/unliking posts through the approved server APIs.

## Functional Requirements

- FR-001 Add `/community` feed and `/community/posts/:postId` detail routes.
- FR-002 Reuse the existing AuthProvider/in-memory access-token and centralized API-client architecture.
- FR-003 Show an auth-required state instead of issuing unauthorized Community requests.
- FR-004 Render cursor-paginated feed in server order with an explicit `Load more` control; no unbounded/infinite auto-fetch.
- FR-005 Provide a create-post composer enforcing the approved client-side length UX while treating server validation as authority.
- FR-006 Render safe post cards with author display name, content, time, like/comment counts, current-user like state, and owner-only remove control.
- FR-007 Provide post detail with cursor-paginated flat comments.
- FR-008 Provide create-comment composer and owner-only comment removal control.
- FR-009 Provide post like/unlike with pending state, then invalidate/refetch canonical server data.
- FR-010 Do not optimistically mutate authoritative like/comment counts.
- FR-011 Handle loading, empty, auth-required, not-found, validation, forbidden-safe, rate-limited, Redis-unavailable, and generic error states.
- FR-012 Keep hidden/removed content unavailable; do not display internal moderation details.
- FR-013 Do not add edit, reply, comment-like, admin moderation, report, recommendation, public-read, or premium UI.
- FR-014 Meet keyboard, semantic structure, label, focus, contrast, responsive, and reduced-motion accessibility baseline.
- FR-015 Add API-client, component, page, routing, accessibility, and authenticated journey tests.
- FR-016 Add no backend, schema, migration, Redis, or audit behavior.

## Out Of Scope

Anonymous feed, infinite scroll, optimistic authoritative counts, editing, nested comments, comment reactions, media upload, search, ranking, private messaging, admin/moderator UI, audit viewer, and Phase 7 entitlements.

## Dependencies

FEAT-042 posts, FEAT-043 comments, FEAT-044 likes, and FEAT-045 hardening contracts must be QA PASS and Human-approved.
