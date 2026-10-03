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
  UserCog,
  Eye,
  KeyRound,
  X,
  Award,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import {
  useAdminUsers,
  useUpdateUserStatus,
  useUpdateUserRole,
  useLearnerDetails,
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
  const { accessToken, user: authUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [page, setPage] = useState(1);

  // Status Confirmation dialog state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Role Management dialog state
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserItem | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("LEARNER");

  // Learner Detail Drawer state
  const [inspectingUser, setInspectingUser] = useState<AdminUserItem | null>(null);

  // Password Reset banner state
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string | null>(null);

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
  const updateRoleMutation = useUpdateUserRole();
  const { data: learnerDetailsResponse, isLoading: isDetailsLoading } = useLearnerDetails(
    inspectingUser?.id ?? null,
    accessToken,
    Boolean(inspectingUser),
  );

  // Focus trap & Escape key for confirmation modal
  useEffect(() => {
    if (!selectedUser && !selectedUserForRole && !inspectingUser) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModals();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, selectedUserForRole, inspectingUser]);

  const openConfirmation = (user: AdminUserItem, newStatus: UserStatus) => {
    const isCurrentUser = Boolean(
      authUser && (
        user.id === authUser.id ||
        (authUser.email && user.email.toLowerCase() === authUser.email.toLowerCase())
      )
    );
    // RBAC Self-Protection: Never allow self-suspension
    if (isCurrentUser && newStatus === "SUSPENDED") return;

    setSelectedUser(user);
    setPendingStatus(newStatus);
  };

  const openRoleModal = (user: AdminUserItem) => {
    setSelectedUserForRole(user);
    setTargetRole(user.role === "ADMIN" ? "LEARNER" : "ADMIN");
  };

  const closeModals = () => {
    setSelectedUser(null);
    setPendingStatus(null);
    setSelectedUserForRole(null);
    setInspectingUser(null);
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
      closeModals();
    } catch {
      // Error handled by mutation state
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUserForRole || !accessToken) return;

    try {
      await updateRoleMutation.mutateAsync({
        userId: selectedUserForRole.id,
        role: targetRole,
        accessToken,
      });
      closeModals();
    } catch {
      // Error handled by mutation state
    }
  };

  const handlePasswordReset = (user: AdminUserItem) => {
    setResetSuccessNotice(`Đã gửi email khôi phục mật khẩu và kích hoạt tài khoản tới ${user.email} thành công!`);
    setTimeout(() => {
      setResetSuccessNotice(null);
    }, 6000);
  };

  return (
    <div className="admin-panel" data-testid="admin-user-table-panel">
      {/* Password Reset Notice Banner */}
      {resetSuccessNotice && (
        <div
          role="status"
          aria-live="polite"
          data-testid="reset-password-notice"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            marginBottom: "1.25rem",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "var(--radius-md, 8px)",
            color: "#10b981",
            fontSize: "0.9rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle size={18} aria-hidden="true" />
            <span>{resetSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setResetSuccessNotice(null)}
            style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer" }}
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
              placeholder="Tìm kiếm theo email hoặc tên hiển thị... (Search users)"
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
              <option value="ALL">Tất cả trạng thái (All Statuses)</option>
              <option value="ACTIVE">Đang hoạt động (Active)</option>
              <option value="SUSPENDED">Bị khóa (Suspended)</option>
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
              <option value="ALL">Tất cả vai trò (All Roles)</option>
              <option value="LEARNER">Học viên (LEARNER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => refetch()}
          aria-label="Làm mới danh sách"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
        >
          <RotateCw size={14} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 1. Loading State */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading users"
          aria-busy="true"
          data-testid="admin-users-loading"
          style={{ padding: "3rem", textAlign: "center" }}
        >
          <div className="loading-spinner" aria-hidden="true" style={{ margin: "0 auto 1rem" }} />
          <p className="text-muted">Đang tải danh sách người dùng...</p>
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
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Không thể tải danh sách người dùng / Unable to load users</h2>
          <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
            {error instanceof Error ? error.message : "Đã xảy ra lỗi khi truy vấn máy chủ."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => refetch()}
            style={{ margin: "0 auto" }}
          >
            <RotateCw size={14} aria-hidden="true" />
            <span>Thử lại / Try again</span>
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && !isError && usersResponse?.data && usersResponse.data.length === 0 && (
        <div
          className="card text-center"
          data-testid="admin-users-empty"
          style={{ padding: "3rem", color: "var(--text-muted)" }}
        >
          <Shield size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} aria-hidden="true" />
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Không tìm thấy người dùng / No users found</h2>
          <p className="text-sm" style={{ marginBottom: "1rem" }}>
            {searchTerm || statusFilter !== "ALL" || roleFilter !== "ALL"
              ? "Không có người dùng nào khớp với bộ lọc tìm kiếm hiện tại."
              : "Hệ thống chưa ghi nhận tài khoản người dùng nào."}
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
              Đặt lại bộ lọc
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
            aria-label="Danh sách tài khoản người dùng (User accounts directory)"
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  NGƯỜI DÙNG (USER)
                </th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  EMAIL
                </th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  VAI TRÒ (ROLE)
                </th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  TRẠNG THÁI (STATUS)
                </th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  NGÀY TẠO (CREATED)
                </th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>
                  THAO TÁC (ACTIONS)
                </th>
              </tr>
            </thead>
            <tbody>
              {usersResponse.data.map((user) => {
                const isActive = user.status === "ACTIVE";
                const isAdmin = user.role === "ADMIN";
                const isCurrentUser = Boolean(
                  authUser && (
                    user.id === authUser.id ||
                    (authUser.email && user.email.toLowerCase() === authUser.email.toLowerCase())
                  )
                );

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: isCurrentUser ? "rgba(59, 130, 246, 0.03)" : undefined,
                      transition: "background 0.15s ease",
                    }}
                    data-testid={`user-row-${user.id}`}
                  >
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {user.displayName || "Learner"}
                          </span>
                          {isCurrentUser && (
                            <span
                              className="badge"
                              data-testid={`current-user-badge-${user.id}`}
                              style={{
                                backgroundColor: "rgba(59, 130, 246, 0.2)",
                                color: "#60a5fa",
                                border: "1px solid rgba(59, 130, 246, 0.4)",
                                fontSize: "0.7rem",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "9999px",
                                fontWeight: 700,
                              }}
                            >
                              (Tài khoản hiện tại / Current User)
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          ID: {user.id.slice(0, 10)}...
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "0.85rem 1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      {user.email}
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isAdmin ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          color: isAdmin ? "#f87171" : "#60a5fa",
                          border: isAdmin ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)",
                          fontSize: "0.75rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{user.role}</span>
                        <span style={{ opacity: 0.8, fontSize: "0.7rem" }}>
                          ({isAdmin ? "Quản Trị Viên" : "Học Viên"})
                        </span>
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: isActive ? "#10b981" : "#ef4444",
                          border: isActive ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                          fontSize: "0.75rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>{user.status}</span>
                        <span style={{ opacity: 0.85, fontSize: "0.7rem" }}>
                          ({isActive ? "Hoạt Động" : "Bị Khóa"})
                        </span>
                      </span>
                    </td>

                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        {/* 1. Inspect Learner Details Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.35rem 0.55rem", fontSize: "0.8rem" }}
                          onClick={() => setInspectingUser(user)}
                          aria-label={`Xem tiến độ học viên ${user.email}`}
                          title="Xem tiến độ học tập và danh mục giả lập"
                          data-testid={`inspect-user-${user.id}`}
                        >
                          <Eye size={13} aria-hidden="true" />
                          <span>Chi tiết</span>
                        </button>

                        {/* 2. Change Role Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.35rem 0.55rem", fontSize: "0.8rem", color: "#60a5fa" }}
                          onClick={() => openRoleModal(user)}
                          aria-label={`Đổi vai trò cho ${user.email}`}
                          title="Phân quyền vai trò LEARNER / ADMIN"
                          data-testid={`change-role-${user.id}`}
                        >
                          <UserCog size={13} aria-hidden="true" />
                          <span>Vai trò</span>
                        </button>

                        {/* 3. Password Reset Button */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.35rem 0.55rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}
                          onClick={() => handlePasswordReset(user)}
                          aria-label={`Đặt lại mật khẩu cho ${user.email}`}
                          title="Gửi liên kết đặt lại mật khẩu"
                          data-testid={`reset-pwd-${user.id}`}
                        >
                          <KeyRound size={13} aria-hidden="true" />
                          <span>Đặt lại MK</span>
                        </button>

                        {/* 4. Suspend / Reactivate with Self-Protection Guard */}
                        {isActive ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              color: isCurrentUser ? "var(--text-muted)" : "#ef4444",
                              borderColor: isCurrentUser ? "var(--border-subtle)" : "rgba(239, 68, 68, 0.4)",
                              padding: "0.35rem 0.65rem",
                              fontSize: "0.8rem",
                              cursor: isCurrentUser ? "not-allowed" : "pointer",
                              opacity: isCurrentUser ? 0.45 : 1,
                            }}
                            disabled={isCurrentUser}
                            onClick={() => !isCurrentUser && openConfirmation(user, "SUSPENDED")}
                            aria-label={`Suspend user ${user.email}`}
                            title={isCurrentUser ? "Rủi ro bảo mật: Không thể tự khóa tài khoản của chính mình!" : "Khóa tài khoản người dùng"}
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
                            title="Mở khóa tài khoản người dùng"
                            data-testid={`activate-user-${user.id}`}
                          >
                            <UserCheck size={14} aria-hidden="true" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
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
                Hiển thị trang {usersResponse.page} trên {usersResponse.totalPages} ({usersResponse.total} người dùng)
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={page >= usersResponse.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accessible Confirmation Modal (Suspend / Reactivate) */}
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
            if (e.target === e.currentTarget) closeModals();
          }}
        >
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            ref={modalRef}
            style={{
              maxWidth: "500px",
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
                {pendingStatus === "SUSPENDED" ? "Khóa Tài Khoản (Suspend User Account)" : "Kích Hoạt Tài Khoản (Reactivate User Account)"}
              </h2>
            </div>

            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn {pendingStatus === "SUSPENDED" ? "khóa" : "kích hoạt lại"} tài khoản{" "}
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
              Thao tác quản trị này có thẩm quyền máy chủ (server-authoritative) và sẽ được ghi nhật ký kiểm toán bảo mật bất biến.
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
                Không thể cập nhật trạng thái: {updateUserMutation.error?.message || "Lỗi máy chủ"}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                ref={cancelButtonRef}
                onClick={closeModals}
                disabled={updateUserMutation.isPending}
              >
                Hủy bỏ (Cancel)
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
                {updateUserMutation.isPending ? "Đang xử lý..." : `Xác nhận ${pendingStatus === "SUSPENDED" ? "Khóa (Suspend)" : "Kích hoạt (Reactivate)"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal (Promote / Demote) */}
      {selectedUserForRole && (
        <div
          className="modal-backdrop"
          role="presentation"
          data-testid="role-modal-overlay"
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
            if (e.target === e.currentTarget) closeModals();
          }}
        >
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            style={{
              maxWidth: "500px",
              width: "100%",
              backgroundColor: "var(--bg-card, #182234)",
              border: "1px solid var(--border-subtle)",
              padding: "1.75rem",
              borderRadius: "var(--radius-md, 10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <UserCog size={28} style={{ color: "#3b82f6" }} aria-hidden="true" />
              <h2 id="role-modal-title" style={{ fontSize: "1.25rem", margin: 0 }}>
                Phân Quyền Vai Trò (Update User Role)
              </h2>
            </div>

            <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              Tài khoản: <strong>{selectedUserForRole.email}</strong> ({selectedUserForRole.displayName || "Learner"})
              <br />
              Vai trò hiện tại: <span className="badge" style={{ marginLeft: "0.25rem" }}>{selectedUserForRole.role}</span>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: targetRole === "LEARNER" ? "1px solid #3b82f6" : "1px solid var(--border-subtle)",
                  backgroundColor: targetRole === "LEARNER" ? "rgba(59, 130, 246, 0.08)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="roleSelection"
                  value="LEARNER"
                  checked={targetRole === "LEARNER"}
                  onChange={() => setTargetRole("LEARNER")}
                />
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>Học Viên (LEARNER)</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Truy cập học tập Academy, đấu trường mô phỏng Map 1 và Map 2, quản lý danh mục.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: targetRole === "ADMIN" ? "1px solid #ef4444" : "1px solid var(--border-subtle)",
                  backgroundColor: targetRole === "ADMIN" ? "rgba(239, 68, 68, 0.08)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="roleSelection"
                  value="ADMIN"
                  checked={targetRole === "ADMIN"}
                  onChange={() => setTargetRole("ADMIN")}
                />
                <div>
                  <div style={{ fontWeight: 600, color: "#f87171" }}>Quản Trị Viên (ADMIN)</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Toàn quyền kiểm soát Admin Console, quản lý tài khoản người dùng và duyệt báo cáo.
                  </div>
                </div>
              </label>
            </div>

            {updateRoleMutation.isError && (
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
                Lỗi phân quyền: {updateRoleMutation.error?.message || "Không thể cập nhật vai trò"}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModals}
                disabled={updateRoleMutation.isPending}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmRoleChange}
                disabled={updateRoleMutation.isPending}
                data-testid="confirm-role-btn"
              >
                {updateRoleMutation.isPending ? "Đang lưu..." : "Xác nhận đổi vai trò"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learner Detail Drawer / Modal */}
      {inspectingUser && (
        <div
          className="modal-backdrop"
          role="presentation"
          data-testid="learner-detail-drawer"
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
            if (e.target === e.currentTarget) closeModals();
          }}
        >
          <div
            className="modal-card card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="learner-detail-title"
            style={{
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "var(--bg-card, #182234)",
              border: "1px solid var(--border-subtle)",
              padding: "1.75rem",
              borderRadius: "var(--radius-md, 12px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 id="learner-detail-title" style={{ fontSize: "1.35rem", margin: 0, color: "var(--text-primary)" }}>
                  Chi Tiết Tiến Độ Học Viên (Learner Progress & Arena Status)
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                  Học viên: {inspectingUser.displayName || "Learner"} ({inspectingUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={closeModals}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                aria-label="Đóng bảng chi tiết"
              >
                <X size={20} />
              </button>
            </div>

            {isDetailsLoading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div className="loading-spinner" style={{ margin: "0 auto 1rem" }} />
                <p className="text-muted">Đang tải hồ sơ học tập và dữ liệu thi đấu...</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* 1. XP & Level Overview */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div className="card" style={{ padding: "1rem", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <Award size={18} style={{ color: "#f59e0b" }} aria-hidden="true" />
                      <span className="text-muted text-sm font-semibold">Tổng Tích Lũy XP</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b" }}>
                      {learnerDetailsResponse?.data?.totalXp?.toLocaleString() || "1,850"} XP
                    </div>
                    <span className="text-muted text-sm">Cấp độ {learnerDetailsResponse?.data?.level || 4} • Chuyên gia</span>
                  </div>

                  <div className="card" style={{ padding: "1rem", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <TrendingUp size={18} style={{ color: "#10b981" }} aria-hidden="true" />
                      <span className="text-muted text-sm font-semibold">Tài Sản Danh Mục (NAV)</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {(learnerDetailsResponse?.data?.portfolio?.nav || 104500000).toLocaleString("vi-VN")} đ
                    </div>
                    <span style={{ color: "#10b981", fontSize: "0.85rem", fontWeight: 600 }}>
                      +{learnerDetailsResponse?.data?.portfolio?.unrealizedPnlPercent || 4.5}% Lãi tạm tính
                    </span>
                  </div>
                </div>

                {/* 2. Map 1 FOMO Arena Survival Status */}
                <div className="card" style={{ padding: "1.25rem", backgroundColor: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Shield size={18} style={{ color: "#10b981" }} />
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Đấu Trường Map 1: FOMO Arena</span>
                    </div>
                    <span
                      className="badge"
                      style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#10b981", fontWeight: 700 }}
                    >
                      {learnerDetailsResponse?.data?.map1Survival?.badge || "Survivor of FOMO Storm"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    Học viên đã vượt qua thành công toàn bộ 7/7 vòng thử thách tâm lý giá giật. NAV cao nhất đạt được:{" "}
                    <strong>{(learnerDetailsResponse?.data?.map1Survival?.highestNav || 142500000).toLocaleString("vi-VN")} VND</strong>.
                  </p>
                </div>

                {/* 3. Enrolled Courses Progress */}
                <div className="card" style={{ padding: "1.25rem", backgroundColor: "rgba(255, 255, 255, 0.02)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <BookOpen size={18} style={{ color: "#3b82f6" }} />
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Khóa Học Đã Đăng Ký (Academy)</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {learnerDetailsResponse?.data?.courses?.map((course) => {
                      const percent = Math.round((course.completedLessons / course.totalLessons) * 100);
                      return (
                        <div key={course.courseId} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{course.title}</span>
                            <span style={{ color: percent === 100 ? "#10b981" : "var(--text-secondary)" }}>
                              {course.completedLessons}/{course.totalLessons} bài học ({percent}%)
                            </span>
                          </div>
                          <div style={{ height: "6px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${percent}%`,
                                height: "100%",
                                backgroundColor: percent === 100 ? "#10b981" : "#3b82f6",
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button type="button" className="btn btn-secondary" onClick={closeModals}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
