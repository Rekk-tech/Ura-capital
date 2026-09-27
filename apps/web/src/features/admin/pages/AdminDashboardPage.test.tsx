import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { AdminDashboardPage } from "./AdminDashboardPage";
import { adminApi, AdminApiError } from "../../../api/admin.api";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderDashboard(initialTab: "overview" | "users" | "moderation" | "audit" = "overview") {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        initialToken="admin-token"
        initialUser={{
          id: "usr-admin-1",
          email: "admin@auracapital.io",
          displayName: "Platform Admin",
          status: "ACTIVE",
          role: "ADMIN",
        }}
        initialIsLoading={false}
      >
        <MemoryRouter initialEntries={["/admin"]}>
          <AdminDashboardPage initialTab={initialTab} />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("AdminDashboardPage (FEAT-077 / AC-003, AC-008)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Accessibility & Headings (AC-008)", () => {
    it("renders exactly one H1 heading for the page", async () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
        data: {
          totalUsers: 100,
          activeUsers24h: 25,
          activeSimulationSessions: 10,
          flaggedContentCount: 1,
          pendingReviewCount: 1,
          systemHealth: "HEALTHY",
          uptimeSeconds: 3600,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T00:00:00Z",
        },
      });

      renderDashboard("overview");

      const h1Headings = screen.getAllByRole("heading", { level: 1 });
      expect(h1Headings).toHaveLength(1);
      expect(h1Headings[0]?.textContent).toBe("Admin Control Surface");
    });

    it("renders the mandatory Server Authority Disclosure notice", async () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
        data: {
          totalUsers: 50,
          activeUsers24h: 12,
          activeSimulationSessions: 5,
          flaggedContentCount: 0,
          pendingReviewCount: 0,
          systemHealth: "HEALTHY",
          uptimeSeconds: 1800,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T00:00:00Z",
        },
      });

      renderDashboard("overview");

      const notice = screen.getByTestId("server-authority-notice");
      expect(notice).toBeDefined();
      expect(notice.textContent).toContain(
        "All administrative actions and role evaluations are strictly server-authoritative and immutably audited.",
      );
    });

    it("defines an accessible tablist with ARIA attributes", () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
        data: {
          totalUsers: 1,
          activeUsers24h: 1,
          activeSimulationSessions: 0,
          flaggedContentCount: 0,
          pendingReviewCount: 0,
          systemHealth: "HEALTHY",
          uptimeSeconds: 100,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T00:00:00Z",
        },
      });

      renderDashboard("overview");

      const tablist = screen.getByRole("tablist", { name: /admin control surface views/i });
      expect(tablist).toBeDefined();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(4);
      expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
      expect(tabs[1]?.getAttribute("aria-selected")).toBe("false");
    });
  });

  describe("5 Async UI States for Operational Overview (AC-003)", () => {
    it("renders loading state with skeleton indicators while metrics query is pending", () => {
      // Mock never-resolving promise to test loading state
      vi.spyOn(adminApi, "getSystemMetrics").mockImplementation(() => new Promise(() => {}));

      renderDashboard("overview");

      const loadingSection = screen.getByTestId("admin-metrics-loading");
      expect(loadingSection).toBeDefined();
      expect(loadingSection.getAttribute("aria-busy")).toBe("true");
    });

    it("renders error state with retry button when metrics call fails", async () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockRejectedValue(
        new AdminApiError("Resource not found", 404, "NOT_FOUND"),
      );

      renderDashboard("overview");

      const errorAlert = await screen.findByTestId("admin-metrics-error");
      expect(errorAlert).toBeDefined();
      expect(screen.getByText(/unable to load operational metrics/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
    });

    it("renders success state displaying metrics cards", async () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
        data: {
          totalUsers: 1250,
          activeUsers24h: 340,
          activeSimulationSessions: 85,
          flaggedContentCount: 4,
          pendingReviewCount: 4,
          systemHealth: "HEALTHY",
          uptimeSeconds: 86400,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T00:00:00Z",
        },
      });

      renderDashboard("overview");

      expect(await screen.findByTestId("admin-metrics-grid")).toBeDefined();
      expect(screen.getByText("1250")).toBeDefined();
      expect(screen.getByText("340 active in last 24h")).toBeDefined();
      expect(screen.getByText("85")).toBeDefined();
      expect(screen.getByText("HEALTHY")).toBeDefined();
      expect(screen.getByText("Database: CONNECTED")).toBeDefined();
    });
  });

  describe("Panel Switching & Navigation Tabs (AC-003)", () => {
    it("switches to User Management panel when users tab is clicked", async () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
        data: {
          totalUsers: 10,
          activeUsers24h: 2,
          activeSimulationSessions: 1,
          flaggedContentCount: 0,
          pendingReviewCount: 0,
          systemHealth: "HEALTHY",
          uptimeSeconds: 500,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T00:00:00Z",
        },
      });
      vi.spyOn(adminApi, "listUsers").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      renderDashboard("overview");

      const usersTab = screen.getByTestId("admin-tab-users");
      fireEvent.click(usersTab);

      await waitFor(() => {
        expect(screen.getByTestId("admin-user-table-panel")).toBeDefined();
      });
      expect(usersTab.getAttribute("aria-selected")).toBe("true");
    });

    it("switches to Content Moderation panel when moderation tab is clicked", async () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
        data: {
          totalUsers: 10,
          activeUsers24h: 2,
          activeSimulationSessions: 1,
          flaggedContentCount: 0,
          pendingReviewCount: 0,
          systemHealth: "HEALTHY",
          uptimeSeconds: 500,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T00:00:00Z",
        },
      });
      vi.spyOn(adminApi, "listModerationQueue").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      renderDashboard("overview");

      const modTab = screen.getByTestId("admin-tab-moderation");
      fireEvent.click(modTab);

      await waitFor(() => {
        expect(screen.getByTestId("admin-moderation-queue-panel")).toBeDefined();
      });
      expect(modTab.getAttribute("aria-selected")).toBe("true");
    });

    it("switches to Security & Audit Logs panel when audit tab is clicked", async () => {
      vi.spyOn(adminApi, "getSystemMetrics").mockResolvedValue({
        data: {
          totalUsers: 10,
          activeUsers24h: 2,
          activeSimulationSessions: 1,
          flaggedContentCount: 0,
          pendingReviewCount: 0,
          systemHealth: "HEALTHY",
          uptimeSeconds: 500,
          databaseStatus: "CONNECTED",
          lastAuditTimestamp: "2026-09-27T00:00:00Z",
        },
      });
      vi.spyOn(adminApi, "listAuditRecords").mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 0,
      });

      renderDashboard("overview");

      const auditTab = screen.getByTestId("admin-tab-audit");
      fireEvent.click(auditTab);

      await waitFor(() => {
        expect(screen.getByTestId("admin-audit-log-panel")).toBeDefined();
      });
      expect(auditTab.getAttribute("aria-selected")).toBe("true");
    });
  });
});
