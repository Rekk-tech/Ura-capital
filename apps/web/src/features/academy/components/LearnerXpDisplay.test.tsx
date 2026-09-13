import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearnerXpDisplay } from "./LearnerXpDisplay";


describe("LearnerXpDisplay Component (FEAT-027)", () => {
  it("renders learner total XP correctly", () => {
    render(<LearnerXpDisplay totalXp={60} />);

    const display = screen.getByTestId("learner-xp-display");
    expect(display).toBeDefined();
    expect(screen.getByTestId("learner-xp-value").textContent).toContain("60 XP");
  });

  it("renders 0 XP when totalXp is not provided", () => {
    render(<LearnerXpDisplay />);

    expect(screen.getByTestId("learner-xp-value").textContent).toContain("0 XP");
  });

  it("renders loading state when loading is true", () => {
    render(<LearnerXpDisplay loading={true} />);

    expect(screen.getByTestId("learner-xp-loading")).toBeDefined();
    expect(screen.getByText("Loading XP...")).toBeDefined();
  });


  it("is strictly read-only with no submission inputs or level calculation", () => {
    const { container } = render(<LearnerXpDisplay totalXp={100} />);

    // Must not contain any form inputs, buttons, or editable elements
    expect(container.querySelectorAll("input").length).toBe(0);
    expect(container.querySelectorAll("button").length).toBe(0);
    expect(container.querySelectorAll("select").length).toBe(0);

    // Must not contain any level calculation or level text
    expect(container.textContent).not.toContain("Level");
    expect(container.textContent).not.toContain("LVL");
  });
});
