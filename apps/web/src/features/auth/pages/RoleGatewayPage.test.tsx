import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RoleGatewayPage } from "./RoleGatewayPage";
import { AuthContext, AuthContextType } from "../context/AuthContext";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RoleGatewayPage (FEAT-088 / FR-007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRoleGateway = (authContextOverrides: Partial<AuthContextType> = {}, initialPath = "/auth/role-gateway") => {
    const defaultAuth: AuthContextType = {
      user: {
        id: "usr-learner",
        email: "learner@aura.internal",
        displayName: "Học Viên F0 Minh Khuê",
        role: "LEARNER",
        status: "ACTIVE",
      },
      accessToken: "mock-token",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
      setAuthSession: vi.fn(),
      ...authContextOverrides,
    };

    return render(
      <AuthContext.Provider value={defaultAuth}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/auth/role-gateway" element={<RoleGatewayPage />} />
            <Route path="/login" element={<div>Login Page Target</div>} />
            <Route path="/dashboard" element={<div>Dashboard Page Target</div>} />
            <Route path="/broker-hub" element={<div>Broker Hub Target</div>} />
            <Route path="/admin" element={<div>Admin Console Target</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it("redirects to /login if user is unauthenticated", () => {
    renderRoleGateway({
      isAuthenticated: false,
      user: null,
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login?returnTo=/auth/role-gateway", { replace: true });
  });

  it("renders user identity, canonical role badge, and SoD scope summary for LEARNER", () => {
    renderRoleGateway();

    expect(screen.getByRole("heading", { name: /chào mừng trở lại, học viên f0 minh khuê/i })).toBeDefined();
    expect(screen.getByText("learner@aura.internal")).toBeDefined();
    expect(screen.getAllByText("LEARNER").length).toBeGreaterThanOrEqual(1);

    // Granted and restricted scope items
    expect(screen.getByText(/quyền hạn được phép \(granted scope\)/i)).toBeDefined();
    expect(screen.getByText(/thực chiến thi đấu tại map 1 & map 2/i)).toBeDefined();
    expect(screen.getByText(/không được can thiệp hệ thống quản trị admin/i)).toBeDefined();
  });

  it("enforces Segregation of Duties: disables admin and broker workspaces for LEARNER", () => {
    renderRoleGateway();

    const learnerCard = screen.getByTestId("ws-card-learner");
    const brokerCard = screen.getByTestId("ws-card-broker");
    const adminCard = screen.getByTestId("ws-card-admin");

    expect(learnerCard.getAttribute("disabled")).toBeNull();
    expect(brokerCard.getAttribute("disabled")).not.toBeNull();
    expect(adminCard.getAttribute("disabled")).not.toBeNull();
  });

  it("navigates to dashboard when Learner confirms their workspace", () => {
    renderRoleGateway();

    const confirmBtn = screen.getByRole("button", { name: /vào không gian học viên f0/i });
    fireEvent.click(confirmBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("enables all workspaces and defaults to admin for SYSTEM_ADMIN", () => {
    renderRoleGateway({
      user: {
        id: "usr-admin",
        email: "admin@aura.internal",
        displayName: "Quản Trị Tối Cao",
        role: "SYSTEM_ADMIN",
        status: "ACTIVE",
      },
    });

    const adminCard = screen.getByTestId("ws-card-admin");
    expect(adminCard.getAttribute("aria-pressed")).toBe("true");

    const brokerCard = screen.getByTestId("ws-card-broker");
    expect(brokerCard.getAttribute("disabled")).toBeNull();

    // Admin can switch to broker workspace
    fireEvent.click(brokerCard);
    expect(brokerCard.getAttribute("aria-pressed")).toBe("true");

    const confirmBtn = screen.getByRole("button", { name: /vào phòng độc quyền của broker/i });
    fireEvent.click(confirmBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/broker-hub");
  });

  it("calls logout and redirects to /login when clicking 'Đổi Tài Khoản'", async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    renderRoleGateway({
      logout: logoutMock,
    });

    const logoutBtn = screen.getByRole("button", { name: /đổi tài khoản/i });
    fireEvent.click(logoutBtn);

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
