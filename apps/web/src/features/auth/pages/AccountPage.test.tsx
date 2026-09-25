import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { AccountPage } from "./AccountPage";
import { authApi, AuthUser } from "../../../api/auth.api";

describe("AccountPage & ProtectedRoute (FEAT-071: AC-001, AC-005, AC-007)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const renderAccountPage = ({
    initialToken = null as string | null,
    initialUser = null as AuthUser | null,
    initialPath = "/account",
  }: {
    initialToken?: string | null;
    initialUser?: AuthUser | null;
    initialPath?: string;
  } = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialToken={initialToken} initialUser={initialUser} initialIsLoading={false}>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/account" element={<AccountPage />} />
              <Route path="/login" element={<div>Login Page Target</div>} />
              <Route path="/" element={<div>Home Target Page</div>} />
              <Route path="/academy" element={<div>Academy Target Page</div>} />
              <Route path="/simulation" element={<div>Simulation Target Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  describe("AC-001: Deterministic Auth-Required State", () => {
    it("renders unauthenticated guard with 'Please Sign In' when unauthenticated", () => {
      renderAccountPage({ initialToken: null, initialUser: null });

      expect(screen.getByRole("heading", { name: /please sign in/i })).toBeDefined();
      expect(screen.getByText("Authentication Required")).toBeDefined();
      expect(
        screen.getByText(/you must be signed in to access this section of aura capital\./i)
      ).toBeDefined();

      const signInLink = screen.getByRole("link", { name: /sign in to continue/i });
      expect(signInLink.getAttribute("href")).toBe("/login?returnTo=%2Faccount");

      const homeLink = screen.getByRole("link", { name: /return to home/i });
      expect(homeLink.getAttribute("href")).toBe("/");
    });
  });

  describe("AC-007: Server-Derived Read-Only Account Identity", () => {
    const mockUser: AuthUser = {
      id: "usr-prod-456",
      email: "trader.alex@auracapital.io",
      displayName: "Alex Trader",
      status: "ACTIVE",
      createdAt: "2026-01-15T10:00:00.000Z",
    };

    it("renders server-derived profile and identity details for authenticated user", () => {
      renderAccountPage({
        initialToken: "valid-memory-token",
        initialUser: mockUser,
      });

      // Name and status in header
      expect(screen.getByRole("heading", { name: "Alex Trader" })).toBeDefined();
      expect(screen.getAllByText("ACTIVE").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("trader.alex@auracapital.io").length).toBeGreaterThanOrEqual(1);

      // Identity Details card
      expect(screen.getByRole("heading", { name: /identity details/i })).toBeDefined();
      expect(screen.getByText("usr-prod-456")).toBeDefined();
      expect(screen.getByText("January 15, 2026")).toBeDefined();
    });

    it("displays explicit Server Authority Notice (no client role authority)", () => {
      renderAccountPage({
        initialToken: "valid-memory-token",
        initialUser: mockUser,
      });

      expect(screen.getByText(/server authority notice:/i)).toBeDefined();
      expect(
        screen.getByText(
          /account permissions and entitlement tiers are evaluated exclusively by server-side verification\. client ui displays do not confer authority\./i
        )
      ).toBeDefined();
    });

    it("displays Session Security architecture with ADR-004 disclosures (AC-005, AC-007)", () => {
      renderAccountPage({
        initialToken: "valid-memory-token",
        initialUser: mockUser,
      });

      expect(screen.getByRole("heading", { name: /session security/i })).toBeDefined();
      expect(screen.getByText(/in-memory token lifecycle/i)).toBeDefined();
      expect(screen.getByText(/zero token persistence/i)).toBeDefined();
      expect(screen.getByText(/adr-004 compliant/i)).toBeDefined();
      expect(screen.getByText(/http-only refresh cookies/i)).toBeDefined();
    });

    it("provides quick navigation shortcuts to Academy and Simulation", () => {
      renderAccountPage({
        initialToken: "valid-memory-token",
        initialUser: mockUser,
      });

      const academyLink = screen.getByRole("link", { name: /academy courses/i });
      expect(academyLink.getAttribute("href")).toBe("/academy");

      const simLink = screen.getByRole("link", { name: /simulation desk/i });
      expect(simLink.getAttribute("href")).toBe("/simulation");
    });

    it("performs logout, invokes authApi.logout, clears session, and redirects to / (AC-007)", async () => {
      const logoutSpy = vi.spyOn(authApi, "logout").mockResolvedValue({ success: true });

      renderAccountPage({
        initialToken: "valid-memory-token",
        initialUser: mockUser,
      });

      const signOutBtn = screen.getByRole("button", { name: /sign out of your account/i });
      fireEvent.click(signOutBtn);

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Home Target Page")).toBeDefined();
      });

      // Storage remains clean
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(sessionStorage.getItem("accessToken")).toBeNull();
    });
  });
});
