# FEAT-056 Requirement: Subscription Learner UI

Status: DONE / INTERNAL FEATURE GATE PASS / CHECKPOINT PUBLISHED
Phase: Phase 7 - Subscription / Premium
Type: Learner-facing UI

## Goal

Provide an accessible learner-facing subscription view that displays only safe server DTOs and initiates only Human-approved provider flows without becoming an entitlement or payment authority.

## Functional Requirements

- FR-001 Approved D8 sets canonical learner route `/subscription`; approved D10 defers real production checkout and requires a read-only production UI with no commerce APIs or commerce CTAs.
- FR-002 The UI MUST use FEAT-050 read contracts and FEAT-053 command contracts through the centralized authenticated API client.
- FR-003 The UI MUST display safe plan, status, benefit, period, and cancellation-state data without provider/payment identifiers.
- FR-004 The UI MUST represent loading, FREE/no-record, ACTIVE, PAST_DUE, cancellation-pending, CANCELLED, EXPIRED, throttled, unavailable, and generic error states deterministically.
- FR-005 Production upgrade, subscribe, checkout, cancel, and renewal calls to action MUST be absent. No fake success, mock-commerce CTA, or local premium toggle is allowed.
- FR-006 FEAT-056 MUST NOT implement production hosted-checkout navigation. Any future production provider flow requires a new Human-approved feature and trusted-destination contract.
- FR-007 The application MUST NOT collect, render, persist, or log card/bank/payment credentials.
- FR-008 Cancellation controls MUST require explicit confirmation and reflect only server-confirmed outcomes.
- FR-009 Client cache, route state, local storage, query parameters, and feature flags MUST NOT grant or extend premium access.
- FR-010 Server 401/403/409/429/503 and safe 5xx responses MUST remain authoritative and receive bounded UX treatment.
- FR-011 Responses and UI diagnostics MUST not expose provider IDs, raw provider errors, checkout secrets, tokens, cookies, credentials, SQL, URLs outside the approved redirect artifact, or sensitive paths.
- FR-012 UI accessibility MUST cover keyboard navigation, focus, status announcements, labels, contrast, responsive layouts, and reduced-motion behavior.
- FR-013 Tests MUST cover API mapping, status rendering, command states, redirect validation, spoof resistance, and safe error handling.
- FR-014 FEAT-056 MUST add no schema, migration, provider implementation, entitlement logic, admin UI, invoice/refund/tax/coupon behavior, or existing-domain premium gate.
- FR-015 Canonical validation and Phase 2-6/FEAT-048-055 regressions MUST pass.

## Dependencies

FEAT-050, FEAT-053, FEAT-054, approved D8 `/subscription` route, and approved D10 production-commerce deferral.

## Out Of Scope

Embedded payment forms, payment-method management, invoices, refunds, taxes, coupons, admin/support tooling, entitlement mutation, existing-domain premium integration, and Phase 8.
