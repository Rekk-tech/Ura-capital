import React from "react";
import { Link } from "react-router-dom";
import { Wallet, PiggyBank, TrendingUp, AlertTriangle, ShieldCheck, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "../../../portfolio/utils/portfolioCalculations";

interface ProMacroTopRibbonProps {
  currentQuarter: number;
  totalQuarters: number;
  stageName: string;
  stageKey: string;
  stageDescription: string;
  currentNav: number;
  initialCash: number;
  unallocatedCash: number;
  unallocatedPercent: number;
  alpha: number;
  maxDrawdown: number;
  pnlQoQPercent: number;
}

export const ProMacroTopRibbon: React.FC<ProMacroTopRibbonProps> = ({
  currentQuarter,
  totalQuarters,
  stageName,
  stageKey,
  stageDescription,
  currentNav,
  initialCash: _initialCash,
  unallocatedCash,
  unallocatedPercent,
  alpha,
  maxDrawdown,
  pnlQoQPercent,
}) => {
  const progressPercent = Number(((currentQuarter / totalQuarters) * 100).toFixed(1));
  const remainingQuarters = totalQuarters - currentQuarter;

  const stageBadgeStyle: Record<string, { bg: string; text: string; border: string }> = {
    BOOM: { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-300" },
    STAGFLATION: { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-300" },
    RECESSION: { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-300" },
    RECOVERY: { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-300" },
  };

  const badgeTheme = stageBadgeStyle[stageKey] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Mode Pill & Switch Map Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md font-bold tracking-wider uppercase text-[11px] bg-slate-900 text-white flex items-center gap-1.5 shadow-xs">
            <span>🗺️ MAP 2: PRO ROOM</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-600 font-medium hidden sm:inline">
            Disciplined Value Investing &amp; Macro Allocation
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <span>🔄 Turn-based</span>
            <span>• 12 Economic Quarters</span>
          </span>
        </div>

        <Link
          to="/simulation"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors group"
        >
          <span>Switch Simulation Map</span>
          <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* 2. Hero Quarter Title & Macro Progression */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
              Quarter {currentQuarter} of {totalQuarters}
              {stageKey === "STAGFLATION" ? " – Monetary Tightening" : stageKey === "RECESSION" ? " – Economic Contraction" : stageKey === "RECOVERY" ? " – Macro Rebound" : ""}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${badgeTheme.bg} ${badgeTheme.text} ${badgeTheme.border}`}
            >
              {currentQuarter === 1 ? "Active Round • DỮ LIỆU MÔ PHỎNG QUÝ 1" : `${stageName} Phase • DỮ LIỆU MÔ PHỎNG QUÝ ${currentQuarter}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Cycle Phase: <span className="text-slate-700 font-semibold">{stageDescription}</span>
          </p>
        </div>

        {/* Progression Progress Bar */}
        <div className="w-full md:w-72 flex flex-col gap-1.5 md:items-end">
          <div className="flex items-center justify-between md:justify-end gap-3 text-xs w-full">
            <span className="text-slate-500 font-medium">Macro Progression</span>
            <strong className="font-mono text-slate-900">
              Q{currentQuarter} {currentQuarter === totalQuarters ? "Finalized" : "in progress"}: {progressPercent}%
            </strong>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400">
            {remainingQuarters > 0
              ? `${remainingQuarters} Quarters remaining until institutional audit`
              : "Final institutional audit completed"}
          </span>
        </div>
      </div>

      {/* 3. Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Assets */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>{currentQuarter === 1 ? "TOTAL CAPITAL POOL" : "TOTAL PORTFOLIO ASSETS"}</span>
            <Wallet size={16} className="text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight my-1">
            {formatCurrency(currentNav)}
          </div>
          <div className="text-[11px] font-medium">
            {currentQuarter === 1 ? (
              <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                🛡️ 100% Guaranteed Virtual Funds
              </span>
            ) : (
              <span className={pnlQoQPercent >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                {pnlQoQPercent >= 0 ? `+${pnlQoQPercent.toFixed(1)}%` : `${pnlQoQPercent.toFixed(1)}%`} (QoQ Change)
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Unallocated Cash */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>UNALLOCATED CASH</span>
            <PiggyBank size={16} className="text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight my-1">
            {formatCurrency(unallocatedCash)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {unallocatedPercent.toFixed(1)}% of Portfolio
          </div>
        </div>

        {/* Card 3: Benchmark Alpha */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>BENCHMARK ALPHA (VS VN-INDEX)</span>
            <TrendingUp size={16} className={alpha >= 0 ? "text-emerald-600" : "text-rose-600"} />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight my-1 ${alpha >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {alpha >= 0 ? `+${alpha.toFixed(2)}%` : `${alpha.toFixed(2)}%`}
          </div>
          <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{alpha >= 0 ? "Top 5% Cohort Performance" : "Defensive Stress Resilience"}</span>
          </div>
        </div>

        {/* Card 4: Max Drawdown Limit */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>MAX DRAWDOWN LIMIT</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight my-1">
            &lt; 15.0%
          </div>
          <div className="text-[11px] font-semibold flex items-center gap-1">
            <ShieldCheck size={13} className={maxDrawdown <= 0.15 ? "text-emerald-600" : "text-rose-600"} />
            <span className={maxDrawdown <= 0.15 ? "text-emerald-600" : "text-rose-600"}>
              Current Drawdown: {(maxDrawdown * 100).toFixed(1)}% {maxDrawdown === 0 ? "(Clean)" : "(Active Defense)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
