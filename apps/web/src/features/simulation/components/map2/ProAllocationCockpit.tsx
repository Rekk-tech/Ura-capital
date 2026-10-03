import React from "react";
import type { Map2Allocation } from "../../types/map-game.types";
import { formatCurrency } from "../../../portfolio/utils/portfolioCalculations";
import { Sliders, RefreshCw, Lock, ArrowRight } from "lucide-react";

interface ProAllocationCockpitProps {
  currentQuarter: number;
  stageKey: string;
  allocation: Map2Allocation;
  currentNav: number;
  isCommitting: boolean;
  onAllocationChange: (newAllocation: Map2Allocation) => void;
  onCommit: () => void;
}

export const ProAllocationCockpit: React.FC<ProAllocationCockpitProps> = ({
  currentQuarter,
  stageKey,
  allocation,
  currentNav,
  isCommitting,
  onAllocationChange,
  onCommit,
}) => {
  const total = allocation.growth + allocation.value + allocation.bond + allocation.cash;
  const isValid = total === 100;

  const handleSliderChange = (key: keyof Map2Allocation, val: number) => {
    onAllocationChange({
      ...allocation,
      [key]: val,
    });
  };

  const handleAutoBalance = () => {
    // Stage-aware recommended balance
    if (stageKey === "BOOM") {
      onAllocationChange({ growth: 40, value: 30, bond: 15, cash: 15 });
    } else if (stageKey === "STAGFLATION") {
      onAllocationChange({ growth: 15, value: 25, bond: 30, cash: 30 });
    } else if (stageKey === "RECESSION") {
      onAllocationChange({ growth: 20, value: 40, bond: 25, cash: 15 });
    } else {
      onAllocationChange({ growth: 45, value: 25, bond: 20, cash: 10 });
    }
  };

  // Asset configurations matching Figma mockups
  const assetSpecs = [
    {
      key: "growth" as const,
      ticker: "EQ_GROWTH",
      name: "1. Growth Equity ($EQ_GROWTH)",
      desc: "VinAlpha, Tech Leaders, Clean Energy",
      badge: stageKey === "STAGFLATION" ? "-6.8% QoQ" : stageKey === "BOOM" ? "+4.2% QoQ" : null,
      badgeColor: stageKey === "STAGFLATION" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      color: "#3b82f6",
      sliderAccent: "accent-blue-600",
      pct: allocation.growth,
      amount: Math.round((currentNav * allocation.growth) / 100),
    },
    {
      key: "value" as const,
      ticker: "EQ_VALUE",
      name: "2. Value Equity ($EQ_VALUE)",
      desc: "Ngân hàng, Tiêu dùng, BĐS Khu Công Nghiệp",
      badge: "Beta 0.7",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      color: "#06b6d4",
      sliderAccent: "accent-cyan-600",
      pct: allocation.value,
      amount: Math.round((currentNav * allocation.value) / 100),
    },
    {
      key: "bond" as const,
      ticker: "BOND",
      name: "3. Government Bonds ($BOND)",
      desc: "Trái phiếu chính phủ 5Y (Lợi suất cố định)",
      badge: stageKey === "STAGFLATION" ? "Yield 6.8%" : "Yield 7.5%",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      color: "#10b981",
      sliderAccent: "accent-emerald-600",
      pct: allocation.bond,
      amount: Math.round((currentNav * allocation.bond) / 100),
    },
    {
      key: "cash" as const,
      ticker: "CASH",
      name: "4. Cash & Reserves ($CASH)",
      desc: "Tiền gửi thanh khoản cao & Quản trị rủi ro",
      badge: "An toàn",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      color: "#f59e0b",
      sliderAccent: "accent-amber-500",
      pct: allocation.cash,
      amount: Math.round((currentNav * allocation.cash) / 100),
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
              <Sliders size={16} />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Phân Bổ Danh Mục Quý {currentQuarter}
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                isValid
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                  : "bg-rose-50 text-rose-700 border border-rose-300"
              }`}
            >
              {isValid ? "Hợp Lệ: 100%" : `Chưa Đủ: ${total}%`}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Thiết lập tỷ trọng phân bổ vốn trước khi đóng chu kỳ quý
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoBalance}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
        >
          <RefreshCw size={12} />
          <span>Tự Động Cân Bằng 100%</span>
        </button>
      </div>

      {/* Multi-color Segmented Progress Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner border border-slate-200/60">
          <div style={{ width: `${allocation.growth}%`, backgroundColor: "#3b82f6" }} className="transition-all duration-200" title={`Growth: ${allocation.growth}%`} />
          <div style={{ width: `${allocation.value}%`, backgroundColor: "#06b6d4" }} className="transition-all duration-200" title={`Value: ${allocation.value}%`} />
          <div style={{ width: `${allocation.bond}%`, backgroundColor: "#10b981" }} className="transition-all duration-200" title={`Bond: ${allocation.bond}%`} />
          <div style={{ width: `${allocation.cash}%`, backgroundColor: "#f59e0b" }} className="transition-all duration-200" title={`Cash: ${allocation.cash}%`} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-medium text-slate-600 px-0.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
            <span>Growth ({allocation.growth}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#06b6d4" }} />
            <span>Value ({allocation.value}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10b981" }} />
            <span>Bonds ({allocation.bond}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            <span>Cash ({allocation.cash}%)</span>
          </div>
        </div>
      </div>

      {/* 4 Asset Allocation Sliders */}
      <div className="flex flex-col gap-3">
        {assetSpecs.map((item) => (
          <div
            key={item.key}
            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>

              {/* Percentage & Amount */}
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-black font-mono text-slate-900">{item.pct} %</span>
              </div>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={item.pct}
                onChange={(e) => handleSliderChange(item.key, Number(e.target.value))}
                className={`w-full h-1.5 rounded-lg bg-slate-200 cursor-pointer ${item.sliderAccent}`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/40">
              <span className="text-slate-400">Số tiền phân bổ:</span>
              <strong className="font-mono text-slate-800 font-semibold">{formatCurrency(item.amount)}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Total Verification Bar */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">Tổng tỷ lệ xác lập:</span>
        <strong
          className={`font-mono text-sm font-black ${
            isValid ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {total}% / 100%
        </strong>
      </div>

      {/* Commit CTA Button */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!isValid || isCommitting}
          onClick={onCommit}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
            isValid && !isCommitting
              ? "bg-slate-900 hover:bg-slate-950 text-white cursor-pointer active:scale-[0.99]"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isCommitting ? (
            <span>Đang ghi nhận phân bổ...</span>
          ) : (
            <>
              <span>XÁC NHẬN &amp; CHỐT QUÝ {currentQuarter}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed flex items-center justify-center gap-1">
          <Lock size={12} className="flex-shrink-0" />
          <span>Quyết định sẽ chốt phân bổ cho 3 tháng tiếp theo. Không thể rút lệnh sau khi xác nhận.</span>
        </p>
      </div>
    </div>
  );
};
