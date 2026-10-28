import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  BrainCircuit,
  Lock,
  CheckCircle2,
  Clock,
  Coins,
  Target,
  Award,
  X,
  Sparkles,
  Crown,
} from "lucide-react";
import { gamificationService } from "../services/gamification.service";
import { FomoTutorialModal } from "./map1/FomoTutorialModal";
import { useAuth } from "../../auth/context/AuthContext";

export interface MapSelectionViewProps {
  onEnterCockpit: (mapId: "map1-fomo" | "map2-pro") => void;
  hasActiveSession: boolean;
  activeSessionCycle?: number;
  activeScenarioName?: string;
  userPlan?: "FREE" | "PREMIUM";
  isPremium?: boolean;
}

export const MapSelectionView: React.FC<MapSelectionViewProps> = ({
  onEnterCockpit,
  hasActiveSession,
  activeSessionCycle,
  activeScenarioName,
  userPlan,
  isPremium: propIsPremium,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [briefingMap, setBriefingMap] = useState<"map1-fomo" | "map2-pro" | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPrereqModal, setShowPrereqModal] = useState(false);

  const isElevatedRole = user?.role === "SYSTEM_ADMIN" || user?.role === "ADMIN" || user?.role === "MODERATOR";
  const hasCompletedMap1 = isElevatedRole || gamificationService.hasCompletedMap1();
  const isVipBadge = isElevatedRole || gamificationService
    .getState()
    .badges.some((b) => b.id === "VIP_PATRON" && b.isUnlocked);
  const isPremium = isElevatedRole || propIsPremium || (userPlan === "PREMIUM" || isVipBadge);
  const quota = gamificationService.canPlayMap2(isPremium ? "PREMIUM" : "FREE");

  const handleEnterMap2 = () => {
    if (!hasCompletedMap1) {
      setShowPrereqModal(true);
      return;
    }
    if (!isPremium && !quota.allowed) {
      setShowUpgradeModal(true);
      return;
    }
    navigate("/simulation/map-2");
  };

  return (
    <div className="map-selection-view">
      {/* Active Session Notice if one is already running */}
      {hasActiveSession && (
        <div className="active-session-banner card-aura">
          <div className="active-session-info">
            <span className="badge badge-success-subtle">
              PHIÊN ĐANG MỞ • <span className="sr-only">SESSION IN PROGRESS</span>
            </span>
            <h4>{activeScenarioName || "Phiên Giao Dịch Đang Hoạt Động"}</h4>
            <p>Chu kỳ {activeSessionCycle ?? 1} · Khớp lệnh thị trường đang chạy</p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => onEnterCockpit("map1-fomo")}
          >
            <span>Tiếp Tục Bàn Giao Dịch →</span>
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="arena-hero-section">
        <div className="arena-season-tag">
          <span className="season-dot" />
          <span>HỆ THỐNG ĐẤU TRƯỜNG MÙA GIẢI Q2/2026</span>
          <span className="sr-only">SIMULATION ARENA</span>
          <span className="sr-only">CHỌN BẢN ĐỒ THỰC CHIẾN</span>
        </div>
        <h1 className="arena-hero-title">
          Đấu Trường Giả Lập <span className="text-blue">Thực Chiến</span>
        </h1>
        <p className="arena-hero-subtitle">
          Rèn giũa phản xạ tài chính thực tế và thử thách kỷ luật danh mục. Lựa chọn đấu trường giữa áp lực sóng tâm lý ngắn hạn hoặc chiến lược phân bổ vĩ mô 12 quý.
        </p>
      </div>

      {/* Quick Stats Dashboard Strip */}
      <div className="arena-metrics-grid">
        <div className="arena-metric-card">
          <span className="arena-metric-label">VỐN KHẢ DỤNG</span>
          <span className="arena-metric-val">10.000.000 đ</span>
        </div>
        <div className="arena-metric-card">
          <span className="arena-metric-label">CHUỖI THẮNG</span>
          <span className="arena-metric-val text-emerald-600">3 Ván Liên Tiếp</span>
        </div>
        <div className="arena-metric-card">
          <span className="arena-metric-label">DRAWDOWN KỶ LUẬT</span>
          <span className="arena-metric-val">
            4,2% <span className="arena-metric-sub text-emerald-600 font-medium">(An toàn)</span>
          </span>
        </div>
        <div className="arena-metric-card">
          <span className="arena-metric-label">HẠNG HIỆN TẠI</span>
          <span className="arena-metric-val text-blue-600">#4 Toàn Sàn</span>
        </div>
      </div>

      {/* Tier / Fighter Promotion Roadmap */}
      <div className="arena-tier-roadmap">
        <div className="tier-header-row">
          <div className="tier-header-left">
            <span className="tier-pulse-dot" />
            <span className="tier-header-title">Tiến trình Thăng Hạng Đấu Sĩ</span>
          </div>
          <span className="tier-header-right">Hoàn thành Map 1 để mở khóa Map 2</span>
        </div>
        <div className="tier-track-container">
          <div className="tier-step tier-step-active">
            <div className="tier-circle tier-circle-active">1</div>
            <div className="tier-step-info">
              <span className="tier-step-name">Map 1: FOMO Arena</span>
              <span className="tier-step-status text-emerald-600">Đang sẵn sàng • Cấp độ 1</span>
            </div>
          </div>

          <div className="tier-connector">
            <div className="tier-line tier-line-filled" />
            <div className="tier-key-badge">
              <span>🔑 Chìa Khóa Mở Khóa: Sống sót 7 vòng + ROI &gt; 5% &amp; Kỷ luật ≥ 50</span>
            </div>
            <div className="tier-line tier-line-empty" />
          </div>

          <div className="tier-step tier-step-locked">
            <div className="tier-circle tier-circle-locked">
              <Lock size={15} />
            </div>
            <div className="tier-step-info">
              <span className="tier-step-name text-slate-500">Map 2: Macro Pro Room</span>
              <span className="tier-step-status text-slate-400">Yêu cầu hoàn thành Map 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Map Grid */}
      <div className="arena-dual-grid">
        {/* MAP 1: FOMO ARENA */}
        <div className="arena-map-card arena-card-fomo">
          <div className="arena-card-top-row">
            <div className="arena-chip-tag arena-chip-amber">
              <Flame size={14} className="text-amber-600" />
              <span>MAP 1 • TẬP TRUNG TÂM LÝ</span>
            </div>
            <div className="arena-status-badge arena-status-green">
              <span className="badge-dot-green" />
              <span>SẴN SÀNG VÀO LỆNH</span>
            </div>
          </div>

          <h2 className="arena-card-title">
            FOMO Arena — Sóng Biến Động Ngắn Hạn
            <span className="sr-only">MAP 1 — FOMO ARENA</span>
          </h2>
          <p className="arena-card-desc">
            Đối mặt với các bẫy tin tức bất ngờ, bẫy Bull Trap/Bear Trap và áp lực bảng điện nhấp nháy liên tục trong từng giây.
          </p>

          <div className="arena-specs-table">
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Clock size={14} className="text-slate-400" /> Cơ chế thi đấu:
              </span>
              <strong className="arena-spec-value">
                Thời gian thực • 7 vòng × 45 giây
                <span className="sr-only">Real-time · 7 rounds × 45s</span>
              </strong>
            </div>
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Coins size={14} className="text-slate-400" /> Vốn khởi điểm:
              </span>
              <strong className="arena-spec-value">
                10.000.000 đ (Tiền ảo)
                <span className="sr-only">10.000.000 VND virtual cash</span>
              </strong>
            </div>
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Target size={14} className="text-slate-400" /> Mục tiêu bắt buộc:
              </span>
              <strong className="arena-spec-value text-emerald-600">
                Sống sót 7 vòng + ROI &gt; +5% (Kỷ luật ≥ 50)
              </strong>
            </div>
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Award size={14} className="text-slate-400" /> Phần thưởng vượt ải:
              </span>
              <strong className="arena-spec-value text-amber-600">
                Huy hiệu Sinh Tồn + Chìa khóa Map 2
              </strong>
            </div>
          </div>

          <div className="arena-card-actions">
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg arena-cta-btn"
              onClick={() => navigate("/simulation/map-1")}
              data-testid="enter-fomo-arena-button"
            >
              <span>Tham Gia Đấu Trường (FOMO Arena) →</span>
              <span className="sr-only">Start Map 1 (FOMO Arena)</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm arena-sub-btn"
              onClick={() => setBriefingMap("map1-fomo")}
            >
              <span>Xem Luật Chơi &amp; Bài Học Tâm Lý Thực Hành ›</span>
            </button>
          </div>
        </div>

        {/* MAP 2: PRO ROOM */}
        <div className="arena-map-card arena-card-pro">
          <div className="arena-card-top-row">
            <div className="arena-chip-tag arena-chip-teal">
              <BrainCircuit size={14} className="text-teal-600" />
              <span>MAP 2 • PHÂN BỔ DANH MỤC VĨ MÔ</span>
            </div>
            <div className={`arena-status-badge ${hasCompletedMap1 ? "arena-status-emerald" : "arena-status-gray"}`}>
              {hasCompletedMap1 ? (
                <>
                  <Sparkles size={12} className="text-emerald-500" />
                  <span>{isElevatedRole ? "ĐẶC QUYỀN ADMIN • SẴN SÀNG" : "ĐÃ MỞ KHÓA • SẴN SÀNG"}</span>
                  <span className="sr-only">Locked until Map 1 is survived</span>
                </>
              ) : (
                <>
                  <Lock size={12} className="text-slate-500" />
                  <span>YÊU CẦU ĐẠT CHỈ SỐ</span>
                  <span className="sr-only">Locked until Map 1 is survived</span>
                </>
              )}
            </div>
          </div>

          <h2 className="arena-card-title">
            Macro Pro Room — Chiến Lược Danh Mục
            <span className="sr-only">MAP 2 — PRO ROOM</span>
          </h2>
          <p className="arena-card-desc">
            Kiểm chứng năng lực phân bổ tài sản qua 12 quý vĩ mô: Lãi suất biến động, chu kỳ suy thoái &amp; bùng nổ hàng hóa toàn cầu.
          </p>

          <div className="arena-specs-table">
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Clock size={14} className="text-slate-400" /> Cơ chế thi đấu:
              </span>
              <strong className="arena-spec-value">
                Mô phỏng chu kỳ • 12 Quý vĩ mô
                <span className="sr-only">Turn-based · 12 quarters</span>
              </strong>
            </div>
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Coins size={14} className="text-slate-400" /> Quy mô danh mục:
              </span>
              <strong className="arena-spec-value">
                100.000.000 đ (Tiền ảo)
                <span className="sr-only">100.000.000 VND virtual cash</span>
              </strong>
            </div>
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Target size={14} className="text-slate-400" /> Chỉ số định lượng:
              </span>
              <strong className="arena-spec-value">
                Tạo Alpha bền vững, Max DD &lt; 15%
              </strong>
            </div>
            <div className="arena-spec-row">
              <span className="arena-spec-label">
                <Sparkles size={14} className="text-slate-400" /> Cố vấn đồng hành:
              </span>
              <strong className="arena-spec-value text-blue-600">
                Aura AI Macro Advisor
                <span className="sr-only">Graham &amp; Buffett AI Advisor</span>
              </strong>
            </div>
          </div>

          <div className="arena-card-actions">
            <button
              type="button"
              className={`btn btn-block btn-lg arena-cta-btn ${hasCompletedMap1 ? "btn-dark arena-dark-btn" : "btn-outline border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100/60"}`}
              onClick={handleEnterMap2}
              data-testid="enter-pro-room-button"
            >
              {!hasCompletedMap1 && (
                <Lock size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
              )}
              <span>{hasCompletedMap1 ? "Vào Bàn Chiến Lược Map 2 (Pro Room)" : "Mở Khóa Pro Room (Cần Vượt Map 1)"}</span>
              <span className="sr-only">Start Map 2 (Pro Room)</span>
            </button>
            <div className="quota-indicator">
              {isElevatedRole ? (
                <span className="text-blue-600 font-bold flex items-center justify-center gap-1 text-xs mt-1.5">
                  <Crown size={13} className="text-blue-500" /> Đặc quyền Quản trị viên (Bypass Map 1)
                </span>
              ) : !hasCompletedMap1 ? (
                <span className="text-amber-700 font-bold flex items-center justify-center gap-1 text-xs mt-1.5">
                  <Lock size={12} className="text-amber-600" /> Yêu cầu: Hoàn thành 7 vòng tại Map 1
                </span>
              ) : isPremium ? (
                <span className="text-emerald-600 font-bold flex items-center justify-center gap-1 text-xs mt-1.5">
                  <Crown size={13} className="text-amber-500" /> Không giới hạn phiên (Premium VIP)
                </span>
              ) : (
                <span className="text-slate-400 text-xs text-center block mt-1.5 font-medium">
                  Hạn mức Standard: {quota.runsUsed}/3 phiên tháng này{quota.remaining === 0 ? " (Đã hết lượt)" : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm arena-sub-btn"
              onClick={() => setBriefingMap("map2-pro")}
            >
              <span>Xem Giáo Trình &amp; Chiến Lược Map 2 ›</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Map 1 Tutorial & Rules Modal */}
      {briefingMap === "map1-fomo" && (
        <FomoTutorialModal
          isOpen={true}
          mode="lobby"
          onClose={() => setBriefingMap(null)}
          onProceedToScenario={() => {
            setBriefingMap(null);
            navigate("/simulation/map-1");
          }}
        />
      )}

      {/* Map 2 Pro Room Briefing Modal */}
      {briefingMap === "map2-pro" && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="map-chip">HƯỚNG DẪN MAP 2</span>
                <h3>Pro Room: Chiến Lược Phân Bổ</h3>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setBriefingMap(null)}
                aria-label="Close briefing dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="briefing-lead">
                Bạn được cấp <strong>100.000.000 ₫</strong> vốn giả lập của quỹ đầu tư tổ chức trải dài qua 12 quý kinh tế vĩ mô.
              </p>
              <div className="briefing-rules">
                <div className="rule-item">
                  <CheckCircle2 size={16} className="text-success" />
                  <div>
                    <strong>Phân Bổ Đa Tài Sản:</strong> Cân bằng danh mục giữa Cổ phiếu tăng trưởng, Cổ phiếu giá trị, Trái phiếu và Tiền mặt.
                  </div>
                </div>
                <div className="rule-item">
                  <CheckCircle2 size={16} className="text-success" />
                  <div>
                    <strong>Độ Nhạy Vĩ Mô:</strong> Ứng phó trước cú sốc lạm phát, đợt tăng lãi suất ngân hàng trung ương và chu kỳ suy thoái.
                  </div>
                </div>
                <div className="rule-item">
                  <Lock size={16} className="text-amber" />
                  <div>
                    <strong>Điều Kiện Mở Khóa:</strong> Sống sót qua 7 vòng Map 1, ROI &gt; 5% và Kỷ luật ≥ 50 để nhận chứng chỉ kích hoạt Pro Room.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setBriefingMap(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={() => {
                  setBriefingMap(null);
                  if (!hasCompletedMap1) {
                    navigate("/simulation/fomo");
                  } else {
                    handleEnterMap2();
                  }
                }}
              >
                <span>{hasCompletedMap1 ? "Vào Bàn Chiến Lược Pro Room →" : "Chinh Phục Map 1 Để Mở Khóa →"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map 1 Prerequisite Gate Modal */}
      {showPrereqModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" data-testid="map2-prereq-modal">
          <div className="modal-card" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <div className="modal-title-row" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ padding: "0.5rem", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                  <Lock size={24} />
                </div>
                <div>
                  <span className="badge badge-warning-subtle text-[11px]" style={{ display: "inline-block", marginBottom: "0.25rem" }}>
                    YÊU CẦU ĐIỀU KIỆN TIÊN QUYẾT
                  </span>
                  <h3 className="modal-title text-lg font-bold" style={{ margin: 0 }}>Chưa Đủ Điều Kiện Vào Map 2</h3>
                </div>
              </div>
            </div>
            <div className="modal-body" style={{ padding: "1.25rem 0" }}>
              <p className="text-sm text-slate-600 leading-relaxed">
                Để bảo vệ tài khoản thực chiến và rèn luyện tâm lý đúng chuẩn, nhà đầu tư cần vượt qua 7 vòng tại <strong>Đấu Trường FOMO (Map 1)</strong> trước khi tiếp cận Bàn Chiến Lược Vĩ Mô (Map 2).
              </p>
            </div>
            <div className="modal-footer" style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setShowPrereqModal(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={() => {
                  setShowPrereqModal(false);
                  navigate("/simulation/fomo");
                }}
              >
                Chinh Phục Map 1 Ngay →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map 2 Quota Upgrade Modal for Standard Users */}
      {showUpgradeModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" data-testid="map2-upgrade-modal">
          <div className="modal-card" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div className="modal-title-row" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ padding: "0.5rem", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                  <Crown size={24} />
                </div>
                <div>
                  <span className="badge badge-warning-subtle text-[11px]" style={{ display: "inline-block", marginBottom: "0.25rem" }}>
                    CHẠM HẠN MỨC GÓI TIÊU CHUẨN (3/3 LƯỢT)
                  </span>
                  <h3 className="modal-title text-lg font-bold" style={{ margin: 0 }}>Nâng Cấp Để Mở Khóa Map 2</h3>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowUpgradeModal(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p className="text-sm text-slate-600 leading-relaxed" style={{ margin: 0 }}>
                Bạn đã sử dụng hết <strong>3 lượt trải nghiệm Map 2 (Pro Room)</strong> trong tháng này.
                Tài khoản Gói Tiêu Chuẩn (Standard) bị giới hạn tối đa 3 phiên phân bổ vĩ mô mỗi tháng.
              </p>

              <div
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.08))",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                }}
              >
                <strong className="text-xs font-bold text-slate-900 block mb-2 uppercase tracking-wide">
                  Đặc quyền khi nâng cấp lên Premium VIP (199.000 ₫/tháng):
                </strong>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.82rem" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span><strong>Không giới hạn</strong> lượt chơi Map 1 &amp; Map 2 suốt năm</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span>Cố vấn AI Market Coach 24/7 trực tiếp trong từng vòng lệnh</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span>Mở khóa 100% Khóa học Academy (Chặng 3 phái sinh &amp; hedging)</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={15} className="text-emerald-500" />
                    <span><strong>Tặng ngay +500 XP</strong> &amp; Huy hiệu độc quyền VIP Patron</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setShowUpgradeModal(false)}
              >
                Để Sau
              </button>
              <button
                type="button"
                className="btn btn-primary btn-md flex items-center gap-2"
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate("/subscription");
                }}
              >
                <Sparkles size={16} />
                <span>Nâng Cấp Lên Premium VIP →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
