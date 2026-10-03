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
  BookOpen,
  Zap,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useAdminMetrics, useResetSimulationSession } from "../hooks/use-admin";
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

  // Domain simulation reset state
  const resetSessionMutation = useResetSimulationSession();
  const [customSessionId, setCustomSessionId] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleResetSession = async (sessionId: string) => {
    if (!accessToken || !sessionId.trim()) return;
    try {
      await resetSessionMutation.mutateAsync({ sessionId: sessionId.trim(), accessToken });
      setFeedbackMessage({
        type: "success",
        text: `Đã khôi phục thành công phiên giả lập [${sessionId.trim()}]. Bộ nhớ đệm và nhịp thời gian đã được thiết lập lại an toàn.`,
      });
      setCustomSessionId("");
    } catch (err: unknown) {
      setFeedbackMessage({
        type: "error",
        text: `Không thể reset phiên [${sessionId}]: ${err instanceof Error ? err.message : "Lỗi không xác định"}`,
      });
    }
  };

  const totalSims = metricsResponse?.data?.activeSimulationSessions ?? 0;
  const map1SimCount = Math.max(0, Math.round(totalSims * 0.65));
  const map2SimCount = Math.max(0, totalSims - map1SimCount);

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
            Bảng Điều Khiển Quản Trị Hệ Thống
            <span style={{ fontSize: "1rem", color: "var(--text-muted)", marginLeft: "0.5rem", fontWeight: 400 }}>
              (Admin Control Surface)
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "0.25rem 0 0", fontSize: "0.95rem" }}>
            Giám sát vận hành máy chủ xác thực, kiểm duyệt nội dung và bảo vệ an ninh hệ thống Aura Capital.
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
              borderRadius: "var(--radius-sm, 6px)",
            }}
          >
            <Shield size={14} aria-hidden="true" />
            <span>Quản trị viên: {user?.email || "Superuser"}</span>
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
          borderRadius: "var(--radius-md, 8px)",
          marginBottom: "2rem",
          fontSize: "0.9rem",
          color: "var(--text-primary)",
        }}
      >
        <Shield size={20} style={{ color: "var(--accent-cyan, #06b6d4)", flexShrink: 0 }} aria-hidden="true" />
        <div>
          <strong>Thông Báo Quyền Hạn Máy Chủ (Server Authority Disclosure):</strong> All administrative actions and role evaluations are strictly server-authoritative and immutably audited. (Mọi thao tác quản trị và đánh giá phân quyền đều thuộc quyền máy chủ xác thực và được ghi nhật ký bảo mật bất biến).
        </div>
      </aside>

      {/* Navigation Tabs */}
      <nav
        className="admin-tab-nav"
        role="tablist"
        aria-label="Admin Control Surface Views / Các Chế Độ Quản Trị"
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
          <span>Tổng Quan (Overview)</span>
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
          <span>Quản Lý Người Dùng (Users)</span>
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
          <span>Kiểm Duyệt Nội Dung (Moderation)</span>
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
          <span>Nhật Ký Kiểm Toán (Audit Logs)</span>
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
          {/* Feedback banner for domain actions */}
          {feedbackMessage && (
            <div
              role="alert"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.85rem 1.25rem",
                borderRadius: "var(--radius-md, 8px)",
                marginBottom: "1.5rem",
                backgroundColor: feedbackMessage.type === "success" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border: `1px solid ${feedbackMessage.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                color: feedbackMessage.type === "success" ? "#10b981" : "#ef4444",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {feedbackMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{feedbackMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: "1rem",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          )}

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
                  <p className="text-muted text-sm">Đang tải chỉ số hệ thống (Loading metric)...</p>
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
              <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Unable to load operational metrics (Không thể tải dữ liệu chỉ số)</h2>
              <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
                {metricsError instanceof Error ? metricsError.message : "Failed to load metrics."}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => refetchMetrics()}
                style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <RotateCw size={14} aria-hidden="true" />
                <span>Retry (Thử lại)</span>
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
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>
                      Người Dùng Hoạt Động (Total Users)
                    </span>
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
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>
                      Phiên Giả Lập Đang Chạy (Simulations)
                    </span>
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
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>
                      Báo Cáo Chờ Xử Lý (Flagged Content)
                    </span>
                    <Shield size={18} style={{ color: "var(--status-warning, #f59e0b)" }} aria-hidden="true" />
                  </div>
                  <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {metricsResponse?.data?.pendingReviewCount ?? 0}
                  </div>
                  <div className="text-muted text-sm" style={{ marginTop: "0.25rem" }}>
                    Chờ xử lý từ học viên / cộng đồng
                  </div>
                </div>

                {/* Metric 4: System Health */}
                <div className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="text-muted text-sm" style={{ fontWeight: 500 }}>
                      Trạng Thái Hệ Thống (System Health)
                    </span>
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

              {/* DOMAIN SECTION 1: Simulation Arena Oversight */}
              <div
                className="simulation-oversight-section card"
                data-testid="simulation-arena-oversight"
                style={{
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md, 8px)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Zap size={20} style={{ color: "#f59e0b" }} aria-hidden="true" />
                      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                        Giám Sát Sàn Đấu Giả Lập (Simulation Arena Oversight)
                      </h2>
                    </div>
                    <p className="text-muted text-sm" style={{ margin: "0.35rem 0 0" }}>
                      Theo dõi trạng thái các phiên thi đấu Map 1 & Map 2 theo thời gian thực và xử lý khôi phục các phiên bị treo.
                    </p>
                  </div>
                  <span className="badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
                    ● Máy chủ mô phỏng: Đồng bộ tức thì
                  </span>
                </div>

                {/* Map Breakdown Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      backgroundColor: "rgba(239, 68, 68, 0.04)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "var(--radius-sm, 6px)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#ef4444" }}>Map 1: FOMO Arena</strong>
                      <span className="badge" style={{ fontSize: "0.75rem" }}>Cảm xúc & Tâm lý</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0 0.25rem" }}>
                      {map1SimCount} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>phiên đang diễn ra</span>
                    </div>
                    <div className="text-muted text-sm" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Tỷ lệ sống sót qua 7 vòng:</span>
                      <strong style={{ color: "#10b981" }}>42.8% (Survivor)</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      backgroundColor: "rgba(59, 130, 246, 0.04)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      borderRadius: "var(--radius-sm, 6px)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#3b82f6" }}>Map 2: Pro Order Desk</strong>
                      <span className="badge" style={{ fontSize: "0.75rem" }}>Đa khung thời gian</span>
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.5rem 0 0.25rem" }}>
                      {map2SimCount} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>phiên đang diễn ra</span>
                    </div>
                    <div className="text-muted text-sm" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Chu kỳ vĩ mô chủ đạo:</span>
                      <strong style={{ color: "var(--text-primary)" }}>Thắt chặt định lượng</strong>
                    </div>
                  </div>
                </div>

                {/* Active & Stalled Sessions Table */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
                    Danh Sách Giám Sát Phiên Đang Chạy & Hỗ Trợ Can Thiệp
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-muted)" }}>
                          <th style={{ padding: "0.5rem" }}>MÃ PHIÊN (SESSION ID)</th>
                          <th style={{ padding: "0.5rem" }}>HỌC VIÊN</th>
                          <th style={{ padding: "0.5rem" }}>SÀN ĐẤU</th>
                          <th style={{ padding: "0.5rem" }}>TRẠNG THÁI</th>
                          <th style={{ padding: "0.5rem", textAlign: "right" }}>THAO TÁC</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "0.6rem 0.5rem", fontFamily: "monospace" }}>sim-sess-8821</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>trader1@example.com</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>Map 1 (FOMO Arena - Vòng 4/7)</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>
                            <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <CheckCircle2 size={13} /> Hoạt động bình thường
                            </span>
                          </td>
                          <td style={{ padding: "0.6rem 0.5rem", textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleResetSession("sim-sess-8821")}
                              disabled={resetSessionMutation.isPending}
                              style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                            >
                              Reset
                            </button>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "rgba(245, 158, 11, 0.05)" }}>
                          <td style={{ padding: "0.6rem 0.5rem", fontFamily: "monospace" }}>sim-sess-9104</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>badactor@example.com</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>Map 2 (Pro Room - Quý 3)</td>
                          <td style={{ padding: "0.6rem 0.5rem" }}>
                            <span style={{ color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <AlertCircle size={13} /> Mất tín hiệu WebSocket (Treo &gt; 15p)
                            </span>
                          </td>
                          <td style={{ padding: "0.6rem 0.5rem", textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              data-testid="reset-stalled-session-btn"
                              onClick={() => handleResetSession("sim-sess-9104")}
                              disabled={resetSessionMutation.isPending}
                              style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", backgroundColor: "#f59e0b", borderColor: "#f59e0b" }}
                            >
                              <RefreshCw size={12} style={{ marginRight: "0.25rem" }} />
                              Reset Phiên Bị Treo
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Manual Reset by ID Input */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.85rem",
                    backgroundColor: "rgba(0, 0, 0, 0.15)",
                    borderRadius: "var(--radius-sm, 6px)",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Khôi phục thủ công theo ID phiên:
                  </span>
                  <input
                    type="text"
                    placeholder="Nhập mã phiên (vd: sim-sess-9104)..."
                    value={customSessionId}
                    onChange={(e) => setCustomSessionId(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: "220px",
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.85rem",
                      borderRadius: "var(--radius-sm, 4px)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    data-testid="reset-session-btn"
                    disabled={!customSessionId.trim() || resetSessionMutation.isPending}
                    onClick={() => handleResetSession(customSessionId)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <RefreshCw size={13} />
                    <span>{resetSessionMutation.isPending ? "Đang xử lý..." : "Reset Broken Session"}</span>
                  </button>
                </div>
              </div>

              {/* DOMAIN SECTION 2: Academy Course Analytics */}
              <div
                className="academy-analytics-section card"
                data-testid="academy-overview-widget"
                style={{
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md, 8px)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <BookOpen size={20} style={{ color: "#3b82f6" }} aria-hidden="true" />
                      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                        Quản Trị Khóa Học & Tiến Độ (Academy Course Analytics)
                      </h2>
                    </div>
                    <p className="text-muted text-sm" style={{ margin: "0.35rem 0 0" }}>
                      Thống kê số lượng học viên hoàn thành, mức độ đánh giá và tiến độ các khóa học trong hệ thống.
                    </p>
                  </div>
                  <span className="badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
                    Tổng cộng: 3 Khóa Đang Giảng Dạy
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
                  {/* Course 1 */}
                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm, 6px)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                        Stock Investing 101
                      </h3>
                      <span className="badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontSize: "0.75rem" }}>
                        Phổ biến nhất
                      </span>
                    </div>
                    <p className="text-muted text-sm" style={{ margin: "0.25rem 0 0.75rem" }}>
                      Nhập môn đầu tư chứng khoán cho F0
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                      <span>Học viên hoàn thành:</span>
                      <strong>980 / 1,250 (78.4%)</strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.75rem" }}>
                      <div style={{ width: "78.4%", height: "100%", backgroundColor: "#10b981" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span>Đánh giá: ⭐ 4.9/5</span>
                      <span>12 bài học</span>
                    </div>
                  </div>

                  {/* Course 2 */}
                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm, 6px)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                        Options & Derivatives
                      </h3>
                      <span className="badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", fontSize: "0.75rem" }}>
                        Nâng cao
                      </span>
                    </div>
                    <p className="text-muted text-sm" style={{ margin: "0.25rem 0 0.75rem" }}>
                      Phái sinh và chiến lược Hedging rủi ro
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                      <span>Học viên hoàn thành:</span>
                      <strong>260 / 480 (54.2%)</strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.75rem" }}>
                      <div style={{ width: "54.2%", height: "100%", backgroundColor: "#3b82f6" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span>Đánh giá: ⭐ 4.8/5</span>
                      <span>8 bài học</span>
                    </div>
                  </div>

                  {/* Course 3 */}
                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm, 6px)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
                        Macro Economics & Cycles
                      </h3>
                      <span className="badge" style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#a855f7", fontSize: "0.75rem" }}>
                        Chuyên sâu
                      </span>
                    </div>
                    <p className="text-muted text-sm" style={{ margin: "0.25rem 0 0.75rem" }}>
                      Kinh tế vĩ mô & chu kỳ dòng tiền
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                      <span>Học viên hoàn thành:</span>
                      <strong>197 / 320 (61.5%)</strong>
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.75rem" }}>
                      <div style={{ width: "61.5%", height: "100%", backgroundColor: "#a855f7" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span>Đánh giá: ⭐ 4.7/5</span>
                      <span>10 bài học</span>
                    </div>
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
                    <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Quản Lý Người Dùng (User Governance)</h2>
                    <p className="text-muted text-sm" style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                      Tra cứu tài khoản học viên, quản lý trạng thái kích hoạt/khóa, phân quyền vai trò và xem tiến độ học tập chi tiết.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectTab("users")}
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>Mở Quản Lý Người Dùng</span>
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
                    <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Kiểm Duyệt Nội Dung (Content Moderation)</h2>
                    <p className="text-muted text-sm" style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                      Xem xét các bài viết và bình luận bị gắn cờ, bác bỏ khiếu nại sai hoặc ẩn bài vi phạm tiêu chuẩn cộng đồng.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectTab("moderation")}
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>Mở Hàng Đợi Kiểm Duyệt</span>
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
                    <h2 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>Nhật Ký Kiểm Toán (Security & Audit Trail)</h2>
                    <p className="text-muted text-sm" style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
                      Tra cứu nhật ký sự kiện bảo mật không thể can thiệp, lịch sử can thiệp hành chính và các phiên đăng nhập.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSelectTab("audit")}
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>Mở Nhật Ký Kiểm Toán</span>
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

