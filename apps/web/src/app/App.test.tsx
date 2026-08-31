import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App Shell (Unit/Component)", () => {
  it("renders Aura Capital header and title", () => {
    render(<App />);
    expect(screen.getByText("Aura Capital")).toBeDefined();
    expect(screen.getByText(/Phase 1: Engineering Foundation/i)).toBeDefined();
  });

  it("renders domain foundation cards", () => {
    render(<App />);
    expect(screen.getByText("Identity & Security")).toBeDefined();
    expect(screen.getByText("Academy")).toBeDefined();
    expect(screen.getByText("Simulation Engine")).toBeDefined();
    expect(screen.getByText("Community")).toBeDefined();
    expect(screen.getByText("Aura Intelligence")).toBeDefined();
    expect(screen.getByText("Observability & Health")).toBeDefined();
  });
});
