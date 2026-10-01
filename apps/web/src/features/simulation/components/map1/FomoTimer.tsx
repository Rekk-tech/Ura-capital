import React from "react";
import type { Map1Phase } from "../../types/map-game.types";
import { Clock } from "lucide-react";

interface FomoTimerProps {
  round: number;
  totalRounds: number;
  roundName: string;
  phase: Map1Phase;
  secondInRound: number;
  roundDurationSeconds: number;
  timeRemainingInPhase: number;
  cash: number;
  shares: number;
  currentPrice: number;
  nav: number;
  initialCash: number;
}

export const FomoTimer: React.FC<FomoTimerProps> = ({
  round,
  totalRounds,
  roundName,
  phase: _phase,
  secondInRound,
  roundDurationSeconds,
  cash,
  shares,
  currentPrice,
  nav: _nav,
  initialCash,
}) => {
  // Strict Financial KPI Math
  const safeCash = cash ?? 0;
  const safeShares = shares ?? 0;
  const safePrice = currentPrice ?? 0;
  const safeInitialCash = initialCash || 10000000;
  const marketValueOfPositions = safeShares * safePrice;
  const totalAssets = safeCash + marketValueOfPositions;
  const unrealizedPnlAmount = totalAssets - safeInitialCash;
  const unrealizedPnlPercent = Number(((unrealizedPnlAmount / safeInitialCash) * 100).toFixed(2));
  const isPnlPositive = unrealizedPnlAmount >= 0;

  const safeRoundDuration = roundDurationSeconds ?? 45;
  const safeSecondInRound = secondInRound ?? 0;
  const secondsLeft = Math.max(0, safeRoundDuration - safeSecondInRound);
  const formattedSeconds = String(secondsLeft).padStart(2, "0");
  const isWarningTimer = secondsLeft <= 10;

  const currentRoundNum = round || 1;
  const totalRoundNum = totalRounds || 7;
  const progressPercent = Math.round((currentRoundNum / totalRoundNum) * 100);

  return (
    <header className="fomo-cockpit-header flex flex-col gap-2.5 w-full">
      {/* 1. Top Status Strip */}
      <div className="fomo-top-strip">
        <div className="flex items-center gap-2">
          <span className="fomo-badge-map">
            <span>🚩</span>
            <span>MAP 1: KHỞI ĐỘNG</span>
          </span>

          <span className="fomo-badge-vnindex">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Simulated VN-Index Live Feed</span>
          </span>
        </div>

        <div className="fomo-stress-badge">
          <span>🧠</span>
          <span>Psychological Stress Test Active</span>
        </div>
      </div>

      {/* 2. Round Sub-Header & 3 Horizontal KPI Cards */}
      <div className="fomo-sub-header">
        {/* Left: Round Name, Timer, Progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Round {currentRoundNum}/{totalRoundNum}:</span>
              <span>{roundName}</span>
            </h2>

            {/* Circular / Pill 45s Countdown Timer */}
            <div
              className={`fomo-timer-pill ${
                isWarningTimer ? "animate-pulse" : ""
              }`}
            >
              <Clock size={12} className={isWarningTimer ? "text-rose-600" : "text-emerald-600"} />
              <span>00:{formattedSeconds}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="w-32 sm:w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Progress: {currentRoundNum} of {totalRoundNum} Rounds Complete &nbsp;{progressPercent}% Complete
            </span>
          </div>
        </div>

        {/* Right: 3 Horizontal Compact KPI Cards */}
        <div className="fomo-kpi-row">
          {/* TOTAL ASSETS */}
          <div className="fomo-kpi-card">
            <span className="fomo-kpi-label">
              TOTAL ASSETS
            </span>
            <div className="flex items-baseline">
              <span className="fomo-kpi-value">
                {totalAssets.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] font-bold text-slate-400 ml-1">VND</span>
            </div>
          </div>

          {/* AVAILABLE CASH */}
          <div className="fomo-kpi-card">
            <span className="fomo-kpi-label">
              AVAILABLE CASH
            </span>
            <div className="flex items-baseline">
              <span className="fomo-kpi-value">
                {safeCash.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] font-bold text-slate-400 ml-1">VND</span>
            </div>
          </div>

          {/* UNREALIZED P&L */}
          <div className="fomo-kpi-card">
            <span className="fomo-kpi-label">
              → UNREALIZED P&amp;L
            </span>
            <div className="flex items-baseline">
              <span className="fomo-kpi-value flex items-center gap-0.5">
                {unrealizedPnlAmount === 0 ? "0" : (isPnlPositive ? `+${unrealizedPnlAmount.toLocaleString("vi-VN")}` : unrealizedPnlAmount.toLocaleString("vi-VN"))}
              </span>
              <span className="text-[10px] font-bold text-slate-400 ml-1">VND</span>
              <span className="text-[10px] font-semibold text-slate-500 ml-1">
                ({unrealizedPnlPercent >= 0 ? `+${unrealizedPnlPercent.toFixed(2)}` : unrealizedPnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
