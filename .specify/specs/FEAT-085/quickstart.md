# Quickstart & Verification Guide: Subscription Pricing & Feature Comparison (FEAT-085 Option A)

**Feature**: FEAT-085 Option A  
**Status**: APPROVED  
**Date**: 2026-10-23  

---

## 1. Prerequisites
- Workspace environment running locally or in test mode (`apps/web` running on Vite).
- User authenticated with test credentials.

---

## 2. Validation Scenarios

### Scenario 1: Billing Cycle Toggle Interaction
1. Navigate to `/subscription`.
2. Verify default billing cycle is set to "Theo Năm (Tiết kiệm 38% 🔥)".
3. Verify the Premium price card displays `1.490.000 ₫ / năm` with subtext `~124.000 ₫ / tháng`.
4. Click the "Theo Tháng" toggle option.
5. Verify the Premium price updates immediately to `199.000 ₫ / tháng`.

### Scenario 2: Visual Comparison Matrix
1. Scroll down to the "Bảng So Sánh Chi Tiết Quyền Lợi & Hạn Mức" section.
2. Verify all 8 comparison rows are rendered clearly with responsive table formatting.
3. Verify the Standard column displays limitations (e.g. "3 phiên / tháng", "10 truy vấn / ngày").
4. Verify the Premium column displays gold checkmarks and "Không giới hạn" entitlements.

### Scenario 3: Instant Upgrade Execution & Gamification Hook
1. Click the "Nâng Cấp Gói Premium VIP" button (`data-testid="subscription-upgrade-button"`).
2. Verify immediate visual feedback ("Đang kích hoạt...").
3. Verify successful notification: `✨ VIP Patron Badge unlocked & +500 XP awarded!`.
4. Verify Gamification Cockpit reflects `+500 XP` and unlocks the `Hội Viên Ưu Tú` badge.
5. Verify AI Coach co-pilot modal immediately acknowledges `PREMIUM VIP` tier status.

---

## 3. Automated Test Commands

```bash
# Run unit and integration tests for the subscription feature
npx vitest run src/features/subscription/pages/SubscriptionPage.test.tsx

# Verify full workspace type-safety (0 errors required)
npm run typecheck

# Verify production bundle compilation
npm run build
```
