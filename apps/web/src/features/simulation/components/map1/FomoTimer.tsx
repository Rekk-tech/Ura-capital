import React from "react";
import type { Map1Phase } from "../../types/map-game.types";
import { Clock, AlertTriangle, TrendingUp, ShieldCheck } from "lucide-react";

interface FomoTimerProps {
  round: number;
  totalRounds: number;
  phase: Map1Phase;
  secondInRound: number;
  roundDurationSeconds: number;
  timeRemainingInPhase: number;
}

export const FomoTimer: React.FC<FomoTimerProps> = ({
  round,
  totalRounds,
  phase,
  secondInRound,
  roundDurationSeconds,
  timeRemainingInPhase,
}) => {
  // SVG circle circumference for r = 40: 2 * PI * 40 = 251.327
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(1, Math.max(0, secondInRound / roundDurationSeconds));
  const strokeDashoffset = circumference - progressRatio * circumference;

  const phaseColors: Record<Map1Phase, { text: string; bg: string; stroke: string; label: string }> = {
    news_and_trap: {
      text: "text-emerald-500",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      stroke: "#10B981",
      label: "TIN TỨC & DÒ ĐÁY (0s - 10s)",
    },
    trading_window: {
      text: "text-amber-500",
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      stroke: "#F59E0B",
      label: "CỬA SỔ ĐẶT LỆNH (10s - 30s)",
    },
    trap_or_quiz: {
      text: "text-rose-500",
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      stroke: "#EF4444",
      label: "BẪY TÂM LÝ / BÀI TẬP (30s - 40s)",
    },
    ledger_update: {
      text: "text-blue-500",
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      stroke: "#3B82F6",
      label: "KHỚP LỆNH & CHỐT NAV (40s - 45s)",
    },
  };

  const currentPhaseInfo = phaseColors[phase] || phaseColors.trading_window;

  return (
    <div className="fomo-timer-card card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Circular Timer */}
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100" aria-label="Circular countdown timer">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={currentPhaseInfo.stroke}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300 ease-linear"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold font-mono text-slate-800">
              {45 - secondInRound}s
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Còn lại
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              Round {round} / {totalRounds}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentPhaseInfo.bg}`}>
              {currentPhaseInfo.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Thời gian còn lại trong pha: <strong className="font-mono text-slate-700">{timeRemainingInPhase}s</strong>
          </p>
        </div>
      </div>

      {/* 4-Phase Timeline Bar */}
      <div className="w-full md:w-1/2 flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
          <span>0s Tin tức</span>
          <span>10s Đặt lệnh</span>
          <span>30s Bẫy/Quiz</span>
          <span>40s Khớp</span>
          <span>45s</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex relative border border-slate-200">
          <div className={`h-full ${secondInRound < 10 ? "bg-emerald-500" : "bg-emerald-200"}`} style={{ width: "22.2%" }} title="Pha 1: Tin tức (0-10s)" />
          <div className={`h-full ${secondInRound >= 10 && secondInRound < 30 ? "bg-amber-500" : "bg-amber-200"}`} style={{ width: "44.4%" }} title="Pha 2: Đặt lệnh (10-30s)" />
          <div className={`h-full ${secondInRound >= 30 && secondInRound < 40 ? "bg-rose-500" : "bg-rose-200"}`} style={{ width: "22.2%" }} title="Pha 3: Bẫy/Quiz (30-40s)" />
          <div className={`h-full ${secondInRound >= 40 ? "bg-blue-500" : "bg-blue-200"}`} style={{ width: "11.2%" }} title="Pha 4: Khớp lệnh (40-45s)" />

          {/* Current needle cursor */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-slate-900 rounded-full shadow-md -ml-0.5 transition-all duration-300 ease-linear"
            style={{ left: `${progressRatio * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {phase === "news_and_trap" && <Clock size={13} className="text-emerald-600" />}
          {phase === "trading_window" && <TrendingUp size={13} className="text-amber-600" />}
          {phase === "trap_or_quiz" && <AlertTriangle size={13} className="text-rose-600" />}
          {phase === "ledger_update" && <ShieldCheck size={13} className="text-blue-600" />}
          <span>
            {phase === "news_and_trap" && "Đọc tin nhanh và quan sát phản ứng thị trường."}
            {phase === "trading_window" && "Cửa sổ lệnh mở! Đặt lệnh Mua, Bán hoặc Giữ."}
            {phase === "trap_or_quiz" && "Thị trường chững lại. Nhận diện bẫy tâm lý hoặc trả lời câu hỏi kỷ luật."}
            {phase === "ledger_update" && "Sàn khớp lệnh, khấu trừ phí 0.15% và kiểm tra Margin Call."}
          </span>
        </div>
      </div>
    </div>
  );
};
