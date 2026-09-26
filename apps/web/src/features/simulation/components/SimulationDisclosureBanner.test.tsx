import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SimulationDisclosureBanner } from "./SimulationDisclosureBanner";

describe("SimulationDisclosureBanner (FEAT-074: AC-004)", () => {
  it("renders mandatory virtual capital warning and required badges", () => {
    render(<SimulationDisclosureBanner />);

    expect(screen.getByTestId("simulation-disclosure-banner")).toBeInTheDocument();

    // Check mandatory disclosure text
    const notice = screen.getByTestId("mandatory-virtual-capital-notice");
    expect(notice).toHaveTextContent("Simulated execution only • Virtual funds • No real capital at risk");

    // Check badges
    expect(screen.getByText("SIMULATION ONLY")).toBeInTheDocument();
    expect(screen.getByText("NO REAL MONEY")).toBeInTheDocument();
    expect(screen.getByText("NO BROKERAGE EXECUTION")).toBeInTheDocument();
  });
});
