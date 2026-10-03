import React, { useState } from "react";
import { BarChart2 } from "lucide-react";

interface ProBenchmarkChartProps {
  currentQuarter: number;
  stageKey: string;
}

export const ProBenchmarkChart: React.FC<ProBenchmarkChartProps> = ({
  currentQuarter,
  stageKey,
}) => {
  const [chartType, setChartType] = useState<"candles" | "line" | "heikin">("candles");
  const [timeframe, setTimeframe] = useState<"1Q" | "2Q" | "1Y" | "3Y">("1Q");

  // Dynamic price data and trend indicators based on macro cycle stage
  const isBoom = stageKey === "BOOM";
  const isStagflation = stageKey === "STAGFLATION";
  const isRecession = stageKey === "RECESSION";

  const compositePrice = isBoom
    ? { index: "1,284.60", change: "+14.20", pct: "+1.12%", bullish: true, status: "BULL EXPANSION", rsi: "54.2 (Neutral Accumulation)", vol: "145.2M shares", ma20: "1,262.15", ma50: "1,218.40" }
    : isStagflation
    ? { index: "1,142.30", change: "-38.20", pct: "-3.23%", bullish: false, status: "BEARISH CORRECTION", rsi: "34.2 (Oversold Pressure)", vol: "268.4M shares (Heavy Selloff)", ma20: "1,168.10", ma50: "1,235.40" }
    : isRecession
    ? { index: "1,028.50", change: "+4.10", pct: "+0.40%", bullish: true, status: "ACCUMULATION BASE", rsi: "28.5 (Deep Value Range)", vol: "98.5M shares (Dry Liquidity)", ma20: "1,035.20", ma50: "1,120.80" }
    : { index: "1,215.80", change: "+24.50", pct: "+2.06%", bullish: true, status: "RECOVERY EXPANSION", rsi: "59.8 (Momentum Inflow)", vol: "189.6M shares", ma20: "1,185.00", ma50: "1,140.20" };

  // Candle definitions for SVG rendering (12 intervals across the quarter)
  const candles = isBoom
    ? [
        { open: 70, close: 60, high: 55, low: 73, vol: 35, bull: true },
        { open: 60, close: 52, high: 48, low: 64, vol: 45, bull: true },
        { open: 52, close: 56, high: 50, low: 60, vol: 30, bull: false },
        { open: 56, close: 48, high: 44, low: 58, vol: 50, bull: true },
        { open: 48, close: 40, high: 36, low: 50, vol: 65, bull: true },
        { open: 40, close: 44, high: 38, low: 46, vol: 28, bull: false },
        { open: 44, close: 35, high: 30, low: 46, vol: 55, bull: true },
        { open: 35, close: 28, high: 24, low: 38, vol: 70, bull: true },
        { open: 28, close: 32, high: 26, low: 34, vol: 35, bull: false },
        { open: 32, close: 22, high: 18, low: 34, vol: 60, bull: true },
        { open: 22, close: 15, high: 12, low: 25, vol: 80, bull: true },
        { open: 15, close: 10, high: 8, low: 18, vol: 95, bull: true },
      ]
    : isStagflation
    ? [
        { open: 15, close: 25, high: 12, low: 28, vol: 60, bull: false },
        { open: 25, close: 38, high: 22, low: 42, vol: 75, bull: false },
        { open: 38, close: 32, high: 30, low: 40, vol: 40, bull: true },
        { open: 32, close: 48, high: 30, low: 52, vol: 85, bull: false },
        { open: 48, close: 58, high: 45, low: 62, vol: 90, bull: false },
        { open: 58, close: 52, high: 50, low: 60, vol: 45, bull: true },
        { open: 52, close: 65, high: 50, low: 70, vol: 80, bull: false },
        { open: 65, close: 72, high: 62, low: 75, vol: 70, bull: false },
        { open: 72, close: 68, high: 66, low: 74, vol: 35, bull: true },
        { open: 68, close: 78, high: 65, low: 82, vol: 85, bull: false },
        { open: 78, close: 85, high: 75, low: 88, vol: 95, bull: false },
        { open: 85, close: 90, high: 82, low: 94, vol: 110, bull: false },
      ]
    : isRecession
    ? [
        { open: 85, close: 82, high: 78, low: 88, vol: 40, bull: true },
        { open: 82, close: 86, high: 80, low: 89, vol: 45, bull: false },
        { open: 86, close: 80, high: 77, low: 88, vol: 50, bull: true },
        { open: 80, close: 84, high: 79, low: 86, vol: 35, bull: false },
        { open: 84, close: 78, high: 75, low: 85, vol: 55, bull: true },
        { open: 78, close: 74, high: 70, low: 80, vol: 60, bull: true },
        { open: 74, close: 76, high: 72, low: 78, vol: 30, bull: false },
        { open: 76, close: 70, high: 67, low: 78, vol: 65, bull: true },
        { open: 70, close: 68, high: 65, low: 72, vol: 45, bull: true },
        { open: 68, close: 65, high: 62, low: 70, vol: 55, bull: true },
        { open: 65, close: 62, high: 58, low: 68, vol: 70, bull: true },
        { open: 62, close: 58, high: 54, low: 64, vol: 75, bull: true },
      ]
    : [
        { open: 70, close: 62, high: 58, low: 72, vol: 55, bull: true },
        { open: 62, close: 55, high: 52, low: 65, vol: 60, bull: true },
        { open: 55, close: 58, high: 53, low: 60, vol: 35, bull: false },
        { open: 58, close: 50, high: 46, low: 60, vol: 65, bull: true },
        { open: 50, close: 42, high: 38, low: 52, vol: 70, bull: true },
        { open: 42, close: 45, high: 40, low: 48, vol: 40, bull: false },
        { open: 45, close: 36, high: 32, low: 46, vol: 75, bull: true },
        { open: 36, close: 30, high: 26, low: 38, vol: 80, bull: true },
        { open: 30, close: 33, high: 28, low: 35, vol: 45, bull: false },
        { open: 33, close: 25, high: 22, low: 35, vol: 85, bull: true },
        { open: 25, close: 18, high: 15, low: 28, vol: 90, bull: true },
        { open: 18, close: 12, high: 10, low: 20, vol: 105, bull: true },
      ];

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4">
      {/* Header with Title, Status Badge, Price & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
              <BarChart2 size={16} />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              VN-Index &amp; Multi-Asset Benchmark
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                compositePrice.bullish
                  ? "bg-emerald-500/15 text-emerald-700 border border-emerald-300"
                  : "bg-rose-500/15 text-rose-700 border border-rose-300"
              }`}
            >
              {compositePrice.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Real-time simulation composite rate</span>
            <span>•</span>
            <strong className="text-slate-900 font-mono text-sm">{compositePrice.index}</strong>
            <span className={`font-mono font-bold ${compositePrice.bullish ? "text-emerald-600" : "text-rose-600"}`}>
              ({compositePrice.change} / {compositePrice.pct})
            </span>
          </div>
        </div>

        {/* Toggles (Candles/Line/Heikin & Timeframes) */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="p-0.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-0.5 text-xs font-semibold">
            {(["candles", "line", "heikin"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setChartType(t)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                  chartType === t ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t === "candles" ? "Candles" : t === "line" ? "Line" : "Heikin Ashi"}
              </button>
            ))}
          </div>

          <div className="p-0.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-0.5 text-xs font-semibold">
            {(["1Q", "2Q", "1Y", "3Y"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  timeframe === tf ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Indicators Ribbon */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-500">MA(20):</span>
          <strong className="text-slate-800">{compositePrice.ma20}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-slate-500">MA(50):</span>
          <strong className="text-slate-800">{compositePrice.ma50}</strong>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-sans">
          <span className="text-slate-500 font-mono">RSI(14):</span>
          <strong>{compositePrice.rsi}</strong>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 font-sans ml-auto">
          <span>Vol:</span>
          <strong className="text-slate-700 font-mono">{compositePrice.vol}</strong>
        </div>
      </div>

      {/* SVG Financial Chart */}
      <div className="relative w-full h-56 bg-slate-950 rounded-xl overflow-hidden p-2 flex flex-col justify-between border border-slate-800">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-rows-4 pointer-events-none opacity-20">
          <div className="border-b border-slate-400" />
          <div className="border-b border-slate-400" />
          <div className="border-b border-slate-400" />
        </div>

        {/* Dynamic Candlesticks SVG Canvas */}
        <svg className="w-full h-40 overflow-visible" viewBox="0 0 480 100" preserveAspectRatio="none">
          {/* Moving Average Line (MA20) */}
          <path
            d={
              isBoom
                ? "M 10 72 Q 120 58 240 40 T 470 12"
                : isStagflation
                ? "M 10 20 Q 120 40 240 60 T 470 88"
                : "M 10 82 Q 120 78 240 70 T 470 58"
            }
            fill="none"
            stroke="#10b981"
            strokeWidth="1.8"
            strokeOpacity="0.85"
          />

          {/* Moving Average Line (MA50) */}
          <path
            d={
              isBoom
                ? "M 10 78 Q 120 66 240 50 T 470 24"
                : isStagflation
                ? "M 10 15 Q 120 30 240 52 T 470 78"
                : "M 10 86 Q 120 84 240 76 T 470 66"
            }
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeOpacity="0.75"
          />

          {/* Candlesticks */}
          {chartType !== "line" ? (
            candles.map((c, i) => {
              const x = 20 + i * 38;
              const candleColor = c.bull ? "#10b981" : "#ef4444";
              const bodyTop = Math.min(c.open, c.close);
              const bodyHeight = Math.max(3, Math.abs(c.open - c.close));

              return (
                <g key={i}>
                  {/* High/Low Wick */}
                  <line x1={x} y1={c.high} x2={x} y2={c.low} stroke={candleColor} strokeWidth="1.2" />
                  {/* Candle Body */}
                  <rect
                    x={x - 6}
                    y={bodyTop}
                    width={12}
                    height={bodyHeight}
                    fill={c.bull ? "#10b981" : "#ef4444"}
                    rx={1.5}
                  />
                </g>
              );
            })
          ) : (
            /* Line mode */
            <path
              d={
                isBoom
                  ? "M 10 70 L 60 55 L 120 48 L 180 42 L 240 35 L 300 28 L 360 22 L 420 15 L 470 10"
                  : "M 10 20 L 60 35 L 120 45 L 180 55 L 240 65 L 300 72 L 360 78 L 420 85 L 470 90"
              }
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
            />
          )}
        </svg>

        {/* Volume Histogram along bottom */}
        <div className="w-full h-9 flex items-end justify-between px-2 pt-1 border-t border-slate-800/80">
          {candles.map((c, i) => (
            <div
              key={i}
              className="w-2.5 rounded-t-xs transition-all duration-300"
              style={{
                height: `${Math.min(100, (c.vol / 120) * 100)}%`,
                backgroundColor: c.bull ? "rgba(16, 185, 129, 0.45)" : "rgba(239, 68, 68, 0.45)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Timeline X-Axis Labels */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
        <span>Previous Cycle (Q{Math.max(1, currentQuarter - 1)})</span>
        <span>Month 1 (Allocated)</span>
        <span>Month 2 (Consolidation)</span>
        <strong className="text-slate-900 font-bold font-sans">
          Current Target (Q{currentQuarter} End)
        </strong>
      </div>
    </div>
  );
};
