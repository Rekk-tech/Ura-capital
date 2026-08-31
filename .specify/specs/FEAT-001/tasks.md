# Tasks: Engineering Foundation

**Feature ID**: FEAT-001  
**Input**: `requirement.md`, `spec.md`, `plan.md`, `acceptance.md`  
**Prerequisites**: Human approval of this spec package  
**Implementation Agent**: Antigravity  
**Tests**: Required for FEAT-001 because the foundation acceptance criteria require lint, typecheck, unit, integration, UI smoke, build, and CI checks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks that touch different files and do not depend on incomplete work.
- **[Story]**: Maps the task to a user story in `spec.md`.
- Each task includes an expected file path.

## Phase 1: Setup

**Purpose**: Establish repository shape, workspace management, and documentation targets.

- [x] T001 Create monorepo workspace configuration in `package.json`
- [x] T002 Create frontend app folder and package manifest in `apps/web/package.json`
- [x] T003 Create API app folder and package manifest in `apps/api/package.json`
- [x] T004 Create shared package folder and package manifest in `packages/shared/package.json`
- [x] T005 [P] Add root TypeScript baseline configuration in `tsconfig.base.json`
- [x] T006 [P] Add root lint and formatting configuration in `eslint.config.mjs` and `.prettierrc`
- [x] T007 [P] Add safe dummy environment values in `.env.example`
- [x] T008 [P] Review implementation alignment requirements from `docs/code-standards.md`
- [x] T009 Create reports folders with keep files in `reports/implementation/.gitkeep` and `reports/qa/.gitkeep`

## Phase 2: Foundational

**Purpose**: Add shared infrastructure that blocks all story work.

- [x] T010 Configure shared build/type exports in `packages/shared/src/index.ts`
- [x] T011 [P] Define initial shared constants export in `packages/shared/src/constants/index.ts`
- [x] T012 [P] Define initial shared schema export in `packages/shared/src/schemas/index.ts`
- [x] T013 [P] Define initial shared type export in `packages/shared/src/types/index.ts`
- [x] T014 Configure API application entry structure in `apps/api/src/server.ts`
- [x] T015 Configure API environment validation module in `apps/api/src/infrastructure/config/env.ts`
- [x] T016 Configure API structured logger module in `apps/api/src/infrastructure/logging/logger.ts`
- [x] T017 Configure API standardized error module in `apps/api/src/shared/errors/error-envelope.ts`
- [x] T018 Configure web application entry structure in `apps/web/src/main.tsx`
- [x] T019 Configure root validation scripts in `package.json`
- [x] T020 Configure Docker development baseline in `docker-compose.yml`

## Phase 3: User Story 1 - Run the Project Locally (Priority: P1)

**Goal**: A developer can install dependencies and run the web and API foundations locally.

**Independent Test**: Follow documented quickstart commands and verify both apps start and the health endpoint responds.

### Tests for User Story 1

- [x] T021 [P] [US1] Add API health integration test in `apps/api/tests/integration/health.test.ts`
- [x] T022 [P] [US1] Add web shell smoke test in `apps/web/tests/e2e/app-shell.spec.tsx`

### Implementation for User Story 1

- [x] T023 [US1] Implement health module route in `apps/api/src/modules/health/health.route.ts`
- [x] T024 [US1] Wire health route into API server in `apps/api/src/server.ts`
- [x] T025 [US1] Implement minimal Aura Capital web app shell in `apps/web/src/app/App.tsx`
- [x] T026 [US1] Document local install and run commands in `README.md`

**Checkpoint**: Web app starts, API starts, and health endpoint succeeds.

## Phase 4: User Story 2 - Validate Quality Gates (Priority: P1)

**Goal**: QA can run lint, typecheck, tests, and build consistently.

**Independent Test**: Execute all documented quality commands and verify success exit codes.

### Tests for User Story 2

- [x] T027 [P] [US2] Add shared package unit test in `packages/shared/src/index.test.ts`
- [x] T028 [P] [US2] Add API baseline unit test in `apps/api/tests/unit/error-envelope.test.ts`

### Implementation for User Story 2

- [x] T029 [US2] Configure root lint command in `package.json`
- [x] T030 [US2] Configure root typecheck command in `package.json`
- [x] T031 [US2] Configure root test command in `package.json`
- [x] T032 [US2] Configure root build command in `package.json`
- [x] T033 [US2] Document validation commands in `README.md`

**Checkpoint**: Lint, typecheck, tests, and build are locally executable.

## Phase 5: User Story 3 - Configure Runtime Safely (Priority: P2)

**Goal**: API startup validates required runtime settings and fails safely.

**Independent Test**: Start API with missing and invalid environment values, then with valid values.

### Tests for User Story 3

- [x] T034 [US3] Add missing environment validation test in `apps/api/tests/unit/env.test.ts`
- [x] T035 [US3] Add invalid environment validation test in `apps/api/tests/unit/env.test.ts`

### Implementation for User Story 3

- [x] T036 [US3] Implement required API environment schema in `apps/api/src/infrastructure/config/env.ts`
- [x] T037 [US3] Ensure API startup blocks invalid configuration in `apps/api/src/server.ts`
- [x] T038 [US3] Document required environment variables in `.env.example` and `README.md`

**Checkpoint**: Missing or invalid required config fails before serving traffic.

## Phase 6: User Story 4 - Observe Baseline Behavior (Priority: P2)

**Goal**: API produces structured logs and controlled errors without leaking sensitive values.

**Independent Test**: Trigger success and controlled error paths, then inspect response shape and logs.

### Tests for User Story 4

- [x] T039 [P] [US4] Add standardized error unit test in `apps/api/tests/unit/error-envelope.test.ts`
- [x] T040 [P] [US4] Add request logging integration test in `apps/api/tests/integration/logging.test.ts`

### Implementation for User Story 4

- [x] T041 [US4] Implement error response envelope in `apps/api/src/shared/errors/error-envelope.ts`
- [x] T042 [US4] Implement request logging middleware in `apps/api/src/middleware/request-logging.ts`
- [x] T043 [US4] Implement controlled error middleware in `apps/api/src/middleware/error-handler.ts`
- [x] T044 [US4] Wire logging and error middleware into `apps/api/src/server.ts`

**Checkpoint**: Structured request logs and standardized controlled error responses are available.

## Phase 7: User Story 5 - Run Checks in CI (Priority: P3)

**Goal**: CI runs baseline quality checks for proposed changes.

**Independent Test**: Trigger CI and verify install, lint, typecheck, tests, and build run.

### Implementation for User Story 5

- [x] T045 [US5] Configure GitHub Actions workflow in `.github/workflows/ci.yml`
- [x] T046 [US5] Ensure CI uses safe test environment values in `.github/workflows/ci.yml`
- [x] T047 [US5] Document CI quality gate expectations in `README.md`

**Checkpoint**: CI executes the same validation categories expected by QA.

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment, reporting, and QA readiness.

- [x] T048 [P] Update progress tracker entry for FEAT-001 implementation status in `docs/progress-tracker.md`
- [x] T049 [P] Add implementation report in `reports/implementation/phase-1/FEAT-001.md`
- [x] T050 Run full validation suite and record commands/results in `reports/implementation/phase-1/FEAT-001.md`
- [x] T051 Review implementation against `docs/code-standards.md` and record standards mapping in `reports/implementation/phase-1/FEAT-001.md`
- [x] T052 Review implementation against `acceptance.md` and record acceptance mapping in `reports/implementation/phase-1/FEAT-001.md`
