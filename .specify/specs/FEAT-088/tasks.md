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
