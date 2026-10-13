# Aura Capital Project Constitution

## Core Principles

### I. Server Authority & Financial Data Integrity (NON-NEGOTIABLE)
All financial figures, portfolio NAV, cash balances, transaction orders, simulation cycles, XP rewards, and subscription entitlements are strictly server-authoritative. The client is a presentation and interaction surface; it MUST NEVER compute authoritative monetary balances, alter order fills, or forge subscription entitlements.

### II. Persistence Boundary & Infrastructure Integrity
PostgreSQL managed via Prisma ORM and transaction runners is the sole authoritative persistence layer. Direct mutable filesystem persistence (`writeFile`, `appendFile`, file-based database engines like `lowdb` or `db.json`) is strictly prohibited in runtime code and continuously enforced by automated boundary test guards.

### III. Model-Based AI Guardrails & Tiered Access Governance
All LLM and AI Agent interactions must pass through Model-Based Safety Guardrails assessing domain relevance (financial education, investment analysis) and eliminating toxic/adversarial prompt injections before agent processing. Access to real-time AI advisory is strictly limited to authenticated VIP Patron members and System Administrators, protected by token-bucket rate limiting to guarantee infrastructure resilience.

### IV. Canonical Route Governance & Honest Presentation
Every route registered in `ROUTE_REGISTRY` must reflect true system capability. No routes may falsely advertise unimplemented features. Once marked `AVAILABLE`, routes must provide a complete, accessible, keyboard-navigable experience with deterministic loading and error boundaries.

### V. Test-First Rigor & Type Safety Gates
Every business domain (Academy, Simulation, Portfolio, Community, Subscription, AI Studio, Admin) requires comprehensive unit, integration, and contract tests. Zero TypeScript errors (`tsc --noEmit` exit code 0) and zero persistence guard violations are mandatory preconditions for all merged code.

## Quality Standards & Technical Stack
- **Web**: React 18, Vite, TypeScript (strict), TanStack Query, Lucide Icons, Vanilla CSS with design tokens.
- **API**: Node.js, Express, TypeScript, Prisma ORM, Redis (rate-limiting cache), Zod validation schemas.
- **Shared**: Canonical schemas, DTOs, and error envelopes shared via `@aura/shared`.

## Governance
This constitution supersedes all ad-hoc conventions. Any architectural modifications to persistence, auth/role tiers, or routing invariants require specification under `.specify/specs/` and verification against the persistence boundary test suite.

**Version**: 1.0.0 | **Ratified**: 2026-10-13 | **Status**: ACTIVE
