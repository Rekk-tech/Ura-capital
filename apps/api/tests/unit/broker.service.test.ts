import { describe, it, expect, beforeEach } from "vitest";
import { BrokerService } from "../../src/modules/broker/broker.service.js";
import { ComplianceScannerService } from "../../src/modules/broker/compliance-scanner.service.js";

describe("ComplianceScannerService", () => {
  const scanner = new ComplianceScannerService();

  it("passes compliant educational text", () => {
    const text = "Khóa học phân tích báo cáo tài chính và tìm điểm mua theo phương pháp CANSLIM.";
    const result = scanner.scanText(text);
    expect(result.isCompliant).toBe(true);
    expect(result.flaggedKeywords).toHaveLength(0);
  });

  it("detects prohibited financial promises and guarantees", () => {
    const text = "Vào room VIP cam kết lãi 100% trong vòng 1 tháng, bao lỗ hoàn toàn!";
    const result = scanner.scanText(text);
    expect(result.isCompliant).toBe(false);
    expect(result.flaggedKeywords).toContain("cam kết lãi");
    expect(result.flaggedKeywords).toContain("bao lỗ");
    expect(result.snippet).toBeDefined();
  });

  it("detects illicit asset management and unregulated forex schemes", () => {
    const text = "Anh em gửi vốn đây mình nhận ủy thác đầu tư đánh sàn quốc tế forex bao ăn.";
    const result = scanner.scanText(text);
    expect(result.isCompliant).toBe(false);
    expect(result.flaggedKeywords).toContain("ủy thác đầu tư");
    expect(result.flaggedKeywords).toContain("forex");
  });
});

describe("BrokerService", () => {
  let brokerService: BrokerService;

  beforeEach(() => {
    brokerService = new BrokerService();
  });

  it("initializes with seeded verified brokers and rooms", () => {
    const brokers = brokerService.getPublicBrokers();
    const rooms = brokerService.getPublicRooms();

    expect(brokers.length).toBeGreaterThanOrEqual(3);
    expect(rooms.length).toBeGreaterThanOrEqual(3);

    const ssiBroker = brokers.find((b) => b.firmName.includes("SSI"));
    expect(ssiBroker).toBeDefined();
    expect(ssiBroker?.verificationStatus).toBe("VERIFIED_ACTIVE");
    expect(ssiBroker?.licenseNumber).toContain("UBCKNN-CCHN");
  });

  it("registers a new broker with PENDING_REVIEW status", () => {
    const payload = {
      fullName: "Đặng Quốc Huy",
      idCardNumber: "079099881122",
      licenseNumber: "UBCKNN-CCHN-2023-9912",
      firmName: "HSC - CTCP Chứng khoán TP.HCM",
      experienceYears: 5,
      investmentStyle: "Cổ Tức Bền Vững",
      bio: "Chuyên gia tài chính HSC với 5 năm kinh nghiệm quản lý danh mục cổ tức.",
      initialRoomTitle: "HSC High-Yield Dividend Room",
      initialRoomFeeVnd: 600000,
    };

    const newBroker = brokerService.registerBroker("user-huy-01", payload);
    expect(newBroker.fullName).toBe("Đặng Quốc Huy");
    expect(newBroker.verificationStatus).toBe("PENDING_REVIEW");
    expect(newBroker.licenseNumber).toBe("UBCKNN-CCHN-2023-9912");

    const pending = brokerService.getPendingBrokers();
    expect(pending.some((p) => p.id === newBroker.id)).toBe(true);
  });

  it("allows admin to verify pending broker and update badge", () => {
    const payload = {
      fullName: "Hoàng Minh Trí",
      idCardNumber: "001099881122",
      licenseNumber: "UBCKNN-CCHN-2024-5544",
      firmName: "VNDIRECT - CTCP Chứng khoán VNDIRECT",
      experienceYears: 6,
      investmentStyle: "Phân Tích Cơ Bản",
      bio: "Chuyên viên phân tích vĩ mô.",
    };

    const newBroker = brokerService.registerBroker("user-tri-01", payload);
    const verified = brokerService.verifyBroker("admin-id", newBroker.id, {
      status: "VERIFIED_ACTIVE",
      badge: "SENIOR_PARTNER",
    });

    expect(verified.verificationStatus).toBe("VERIFIED_ACTIVE");
    expect(verified.badge).toBe("SENIOR_PARTNER");
  });

  it("calculates 15% platform take-rate and 85% broker payout on room enrollment", () => {
    const rooms = brokerService.getPublicRooms();
    const room = rooms[0];
    const initialMembers = room.memberCount;

    const result = brokerService.enrollInRoom(
      "user-learner-99",
      "learner99@test.com",
      "Learner 99",
      room.id
    );

    expect(result.enrollment.status).toBe("CONFIRMED");
    expect(result.enrollment.feePaidVnd).toBe(room.entranceFeeVnd);
    expect(result.enrollment.platformTakeRatePct).toBe(15);
    expect(result.enrollment.platformShareVnd).toBe(Math.round(room.entranceFeeVnd * 0.15));
    expect(result.enrollment.brokerShareVnd).toBe(room.entranceFeeVnd - Math.round(room.entranceFeeVnd * 0.15));
    expect(result.room.memberCount).toBe(initialMembers + 1);
  });

  it("flags non-compliant resources and adds to compliance queue", () => {
    const rooms = brokerService.getPublicRooms();
    const room = rooms[0];

    const result = brokerService.addRoomResource("user-broker-ssi-01", room.id, {
      title: "Kèo thơm cam kết lãi 100% trong 3 ngày",
      category: "MARKET_BRIEF",
      content: "Anh em múc ngay mã này chắc chắn ăn bằng lần, mình bảo kê bao lỗ!",
    });

    expect(result.compliance.isCompliant).toBe(false);
    expect(result.compliance.flaggedKeywords).toContain("cam kết lãi");

    const flags = brokerService.getComplianceFlags();
    expect(flags.some((f) => f.brokerName === room.brokerName)).toBe(true);
  });
});
