import React from "react";
import { TrendingUp, Shield, DollarSign, X } from "lucide-react";

interface MacroExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacroExplanationModal: React.FC<MacroExplanationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="macro-explainer-title"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">
              MÔ HÌNH NHẠY CẢM VĨ MÔ
            </span>
            <h3 id="macro-explainer-title" className="text-lg font-bold text-slate-900">
              Cơ Chế Phản Ứng Dây Chuyền Vĩ Mô &amp; Định Giá Tài Sản
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[70vh]">
          {/* Chain Reaction Step Diagram */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col gap-2">
            <span className="text-xs font-bold text-blue-900 uppercase">
              Chuỗi phản ứng khi Ngân hàng Trung ương tăng lãi suất:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 text-center text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-xs font-semibold text-slate-800">
                1. Lãi suất điều hành tăng (Rate ↑)
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-xs font-semibold text-slate-800">
                2. Chi phí vốn &amp; Lãi vay doanh nghiệp tăng
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-xs font-semibold text-slate-800">
                3. Hệ số P/E bị chiết khấu, giá trị định giá giảm
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-blue-200 shadow-xs font-semibold text-slate-800">
                4. Dòng tiền dịch chuyển sang Phòng thủ &amp; Tiền mặt
              </div>
            </div>
          </div>

          {/* 4 Asset Sensitivity Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* EQ_GROWTH */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-rose-600" /> Cổ Phiếu Tăng Trưởng (EQ_GROWTH)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  Beta Lãi Suất: -2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Các doanh nghiệp công nghệ, bán lẻ có P/E cao. Bùng nổ khi lãi suất thấp nhưng giảm sâu nhất khi chi phí vốn tăng vọt.
              </p>
            </div>

            {/* EQ_VALUE */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-600" /> Cổ Phiếu Giá Trị (EQ_VALUE)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Beta Lãi Suất: -0.5
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Năng lượng, tiện ích, ít nợ vay, cổ tức tiền mặt 8-10%/năm. Chống chịu kiên cường qua thời kỳ lạm phát và đình lạm.
              </p>
            </div>

            {/* BOND */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-blue-600" /> Trái Phiếu Doanh Nghiệp (BOND)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Lợi tức: 7.5%/năm
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Mang lại dòng tiền cố định đều đặn, độ biến động thấp (sigma=0.5%). Giá giảm nhẹ khi lãi suất thị trường tăng.
              </p>
            </div>

            {/* CASH */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-amber-600" /> Tiền Gửi Tiết Kiệm (CASH)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Lợi tức: 4.0%/năm
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                An toàn tuyệt đối, thanh khoản tức thì. Lợi tức tăng theo lãi suất điều hành và cung cấp 'đạn dược' để gom tài sản giá rẻ khi suy thoái tạo đáy.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[11px]">
            <strong>Lời khuyên của Graham &amp; Buffett:</strong> "Không cần dự đoán chính xác thời điểm thị trường đảo chiều; sự phân bổ kỷ luật và biên an toàn sẽ bảo vệ tài sản của bạn."
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary py-2 px-5 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            Đã hiểu cơ chế vĩ mô
          </button>
        </div>
      </div>
    </div>
  );
};
