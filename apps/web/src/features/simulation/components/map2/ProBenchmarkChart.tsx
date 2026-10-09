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
    <div className="pro-card" style={{ padding: "1.5rem" }}>
      {/* Header with Title, Live Feed Badge, Price & Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
              }}
            >
              <BarChart2 size={18} />
            </span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
              VN30 Index &amp; Multi-Asset Benchmark
            </h3>
            <span
              style={{
                display: "inline-block",
                padding: "0.2rem 0.55rem",
                borderRadius: "9999px",
                fontSize: "0.65rem",
                fontWeight: 900,
                letterSpacing: "0.05em",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                textTransform: "uppercase",
              }}
            >
              LIVE FEED
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#64748b" }}>
            <span>Real-time simulation composite rate</span>
            <span>•</span>
            <strong style={{ color: "#0f172a", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
              {compositePrice.index}
            </strong>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: compositePrice.bullish ? "#16a34a" : "#dc2626",
              }}
            >
              ({compositePrice.change} / {compositePrice.pct})
            </span>
          </div>
        </div>

        {/* Toggles (Candles/Line/Heikin & Timeframes) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          {/* Chart Type Toggle */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#f1f5f9",
              padding: "2px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            {(["candles", "line", "heikin"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setChartType(t)}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: chartType === t ? 700 : 500,
                  border: "none",
                  backgroundColor: chartType === t ? "#ffffff" : "transparent",
                  color: chartType === t ? "#0f172a" : "#64748b",
                  boxShadow: chartType === t ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t === "candles" ? "Candles" : t === "line" ? "Line" : "Heikin Ashi"}
              </button>
            ))}
          </div>

          {/* Timeframe Toggle */}
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#f1f5f9",
              padding: "2px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            {(["1Q", "2Q", "1Y", "3Y"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: timeframe === tf ? 700 : 500,
                  border: "none",
                  backgroundColor: timeframe === tf ? "#0f172a" : "transparent",
                  color: timeframe === tf ? "#ffffff" : "#64748b",
                  boxShadow: timeframe === tf ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Indicators Ribbon */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          padding: "0.55rem 0.85rem",
          borderRadius: "8px",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          fontSize: "0.78rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0d9488" }} />
          <span style={{ color: "#64748b" }}>MA(20):</span>
          <strong style={{ color: "#0f172a", fontFamily: "var(--font-mono)" }}>{compositePrice.ma20}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#1e293b" }} />
          <span style={{ color: "#64748b" }}>MA(50):</span>
          <strong style={{ color: "#0f172a", fontFamily: "var(--font-mono)" }}>{compositePrice.ma50}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ color: "#64748b" }}>RSI (14):</span>
          <strong style={{ color: "#0d9488", fontWeight: 700 }}>{compositePrice.rsi}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginLeft: "auto" }}>
          <span style={{ color: "#64748b" }}>Vol:</span>
          <strong style={{ color: "#0f172a", fontFamily: "var(--font-mono)" }}>{compositePrice.vol}</strong>
        </div>
      </div>

      {/* Institutional Light SVG Candlestick Canvas with Y-Axis */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "230px",
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          border: "1px solid #f1f5f9",
          padding: "0.5rem 0",
          display: "flex",
        }}
      >
        {/* Main Chart Canvas Area */}
        <div style={{ flex: 1, position: "relative", height: "100%" }}>
          {/* Grid lines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
              padding: "10px 0",
            }}
          >
            <div style={{ borderBottom: "1px dashed #e2e8f0", width: "100%" }} />
            <div style={{ borderBottom: "1px dashed #e2e8f0", width: "100%" }} />
            <div style={{ borderBottom: "1px dashed #e2e8f0", width: "100%" }} />
            <div style={{ borderBottom: "1px dashed #e2e8f0", width: "100%" }} />
          </div>

          {/* SVG Canvas for Candles & Lines */}
          <svg
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            viewBox="0 0 520 180"
            preserveAspectRatio="none"
          >
            {/* MA50 Line (Dark Slate) */}
            <path
              d={
                isBoom
                  ? "M 15 140 Q 140 120 280 88 T 505 45"
                  : isStagflation
                  ? "M 15 35 Q 140 60 280 100 T 505 145"
                  : "M 15 145 Q 140 135 280 120 T 505 105"
              }
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.8"
              strokeOpacity="0.85"
            />

            {/* MA20 Line (Teal) */}
            <path
              d={
                isBoom
                  ? "M 15 130 Q 140 105 280 72 T 505 28"
                  : isStagflation
                  ? "M 15 45 Q 140 75 280 115 T 505 155"
                  : "M 15 140 Q 140 125 280 105 T 505 85"
              }
              fill="none"
              stroke="#0d9488"
              strokeWidth="2.2"
              strokeOpacity="0.9"
            />

            {/* Candlesticks */}
            {chartType !== "line" ? (
              candles.map((c, i) => {
                const x = 25 + i * 41;
                const candleColor = c.bull ? "#0d9488" : "#e11d48";
                const bodyTop = Math.min(c.open, c.close) * 1.5 + 10;
                const bodyHeight = Math.max(5, Math.abs(c.open - c.close) * 1.5);
                const wickHigh = c.high * 1.5 + 10;
                const wickLow = c.low * 1.5 + 10;

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line x1={x} y1={wickHigh} x2={x} y2={wickLow} stroke={candleColor} strokeWidth="1.5" />
                    {/* Candle Body */}
                    <rect
                      x={x - 6.5}
                      y={bodyTop}
                      width={13}
                      height={bodyHeight}
                      fill={candleColor}
                      rx={1}
                    />
                  </g>
                );
              })
            ) : (
              <path
                d={
                  isBoom
                    ? "M 20 125 L 75 105 L 130 95 L 190 85 L 250 70 L 310 58 L 370 48 L 430 35 L 500 20"
                    : "M 20 35 L 75 60 L 130 80 L 190 98 L 250 118 L 310 130 L 370 142 L 430 155 L 500 165"
                }
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
              />
            )}
          </svg>
        </div>

        {/* Right-Hand Price Y-Axis Labels */}
        <div
          style={{
            width: "48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "5px 0.5rem 5px 0",
            fontSize: "0.7rem",
            color: "#94a3b8",
            fontFamily: "var(--font-mono)",
            textAlign: "right",
            borderLeft: "1px solid #f1f5f9",
          }}
        >
          <span>1,320</span>
          <span>1,280</span>
          <span>1,240</span>
          <span>1,200</span>
        </div>
      </div>

      {/* Volume Histogram along bottom */}
      <div
        style={{
          width: "100%",
          height: "44px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "4px 48px 0 10px",
          boxSizing: "border-box",
        }}
      >
        {candles.map((c, i) => (
          <div
            key={i}
            style={{
              width: "22px",
              height: `${Math.min(100, Math.max(15, (c.vol / 120) * 100))}%`,
              backgroundColor: c.bull ? "rgba(13, 148, 136, 0.45)" : "rgba(225, 29, 72, 0.45)",
              borderRadius: "3px 3px 0 0",
              transition: "height 0.25s ease",
            }}
          />
        ))}
      </div>

      {/* Timeline X-Axis Labels */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#94a3b8",
          padding: "0 0.5rem",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "0.5rem",
        }}
      >
        <span>Previous Cycle (Q4)</span>
        <span>Month 1 (Allocated)</span>
        <span>Month 2 (Consolidation)</span>
        <strong style={{ color: "#0f172a", fontWeight: 700 }}>
          Current Target (Q{currentQuarter} End)
        </strong>
      </div>
    </div>
  );
};

