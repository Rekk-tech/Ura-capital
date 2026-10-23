import {
  BrokerProfileDto,
  BrokerRoomDto,
  RoomResourceDto,
  RoomEnrollmentDto,
  RegisterBrokerPayload,
  CreateRoomResourcePayload,
  VerifyBrokerPayload,
  ComplianceFlagDto,
} from "@aura/shared";
import { complianceScannerService } from "./compliance-scanner.service.js";

export class BrokerService {
  private profiles: Map<string, BrokerProfileDto> = new Map();
  private rooms: Map<string, BrokerRoomDto> = new Map();
  private resources: Map<string, RoomResourceDto[]> = new Map();
  private enrollments: Map<string, RoomEnrollmentDto[]> = new Map();
  private complianceFlags: ComplianceFlagDto[] = [];

  constructor() {
    this.seedInitialBrokers();
  }

  private seedInitialBrokers(): void {
    const broker1: BrokerProfileDto = {
      id: "broker-ssi-01",
      userId: "user-broker-ssi-01",
      fullName: "Nguyễn Hoàng Nam",
      idCardNumberMasked: "079***8821",
      licenseNumber: "UBCKNN-CCHN-2019-4820",
      firmName: "SSI - CTCP Chứng khoán SSI",
      experienceYears: 8,
      investmentStyle: "Tăng Trưởng (CANSLIM & Cơ Bản)",
      bio: "8 năm trưởng nhóm phân tích thị trường tại SSI. Tác giả nhiều chuyên đề về tầm soát dòng tiền thông minh và định giá DCF thực chiến.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      verificationStatus: "VERIFIED_ACTIVE",
      badge: "SENIOR_PARTNER",
      saasTier: "PRO",
      saasExpiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
      totalEarningsVnd: 42500000,
      verifiedRating: 4.9,
      reviewCount: 38,
      createdAt: "2026-01-15T08:00:00.000Z",
      updatedAt: "2026-10-20T08:00:00.000Z",
    };

    const room1: BrokerRoomDto = {
      id: "room-ssi-alpha",
      brokerId: broker1.id,
      brokerName: broker1.fullName,
      brokerFirm: broker1.firmName,
      brokerBadge: broker1.badge,
      brokerAvatarUrl: broker1.avatarUrl,
      title: "Alpha Growth Club — Chiến Lược Cổ Phiếu Vượt Đỉnh",
      slug: "alpha-growth-club",
      description: "Phòng sinh hoạt chiến lược dành cho nhà đầu tư theo trường phái tăng trưởng. Tập trung lọc cổ phiếu dẫn dắt (Leader), điểm mua Pivot an toàn, và bài tập mô phỏng tâm lý FOMO.",
      coverImageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      entranceFeeVnd: 500000,
      investmentStyle: "Tăng Trưởng (CANSLIM & Cơ Bản)",
      status: "ACTIVE",
      memberCount: 85,
      simulationScenarioKey: "MAP1_FOMO",
      createdAt: "2026-02-01T09:00:00.000Z",
    };

    const broker2: BrokerProfileDto = {
      id: "broker-tcbs-02",
      userId: "user-broker-tcbs-02",
      fullName: "Trần Minh Quang",
      idCardNumberMasked: "001***5542",
      licenseNumber: "UBCKNN-CCHN-2016-1109",
      firmName: "TCBS - CTCP Chứng khoán Kỹ Thương",
      experienceYears: 11,
      investmentStyle: "Giá Trị & Phân Bổ Vĩ Mô",
      bio: "Chuyên gia hoạch định danh mục thể chế. Phong cách Ben Graham và Warren Buffett: biên an toàn cao, dòng tiền cổ tức bền vững qua các chu kỳ lạm phát.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
      verificationStatus: "VERIFIED_ACTIVE",
      badge: "INSTITUTIONAL_MENTOR",
      saasTier: "MASTER",
      saasExpiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
      totalEarningsVnd: 128000000,
      verifiedRating: 5.0,
      reviewCount: 94,
      createdAt: "2025-11-10T08:00:00.000Z",
      updatedAt: "2026-10-22T08:00:00.000Z",
    };

    const room2: BrokerRoomDto = {
      id: "room-tcbs-macro",
      brokerId: broker2.id,
      brokerName: broker2.fullName,
      brokerFirm: broker2.firmName,
      brokerBadge: broker2.badge,
      brokerAvatarUrl: broker2.avatarUrl,
      title: "Institutional Wealth — Phân Bổ Tài Sản & Chu Kỳ Vĩ Mô",
      slug: "institutional-wealth-macro",
      description: "Đào tạo phương pháp xây dựng pháo đài tài chính cá nhân. Thực hành cân bằng tỷ trọng Cổ phiếu / Trái phiếu / Vàng / Tiền mặt theo 12 quý mô phỏng kinh tế.",
      coverImageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
      entranceFeeVnd: 1200000,
      investmentStyle: "Giá Trị & Phân Bổ Vĩ Mô",
      status: "ACTIVE",
      memberCount: 160,
      simulationScenarioKey: "MAP2_MACRO",
      createdAt: "2025-12-01T09:00:00.000Z",
    };

    const broker3: BrokerProfileDto = {
      id: "broker-vps-03",
      userId: "user-broker-vps-03",
      fullName: "Lê Thu Trang",
      idCardNumberMasked: "031***9910",
      licenseNumber: "UBCKNN-CCHN-2022-7741",
      firmName: "VPS - CTCP Chứng khoán VPS",
      experienceYears: 4,
      investmentStyle: "Phân Tích Kỹ Thuật (Price Action & VSA)",
      bio: "Chuyên gia Price Action & Volume Spread Analysis. Tôn chỉ: Kỷ luật cắt lỗ tuyệt đối, đọc hành vi tạo lập qua khối lượng giao dịch.",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
      verificationStatus: "VERIFIED_ACTIVE",
      badge: "CERTIFIED_BROKER",
      saasTier: "STARTER",
      saasExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      totalEarningsVnd: 17000000,
      verifiedRating: 4.8,
      reviewCount: 22,
      createdAt: "2026-03-01T08:00:00.000Z",
      updatedAt: "2026-10-18T08:00:00.000Z",
    };

    const room3: BrokerRoomDto = {
      id: "room-vps-pa",
      brokerId: broker3.id,
      brokerName: broker3.fullName,
      brokerFirm: broker3.firmName,
      brokerBadge: broker3.badge,
      brokerAvatarUrl: broker3.avatarUrl,
      title: "Price Action Mastery — Đọc Vị Hành Vi Tạo Lập",
      slug: "price-action-mastery",
      description: "Thực chiến phân tích cấu trúc sóng, bẫy giá giả (Bull-trap / Bear-trap) và phương pháp xác nhận khối lượng trước khi giải ngân.",
      coverImageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80",
      entranceFeeVnd: 450000,
      investmentStyle: "Phân Tích Kỹ Thuật (Price Action & VSA)",
      status: "ACTIVE",
      memberCount: 42,
      simulationScenarioKey: "MAP1_FOMO",
      createdAt: "2026-03-10T09:00:00.000Z",
    };

    this.profiles.set(broker1.id, broker1);
    this.profiles.set(broker2.id, broker2);
    this.profiles.set(broker3.id, broker3);

    this.rooms.set(room1.id, room1);
    this.rooms.set(room2.id, room2);
    this.rooms.set(room3.id, room3);

    this.resources.set(room1.id, [
      {
        id: "res-01",
        roomId: room1.id,
        title: "Chuyên Đề 1: Nhận Diện Cổ Phiếu Vượt Đỉnh 52 Tuần (Quy Tắc 3 Lần Thử Thách)",
        category: "LECTURE",
        content: "Phân tích 3 đặc điểm của một nền giá kiến tạo chuẩn CANSLIM: biên độ hẹp dần (VCP), cạn kiệt thanh khoản trước ngày bùng nổ, và tỷ suất sinh lời vượt trội so với chỉ số chung VN-Index.",
        isPinned: true,
        createdAt: "2026-10-15T10:00:00.000Z",
      },
      {
        id: "res-02",
        roomId: room1.id,
        title: "Bản Tin Đầu Ngày: VN-Index Tích Lũy Vùng 1.280 — Cơ Hội Giải Ngân Nhóm Nào?",
        category: "MARKET_BRIEF",
        content: "Thị trường kiểm định ngưỡng hỗ trợ MA50 với thanh khoản thấp, cho thấy áp lực bán suy kiệt. Khuyến nghị tập trung các cổ phiếu có tăng trưởng lợi nhuận quý 3 vượt 25% YoY.",
        isPinned: false,
        createdAt: "2026-10-23T07:30:00.000Z",
      },
      {
        id: "res-03",
        roomId: room1.id,
        title: "Bài Tập Thực Chiến: Đấu Trường FOMO Arena — Rèn Kỷ Luật Khi Thị Trường Kéo Xả",
        category: "SIMULATION_EXERCISE",
        content: "Yêu cầu tất cả học viên hoàn thành 7 vòng đấu trong Map 1. Mục tiêu: Giữ chỉ số Tâm Lý Thép trên 70 điểm và tỷ lệ Max Drawdown dưới 15%.",
        simulationKey: "MAP1_FOMO",
        isPinned: true,
        createdAt: "2026-10-20T14:00:00.000Z",
      },
    ]);

    this.resources.set(room2.id, [
      {
        id: "res-04",
        roomId: room2.id,
        title: "Mô Hình Định Giá DCF & Tìm Điểm Biên An Toàn Cho Cổ Phiếu Ngân Hàng",
        category: "VALUATION_MODEL",
        content: "Slide bài giảng chuyên sâu về phương pháp tính Chiết khấu Dòng tiền (DCF), tỷ lệ NIM và chi phí vốn chủ sở hữu (Ke) áp dụng cho nhóm cổ phiếu trụ cột.",
        isPinned: true,
        createdAt: "2026-10-10T09:00:00.000Z",
      },
      {
        id: "res-05",
        roomId: room2.id,
        title: "Bài Tập Vĩ Mô: Pro Room 12 Quý — Tối Ưu Tỷ Suất Sharpe Khi Lạm Phát Tạo Đỉnh",
        category: "SIMULATION_EXERCISE",
        content: "Thực hành phân bổ tài sản 12 quý trong Map 2. Mục tiêu đạt Alpha > 5% so với benchmark và Sharpe Ratio > 1.2.",
        simulationKey: "MAP2_MACRO",
        isPinned: true,
        createdAt: "2026-10-18T11:00:00.000Z",
      },
    ]);
  }

  getPublicBrokers(): BrokerProfileDto[] {
    return Array.from(this.profiles.values()).filter(
      (b) => b.verificationStatus === "VERIFIED_ACTIVE"
    );
  }

  getPublicRooms(): BrokerRoomDto[] {
    return Array.from(this.rooms.values()).filter((r) => r.status === "ACTIVE");
  }

  getRoomDetail(roomId: string, userId?: string): (BrokerRoomDto & { resources: RoomResourceDto[]; isEnrolled: boolean }) | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const resources = this.resources.get(roomId) || [];
    const enrollments = this.enrollments.get(roomId) || [];
    const isEnrolled = userId ? enrollments.some((e) => e.userId === userId) : false;

    return {
      ...room,
      resources,
      isEnrolled,
    };
  }

  registerBroker(userId: string, payload: RegisterBrokerPayload): BrokerProfileDto {
    const existing = Array.from(this.profiles.values()).find((p) => p.userId === userId);
    if (existing) {
      return existing;
    }

    const newProfile: BrokerProfileDto = {
      id: `broker-${Date.now()}`,
      userId,
      fullName: payload.fullName.trim(),
      idCardNumberMasked: payload.idCardNumber ? `***${payload.idCardNumber.slice(-4)}` : "***1234",
      licenseNumber: payload.licenseNumber.trim(),
      firmName: payload.firmName.trim(),
      experienceYears: Number(payload.experienceYears) || 1,
      investmentStyle: payload.investmentStyle.trim(),
      bio: payload.bio.trim(),
      verificationStatus: "PENDING_REVIEW",
      badge: "CERTIFIED_BROKER",
      saasTier: "STARTER",
      totalEarningsVnd: 0,
      verifiedRating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(newProfile.id, newProfile);

    // If an initial room title is provided, create a pending room
    if (payload.initialRoomTitle) {
      const room: BrokerRoomDto = {
        id: `room-${Date.now()}`,
        brokerId: newProfile.id,
        brokerName: newProfile.fullName,
        brokerFirm: newProfile.firmName,
        brokerBadge: newProfile.badge,
        title: payload.initialRoomTitle.trim(),
        slug: payload.initialRoomTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: `Phòng học tài chính chuyên sâu của chuyên gia ${newProfile.fullName} (${newProfile.firmName}).`,
        entranceFeeVnd: Number(payload.initialRoomFeeVnd) || 500000,
        investmentStyle: newProfile.investmentStyle,
        status: "ACTIVE",
        memberCount: 0,
        simulationScenarioKey: "MAP1_FOMO",
        createdAt: new Date().toISOString(),
      };
      this.rooms.set(room.id, room);
      this.resources.set(room.id, []);
    }

    return newProfile;
  }

  enrollInRoom(
    userId: string,
    userEmail: string,
    userDisplayName: string,
    roomId: string
  ): { enrollment: RoomEnrollmentDto; room: BrokerRoomDto } {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("Phòng đầu tư không tồn tại.");
    }

    const roomEnrollments = this.enrollments.get(roomId) || [];
    const alreadyEnrolled = roomEnrollments.some((e) => e.userId === userId);
    if (alreadyEnrolled) {
      const existing = roomEnrollments.find((e) => e.userId === userId)!;
      return { enrollment: existing, room };
    }

    const fee = room.entranceFeeVnd;
    const takeRatePct = 15; // 15% platform take-rate
    const platformShare = Math.round(fee * 0.15);
    const brokerShare = fee - platformShare;

    const newEnrollment: RoomEnrollmentDto = {
      id: `enr-${Date.now()}`,
      roomId,
      userId,
      userEmail,
      userDisplayName: userDisplayName || (userEmail ? userEmail.split("@")[0] : "Learner") || "Learner",
      feePaidVnd: fee,
      platformTakeRatePct: takeRatePct,
      platformShareVnd: platformShare,
      brokerShareVnd: brokerShare,
      status: "CONFIRMED",
      enrolledAt: new Date().toISOString(),
    };

    roomEnrollments.push(newEnrollment);
    this.enrollments.set(roomId, roomEnrollments);

    // Update room member count
    room.memberCount += 1;

    // Update broker earnings
    const broker = this.profiles.get(room.brokerId);
    if (broker) {
      broker.totalEarningsVnd += brokerShare;
    }

    return { enrollment: newEnrollment, room };
  }

  addRoomResource(
    _brokerUserId: string,
    roomId: string,
    payload: CreateRoomResourcePayload
  ): { resource: RoomResourceDto; compliance: { isCompliant: boolean; flaggedKeywords: string[] } } {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Phòng không tồn tại");

    const scanTitle = complianceScannerService.scanText(payload.title);
    const scanContent = complianceScannerService.scanText(payload.content);
    const isCompliant = scanTitle.isCompliant && scanContent.isCompliant;
    const flaggedKeywords = Array.from(
      new Set([...scanTitle.flaggedKeywords, ...scanContent.flaggedKeywords])
    );

    if (!isCompliant) {
      const flag: ComplianceFlagDto = {
        id: `flag-${Date.now()}`,
        resourceId: `pending-res-${Date.now()}`,
        brokerId: room.brokerId,
        brokerName: room.brokerName,
        flaggedKeyword: flaggedKeywords.join(", "),
        snippet: scanContent.snippet || scanTitle.snippet || "",
        severity: "HIGH",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      this.complianceFlags.push(flag);
    }

    const newResource: RoomResourceDto = {
      id: `res-${Date.now()}`,
      roomId,
      title: payload.title.trim(),
      category: payload.category,
      content: payload.content.trim(),
      mediaUrl: payload.mediaUrl,
      isPinned: Boolean(payload.isPinned),
      simulationKey: payload.simulationKey,
      createdAt: new Date().toISOString(),
    };

    const currentResources = this.resources.get(roomId) || [];
    currentResources.unshift(newResource);
    this.resources.set(roomId, currentResources);

    return { resource: newResource, compliance: { isCompliant, flaggedKeywords } };
  }

  // Admin Methods
  getPendingBrokers(): BrokerProfileDto[] {
    return Array.from(this.profiles.values()).filter(
      (p) => p.verificationStatus === "PENDING_REVIEW"
    );
  }

  verifyBroker(
    _adminUserId: string,
    brokerId: string,
    payload: VerifyBrokerPayload
  ): BrokerProfileDto {
    const broker = this.profiles.get(brokerId);
    if (!broker) throw new Error("Không tìm thấy hồ sơ Broker");

    broker.verificationStatus = payload.status;
    if (payload.badge) {
      broker.badge = payload.badge;
    }
    if (payload.rejectionReason) {
      broker.rejectionReason = payload.rejectionReason;
    }
    broker.updatedAt = new Date().toISOString();

    return broker;
  }

  getComplianceFlags(): ComplianceFlagDto[] {
    return this.complianceFlags;
  }
}

export const brokerService = new BrokerService();
