# Plan: FEAT-086 Aura Intelligence AI Studio & 100% Platform Route Completion

**Feature Code**: `FEAT-086`  
**Status**: APPROVED  

---

## 1. Technical Architecture & Approach

### Component Hierarchy
- `AiStudioPage.tsx` (`apps/web/src/features/ai/pages/AiStudioPage.tsx`):
  - **Header**: Title, AI Guardrail Engine status badge, VIP quota indicator, and Reset Conversation CTA.
  - **Sidebar / Preset Drawer**: Curated financial prompts grouped by:
    1. *Định Giá Doanh Nghiệp (DCF, P/E, ROE, FCF)*
    2. *Quản Trị Rủi Ro Đấu Trường FOMO Arena*
    3. *Chiến Lược Phân Bổ Danh Mục Pro Room (Graham & Buffett)*
    4. *Thuật Ngữ Phái Sinh & Kinh Tế Vĩ Mô*
  - **Chat Canvas**:
    - Message history stream with syntax highlighting, guardrail verification tag, and copy helper.
    - Quick pill follow-up chips.
    - Auto-scrolling container with keyboard-accessible form.
  - **Gating Layer**:
    - If user does not have active VIP or ADMIN entitlement, replaces the chat canvas with `<AiCoachMembershipGate />`, linking directly to instant upgrade with +500 XP bonus.

### Route Registry Updates
- `route-registry.ts`:
  - Change `ROUTE_REGISTRY.ai.status` to `"AVAILABLE"`.
  - Change `ROUTE_REGISTRY.ai.isNavVisible` to `true`.
  - Remove target phase tag.
- `AppShell.tsx`:
  - Remove `<PlannedRoutePlaceholder route={ROUTE_REGISTRY.ai} />`.
  - Mount `<Route path="/ai" element={<ProtectedRoute><AiStudioPage /></ProtectedRoute>} />`.
- `AppHeader.tsx`:
  - Ensure `/ai` link is prominently visible and active in navigation.
- `LandingPage.tsx`:
  - Update Membership card and Aura Intelligence card to active status badges and live routing links.

---

## 2. Testing & Verification Plan
1. **Unit Test Suite**: `AiStudioPage.test.tsx` verifying:
   - Full studio view for authenticated VIP users.
   - Membership gating presentation for Free tier users.
   - Guardrail badges display.
   - Prompt preset selection and message submission.
2. **Persistence Boundary**: Zero filesystem persistence violations in `apps/api/tests/unit/persistence-guard.test.ts`.
3. **Workspace Typecheck**: Zero TypeScript compile errors (`npm run typecheck`).
4. **Production Build**: Successful bundle generation (`npm run build:web`).
