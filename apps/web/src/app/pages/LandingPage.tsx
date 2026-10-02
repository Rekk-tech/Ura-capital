import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Cpu,
  BookOpen,
  TrendingUp,
  Users,
  BadgeDollarSign,
  Sparkles,
  Flame,
  BrainCircuit,
  Lock,
  CheckCircle2,
  Coins,
  Award,
  Zap,
} from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";

/**
 * Modern Corporate Landing Page (Vietnamese - English Financial Hybrid)
 * Refined per institutional brokerage standards:
 * - Clear Vietnamese value propositions with professional English financial terminology
 * - 100% standardized VND currency (100.000.000 ₫ / 10.000.000 VND)
 * - Authoritative 2-Map spotlight and educational framework
 */
export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <main id="main-content" className="landing-container">
      {/* ====================================================================
          S1. HERO SECTION (Vietnamese-English Financial Hybrid)
          ==================================================================== */}
      <section className="hero-jabil" aria-labelledby="hero-heading">
        <div className="hero-content">
          <div className="hero-chip-badge">
            <Sparkles size={14} className="chip-icon" aria-hidden="true" />
            <span>NỀN TẢNG HỌC &amp; MÔ PHỎNG ĐẦU TƯ TÀI CHÍNH THÔNG MINH</span>
          </div>

          <h1 id="hero-heading" className="hero-title-main">
            HỌC ĐẦU TƯ THÔNG MINH. <br />
            <span className="text-gradient">THỰC CHIẾN GIAO DỊCH AN TOÀN.</span>
          </h1>

          <h2 className="hero-subtitle-lead">
            AI-Assisted Financial Learning &amp; Institutional Simulation Platform
          </h2>

          <p className="hero-description">
            Rèn luyện tư duy tài chính bài bản, giải phóng áp lực tâm lý và trải nghiệm thị trường qua 2 đấu trường mô phỏng độc quyền (<strong>FOMO Arena</strong> &amp; <strong>Pro Room</strong>) với 100% vốn ảo không rủi ro.
          </p>

          <div className="hero-cta-group">
            <Link to="/academy" className="btn btn-gradient btn-lg">
              <BookOpen size={18} aria-hidden="true" />
              <span>Bắt Đầu Học Ngay (Start Learning)</span>
            </Link>
            <Link to="/simulation" className="btn btn-secondary btn-lg">
              <TrendingUp size={18} aria-hidden="true" />
              <span>Khám Phá Sàn Giả Lập (Simulation Arena)</span>
            </Link>
          </div>

          <div className="hero-guarantee">
            <CheckCircle2 size={15} className="text-success" aria-hidden="true" />
            <span>100.000.000 ₫ Vốn Ảo Thực Chiến · 100% Không Rủi Ro Tiền Thật · Môi Trường Chuẩn Định Chế</span>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="mockup-ticker">AURA CAPITAL · SIMULATION COCKPIT</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-stat-row">
                <div>
                  <span className="mockup-label">Tổng Giá Trị Tài Sản (Portfolio NAV)</span>
                  <div className="mockup-value text-gradient">100.000.000 ₫</div>
                </div>
                <div className="mockup-badge">+6.89%</div>
              </div>
              <div className="mockup-graph">
                <div className="graph-bar h-40" />
                <div className="graph-bar h-55" />
                <div className="graph-bar h-45" />
                <div className="graph-bar h-70" />
                <div className="graph-bar h-65" />
                <div className="graph-bar h-85 active" />
                <div className="graph-bar h-95" />
              </div>
              <div className="mockup-pills">
                <span className="mini-pill">🔥 Map 1: FOMO Arena</span>
                <span className="mini-pill">📊 Map 2: Pro Room</span>
                <span className="mini-pill">🛡️ 100% Vốn Ảo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S2. ABOUT — PLATFORM MISSION (Sứ Mệnh Nền Tảng)
          ==================================================================== */}
      <section className="section-about" aria-labelledby="about-heading">
        <div className="about-grid">
          <div className="about-text-col">
            <span className="section-tag">SỨ MỆNH NỀN TẢNG • PLATFORM MISSION</span>
            <h2 id="about-heading" className="section-title">
              CHÀO MỪNG ĐẾN VỚI <span className="text-gradient">AURA CAPITAL</span>
            </h2>
            <p className="about-lead">
              Aura Capital ra đời nhằm xóa bỏ rào cản sợ hãi biến động thị trường và loại bỏ những bài học &quot;học phí đắt đỏ&quot; bằng tiền thật của nhà đầu tư mới bắt đầu.
            </p>
            <p className="about-body">
              Chúng tôi kết hợp lộ trình đào tạo bài bản, đấu trường mô phỏng tâm lý thời gian thực và công cụ phân tích danh mục chuẩn định chế quốc tế. Mỗi quyết định giao dịch là một cột mốc tích lũy kinh nghiệm quý báu mà không cần mạo hiểm bất kỳ đồng vốn thật nào.
            </p>
            <div className="about-features-list">
              <div className="about-feature-item">
                <CheckCircle2 size={18} className="text-success" />
                <span>100% Khớp Lệnh &amp; Hạch Toán Chuẩn Xác (Server-Authoritative Settlement)</span>
              </div>
              <div className="about-feature-item">
                <CheckCircle2 size={18} className="text-success" />
                <span>Rèn Luyện Kỷ Luật Cảm Xúc &amp; Hóa Giải Bẫy Tâm Lý FOMO Thời Gian Thực</span>
              </div>
              <div className="about-feature-item">
                <CheckCircle2 size={18} className="text-success" />
                <span>Đồng Hành &amp; Phản Biện Chiến Lược Cùng Cộng Đồng Nhà Đầu Tư Nghiêm Túc</span>
              </div>
            </div>
          </div>

          <div className="about-card-col">
            <div className="about-highlight-box">
              <div className="highlight-icon-wrap">
                <BrainCircuit size={32} />
              </div>
              <h3>Mô Hình Học Tập Thực Chiến (Experiential Framework)</h3>
              <p>
                Vượt ra ngoài lý thuyết sách vở khô khan. Nắm vững bản chất tại <strong>Học Viện (Academy)</strong>, thực chiến tại <strong>Sàn Giả Lập (Simulation)</strong>, và phân tích hiệu quả trên <strong>Danh Mục (Portfolio)</strong>.
              </p>
              <Link to="/academy" className="btn btn-ghost btn-sm">
                <span>Khám Phá Lộ Trình Học Tập →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S3. STATS COUNTER GRID (Chỉ Số Đáng Tin Cậy)
          ==================================================================== */}
      <section className="section-stats" aria-label="Platform Statistics">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number text-gradient">100%</div>
            <div className="stat-label">Vốn Ảo (Zero Risk)</div>
            <div className="stat-sub">Tuyệt đối an toàn, không rủi ro tiền thật</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">2</div>
            <div className="stat-label">Bản Đồ Thực Chiến Độc Quyền</div>
            <div className="stat-sub">FOMO Arena &amp; Pro Room vĩ mô</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">12</div>
            <div className="stat-label">Quý Chu Kỳ Vĩ Mô</div>
            <div className="stat-sub">Báo cáo tài chính &amp; chu kỳ kinh tế</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">Minh Bạch</div>
            <div className="stat-label">Tuyệt Đối (Server-Authoritative)</div>
            <div className="stat-sub">Hạch toán số dư và khớp lệnh chính xác</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">7</div>
            <div className="stat-label">Vòng Đấu Nghẹt Thở (45s)</div>
            <div className="stat-sub">Rèn luyện bản lĩnh cắt lỗ &amp; chốt lời</div>
          </div>
          <div className="stat-card">
            <div className="stat-number text-gradient">24/7</div>
            <div className="stat-label">Cố Vấn AI Phân Tích</div>
            <div className="stat-sub">Định giá Graham &amp; Buffett chuẩn mực</div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S4. CORE CAPABILITIES (4 Trụ Cột Cốt Lõi)
          ==================================================================== */}
      <section className="section-features" aria-labelledby="features-heading">
        <div className="section-header-center">
          <span className="section-tag">HỆ SINH THÁI TỔNG THỂ • ECOSYSTEM ARCHITECTURE</span>
          <h2 id="features-heading" className="section-title">
            4 TRỤ CỘT <span className="text-gradient">CỐT LÕI (CORE CAPABILITIES)</span>
          </h2>
          <p className="section-subtitle">
            Hạ tầng toàn diện giúp người học tiến bộ từ phản xạ đầu cơ cảm tính sang đầu tư có phương pháp và kỷ luật
          </p>
        </div>

        <div className="grid-cards">
          {/* 1. Academy Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-blue-subtle">
                <BookOpen size={22} className="text-blue" aria-hidden="true" />
              </div>
              <div>
                <h3 className="card-title">Học Viện Aura Academy</h3>
                <span className="text-muted font-mono" style={{ fontSize: "0.8rem", display: "block" }}>Academy</span>
              </div>
            </div>
            <p className="card-description">
              Lộ trình bài bản, thẻ nhớ Quizlet 3D và mini-quiz chấm điểm tự động kiểm tra kiến thức trước khi bước vào thực chiến.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Sẵn Sàng</span>
              <Link to="/academy" className="card-action-link">
                <span>Khám Phá Khóa Học →</span>
              </Link>
            </div>
          </div>

          {/* 2. Simulation Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-teal-subtle">
                <TrendingUp size={22} className="text-teal" aria-hidden="true" />
              </div>
              <div>
                <h3 className="card-title">Đấu Trường FOMO Arena (Map 1)</h3>
                <span className="text-muted font-mono" style={{ fontSize: "0.8rem", display: "block" }}>Simulation Engine</span>
              </div>
            </div>
            <p className="card-description">
              7 vòng đấu nghẹt thở 45s, đối mặt với bẫy đu đỉnh, bẫy margin x5 và cú sốc cắt thanh khoản múa bên trăng.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Sẵn Sàng</span>
              <Link to="/simulation" className="card-action-link">
                <span>Vào Sàn Đấu Ngay →</span>
              </Link>
            </div>
          </div>

          {/* 3. Pro Room Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-purple-subtle">
                <BrainCircuit size={22} className="text-purple" aria-hidden="true" />
              </div>
              <div>
                <h3 className="card-title">Phòng Đầu Tư Vĩ Mô Pro Room (Map 2)</h3>
                <span className="text-muted font-mono" style={{ fontSize: "0.8rem", display: "block" }}>Pro Room</span>
              </div>
            </div>
            <p className="card-description">
              Chiến lược giá trị dài hạn qua 12 quý kinh tế: phân bổ danh mục đa tài sản cùng Cố vấn AI (Graham &amp; Buffett Advisor).
            </p>
            <div className="card-footer-action">
              <span className="badge badge-amber-subtle">Mở Khóa Sau Map 1</span>
              <Link to="/simulation" className="card-action-link">
                <span>Khám Phá Bản Đồ 2 →</span>
              </Link>
            </div>
          </div>

          {/* 4. Community Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-green-subtle">
                <Users size={22} className="text-green" aria-hidden="true" />
              </div>
              <div>
                <h3 className="card-title">Cộng Đồng Nhà Đầu Tư</h3>
                <span className="text-muted font-mono" style={{ fontSize: "0.8rem", display: "block" }}>Community</span>
              </div>
            </div>
            <p className="card-description">
              Diễn đàn thảo luận tài chính, trao đổi kinh nghiệm, phản biện chiến lược và học hỏi từ các nhà đầu tư khác.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Hoạt Động</span>
              <Link to="/community" className="card-action-link">
                <span>Tham Gia Thảo Luận →</span>
              </Link>
            </div>
          </div>

          {/* 5. Subscription Domain */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-amber-subtle">
                <BadgeDollarSign size={22} className="text-amber" aria-hidden="true" />
              </div>
              <div>
                <h3 className="card-title">Gói Hội Viên</h3>
                <span className="text-muted font-mono" style={{ fontSize: "0.8rem", display: "block" }}>Membership &amp; Plans</span>
              </div>
            </div>
            <p className="card-description">
              Bắt đầu hoàn toàn miễn phí. Nâng cấp khi cần công cụ phân tích danh mục chuyên sâu và mở rộng hạn ngạch giao dịch.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-amber-subtle">Sắp Ra Mắt</span>
              <Link to="/subscription" className="card-action-link">
                <span>Xem Chi Tiết Gói →</span>
              </Link>
            </div>
          </div>

          {/* 6. Security & Protection */}
          <div className="card card-aura">
            <div className="card-header">
              <div className="card-icon-wrap bg-blue-subtle">
                <ShieldCheck size={22} className="text-blue" aria-hidden="true" />
              </div>
              <div>
                <h3 className="card-title">Bảo Mật &amp; Minh Bạch</h3>
                <span className="text-muted font-mono" style={{ fontSize: "0.8rem", display: "block" }}>Security &amp; Protection</span>
              </div>
            </div>
            <p className="card-description">
              Mã hóa mật khẩu Argon2id, luân chuyển refresh token an toàn, hạch toán danh mục minh bạch theo thời gian thực.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-success-subtle">Kích Hoạt</span>
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>Được Bảo Vệ</span>
            </div>
          </div>

          {/* 7. Aura Intelligence */}
          <div className="card card-aura card-deferred">
            <div className="card-header">
              <div className="card-icon-wrap bg-purple-subtle">
                <Cpu size={22} className="text-purple" aria-hidden="true" />
              </div>
              <div>
                <h3 className="card-title">Aura Intelligence</h3>
                <span className="text-muted font-mono" style={{ fontSize: "0.8rem", display: "block" }}>AI Learning Coach</span>
              </div>
            </div>
            <p className="card-description">
              Cố vấn AI đồng hành thông minh, giải thích biến động thị trường theo thời gian thực và định hình kỷ luật giao dịch an toàn.
            </p>
            <div className="card-footer-action">
              <span className="badge badge-neutral">Phase 8 Intelligence — Coming Soon</span>
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>Đang Phát Triển</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S5. DUAL SIMULATION MAPS (Tiêu Điểm 2 Bản Đồ)
          ==================================================================== */}
      <section className="section-navy-band" aria-labelledby="maps-showcase-heading">
        <div className="navy-band-inner">
          <div className="section-header-center text-white">
            <span className="section-tag-navy">TIÊU ĐIỂM ĐẤU TRƯỜNG • SIMULATION SPOTLIGHT</span>
            <h2 id="maps-showcase-heading" className="section-title text-white">
              TRẢI NGHIỆM ĐẦU TƯ <span className="text-gradient-navy">QUA 2 BẢN ĐỒ THỰC CHIẾN</span>
            </h2>
            <p className="section-subtitle-navy">
              Chuyển hóa từ phản xạ mua đỉnh bán đáy theo đám đông sang tư duy phân bổ vốn định chế bền vững
            </p>
          </div>

          <div className="maps-showcase-grid">
            {/* Map 1 Card */}
            <div className="map-showcase-card map1-card">
              <div className="map-card-badge-row">
                <span className="map-chip map1-chip">
                  <Flame size={14} /> MAP 1 • FOMO ARENA
                </span>
                <span className="badge badge-success-subtle">SẴN SÀNG</span>
              </div>
              <h3 className="map-card-title">FOMO ARENA</h3>
              <p className="map-card-tagline">Đấu Trường Tâm Lý &amp; Lướt Sóng Ngắn Hạn</p>

              <div className="map-specs-list">
                <div className="map-spec-item">
                  <span className="spec-label">⏱ Cơ Chế:</span>
                  <span className="spec-val">Thời gian thực · 7 vòng × 45s</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">💰 Vốn Ảo:</span>
                  <span className="spec-val">10.000.000 VND tiền vốn thực hành</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🎯 Mục Tiêu:</span>
                  <span className="spec-val">Vượt bẫy tâm lý, đạt lợi nhuận +5% đến +10%</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🏆 Phần Thưởng:</span>
                  <span className="spec-val">Huy hiệu &quot;Kẻ Sinh Tồn&quot; + Mở khóa Bản Đồ 2</span>
                </div>
              </div>

              <Link to="/simulation" className="btn btn-primary btn-md map-cta-btn">
                <span>Vào Map 1 (FOMO Arena) →</span>
              </Link>
            </div>

            {/* Map 2 Card */}
            <div className="map-showcase-card map2-card">
              <div className="map-card-badge-row">
                <span className="map-chip map2-chip">
                  <BrainCircuit size={14} /> MAP 2 • PRO ROOM
                </span>
                <span className="badge badge-amber-subtle">
                  <Lock size={12} /> YÊU CẦU MỞ KHÓA
                </span>
              </div>
              <h3 className="map-card-title">PRO ROOM</h3>
              <p className="map-card-tagline">Đầu Tư Giá Trị &amp; Phân Bổ Vĩ Mô 12 Quý</p>

              <div className="map-specs-list">
                <div className="map-spec-item">
                  <span className="spec-label">📅 Cơ Chế:</span>
                  <span className="spec-val">Theo lượt (Turn-based) · 12 quý kinh tế</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">💰 Vốn Ảo:</span>
                  <span className="spec-val">100.000.000 VND vốn định chế</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🎯 Mục Tiêu:</span>
                  <span className="spec-val">Lợi nhuận bền vững (Alpha), Giảm sụt giảm &lt; 15%</span>
                </div>
                <div className="map-spec-item">
                  <span className="spec-label">🤖 Cố Vấn AI:</span>
                  <span className="spec-val">Phân tích Graham &amp; Buffett Advisor</span>
                </div>
              </div>

              <div className="map-locked-box">
                <Lock size={14} className="text-amber" />
                <span>Hoàn thành Map 1 để mở khóa Phòng Pro Room</span>
              </div>
            </div>
          </div>

          <div className="navy-band-action">
            <Link to="/simulation" className="btn btn-gradient btn-lg">
              <span>Đến Sàn Giả Lập &amp; Chọn Bản Đồ →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S6. 4-STEP ROADMAP (Lộ Trình 4 Bước Chuẩn Mực)
          ==================================================================== */}
      <section className="section-how-it-works" aria-labelledby="steps-heading">
        <div className="section-header-center">
          <span className="section-tag">LỘ TRÌNH PHÁT TRIỂN • LEARNER PATHWAY</span>
          <h2 id="steps-heading" className="section-title">
            LỘ TRÌNH 4 BƯỚC <span className="text-gradient">CHUẨN MỰC (4-STEP ROADMAP)</span>
          </h2>
          <p className="section-subtitle">
            Phương pháp sư phạm đã được kiểm chứng giúp người học tự tin ra quyết định đầu tư
          </p>
        </div>

        <div className="roadmap-grid">
          <div className="roadmap-step">
            <div className="step-number">1</div>
            <div className="step-icon-wrap">
              <BookOpen size={24} />
            </div>
            <h4>HỌC TẠI ACADEMY</h4>
            <p>Nắm vững 9 trạm kiến thức nền tảng: quyền sở hữu cổ phiếu, đọc sổ lệnh, bảng cân đối kế toán, chỉ số P/E và chu kỳ vĩ mô.</p>
          </div>

          <div className="roadmap-step">
            <div className="step-number">2</div>
            <div className="step-icon-wrap">
              <Flame size={24} />
            </div>
            <h4>THỬ LỬA TẠI MAP 1</h4>
            <p>Đối mặt với 7 vòng sóng gió FOMO, tin đồn giật gân và bẫy đám đông 45s để tôi luyện kỷ luật cắt lỗ dứt khoát.</p>
          </div>

          <div className="roadmap-step">
            <div className="step-number">3</div>
            <div className="step-icon-wrap">
              <BrainCircuit size={24} />
            </div>
            <h4>NÂNG TẦM TẠI MAP 2</h4>
            <p>Quản trị danh mục đa tài sản qua 12 quý kinh tế với sự đồng hành và phản biện của Cố vấn AI theo triết lý giá trị.</p>
          </div>

          <div className="roadmap-step">
            <div className="step-number">4</div>
            <div className="step-icon-wrap">
              <Users size={24} />
            </div>
            <h4>CHIA SẺ CÙNG CỘNG ĐỒNG</h4>
            <p>Đăng tải phân tích, tranh luận luận điểm đầu tư và mài sắc tư duy cùng những người học nghiêm túc khác.</p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S7. LATEST COMMUNITY INSIGHTS (Thảo Luận Nổi Bật)
          ==================================================================== */}
      <section className="section-community-insights" aria-labelledby="community-preview-heading">
        <div className="community-insights-header">
          <div>
            <span className="section-tag">THẢO LUẬN THỰC CHIẾN • REAL DISCUSSIONS</span>
            <h2 id="community-preview-heading" className="section-title">
              GÓC <span className="text-gradient">THẢO LUẬN CỘNG ĐỒNG</span>
            </h2>
          </div>
          <Link to="/community" className="btn btn-ghost">
            <span>Xem Tất Cả Thảo Luận →</span>
          </Link>
        </div>

        <div className="community-cards-grid">
          <div className="community-preview-card">
            <div className="card-author-row">
              <div className="author-avatar">AM</div>
              <div>
                <span className="author-name">Alex Morgan</span>
                <span className="post-date">Vừa xong</span>
              </div>
            </div>
            <h4 className="post-title">Quản trị rủi ro trong chu kỳ biến động mạnh</h4>
            <p className="post-snippet">
              Duy trì ít nhất 30% tỷ trọng tiền mặt khi thị trường bước vào pha co hẹp định giá giúp tâm lý ổn định và bảo toàn vốn an toàn...
            </p>
            <div className="post-meta-row">
              <span className="like-badge">❤️ 1 like</span>
              <span className="topic-tag">Quản Trị Rủi Ro</span>
            </div>
          </div>

          <div className="community-preview-card">
            <div className="card-author-row">
              <div className="author-avatar bg-teal">LT</div>
              <div>
                <span className="author-name">Thành Long</span>
                <span className="post-date">1 ngày trước</span>
              </div>
            </div>
            <h4 className="post-title">Bài học sống còn sau Vòng 4 tại FOMO Arena</h4>
            <p className="post-snippet">
              Tuyệt đối không dùng margin x5 khi chưa có xác nhận từ sổ lệnh. Kiên nhẫn đặt lệnh limit đã giúp tài khoản của mình đạt +8.5%...
            </p>
            <div className="post-meta-row">
              <span className="like-badge">❤️ 4 likes</span>
              <span className="topic-tag">Đấu Trường Map 1</span>
            </div>
          </div>

          <div className="community-preview-card">
            <div className="card-author-row">
              <div className="author-avatar bg-purple">VI</div>
              <div>
                <span className="author-name">Văn Hùng</span>
                <span className="post-date">2 ngày trước</span>
              </div>
            </div>
            <h4 className="post-title">Tác động của lãi suất điều hành đến định giá cổ phiếu</h4>
            <p className="post-snippet">
              Khi ngân hàng trung ương giảm lãi suất, chiết khấu dòng tiền trong tương lai giảm xuống, tạo động lực mở rộng hệ số P/E nhóm tăng trưởng...
            </p>
            <div className="post-meta-row">
              <span className="like-badge">❤️ 7 likes</span>
              <span className="topic-tag">Kinh Tế Vĩ Mô</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S8. STUDENT-CENTERED CTA (Cộng Đồng Học Viên)
          ==================================================================== */}
      <section className="section-people-centered" aria-label="Student Community Call to Action">
        <div className="people-card">
          <div className="people-text">
            <span className="section-tag">SỨC MẠNH CỘNG ĐỒNG • COMMUNITY POWERED</span>
            <h2 className="section-title">
              CÙNG NHAU HỌC TẬP, <br />
              <span className="text-gradient">TIẾN BỘ MỖI NGÀY</span>
            </h2>
            <p className="people-desc">
              Hơn 10.000 phiên giao dịch mô phỏng an toàn đã được thực hiện trên Aura Capital.
              Trang bị cho bản thân thói quen đầu tư vững vàng trước khi bước vào thị trường thật.
            </p>
            <div className="people-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  <span>Mở Bảng Điều Khiển Của Bạn →</span>
                </Link>
              ) : (
                <Link to="/register" className="btn btn-gradient btn-lg">
                  <Sparkles size={18} />
                  <span>Đăng Ký Tài Khoản Miễn Phí (Get Started)</span>
                </Link>
              )}
            </div>
          </div>
          <div className="people-badges-column" aria-hidden="true">
            <div className="floating-badge fb-1">
              <Award size={20} className="text-amber" />
              <div>
                <strong>Huy Hiệu Sinh Tồn</strong>
                <span>Vượt qua bão FOMO Arena</span>
              </div>
            </div>
            <div className="floating-badge fb-2">
              <Coins size={20} className="text-green" />
              <div>
                <strong>+50 XP Thưởng</strong>
                <span>Hoàn thành Trạm 1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          S9. FINAL CONVERSION CTA BAND (Kêu Gọi Hành Động Cuối Trang)
          ==================================================================== */}
      <section className="section-final-cta" aria-labelledby="cta-final-heading">
        <div className="final-cta-content">
          <h2 id="cta-final-heading" className="final-cta-title">
            Sẵn sàng làm chủ tâm lý giao dịch mà không sợ mất tiền thật?
          </h2>
          <p className="final-cta-sub">
            Trải nghiệm cả 2 đấu trường mô phỏng hoàn toàn miễn phí với 100.000.000 ₫ vốn học tập.
          </p>
          <div className="final-cta-buttons">
            <Link to="/register" className="btn btn-gradient btn-lg">
              <Zap size={18} />
              <span>Đăng Ký Tài Khoản Miễn Phí</span>
            </Link>
            <Link to="/simulation" className="btn btn-secondary btn-lg">
              <TrendingUp size={18} />
              <span>Khám Phá Sàn Giả Lập</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};
