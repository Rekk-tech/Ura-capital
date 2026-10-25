import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Shield,
  GraduationCap,
  Award,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface WorkspaceOption {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  allowedRoles: string[];
  tagClass: string;
  allowedItems: string[];
  restrictedItems: string[];
}

const WORKSPACE_OPTIONS: WorkspaceOption[] = [
  {
    id: "learner",
    title: "Không Gian Học Viên F0",
    badge: "LEARNER",
    icon: <GraduationCap size={24} className="text-blue-600" />,
    path: "/dashboard",
    description: "Học viện Aura Academy, thi đấu Map 1 FOMO Arena & Map 2 Pro Room, quản trị danh mục cá nhân.",
    allowedRoles: ["LEARNER", "USER", "BROKER", "MODERATOR", "SYSTEM_ADMIN", "ADMIN"],
    tagClass: "role-tag-learner",
    allowedItems: [
      "Học tập toàn bộ giáo trình cơ sở & nâng cao",
      "Thực chiến thi đấu tại Map 1 & Map 2",
      "Gia nhập Exclusive Room của Broker xác thực",
      "Đăng bài & thảo luận văn minh trên Cộng đồng",
    ],
    restrictedItems: [
      "Không được can thiệp hệ thống quản trị Admin",
      "Không được tự ý xuất bản phòng tư vấn thu phí",
    ],
  },
  {
    id: "broker",
    title: "Phòng Độc Quyền Của Broker",
    badge: "BROKER",
    icon: <Award size={24} className="text-emerald-600" />,
    path: "/broker-hub",
    description: "Quản trị Exclusive Room, đăng tín hiệu tư vấn, gắn mã CCHN UBCKNN và tương tác với học viên.",
    allowedRoles: ["BROKER", "SYSTEM_ADMIN", "ADMIN"],
    tagClass: "role-tag-broker",
    allowedItems: [
      "Quản trị và xuất bản Exclusive Room riêng",
      "Đăng tài liệu bài giảng chuyên sâu & nhận định",
      "Tạo kịch bản bài tập thực chiến gắn với Simulation",
      "Xem đối soát doanh thu vé vào phòng minh bạch",
    ],
    restrictedItems: [
      "Không được sửa giáo trình gốc của Aura Academy",
      "Không có quyền can thiệp kiểm duyệt hoặc phân quyền SoD",
    ],
  },
  {
    id: "moderator",
    title: "Trung Tâm Kiểm Duyệt Nội Dung",
    badge: "MODERATOR",
    icon: <Shield size={24} className="text-cyan-600" />,
    path: "/admin",
    description: "Biên tập giáo trình Academy, kiểm duyệt bài viết cộng đồng và tạm khóa người dùng vi phạm.",
    allowedRoles: ["MODERATOR", "SYSTEM_ADMIN", "ADMIN"],
    tagClass: "role-tag-moderator",
    allowedItems: [
      "Biên tập & cập nhật giáo trình khóa học Academy",
      "Xử lý hàng đợi báo cáo vi phạm cộng đồng",
      "Tạm khóa (mute) tài khoản vi phạm tối đa 24 giờ",
      "Hạ gỡ nội dung Broker vi phạm cam kết lợi nhuận",
    ],
    restrictedItems: [
      "Không được thay đổi vai trò hoặc khóa vĩnh viễn tài khoản",
      "Không được can thiệp biểu phí sàn hay dữ liệu tài chính",
    ],
  },
  {
    id: "admin",
    title: "Admin Console Tối Cao",
    badge: "SYSTEM_ADMIN",
    icon: <ShieldAlert size={24} className="text-rose-600" />,
    path: "/admin",
    description: "Toàn quyền quản trị hệ thống, thẩm định CCHN Broker, phân quyền SoD và kiểm toán bảo mật bất biến.",
    allowedRoles: ["SYSTEM_ADMIN", "ADMIN"],
    tagClass: "role-tag-admin",
    allowedItems: [
      "Thẩm định hồ sơ CCHN UBCKNN & cấp tích xanh Broker",
      "Phân quyền Segregation of Duties (SoD) cho mọi vai trò",
      "Khóa / mở khóa tài khoản toàn hệ thống",
      "Tra cứu nhật ký kiểm toán bất biến (Immutable Audit Logs)",
    ],
    restrictedItems: [
      "Bị khóa logic: Tuyệt đối không thể tự hạ quyền của chính mình",
      "Bị khóa logic: Không thể tự khóa tài khoản của chính mình",
    ],
  },
];

export const RoleGatewayPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();

  const rawReturnTo = searchParams.get("returnTo");

  // Determine user's active canonical role
  const currentRole = (user?.role || "LEARNER").toUpperCase();

  // Pick initial workspace based on user role
  const getDefaultWorkspaceId = () => {
    if (currentRole === "SYSTEM_ADMIN" || currentRole === "ADMIN") return "admin";
    if (currentRole === "MODERATOR") return "moderator";
    if (currentRole === "BROKER") return "broker";
    return "learner";
  };

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(getDefaultWorkspaceId());

  // Redirect to login if unauthenticated
  if (!isAuthenticated || !user) {
    navigate("/login?returnTo=/auth/role-gateway", { replace: true });
    return null;
  }

  const selectedWorkspace: WorkspaceOption =
    WORKSPACE_OPTIONS.find((w) => w.id === selectedWorkspaceId) ?? (WORKSPACE_OPTIONS[0] as WorkspaceOption);

  const handleEnterWorkspace = () => {
    if (rawReturnTo && rawReturnTo.startsWith("/")) {
      navigate(rawReturnTo, { replace: true });
    } else {
      navigate(selectedWorkspace.path);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getUserRoleTagClass = () => {
    if (currentRole === "SYSTEM_ADMIN" || currentRole === "ADMIN") return "role-tag-admin";
    if (currentRole === "MODERATOR") return "role-tag-moderator";
    if (currentRole === "BROKER") return "role-tag-broker";
    return "role-tag-learner";
  };

  return (
    <main className="role-gateway-container" id="main-content" data-testid="role-gateway-page">
      <div className="role-gateway-wrapper">
        {/* Gateway Header Banner */}
        <header className="role-gateway-header">
          <div className="gateway-badge-pill">
            <Sparkles size={14} className="text-accent" />
            <span>Xác Nhận Vai Trò &amp; Phân Quyền Hệ Thống</span>
          </div>
          <h1 className="gateway-title">Chào Mừng Trở Lại, {user.displayName || user.email}</h1>
          <p className="gateway-subtitle">
            Hệ sinh thái Aura Capital vận hành theo nguyên tắc <strong>Phân tách trách nhiệm (Segregation of Duties - SoD)</strong>. Vui lòng xác nhận vai trò và chọn không gian làm việc cho phiên này:
          </p>
        </header>

        {/* User Identity & Active Credential Card */}
        <section className="gateway-user-identity-card" aria-label="Thông tin tài khoản xác thực">
          <div className="user-identity-main">
            <div className="user-avatar-circle" aria-hidden="true">
              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="user-meta-info">
              <div className="user-name-row">
                <span className="user-display-name">{user.displayName || "Thành viên Aura"}</span>
                <span className={`role-tag-pill ${getUserRoleTagClass()}`}>
                  {currentRole}
                </span>
              </div>
              <div className="user-email-text">{user.email}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            title="Đăng xuất khỏi phiên hiện tại"
          >
            <LogOut size={14} aria-hidden="true" />
            <span>Đổi Tài Khoản</span>
          </button>
        </section>

        {/* Workspace Persona Selection Grid */}
        <section className="gateway-workspaces-section" aria-label="Lựa chọn không gian làm việc">
          <h2 className="section-label">1. Lựa Chọn Không Gian Làm Việc (Workspace Persona)</h2>
          <div className="workspace-cards-grid">
            {WORKSPACE_OPTIONS.map((ws) => {
              const isPermitted =
                ws.allowedRoles.includes(currentRole) ||
                (currentRole === "SYSTEM_ADMIN" && ws.id !== "learner") ||
                (currentRole === "ADMIN" && ws.id !== "learner");

              const isSelected = selectedWorkspaceId === ws.id;

              return (
                <button
                  key={ws.id}
                  type="button"
                  className={`workspace-card ${isSelected ? "selected" : ""} ${
                    !isPermitted ? "disabled" : ""
                  }`}
                  onClick={() => isPermitted && setSelectedWorkspaceId(ws.id)}
                  disabled={!isPermitted}
                  aria-pressed={isSelected}
                  id={`ws-card-${ws.id}`}
                  data-testid={`ws-card-${ws.id}`}
                >
                  <div className="workspace-card-header">
                    <div className="workspace-icon-wrap" aria-hidden="true">
                      {ws.icon}
                    </div>
                    <span className={`role-tag-pill ${ws.tagClass}`}>{ws.badge}</span>
                  </div>
                  <h3 className="workspace-title">{ws.title}</h3>
                  <p className="workspace-desc">{ws.description}</p>
                  <div className="workspace-card-footer">
                    {isPermitted ? (
                      <span className="access-status granted">
                        <CheckCircle2 size={14} /> {isSelected ? "✓ Đang Chọn" : "Có Quyền Truy Cập"}
                      </span>
                    ) : (
                      <span className="access-status locked">
                        <Lock size={14} /> Yêu Cầu Cấp Quyền
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Detailed SoD Governance Scope for Selected Workspace */}
        <section
          className="gateway-sod-scope-card"
          aria-label="Phạm vi quyền hạn và trách nhiệm SoD"
        >
          <div className="scope-header">
            <h2 className="section-label">
              2. Ma Trận Quyền Hạn &amp; Giới Hạn Tuân Thủ: <strong>{selectedWorkspace.title}</strong>
            </h2>
            <span className="scope-so-pill">Nguyên tắc SoD Boundary</span>
          </div>

          <div className="scope-details-grid">
            <div className="scope-col allowed-col">
              <div className="col-title text-success">
                <CheckCircle2 size={16} />
                <span>Quyền Hạn Được Phép (Granted Scope)</span>
              </div>
              <ul className="scope-list">
                {selectedWorkspace.allowedItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="scope-col restricted-col">
              <div className="col-title text-warning">
                <Lock size={16} />
                <span>Ràng Buộc &amp; Giới Hạn (Governance Boundaries)</span>
              </div>
              <ul className="scope-list">
                {selectedWorkspace.restrictedItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Action Confirmation Footer */}
        <footer className="gateway-action-bar">
          <div className="action-note">
            <span>
              Đích đến tiếp theo: <code>{selectedWorkspace.path}</code>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-lg gateway-enter-btn"
            onClick={handleEnterWorkspace}
            id="gateway-confirm-btn"
          >
            <span>Vào {selectedWorkspace.title}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </main>
  );
};
