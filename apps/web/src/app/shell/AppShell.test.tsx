import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../features/auth/context/AuthContext";
import { AuthUser } from "../../api/auth.api";
import { AppShell } from "./AppShell";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderShell(
  initialPath = "/",
  initialToken: string | null = null,
  initialUser: AuthUser | null = null
) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialToken={initialToken} initialUser={initialUser} initialIsLoading={false}>
        <MemoryRouter initialEntries={[initialPath]}>
          <AppShell />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe("AppShell & Route Governance (FEAT-070 / AC-001..AC-008)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe("AC-003: Navigation & Accessibility", () => {
    it("renders the skip-to-content accessibility link targeting #main-content", () => {
      renderShell("/");
      const skipLink = screen.getByText("Skip to main content");
      expect(skipLink).toBeDefined();
      expect(skipLink.getAttribute("href")).toBe("#main-content");
    });

    it("renders Aura Capital branding and primary desktop navigation links", () => {
      renderShell("/");
      expect(screen.getAllByText("Aura Capital").length).toBeGreaterThanOrEqual(1);

      // Primary links in header
      const homeLinks = screen.getAllByRole("link", { name: /home/i });
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);

      const coursesLinks = screen.getAllByRole("link", { name: /courses/i });
      expect(coursesLinks.length).toBeGreaterThanOrEqual(1);

      const simLinks = screen.getAllByRole("link", { name: /simulation/i });
      expect(simLinks.length).toBeGreaterThanOrEqual(1);

      const communityLinks = screen.getAllByRole("link", { name: /community/i });
      expect(communityLinks.length).toBeGreaterThanOrEqual(1);

      const subLinks = screen.getAllByRole("link", { name: /subscription/i });
      expect(subLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("marks the active route with aria-current='page' and nav-link-active class", () => {
      renderShell("/");
      const homeLink = screen.getByRole("link", { name: /^home$/i });
      expect(homeLink.getAttribute("aria-current")).toBe("page");
      expect(homeLink.className).toContain("nav-link-active");
    });

    it("opens and closes mobile menu drawer via toggle button and keyboard Escape", () => {
      renderShell("/");
      const menuButton = screen.getByRole("button", { name: /open navigation menu/i });
      expect(menuButton.getAttribute("aria-expanded")).toBe("false");

      // Open drawer
      fireEvent.click(menuButton);
      expect(menuButton.getAttribute("aria-expanded")).toBe("true");

      // Close drawer with Escape
      fireEvent.keyDown(window, { key: "Escape" });
      expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    });

    it("closes mobile menu when clicking outside backdrop", () => {
      renderShell("/");
      const menuButton = screen.getByRole("button", { name: /open navigation menu/i });

      // Open
      fireEvent.click(menuButton);
      expect(menuButton.getAttribute("aria-expanded")).toBe("true");

      // Click backdrop
      const backdrop = document.querySelector(".mobile-drawer-backdrop");
      expect(backdrop).toBeDefined();
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(menuButton.getAttribute("aria-expanded")).toBe("false");
      }
    });
  });

  describe("AC-002: Product-Oriented Presentation (No Stale Copy)", () => {
    it("renders product-oriented landing page without foundation-era claims", () => {
      renderShell("/");
      expect(
        screen.getByRole("heading", {
          name: /ai-assisted financial learning/i,
        })
      ).toBeDefined();

      // Ensure NO stale foundation phase text is displayed
      expect(screen.queryByText(/Phase 1: Engineering Foundation/i)).toBeNull();
      expect(screen.queryByText(/Ready for Phase 2/i)).toBeNull();
      expect(screen.queryByText(/Phase 7 Complete/i)).toBeNull();
    });

    it("displays honest availability badges for planned and deferred features", () => {
      renderShell("/");
      // Aura Intelligence should explicitly indicate deferred / coming soon
      expect(screen.getByText("Phase 8 Intelligence — Coming Soon")).toBeDefined();
    });
  });

  describe("AC-004: Error and 404 Boundaries", () => {
    it("renders 404 page for unknown routes with navigation exits", () => {
      renderShell("/unknown-path-that-does-not-exist");
      expect(screen.getByRole("heading", { name: /page not found/i })).toBeDefined();
      expect(screen.getByText("Status 404")).toBeDefined();
      expect(screen.getByRole("link", { name: /return to home/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /browse academy/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /open simulation/i })).toBeDefined();
    });

    it("renders planned route placeholder for /dashboard without claiming ready", () => {
      renderShell("/dashboard");
      expect(screen.getByRole("heading", { name: /learner dashboard/i })).toBeDefined();
      expect(screen.getByText("Planned for MVP Release")).toBeDefined();
      expect(screen.getByText("FEAT-072")).toBeDefined();
      expect(screen.getByRole("link", { name: /return to home/i })).toBeDefined();
    });

    it("renders deferred route placeholder for /ai without claiming ready", () => {
      renderShell("/ai");
      expect(
        screen.getByRole("heading", { name: /aura intelligence/i })
      ).toBeDefined();
      expect(screen.getByText("Deferred for AI Enhancement")).toBeDefined();
      expect(screen.getByText("FEAT-078")).toBeDefined();
    });

    it("catches render errors in RouteErrorBoundary without exposing stack traces or secrets", () => {
      // Prevent console.error noise during intentional error test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const CrashingComponent: React.FC = () => {
        throw new Error("SECRET_DATABASE_PASSWORD_LEAK: unexpected crash");
      };

      render(
        <MemoryRouter>
          <RouteErrorBoundary>
            <CrashingComponent />
          </RouteErrorBoundary>
        </MemoryRouter>
      );

      // Verify safe fallback rendered
      expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeDefined();
      expect(screen.getByText(/an unexpected error occurred while loading this view/i)).toBeDefined();

      // Verify reference ID is displayed
      expect(screen.getByText(/Reference ID:/i)).toBeDefined();

      // CRITICAL: Ensure sensitive message or stack traces are NEVER displayed to user
      expect(screen.queryByText(/SECRET_DATABASE_PASSWORD_LEAK/i)).toBeNull();
      expect(screen.queryByText(/at CrashingComponent/i)).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe("AC-006: Token Security & Storage Compliance", () => {
    it("never stores tokens in localStorage or sessionStorage during shell navigation", () => {
      renderShell("/");
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(sessionStorage.getItem("accessToken")).toBeNull();
      expect(sessionStorage.getItem("token")).toBeNull();
      expect(document.cookie).not.toContain("accessToken=");
    });
  });

  describe("AC-005 & AC-007: Non-Authoritative Client Navigation & Footer Disclosures", () => {
    it("renders educational and regulatory simulation disclosures in footer", () => {
      renderShell("/");
      expect(
        screen.getByText(/educational & simulation purposes only/i)
      ).toBeDefined();
      expect(
        screen.getByText(/no real capital is at risk/i)
      ).toBeDefined();
    });
  });

  describe("FEAT-071 Route Resolution (AC-001)", () => {
    it("renders canonical LoginPage at /login within shell", () => {
      renderShell("/login");
      expect(screen.getByRole("heading", { name: /sign in to aura capital/i })).toBeDefined();
      expect(screen.getByRole("link", { name: /create an account/i })).toBeDefined();
    });

    it("renders canonical RegisterPage at /register within shell", () => {
      renderShell("/register");
      expect(screen.getByRole("heading", { name: /create your account/i })).toBeDefined();
      expect(screen.getByText(/minimum 12 characters \(feat-003 policy\)/i)).toBeDefined();
    });

    it("renders deterministic auth-required guard at /account when unauthenticated", () => {
      renderShell("/account", null, null);
      expect(screen.getByRole("heading", { name: /please sign in/i })).toBeDefined();
      expect(screen.getByText("Authentication Required")).toBeDefined();
    });

    it("renders server-derived AccountPage at /account when authenticated", () => {
      renderShell("/account", "mock-token", {
        id: "usr-shell-123",
        email: "trader@auracapital.io",
        displayName: "Shell Trader",
        status: "ACTIVE",
      });
      expect(screen.getByRole("heading", { name: "Shell Trader" })).toBeDefined();
      expect(screen.getByText("usr-shell-123")).toBeDefined();
      expect(screen.getByText(/server authority notice:/i)).toBeDefined();
    });
  });
});
