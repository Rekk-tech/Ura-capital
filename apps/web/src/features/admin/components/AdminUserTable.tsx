import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  RotateCw,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import {
  useAdminUsers,
  useUpdateUserStatus,
} from "../hooks/use-admin";
import {
  AdminUserItem,
  UserStatus,
  UserRole,
} from "../types/admin-ui.types";

interface AdminUserTableProps {
  onRecordAudit?: (action: string, targetId: string) => void;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = () => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [page, setPage] = useState(1);

  // Confirmation dialog state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsers(
    {
      search: searchTerm.trim() || undefined,
      status: statusFilter,
      role: roleFilter,
      page,
      limit: 10,
    },
    accessToken,
  );

  const updateUserMutation = useUpdateUserStatus();

  // Focus trap & Escape key for confirmation modal
  useEffect(() => {
    if (!selectedUser) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser]);

  const openConfirmation = (user: AdminUserItem, newStatus: UserStatus) => {
    setSelectedUser(user);
    setPendingStatus(newStatus);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setPendingStatus(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedUser || !pendingStatus || !accessToken) return;

    try {
      await updateUserMutation.mutateAsync({
        userId: selectedUser.id,
        data: {
          status: pendingStatus,
          reason: `Admin status update via control surface`,
        },
        accessToken,
      });
      closeModal();
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="admin-panel" data-testid="admin-user-table-panel">
      {/* Controls Bar: Search & Filters */}
      <div
        className="admin-controls-bar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", flex: 1, minWidth: "260px" }}>
          <div className="search-input-wrap" style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
              aria-hidden="true"
            />
            <input
              type="text"
              className="form-input"
              aria-label="Search users by email or name"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{ paddingLeft: "2.25rem", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={16} aria-hidden="true" className="text-muted" />
            <select
              className="form-select"
              aria-label="Filter users by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as UserStatus | "ALL");
                setPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              className="form-select"
              aria-label="Filter users by role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "ALL");
                setPage(1);
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="LEARNER">Learners</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => refetch()}
          aria-label="Refresh user list"
        >
          <RotateCw size={14} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* 5 Async States */}

      {/* 1. Loading State */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading user directory"
          aria-busy="true"
          data-testid="admin-users-loading"
          style={{ padding: "2rem", textAlign: "center" }}
        >
          <div className="loading-spinner" aria-hidden="true" style={{ margin: "0 auto 1rem" }} />
          <p className="text-muted">Loading user accounts...</p>
        </div>
      )}

      {/* 2. Error State */}
      {!isLoading && isError && (
        <div
          className="card text-center"
          role="alert"
          data-testid="admin-users-error"
          style={{ padding: "2rem", borderColor: "rgba(239, 68, 68, 0.3)" }}
        >
          <AlertTriangle size={36} style={{ color: "#ef4444", margin: "0 auto 0.75rem" }} aria-hidden="true" />
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Unable to load users</h2>
          <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
            {error instanceof Error ? error.message : "Failed to fetch user directory."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => refetch()}
            style={{ margin: "0 auto" }}
          >
            <RotateCw size={14} aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && !isError && (!usersResponse?.data || usersResponse.data.length === 0) && (
        <div
          className="card text-center"
          data-testid="admin-users-empty"
          style={{ padding: "3rem 1.5rem" }}
        >
          <Shield size={40} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} aria-hidden="true" />
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>No users found</h2>
          <p className="text-muted" style={{ marginBottom: "1.25rem", maxWidth: "400px", margin: "0 auto 1.25rem" }}>
            {searchTerm || statusFilter !== "ALL" || roleFilter !== "ALL"
              ? "No accounts match the active filter criteria. Clear filters to see all users."
              : "No user accounts registered in this environment."}
          </p>
          {(searchTerm || statusFilter !== "ALL" || roleFilter !== "ALL") && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setRoleFilter("ALL");
              }}
              style={{ margin: "0 auto" }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* 4 & 5. Success / Table State */}
      {!isLoading && !isError && usersResponse?.data && usersResponse.data.length > 0 && (
        <div className="table-responsive-container" style={{ overflowX: "auto" }}>
          <table
            className="data-table"
            style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
            aria-label="User accounts directory"
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>User ID</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Display Name</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Email</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Role</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Created Date</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {usersResponse.data.map((user) => {
                const isActive = user.status === "ACTIVE";
                const isAdmin = user.role === "ADMIN";

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      transition: "background 0.15s ease",
                    }}
                    data-testid={`user-row-${user.id}`}
                  >
                    <td
                      style={{
                        padding: "0.85rem 1rem",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                      title={user.id}
                    >
                      {user.id.slice(0, 10)}...
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 500 }}>
                      {user.displayName || "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-secondary)" }}>
                      {user.email}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isAdmin ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.05)",
                          color: isAdmin ? "#3b82f6" : "var(--text-secondary)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: isActive ? "#10b981" : "#ef4444",
                          fontSize: "0.75rem",
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      {isActive ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: "#ef4444",
                            borderColor: "rgba(239, 68, 68, 0.4)",
                            padding: "0.35rem 0.65rem",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => openConfirmation(user, "SUSPENDED")}
                          aria-label={`Suspend user ${user.email}`}
                          data-testid={`suspend-user-${user.id}`}
                        >
                          <UserX size={14} aria-hidden="true" />
                          <span>Suspend</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: "#10b981",
                            borderColor: "rgba(16, 185, 129, 0.4)",
                            padding: "0.35rem 0.65rem",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => openConfirmation(user, "ACTIVE")}
                          aria-label={`Reactivate user ${user.email}`}
                          data-testid={`activate-user-${user.id}`}
                        >
                          <UserCheck size={14} aria-hidden="true" />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {usersResponse.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 0",
              }}
            >
              <span className="text-muted text-sm">
                Showing Page {usersResponse.page} of {usersResponse.totalPages} ({usersResponse.total} users)
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= usersResponse.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accessible Confirmation Modal */}
      {selectedUser && pendingStatus && (
        <div
          className="modal-backdrop"
          role="presentation"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            ref={modalRef}
            style={{
              maxWidth: "480px",
              width: "100%",
              backgroundColor: "var(--bg-card, #182234)",
              border: "1px solid var(--border-subtle)",
              padding: "1.75rem",
              borderRadius: "var(--radius-md, 10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              {pendingStatus === "SUSPENDED" ? (
                <XCircle size={28} style={{ color: "#ef4444" }} aria-hidden="true" />
              ) : (
                <CheckCircle size={28} style={{ color: "#10b981" }} aria-hidden="true" />
              )}
              <h2 id="confirm-modal-title" style={{ fontSize: "1.25rem", margin: 0 }}>
                {pendingStatus === "SUSPENDED" ? "Suspend User Account" : "Reactivate User Account"}
              </h2>
            </div>

            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
              Are you sure you want to {pendingStatus === "SUSPENDED" ? "suspend" : "reactivate"}{" "}
              <strong>{selectedUser.email}</strong> ({selectedUser.displayName || selectedUser.id})?
            </p>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "0.75rem",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              This administrative action is server-authoritative and will be immutably recorded in the security audit trail.
            </div>

            {updateUserMutation.isError && (
              <div
                role="alert"
                style={{
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  marginBottom: "1rem",
                  padding: "0.5rem",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                Failed to update user status: {updateUserMutation.error?.message || "Server error"}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                ref={cancelButtonRef}
                onClick={closeModal}
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${pendingStatus === "SUSPENDED" ? "btn-danger" : "btn-primary"}`}
                style={{
                  backgroundColor: pendingStatus === "SUSPENDED" ? "#ef4444" : undefined,
                  borderColor: pendingStatus === "SUSPENDED" ? "#ef4444" : undefined,
                }}
                onClick={handleConfirmStatusChange}
                disabled={updateUserMutation.isPending}
                data-testid="confirm-status-btn"
              >
                {updateUserMutation.isPending ? "Updating..." : `Confirm ${pendingStatus === "SUSPENDED" ? "Suspend" : "Reactivate"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
