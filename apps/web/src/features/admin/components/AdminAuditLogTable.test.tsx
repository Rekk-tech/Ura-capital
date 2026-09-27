import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../auth/context/AuthContext";
import { AdminAuditLogTable } from "./AdminAuditLogTable";
import { adminApi, AdminApiError, AuditRecordItem } from "../../../api/admin.api";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderAuditTable() {
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
        <AdminAuditLogTable />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const mockAuditRecords: AuditRecordItem[] = [
  {
    id: "aud-001",
    eventType: "USER_STATUS_CHANGE",
    actorId: "usr-admin-1",
    actorEmail: "admin@auracapital.io",
    targetEntity: "USER",
    targetId: "usr-bad-1",
    status: "SUCCESS",
    timestamp: "2026-09-27T09:15:00Z",
  },
  {
    id: "aud-002",
    eventType: "ADMIN_ACCESS_VERIFIED",
    actorId: "usr-admin-1",
    actorEmail: "admin@auracapital.io",
    targetEntity: "ADMIN_CONSOLE",
    status: "SUCCESS",
    timestamp: "2026-09-27T09:00:00Z",
  },
];

describe("AdminAuditLogTable (FEAT-077 / AC-006, AC-008)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the mandatory Server Authority Notice", () => {
    vi.spyOn(adminApi, "listAuditRecords").mockImplementation(() => new Promise(() => {}));

    renderAuditTable();

    const notice = screen.getByTestId("server-authority-notice");
    expect(notice).toBeDefined();
    expect(notice.textContent).toContain(
      "All administrative actions and role evaluations are strictly server-authoritative and immutably audited.",
    );
  });

  it("handles loading state cleanly", () => {
    vi.spyOn(adminApi, "listAuditRecords").mockImplementation(() => new Promise(() => {}));

    renderAuditTable();

    const loadingEl = screen.getByTestId("admin-audit-loading");
    expect(loadingEl).toBeDefined();
    expect(loadingEl.getAttribute("aria-busy")).toBe("true");
  });

  it("handles error state with retry button", async () => {
    vi.spyOn(adminApi, "listAuditRecords").mockRejectedValue(
      new AdminApiError("Not found", 404, "NOT_FOUND"),
    );

    renderAuditTable();

    const errorAlert = await screen.findByTestId("admin-audit-error");
    expect(errorAlert).toBeDefined();
    expect(screen.getByText(/unable to load audit records/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /try again/i })).toBeDefined();
  });

  it("handles empty state when no audit records are found", async () => {
    vi.spyOn(adminApi, "listAuditRecords").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 25,
      totalPages: 0,
    });

    renderAuditTable();

    const emptyCard = await screen.findByTestId("admin-audit-empty");
    expect(emptyCard).toBeDefined();
    expect(screen.getByText(/no audit records found/i)).toBeDefined();
  });

  it("renders audit records table with details and badges", async () => {
    vi.spyOn(adminApi, "listAuditRecords").mockResolvedValue({
      data: mockAuditRecords,
      total: 2,
      page: 1,
      limit: 25,
      totalPages: 1,
    });

    renderAuditTable();

    expect(await screen.findByText("USER_STATUS_CHANGE")).toBeDefined();
    expect(screen.getByText("ADMIN_ACCESS_VERIFIED")).toBeDefined();
    expect(screen.getAllByText("admin@auracapital.io").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("USER (usr-bad-1)")).toBeDefined();
    expect(screen.getAllByText("SUCCESS").length).toBeGreaterThanOrEqual(2);
  });

  it("filters audit records by event type", async () => {
    const listSpy = vi.spyOn(adminApi, "listAuditRecords").mockResolvedValue({
      data: mockAuditRecords,
      total: 2,
      page: 1,
      limit: 25,
      totalPages: 1,
    });

    renderAuditTable();

    const selectEl = screen.getByLabelText(/filter audit log by event type/i);
    fireEvent.change(selectEl, { target: { value: "USER_STATUS_CHANGE" } });

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: "USER_STATUS_CHANGE" }),
        "admin-token",
        expect.any(Object),
      );
    });
  });
});
