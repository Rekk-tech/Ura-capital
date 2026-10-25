import React from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { ShieldAlert, Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type AppRole = "SYSTEM_ADMIN" | "ADMIN" | "MODERATOR" | "BROKER" | "LEARNER" | "USER";

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "Quản Trị Hệ Thống Tối Cao",
  ADMIN: "Quản Trị Viên",
  MODERATOR: "Biên Tập Viên Học Thuật & Kiểm Duyệt",
  BROKER: "Chuyên Gia Môi Giới Xác Thực",
  LEARNER: "Học Viên / Nhà Đầu Tư",
  USER: "Người Dùng Tiêu Chuẩn",
};

/**
 * Reusable Segregation of Duties (SoD) Role Guard
 * Enforces declarative role-based access for UI components and routes.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  redirectTo,
  requireAuth = true,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="auth-guard-container" id="main-content" role="status" aria-label="Đang xác thực quyền hạn">
        <div className="auth-card text-center">
          <div className="loading-spinner" aria-hidden="true" />
          <p className="text-muted" style={{ marginTop: "1rem" }}>
            Đang xác thực đặc quyền người dùng...
          </p>
        </div>
      </main>
    );
  }

  if (requireAuth && !isAuthenticated) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // Determine current user role
  const currentRole = user?.role || (isAuthenticated ? "LEARNER" : "GUEST");

  // Check role match:
  // Note: SYSTEM_ADMIN covers ADMIN; LEARNER covers USER
  const hasAccess = allowedRoles.some((role) => {
    if (role === currentRole) return true;
    if (role === "SYSTEM_ADMIN" && currentRole === "ADMIN") return true;
    if (role === "ADMIN" && currentRole === "SYSTEM_ADMIN") return true;
    if (role === "LEARNER" && currentRole === "USER") return true;
    if (role === "USER" && currentRole === "LEARNER") return true;
    return false;
  });

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    const readableAllowedRoles = allowedRoles
      .map((r) => ROLE_LABELS[r] || r)
      .join(", ");

    return (
      <main className="auth-guard-container" id="main-content" data-testid="role-forbidden-view">
        <div className="auth-card text-center" style={{ maxWidth: "560px" }}>
          <div
            className="auth-icon-wrap"
            aria-hidden="true"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--status-error, #ef4444)",
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <span
            className="badge"
            style={{
              alignSelf: "center",
              marginBottom: "0.5rem",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            403 Không Đủ Quyền Hạn
          </span>

          <h1 className="auth-title">Khu Vực Phân Quyền Giới Hạn</h1>

          <p className="auth-subtitle">
            Tài khoản hiện tại có vai trò <strong>{ROLE_LABELS[currentRole] || currentRole}</strong>.
            Khu vực này yêu cầu vai trò: <strong>{readableAllowedRoles}</strong>.
          </p>

          <div
            className="admin-authority-notice"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm, 6px)",
              margin: "1.25rem 0",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            <Shield size={16} aria-hidden="true" style={{ flexShrink: 0, color: "var(--accent-cyan, #06b6d4)" }} />
            <span>Nguyên tắc Phân tách trách nhiệm (SoD) được thực thi và kiểm toán tự động.</span>
          </div>

          <div className="auth-actions-group">
            <Link to="/dashboard" className="btn btn-primary">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Về Trang Tổng Quan</span>
            </Link>
            <Link to="/" className="btn btn-secondary">
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};
