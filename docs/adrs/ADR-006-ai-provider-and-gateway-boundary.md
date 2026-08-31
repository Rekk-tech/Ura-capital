# ADR-006: AI Provider and AI Gateway Boundary

**Status**: Accepted  
**Date**: 2026-08-25

## Context

Aura Intelligence must evolve from generic chat into a context-aware learning assistant. The project currently names Gemini as the AI provider, but AI behavior must be guarded, observable, rate-limited, and clearly separated from real-world investment advice.

## Decision

Use Gemini as the initial AI provider behind an internal AI gateway boundary.

The AI gateway owns:

- Authentication and authorization checks.
- Rate limits and quotas.
- Intent classification.
- Context resolution.
- Prompt construction and prompt versioning.
- Provider invocation.
- Structured output validation.
- Safety guardrails.
- Usage/cost observability.

## Rationale

- Gemini matches existing architecture context.
- A gateway boundary prevents provider-specific details from leaking into product modules.
- Structured validation and guardrails are required for financial education/simulation safety.

## Rejected Alternatives

- Direct provider calls from feature modules: rejected due to coupling, weak observability, and poor guardrail control.
- Provider-agnostic abstraction before any real AI flow: rejected as speculative generality.
- Presenting AI as real-world investment advice: explicitly rejected by product principles.

## Consequences

- Phase 8 must implement the AI gateway before feature modules rely on AI.
- AI responses must identify simulation/education context and avoid guaranteed investment advice.
- Provider changes require updating the gateway, not product feature modules.
