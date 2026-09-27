import React from "react";
import { useLocation, Navigate, Link } from "react-router-dom";
import { ShieldAlert, Shield } from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * FEAT-077: Server-Authoritative RBAC Admin Route Guard (FR-002, AC-002)
 *
 * Enforces strict fail-closed role check:
 * 1. Unauthenticated users are redirected to /login?returnTo=%2Fadmin
 * 2. Authenticated non-admin users receive a deterministic 403 Forbidden view
 *    WITHOUT exposing administrative controls or issuing unauthorized queries.
 * 3. Authenticated admins proceed to the protected administrative surface.
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main
        className="auth-guard-container"
        id="main-content"
        role="status"
        aria-label="Loading authentication"
      >
        <div className="auth-card text-center">
          <div className="loading-spinner" aria-hidden="true" />
          <p className="text-muted" style={{ marginTop: "1rem" }}>
            Verifying administrative authority...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // Authoritative check against user role - only durable ADMIN role is admitted
  const isAdmin = user?.role === "ADMIN";
  if (!isAdmin) {
    return (
      <main
        className="auth-guard-container"
        id="main-content"
        data-testid="admin-forbidden-view"
      >
        <div className="auth-card text-center" style={{ maxWidth: "560px" }}>
          <div className="auth-icon-wrap" aria-hidden="true" style={{ background: "rgba(239, 68, 68, 0.12)" }}>
            <ShieldAlert size={36} style={{ color: "var(--status-error, #ef4444)" }} />
          </div>

          <span
            className="badge"
            style={{
              alignSelf: "center",
              marginBottom: "0.5rem",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            403 Forbidden
          </span>

          <h1 className="auth-title">Administrative Access Denied</h1>

          <p className="auth-subtitle">
            You are authenticated as <strong>{user?.email || "a standard learner"}</strong> with the{" "}
            <strong>{user?.role || "LEARNER"}</strong> role. Access to the Admin Control Surface
            requires server-verified administrative privileges.
          </p>

          <div
            className="admin-authority-notice"
            data-testid="server-authority-notice"
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
            <span>All administrative actions and role evaluations are strictly server-authoritative and immutably audited.</span>
          </div>

          <div className="auth-actions-group">
            <Link to="/dashboard" className="btn btn-primary">
              Return to Learner Dashboard
            </Link>
            <Link to="/" className="btn btn-secondary">
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};
