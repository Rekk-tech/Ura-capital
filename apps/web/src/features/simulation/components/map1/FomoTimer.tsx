import React from "react";
import type { Map1Phase } from "../../types/map-game.types";
import { Clock, TrendingUp, TrendingDown, Flame, Radio } from "lucide-react";

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
  phase,
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

  // 4-Phase Micro-Timeline configuration
  const phaseList: Array<{
    key: Map1Phase;
    label: string;
    range: string;
  }> = [
    { key: "news_and_trap", label: "1. ĐỌC TIN TỨC", range: "0-10s" },
    { key: "trading_window", label: "2. ĐẶT LỆNH", range: "10-30s" },
    { key: "trap_or_quiz", label: "3. NÉ BẪY / QUIZ", range: "30-40s" },
    { key: "ledger_update", label: "4. KHỚP LỆNH & NAV", range: "40-45s" },
  ];

  return (
    <header className="fomo-cockpit-status-bar card-aura p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col gap-3">
      {/* Top Bar: Left Tag & Feed, Right Phase Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg font-black uppercase tracking-wider text-[11px] bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
            <Flame size={13} className="text-amber-500" />
            <span>🔥 MAP 1: FOMO ARENA</span>
          </span>

          <span className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center gap-1.5 shadow-xs">
            <Radio size={12} className="text-emerald-500 animate-pulse" />
            <span className="font-mono">VN-INDEX: 1,284.50 (+0.42%)</span>
          </span>
        </div>

        {/* 4-Phase Micro-Timeline indicators */}
        <div className="flex items-center gap-1">
          {phaseList.map((p) => {
            const isActive = phase === p.key;
            return (
              <span
                key={p.key}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs ring-1 ring-slate-900"
                    : "bg-slate-50 text-slate-400 border border-slate-200/60"
                }`}
                title={p.range}
              >
                {p.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main KPI Row: Center-Left Round & Countdown | Right 3 KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-1 border-t border-slate-100">
        {/* Center-Left: Round Title, Timer & Progress (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Round {currentRoundNum}/{totalRoundNum}:</span>
                <span className="text-blue-600">{roundName}</span>
              </h2>
            </div>

            {/* Circular / Pill 45s Countdown Timer */}
            <div
              className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-black flex items-center gap-1.5 shadow-xs border transition-all ${
                isWarningTimer
                  ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse shadow-rose-100"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              <Clock size={14} className={isWarningTimer ? "text-rose-600" : "text-blue-600"} />
              <span>00:{formattedSeconds}</span>
            </div>
          </div>

          {/* Progress bar ({n}/7 Rounds Complete) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>Tiến độ: {currentRoundNum}/{totalRoundNum} Vòng sinh tử</span>
              <span className="font-mono text-slate-700 font-bold">{progressPercent}% Hoàn thành</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: 3 KPI Cards (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-3 gap-2.5 sm:gap-3">
          {/* TOTAL ASSETS */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL ASSETS
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 tracking-tight">
                {totalAssets.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] font-bold text-slate-400">VND</span>
            </div>
          </div>

          {/* AVAILABLE CASH */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              AVAILABLE CASH
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 tracking-tight">
                {safeCash.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] font-bold text-slate-400">VND</span>
            </div>
          </div>

          {/* UNREALIZED P&L */}
          <div
            className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between transition-colors ${
              isPnlPositive
                ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-800"
                : "bg-rose-50/70 border-rose-200/80 text-rose-800"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              UNREALIZED P&amp;L
            </span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-xs sm:text-sm md:text-base font-black font-mono tracking-tight flex items-center gap-0.5">
                {isPnlPositive ? <TrendingUp size={13} className="text-emerald-600" /> : <TrendingDown size={13} className="text-rose-600" />}
                {isPnlPositive ? `+${unrealizedPnlAmount.toLocaleString("vi-VN")}` : unrealizedPnlAmount.toLocaleString("vi-VN")}
              </span>
              <span className="text-[10px] font-bold">
                ({isPnlPositive ? `+${unrealizedPnlPercent}%` : `${unrealizedPnlPercent}%`})
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
