# Data Model: Subscription Pricing & Entitlements (FEAT-085 Option A)

**Feature**: FEAT-085 Option A  
**Status**: APPROVED  
**Date**: 2026-10-23  

---

## 1. Plan Definition & Pricing Structure

```typescript
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeatureComparison {
  featureName: string;
  category: "SIMULATION" | "AI_ASSISTANT" | "ACADEMY" | "COMMUNITY" | "REPORTS";
  standardValue: string;
  premiumValue: string;
  isHighlight?: boolean;
}

export interface CommercialPlanConfig {
  planKey: "FREE" | "PREMIUM";
  displayName: string;
  tagline: string;
  pricing: {
    monthly: {
      amount: number;
      formatted: string;
      unit: string;
    };
    yearly: {
      amount: number;
      formatted: string;
      unit: string;
      monthlyEquivalentFormatted: string;
      discountPercent: number;
    };
  };
  features: string[];
  ctaLabel: string;
  isPopular?: boolean;
}
```

---

## 2. Canonical Plan Specifications

### 2.1. Standard Plan (Gói Tiêu Chuẩn)
- **Plan Key**: `FREE`
- **Name**: `Gói Tiêu Chuẩn (Standard / Free Explorer)`
- **Monthly Price**: `0 ₫`
- **Yearly Price**: `0 ₫`
- **Quota Limits**:
  - `virtual_capital`: `100.000.000 ₫` (Fixed)
  - `map1_runs`: `UNLIMITED`
  - `map2_runs`: `3 phiên / tháng`
  - `ai_queries`: `10 truy vấn / ngày` (Gemini 1.5 Flash)
  - `academy_stages`: `Stage 1 & Stage 2` (Nền tảng & Cổ phiếu)
  - `community_posts`: `Tối đa 3 bài viết / ngày`
  - `xp_bonus`: `200 XP mặc định`
  - `export_pdf`: `Không hỗ trợ`

### 2.2. Premium VIP Plan (Gói Cao Cấp)
- **Plan Key**: `PREMIUM`
- **Name**: `Gói Cao Cấp (Institutional Premium VIP)`
- **Monthly Price**: `199.000 ₫ / tháng`
- **Yearly Price**: `1.490.000 ₫ / năm` (`~124.000 ₫ / tháng`, Tiết kiệm 38%)
- **Entitlements**: `PREMIUM_ACCESS`
- **Quota Limits**:
  - `virtual_capital`: `Tùy biến lên tới 1.000.000.000 ₫`
  - `map1_runs`: `UNLIMITED`
  - `map2_runs`: `UNLIMITED`
  - `ai_queries`: `UNLIMITED (Aura AI Studio 24/7 với Gemini 1.5 Pro)`
  - `academy_stages`: `UNLIMITED (Toàn bộ Chặng 1, 2, 3 và chuyên sâu phái sinh/hedging)`
  - `community_posts`: `UNLIMITED`
  - `xp_bonus`: `+500 XP gia nhập ngay lập tức`
  - `exclusive_badge`: `Hội Viên Ưu Tú (VIP Patron Badge)`
  - `export_pdf`: `Hỗ trợ xuất báo cáo phân tích hiệu suất cá nhân`

---

## 3. Comparison Matrix Data Definition

| Chỉ Mục Tính Năng | Gói Tiêu Chuẩn (Standard) | Gói Cao Cấp (Premium VIP) | Điểm Nổi Bật |
| :--- | :--- | :--- | :--- |
| **Vốn Ảo Khởi Điểm** | 100.000.000 ₫ cố định | Tùy biến lên tới 1.000.000.000 ₫ | Linh hoạt quy mô danh mục |
| **Đấu Trường FOMO (Map 1)** | Không giới hạn lượt chơi | Không giới hạn lượt chơi | Thực hành phản xạ tâm lý |
| **Đấu Trường Pro Room (Map 2)** | Tối đa 3 phiên / tháng | Không giới hạn mọi kịch bản | Thử thách phân bổ tài sản vĩ mô |
| **Trợ Lý AI Aura Intelligence** | 10 truy vấn / ngày (Cơ bản) | Không giới hạn 24/7 (Chuyên sâu) | Tư vấn chiến lược theo thời gian thực |
| **Phân Tích Tâm Lý Lệnh AI** | Đánh giá tổng quan sau trận | Bóc tách chi tiết từng chu kỳ lệnh | Khắc phục triệt để bẫy cảm xúc |
| **Khóa Học Aura Academy** | Chặng 1 & Chặng 2 | Mở khóa toàn bộ 100% | Làm chủ phái sinh & định giá tổ chức |
| **Đặc Quyền Bảng Xếp Hạng** | Hiển thị xếp hạng tiêu chuẩn | Huy hiệu VIP Patron vàng nổi bật | Khẳng định vị thế cộng đồng |
| **Quà Tặng Điểm Thưởng XP** | 200 XP tích lũy ban đầu | **Tặng ngay +500 XP** khi nâng cấp | Thăng hạng nhanh lên Level 3 |
