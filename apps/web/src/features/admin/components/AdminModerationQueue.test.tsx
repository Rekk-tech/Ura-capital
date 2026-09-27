import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { AdminModerationQueue } from "./AdminModerationQueue";
import { adminApi, AdminApiError, ModerationQueueItem } from "../../../api/admin.api";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderModerationQueue() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        initialToken="admin-token"
        initialUser={{
          id: "usr-admin-1",
          email: "admin@auracapital.io",
          role: "ADMIN",
        }}
        initialIsLoading={false}
      >
        <AdminModerationQueue />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const mockItems: ModerationQueueItem[] = [
  {
    id: "mod-item-1",
    targetType: "POST",
    targetId: "post-101",
    authorId: "usr-1",
    authorName: "Flagged Poster",
    snippet: "Guaranteed 1000% returns join my telegram group now!",
    reason: "SPAM",
    reportCount: 5,
    status: "PENDING",
    reportedAt: "2026-09-27T08:30:00Z",
  },
];

describe("AdminModerationQueue (FEAT-077 / AC-005, AC-008)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles loading state cleanly", () => {
    vi.spyOn(adminApi, "listModerationQueue").mockImplementation(() => new Promise(() => {}));

    renderModerationQueue();

    const loadingEl = screen.getByTestId("admin-moderation-loading");
    expect(loadingEl).toBeDefined();
    expect(loadingEl.getAttribute("aria-busy")).toBe("true");
  });

  it("handles error state with retry button", async () => {
    vi.spyOn(adminApi, "listModerationQueue").mockRejectedValue(
      new AdminApiError("Not found", 404, "NOT_FOUND"),
    );

    renderModerationQueue();

    const errorAlert = await screen.findByTestId("admin-moderation-error");
    expect(errorAlert).toBeDefined();
    expect(screen.getByText(/unable to load moderation queue/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /try again/i })).toBeDefined();
  });

  it("handles empty state when queue is clear", async () => {
    vi.spyOn(adminApi, "listModerationQueue").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    renderModerationQueue();

    const emptyCard = await screen.findByTestId("admin-moderation-empty");
    expect(emptyCard).toBeDefined();
    expect(screen.getByText(/moderation queue is clear/i)).toBeDefined();
  });

  it("renders moderation item with snippet preview and report details", async () => {
    vi.spyOn(adminApi, "listModerationQueue").mockResolvedValue({
      data: mockItems,
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderModerationQueue();

    expect(await screen.findByText(/Guaranteed 1000% returns/i)).toBeDefined();
    expect(screen.getByText("Flagged Poster")).toBeDefined();
    expect(screen.getByText("SPAM")).toBeDefined();
    expect(screen.getByText("5 reports")).toBeDefined();
    expect(screen.getByTestId("dismiss-report-mod-item-1")).toBeDefined();
    expect(screen.getByTestId("delete-content-mod-item-1")).toBeDefined();
  });

  it("resolves moderation item when Dismiss Report is clicked", async () => {
    vi.spyOn(adminApi, "listModerationQueue").mockResolvedValue({
      data: mockItems,
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const resolveSpy = vi.spyOn(adminApi, "resolveModerationItem").mockResolvedValue({
      success: true,
      itemId: "mod-item-1",
      status: "DISMISSED",
    });

    renderModerationQueue();

    const dismissBtn = await screen.findByTestId("dismiss-report-mod-item-1");
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(resolveSpy).toHaveBeenCalledWith("mod-item-1", "DISMISS", "admin-token");
    });
  });

  it("resolves moderation item when Hide/Delete Content is clicked", async () => {
    vi.spyOn(adminApi, "listModerationQueue").mockResolvedValue({
      data: mockItems,
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const resolveSpy = vi.spyOn(adminApi, "resolveModerationItem").mockResolvedValue({
      success: true,
      itemId: "mod-item-1",
      status: "DELETED",
    });

    renderModerationQueue();

    const deleteBtn = await screen.findByTestId("delete-content-mod-item-1");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(resolveSpy).toHaveBeenCalledWith("mod-item-1", "DELETE", "admin-token");
    });
  });
});
