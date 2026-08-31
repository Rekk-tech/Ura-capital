import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../../src/app/App.js";

describe("Web Application Shell (Smoke Test)", () => {
  it("renders the root application shell without throwing runtime errors", () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Aura Capital");

    const statusPill = screen.getByText(/Foundation: Healthy/i);
    expect(statusPill).toBeDefined();
  });
});
