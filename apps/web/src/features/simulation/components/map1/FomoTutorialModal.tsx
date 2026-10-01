import React from "react";
import {
  Gamepad2,
  Clock,
  Coins,
  AlertTriangle,
  Trophy,
  ArrowRight,
  X,
  TrendingUp,
  Percent,
  Flame,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export interface FomoTutorialModalProps {
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
      aria-labelledby="fomo-rules-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-lg flex-shrink-0">
                <Gamepad2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    QUY TẮC SINH TỒN • VÒNG 0
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                    7 Vòng Thử Thách Tâm Lý
                  </span>
                </div>
                <h2 id="fomo-rules-title" className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                  🎮 LUẬT CHƠI & QUY TẮC SINH TỒN — ĐẤU TRƯỜNG FOMO
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Đóng hướng dẫn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 4 Infographic Step Cards Content */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[72vh] overflow-y-auto bg-slate-50/60">
          {/* Card 1: 7 Vòng Đấu Sinh Tử */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between gap-3 hover:border-blue-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                BƯỚC 1
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Clock size={18} />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>⏱️ 7 Vòng Đấu Sinh Tử</span>
                <span className="text-xs font-semibold text-blue-600 font-mono">(45s/vòng)</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hành trình mô phỏng chu kỳ tâm lý đám đông đầy biến động và cạm bẫy:
              </p>
            </div>

            {/* Psychological journey stages strip */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] font-medium text-slate-700">
              <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                <span className="font-bold text-emerald-600">Tích lũy</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-purple-600">Đỉnh FOMO</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-rose-600">Bẫy Margin</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-blue-600">Bull-trap</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-cyan-700">Tắt thanh khoản</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-amber-600">Bắt đáy</span>
                <span className="text-slate-400">→</span>
                <span className="font-bold text-emerald-700">Phân hóa</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-100">
              <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />
              <span>4 pha mỗi vòng: Đọc tin (10s) → Đặt lệnh (20s) → Né bẫy (10s) → Khớp sàn (5s)</span>
            </div>
          </div>

          {/* Card 2: Quản Lý Vốn 10,000,000 VND */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between gap-3 hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                BƯỚC 2
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Coins size={18} />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>💵 Quản Lý Vốn 10.000.000 VND Ảo</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Số vốn thực chiến giúp bạn rèn luyện kỷ luật phân bổ tỷ trọng lệnh:
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <span className="font-medium text-slate-600">Phí giao dịch thực tế:</span>
                <span className="font-bold font-mono text-emerald-800">0.15% / lệnh</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <span className="font-medium text-slate-600">Lãi vay Margin (từ R3):</span>
                <span className="font-bold font-mono text-emerald-800">0.1% / vòng</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-100">
              <Percent size={13} className="text-emerald-500 flex-shrink-0" />
              <span>Sử dụng Quick Buy 25%, 50% hoặc 100% ALL-IN để phản xạ nhanh</span>
            </div>
          </div>

          {/* Card 3: Ranh Giới Cháy Tài Khoản (Stop-Out) */}
          <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-200/90 shadow-sm flex flex-col justify-between gap-3 hover:border-rose-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                BƯỚC 3 • BÁO ĐỘNG ĐỎ
              </span>
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle size={18} />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-rose-900 tracking-tight flex items-center gap-1.5">
                <span>⚠️ Ranh Giới Cháy Tài Khoản (Stop-Out)</span>
              </h3>
              <p className="text-xs text-rose-700/90 mt-1 leading-relaxed font-medium">
                Kỷ luật sống còn: bảo vệ vốn là ưu tiên số 1 của mọi nhà đầu tư chuyên nghiệp.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-rose-200 text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Flame size={14} className="text-rose-600 flex-shrink-0" />
                <span>Kích hoạt Call Margin & Cắt Lỗ Cưỡng Bức khi:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-slate-700 font-medium pl-1 space-y-0.5">
                <li>
                  Tài sản ròng (NAV) ≤ <strong className="text-rose-700 font-mono">5.000.000 VND</strong> (suy giảm 50% vốn)
                </li>
                <li>
                  Vốn tự có (Equity) &lt; <strong className="text-rose-700 font-mono">20%</strong> tổng giá trị tài sản danh mục
                </li>
              </ul>
            </div>

            <div className="text-[11px] text-rose-700 font-bold flex items-center gap-1.5 pt-1 border-t border-rose-100">
              <AlertTriangle size={13} className="text-rose-600 flex-shrink-0" />
              <span>Chạm ngưỡng Stop-Out → Buộc dừng cuộc chơi ngay (GAME OVER)!</span>
            </div>
          </div>

          {/* Card 4: Điều Kiện Mở Khóa Map 2 */}
          <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200/90 shadow-sm flex flex-col justify-between gap-3 hover:border-indigo-400 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                BƯỚC 4 • VINH DANH
              </span>
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Trophy size={18} />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-indigo-950 tracking-tight flex items-center gap-1.5">
                <span>🏆 Điều Kiện Mở Khóa Map 2 (Pro Room)</span>
              </h3>
              <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                Chứng minh bạn không phải nạn nhân của tâm lý bầy đàn và thị trường đầu cơ:
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white border border-indigo-200 text-xs text-indigo-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <ShieldCheck size={14} className="text-indigo-600 flex-shrink-0" />
                <span>Tiêu chuẩn tốt nghiệp Map 1:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-slate-700 font-medium pl-1 space-y-0.5">
                <li>Sống sót qua <strong>toàn bộ 7 vòng</strong> mà không bị cháy tài khoản</li>
                <li>Duy trì Điểm Kỷ Luật (Discipline Score) ≥ <strong>50/100</strong></li>
                <li>
                  Nhận Huy hiệu độc quyền: <strong className="text-indigo-700">"Sống sót qua bão FOMO"</strong>
                </li>
              </ul>
            </div>

            <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1.5 pt-1 border-t border-indigo-100">
              <TrendingUp size={13} className="text-indigo-600 flex-shrink-0" />
              <span>Mở khóa Map 2: Mô phỏng chu kỳ kinh tế vĩ mô 12 Quý</span>
            </div>
          </div>
        </div>

        {/* Footer with Primary CTA */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-center"
          >
            Đóng để xem lại sau
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartGame();
            }}
            className="w-full sm:w-auto py-3 px-7 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
          >
            <span>ĐÃ HIỂU LUẬT — VÀO TRẬN NGAY 🚀</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Backwards compatibility alias for FomoRulesModal
export const FomoRulesModal = FomoTutorialModal;
