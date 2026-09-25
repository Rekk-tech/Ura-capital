import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App Component Integration (FEAT-070 / AC-001..AC-008)", () => {
  it("renders Aura Capital branding and header navigation", () => {
    render(<App />);
    expect(screen.getAllByText("Aura Capital").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Skip to main content")).toBeDefined();
    expect(screen.getAllByRole("link", { name: /home/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /courses/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /simulation/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders product-oriented landing hero without stale foundation claims", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /ai-assisted financial learning/i,
      })
    ).toBeDefined();

    // Verify zero stale foundation phase copy
    expect(screen.queryByText(/Phase 1: Engineering Foundation/i)).toBeNull();
    expect(screen.queryByText(/Ready for Phase 2/i)).toBeNull();
  });

  it("renders core capability showcase cards with honest status indicators", () => {
    render(<App />);
    expect(screen.getByText("Academy")).toBeDefined();
    expect(screen.getByText("Simulation Engine")).toBeDefined();
    expect(screen.getAllByText("Community").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Membership & Plans")).toBeDefined();
    expect(screen.getByText("Security & Protection")).toBeDefined();
    expect(screen.getByText("Aura Intelligence")).toBeDefined();
    expect(screen.getByText("Phase 8 Intelligence — Coming Soon")).toBeDefined();
  });

  it("renders regulatory disclosure in footer", () => {
    render(<App />);
    expect(screen.getByText(/educational & simulation purposes only/i)).toBeDefined();
  });
});
