import React, { useState, useEffect } from "react";
import type { Map2Allocation } from "../../types/map-game.types";
import { AlertCircle, CheckCircle2, Sliders, ArrowRight, RotateCcw } from "lucide-react";

interface ProAllocationSlidersProps {
  currentAllocation: Map2Allocation;
  currentQuarter: number;
  isCommitting: boolean;
  onCommitQuarter: (allocation: Map2Allocation) => Promise<void>;
}

const defaultAllocation: Map2Allocation = { growth: 25, value: 25, bond: 25, cash: 25 };

export const ProAllocationSliders: React.FC<ProAllocationSlidersProps> = ({
  currentAllocation,
  currentQuarter,
  isCommitting,
  onCommitQuarter,
}) => {
  const [allocation, setAllocation] = useState<Map2Allocation>(currentAllocation || defaultAllocation);

  useEffect(() => {
    if (currentAllocation) {
      setAllocation(currentAllocation);
    }
  }, [currentAllocation]);

  const activeAlloc = allocation || defaultAllocation;
  const total = (activeAlloc.growth ?? 0) + (activeAlloc.value ?? 0) + (activeAlloc.bond ?? 0) + (activeAlloc.cash ?? 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const handleSliderChange = (asset: keyof Map2Allocation, value: number) => {
    setAllocation((prev) => {
      const base = prev || defaultAllocation;
      return {
        ...base,
        [asset]: value,
      };
    });
  };

  const handleAutoNormalize = () => {
    if (total === 0) {
      setAllocation({ growth: 25, value: 25, bond: 25, cash: 25 });
      return;
    }
    const factor = 100 / total;
    const g = Math.round(activeAlloc.growth * factor);
    const v = Math.round(activeAlloc.value * factor);
    const b = Math.round(activeAlloc.bond * factor);
    const c = 100 - (g + v + b);
    setAllocation({ growth: g, value: v, bond: b, cash: Math.max(0, c) });
  };

  const handleCommit = async () => {
    if (!isValid || isCommitting) return;
    await onCommitQuarter(activeAlloc);
  };

  // 4-Asset Colors & Labels
  const donutColors = {
    growth: "#F43F5E", // Rose
    value: "#10B981",  // Emerald
    bond: "#3B82F6",   // Blue
    cash: "#F59E0B",   // Amber
  };

  const assets = [
    { key: "growth" as const, val: activeAlloc.growth, color: donutColors.growth, label: "Tăng trưởng (Growth)", beta: "β = 1.4" },
    { key: "value" as const, val: activeAlloc.value, color: donutColors.value, label: "Giá trị (Value)", beta: "β = 0.7" },
    { key: "bond" as const, val: activeAlloc.bond, color: donutColors.bond, label: "Trái phiếu (Bond)", beta: "7.5%/năm" },
    { key: "cash" as const, val: activeAlloc.cash, color: donutColors.cash, label: "Tiền mặt (Cash)", beta: "4.0%/năm" },
  ];

  // SVG Donut calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const donutSlices = assets.map((item) => {
    const strokeDasharray = `${(Math.max(0, item.val) / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += Math.max(0, item.val);
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="pro-allocation-sliders card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
            <Sliders size={20} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Phân Bổ Danh Mục Quý {currentQuarter}
            </h4>
            <span className="text-xs text-slate-400">
              Điều chỉnh 4 lớp tài sản • Tổng tỷ trọng phải đúng bằng 100%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 transition-colors ${
              isValid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isValid ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>Tổng: {total}%</span>
          </span>

          {!isValid && (
            <button
              type="button"
              onClick={handleAutoNormalize}
              className="btn btn-outline py-1 px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1 border-slate-300"
              title="Tự động cân bằng về 100%"
            >
              <RotateCcw size={12} />
              <span>Cân bằng 100%</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Sliders Column (2 cols on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-3.5">
          {/* EQ_GROWTH */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100 transition-colors hover:border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Cổ phiếu Tăng trưởng (EQ_GROWTH)
                </span>
                <span className="text-[11px] text-slate-400 ml-4.5 block">
                  Beta thị trường: 1.4 • Nhạy lãi suất cao (Beta Rate: -2.0) • P/E cao
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeAlloc.growth}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={activeAlloc.growth}
              onChange={(e) => handleSliderChange("growth", Number(e.target.value))}
              className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Tỷ trọng EQ_GROWTH"
            />
          </div>

          {/* EQ_VALUE */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100 transition-colors hover:border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Cổ phiếu Giá trị / Phòng thủ (EQ_VALUE)
                </span>
                <span className="text-[11px] text-slate-400 ml-4.5 block">
                  Beta thị trường: 0.7 • Cổ tức tiền mặt 8-10%/năm • P/E thấp • Ít nợ vay
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeAlloc.value}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={activeAlloc.value}
              onChange={(e) => handleSliderChange("value", Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Tỷ trọng EQ_VALUE"
            />
          </div>

          {/* BOND */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100 transition-colors hover:border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Trái phiếu Doanh nghiệp / Chính phủ (BOND)
                </span>
                <span className="text-[11px] text-slate-400 ml-4.5 block">
                  Kỳ hạn 1 năm • Lợi suất cố định 7.50%/năm (1.875%/quý) • Rủi ro thấp
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeAlloc.bond}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={activeAlloc.bond}
              onChange={(e) => handleSliderChange("bond", Number(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Tỷ trọng BOND"
            />
          </div>

          {/* CASH */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100 transition-colors hover:border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Tiền gửi / Tiết kiệm linh hoạt (CASH)
                </span>
                <span className="text-[11px] text-slate-400 ml-4.5 block">
                  Lợi tức 4.00%/năm (1.0%/quý) • Thanh khoản tức thì • An toàn vốn tuyệt đối
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeAlloc.cash}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={activeAlloc.cash}
              onChange={(e) => handleSliderChange("cash", Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              aria-label="Tỷ trọng CASH"
            />
          </div>
        </div>

        {/* Real-Time SVG Donut Chart Visualizer Column */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            TỶ TRỌNG DANH MỤC HIỆN TẠI
          </span>

          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 100 100"
              role="img"
              aria-label="Biểu đồ tỷ trọng danh mục tài sản"
            >
              {/* Background circle track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200"
                strokeWidth="12"
                fill="transparent"
              />

              {/* Dynamic SVG Arcs */}
              {donutSlices.map((slice) => {
                if (slice.val <= 0) return null;
                return (
                  <circle
                    key={slice.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={slice.color}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 ease-out"
                  />
                );
              })}
            </svg>

            {/* Center Cutout Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-base font-black font-mono ${isValid ? "text-slate-900" : "text-rose-600"}`}>
                {total}%
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {isValid ? "Hợp lệ" : "Chưa đủ"}
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[11px] text-slate-600 font-medium w-full">
            {assets.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap max-w-[70px]">{item.key.toUpperCase()}</span>
                </div>
                <strong className="font-mono text-slate-900">{item.val}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Warning & Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {!isValid ? (
          <span className="text-xs text-rose-600 flex items-center gap-1.5 font-semibold text-center sm:text-left">
            <AlertCircle size={15} />
            Tổng tỷ trọng hiện tại là {total}%. Vui lòng điều chỉnh hoặc nhấn "Cân bằng 100%".
          </span>
        ) : (
          <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-semibold text-center sm:text-left">
            <CheckCircle2 size={15} />
            Danh mục đạt chuẩn 100%. Sẵn sàng chốt phân bổ Quý {currentQuarter}.
          </span>
        )}

        <button
          type="button"
          disabled={!isValid || isCommitting}
          onClick={handleCommit}
          className="btn btn-primary py-2.5 px-6 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-40 w-full sm:w-auto"
        >
          <span>Chốt Phân Bổ Quý {currentQuarter}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
