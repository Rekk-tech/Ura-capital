# FEAT-046 Specification: Community UI

Status: PLANNED / HUMAN MASTER PLANNING APPROVED / BLOCKED BY FEAT-042..FEAT-045

## Routes And Screens

- `/community`: authenticated feed, post composer, post cards, and `Load more` cursor action.
- `/community/posts/:postId`: post detail, flat comments, comment composer, and `Load more` comments.

No landing/marketing page is introduced. Community is a work-focused application view using the existing navigation and design system.

## API Client

Add a centralized Community client that attaches the in-memory access token, normalizes canonical envelopes, supports AbortSignal/timeouts consistent with the existing client, and never stores tokens in local/session storage or URLs. It implements only approved FEAT-042..044 routes.

## Interaction Policy

- Create/remove mutations disable the initiating control while pending and invalidate affected feed/detail/comment queries on success.
- Like/unlike may display pending state but must not locally increment/decrement authoritative counts before server response.
- Server response or refetch is the source of counts and liked state.
- Pagination uses explicit user action; cursors remain opaque.
- Owner controls are convenience only; server authorization remains mandatory.

## Content And Privacy

Render only DTO allowlisted fields. Do not infer or display email, user ID, roles, account status, moderation reason, or hidden/removed content. User-provided content is rendered as text; no unsafe HTML injection.

## Error States

- 401: auth-required state using existing auth flow.
- 404: safe unavailable post state.
- 400: field-level safe validation feedback.
- 429: rate-limited state and `Retry-After` guidance when supplied.
- 503: temporary write-unavailable state without pretending success.
- Other failures: retryable generic error with no internal detail.

## Accessibility And Layout

Use semantic headings, lists/articles, labeled textareas, stable button dimensions, visible focus, keyboard operation, responsive constrained layouts, and existing icon library. Text must wrap safely. No nested decorative cards or marketing hero is needed.

## Tests

Test API contracts, auth propagation, safe rendering, XSS-safe text, pagination, mutation invalidation, no optimistic count drift, owner/non-owner controls, all states, keyboard/labels, and a real authenticated API journey where suitable.
