import React from "react";
import type { Map1PricePoint } from "../../types/map-game.types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FomoPriceChartProps {
  symbol: string;
  currentPrice: number;
  initialPrice: number;
  priceChangePercent: number;
  pricePoints: Map1PricePoint[];
}

export const FomoPriceChart: React.FC<FomoPriceChartProps> = ({
  symbol,
  currentPrice,
  initialPrice,
  priceChangePercent,
  pricePoints,
}) => {
  const isPositive = priceChangePercent >= 0;

  // Chart dimensions
  const width = 500;
  const height = 180;
  const padding = 20;

  // Compute min and max price for scaling
  const prices = pricePoints.map((p) => p.price);
  const minPrice = Math.min(initialPrice * 0.9, ...prices);
  const maxPrice = Math.max(initialPrice * 1.15, ...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Compute SVG polyline path
  const points = pricePoints.map((p) => {
    // x scaled from 0s to 315s (7 rounds * 45s)
    const x = padding + (p.second / 315) * (width - padding * 2);
    // y scaled from minPrice to maxPrice inverted
    const y = height - padding - ((p.price - minPrice) / priceRange) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polylinePoints = points.join(" ");

  return (
    <div className="fomo-price-chart card-aura p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-slate-900 tracking-tight">{symbol}</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-600">
            Khớp lệnh thời gian thực
          </span>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black font-mono text-slate-900">
            {currentPrice.toLocaleString("vi-VN")} <span className="text-sm font-normal text-slate-500">VND</span>
          </div>
          <div className={`flex items-center justify-end gap-1 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isPositive ? `+${priceChangePercent}%` : `${priceChangePercent}%`}</span>
            <span className="text-slate-400 font-normal">so với tham chiếu 10,000</span>
          </div>
        </div>
      </div>

      {/* SVG Price Chart */}
      <div className="relative w-full h-44 bg-slate-50/50 rounded-lg overflow-hidden border border-slate-100 p-1 flex items-center justify-center">
        {pricePoints.length > 1 ? (
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#E2E8F0" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#E2E8F0" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E2E8F0" strokeDasharray="3 3" />

            {/* Price Line */}
            <polyline
              fill="none"
              stroke={isPositive ? "#10B981" : "#EF4444"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />

            {/* Current Price Dot */}
            {points.length > 0 && (
              <circle
                cx={points[points.length - 1]!.split(",")[0]}
                cy={points[points.length - 1]!.split(",")[1]}
                r="5"
                fill={isPositive ? "#10B981" : "#EF4444"}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            )}
          </svg>
        ) : (
          <span className="text-xs text-slate-400">Đang khởi tạo chuỗi giá...</span>
        )}
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
        <span>Đáy chu kỳ: {Math.round(minPrice).toLocaleString("vi-VN")} VND</span>
        <span>Đỉnh chu kỳ: {Math.round(maxPrice).toLocaleString("vi-VN")} VND</span>
      </div>
    </div>
  );
};
