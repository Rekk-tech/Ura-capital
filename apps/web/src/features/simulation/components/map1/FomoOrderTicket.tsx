import React, { useState } from "react";
import type { Map1OrderInput, Map1Phase } from "../../types/map-game.types";
import { Zap, Shield, Lock, ArrowRight, ShoppingCart, TrendingDown } from "lucide-react";

interface FomoOrderTicketProps {
  phase: Map1Phase;
  round?: number;
  cash: number;
  shares: number;
  marginUsed: number;
  nav: number;
  currentPrice: number;
  canUseMargin: boolean;
  freeStopLossAwarded: boolean;
  isSubmitting: boolean;
  onSubmitOrder: (input: Map1OrderInput) => Promise<void>;
}

export const FomoOrderTicket: React.FC<FomoOrderTicketProps> = ({
  phase,
  round: _round = 2,
  cash,
  shares,
  marginUsed: _marginUsed,
  nav: _nav,
  currentPrice,
  canUseMargin,
  freeStopLossAwarded,
  isSubmitting,
  onSubmitOrder,
}) => {
  const [activeTab, setActiveTab] = useState<"BUY" | "SELL">("BUY");
  const [selectedPercentage, setSelectedPercentage] = useState<number>(50);
  const [leverageMode, setLeverageMode] = useState<"1x" | "2x">("1x");
  const [hasStopLoss, setHasStopLoss] = useState<boolean>(false);

  const isTradingOpen = phase === "trading_window";

  // Effective leverage & buying power
  const useMargin = leverageMode === "2x" && canUseMargin;
  const buyingPower = useMargin ? cash * 2 : cash;

  // Order summary calculations
  const rawTargetAmount = activeTab === "BUY"
    ? Math.floor(buyingPower * (selectedPercentage / 100))
    : Math.floor(shares * (selectedPercentage / 100)) * currentPrice;

  // Shares calculated in lots of 10 or single units
  const sharesCalculated = activeTab === "BUY"
    ? Math.floor(rawTargetAmount / (currentPrice || 1))
    : Math.floor(shares * (selectedPercentage / 100));

  const actualTradeValue = sharesCalculated * currentPrice;
  // Transparent 0.15% transaction fee (Resolving Review Issue 2.1)
  const transactionFee = Math.round(actualTradeValue * 0.0015);
  const totalSettlementCost = actualTradeValue + transactionFee;

  const handleExecute = async () => {
    if (!isTradingOpen || isSubmitting) return;

    if (activeTab === "BUY") {
      await onSubmitOrder({
        action: "BUY",
        percentage: selectedPercentage,
        useMargin,
        hasStopLoss: hasStopLoss || freeStopLossAwarded,
      });
    } else {
      await onSubmitOrder({
        action: "SELL",
        percentage: selectedPercentage,
      });
    }
  };

  return (
    <div className="fomo-order-ticket card-aura p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Đặt Lệnh Nhanh
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Fast Execution Desk • Kỳ hạn: 45 giây
          </p>
        </div>

        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
          <Zap size={18} />
        </div>
      </div>

      {/* 2. Buy / Sell Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200/60">
        <button
          type="button"
          onClick={() => setActiveTab("BUY")}
          className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "BUY"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShoppingCart size={14} />
          <span>MUA (BUY)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SELL")}
          className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "SELL"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <TrendingDown size={14} />
          <span>BÁN (SELL)</span>
        </button>
      </div>

      {/* 3. KHỐI LƯỢNG VÀO LỆNH */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            KHỐI LƯỢNG VÀO LỆNH:
          </span>
          <span className="text-[11px] text-slate-400">
            {activeTab === "BUY" ? `Khả dụng: ${cash.toLocaleString("vi-VN")} đ` : `Cổ phiếu: ${shares} cp`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[25, 50, 100].map((pct) => {
            const isAllIn = pct === 100;
            const isSelected = selectedPercentage === pct;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => setSelectedPercentage(pct)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? isAllIn
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : isAllIn
                    ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {isAllIn ? "100% ALL-IN" : `${pct}%`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ĐÒN BẨY (LEVERAGE) — Strict Margin Lock (Resolving Review Issue 1.5) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            ĐÒN BẨY (LEVERAGE):
          </span>
          {!canUseMargin && (
            <span className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
              <Lock size={10} /> Mở khóa từ Round 3
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* 1x (Gốc) */}
          <button
            type="button"
            onClick={() => setLeverageMode("1x")}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
              leverageMode === "1x"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            1x (Gốc)
          </button>

          {/* MARGIN x2 (Strictly unlocked from Round 3) */}
          <button
            type="button"
            disabled={!canUseMargin}
            onClick={() => setLeverageMode("2x")}
            title={!canUseMargin ? "Mở khóa đòn bẩy từ Round 3" : "Kích hoạt đòn bẩy Margin x2"}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
              leverageMode === "2x" && canUseMargin
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : canUseMargin
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
            }`}
          >
            {!canUseMargin && <Lock size={11} />}
            <span>MARGIN x2</span>
          </button>

          {/* MARGIN x5 HIGH RISK (Locked for MVP) */}
          <div className="relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-rose-500 text-white shadow-xs z-10 whitespace-nowrap">
              FOMO Booster
            </span>
            <button
              type="button"
              disabled
              title="Khóa bảo vệ kỷ luật - Không khuyến khích đầu cơ đòn bẩy quá cao"
              className="w-full py-2 px-1 rounded-xl text-[11px] font-bold border bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed flex items-center justify-center gap-0.5 opacity-60"
            >
              <Lock size={10} />
              <span>MARGIN x5</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Stop-loss Hedge Toggle */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasStopLoss || freeStopLossAwarded}
            onChange={(e) => setHasStopLoss(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Shield size={13} className="text-blue-600" />
            Cắt lỗ tự động (-7%)
          </span>
        </label>
        {freeStopLossAwarded && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Thưởng từ Quiz
          </span>
        )}
      </div>

      {/* 6. Order Summary Calculation with Transparent 0.15% Fee (Review Issue 2.1) */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Khối lượng dự tính:</span>
          <span className="font-bold font-mono text-slate-900">
            {sharesCalculated.toLocaleString("vi-VN")} Cổ phiếu $FOMO
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Mức giá khớp:</span>
          <span className="font-bold font-mono text-slate-900">
            {currentPrice.toLocaleString("vi-VN")} VND (Giá Trần)
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Phí giao dịch mô phỏng (0.15%):</span>
          <span className="font-mono text-slate-700">
            {transactionFee.toLocaleString("vi-VN")} VND
          </span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
          <span className="font-bold text-slate-900">Tổng tiền thanh toán:</span>
          <div className="text-right">
            <span className="text-base md:text-lg font-black font-mono text-slate-900">
              {totalSettlementCost.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-semibold text-slate-500 ml-1">VND</span>
          </div>
        </div>
      </div>

      {/* 7. Big Execution Action Button */}
      <button
        type="button"
        disabled={!isTradingOpen || isSubmitting || (activeTab === "BUY" && cash < currentPrice) || (activeTab === "SELL" && shares <= 0)}
        onClick={handleExecute}
        className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-slate-900 hover:bg-slate-800 active:scale-98 text-white flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none"
      >
        <span>Khớp Lệnh Ngay (Execute Order)</span>
        <ArrowRight size={16} />
      </button>

      {/* 8. Disclaimer Notice */}
      <p className="text-[11px] text-amber-700 leading-snug bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-center">
        ⚠️ Chế độ mô phỏng tâm lý đầu cơ. Hãy cảnh giác với bẫy FOMO khi giá đã chạm trần liên tục.
      </p>
    </div>
  );
};
