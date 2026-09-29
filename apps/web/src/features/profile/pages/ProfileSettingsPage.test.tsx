import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfileSettingsPage } from "./ProfileSettingsPage";
import { AuthProvider } from "../../auth/context/AuthContext";
import { AuthUser } from "../../../api/auth.api";
import { profileApi, UserProfile, UserSession } from "../../../api/profile.api";

describe("ProfileSettingsPage (FEAT-078)", () => {
  let queryClient: QueryClient;

  const mockUser: AuthUser = {
    id: "usr-page-789",
    email: "trader.page@aura.internal",
    displayName: "Page Trader",
    status: "ACTIVE",
    role: "USER",
    createdAt: "2026-01-01T00:00:00Z",
  };

  const mockProfile: UserProfile = {
    id: "usr-page-789",
    email: "trader.page@aura.internal",
    displayName: "Page Trader",
    status: "ACTIVE",
    roles: ["USER"],
    createdAt: "2026-01-01T00:00:00Z",
  };

  const mockSessions: UserSession[] = [
    {
      id: "sess-page-1",
      device: "Desktop Workstation",
      browser: "Chrome",
      ipAddress: "127.0.0.1",
      lastActive: "2026-03-01T12:00:00Z",
      isCurrent: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.restoreAllMocks();
  });

  const renderPage = (
    initialToken: string | null = "mock-token",
    initialUser: AuthUser | null = mockUser,
    isLoading = false
  ) => {
    return render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider initialToken={initialToken} initialUser={initialUser} initialIsLoading={isLoading}>
            <ProfileSettingsPage />
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  it("State 1: renders loading skeleton when authentication or profile is loading", () => {
    renderPage(null, null, true);

    const main = document.querySelector("#main-content");
    expect(main).toBeDefined();
    expect(document.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("State 2: renders Auth-Required card when unauthenticated", () => {
    renderPage(null, null, false);

    expect(screen.getByRole("heading", { name: /authentication required/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /sign in to continue/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /create account/i })).toBeDefined();
  });

  it("State 3: renders Error state with Retry button on API failure", async () => {
    vi.spyOn(profileApi, "getProfile").mockRejectedValue(new Error("Database connection lost"));

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider initialToken="mock-token" initialUser={null} initialIsLoading={false}>
            <ProfileSettingsPage />
          </AuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: /unable to load profile/i })).toBeDefined();
    expect(screen.getByText(/database connection lost/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /retry connection/i })).toBeDefined();
  });

  it("State 4 & 5: renders Success state with single H1, tabs, and tab panels", async () => {
    vi.spyOn(profileApi, "getProfile").mockResolvedValue(mockProfile);
    vi.spyOn(profileApi, "listSessions").mockResolvedValue(mockSessions);

    renderPage();

    // Accessibility Invariant: exactly one H1 per page
    const headingsH1 = await screen.findAllByRole("heading", { level: 1 });
    expect(headingsH1.length).toBe(1);
    expect(headingsH1[0]?.textContent).toBe("User Profile & Settings");

    // Accessible Tabs
    const tabProfile = screen.getByRole("tab", { name: /profile information/i });
    const tabSecurity = screen.getByRole("tab", { name: /security & password/i });
    const tabSessions = screen.getByRole("tab", { name: /active sessions/i });

    expect(tabProfile).toBeDefined();
    expect(tabSecurity).toBeDefined();
    expect(tabSessions).toBeDefined();
    expect(tabProfile.getAttribute("aria-selected")).toBe("true");

    // Default Profile Panel is visible
    expect(screen.getByLabelText(/account id/i)).toBeDefined();

    // Switch to Security Tab
    fireEvent.click(tabSecurity);
    expect(tabSecurity.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByLabelText(/^current password$/i)).toBeDefined();

    // Switch to Sessions Tab
    fireEvent.click(tabSessions);
    expect(tabSessions.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(/chrome on desktop workstation/i)).toBeDefined();
  });
});
