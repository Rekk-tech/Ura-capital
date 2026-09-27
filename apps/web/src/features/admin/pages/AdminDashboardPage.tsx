import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  RotateCw,
  Clock,
  ArrowRight,
  Database,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useAdminMetrics } from "../hooks/use-admin";
import { AdminUserTable } from "../components/AdminUserTable";
import { AdminModerationQueue } from "../components/AdminModerationQueue";
import { AdminAuditLogTable } from "../components/AdminAuditLogTable";

export type AdminTab = "overview" | "users" | "moderation" | "audit";

interface AdminDashboardPageProps {
  initialTab?: AdminTab;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ initialTab }) => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current tab from route path or initialTab
  const resolveCurrentTab = (): AdminTab => {
    if (location.pathname.startsWith("/admin/users")) return "users";
    if (location.pathname.startsWith("/admin/moderation")) return "moderation";
    if (location.pathname.startsWith("/admin/audit")) return "audit";
    if (location.pathname === "/admin" || location.pathname === "/admin/") return "overview";
    return initialTab || "overview";
  };

  const [currentTab, setCurrentTab] = useState<AdminTab>(resolveCurrentTab());

  useEffect(() => {
    setCurrentTab(resolveCurrentTab());
  }, [location.pathname]);

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    if (tab === "overview") navigate("/admin");
    else if (tab === "users") navigate("/admin/users");
    else if (tab === "moderation") navigate("/admin/moderation");
    else if (tab === "audit") navigate("/admin/audit");
  };

  // Metrics query for Overview
  const {
    data: metricsResponse,
    isLoading: isMetricsLoading,
    isError: isMetricsError,
    error: metricsError,
    refetch: refetchMetrics,
  } = useAdminMetrics(accessToken, currentTab === "overview");

  return (
    <main
      className="admin-dashboard-container"
      id="main-content"
      data-testid="admin-dashboard-page"
      style={{ padding: "1.5rem 0" }}
    >
      {/* Page Header */}
      <div
        className="admin-header-section"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Admin Control Surface
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "0.25rem 0 0", fontSize: "0.95rem" }}>
            Server-authoritative operational governance and monitoring desk.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            className="badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              padding: "0.4rem 0.75rem",
              fontSize: "0.85rem",
            }}
          >
            <Shield size={14} aria-hidden="true" />
            <span>Admin: {user?.email || "Superuser"}</span>
          </span>
        </div>
      </div>

      {/* Mandatory Server Authority Notice Banner */}
      <aside
        className="admin-authority-banner"
        data-testid="server-authority-notice"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.85rem 1.25rem",
          backgroundColor: "rgba(6, 182, 212, 0.08)",
          border: "1px solid rgba(6, 182, 212, 0.25)",
          borderRadius: "var(--radius-md)",
          marginBottom: "2rem",
          fontSize: "0.9rem",
          color: "var(--text-primary)",
        }}
      >
        <Shield size={20} style={{ color: "var(--accent-cyan, #06b6d4)", flexShrink: 0 }} aria-hidden="true" />
        <div>
          <strong>Server Authority Disclosure:</strong> All administrative actions and role evaluations are strictly server-authoritative and immutably audited.
        </div>
      </aside>

      {/* Navigation Tabs */}
      <nav
        className="admin-tab-nav"
        role="tablist"
        aria-label="Admin Control Surface Views"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          marginBottom: "2rem",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          role="tab"
          id="tab-overview"
          aria-selected={currentTab === "overview"}
          aria-controls="panel-overview"
          data-testid="admin-tab-overview"
          onClick={() => handleSelectTab("overview")}
          className={`tab-btn ${currentTab === "overview" ? "active" : ""}`}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: currentTab === "overview" ? "2px solid var(--accent-primary, #3b82f6)" : "2px solid transparent",
            color: currentTab === "overview" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: currentTab === "overview" ? 600 : 400,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          <Activity size={16} aria-hidden="true" />
          <span>Operational Overview</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-users"
          aria-selected={currentTab === "users"}
          aria-controls="panel-users"
          data-testid="admin-tab-users"
          onClick={() => handleSelectTab("users")}
          className={`tab-btn ${currentTab === "users" ? "active" : ""}`}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: currentTab === "users" ? "2px solid var(--accent-primary, #3b82f6)" : "2px solid transparent",
            color: currentTab === "users" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: currentTab === "users" ? 600 : 400,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          <Users size={16} aria-hidden="true" />
          <span>User Management</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-moderation"
          aria-selected={currentTab === "moderation"}
          aria-controls="panel-moderation"
          data-testid="admin-tab-moderation"
          onClick={() => handleSelectTab("moderation")}
          className={`tab-btn ${currentTab === "moderation" ? "active" : ""}`}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: currentTab === "moderation" ? "2px solid var(--accent-primary, #3b82f6)" : "2px solid transparent",
            color: currentTab === "moderation" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: currentTab === "moderation" ? 600 : 400,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          <Shield size={16} aria-hidden="true" />
          <span>Content Moderation</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-audit"
          aria-selected={currentTab === "audit"}
          aria-controls="panel-audit"
          data-testid="admin-tab-audit"
          onClick={() => handleSelectTab("audit")}
          className={`tab-btn ${currentTab === "audit" ? "active" : ""}`}
          style={{
            padding: "0.75rem 1.25rem",
            background: "none",
            border: "none",
            borderBottom: currentTab === "audit" ? "2px solid var(--accent-primary, #3b82f6)" : "2px solid transparent",
            color: currentTab === "audit" ? "var(--text-primary)" : "var(--text-secondary)",
            fontWeight: currentTab === "audit" ? 600 : 400,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.95rem",
            whiteSpace: "nowrap",
          }}
        >
          <Clock size={16} aria-hidden="true" />
          <span>Security & Audit Logs</span>
        </button>
      </nav>

      {/* Panels */}

      {/* 1. Overview Panel */}
      {currentTab === "overview" && (
        <section
          id="panel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          data-testid="admin-overview-panel"
        >
          {/* Loading State */}
          {isMetricsLoading && (
            <div
              role="status"
              aria-label="Loading system metrics"
              aria-busy="true"
              data-testid="admin-metrics-loading"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card" style={{ padding: "1.5rem", textAlign: "center" }}>
                  <div className="loading-spinner" aria-hidden="true" style={{ margin: "0 auto 0.75rem" }} />
                  <p className="text-muted text-sm">Loading metric...</p>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isMetricsLoading && isMetricsError && (
            <div
              className="card text-center"
              role="alert"
              data-testid="admin-metrics-error"
              style={{ padding: "2rem", marginBottom: "2rem", borderColor: "rgba(239, 68, 68, 0.3)" }}
            >
              <AlertTriangle size={36} style={{ color: "#ef4444", margin: "0 auto 0.75rem" }} aria-hidden="true" />
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Unable to load operational metrics</h2>
              <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
                {metricsError instanceof Error ? metricsError.message : "Failed to load metrics."}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => refetchMetrics()}
                style={{ margin: "0 auto" }}
              >
                <RotateCw size={14} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Success State: Metrics Cards */}
          {!isMetricsLoading && !isMetricsError && (
            <>
              <div
                className="metrics-grid"
                data-testid="admin-metrics-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "1.25rem",
                  marginBottom: "2rem",
                }}
              >
                {/* Metric 1: Total Users */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>Total Registered Users</span>
                    <Users size={18} style={{ color: "var(--accent-primary, #3b82f6)" }} aria-hidden="true" />
                  </div>
                  <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {metricsResponse?.data?.totalUsers ?? 0}
                  </div>
                  <div className="text-muted text-sm" style={{ marginTop: "0.25rem" }}>
                    {metricsResponse?.data?.activeUsers24h ?? 0} active in last 24h
                  </div>
                </div>

                {/* Metric 2: Active Simulation Sessions */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>Active Simulations</span>
                    <Activity size={18} style={{ color: "var(--level-beginner, #10b981)" }} aria-hidden="true" />
                  </div>
                  <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {metricsResponse?.data?.activeSimulationSessions ?? 0}
                  </div>
                  <div className="text-muted text-sm" style={{ marginTop: "0.25rem" }}>
                    Server-authoritative portfolio cycles
                  </div>
                </div>

                {/* Metric 3: Flagged Content */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>Flagged Content</span>
                    <Shield size={18} style={{ color: "var(--status-warning, #f59e0b)" }} aria-hidden="true" />
                  </div>
                  <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {metricsResponse?.data?.pendingReviewCount ?? 0}
                  </div>
                  <div className="text-muted text-sm" style={{ marginTop: "0.25rem" }}>
                    Pending moderator resolution
                  </div>
                </div>

                {/* Metric 4: System Health */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>System Health</span>
                    <Database size={18} style={{ color: "var(--accent-cyan, #06b6d4)" }} aria-hidden="true" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                    <CheckCircle2 size={20} style={{ color: "#10b981" }} aria-hidden="true" />
                    <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981" }}>
                      {metricsResponse?.data?.systemHealth || "HEALTHY"}
                    </span>
                  </div>
                  <div className="text-muted text-sm" style={{ marginTop: "0.5rem" }}>
                    Database: {metricsResponse?.data?.databaseStatus || "CONNECTED"}
                  </div>
                </div>
              </div>

              {/* Quick Jump Action Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1.25rem",
                  marginBottom: "2rem",
                }}
              >
                <div
                  className="card"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>User Governance</h2>
                    <p className="text-muted text-sm" style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                      Inspect learner accounts, manage active/suspended states, and review registered roles.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectTab("users")}
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>Open User Management</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>

                <div
                  className="card"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Content Moderation</h2>
                    <p className="text-muted text-sm" style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                      Review reported community posts and comments, dismiss false flags, or hide violating content.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectTab("moderation")}
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>Open Moderation Queue</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>

                <div
                  className="card"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Security & Audit Trail</h2>
                    <p className="text-muted text-sm" style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                      Inspect tamper-resistant security event logs, administrative interventions, and authentication history.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectTab("audit")}
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>Open Audit Logs</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* 2. User Management Panel */}
      {currentTab === "users" && (
        <section id="panel-users" role="tabpanel" aria-labelledby="tab-users">
          <AdminUserTable />
        </section>
      )}

      {/* 3. Content Moderation Panel */}
      {currentTab === "moderation" && (
        <section id="panel-moderation" role="tabpanel" aria-labelledby="tab-moderation">
          <AdminModerationQueue />
        </section>
      )}

      {/* 4. Security & Audit Panel */}
      {currentTab === "audit" && (
        <section id="panel-audit" role="tabpanel" aria-labelledby="tab-audit">
          <AdminAuditLogTable />
        </section>
      )}
    </main>
  );
};
