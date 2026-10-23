import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { BrokerHubPage } from "./BrokerHubPage";
import { brokerApi } from "../../../api/broker.api";
import { BrokerProfileDto, BrokerRoomDto } from "@aura/shared";

vi.mock("../../../api/broker.api", () => ({
  brokerApi: {
    getPublicBrokers: vi.fn(),
    getPublicRooms: vi.fn(),
    registerBroker: vi.fn(),
    enrollInRoom: vi.fn(),
  },
}));

const mockBrokers: BrokerProfileDto[] = [
  {
    id: "broker-ssi-01",
    userId: "user-broker-ssi-01",
    fullName: "Nguyễn Hoàng Nam",
    idCardNumberMasked: "079***8821",
    licenseNumber: "UBCKNN-CCHN-2019-4820",
    firmName: "SSI - CTCP Chứng khoán SSI",
    experienceYears: 8,
    investmentStyle: "Tăng Trưởng (CANSLIM & Cơ Bản)",
    bio: "8 năm trưởng nhóm phân tích thị trường tại SSI.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    verificationStatus: "VERIFIED_ACTIVE",
    badge: "SENIOR_PARTNER",
    saasTier: "PRO",
    totalEarningsVnd: 42500000,
    verifiedRating: 4.9,
    reviewCount: 38,
    createdAt: "2026-01-15T08:00:00.000Z",
    updatedAt: "2026-10-20T08:00:00.000Z",
  },
];

const mockRooms: BrokerRoomDto[] = [
  {
    id: "room-ssi-alpha",
    brokerId: "broker-ssi-01",
    brokerName: "Nguyễn Hoàng Nam",
    brokerFirm: "SSI - CTCP Chứng khoán SSI",
    brokerBadge: "SENIOR_PARTNER",
    title: "Alpha Growth Club — Chiến Lược Vượt Đỉnh",
    slug: "alpha-growth-club",
    description: "Phòng sinh hoạt chiến lược dành cho nhà đầu tư theo trường phái tăng trưởng.",
    coverImageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    entranceFeeVnd: 500000,
    investmentStyle: "Tăng Trưởng (CANSLIM & Cơ Bản)",
    status: "ACTIVE",
    memberCount: 142,
    simulationScenarioKey: "MAP1_FOMO",
    createdAt: "2026-02-01T08:00:00.000Z",
  },
];

describe("BrokerHubPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(brokerApi.getPublicBrokers).mockResolvedValue(mockBrokers);
    vi.mocked(brokerApi.getPublicRooms).mockResolvedValue(mockRooms);
  });

  it("renders hero banner with title, verified badge, and CTAs", async () => {
    render(
      <MemoryRouter>
        <BrokerHubPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Aura Broker Hub/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Phòng Đầu Tư Xác Thực/i)).toBeInTheDocument();
    expect(screen.getByTestId("register-broker-btn")).toBeInTheDocument();
  });

  it("displays room cards and handles switching to broker passport tab", async () => {
    render(
      <MemoryRouter>
        <BrokerHubPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Alpha Growth Club — Chiến Lược Vượt Đỉnh")).toBeInTheDocument();
    });

    expect(screen.getByText("500.000 ₫")).toBeInTheDocument();

    // Switch to Brokers tab
    const brokersTab = screen.getByRole("button", { name: /Hồ Sơ Tín Nhiệm Chuyên Gia/i });
    fireEvent.click(brokersTab);

    expect(screen.getByText("Nguyễn Hoàng Nam")).toBeInTheDocument();
    expect(screen.getByText("UBCKNN-CCHN-2019-4820")).toBeInTheDocument();
  });

  it("opens eKYC partner registration modal when CTA is clicked", async () => {
    render(
      <MemoryRouter>
        <BrokerHubPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Aura Broker Hub/i)).toBeInTheDocument();
    });

    const registerBtn = screen.getByTestId("register-broker-btn");
    fireEvent.click(registerBtn);

    expect(screen.getByTestId("broker-register-modal")).toBeInTheDocument();
    expect(screen.getByText(/Đăng Ký Đối Tác Chuyên Gia/i)).toBeInTheDocument();
    expect(screen.getByText(/Số hiệu CCHN do UBCKNN cấp/i)).toBeInTheDocument();
  });
});
