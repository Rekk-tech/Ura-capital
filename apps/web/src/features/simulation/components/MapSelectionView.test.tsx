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
});
