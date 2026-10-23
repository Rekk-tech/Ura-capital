import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { MapSelectionView } from "./MapSelectionView";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("MapSelectionView", () => {
  it("renders Map 1 and Map 2 cards with required specs and navigation buttons", () => {
    render(
      <BrowserRouter>
        <MapSelectionView
          onEnterCockpit={vi.fn()}
          hasActiveSession={false}
        />
      </BrowserRouter>
    );

    // Header and Arena labels
    expect(screen.getByText("SIMULATION ARENA")).toBeDefined();

    // Map 1 Card verification
    expect(screen.getByText("MAP 1 — FOMO ARENA")).toBeDefined();
    expect(screen.getByText("10.000.000 VND virtual cash")).toBeDefined();
    expect(screen.getByText("Real-time · 7 rounds × 45s")).toBeDefined();

    const fomoBtn = screen.getByTestId("enter-fomo-arena-button");
    expect(fomoBtn).toBeDefined();
    expect(fomoBtn.textContent).toContain("Start Map 1 (FOMO Arena)");
    fireEvent.click(fomoBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/simulation/map-1");

    // Map 2 Card verification
    expect(screen.getByText("MAP 2 — PRO ROOM")).toBeDefined();
    expect(screen.getByText("Locked until Map 1 is survived")).toBeDefined();
    expect(screen.getByText("100.000.000 VND virtual cash")).toBeDefined();
    expect(screen.getByText("Turn-based · 12 quarters")).toBeDefined();
    expect(screen.getByText("Graham & Buffett AI Advisor")).toBeDefined();

    const proBtn = screen.getByTestId("enter-pro-room-button");
    expect(proBtn).toBeDefined();
    expect(proBtn.textContent).toContain("Start Map 2 (Pro Room)");
    fireEvent.click(proBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/simulation/map-2");
  });

  it("displays upgrade modal when Standard account reaches monthly quota (3 runs)", async () => {
    // Mock canPlayMap2 returning exhausted quota
    const { gamificationService } = await import("../services/gamification.service");
    vi.spyOn(gamificationService, "canPlayMap2").mockReturnValue({
      allowed: false,
      runsUsed: 3,
      limit: 3,
      remaining: 0,
    });

    render(
      <BrowserRouter>
        <MapSelectionView
          onEnterCockpit={vi.fn()}
          hasActiveSession={false}
          isPremium={false}
        />
      </BrowserRouter>
    );

    const proBtn = screen.getByTestId("enter-pro-room-button");
    fireEvent.click(proBtn);

    // Assert upgrade modal is shown
    expect(screen.getByTestId("map2-upgrade-modal")).toBeDefined();
    expect(screen.getByText("Nâng Cấp Để Mở Khóa Map 2")).toBeDefined();
    expect(screen.getByText(/3 lượt trải nghiệm Map 2/i)).toBeDefined();

    // Clicking upgrade navigates to /subscription
    const upgradeCta = screen.getByRole("button", { name: /Nâng Cấp Lên Premium VIP/i });
    fireEvent.click(upgradeCta);
    expect(mockNavigate).toHaveBeenCalledWith("/subscription");
  });
});
