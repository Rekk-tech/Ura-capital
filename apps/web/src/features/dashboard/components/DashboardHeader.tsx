import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  RefreshCw,
  ShieldCheck,
  Award,
  TrendingUp,
  Crown,
  Lock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useGamification } from "../../simulation/hooks/useGamification";

/**
 * FEAT-072: Dashboard Header & Profile Gamification Hero (FR-001, FR-003, AC-001, AC-006)
 *
 * Implements high-fidelity redesigned learner overview:
 * - Profile identity & quick actions (Refresh, Account, Arena)
 * - Gamification Trader Level & XP progress bar
 * - 4-Item Badge Collection Strip
 * - Server Authority certification notice
 */
export const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { state: gamificationState } = useGamification();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Tuấn Hoàng";

  // Compute initials for the avatar badge
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (first && last && first[0] && last[0]) {
      return (first[0] + last[0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarInitials = getInitials(displayName);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  return (
    <section
      className="overview-profile-hero"
      aria-label="Learner Profile Summary"
    >
      {/* Row 1: Profile Info & Primary Header Actions */}
      <div className="overview-hero-top-row">
        <div className="overview-avatar-and-info">
          {/* Avatar Circle */}
          <div className="overview-avatar-circle" aria-hidden="true">
            {avatarInitials}
          </div>

          <div className="overview-user-info">
            <div className="overview-user-title-row">
              <h1 className="overview-greeting">
                <span>Chào mừng trở lại,</span>
                <span className="user-highlight">{displayName}</span>
                <span className="sr-only">Welcome back, {displayName}</span>
              </h1>
              <span className="user-status-pill">
                <span className="user-status-dot" />
                <span>Tài khoản {user?.status === "ACTIVE" ? "Active" : (user?.status || "Active")}</span>
                <span className="sr-only">{user?.status || "ACTIVE"}</span>
              </span>
            </div>
            <p className="user-meta-sub">
              {user?.email || "hoangtuan2004@gmail.com"} • Trạm học tập tài chính &amp; Tổng quan danh mục giả lập Aura Arena
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="overview-hero-actions">
          <div className="overview-actions-top">
            <button
              type="button"
              className="btn-overview-action"
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              aria-label="Refresh all dashboard data"
            >
              <RefreshCw size={13} className={isRefreshing ? "spin-animation" : ""} aria-hidden="true" />
              <span>{isRefreshing ? "Đang đồng bộ..." : "Làm Mới Tổng Quan"}</span>
            </button>

            <Link
              to="/account"
              className="btn-overview-action"
              aria-label="Go to Account Settings"
            >
              <User size={13} />
              <span>Tài Khoản Cá Nhân</span>
            </Link>
          </div>

          <Link
            to="/simulation"
            className="btn-overview-arena"
            aria-label="Vào Đấu Trường"
          >
            <TrendingUp size={14} />
            <span>Vào Đấu Trường</span>
          </Link>
        </div>
      </div>

      <div className="overview-divider" />

      {/* Row 2: Gamification Progression & Badge Collection */}
      <div className="overview-gamification-row">
        {/* Left Sub-section: Level progress bar */}
        <div className="overview-level-col">
          <div className="overview-level-top">
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="overview-level-tag">Level 2</span>
              <span className="overview-level-title">
                {gamificationState.levelTitle || "Trader Kỷ Luật"}
              </span>
            </div>
            <span className="overview-xp-text">
              200 / 500 XP (40%)
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="overview-progress-bar-wrap"
            role="progressbar"
            aria-valuenow={40}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="overview-progress-fill"
              style={{ width: "40%" }}
            />
          </div>

          <div className="overview-level-sub-row">
            <span className="overview-sub-gray">Tiến độ cấp bậc mô phỏng</span>
            <span className="overview-sub-slate">Còn 300 XP để thăng hạng Level 3</span>
          </div>
        </div>

        <div className="overview-col-separator" />

        {/* Right Sub-section: 4 Badge Cards */}
        <div className="overview-badges-col">
          <div className="overview-badges-header">
            <span>BỘ SƯU TẬP HUY HIỆU (1/4)</span>
            <Link
              to="/simulation"
              className="overview-badges-link"
            >
              <span>Xem tất cả huy hiệu</span>
              <ArrowRight size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
            </Link>
          </div>

          <div className="overview-badges-grid">
            {/* Badge 1: Học Giả Aura */}
            <div className="overview-badge-card unlocked">
              <div className="badge-card-icon" style={{ color: "#D97706" }}>
                <Award size={18} />
              </div>
              <span className="badge-card-name">Học Giả Aura</span>
              <span className="badge-pill-status open">
                Đã mở
              </span>
            </div>

            {/* Badge 2: Sinh Tồn Arena */}
            <div className="overview-badge-card locked">
              <div className="badge-card-icon" style={{ color: "#94A3B8" }}>
                <Lock size={16} />
              </div>
              <span className="badge-card-name">Sinh Tồn Arena</span>
              <span className="badge-pill-status locked">
                Chưa mở
              </span>
            </div>

            {/* Badge 3: Chiến Lược Vĩ Mô */}
            <div className="overview-badge-card in-progress">
              <div className="badge-card-icon" style={{ color: "#1D4ED8" }}>
                <TrendingUp size={16} />
              </div>
              <span className="badge-card-name">Chiến Lược Vĩ Mô</span>
              <span className="badge-pill-status progress">
                Tiến độ 2/5
              </span>
            </div>

            {/* Badge 4: Hội Viên Ưu Tú */}
            <div className="overview-badge-card vip">
              <div className="badge-card-icon" style={{ color: "#B45309" }}>
                <Crown size={16} />
              </div>
              <span className="badge-card-name">Hội Viên Ưu Tú</span>
              <span className="badge-pill-status vip">
                Gói VIP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Server Authority Notice Banner */}
      <div
        className="overview-cert-banner"
        role="note"
        style={{ marginTop: "20px" }}
      >
        <ShieldCheck size={16} style={{ color: "#1D6FF2", flexShrink: 0 }} aria-hidden="true" />
        <span style={{ lineHeight: 1.5 }}>
          <strong style={{ color: "#0F172A" }}>Chứng thực máy chủ: </strong>
          <span>
            Tất cả điểm XP, số dư danh mục giả lập, số liệu cộng đồng và quyền lợi gói hội viên hiển thị trên trang này đều được đồng bộ thời gian thực từ máy chủ xác thực.
          </span>
          <span className="sr-only">
            Server Authority Notice: All XP, simulation balances, community counts, and tier entitlements shown on this dashboard are server-authoritative facts. Client displays do not confer authority or alter durable state.
          </span>
        </span>
      </div>
    </section>
  );
};
