import React, { useState, useMemo, useEffect } from "react";
import type { Map1PricePoint } from "../../types/map-game.types";
import { Sparkles, AlertTriangle, Snowflake, Activity } from "lucide-react";
import { MAP1_ROUNDS_DATA } from "../../data/map1-fomo-dataset";

interface FomoPriceChartProps {
  symbol?: string;
  currentPrice: number;
  initialPrice?: number;
  priceChangePercent: number;
  pricePoints: Map1PricePoint[];
  round?: number;
  onTickPriceChange?: (price: number) => void;
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isBullish: boolean;
}

export const FomoPriceChart: React.FC<FomoPriceChartProps> = ({
  symbol = "$FOMO / VIN",
  currentPrice,
  initialPrice = 45000,
  priceChangePercent,
  pricePoints: _pricePoints,
  round = 1,
  onTickPriceChange,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("5s");

  // Load round data from dataset
  const roundData = MAP1_ROUNDS_DATA[round] || MAP1_ROUNDS_DATA[1];
  const tickSeries = roundData?.tickSeries || [];

  const [tickIndex, setTickIndex] = useState(0);

  // Reset tick index when round changes
  useEffect(() => {
    setTickIndex(0);
  }, [round]);

  // Dynamic 1.5s tick simulation loop
  useEffect(() => {
    if (!tickSeries.length) return;
    const interval = setInterval(() => {
      setTickIndex((prev) => (prev < tickSeries.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, [tickSeries.length, round]);

  const activeTick = tickSeries[tickIndex] || tickSeries[0];
  const activePrice = activeTick?.price || currentPrice || 46350;

  // Sync price change to parent if callback provided
  useEffect(() => {
    if (onTickPriceChange && activePrice) {
      onTickPriceChange(activePrice);
    }
  }, [activePrice, onTickPriceChange]);

  // Round-specific visual state matrix
  const isCeiling = round === 2 || priceChangePercent >= 6.8;
  const isFloor = round === 3 || round === 5 || priceChangePercent <= -6.8;
  const isLiquidityFreeze = round === 5;
  const isBullTrap = round === 4;
  const isExhaustion = round === 6;
  const isDifferentiation = round === 7;

  // Reference, Ceiling and Floor Prices
  const refPrice = initialPrice || 45000;
  const ceilingPrice = Math.round(refPrice * 1.069);
  const floorPrice = Math.round(refPrice * 0.93);

  // Dynamic theme colors per round
  let primaryStroke = "#10B981"; // emerald default up
  let statusBadgeBg = "bg-emerald-50 text-emerald-700 border-emerald-300";
  let statusBadgeText = `+${priceChangePercent > 0 ? priceChangePercent.toFixed(1) : "3.0"}% TĂNG NHẸ`;
  let statusBadgeSubText = "(TÍCH LŨY)";
  let StatusIcon = Activity;

  if (isCeiling) {
    primaryStroke = "#8B5CF6"; // purple ceiling
    statusBadgeBg = "bg-purple-100 text-purple-700 border-purple-300";
    statusBadgeText = "+6.9% CEILING (TÍM TRẦN) 🔥";
    statusBadgeSubText = "";
    StatusIcon = Sparkles;
  } else if (isLiquidityFreeze) {
    primaryStroke = "#06B6D4"; // frozen cyan / ice
    statusBadgeBg = "bg-cyan-50 text-cyan-800 border-cyan-300";
    statusBadgeText = "-7.0% GIẢM SÀN MẤT THANH KHOẢN ❄️";
    statusBadgeSubText = "";
    StatusIcon = Snowflake;
  } else if (isFloor) {
    primaryStroke = "#EF4444"; // floor red
    statusBadgeBg = "bg-rose-100 text-rose-700 border-rose-300";
    statusBadgeText = "-7.0% GIẢM SÀN (LAO DỐC) ⚠️";
    statusBadgeSubText = "";
    StatusIcon = AlertTriangle;
  } else if (isBullTrap) {
    primaryStroke = "#10B981";
    statusBadgeBg = "bg-emerald-50 text-emerald-700 border-emerald-300";
    statusBadgeText = "+4.0% HỒI PHỤC KỸ THUẬT (BULL-TRAP)";
    statusBadgeSubText = "";
  } else if (isExhaustion) {
    primaryStroke = "#64748B";
    statusBadgeBg = "bg-slate-100 text-slate-700 border-slate-300";
    statusBadgeText = "-1.0% ĐI NGANG TÍCH LŨY ĐÁY";
    statusBadgeSubText = "";
  } else if (isDifferentiation) {
    primaryStroke = "#10B981";
    statusBadgeBg = "bg-blue-50 text-blue-700 border-blue-300";
    statusBadgeText = "+2.0% PHÂN HÓA - DÒNG TIỀN THÔNG MINH";
    statusBadgeSubText = "";
  }

  // Dynamic order book depth based on round
  const depthData = {
    bidVolume: isCeiling
      ? "2,850,000 CP (Dư mua trần)"
      : isLiquidityFreeze
      ? "TRẮNG BÊN MUA (0 CP)"
      : round === 1
      ? "420,500 CP"
      : round === 3
      ? "45,000 CP"
      : round === 7
      ? "920,000 CP"
      : "542,000 CP",
    askVolume: isCeiling
      ? "TRẮNG BÊN BÁN (0 CP)"
      : isLiquidityFreeze
      ? "4,850,000 CP (Chất sàn nghẽn)"
      : round === 1
      ? "385,200 CP"
      : round === 3
      ? "3,120,000 CP (Chất sàn)"
      : round === 7
      ? "210,000 CP"
      : "380,000 CP",
    totalVolume:
      round === 1
        ? "2,150,000 CP"
        : round === 2
        ? "8,924,100 CP"
        : round === 3
        ? "11,450,000 CP"
        : round === 5
        ? "1,200,000 CP (Nghẽn)"
        : round === 7
        ? "5,680,000 CP"
        : "2,450,000 CP",
  };

  // Generate realistic Japanese Candlestick sequence incorporating live tick state
  const candles: CandleData[] = useMemo(() => {
    const totalBaseCandles = 16;
    const baseP = refPrice; // 45,000
    const targetP = activePrice;

    const result: CandleData[] = [];
    let currentOpen = baseP;

    for (let i = 0; i < totalBaseCandles - 1; i++) {
      const progress = i / (totalBaseCandles - 1);
      const trendPrice = baseP + (targetP - baseP) * progress;
      const noise = (i % 4 === 1) ? -120 : (i % 3 === 0) ? 80 : 150;
      const cClose = Math.round(trendPrice + noise);
      const isBull = cClose >= currentOpen;
      const wickHigh = Math.round(Math.max(currentOpen, cClose) + (isBull ? 160 : 70));
      const wickLow = Math.round(Math.min(currentOpen, cClose) - (isBull ? 80 : 140));
      const vol = Math.round(75000 + progress * 140000 + (isBull ? 45000 : 10000));

      result.push({
        open: currentOpen,
        high: wickHigh,
        low: wickLow,
        close: cClose,
        volume: vol,
        isBullish: isBull,
      });

      currentOpen = cClose;
    }

    // Active live candle at the end (stretching wicks and close)
    const liveOpen = activeTick?.candleState?.open || currentOpen;
    const liveHigh = Math.max(activeTick?.candleState?.high || activePrice, liveOpen, activePrice);
    const liveLow = Math.min(activeTick?.candleState?.low || activePrice, liveOpen, activePrice);
    const liveClose = activePrice;
    const isLiveBull = liveClose >= liveOpen;

    result.push({
      open: liveOpen,
      high: liveHigh,
      low: liveLow,
      close: liveClose,
      volume: activeTick?.volume || 185000,
      isBullish: isLiveBull,
    });

    return result;
  }, [refPrice, activePrice, activeTick]);

  // Live OHLC reading from the latest candle
  const latestCandle = candles[candles.length - 1] || {
    open: 45000,
    high: 46500,
    low: 45000,
    close: activePrice,
    volume: 180000,
    isBullish: true,
  };

  // Dimensions & coordinate scaling
  const chartWidth = 720;
  const chartHeight = 260;
  const padLeft = 45;
  const padRight = 50;
  const padTop = 30;
  const padBottom = 65; // bottom reserved for volume bars

  const yPriceMax = ceilingPrice + 400; // ~48,500
  const yPriceMin = floorPrice - 400;   // ~41,700
  const priceRange = yPriceMax - yPriceMin || 1;

  const scaleY = (p: number) => {
    const usableHeight = chartHeight - padTop - padBottom;
    return padTop + (1 - (p - yPriceMin) / priceRange) * usableHeight;
  };

  // Reference lines Y coordinates
  const yCeiling = scaleY(ceilingPrice);
  const yRef = scaleY(refPrice);
  const yFloor = scaleY(floorPrice);

  // Candlestick rendering geometry
  const usableWidth = chartWidth - padLeft - padRight;
  const candleSlotWidth = usableWidth / candles.length;
  const candleBodyWidth = Math.max(5, candleSlotWidth * 0.58);

  // Max volume for bottom histogram
  const maxVol = Math.max(...candles.map((c) => c.volume), 1);
  const volPanelHeight = 45;

  // Trendline curve through candle closes
  const trendPoints = candles.map((c, idx) => ({
    x: padLeft + idx * candleSlotWidth + candleSlotWidth / 2,
    y: scaleY(c.close),
  }));
  const trendPolyline = trendPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const trendAreaPath = trendPoints.length > 0
    ? `M ${trendPoints[0]!.x},${chartHeight - padBottom} L ${trendPoints.map((p) => `${p.x},${p.y}`).join(" L ")} L ${trendPoints[trendPoints.length - 1]!.x},${chartHeight - padBottom} Z`
    : "";

  return (
    <div className="fomo-card">
      {/* 1. Ticker Header & Timeframe Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {/* Avatar Icon [V] */}
          <div className="fomo-ticker-avatar">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">
                VIN
              </span>
              <span className="text-xs text-slate-500 font-medium">
                VinAlpha Corp (HOSE)
              </span>
              <span className="sr-only">{symbol}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                {currentPrice.toLocaleString("vi-VN")}
              </span>
              <span className="text-xs font-bold text-slate-500">VND</span>

              {/* Dynamic Status Badge */}
              <span className={`fomo-chart-badge ${statusBadgeBg}`}>
                <StatusIcon size={12} />
                <span>{statusBadgeText}</span>
                {statusBadgeSubText && <span className="text-[10px] font-normal">{statusBadgeSubText}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selectors: 1s, 5s (active), 15s, 1m */}
        <div className="fomo-timeframe-group">
          {["1s", "5s", "15s", "1m"].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setSelectedTimeframe(tf)}
              className={`fomo-timeframe-btn ${selectedTimeframe === tf ? "active" : ""}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 4-Metric Summary Row */}
      <div className="fomo-metrics-strip">
        <div className="fomo-metric-card">
          <span className="fomo-metric-label">
            Khớp Lệnh Gần Nhất
          </span>
          <span className="fomo-metric-val text-emerald-600">
            {currentPrice.toLocaleString("vi-VN")} (+3.0%)
          </span>
          <span className="sr-only">Khớp Gần Nhất</span>
        </div>
        <div className="fomo-metric-card">
          <span className="fomo-metric-label">
            Dư Mua (Bid)
          </span>
          <span className={`fomo-metric-val ${isLiquidityFreeze ? "text-cyan-700 font-black" : "text-emerald-700"}`}>
            {depthData.bidVolume}
          </span>
        </div>
        <div className="fomo-metric-card">
          <span className="fomo-metric-label">
            Dư Bán (Ask)
          </span>
          <span className={`fomo-metric-val ${isCeiling ? "text-purple-700 font-black" : isFloor ? "text-rose-700 font-black" : "text-slate-800"}`}>
            {depthData.askVolume}
          </span>
        </div>
        <div className="fomo-metric-card">
          <span className="fomo-metric-label">
            Tổng Khối Lượng
          </span>
          <span className="fomo-metric-val text-slate-900">
            {depthData.totalVolume}
          </span>
        </div>
      </div>

      {/* 3. Professional Candlestick Chart Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-white p-3 shadow-xs">
        {/* Live OHLC Indicator Top Strip */}
        <div className="flex items-center gap-3 text-[11px] font-mono font-medium text-slate-500 mb-1 px-1">
          <span>O: {latestCandle.open.toLocaleString("vi-VN")}</span>
          <span>H: {latestCandle.high.toLocaleString("vi-VN")}</span>
          <span>L: {latestCandle.low.toLocaleString("vi-VN")}</span>
          <span>C: {latestCandle.close.toLocaleString("vi-VN")} (+3.0%)</span>
        </div>

        <svg
          className="w-full h-64 sm:h-72"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="candlestickAreaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle Grid Lines */}
          <line x1={padLeft} y1={padTop + 30} x2={chartWidth - padRight} y2={padTop + 30} stroke="#F1F5F9" strokeWidth="1" />
          <line x1={padLeft} y1={padTop + 80} x2={chartWidth - padRight} y2={padTop + 80} stroke="#F1F5F9" strokeWidth="1" />
          <line x1={padLeft} y1={padTop + 130} x2={chartWidth - padRight} y2={padTop + 130} stroke="#F1F5F9" strokeWidth="1" />

          {/* CEILING (TRẦN) Reference Line (Purple) */}
          <line
            x1={padLeft}
            y1={yCeiling}
            x2={chartWidth - padRight}
            y2={yCeiling}
            stroke="#C084FC"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <text
            x={padLeft}
            y={yCeiling - 5}
            fill="#9333EA"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            TRẦN: {ceilingPrice.toLocaleString("vi-VN")} VND (+6.90%)
          </text>
          <text
            x={chartWidth - padRight - 42}
            y={yCeiling - 5}
            fill="#A855F7"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            CEILING
          </text>

          {/* THAM CHIẾU (REF) Reference Line (Yellow / Slate) */}
          <line
            x1={padLeft}
            y1={yRef}
            x2={chartWidth - padRight}
            y2={yRef}
            stroke="#EAB308"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />
          <text
            x={padLeft}
            y={yRef - 5}
            fill="#B45309"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            THAM CHIẾU: {refPrice.toLocaleString("vi-VN")} VND
          </text>

          {/* FLOOR (SÀN) Reference Line (Cyan / Red) */}
          <line
            x1={padLeft}
            y1={yFloor}
            x2={chartWidth - padRight}
            y2={yFloor}
            stroke="#06B6D4"
            strokeDasharray="4 4"
            strokeWidth="1.2"
          />

          {/* Soft accumulation area glow under candles */}
          {trendAreaPath && (
            <path d={trendAreaPath} fill="url(#candlestickAreaGlow)" />
          )}

          {/* Smooth trend curve through closes */}
          {trendPolyline && (
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={trendPolyline}
              opacity={0.85}
            />
          )}

          {/* Candlesticks (Nến Nhật: Body + Wicks) */}
          {candles.map((c, idx) => {
            const candleX = padLeft + idx * candleSlotWidth + (candleSlotWidth - candleBodyWidth) / 2;
            const wickX = candleX + candleBodyWidth / 2;
            const wickY1 = scaleY(c.high);
            const wickY2 = scaleY(c.low);
            const bodyYTop = scaleY(Math.max(c.open, c.close));
            const bodyHeight = Math.max(3, Math.abs(scaleY(c.open) - scaleY(c.close)));
            const color = c.isBullish ? "#10B981" : "#EF4444";

            return (
              <g key={`candle-${idx}`}>
                {/* Wick (High to Low) */}
                <line
                  x1={wickX}
                  y1={wickY1}
                  x2={wickX}
                  y2={wickY2}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body (Open to Close) */}
                <rect
                  x={candleX}
                  y={bodyYTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.8"
                  rx="1"
                />
              </g>
            );
          })}

          {/* Pulsing Beacon at latest point */}
          {trendPoints.length > 0 && (
            <g className="fomo-pulse-dot">
              <circle
                cx={trendPoints[trendPoints.length - 1]!.x}
                cy={trendPoints[trendPoints.length - 1]!.y}
                r="8"
                fill={primaryStroke}
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.3"
              />
              <circle
                cx={trendPoints[trendPoints.length - 1]!.x}
                cy={trendPoints[trendPoints.length - 1]!.y}
                r="4.5"
                fill={primaryStroke}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Bottom Volume Histogram Panel (Accumulation Volume) */}
          {candles.map((c, idx) => {
            const barX = padLeft + idx * candleSlotWidth + (candleSlotWidth - candleBodyWidth) / 2;
            const barH = Math.max(4, (c.volume / maxVol) * volPanelHeight);
            const barY = chartHeight - 10 - barH;
            const color = c.isBullish ? "#10B981" : "#EF4444";

            return (
              <rect
                key={`vol-${idx}`}
                x={barX}
                y={barY}
                width={candleBodyWidth}
                height={barH}
                fill={color}
                opacity={0.65}
                rx="1"
              />
            );
          })}
        </svg>

        {/* Special Round 5 Frozen Banner Overlay */}
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
      <div className="fomo-matching-tape" aria-label="Order Matching Ticker">
        <div className="fomo-tape-track">
          <span className="text-emerald-700 font-bold flex items-center gap-1.5 flex-shrink-0 mr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            KHỚP LỆNH:
          </span>
          {(roundData?.matchingTape && roundData.matchingTape.length > 0
            ? [...roundData.matchingTape, ...roundData.matchingTape]
            : [
                { id: "m1", side: "BUY" as const, shares: 15000, price: 46200, text: "↑ +15,000 CP @ 46,200 (BUY)" },
                { id: "m2", side: "BUY" as const, shares: 28000, price: 46300, text: "↑ +28,000 CP @ 46,300 (BUY)" },
                { id: "m3", side: "BUY" as const, shares: 40000, price: 46350, text: "↑ +40,000 CP @ 46,350 (BUY)" },
              ]
          ).map((item, idx) => {
            const isBuy = item.side === "BUY";
            const displayText = item.text || `${isBuy ? "↑ +" : "↓ -"}${item.shares?.toLocaleString("vi-VN") || "15,000"} CP @ ${item.price?.toLocaleString("vi-VN")} (${isBuy ? "BUY" : "SELL"})`;
            const textColor = isBuy ? "#10B981" : "#EF4444";
            return (
              <React.Fragment key={`${item.id}-${idx}`}>
                <span
                  style={{ color: textColor }}
                  className="font-semibold flex items-center gap-1"
                >
                  {displayText}
                </span>
                <span className="text-slate-300">•</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
