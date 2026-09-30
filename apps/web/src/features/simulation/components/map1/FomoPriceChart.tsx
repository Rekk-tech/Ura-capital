import React, { useState } from "react";
import type { Map1PricePoint } from "../../types/map-game.types";
import { Lock, Sparkles } from "lucide-react";

interface FomoPriceChartProps {
  symbol?: string;
  currentPrice: number;
  initialPrice: number;
  priceChangePercent: number;
  pricePoints: Map1PricePoint[];
  round?: number;
}

export const FomoPriceChart: React.FC<FomoPriceChartProps> = ({
  symbol = "$FOMO",
  currentPrice,
  initialPrice = 45000,
  priceChangePercent,
  pricePoints,
  round = 2,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("5s");

  const isCeiling = priceChangePercent >= 6.9;

  // Chart dimensions
  const width = 640;
  const height = 240;
  const padding = 28;

  // Reference and Ceiling Price calculations
  const refPrice = initialPrice || 45000;
  const ceilingPrice = Math.round(refPrice * 1.069);

  // Compute price curve points
  const prices = pricePoints.length > 0 ? pricePoints.map((p) => p.price) : [refPrice, currentPrice];
  const minPrice = Math.min(refPrice * 0.98, ...prices);
  const maxPrice = Math.max(ceilingPrice * 1.01, ...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Scale SVG points
  const points = (pricePoints.length > 0 ? pricePoints : [{ second: 0, price: refPrice }, { second: 45, price: currentPrice }]).map((p, idx, arr) => {
    const x = padding + (idx / Math.max(1, arr.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.price - minPrice) / priceRange) * (height - padding * 2);
    return { x, y };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Create SVG path for gradient area under curve
  const areaPathStr = points.length > 0
    ? `M ${points[0]!.x},${height - padding} L ${points.map((p) => `${p.x},${p.y}`).join(" L ")} L ${points[points.length - 1]!.x},${height - padding} Z`
    : "";

  // Fake volume bars data proportional to points
  const volumeBars = Array.from({ length: 18 }, (_, i) => {
    // Generate increasing volume during FOMO rounds
    const factor = Math.min(1, 0.2 + (i / 18) * 0.8 + (round >= 2 ? 0.3 : 0));
    return Math.min(48, Math.max(8, factor * 48));
  });

  return (
    <div className="fomo-price-chart card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center flex-shrink-0 shadow-md">
            {symbol.replace("$", "").charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                {symbol}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Aura Apex Corp (HOSE)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 tracking-tight">
                {currentPrice.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs font-bold text-slate-500">VND</span>

              {/* Ceiling "Tím Trần" Badge */}
              <span className="ml-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-300 shadow-xs">
                <Sparkles size={11} className="text-purple-600" />
                +6.9% CEILING (TÍM TRẦN) 🔥
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200/60 text-xs">
          {["1s", "5s", "15s", "1m"].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setSelectedTimeframe(tf)}
              className={`py-1 px-2.5 rounded-lg font-bold transition-all ${
                selectedTimeframe === tf
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Order Depth & Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Khớp Lệnh Gần Nhất</span>
          <span className="font-bold font-mono text-blue-600">
            {currentPrice.toLocaleString("vi-VN")} (Max Ceiling)
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Dư Mua Giá Trần</span>
          <span className="font-bold font-mono text-slate-900">1,248,600 CP</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Bên Bán (Ask)</span>
          <span className="font-bold font-mono text-teal-600">TRẮNG BÊN BÁN</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Tổng Khối Lượng</span>
          <span className="font-bold font-mono text-slate-900">8,924,100 CP</span>
        </div>
      </div>

      {/* 3. SVG Area & Volume Chart */}
      <div className="relative w-full h-56 bg-slate-50/70 rounded-xl overflow-hidden border border-slate-200/80 p-2 flex flex-col justify-between">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference Price Dashed Line */}
          <line
            x1={padding}
            y1={height - padding - 20}
            x2={width - padding}
            y2={height - padding - 20}
            stroke="#CBD5E1"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={padding}
            y={height - padding - 26}
            fill="#94A3B8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            REF: {refPrice.toLocaleString("vi-VN")} VND
          </text>

          {/* Ceiling Price Dashed Line */}
          <line
            x1={padding}
            y1={padding + 10}
            x2={width - padding - 60}
            y2={padding + 10}
            stroke="#10B981"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text
            x={padding}
            y={padding + 5}
            fill="#059669"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            CEILING {ceilingPrice.toLocaleString("vi-VN")} VND (+6.90%)
          </text>

          {/* Gradient Area Fill under price curve */}
          {areaPathStr && (
            <path d={areaPathStr} fill="url(#priceGradient)" />
          )}

          {/* Price Polyline */}
          {polylineStr && (
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />
          )}

          {/* Current Price Dot with Locked Indicator */}
          {points.length > 0 && (
            <g>
              <circle
                cx={points[points.length - 1]!.x}
                cy={points[points.length - 1]!.y}
                r="6"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="animate-ping"
              />
              <circle
                cx={points[points.length - 1]!.x}
                cy={points[points.length - 1]!.y}
                r="6"
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Volume histogram bars at the bottom */}
          {volumeBars.map((barHeight, idx) => {
            const barWidth = 8;
            const barGap = (width - padding * 2 - barWidth * volumeBars.length) / (volumeBars.length - 1);
            const x = padding + idx * (barWidth + barGap);
            const y = height - padding - barHeight;
            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#10B981"
                opacity={0.65 + (idx / volumeBars.length) * 0.35}
                rx="2"
              />
            );
          })}
        </svg>

        {/* Locked Ceiling Badge at right edge of chart */}
        {isCeiling && (
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white flex items-center gap-1 shadow-md">
            <Lock size={10} className="text-emerald-400" />
            <span>LOCKED</span>
          </div>
        )}
      </div>

      {/* 4. Real-time Order Matching Ticker Tape */}
      <div className="p-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-xs flex items-center overflow-x-auto shadow-inner">
        <div className="flex items-center gap-4 whitespace-nowrap font-mono font-medium text-[11px]">
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            MATCHING TICKER:
          </span>
          <span className="text-slate-300">
            ⚡ +50,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-emerald-400 font-bold">(BUY)</strong>
          </span>
          <span className="text-slate-300">
            ⚡ +120,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-emerald-400 font-bold">(BUY)</strong>
          </span>
          <span className="text-slate-300">
            ⚡ +85,500 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-emerald-400 font-bold">(BUY)</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
