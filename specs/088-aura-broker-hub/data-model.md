# Data Model: FEAT-088 Aura Broker Hub & Verified Creator Marketplace

## 1. Entity Definitions & Schemas

### 1.1 BrokerProfile
```typescript
export type BrokerVerificationStatus = "PENDING_REVIEW" | "VERIFIED_ACTIVE" | "REJECTED" | "SUSPENDED";
export type BrokerBadge = "CERTIFIED_BROKER" | "SENIOR_PARTNER" | "INSTITUTIONAL_MENTOR";
export type BrokerSaaSTier = "STARTER" | "PRO" | "MASTER";

export interface BrokerProfile {
  id: string;
  userId: string;
  fullName: string;
  idCardNumber: string; // eKYC (masked: ***1234)
  licenseNumber: string; // UBCKNN Certificate Number (e.g. "UBCKNN-CCHN-2024-8891")
  firmName: string; // e.g. "SSI", "VPS", "TCBS", "VNDIRECT", "HSC", "MBS"
  experienceYears: number;
  investmentStyle: string; // e.g. "Tăng Trưởng (Growth)", "Phân Tích Kỹ Thuật (TA)", "Cổ Tức Bền Vững"
  bio: string;
  avatarUrl?: string;
  verificationStatus: BrokerVerificationStatus;
  badge: BrokerBadge;
  saasTier: BrokerSaaSTier;
  saasExpiresAt?: string;
  totalEarningsVnd: number;
  verifiedRating: number; // 0.0 to 5.0
  reviewCount: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 1.2 BrokerRoom
```typescript
export type RoomStatus = "ACTIVE" | "ARCHIVED_READ_ONLY";

export interface BrokerRoom {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerFirm: string;
  brokerBadge: BrokerBadge;
  title: string;
  slug: string;
  description: string;
  coverImageUrl?: string;
  entranceFeeVnd: number; // e.g. 500000 (VND)
  investmentStyle: string;
  status: RoomStatus;
  memberCount: number;
  simulationScenarioKey?: "MAP1_FOMO" | "MAP2_MACRO" | "NONE";
  createdAt: string;
  updatedAt: string;
}
```

### 1.3 RoomResource
```typescript
export type ResourceCategory = "LECTURE" | "MARKET_BRIEF" | "VALUATION_MODEL" | "SIMULATION_EXERCISE";

export interface RoomResource {
  id: string;
  roomId: string;
  title: string;
  category: ResourceCategory;
  content: string; // Markdown summary/analysis
  mediaUrl?: string; // Video or presentation link
  isPinned: boolean;
  simulationKey?: string;
  createdAt: string;
}
```

### 1.4 RoomEnrollment
```typescript
export interface RoomEnrollment {
  id: string;
  roomId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  feePaidVnd: number;
  platformTakeRatePct: number; // 10% to 15%
  platformShareVnd: number;
  brokerShareVnd: number;
  status: "CONFIRMED" | "REFUNDED";
  enrolledAt: string;
}
```

### 1.5 ComplianceFlag
```typescript
export interface ComplianceFlag {
  id: string;
  resourceId: string;
  brokerId: string;
  brokerName: string;
  flaggedKeyword: string;
  snippet: string;
  severity: "HIGH" | "MEDIUM" | "CRITICAL";
  status: "PENDING" | "DISMISSED" | "ACTION_TAKEN";
  createdAt: string;
}
```
