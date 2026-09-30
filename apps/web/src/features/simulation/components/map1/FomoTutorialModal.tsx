import React from "react";
import { BookOpen, CheckCircle, Zap, ShieldAlert, ArrowRight, X } from "lucide-react";

interface FomoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: () => void;
}

export const FomoTutorialModal: React.FC<FomoTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fomo-tutorial-title"
      className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">
                ROUND 0 · HƯỚNG DẪN TÂN THỦ
              </span>
              <h3 id="fomo-tutorial-title" className="text-lg font-bold text-slate-900">
                Làm Quen Đấu Trường FOMO Arena
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
            aria-label="Đóng hướng dẫn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[70vh]">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <strong>Mục tiêu sống còn:</strong> Bảo toàn vốn và sống sót qua 7 Round giông bão với số vốn khởi điểm <strong>10,000,000 VND</strong>.
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                <CheckCircle size={15} />
              </div>
              <div>
                <strong className="text-slate-900 block text-sm">Chu kỳ 4 pha mỗi Round (45s)</strong>
                <p>
                  0s-10s đọc tin tức & bot chat · 10s-30s cửa sổ đặt lệnh duy nhất · 30s-40s dừng thị trường né bẫy/làm quiz · 40s-45s sàn khớp lệnh và tính NAV.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0 mt-0.5">
                <Zap size={15} />
              </div>
              <div>
                <strong className="text-slate-900 block text-sm">Thao tác Quick Buy & Đòn bẩy</strong>
                <p>
                  Dùng các phím tắt 25%, 50%, 100% để ra quyết định nhanh. Đòn bẩy Margin x2 được mở khóa từ Round 3; Margin x5 bị khóa để bảo vệ bạn khỏi cháy túi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 flex-shrink-0 mt-0.5">
                <ShieldAlert size={15} />
              </div>
              <div>
                <strong className="text-slate-900 block text-sm">Quy tắc Cắt Lỗ Cưỡng Bức (Stop-Out)</strong>
                <p>
                  Nếu NAV giảm xuống ≤ <strong>5,000,000 VND</strong> hoặc Vốn chủ sở hữu &lt; 20% tổng tài sản, hệ thống sẽ kích hoạt Stop-Out và buộc bạn dừng cuộc chơi.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[11px]">
            * Bỏ qua hướng dẫn này hoàn toàn không ảnh hưởng đến điểm số hoặc thành tích của bạn.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline py-2 px-4 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 text-xs"
          >
            Bỏ qua hướng dẫn
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartGame();
            }}
            className="btn btn-primary py-2 px-5 rounded-lg font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <span>Bắt đầu Vòng 1</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
