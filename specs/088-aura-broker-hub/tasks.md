# Implementation Tasks: FEAT-088 Aura Broker Hub & Verified Creator Marketplace

## Phase 1: Shared Models & Contract Foundation
- [x] T001 Define Broker Enums, DTOs, and Constants in `packages/shared/src/types/broker.types.ts`
- [x] T002 Export Broker types and compliance keyword rules in `packages/shared/src/index.ts`
- [x] T003 Build `@aura/shared` to verify TypeScript compile integrity

## Phase 2: Backend API & Compliance Engine
- [x] T004 Implement `compliance-scanner.service.ts` to detect prohibited financial advice/guarantees
- [x] T005 Implement `broker.service.ts` with registration, verification, room management, and escrow revenue split
- [x] T006 Implement `broker.routes.ts` mounted at `/api/brokers` with authorization guards
- [x] T007 Mount `brokerRouter` in `apps/api/src/server.ts`
- [x] T008 Add unit tests for `compliance-scanner.service.test.ts` and `broker.service.test.ts`

## Phase 3: Frontend API Client & Route Registration
- [x] T009 Implement `apps/web/src/api/broker.api.ts` with error handling
- [x] T010 Register `CANONICAL_ROUTES.BROKER_HUB` and `CANONICAL_ROUTES.BROKER_ROOM` in `route-registry.ts`
- [x] T011 Update `AppHeader.tsx` to include "Broker Hub" in primary navigation

## Phase 4: Frontend UI Components & Pages (ui-styling & ui-ux-pro-max)
- [x] T012 Implement `BrokerCard.tsx` and `RoomCard.tsx` with verified badges and metrics
- [x] T013 Implement `BrokerRegisterModal.tsx` for partner eKYC & UBCKNN license submission
- [x] T014 Implement `RoomEnrollmentModal.tsx` for One-Time Entrance Fee payment with legal disclaimer
- [x] T015 Implement `BrokerHubPage.tsx` (`/broker-hub`) with search, firm filter, and style tags
- [x] T016 Implement `BrokerRoomDetailPage.tsx` (`/broker-hub/rooms/:roomId`) with lectures, market briefs, simulation exercises, and discussions
- [x] T017 Implement `AdminBrokerVerificationTable.tsx` and integrate into `AdminDashboardPage.tsx`
- [x] T018 Mount routes in `AppShell.tsx` and add CSS styling in `apps/web/src/index.css`

## Phase 5: Verification & End-to-End Validation
- [x] T019 Run workspace typecheck (`npm run typecheck`)
- [x] T020 Run unit tests for Broker Hub features
- [x] T021 Run browser subagent to verify `/broker-hub`, registration flow, and room detail UI

## Phase 6: 5-Role RBAC Foundation & Backend Authorization Expansion
- [x] T022 [P] Expand canonical roles (LEARNER, BROKER, MODERATOR, SYSTEM_ADMIN) and helper predicates in `apps/api/src/modules/auth/authorization.constants.ts`
- [x] T023 [P] Update role seeding logic and descriptions in `apps/api/src/modules/auth/role.seed.ts`
- [x] T024 Enforce admin self-lockout & self-demotion prevention invariant in `apps/api/src/modules/admin/admin.service.ts`
- [x] T025 Implement 5-role authorization matrix and multi-role matching unit tests in `apps/api/tests/unit/authorization.middleware.test.ts`

## Phase 7: Frontend RBAC UI Guards & Natural Role-Aware Experience (ui-styling & ui-ux-pro-max)
- [x] T026 [P] Create reusable `RoleGuard.tsx` component in `apps/web/src/features/auth/components/RoleGuard.tsx`
- [x] T027 [P] Update `AdminRouteGuard.tsx` to support SYSTEM_ADMIN and MODERATOR scoped access in `apps/web/src/features/admin/components/AdminRouteGuard.tsx`
- [x] T028 Update `AppHeader.tsx` with natural role badges, contextual action pills, and status dropdown in `apps/web/src/app/shell/AppHeader.tsx`
- [x] T029 Add CSS styling tokens for role badges and natural visual indicators in `apps/web/src/index.css`

## Phase 8: Comprehensive Verification & Type Safety
- [x] T030 Run backend authorization tests via `npm --prefix apps/api test -- tests/unit/authorization.middleware.test.ts`
- [x] T031 Run frontend tests for header and route guards via `npm --prefix apps/web test -- src/app/shell/AppShell.test.tsx`
- [x] T032 Run workspace TypeScript validation (`npx tsc --noEmit -p apps/web/tsconfig.json`)

## Phase 9: Post-Login Role Gateway & Clean Authentication Flow (FR-007)
- [x] T033 Register `/auth/role-gateway` in `route-registry.ts` and `AppShell.tsx`
- [x] T034 Implement `RoleGatewayPage.tsx` with SoD scope, identity summary, and workspace selector in `apps/web/src/features/auth/pages/RoleGatewayPage.tsx`
- [x] T035 Update `LoginPage.tsx` to redirect to `/auth/role-gateway` after successful sign-in
- [x] T036 Add CSS design tokens and styling for Role Gateway in `apps/web/src/index.css`
- [x] T037 Add unit tests for `RoleGatewayPage.test.tsx` in `apps/web/src/features/auth/pages/RoleGatewayPage.test.tsx`
- [x] T038 Validate with `npm run typecheck` and test suites
- [x] T039 Verify end-to-end UI in browser with subagent

