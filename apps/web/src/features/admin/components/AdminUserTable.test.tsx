import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { AdminUserTable } from "./AdminUserTable";
import { adminApi, AdminApiError, AdminUserItem } from "../../../api/admin.api";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderUserTable() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        initialToken="admin-token"
        initialUser={{
          id: "usr-admin-1",
          email: "admin@auracapital.io",
          displayName: "Admin",
          role: "ADMIN",
        }}
        initialIsLoading={false}
      >
        <AdminUserTable />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const mockUsers: AdminUserItem[] = [
  {
    id: "usr-learner-101",
    email: "trader1@example.com",
    displayName: "Alice Trader",
    role: "LEARNER",
    status: "ACTIVE",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "usr-learner-102",
    email: "badactor@example.com",
    displayName: "Suspicious User",
    role: "LEARNER",
    status: "SUSPENDED",
    createdAt: "2026-03-05T12:00:00Z",
  },
];

describe("AdminUserTable (FEAT-077 / AC-004, AC-008)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles loading state cleanly", () => {
    vi.spyOn(adminApi, "listUsers").mockImplementation(() => new Promise(() => {}));

    renderUserTable();

    const loadingEl = screen.getByTestId("admin-users-loading");
    expect(loadingEl).toBeDefined();
    expect(loadingEl.getAttribute("aria-busy")).toBe("true");
  });

  it("handles error state with retry button", async () => {
    vi.spyOn(adminApi, "listUsers").mockRejectedValue(
      new AdminApiError("Not found", 404, "NOT_FOUND"),
    );

    renderUserTable();

    const errorAlert = await screen.findByTestId("admin-users-error");
    expect(errorAlert).toBeDefined();
    expect(screen.getByText(/unable to load users/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /try again/i })).toBeDefined();
  });

  it("handles empty state when no users are returned", async () => {
    vi.spyOn(adminApi, "listUsers").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    renderUserTable();

    const emptyCard = await screen.findByTestId("admin-users-empty");
    expect(emptyCard).toBeDefined();
    expect(screen.getByText(/no users found/i)).toBeDefined();
  });

  it("renders user table with details and badges", async () => {
    vi.spyOn(adminApi, "listUsers").mockResolvedValue({
      data: mockUsers,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    renderUserTable();

    expect(await screen.findByText("trader1@example.com")).toBeDefined();
    expect(screen.getByText("Alice Trader")).toBeDefined();
    expect(screen.getByText("badactor@example.com")).toBeDefined();
    expect(screen.getByText("Suspicious User")).toBeDefined();

    // Badges
    const activeBadge = screen.getByText("ACTIVE");
    expect(activeBadge).toBeDefined();

    const suspendedBadge = screen.getByText("SUSPENDED");
    expect(suspendedBadge).toBeDefined();
  });

  it("opens accessible confirmation modal and executes status toggle", async () => {
    vi.spyOn(adminApi, "listUsers").mockResolvedValue({
      data: mockUsers,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    const updateSpy = vi.spyOn(adminApi, "updateUserStatus").mockResolvedValue({
      success: true,
      user: {
        ...mockUsers[0]!,
        status: "SUSPENDED",
      },
    });

    renderUserTable();

    // Find and click Suspend on Alice Trader
    const suspendBtn = await screen.findByTestId("suspend-user-usr-learner-101");
    fireEvent.click(suspendBtn);

    // Confirmation modal should be visible
    const modal = screen.getByRole("dialog");
    expect(modal).toBeDefined();
    expect(screen.getByRole("heading", { name: /suspend user account/i })).toBeDefined();
    expect(screen.getAllByText(/trader1@example.com/i).length).toBeGreaterThanOrEqual(2);

    // Confirm action
    const confirmBtn = screen.getByTestId("confirm-status-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        "usr-learner-101",
        expect.objectContaining({ status: "SUSPENDED" }),
        "admin-token",
      );
    });
  });

  it("closes modal on Escape key press", async () => {
    vi.spyOn(adminApi, "listUsers").mockResolvedValue({
      data: mockUsers,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    renderUserTable();

    const suspendBtn = await screen.findByTestId("suspend-user-usr-learner-101");
    fireEvent.click(suspendBtn);

    expect(screen.getByRole("dialog")).toBeDefined();

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("Governance Safety & Features (FEAT-083 / US-1, US-4)", () => {
    it("disables suspend button and displays current user badge for logged-in admin (AC-001)", async () => {
      vi.spyOn(adminApi, "listUsers").mockResolvedValue({
        data: [
          {
            id: "usr-admin-1", // Same ID as initialUser in renderUserTable()
            email: "admin@auracapital.io",
            displayName: "System Admin",
            role: "ADMIN",
            status: "ACTIVE",
            createdAt: "2026-01-01T00:00:00Z",
          },
          ...mockUsers,
        ],
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      renderUserTable();

      // Current user badge should be rendered
      const currentUserBadge = await screen.findByTestId("current-user-badge-usr-admin-1");
      expect(currentUserBadge).toBeDefined();
      expect(currentUserBadge.textContent).toContain("Tài khoản hiện tại / Current User");

      // Suspend button on current user row MUST be disabled
      const suspendSelfBtn = screen.getByTestId("suspend-user-usr-admin-1");
      expect(suspendSelfBtn).toBeDefined();
      expect((suspendSelfBtn as HTMLButtonElement).disabled).toBe(true);

      // Another user's suspend button MUST remain enabled
      const suspendOtherBtn = screen.getByTestId("suspend-user-usr-learner-101");
      expect(suspendOtherBtn).toBeDefined();
      expect((suspendOtherBtn as HTMLButtonElement).disabled).toBe(false);
    });

    it("opens learner progress detail drawer on user click (AC-004)", async () => {
      vi.spyOn(adminApi, "listUsers").mockResolvedValue({
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      vi.spyOn(adminApi, "getLearnerDetails").mockResolvedValue({
        data: {
          userId: "usr-learner-101",
          totalXp: 3450,
          level: 4,
          portfolio: {
            nav: 112500000,
            cash: 10000000,
            unrealizedPnl: 8500000,
            unrealizedPnlPercent: 7.5,
          },
          map1Survival: {
            hasSurvived: true,
            roundsCompleted: 7,
            badge: "Survivor of FOMO Storm",
            highestNav: 142500000,
          },
          courses: [
            { courseId: "c1", title: "Stock Investing 101", completedLessons: 10, totalLessons: 10, status: "COMPLETED" as const },
          ],
        },
      });

      renderUserTable();

      const userBtn = await screen.findByTestId("inspect-user-usr-learner-101");
      fireEvent.click(userBtn);

      const drawer = await screen.findByTestId("learner-detail-drawer");
      expect(drawer).toBeDefined();
      expect(screen.getByText(/Chi Tiết Tiến Độ Học Viên/i)).toBeDefined();
      expect(await screen.findByText(/3,450 XP/i)).toBeDefined();
      expect(screen.getByText("Survivor of FOMO Storm")).toBeDefined();
      expect(screen.getByText(/112[.,]500[.,]000/)).toBeDefined();
    });

    it("opens role management modal and assigns role (AC-004)", async () => {
      vi.spyOn(adminApi, "listUsers").mockResolvedValue({
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const updateRoleSpy = vi.spyOn(adminApi, "updateUserRole").mockResolvedValue({
        success: true,
        userId: "usr-learner-101",
        role: "ADMIN" as const,
      });

      renderUserTable();

      const changeRoleBtn = await screen.findByTestId("change-role-usr-learner-101");
      fireEvent.click(changeRoleBtn);

      // Verify modal is open
      expect(screen.getByTestId("role-modal-overlay")).toBeDefined();
      expect(screen.getByText(/Phân Quyền Vai Trò/i)).toBeDefined();

      // Select ADMIN
      const adminRadio = screen.getByDisplayValue("ADMIN");
      fireEvent.click(adminRadio);

      // Confirm
      const confirmRoleBtn = screen.getByTestId("confirm-role-btn");
      fireEvent.click(confirmRoleBtn);

      await waitFor(() => {
        expect(updateRoleSpy).toHaveBeenCalledWith("usr-learner-101", "ADMIN", "admin-token");
      });
    });
  });
});

