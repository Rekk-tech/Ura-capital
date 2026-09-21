# FEAT-050 Acceptance Criteria

Status: HUMAN MASTER PLANNING APPROVED / PLANNED / DEPENDENCY CONTROLLED

- AC-001 Approved canonical routes are `GET /api/subscriptions/plans` and `GET /api/subscriptions/me`.
- AC-002 Plans is PUBLIC SAFE READ; current-user subscription is AUTHENTICATED and no alternative policy is implementation-selectable.
- AC-003 Request schemas reject unexpected authority-bearing fields.
- AC-004 Plan DTO contains only plan key, safe display name, safe benefit copy, and availability; no provider price ID unless separately approved and no provider/customer/subscription identifier or internal secret.
- AC-005 Current-user DTO is allowlisted and contains no provider ID, event/audit data, role, email, or security secret.
- AC-006 Plan read returns only FEAT-049 server-owned catalog data.
- AC-007 Authenticated current-user read uses server-derived identity and FEAT-049 resolution.
- AC-008 User with no subscription receives FREE/no-entitlement success.
- AC-009 A client cannot select or inspect another user's subscription.
- AC-010 Forged premium/plan/status/entitlement/date/provider claims do not affect output.
- AC-011 GET routes create zero DB/Redis mutation, provider call, or audit event.
- AC-012 Missing auth and repository/integrity failures return stable sanitized contracts.
- AC-013 No schema or migration is introduced.
- AC-014 No checkout, cancel, webhook, premium guard, admin/support view, UI, or existing-domain gate is introduced.
- AC-015 Canonical validation and Phase 2-6/FEAT-048-049 regressions pass.
- AC-016 Report and traceability evidence are truthful.

Hard fail: IDOR, provider-secret leakage, GET mutation, client authority, or hidden provider call.
