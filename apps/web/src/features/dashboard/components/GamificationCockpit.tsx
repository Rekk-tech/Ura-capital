import React from "react";
import { Link } from "react-router-dom";
import { useGamification } from "../../simulation/hooks/useGamification";
import {
  Award,
  Zap,
  Shield,
  Crown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Lock,
} from "lucide-react";

export const GamificationCockpit: React.FC = () => {
  const { state } = useGamification();

  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const size = 18;
    const className = isUnlocked ? "text-amber-500" : "text-slate-400";
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

  const latestRun = state.history && state.history.length > 0 ? state.history[0] : null;
  const unlockedCount = state.badges.filter((b) => b.isUnlocked).length;

  return (
    <section
      className="gamification-cockpit-card p-5 md:p-6 rounded-2xl border border-slate-200/90 bg-white shadow-xs"
      aria-label="Bảng Thành Tích & Cấp Độ Đầu Tư"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: 40% (5/12 cols) - Rank, XP Progress, and Latest Match */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                HỒ SƠ THỰC CHIẾN
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {state.xp} XP Tích Lũy
              </span>
            </div>
            <Link
              to="/simulation"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>Vào Đấu Trường</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              {state.levelTitle}
            </h3>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Tiến độ cấp độ</span>
                <span className="font-bold text-slate-800">
                  {state.xp} / {state.nextLevelXp} XP ({state.progressPct}%)
                </span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden bg-slate-100"
                role="progressbar"
                aria-valuenow={state.progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out bg-indigo-600"
                  style={{ width: `${state.progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Latest Simulation Result */}
          <div className="text-xs text-slate-500 flex items-center gap-2 pt-1 flex-wrap">
            {latestRun ? (
              <>
                <span className="font-semibold text-slate-700">Phiên gần nhất:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {latestRun.mapName}
                </span>
                <span
                  className={`font-mono font-bold inline-flex items-center gap-0.5 ${
                    latestRun.returnPct >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {latestRun.returnPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{latestRun.returnPct >= 0 ? `+${latestRun.returnPct}%` : `${latestRun.returnPct}%`}</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  (+{latestRun.xpEarned} XP)
                </span>
              </>
            ) : (
              <span className="text-slate-400 italic">
                Chưa có phiên thi đấu gần đây. Tham gia FOMO Arena để tích lũy XP!
              </span>
            )}
          </div>
        </div>

        {/* Right Side: 60% (7/12 cols) - 4-Column Badge Grid */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Bộ Sưu Tập Huy Hiệu ({unlockedCount}/4)</span>
            <span className="text-[11px] font-normal normal-case text-slate-400">
              Mở khóa qua các cột mốc thực chiến
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {state.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border flex flex-col items-center text-center justify-center gap-1.5 transition-all ${
                  badge.isUnlocked
                    ? "bg-amber-50/40 border-amber-200/80 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200/70 opacity-60"
                }`}
                title={badge.description}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    badge.isUnlocked ? "bg-amber-100 text-amber-700 shadow-inner" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {badge.isUnlocked ? getBadgeIcon(badge.icon, true) : <Lock size={16} />}
                </div>
                <span className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">
                  {badge.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    badge.isUnlocked ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {badge.isUnlocked ? "Đã mở" : "Chưa mở"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
