import React from "react";
import {
  Clock,
  Coins,
  AlertTriangle,
  Trophy,
  ArrowRight,
  X,
  TrendingUp,
  Percent,
  CheckCircle2,
  ShieldAlert,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(2, 6, 23, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "48rem",
          borderRadius: "1rem",
          backgroundColor: "#ffffff",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #f1f5f9",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng (Close Button) ở góc trên bên phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            padding: "0.5rem",
            color: "#94a3b8",
          }}
          aria-label="Đóng hướng dẫn"
        >
          <X size={20} />
        </button>

        {/* Phần Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 rounded-full mb-2"
            style={{
              display: "inline-block",
              padding: "0.25rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#2563eb",
              backgroundColor: "#eff6ff",
              borderRadius: "9999px",
              marginBottom: "0.5rem",
            }}
          >
            QUY TẮC SINH TỒN • VÒNG 0 · 7 VÒNG THỬ THÁCH TÂM LÝ
          </span>
          <h2
            id="fomo-rules-title"
            className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              margin: 0,
            }}
          >
            🎮 LUẬT CHƠI &amp; QUY TẮC SINH TỒN — ĐẤU TRƯỜNG FOMO
          </h2>
        </div>

        {/* 4 Thẻ Nội Dung (Grid 2 cột) */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
          style={{
            display: "grid",
            gap: "1rem",
            fontSize: "0.875rem",
          }}
        >
          {/* Bước 1: 7 Vòng Đấu Sinh Tử */}
          <div
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80"
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              backgroundColor: "#f8fafc",
              border: "1px solid rgba(226, 232, 240, 0.85)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Clock size={15} className="text-blue-600" />
                BƯỚC 1
              </span>
              <span
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium"
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "#dbeafe",
                  color: "#1d4ed8",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontWeight: 600,
                }}
              >
                45s/vòng
              </span>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 0.35rem 0",
                }}
              >
                ⏱️ 7 Vòng Đấu Sinh Tử
              </h3>
              <p style={{ color: "#475569", lineHeight: 1.5, margin: 0, fontSize: "0.8125rem" }}>
                Hành trình tâm lý: <strong>Tích lũy → Đỉnh FOMO → Bẫy Margin → Bull-trap → Tắt thanh khoản → Bắt đáy → Phân hóa</strong>.
              </p>
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                paddingTop: "0.5rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <CheckCircle2 size={13} style={{ color: "#2563eb", flexShrink: 0 }} />
              <span>4 pha: Đọc tin 10s → Đặt lệnh 20s → Né bẫy 10s → Khớp sàn 5s.</span>
            </div>
          </div>

          {/* Bước 2: Quản Lý Vốn 10.000.000 VND Ảo */}
          <div
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80"
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              backgroundColor: "#f8fafc",
              border: "1px solid rgba(226, 232, 240, 0.85)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Coins size={15} className="text-emerald-600" />
                BƯỚC 2
              </span>
              <span
                className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold"
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "#d1fae5",
                  color: "#047857",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontWeight: 700,
                }}
              >
                10.000.000 đ
              </span>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 0.35rem 0",
                }}
              >
                💵 Quản Lý Vốn 10.000.000 VND Ảo
              </h3>
              <p style={{ color: "#475569", lineHeight: 1.5, margin: 0, fontSize: "0.8125rem" }}>
                Phí giao dịch thực tế <strong>0.15%/lệnh</strong>, Lãi vay margin <strong>0.1%/vòng</strong> (mở từ Vòng 3).
              </p>
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                paddingTop: "0.5rem",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Percent size={13} style={{ color: "#059669", flexShrink: 0 }} />
              <span>Phím tắt Quick Buy: 25%, 50%, 100% ALL-IN để tối ưu tốc độ.</span>
            </div>
          </div>

          {/* Bước 3: Ranh Giới Cháy Tài Khoản (Stop-Out) */}
          <div
            className="p-4 rounded-xl bg-rose-50/70 border border-rose-200"
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(255, 241, 242, 0.75)",
              border: "1px solid #fecdd3",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#be123c",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <AlertTriangle size={15} className="text-rose-600" />
                BƯỚC 3
              </span>
              <span
                className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold uppercase"
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "#ffe4e6",
                  color: "#be123c",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Báo động đỏ
              </span>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#9f1239",
                  margin: "0 0 0.35rem 0",
                }}
              >
                ⚠️ Ranh Giới Cháy Tài Khoản (Stop-Out)
              </h3>
              <p style={{ color: "#881337", lineHeight: 1.5, margin: 0, fontSize: "0.8125rem" }}>
                Kích hoạt Call Margin &amp; Cắt lỗ cưỡng bức khi <strong>NAV ≤ 5.000.000 VND</strong> (-50% vốn) hoặc <strong>Equity &lt; 20%</strong> tổng tài sản.
              </p>
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                color: "#be123c",
                fontWeight: 600,
                paddingTop: "0.5rem",
                borderTop: "1px solid #fecdd3",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <ShieldAlert size={13} style={{ color: "#e11d48", flexShrink: 0 }} />
              <span>Chạm ngưỡng Stop-Out → Buộc dừng cuộc chơi ngay (GAME OVER)!</span>
            </div>
          </div>

          {/* Bước 4: Điều Kiện Mở Khóa Map 2 (Pro Room) */}
          <div
            className="p-4 rounded-xl bg-amber-50/70 border border-amber-200"
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(255, 251, 235, 0.75)",
              border: "1px solid #fde68a",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#92400e",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Trophy size={15} className="text-amber-600" />
                BƯỚC 4
              </span>
              <span
                className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium"
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontWeight: 600,
                }}
              >
                Vinh danh
              </span>
            </div>

            <div>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#78350f",
                  margin: "0 0 0.35rem 0",
                }}
              >
                🏆 Điều Kiện Mở Khóa Map 2 (Pro Room)
              </h3>
              <p style={{ color: "#78350f", lineHeight: 1.5, margin: 0, fontSize: "0.8125rem" }}>
                Sống sót qua toàn bộ 7 vòng, Điểm Kỷ luật ≥ <strong>50/100</strong>, Nhận huy hiệu <strong>"Sống sót qua bão FOMO"</strong>.
              </p>
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                color: "#92400e",
                fontWeight: 600,
                paddingTop: "0.5rem",
                borderTop: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <TrendingUp size={13} style={{ color: "#d97706", flexShrink: 0 }} />
              <span>Chính thức mở khóa Map 2: Chu kỳ kinh tế vĩ mô 12 Quý.</span>
            </div>
          </div>
        </div>

        {/* Footer Nút Bấm Hành Động */}
        <div
          className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-slate-100"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
            paddingTop: "1rem",
            marginTop: "1.5rem",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {/* Nút Thứ Cấp (Secondary) */}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.75rem",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Đóng để xem lại sau
          </button>

          {/* Nút Chính (Primary CTA) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartGame();
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all text-sm flex items-center gap-2"
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.875rem",
              boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
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
