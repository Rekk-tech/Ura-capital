export type BrokerVerificationStatus = "PENDING_REVIEW" | "VERIFIED_ACTIVE" | "REJECTED" | "SUSPENDED";
export type BrokerBadge = "CERTIFIED_BROKER" | "SENIOR_PARTNER" | "INSTITUTIONAL_MENTOR";
export type BrokerSaaSTier = "STARTER" | "PRO" | "MASTER";
export type RoomStatus = "ACTIVE" | "ARCHIVED_READ_ONLY";
export type ResourceCategory = "LECTURE" | "MARKET_BRIEF" | "VALUATION_MODEL" | "SIMULATION_EXERCISE";

export interface BrokerProfileDto {
  id: string;
  userId: string;
  fullName: string;
  idCardNumberMasked: string;
  licenseNumber: string;
  firmName: string;
  experienceYears: number;
  investmentStyle: string;
  bio: string;
  avatarUrl?: string;
  verificationStatus: BrokerVerificationStatus;
  badge: BrokerBadge;
  saasTier: BrokerSaaSTier;
  saasExpiresAt?: string;
  totalEarningsVnd: number;
  verifiedRating: number;
  reviewCount: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerRoomDto {
  id: string;
  brokerId: string;
  brokerName: string;
  brokerFirm: string;
  brokerBadge: BrokerBadge;
  brokerAvatarUrl?: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl?: string;
  entranceFeeVnd: number;
  investmentStyle: string;
  status: RoomStatus;
  memberCount: number;
  simulationScenarioKey?: "MAP1_FOMO" | "MAP2_MACRO" | "NONE";
  isEnrolled?: boolean;
  createdAt: string;
}

export interface RoomResourceDto {
  id: string;
  roomId: string;
  title: string;
  category: ResourceCategory;
  content: string;
  mediaUrl?: string;
  isPinned: boolean;
  simulationKey?: string;
  createdAt: string;
}

export interface RoomEnrollmentDto {
  id: string;
  roomId: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  feePaidVnd: number;
  platformTakeRatePct: number;
  platformShareVnd: number;
  brokerShareVnd: number;
  status: "CONFIRMED" | "REFUNDED";
  enrolledAt: string;
}

export interface RegisterBrokerPayload {
  fullName: string;
  idCardNumber: string;
  licenseNumber: string;
  firmName: string;
  experienceYears: number;
  investmentStyle: string;
  bio: string;
  initialRoomTitle?: string;
  initialRoomFeeVnd?: number;
}

export interface CreateRoomResourcePayload {
  title: string;
  category: ResourceCategory;
  content: string;
  mediaUrl?: string;
  isPinned?: boolean;
  simulationKey?: string;
}

export interface VerifyBrokerPayload {
  status: "VERIFIED_ACTIVE" | "REJECTED";
  badge?: BrokerBadge;
  rejectionReason?: string;
}

export interface ComplianceFlagDto {
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

export const VIETNAMESE_SECURITIES_FIRMS = [
  "SSI - CTCP Chứng khoán SSI",
  "VPS - CTCP Chứng khoán VPS",
  "TCBS - CTCP Chứng khoán Kỹ Thương",
  "VNDIRECT - CTCP Chứng khoán VNDIRECT",
  "HSC - CTCP Chứng khoán TP.HCM",
  "MBS - CTCP Chứng khoán MB",
  "VCI - CTCP Chứng khoán Vietcap",
  "Mirae Asset Securities Vietnam",
  "Kafi Securities",
  "FPTS - CTCP Chứng khoán FPT",
] as const;

export const PROHIBITED_COMPLIANCE_KEYWORDS = [
  "cam kết lãi",
  "cam kết 100%",
  "chắc chắn ăn",
  "bao lỗ",
  "ủy thác đầu tư",
  "kéo vốn",
  "nhân đôi tài khoản",
  "sàn quốc tế",
  "forex",
  "tiền ảo",
  "phím kèo bao ăn",
] as const;
