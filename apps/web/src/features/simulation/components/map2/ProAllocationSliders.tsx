import React, { useState, useEffect } from "react";
import type { Map2Allocation } from "../../types/map-game.types";
import { PieChart, AlertCircle, CheckCircle2, Sliders, ArrowRight } from "lucide-react";

interface ProAllocationSlidersProps {
  currentAllocation: Map2Allocation;
  currentQuarter: number;
  isCommitting: boolean;
  onCommitQuarter: (allocation: Map2Allocation) => Promise<void>;
}

export const ProAllocationSliders: React.FC<ProAllocationSlidersProps> = ({
  currentAllocation,
  currentQuarter,
  isCommitting,
  onCommitQuarter,
}) => {
  const [allocation, setAllocation] = useState<Map2Allocation>(currentAllocation);

  useEffect(() => {
    setAllocation(currentAllocation);
  }, [currentAllocation]);

  const total = allocation.growth + allocation.value + allocation.bond + allocation.cash;
  const isValid = Math.abs(total - 100) < 0.01;

  const handleSliderChange = (asset: keyof Map2Allocation, value: number) => {
    setAllocation((prev) => ({
      ...prev,
      [asset]: value,
    }));
  };

  const handleAutoNormalize = () => {
    if (total === 0) {
      setAllocation({ growth: 25, value: 25, bond: 25, cash: 25 });
      return;
    }
    const factor = 100 / total;
    const g = Math.round(allocation.growth * factor);
    const v = Math.round(allocation.value * factor);
    const b = Math.round(allocation.bond * factor);
    const c = 100 - (g + v + b);
    setAllocation({ growth: g, value: v, bond: b, cash: Math.max(0, c) });
  };

  const handleCommit = async () => {
    if (!isValid) return;
    await onCommitQuarter(allocation);
  };

  // Donut Chart SVG calculations
  const donutColors = {
    growth: "#EF4444", // Rose
    value: "#10B981",  // Emerald
    bond: "#3B82F6",   // Blue
    cash: "#F59E0B",   // Amber
  };

  // Build SVG conic gradient or path segments
  const cumulative = [
    { key: "growth", val: allocation.growth, color: donutColors.growth, label: "Tăng trưởng" },
    { key: "value", val: allocation.value, color: donutColors.value, label: "Giá trị" },
    { key: "bond", val: allocation.bond, color: donutColors.bond, label: "Trái phiếu" },
    { key: "cash", val: allocation.cash, color: donutColors.cash, label: "Tiền mặt" },
  ];

  return (
    <div className="pro-allocation-sliders card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Sliders size={18} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              Phân Bổ Tài Sản Quý {currentQuarter}
            </h4>
            <span className="text-xs text-slate-400">
              Tổng tỷ trọng bắt buộc phải bằng đúng 100%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              isValid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {isValid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            <span>Tổng: {total}%</span>
          </span>

          {!isValid && (
            <button
              type="button"
              onClick={handleAutoNormalize}
              className="btn btn-outline py-1 px-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              title="Tự động cân bằng về 100%"
            >
              Cân bằng 100%
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Sliders Column (2 cols on md) */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* EQ_GROWTH */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Cổ phiếu Tăng trưởng (EQ_GROWTH)
              </span>
              <span className="font-mono font-bold text-slate-900">{allocation.growth}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={allocation.growth}
              onChange={(e) => handleSliderChange("growth", Number(e.target.value))}
              className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* EQ_VALUE */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Cổ phiếu Giá trị / Phòng thủ (EQ_VALUE)
              </span>
              <span className="font-mono font-bold text-slate-900">{allocation.value}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={allocation.value}
              onChange={(e) => handleSliderChange("value", Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* BOND */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Trái phiếu Doanh nghiệp (BOND)
              </span>
              <span className="font-mono font-bold text-slate-900">{allocation.bond}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={allocation.bond}
              onChange={(e) => handleSliderChange("bond", Number(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* CASH */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Tiền gửi / Tiết kiệm linh hoạt (CASH)
              </span>
              <span className="font-mono font-bold text-slate-900">{allocation.cash}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={allocation.cash}
              onChange={(e) => handleSliderChange("cash", Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Donut Chart Visualizer Column */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Simple CSS Conic Gradient Donut representation */}
            <div
              className="w-28 h-28 rounded-full shadow-inner transition-all duration-300"
              style={{
                background: `conic-gradient(
                  ${donutColors.growth} 0% ${allocation.growth}%,
                  ${donutColors.value} ${allocation.growth}% ${allocation.growth + allocation.value}%,
                  ${donutColors.bond} ${allocation.growth + allocation.value}% ${allocation.growth + allocation.value + allocation.bond}%,
                  ${donutColors.cash} ${allocation.growth + allocation.value + allocation.bond}% 100%
                )`,
              }}
            />
            {/* Center Cutout Hole */}
            <div className="absolute w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center shadow-xs">
              <PieChart size={16} className="text-slate-400 mb-0.5" />
              <span className="text-[10px] font-bold text-slate-700">{total}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-[10px] text-slate-600">
            {cumulative.map((item) => (
              <div key={item.key} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}: {item.val}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Warning & Submit Button */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {!isValid ? (
          <span className="text-xs text-rose-600 flex items-center gap-1 font-semibold">
            <AlertCircle size={14} />
            Tổng tỷ trọng chưa bằng 100%. Vui lòng điều chỉnh thanh trượt hoặc nhấn "Cân bằng 100%".
          </span>
        ) : (
          <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
            <CheckCircle2 size={14} />
            Danh mục hợp lệ. Sẵn sàng chốt phân bổ cho Quý {currentQuarter}.
          </span>
        )}

        <button
          type="button"
          disabled={!isValid || isCommitting}
          onClick={handleCommit}
          className="btn btn-primary py-2.5 px-6 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-40 w-full md:w-auto"
        >
          <span>Chốt Phân Bổ Quý {currentQuarter}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
