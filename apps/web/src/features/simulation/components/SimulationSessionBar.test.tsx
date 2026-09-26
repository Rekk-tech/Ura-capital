import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SimulationSessionBar } from "./SimulationSessionBar";
import { SimulationSessionDto } from "../types/simulation-ui.types";

const mockSession: SimulationSessionDto = {
  id: "session-12345678-abcd-ef01-2345-6789abcdef01",
  userId: "user-1",
  scenarioId: "scen-1",
  status: "ACTIVE",
  startingCash: "100000.0000",
  currentCycle: 2,
  startedAt: "2026-09-26T00:00:00Z",
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-09-26T00:00:00Z",
  updatedAt: "2026-09-26T00:00:00Z",
  scenario: {
    name: "Tech Growth Cycle",
    key: "MVP_TECH_GROWTH",
  },
};

describe("SimulationSessionBar (FEAT-074: AC-001, AC-006)", () => {
  it("renders scenario name, cycle, starting cash, and status badge", () => {
    render(<SimulationSessionBar session={mockSession} />);

    expect(screen.getByText("Tech Growth Cycle")).toBeInTheDocument();
    expect(screen.getByTestId("session-cycle-value")).toHaveTextContent("Cycle 2");
    expect(screen.getByTestId("session-starting-cash")).toHaveTextContent("$100000.0000");
    expect(screen.getByTestId("session-status-badge")).toHaveTextContent("ACTIVE");
  });

  it("renders PENDING status badge properly", () => {
    const pendingSession: SimulationSessionDto = {
      ...mockSession,
      status: "PENDING",
    };
    render(<SimulationSessionBar session={pendingSession} />);
    expect(screen.getByTestId("session-status-badge")).toHaveTextContent("PENDING");
  });

  it("renders CREATED status badge properly", () => {
    const createdSession: SimulationSessionDto = {
      ...mockSession,
      status: "CREATED",
    };
    render(<SimulationSessionBar session={createdSession} />);
    expect(screen.getByTestId("session-status-badge")).toHaveTextContent("READY TO START");
  });

  it("triggers onStartSession when in CREATED or PENDING state", () => {
    const onStart = vi.fn();
    const createdSession: SimulationSessionDto = {
      ...mockSession,
      status: "CREATED",
    };
    render(<SimulationSessionBar session={createdSession} onStartSession={onStart} />);

    const startBtn = screen.getByTestId("start-session-button");
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("triggers onCompleteSession and onCancelSession and onResetSession", () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    const onReset = vi.fn();

    render(
      <SimulationSessionBar
        session={mockSession}
        onCompleteSession={onComplete}
        onCancelSession={onCancel}
        onResetSession={onReset}
      />,
    );

    const completeBtn = screen.getByTestId("complete-session-button");
    fireEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByTestId("cancel-session-button");
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);

    const resetBtn = screen.getByTestId("reset-session-button");
    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("triggers onSelectSession when session dropdown changes", () => {
    const onSelect = vi.fn();
    const session2: SimulationSessionDto = {
      ...mockSession,
      id: "session-99999999-0000-0000-0000-000000000000",
      currentCycle: 3,
    };

    render(
      <SimulationSessionBar
        session={mockSession}
        sessions={[mockSession, session2]}
        onSelectSession={onSelect}
      />,
    );

    const select = screen.getByLabelText("Switch Simulation Session");
    fireEvent.change(select, { target: { value: session2.id } });
    expect(onSelect).toHaveBeenCalledWith(session2.id);
  });
});
