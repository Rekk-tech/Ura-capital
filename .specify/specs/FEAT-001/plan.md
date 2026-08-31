# Implementation Plan: Engineering Foundation

**Feature ID**: FEAT-001  
**Branch**: `N/A - repository is not initialized as git`  
**Date**: 2026-08-25  
**Spec**: `spec.md`

## Summary

Build the greenfield engineering foundation for Aura Capital as a production-oriented modular monolith repository. The baseline establishes separate web and API applications, a shared package, strict validation tooling, local development commands, Docker development services, CI checks, a health endpoint, environment validation, structured errors, and structured logs.

No product-domain behavior is implemented in this feature. The output is an executable foundation for later approved phases.

## Technical Context

**Language/Version**: TypeScript on Node.js LTS for production application code.

**Primary Dependencies**: React for web app, Node.js backend framework selected from Express or NestJS, Zod for validation, TanStack Query readiness for frontend server state, OpenTelemetry readiness for observability.

**Storage**: PostgreSQL is the future durable source of truth; Redis is reserved for transient/distributed state. FEAT-001 only establishes development readiness, not business persistence.

**Testing**: Vitest for unit tests, Supertest or equivalent for API integration tests, Playwright for UI smoke tests.

**Target Platform**: Web application and API service running locally through documented development commands and in CI.

**Project Type**: Web platform with frontend, backend, shared package, and development infrastructure.

**Performance Goals**: Local health check responds within 1 second; baseline checks complete reliably in normal developer and CI environments.

**Constraints**:

- Greenfield rebuild; do not inherit legacy architecture by default.
- Modular monolith first.
- No hard-coded secrets or fallback secrets.
- Environment validation must fail before serving traffic.
- Server-side authority must be preserved for future business-sensitive behavior.
- Documentation and QA evidence must be stored in the repository.

**Scale/Scope**: Foundation for Production MVP, not final production hardening.

## Architecture Decisions

### Decision 1: Monorepo App Structure

Use:

```text
apps/
  web/
  api/
packages/
  shared/
```

**Rationale**: This matches the project context, supports shared contracts without microservice overhead, and keeps early development simple.

**Alternatives Considered**:

- Single app folder: too weak for clear frontend/backend boundaries.
- Microservices: premature for the current scale and explicitly discouraged by architecture context.
- Continue Python-only repository: conflicts with the documented target architecture.

### Decision 2: Strict TypeScript Baseline

All production application work for FEAT-001 uses strict TypeScript.

**Rationale**: The documented architecture selects React + TypeScript and Node.js + TypeScript. Shared types and validation reduce drift across web and API.

**Alternatives Considered**:

- Looser JavaScript baseline: faster initially but weaker for financial education and simulation correctness.
- Python baseline: present in current repo metadata but not aligned with the approved target application context.

### Decision 3: API Health and Error Contract First

Define health and standardized error behavior before business APIs.

**Rationale**: Future QA needs stable signals for service readiness and failure behavior.

**Alternatives Considered**:

- Defer until auth feature: would make FEAT-002 depend on unverified operational basics.

### Decision 4: Config Validation at Startup

Required environment values are validated before the API serves requests.

**Rationale**: The previous system had unsafe secret fallback behavior. Startup failure is safer than degraded insecure runtime.

**Alternatives Considered**:

- Runtime lazy validation: creates inconsistent failure modes.
- Default fallback secrets: explicitly forbidden.

## Constitution Check

The `.specify/memory/constitution.md` file is still a placeholder, so no ratified constitution gates can be enforced from that file.

Applied governance from project context:

- Greenfield rebuild: PASS.
- Modular monolith first: PASS.
- Server trust boundary preserved: PASS.
- Security cannot be traded for speed: PASS.
- No fake validation evidence: PASS.
- Documentation as source of truth: PASS.
- Code standards document available and applicable: PASS.
- Human approval gate before implementation: PASS.

## Project Structure

### Documentation

```text
.specify/specs/FEAT-001/
  requirement.md
  spec.md
  plan.md
  tasks.md
  acceptance.md
```

### Proposed Source Code

```text
apps/
  web/
    src/
      app/
      components/
      features/
      api/
      hooks/
      types/
    tests/
      e2e/
  api/
    src/
      infrastructure/
        config/
        logging/
      middleware/
      shared/
        errors/
        validation/
      modules/
        health/
      server.ts
    tests/
      integration/
      unit/
packages/
  shared/
    src/
      constants/
      schemas/
      types/
docs/
  code-standards.md
  progress-tracker.md
reports/
  implementation/
  qa/
```

**Structure Decision**: Use a monorepo structure with `apps/web`, `apps/api`, and `packages/shared`. This aligns with `docs/progress-tracker.md` Phase 1 expected output and preserves clear boundaries for later domains.

## Interface Contracts

### Health Endpoint

**Name**: API Health Check  
**Consumer**: Developers, CI, QA, future deployment checks  
**Behavior**:

- Requesting the health endpoint returns service status.
- Healthy response includes status and timestamp.
- Response must not expose secrets, environment values, database passwords, tokens, or internal stack traces.

### Standard Error Response

**Name**: API Error Envelope  
**Consumer**: Frontend, QA, future API clients  
**Behavior**:

- Controlled errors return a stable error envelope.
- Error envelope includes a machine-readable code and human-readable message.
- Error envelope may include request correlation metadata when available.
- Error envelope must not leak secrets or raw stack traces.

### Environment Contract

**Name**: Runtime Configuration Contract  
**Consumer**: API startup and developers  
**Behavior**:

- Required environment variables are documented.
- Missing or invalid required values stop startup.
- Example values are safe dummy values, never real secrets.

## Data Model

FEAT-001 does not introduce product-domain durable data.

Foundation-level configuration entities:

- **RuntimeConfig**: validated runtime settings required to start the API.
- **HealthStatus**: service readiness result returned by the health endpoint.
- **ErrorEnvelope**: standardized controlled error response.
- **LogEvent**: structured event containing request metadata and outcome.

## Validation Strategy

Implementation must provide evidence for:

- Clean dependency install.
- Local web startup.
- Local API startup.
- Health endpoint success.
- Missing environment variable startup failure.
- Invalid environment variable startup failure.
- Standard error response.
- Structured request/error logs.
- Lint pass.
- Typecheck pass.
- Unit tests pass.
- API integration tests pass.
- UI smoke test pass.
- Build pass.
- CI workflow executes baseline checks.

## Risks

- Existing `docs/code-standards.md` is now available. Implementation must treat it as the active coding baseline.
- The repository currently contains Python project metadata. Implementation must avoid accidentally treating it as the target production app foundation.
- Docker and CI choices may need minor adjustment once Human confirms final operational preference.

## Quality Gates

FEAT-001 cannot pass QA unless:

- Every acceptance criterion in `acceptance.md` is either PASS or explicitly waived by Human.
- Antigravity creates `reports/implementation/phase-1/FEAT-001.md`.
- Commands and validation evidence are reported truthfully.
- No implementation code is created before Human approves these documents.
