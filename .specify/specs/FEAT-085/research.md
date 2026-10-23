# Research & Architectural Decisions: Subscription Pricing & Feature Comparison (Option A)

**Feature**: FEAT-085 Plan Option A (Commercial Pricing & Comparison Matrix)  
**Status**: APPROVED  
**Date**: 2026-10-23  

---

## 1. Context & Objectives

To transition Aura Capital from a functional prototype to a production-ready commercial offering, the `/subscription` page requires a high-converting, transparent pricing interface tailored to the Vietnamese retail investor and financial learner demographic.

### Requirements:
1. **Clear 2-Tier Product Architecture**:
   - **Gói Tiêu Chuẩn (Standard / Free Explorer)**: 0 VND trọn đời.
   - **Gói Cao Cấp (Institutional Premium VIP)**:
     - Monthly option: **199.000 VNĐ / tháng**.
     - Annual option: **1.490.000 VNĐ / năm** (~124.000 VNĐ / tháng, saving 38%).
2. **Interactive Billing Cycle Toggle**:
   - Monthly vs Annual switch with visual "Tiết kiệm 38% 🔥" discount badge.
3. **Comprehensive Feature Comparison Matrix Table**:
   - Direct side-by-side evaluation across 8 operational dimensions: Virtual capital, Map 1 access, Map 2 access, AI Studio queries, Trade psychology debrief, Academy stages, XP welcome bonus, and Exportable reports.
4. **Preservation of Existing Test Invariants & Server Authority**:
   - Existing tests (`SubscriptionPage.test.tsx`, `subscription-learner-journey.spec.tsx`) assert specific element IDs and text content (`subscription-page`, `subscription-status-card`, `subscription-upgrade-button`, etc.).
   - All server-authoritative rules (zero client-computed money, instant React Query invalidation) must remain strictly intact.

---

## 2. Technical Decisions & Tradeoffs

### Decision 1: Billing Frequency State Management
- **Decision**: Manage the billing cycle (`BILLING_CYCLE = "monthly" | "yearly"`) purely as a UI presentation state in `SubscriptionPage.tsx` using `useState<"monthly" | "yearly">("yearly")` (defaulting to the high-value annual plan).
- **Rationale**: The subscription entitlement granted by the server is `PREMIUM_ACCESS`. The billing cycle affects the displayed price and checkout parameters, without requiring complex schema migrations on `@aura/shared`.
- **Alternative considered**: Storing billing frequency in the backend database immediately. Rejected as unnecessary scope creep for Phase 9 mock checkout, where the server already tracks active periods via `currentPeriodStart` and `currentPeriodEnd`.

### Decision 2: Pricing Presentation & Currency Standards
- **Decision**: Standardize all monetary values to Vietnamese Dong formatted with dot separators: `199.000 ₫` / `1.490.000 ₫`.
- **Rationale**: Complies with standard Vietnamese e-commerce and FinTech UX conventions (e.g. FireAnt, Simplize). Avoids confusing foreign currency symbols.

### Decision 3: Component Layout Hierarchy
- **Decision**: Structure the `/subscription` page into 3 distinct vertical zones:
  1. **Zone 1: Account Status & Current Plan Banner** (Compact status badge, period end, manual refresh button).
  2. **Zone 2: 2-Tier Pricing Cards & Billing Toggle** (Interactive Monthly/Yearly toggle, Standard card vs Premium VIP highlighted gradient card).
  3. **Zone 3: Feature Comparison Matrix Table** (8-row structured comparison table with checkmarks and quota details).
- **Rationale**: Separates current subscription state management (cancellation, status checking) from the promotional purchase journey, allowing both active subscribers and prospective upgraders to navigate seamlessly.

### Decision 4: Backward Compatibility with Vitest Suite
- **Decision**: Retain the `data-testid="subscription-upgrade-button"` on the primary call-to-action button inside the Premium card, and maintain the existing `CancelSubscriptionDialog` triggers.
- **Rationale**: Prevents any regressions in `SubscriptionPage.test.tsx` (100% pass rate guaranteed).
