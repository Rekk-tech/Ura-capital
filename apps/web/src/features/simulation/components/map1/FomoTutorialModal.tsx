import React, { useState } from "react";
import {
  Clock,
  Coins,
  AlertTriangle,
  Trophy,
  ArrowRight,
  X,
  Percent,
  CheckCircle2,
  Gamepad2,
  Zap,
} from "lucide-react";

export interface FomoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame?: () => void;
  onProceedToScenario?: () => void;
  mode?: "lobby" | "scenario";
}

export const FomoTutorialModal: React.FC<FomoTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  onProceedToScenario,
  mode = "lobby",
}) => {
  const [rememberRules, setRememberRules] = useState(true);

  if (!isOpen) return null;

  const handlePrimaryAction = () => {
    onClose();
    if (onProceedToScenario) {
      onProceedToScenario();
    } else if (onStartGame) {
      onStartGame();
    }
  };

  const secondaryBtnLabel =
    mode === "scenario" ? "Đóng / Quay lại chọn kịch bản" : "Đóng để xem lại sau";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fomo-rules-title"
      className="fomo-rules-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="fomo-rules-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng (Close Button) */}
        <button
          type="button"
          onClick={onClose}
          className="fomo-rules-close-btn"
          aria-label="Đóng hướng dẫn"
        >
          <X size={20} />
        </button>

        {/* 1. Phần Header: Pill & Title */}
        <div className="fomo-rules-header">
          <div className="fomo-rules-top-pill">
            <span className="fomo-rules-dot" />
            <span>QUY TẮC SINH TỒN • VÒNG 0 · 7 VÒNG THỬ THÁCH TÂM LÝ</span>
          </div>

          <div className="fomo-rules-title-row">
            <div className="fomo-rules-gamepad-icon">
              <Gamepad2 size={24} />
            </div>
            <div>
              <h2 id="fomo-rules-title" className="fomo-rules-main-title">
                LUẬT CHƠI &amp; QUY TẮC SINH TỒN — ĐẤU TRƯỜNG FOMO
              </h2>
              <p className="fomo-rules-sub-title">
                Hướng dẫn thực chiến và điều kiện quản trị danh mục trước khi bước vào phiên giao dịch giả lập thời gian thực.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Khối Nhiệm Vụ Thực Chiến */}
        <div className="fomo-rules-mission-card">
          <div className="fomo-rules-mission-badge">
            <Zap size={13} fill="currentColor" />
            <span>NHIỆM VỤ THỰC CHIẾN</span>
          </div>

          <p className="fomo-rules-mission-desc">
            Bạn được cấp <span className="fomo-rules-capital-pill">10.000.000 đ</span> vốn ảo. Mục tiêu cốt lõi là <strong>sống sót qua 7 vòng giao dịch liên tiếp</strong> (mỗi vòng 45 giây) trước các đợt biến động sốc, bẫy tâm lý đám đông mà không bị cháy tài khoản.
          </p>

          <div className="fomo-rules-pillars-grid">
            <div className="fomo-rules-pillar-item">
              <div className="fomo-rules-pillar-title-row">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span className="fomo-rules-pillar-title">Cảnh Giác Bẫy Đám Đông</span>
                <span className="sr-only">Cảnh Giác Bẫy Đám Đông:</span>
              </div>
              <p className="fomo-rules-pillar-text">
                Tin đồn bất ngờ và các đợt bơm giá sốc được thiết kế để thử thách kỷ luật cắt lỗ.
              </p>
            </div>

            <div className="fomo-rules-pillar-item">
              <div className="fomo-rules-pillar-title-row">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span className="fomo-rules-pillar-title">Cơ Chế Khớp Lệnh</span>
                <span className="sr-only">Cơ Chế Khớp Lệnh:</span>
              </div>
              <p className="fomo-rules-pillar-text">
                Lệnh Thị trường (Market) và Giới hạn (Limit) khớp chính xác theo thanh khoản sổ lệnh.
              </p>
            </div>

            <div className="fomo-rules-pillar-item">
              <div className="fomo-rules-pillar-title-row">
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                <span className="fomo-rules-pillar-title">Tiêu Chí Đánh Giá</span>
                <span className="sr-only">Tiêu Chí Đánh Giá:</span>
              </div>
              <p className="fomo-rules-pillar-text">
                Bạn sẽ được xếp hạng dựa trên <em>Điểm Kháng FOMO</em> và <em>Hiệu suất PnL</em>.
              </p>
            </div>
          </div>
        </div>

        {/* 3. 4 Thẻ Nội Dung (Grid 2x2) */}
        <div className="fomo-rules-quad-grid">
          {/* BƯỚC 1: 7 Vòng Đấu Sinh Tử */}
          <div className="fomo-rules-step-card fomo-rules-card-blue">
            <div className="fomo-rules-step-header">
              <span className="fomo-rules-step-tag fomo-rules-tag-blue">
                <Clock size={14} />
                <span>BƯỚC 1</span>
              </span>
              <span className="fomo-rules-badge-pill fomo-rules-pill-blue">
                45s/vòng
              </span>
            </div>

            <div>
              <h3 className="fomo-rules-step-title">
                ⏱️ 7 Vòng Đấu Sinh Tử
              </h3>
              <p className="fomo-rules-step-desc">
                Hành trình tâm lý: <strong>Tích lũy → Đỉnh FOMO → Bẫy Margin → Bull-trap → Tắt thanh khoản → Bắt đáy → Phân hóa</strong>.
              </p>
            </div>

            <div className="fomo-rules-sub-box">
              <Clock size={14} className="text-blue-600 flex-shrink-0" />
              <span>
                <strong>4 pha:</strong> Đọc tin 10s → Đặt lệnh 20s → Né bẫy 10s → Khớp sàn 5s.
              </span>
            </div>
          </div>

          {/* BƯỚC 2: Quản Lý Vốn 10.000.000 VND Ảo */}
          <div className="fomo-rules-step-card fomo-rules-card-emerald">
            <div className="fomo-rules-step-header">
              <span className="fomo-rules-step-tag fomo-rules-tag-emerald">
                <Coins size={14} />
                <span>BƯỚC 2</span>
              </span>
              <span className="fomo-rules-badge-pill fomo-rules-pill-emerald font-mono">
                10.000.000 đ
              </span>
            </div>

            <div>
              <h3 className="fomo-rules-step-title">
                💵 Quản Lý Vốn 10.000.000 VND Ảo
              </h3>
              <p className="fomo-rules-step-desc">
                Phí giao dịch thực tế <strong>0.15%/lệnh</strong>, Lãi vay margin <strong>0.1%/vòng</strong> (mở từ Vòng 3).
              </p>
            </div>

            <div className="fomo-rules-sub-box">
              <Percent size={14} className="text-emerald-600 flex-shrink-0" />
              <span>
                Phím tắt Quick Buy: 25%, 50%, 100% ALL-IN để tối ưu tốc độ.
              </span>
            </div>
          </div>

          {/* BƯỚC 3: Ranh Giới Cháy Tài Khoản (Stop-Out) */}
          <div className="fomo-rules-step-card fomo-rules-card-rose">
            <div className="fomo-rules-step-header">
              <span className="fomo-rules-step-tag fomo-rules-tag-rose">
                <AlertTriangle size={14} />
                <span>BƯỚC 3</span>
              </span>
              <span className="fomo-rules-badge-pill fomo-rules-pill-rose">
                BÁO ĐỘNG ĐỎ
              </span>
            </div>

            <div>
              <h3 className="fomo-rules-step-title text-rose-900">
                ⚠️ Ranh Giới Cháy Tài Khoản (Stop-Out)
              </h3>
              <p className="fomo-rules-step-desc text-rose-950">
                Kích hoạt Call Margin &amp; Cắt lỗ cưỡng bức khi <strong className="text-rose-700">NAV ≤ 5.000.000 VND</strong> (-50% vốn) hoặc <strong className="text-rose-700">Equity &lt; 20%</strong> tổng tài sản.
              </p>
            </div>
          </div>

          {/* BƯỚC 4: Điều Kiện Mở Khóa Map 2 (Pro Room) */}
          <div className="fomo-rules-step-card fomo-rules-card-amber">
            <div className="fomo-rules-step-header">
              <span className="fomo-rules-step-tag fomo-rules-tag-amber">
                <Trophy size={14} />
                <span>BƯỚC 4</span>
              </span>
              <span className="fomo-rules-badge-pill fomo-rules-pill-amber">
                Vinh danh
              </span>
            </div>

            <div>
              <h3 className="fomo-rules-step-title text-amber-950">
                🏆 Điều Kiện Mở Khóa Map 2 (Pro Room)
              </h3>
              <p className="fomo-rules-step-desc text-amber-900">
                Đồng thời thỏa mãn: Sống sót qua <strong>toàn bộ 7 vòng</strong> + Lợi nhuận <strong className="text-emerald-700">ROI &gt; +5%</strong> + Điểm Kỷ luật <strong>≥ 50/100</strong>. Nhận huy hiệu <strong>“Sống sót qua bão FOMO”</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Footer Nút Bấm Hành Động */}
        <div className="fomo-rules-footer">
          {/* Checkbox Ghi Nhớ Bên Trái */}
          <label className="fomo-rules-remember-label">
            <input
              type="checkbox"
              checked={rememberRules}
              onChange={(e) => setRememberRules(e.target.checked)}
              className="fomo-rules-checkbox"
            />
            <span>Ghi nhớ quy tắc này cho các phiên sau</span>
          </label>

          {/* Nút Hành Động Bên Phải */}
          <div className="fomo-rules-actions-right">
            <button
              type="button"
              onClick={onClose}
              className="fomo-rules-secondary-btn"
              aria-label={secondaryBtnLabel}
            >
              {secondaryBtnLabel}
            </button>

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="fomo-rules-primary-btn"
            >
              <span>
                {mode === "scenario"
                  ? "ĐÃ HIỂU LUẬT — TIẾP TỤC CHỌN KỊCH BẢN 🚀"
                  : "ĐÃ HIỂU LUẬT — CHỌN KỊCH BẢN MÔ PHỎNG 🚀"}
              </span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Backwards compatibility alias for FomoRulesModal
export const FomoRulesModal = FomoTutorialModal;
