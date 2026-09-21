# FEAT-056 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

- AC-001 Approved D8 locks canonical learner route `/subscription`, information hierarchy, safe copy, and no admin UI.
- AC-002 Approved D10 deferral is enforced: production UI is read-only and has no commerce APIs or commerce CTAs.
- AC-003 All reads and commands use typed FEAT-050/053 contracts through the centralized authenticated API client.
- AC-004 UI consumes only safe server DTOs and does not derive provider or durable subscription state locally.
- AC-005 Loading and FREE/no-record states render deterministically without claiming premium.
- AC-006 ACTIVE and cancellation-pending states match server period/cancel facts without client-calculated authority.
- AC-007 PAST_DUE, CANCELLED, and EXPIRED states follow approved D4/D5 policy and do not retain premium presentation.
- AC-008 All production checkout/upgrade/subscribe/cancel/renewal CTAs are absent; no fake upgrade, mock-commerce action, or local premium toggle exists.
- AC-009 Production hosted-checkout navigation is absent; any future hosted flow requires a separately approved provider and trusted-destination contract.
- AC-010 Invalid/missing/untrusted checkout artifacts fail closed; no card/bank/payment data is collected, stored, or logged.
- AC-011 Cancellation requires confirmation, handles retries safely, and reflects only server-confirmed state after refetch.
- AC-012 Client cache, flags, local storage, query parameters, and route state cannot grant or extend entitlement.
- AC-013 Server 401/403/409 denials remain authoritative and cannot be bypassed by stale UI state.
- AC-014 429 honors safe `Retry-After`; 503/5xx use generic retryable handling without false success.
- AC-015 UI and diagnostics expose no provider/customer/subscription ID, raw provider error, secret, token, cookie, credential, SQL, unapproved URL, or sensitive path.
- AC-016 Keyboard, focus, labels, announcements, contrast, responsive layout, and reduced-motion checks pass.
- AC-017 No schema/migration, backend product behavior, provider implementation, admin UI, or existing-domain premium gate is introduced.
- AC-018 Component/API-client/E2E tests cover state matrix, actions, redirect safety, spoofing, privacy, and server authority.
- AC-019 Canonical validation, frontend checks, guards, and Phase 2-6/FEAT-048-055 regressions pass.
- AC-020 Report and traceability evidence are truthful.

Hard fail: client-side entitlement authority, fake checkout success, payment-data handling, unsafe redirect, leaked provider data, or server-denial bypass.
