import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActiveSessionsList } from "./ActiveSessionsList";
import { UserSession } from "../../../api/profile.api";

describe("ActiveSessionsList (FEAT-078)", () => {
  const mockSessions: UserSession[] = [
    {
      id: "sess-1",
      device: "Desktop Workstation",
      browser: "Chrome",
      ipAddress: "192.168.1.10",
      lastActive: "2026-03-01T12:00:00Z",
      isCurrent: true,
      createdAt: "2026-03-01T10:00:00Z",
    },
    {
      id: "sess-2",
      device: "Mobile Device",
      browser: "Safari",
      ipAddress: "10.0.0.5",
      lastActive: "2026-02-28T18:30:00Z",
      isCurrent: false,
      createdAt: "2026-02-20T10:00:00Z",
    },
  ];

  it("renders active sessions list with browser, device, IP, and status", () => {
    render(<ActiveSessionsList sessions={mockSessions} />);

    expect(screen.getByText(/chrome on desktop workstation/i)).toBeDefined();
    expect(screen.getByText(/safari on mobile device/i)).toBeDefined();
    expect(screen.getByText(/ip: 192.168.1.10/i)).toBeDefined();
    expect(screen.getByText(/ip: 10.0.0.5/i)).toBeDefined();
  });

  it("identifies current active device with 'This Device' badge", () => {
    render(<ActiveSessionsList sessions={mockSessions} />);

    expect(screen.getByText("This Device")).toBeDefined();
  });

  it("renders empty state card when sessions list is empty", () => {
    render(<ActiveSessionsList sessions={[]} />);

    expect(screen.getByRole("heading", { name: /no active remote sessions/i })).toBeDefined();
    expect(screen.getByText(/no secondary login sessions detected/i)).toBeDefined();
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const onRefresh = vi.fn();
    render(<ActiveSessionsList sessions={mockSessions} onRefresh={onRefresh} />);

    const refreshBtn = screen.getByRole("button", { name: /refresh active sessions/i });
    fireEvent.click(refreshBtn);

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
