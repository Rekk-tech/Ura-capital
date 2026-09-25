# FEAT-078 Requirement: Aura Intelligence UI Integration

Status: PROPOSED FOR HUMAN MASTER PLANNING REVIEW / IMPLEMENTATION NOT_STARTED
Phase: Phase 9 - UI Integration & Product Polish
Type: Implementation feature / Phase-8 and Human-decision blocked
Planning Owner: Codex

## Goal

Integrate the Human-approved Aura Intelligence gateway into a safe, accessible learner assistant without moving provider, context, quota, or safety authority into the browser.

## Functional Requirements

- FR-001 Add the AI assistant route only when Human includes AI in the Production MVP and Phase 8 freezes its client contract.
- FR-002 Send requests only to the authenticated internal AI gateway and never directly to Gemini or another provider.
- FR-003 Render only validated structured gateway responses and sanitize all model-supplied text/links before DOM insertion.
- FR-004 Clearly disclose educational/simulation context, uncertainty, and non-advisory limitations without implying guaranteed outcomes.
- FR-005 Represent context availability and provenance at the safe level returned by Phase 8 without exposing private source internals.
- FR-006 Handle loading, cancellation, refusal, guardrail, quota/rate-limit, unavailable, malformed-response, and generic error states.
- FR-007 Meet responsive, keyboard, focus, semantic, live-region, contrast, and reduced-motion requirements for assistant interaction.
- FR-008 Test gateway-only networking, injection-safe rendering, quota/guardrail states, accessibility, privacy, and Phase 8 regressions.

## Non-Functional Requirements

- NFR-001 Preserve approved server-authority and security boundaries.
- NFR-002 Meet responsive mobile, tablet, and desktop behavior without horizontal overflow.
- NFR-003 Meet keyboard, focus, semantic, contrast, announcement, and reduced-motion baseline.
- NFR-004 Add no database migration unless a later Human-approved scope change explicitly assigns one.
- NFR-005 Produce deterministic tests and truthful exact-source evidence with no mandatory skips.

## Dependencies

FEAT-070, FEAT-071, Phase 8 AI gateway/contracts QA PASS and Human Final Gate, plus Human approval of P9-D02.

## Scope Boundary

Owns AI assistant frontend rendering and interaction after Phase 8 contract freeze. Excludes gateway/provider implementation, RAG, prompt/version management, context authority, quota decisions, model selection, and durable conversation storage.

## Approval Boundary

This package is a proposal. It does not authorize implementation and may not be marked implemented, QA PASS, DONE, or Human approved without later gates.

