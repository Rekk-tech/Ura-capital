# ADR-002: npm Workspaces Monorepo Structure

**Status**: Accepted  
**Date**: 2026-08-25

## Context

The rebuild needs a frontend app, backend API, and shared contracts. FEAT-001 implemented and QA-approved this baseline.

## Decision

Use an npm workspaces monorepo:

```text
apps/
  web/
  api/
packages/
  shared/
```

## Rationale

- Keeps web/API/shared evolution synchronized.
- Enables shared Zod schemas and TypeScript types.
- Reduces early coordination overhead.
- Matches FEAT-001 accepted repository baseline.

## Rejected Alternatives

- Polyrepo: rejected as premature and slower for shared contract evolution.
- Single project folder: rejected due to weak boundaries.
- Microservice repositories: rejected until there is a proven deployment/team need.

## Consequences

- CI must validate all workspaces.
- Shared package must not become a dumping ground for domain logic.
- Workspace scripts must remain deterministic from clean checkout.
