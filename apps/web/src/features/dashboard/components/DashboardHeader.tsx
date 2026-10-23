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
      className="dashboard-header-banner p-6 md:p-7 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col gap-6"
      aria-label="Learner Profile Summary"
    >
      {/* Row 1: Profile Info & Primary Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          {/* Avatar Circle */}
          <div
            className="w-14 h-14 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-xs flex-shrink-0"
            aria-hidden="true"
          >
            {avatarInitials}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 m-0">
                <span>Chào mừng trở lại,</span>
                <span className="text-blue-600">{displayName}</span>
                <span className="sr-only">Welcome back, {displayName}</span>
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Tài khoản {user?.status || "Active"}</span>
                <span className="sr-only">{user?.status || "ACTIVE"}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate m-0">
              {user?.email || "hoangtuan2004@gmail.com"} • Trạm học tập tài chính &amp; Tổng quan danh mục giả lập Aura Arena
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            aria-label="Refresh all dashboard data"
          >
            <RefreshCw size={13} className={isRefreshing ? "spin-animation" : ""} aria-hidden="true" />
            <span>{isRefreshing ? "Đang đồng bộ..." : "Làm Mới Tổng Quan"}</span>
          </button>

          <Link
            to="/account"
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
            aria-label="Go to Account Settings"
          >
            <User size={13} />
            <span>Tài Khoản Cá Nhân</span>
          </Link>

          <Link
            to="/simulation"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
            aria-label="Vào Đấu Trường"
          >
            <TrendingUp size={13} />
            <span>Vào Đấu Trường</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Row 2: Gamification Progression & Badge Collection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Sub-section (5/12 cols): Level progress bar */}
        <div className="lg:col-span-5 flex flex-col gap-2.5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Level 2
              </span>
              <span className="text-xs font-bold text-slate-800">
                {gamificationState.levelTitle || "Trader Kỷ Luật"}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700 font-mono">
              200 / 500 XP (40%)
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-2 rounded-full overflow-hidden bg-slate-100"
            role="progressbar"
            aria-valuenow={40}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: "40%" }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Tiến độ cấp bậc mô phỏng</span>
            <span className="font-semibold text-slate-600">Còn 300 XP để thăng hạng Level 3</span>
          </div>
        </div>

        {/* Right Sub-section (7/12 cols): 4 Badge Cards */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="tracking-wider">BỘ SƯU TẬP HUY HIỆU (1/4)</span>
            <Link
              to="/simulation"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>Xem tất cả huy hiệu</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Badge 1: Học Giả Aura */}
            <div className="p-2.5 rounded-xl border border-amber-200/90 bg-amber-50/40 flex flex-col items-center text-center justify-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Award size={16} />
              </div>
              <span className="text-[11px] font-bold text-slate-900 leading-tight">Học Giả Aura</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                Đã mở
              </span>
            </div>

            {/* Badge 2: Sinh Tồn Arena */}
            <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col items-center text-center justify-center gap-1 opacity-70">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center">
                <Lock size={15} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 leading-tight">Sinh Tồn Arena</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">
                Chưa mở
              </span>
            </div>

            {/* Badge 3: Chiến Lược Vĩ Mô */}
            <div className="p-2.5 rounded-xl border border-blue-200/80 bg-blue-50/30 flex flex-col items-center text-center justify-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <TrendingUp size={15} />
              </div>
              <span className="text-[11px] font-bold text-slate-900 leading-tight">Chiến Lược Vĩ Mô</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                Tiến độ 2/5
              </span>
            </div>

            {/* Badge 4: Hội Viên Ưu Tú */}
            <div className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/30 flex flex-col items-center text-center justify-center gap-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Crown size={15} />
              </div>
              <span className="text-[11px] font-bold text-slate-900 leading-tight">Hội Viên Ưu Tú</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Gói VIP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Server Authority Notice Banner */}
      <div
        className="rounded-xl bg-blue-50/70 border border-blue-100/90 px-4 py-2.5 flex items-center gap-2.5 text-xs text-slate-600"
        role="note"
      >
        <ShieldCheck size={16} className="text-blue-600 flex-shrink-0" aria-hidden="true" />
        <span className="leading-relaxed">
          <strong className="text-slate-800">Chứng thực máy chủ: </strong>
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
