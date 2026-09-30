import React from "react";
import type { Map1Phase } from "../../types/map-game.types";
import { Clock, ShieldAlert, Zap, TrendingUp, Flame } from "lucide-react";

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
  // Financial KPI Math (Resolving Review Issue 1.4)
  // TOTAL ASSETS must be dynamically evaluated as Available Cash + Current Market Value of Open Positions
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

  const progressPercent = Math.round(((round ?? 1) / (totalRounds || 7)) * 100);

  // 4-Phase Micro-Timeline configuration
  const phaseList: Array<{
    key: Map1Phase;
    label: string;
    range: string;
    startSec: number;
    endSec: number;
  }> = [
    { key: "news_and_trap", label: "NEWS & TRAP", range: "0-10s", startSec: 0, endSec: 10 },
    { key: "trading_window", label: "TRADING WINDOW", range: "10-30s", startSec: 10, endSec: 30 },
    { key: "trap_or_quiz", label: "TRAP / QUIZ", range: "30-40s", startSec: 30, endSec: 40 },
    { key: "ledger_update", label: "LEDGER UPDATE", range: "40-45s", startSec: 40, endSec: 45 },
  ];

  return (
    <div className="fomo-cockpit-header flex flex-col gap-3">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1 shadow-xs">
            <Flame size={12} className="text-amber-500" />
            MAP 1: FOMO ARENA
          </span>
          <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Simulated VN-Index Live Feed
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <ShieldAlert size={13} className="text-rose-500" />
          <span>Psychological Stress Test Active</span>
        </div>
      </div>

      {/* Main KPI Status Card */}
      <div className="card-aura p-4 md:p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
        {/* Left: Round & Progress Bar */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Round {round}/{totalRounds}: {roundName}</span>
            </h2>
            <div className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1 shadow-xs animate-pulse">
              <Clock size={13} />
              <span>00:{formattedSeconds}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
            <span>Progress: {round} of {totalRounds} Rounds Complete</span>
            <span className="font-bold text-slate-700 font-mono">{progressPercent}% Complete</span>
          </div>

          {/* Overall Round Progress Bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 mb-3">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 4-Phase Micro-Timeline Bar */}
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold uppercase tracking-wider">
              {phaseList.map((p) => {
                const isActive = phase === p.key;
                return (
                  <div
                    key={p.key}
                    className={`py-1 px-1.5 rounded-lg text-center border transition-all ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-400 border-slate-200/70"
                    }`}
                  >
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap">{p.label}</div>
                    <div className="text-[9px] font-normal opacity-80">{p.range}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Strict Financial KPI Math (Resolving Review Issue 1.4) */}
        <div className="flex items-center justify-between lg:justify-end gap-3 md:gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {/* TOTAL ASSETS */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL ASSETS
            </span>
            <div className="text-lg md:text-xl font-black font-mono text-slate-900 mt-0.5">
              {totalAssets.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-semibold text-slate-500">VND</span>
            </div>
          </div>

          {/* AVAILABLE CASH */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AVAILABLE CASH
            </span>
            <div className="text-lg md:text-xl font-black font-mono text-slate-900 mt-0.5">
              {safeCash.toLocaleString("vi-VN")}{" "}
              <span className="text-xs font-semibold text-slate-500">VND</span>
            </div>
          </div>

          {/* UNREALIZED P&L */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              UNREALIZED P&amp;L
            </span>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-black font-mono mt-0.5 shadow-xs border ${
                isPnlPositive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {isPnlPositive ? <TrendingUp size={14} /> : <Zap size={14} />}
              <span>
                {isPnlPositive ? `+${unrealizedPnlAmount.toLocaleString("vi-VN")}` : unrealizedPnlAmount.toLocaleString("vi-VN")} VND
              </span>
              <span className="text-[11px] font-bold">
                ({isPnlPositive ? `+${unrealizedPnlPercent}%` : `${unrealizedPnlPercent}%`})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
