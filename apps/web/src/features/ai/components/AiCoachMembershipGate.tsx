import React from "react";
import { Link } from "react-router-dom";
import { Crown, Sparkles, ShieldCheck, Zap, Lock, ArrowRight, LogIn } from "lucide-react";

export interface AiCoachMembershipGateProps {
  isAuthenticated: boolean;
  userEmail?: string;
  onClose?: () => void;
}

export const AiCoachMembershipGate: React.FC<AiCoachMembershipGateProps> = ({
  isAuthenticated,
  userEmail,
  onClose,
}) => {
  return (
    <div className="ai-gate-container" role="region" aria-label="Khóa tính năng Cố vấn AI">
      <div className="ai-gate-card">
        {/* Header Icon with Glowing Aura */}
        <div className="ai-gate-icon-wrapper">
          <div className="ai-gate-icon-glow" aria-hidden="true" />
          <div className="ai-gate-icon-badge">
            {isAuthenticated ? <Crown size={28} /> : <Lock size={28} />}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="ai-gate-header-text">
          <span className="ai-gate-pill">ĐẶC QUYỀN HỘI VIÊN CAO CẤP</span>
          <h3 className="ai-gate-title">
            Mở Khóa Trợ Lý Cố Vấn <br />
            <span className="ai-gate-title-gradient">Aura Intelligence AI Coach</span>
          </h3>
          <p className="ai-gate-description">
            {isAuthenticated
              ? `Tài khoản ${userEmail ? `(${userEmail})` : ""} hiện đang ở Gói Miễn Phí (Free Tier). Để bảo toàn tài nguyên tính toán và duy trì chất lượng phản hồi chuyên sâu, tính năng trò chuyện AI chỉ dành riêng cho Hội viên Premium và Quản trị viên.`
              : "Tính năng trò chuyện và tư vấn cùng Cố vấn AI Aura Intelligence chỉ dành riêng cho Hội viên Cao cấp đã đăng ký hoặc Quản trị viên hệ thống."}
          </p>
        </div>

        {/* Value Proposition Grid */}
        <div className="ai-gate-features">
          <div className="ai-gate-feature-item">
            <div className="ai-gate-feature-icon">
              <Zap size={18} />
            </div>
            <div className="ai-gate-feature-content">
              <h4>Chiến Thuật FOMO Arena (Map 1)</h4>
              <p>Nhận diện phân phối đỉnh cá mập, bẫy "Múa bên trăng" và giữ vững kỷ luật cắt lỗ.</p>
            </div>
          </div>

          <div className="ai-gate-feature-item">
            <div className="ai-gate-feature-icon">
              <Sparkles size={18} />
            </div>
            <div className="ai-gate-feature-content">
              <h4>Phân Bổ Vĩ Mô Pro Room (Map 2)</h4>
              <p>Chiến lược phân bổ danh mục cổ phiếu giá trị, tăng trưởng &amp; trái phiếu theo Graham &amp; Buffett.</p>
            </div>
          </div>

          <div className="ai-gate-feature-item">
            <div className="ai-gate-feature-icon">
              <ShieldCheck size={18} />
            </div>
            <div className="ai-gate-feature-content">
              <h4>Model-Based Guardrails An Toàn</h4>
              <p>Hệ thống kiểm duyệt an toàn tự động, ngăn ngừa mã độc hại và tối ưu tài nguyên chuyên môn.</p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="ai-gate-actions">
          {isAuthenticated ? (
            <Link
              to="/subscription"
              className="ai-gate-btn ai-gate-btn-primary"
              onClick={onClose}
              id="ai-gate-upgrade-btn"
            >
              <Crown size={18} aria-hidden="true" />
              <span>Nâng Cấp Gói Premium Ngay</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <div className="ai-gate-btn-group">
              <Link
                to="/login"
                className="ai-gate-btn ai-gate-btn-primary"
                onClick={onClose}
                id="ai-gate-login-btn"
              >
                <LogIn size={18} aria-hidden="true" />
                <span>Đăng Nhập Tài Khoản</span>
              </Link>
              <Link
                to="/subscription"
                className="ai-gate-btn ai-gate-btn-secondary"
                onClick={onClose}
                id="ai-gate-plans-btn"
              >
                <span>Xem Bảng Gói Hội Viên</span>
              </Link>
            </div>
          )}
        </div>

        {/* Security / Fair-use Disclaimer */}
        <div className="ai-gate-footer-note">
          <span>* Áp dụng hạn ngạch 20 yêu cầu/phút cho Hội viên và 100 yêu cầu/phút cho Quản trị viên.</span>
        </div>
      </div>
    </div>
  );
};
