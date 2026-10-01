import React, { useState } from "react";
import type { Map1PricePoint } from "../../types/map-game.types";
import { Sparkles, AlertTriangle, Snowflake, Activity } from "lucide-react";

interface FomoPriceChartProps {
  symbol?: string;
  currentPrice: number;
  initialPrice: number;
  priceChangePercent: number;
  pricePoints: Map1PricePoint[];
  round?: number;
}

export const FomoPriceChart: React.FC<FomoPriceChartProps> = ({
  symbol = "$FOMO / VIN",
  currentPrice,
  initialPrice = 45000,
  priceChangePercent,
  pricePoints,
  round = 1,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("5s");

  // Round-specific visual state matrix
  const isCeiling = round === 2 || priceChangePercent >= 6.8;
  const isFloor = round === 3 || round === 5 || priceChangePercent <= -6.8;
  const isLiquidityFreeze = round === 5;
  const isBullTrap = round === 4;
  const isExhaustion = round === 6;
  const isDifferentiation = round === 7;

  // Chart dimensions
  const width = 640;
  const height = 230;
  const padding = 26;

  // Reference, Ceiling and Floor Price calculations
  const refPrice = initialPrice || 45000;
  const ceilingPrice = Math.round(refPrice * 1.069);
  const floorPrice = Math.round(refPrice * 0.93);

  // Compute price curve points
  const rawPrices = pricePoints.length > 0 ? pricePoints.map((p) => p.price) : [refPrice, currentPrice];
  const minPrice = Math.min(floorPrice * 0.99, ...rawPrices);
  const maxPrice = Math.max(ceilingPrice * 1.01, ...rawPrices);
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

  // Dynamic theme colors per round
  let primaryStroke = "#10B981"; // emerald default up
  let gradientStopColor = "#10B981";
  let statusBadgeBg = "bg-emerald-50 text-emerald-700 border-emerald-300";
  let statusBadgeText = `+${priceChangePercent > 0 ? priceChangePercent.toFixed(1) : "3.0"}% TĂNG NHẸ`;
  let StatusIcon = Activity;

  if (isCeiling) {
    primaryStroke = "#8B5CF6"; // purple ceiling
    gradientStopColor = "#8B5CF6";
    statusBadgeBg = "bg-purple-100 text-purple-700 border-purple-300";
    statusBadgeText = "+6.9% CEILING (TÍM TRẦN) 🔥";
    StatusIcon = Sparkles;
  } else if (isLiquidityFreeze) {
    primaryStroke = "#06B6D4"; // frozen cyan / ice
    gradientStopColor = "#06B6D4";
    statusBadgeBg = "bg-cyan-50 text-cyan-800 border-cyan-300";
    statusBadgeText = "-7.0% GIẢM SÀN MẤT THANH KHOẢN ❄️";
    StatusIcon = Snowflake;
  } else if (isFloor) {
    primaryStroke = "#EF4444"; // floor red
    gradientStopColor = "#EF4444";
    statusBadgeBg = "bg-rose-100 text-rose-700 border-rose-300";
    statusBadgeText = "-7.0% GIẢM SÀN (LAO DỐC) ⚠️";
    StatusIcon = AlertTriangle;
  } else if (isBullTrap) {
    primaryStroke = "#10B981";
    gradientStopColor = "#10B981";
    statusBadgeBg = "bg-emerald-50 text-emerald-700 border-emerald-300";
    statusBadgeText = "+4.0% HỒI PHỤC KỸ THUẬT (BULL-TRAP)";
  } else if (isExhaustion) {
    primaryStroke = "#64748B"; // slate
    gradientStopColor = "#64748B";
    statusBadgeBg = "bg-slate-100 text-slate-700 border-slate-300";
    statusBadgeText = "-1.0% ĐI NGANG TÍCH LŨY ĐÁY";
  } else if (isDifferentiation) {
    primaryStroke = "#10B981";
    gradientStopColor = "#3B82F6";
    statusBadgeBg = "bg-blue-50 text-blue-700 border-blue-300";
    statusBadgeText = "+2.0% PHÂN HÓA - DÒNG TIỀN THÔNG MINH";
  }

  // Volume histogram bars
  const volumeBars = Array.from({ length: 18 }, (_, i) => {
    let factor = Math.min(1, 0.25 + (i / 18) * 0.75);
    if (round === 2) factor = Math.min(1, factor * 1.3);
    if (round === 3) factor = Math.min(1, factor * 1.5);
    if (round === 5) factor = 0.15; // low liquidity
    return Math.min(46, Math.max(6, factor * 46));
  });

  // Dynamic order book depth based on round
  const depthData = {
    bidVolume: isCeiling ? "2,850,000 CP (Dư mua trần)" : isLiquidityFreeze ? "TRẮNG BÊN MUA (0 CP)" : round === 3 ? "45,000 CP" : round === 7 ? "920,000 CP" : "542,000 CP",
    askVolume: isCeiling ? "TRẮNG BÊN BÁN (0 CP)" : isLiquidityFreeze ? "4,850,000 CP (Chất sàn nghẽn)" : round === 3 ? "3,120,000 CP (Chất sàn)" : round === 7 ? "210,000 CP" : "380,000 CP",
    totalVolume: round === 2 ? "8,924,100 CP" : round === 3 ? "11,450,000 CP" : round === 5 ? "1,200,000 CP (Nghẽn)" : round === 7 ? "5,680,000 CP" : "2,450,000 CP",
  };

  return (
    <div className="fomo-price-cockpit card-aura p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col gap-3.5">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Avatar Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white font-black text-lg flex items-center justify-center flex-shrink-0 shadow-md">
            VIN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {symbol}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                VinAlpha Corp (HOSE)
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                {currentPrice.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs font-bold text-slate-500">VND</span>

              {/* Dynamic Status Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${statusBadgeBg}`}>
                <StatusIcon size={12} />
                <span>{statusBadgeText}</span>
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

      {/* 2. Order Depth & Key Metrics Row (4 Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
          <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">
            Khớp Gần Nhất
          </span>
          <span className="font-bold font-mono text-blue-600 block truncate">
            {currentPrice.toLocaleString("vi-VN")} VND {isCeiling ? "(Trần)" : isFloor ? "(Sàn)" : ""}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
          <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">
            Dư Mua (Bid)
          </span>
          <span className={`font-bold font-mono block truncate ${isLiquidityFreeze ? "text-cyan-700 font-black" : "text-slate-800"}`}>
            {depthData.bidVolume}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
          <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">
            Dư Bán (Ask)
          </span>
          <span className={`font-bold font-mono block truncate ${isCeiling ? "text-purple-700 font-black" : isFloor ? "text-rose-700 font-black" : "text-slate-800"}`}>
            {depthData.askVolume}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100">
          <span className="text-[10px] text-slate-400 block mb-0.5 font-bold uppercase tracking-wider">
            Tổng Khối Lượng
          </span>
          <span className="font-bold font-mono text-slate-900 block truncate">
            {depthData.totalVolume}
          </span>
        </div>
      </div>

      {/* 3. SVG Area & Volume Chart */}
      <div className="relative w-full h-52 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 p-2 flex flex-col justify-between shadow-inner">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="priceGradientDynamic" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradientStopColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference Price Dashed Line */}
          <line
            x1={padding}
            y1={height - padding - 28}
            x2={width - padding}
            y2={height - padding - 28}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <text
            x={padding}
            y={height - padding - 33}
            fill="#94A3B8"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            REF: {refPrice.toLocaleString("vi-VN")} VND
          </text>

          {/* Ceiling Price Dashed Line (Purple) */}
          <line
            x1={padding}
            y1={padding + 8}
            x2={width - padding}
            y2={padding + 8}
            stroke="#A855F7"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <text
            x={padding}
            y={padding + 4}
            fill="#C084FC"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            TRẦN (CEILING) {ceilingPrice.toLocaleString("vi-VN")} VND (+6.90%)
          </text>

          {/* Floor Price Dashed Line (Cyan/Red) */}
          <line
            x1={padding}
            y1={height - padding - 8}
            x2={width - padding}
            y2={height - padding - 8}
            stroke="#EF4444"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <text
            x={padding}
            y={height - padding - 12}
            fill="#F87171"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            SÀN (FLOOR) {floorPrice.toLocaleString("vi-VN")} VND (-7.00%)
          </text>

          {/* Gradient Area Fill under price curve */}
          {areaPathStr && (
            <path d={areaPathStr} fill="url(#priceGradientDynamic)" />
          )}

          {/* Price Polyline */}
          {polylineStr && (
            <polyline
              fill="none"
              stroke={primaryStroke}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />
          )}

          {/* Current Price Dot with Pulse Indicator */}
          {points.length > 0 && (
            <g>
              <circle
                cx={points[points.length - 1]!.x}
                cy={points[points.length - 1]!.y}
                r="6"
                fill={primaryStroke}
                stroke="#FFFFFF"
                strokeWidth="2"
                className="animate-ping"
              />
              <circle
                cx={points[points.length - 1]!.x}
                cy={points[points.length - 1]!.y}
                r="5"
                fill={primaryStroke}
                stroke="#FFFFFF"
                strokeWidth="2"
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
                fill={primaryStroke}
                opacity={0.45 + (idx / volumeBars.length) * 0.45}
                rx="2"
              />
            );
          })}
        </svg>

        {/* Special Round 5 Frozen Banner */}
        {isLiquidityFreeze && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="px-4 py-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl animate-pulse">
              <Snowflake size={16} className="text-cyan-400" />
              <span>SÀN ĐÓNG BĂNG... TRẮNG BÊN MUA (NO BUYERS - LIQUIDITY FROZEN)</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Real-time Order Matching Ticker Tape */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-xs flex items-center overflow-x-auto shadow-inner">
        <div className="flex items-center gap-4 whitespace-nowrap font-mono font-medium text-[11px]">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            MATCHING TICKER:
          </span>

          {isLiquidityFreeze ? (
            <span className="text-cyan-300 font-bold flex items-center gap-2">
              <span>❄️ NGHẼN LỆNH HỆ THỐNG [FROZEN]</span>
              <span>•</span>
              <span>0 KHỚP LỆNH</span>
              <span>•</span>
              <span>MẤT THANH KHOẢN TOÀN TẬP</span>
              <span>•</span>
              <span>CHẤT SÀN 4,850,000 CP</span>
            </span>
          ) : isCeiling ? (
            <>
              <span className="text-slate-300">
                ⚡ +120,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-purple-400 font-bold">(BUY CEILING)</strong>
              </span>
              <span className="text-slate-300">
                ⚡ +85,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-purple-400 font-bold">(BUY CEILING)</strong>
              </span>
              <span className="text-slate-300">
                ⚡ +210,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-purple-400 font-bold">(BUY CEILING)</strong>
              </span>
            </>
          ) : isFloor ? (
            <>
              <span className="text-slate-300">
                ⚠️ -95,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-rose-400 font-bold">(SELL DUMP)</strong>
              </span>
              <span className="text-slate-300">
                ⚠️ -150,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-rose-400 font-bold">(SELL FLOOR)</strong>
              </span>
              <span className="text-slate-300">
                ⚠️ -200,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-rose-400 font-bold">(MARGIN CALL)</strong>
              </span>
            </>
          ) : isDifferentiation ? (
            <>
              <span className="text-slate-300">
                💎 +75,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-blue-400 font-bold">(SMART MONEY INFLOW)</strong>
              </span>
              <span className="text-slate-300">
                💎 +110,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-emerald-400 font-bold">(INSTITUTIONAL BUY)</strong>
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-300">
                ⚡ +15,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-emerald-400 font-bold">(BUY)</strong>
              </span>
              <span className="text-slate-300">
                ⚡ +28,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-emerald-400 font-bold">(BUY)</strong>
              </span>
              <span className="text-slate-300">
                ⚡ +45,000 CP @ {currentPrice.toLocaleString("vi-VN")} <strong className="text-emerald-400 font-bold">(BUY)</strong>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
