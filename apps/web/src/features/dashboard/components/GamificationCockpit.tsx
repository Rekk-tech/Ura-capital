import React from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../../simulation/hooks/useGamification";
import {
  Trophy,
  Award,
  Zap,
  Shield,
  Crown,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Lock,
} from "lucide-react";

export const GamificationCockpit: React.FC = () => {
  const { state } = useGamification();

  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const size = 20;
    const className = isUnlocked ? "text-amber-400" : "text-slate-400";
    switch (iconName) {
      case "shield":
        return <Shield size={size} className={className} />;
      case "zap":
        return <Zap size={size} className={className} />;
      case "crown":
        return <Crown size={size} className={className} />;
      default:
        return <Award size={size} className={className} />;
    }
  };

  return (
    <section
      className="gamification-cockpit-card p-6 md:p-8 rounded-2xl border shadow-sm flex flex-col gap-6"
      style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))",
        borderColor: "var(--color-border, #e2e8f0)",
      }}
      aria-label="Bảng Thành Tích & Cấp Độ Đầu Tư"
    >
      {/* 1. Header Level & XP Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #1d6ff2 0%, #6366f1 100%)",
              color: "#ffffff",
            }}
          >
            <Trophy size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                HỒ SƠ THỰC CHIẾN
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {state.xp} XP Tích Lũy
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {state.levelTitle}
            </h3>
          </div>
        </div>

        <Link
          to="/simulation"
          className="btn btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm self-start md:self-auto"
        >
          <Sparkles size={15} />
          <span>Vào Đấu Trường Giả Lập</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* 2. XP Progress Bar Towards Next Level */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">
            Tiến độ lên Level tiếp theo
          </span>
          <span className="font-bold text-slate-900 font-mono">
            {state.xp} / {state.nextLevelXp} XP ({state.progressPct}%)
          </span>
        </div>
        <div
          className="w-full h-3 rounded-full overflow-hidden bg-slate-200/80 p-0.5"
          role="progressbar"
          aria-valuenow={state.progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${state.progressPct}%`,
              background: "linear-gradient(90deg, #2563eb, #8b5cf6, #ec4899)",
              boxShadow: "0 0 8px rgba(139, 92, 246, 0.4)",
            }}
          />
        </div>
        <p className="text-[11px] text-slate-500 italic">
          * Cần thêm {Math.max(0, state.nextLevelXp - state.xp)} XP từ các vòng thi FOMO Arena, Pro Room hoặc hoàn thành trạm Academy để thăng hạng.
        </p>
      </div>

      {/* 3. Badges Collection Grid */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Bộ Sưu Tập Huy Hiệu Đầu Tư
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {state.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                badge.isUnlocked
                  ? "bg-amber-50/40 border-amber-300/60 shadow-sm"
                  : "bg-slate-50/60 border-slate-200 opacity-60"
              }`}
            >
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${
                  badge.isUnlocked
                    ? "bg-amber-100 text-amber-700 shadow-inner"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {badge.isUnlocked ? (
                  getBadgeIcon(badge.icon, true)
                ) : (
                  <Lock size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="text-xs font-bold text-slate-900 overflow-hidden text-ellipsis whitespace-nowrap">
                    {badge.name}
                  </h5>
                  {badge.isUnlocked && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      ĐÃ MỞ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-0.5">
                  {badge.subtitle}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Simulation Game Performance History */}
      {state.history.length > 0 && (
        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Lịch Sử Đấu Trường Giả Lập Gần Nhất
            </h4>
            <span className="text-xs text-slate-500 font-mono">
              {state.history.length} phiên đã hoàn thành
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.history.slice(0, 4).map((run) => (
              <div
                key={run.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {run.mapName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                      +{run.xpEarned} XP
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {run.scoreMetric}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-sm font-bold font-mono flex items-center justify-end gap-1 ${
                      run.returnPct >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {run.returnPct >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    <span>{run.returnPct >= 0 ? `+${run.returnPct}%` : `${run.returnPct}%`}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    NAV: {Math.round(run.finalNav / 1000000)}M đ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
