import React from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@aura/shared";
import { ShieldCheck, BookOpen, TrendingUp, Users, HelpCircle, Lock, PieChart } from "lucide-react";
import { AuraLogo } from "../components/AuraLogo";

/**
 * Modern Corporate Navy Application Footer
 * (Ref: AURA_UI_REDESIGN_SPEC.md - Section 2 & AURA_UX_IMPROVEMENTS_SPEC.md - Section 7)
 */
export const AppFooter: React.FC = () => {
  return (
    <footer className="footer footer-navy" role="contentinfo">
      <div className="footer-content">
        {/* Column 1: Brand & Regulatory Disclaimers */}
        <div className="footer-brand-section">
          <div className="footer-brand-header">
            <AuraLogo size={36} />
            <span className="footer-brand text-gradient-navy">{APP_NAME}</span>
          </div>
          <p className="footer-disclaimer">
            Aura Capital là nền tảng mô phỏng và đào tạo đầu tư tài chính.
            Mọi hoạt động thị trường, danh mục vị thế và kết quả giao dịch đều là giả lập
            và không cấu thành lời khuyên đầu tư tài chính thực tế.
            Toàn bộ môi trường vận hành an toàn không rủi ro vốn thật.
            <span className="sr-only">
              Educational &amp; simulation purposes only. No real capital is at risk.
            </span>
          </p>
          <div className="footer-security-pill">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Môi trường giả lập chuẩn tổ chức · Bảo mật máy chủ đa tầng</span>
          </div>
        </div>

        {/* Column 2: Platform Links */}
        <nav className="footer-nav" aria-label="Footer Navigation">
          <div className="footer-nav-col">
            <span className="footer-nav-title">Nền Tảng</span>
            <Link to="/academy" className="footer-link">
              <BookOpen size={14} aria-hidden="true" />
              <span>Khóa Học Academy</span>
              <span className="sr-only">Academy Courses</span>
            </Link>
            <Link to="/simulation" className="footer-link">
              <TrendingUp size={14} aria-hidden="true" />
              <span>Đấu Trường Giả Lập</span>
              <span className="sr-only">Trading Simulation</span>
            </Link>
            <Link to="/community" className="footer-link">
              <Users size={14} aria-hidden="true" />
              <span>Diễn Đàn Cộng Đồng</span>
              <span className="sr-only">Community Discussions</span>
            </Link>
            <Link to="/portfolio" className="footer-link">
              <PieChart size={14} aria-hidden="true" />
              <span>Phân Tích Danh Mục</span>
              <span className="sr-only">Portfolio Analytics</span>
            </Link>
          </div>

          {/* Column 3: Account & Membership */}
          <div className="footer-nav-col">
            <span className="footer-nav-title">Tài Khoản</span>
            <Link to="/subscription" className="footer-link">
              <span>Gói Hội Viên</span>
              <span className="sr-only">Subscription Plans</span>
            </Link>
            <Link to="/login" className="footer-link">
              <span>Đăng Nhập</span>
              <span className="sr-only">Sign In</span>
            </Link>
            <Link to="/register" className="footer-link">
              <span>Đăng Ký Tài Khoản</span>
              <span className="sr-only">Create Account</span>
            </Link>
            <Link to="/dashboard" className="footer-link">
              <span>Bảng Điều Khiển</span>
              <span className="sr-only">Learner Dashboard</span>
            </Link>
          </div>

          {/* Column 4: Support & Legal */}
          <div className="footer-nav-col">
            <span className="footer-nav-title">Pháp Lý &amp; Hỗ Trợ</span>
            <Link to="/terms" className="footer-link">
              <span>Điều Khoản Dịch Vụ</span>
              <span className="sr-only">Terms of Service</span>
            </Link>
            <Link to="/privacy" className="footer-link">
              <span>Chính Sách Quyền Riêng Tư</span>
              <span className="sr-only">Privacy Policy</span>
            </Link>
            <Link to="/disclaimer" className="footer-link">
              <span>Tuyên Bố Miễn Trừ Rủi Ro</span>
              <span className="sr-only">Risk Disclaimer</span>
            </Link>
            <Link to="/faq" className="footer-link">
              <HelpCircle size={14} aria-hidden="true" />
              <span>Câu Hỏi Thường Gặp (FAQ)</span>
            </Link>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <p>© 2026 {APP_NAME}. Bản quyền được bảo lưu.</p>
        <div className="footer-bottom-badges">
          <span className="badge badge-subtle">Phiên bản v1.0.0 · Production</span>
          <span className="badge badge-success-subtle">
            <Lock size={12} aria-hidden="true" />
            <span>Bảo Mật Argon2id</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
