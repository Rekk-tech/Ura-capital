# Tasks: FEAT-089 FOMO Arena Scenario Selection & Fairness Engine

**Feature**: FEAT-089  
**Status**: COMPLETED  

## Phase 1: Specifications & Clarifications
- [x] T001 Define anti-replay decay and ACPI fair scoring formula in `specs/089-fomo-arena-scenario-engine/spec.md`
- [x] T002 Define 3 historical Vietnamese stock datasets (`SVIX_PUMP`, `SNVL_CRASH`, `SFPT_EXP`) in `specs/089-fomo-arena-scenario-engine/spec.md`

## Phase 2: Scenario Data & Visual UI Components
- [x] T003 Enrich `apps/web/src/features/simulation/data/simulation-scenarios-store.ts` with metadata, codeTag, and chart curves
- [x] T004 Implement redesigned scenario selector cards and docked navy action bar in `apps/web/src/features/simulation/pages/FomoArenaPage.tsx`
- [x] T005 Implement redesigned 4-step infographic modal in `apps/web/src/features/simulation/components/map1/FomoTutorialModal.tsx`
- [x] T006 Add responsive Vanilla CSS styling in `apps/web/src/index.css`

## Phase 3: Unit Tests & Verification
- [x] T007 Add automated unit tests for scenario selector interactions in `apps/web/src/features/simulation/pages/FomoArenaPage.test.tsx`
- [x] T008 Add automated unit tests for 4-step tutorial modal in `apps/web/src/features/simulation/components/map1/FomoTutorialModal.test.tsx`
- [x] T009 Validate UI with browser subagent visual capture and compare against design mockups
