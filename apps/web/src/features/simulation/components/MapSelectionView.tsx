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
} from "lucide-react";

interface MapSelectionViewProps {
  onEnterCockpit: (mapId: "map1-fomo" | "map2-pro") => void;
  hasActiveSession: boolean;
  activeSessionCycle?: number;
  activeScenarioName?: string;
}

export const MapSelectionView: React.FC<MapSelectionViewProps> = ({
  onEnterCockpit,
  hasActiveSession,
  activeSessionCycle,
  activeScenarioName,
}) => {
  const navigate = useNavigate();
  const [briefingMap, setBriefingMap] = useState<"map1-fomo" | "map2-pro" | null>(null);

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
      <div className="map-picker-header">
        <span className="section-tag">
          ĐẤU TRƯỜNG GIẢ LẬP <span className="sr-only">SIMULATION ARENA</span>
        </span>
        <h2 className="section-title">
          CHỌN BẢN ĐỒ <span className="text-gradient">THỰC CHIẾN</span>
          <span className="sr-only">SELECT YOUR SIMULATION MAP</span>
        </h2>
        <p className="map-picker-subtitle">
          Lựa chọn đấu trường để rèn giũa phản xạ tài chính thực tế—từ áp lực tâm lý biến động nghẹt thở đến chiến lược phân bổ danh mục vĩ mô 12 quý.
        </p>
      </div>

      {/* Dual Map Grid */}
      <div className="maps-selection-grid">
        {/* MAP 1: FOMO ARENA */}
        <div className="map-picker-card map1-picker">
          <div className="map-picker-top">
            <div className="map-chip map1-chip">
              <Flame size={15} />
              <span>MAP 1</span>
            </div>
            <span className="badge badge-success-subtle">SẴN SÀNG</span>
          </div>

          <div className="map-card-hero">
            <div className="map-icon-halo map1-halo">
              <Flame size={32} className="text-orange" />
            </div>
            <h3 className="map-title-lg">MAP 1 — FOMO ARENA</h3>
            <p className="map-tagline-lg">Tôi Luyện Tâm Lý &amp; Đối Đầu Biến Động Ngắn Hạn</p>
          </div>

          <div className="map-specs-box">
            <div className="spec-row">
              <span className="spec-icon-label">
                <Clock size={15} className="text-muted" /> Cơ Chế:
              </span>
              <strong>
                Thời gian thực · 7 vòng × 45 giây
                <span className="sr-only">Real-time · 7 rounds × 45s</span>
              </strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Coins size={15} className="text-muted" /> Vốn Khởi Điểm:
              </span>
              <strong>
                10.000.000 ₫ tiền ảo
                <span className="sr-only">10.000.000 VND virtual cash</span>
              </strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Target size={15} className="text-muted" /> Mục Tiêu:
              </span>
              <strong>Sống sót qua các bẫy, lợi nhuận +5–10%</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Award size={15} className="text-muted" /> Cột Mốc:
              </span>
              <strong>Huy hiệu Sinh Tồn + Chìa khóa mở Map 2</strong>
            </div>
          </div>

          <div className="map-picker-actions">
            <button
              type="button"
              className={`btn ${hasActiveSession ? "btn-secondary" : "btn-primary"} btn-md btn-block`}
              onClick={() => navigate("/simulation/map-1")}
              data-testid="enter-fomo-arena-button"
            >
              <span>Vào Đấu Trường Map 1 (FOMO Arena) →</span>
              <span className="sr-only">Start Map 1 (FOMO Arena)</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBriefingMap("map1-fomo")}
            >
              <span>Xem Luật Chơi &amp; Nhiệm Vụ Map 1</span>
            </button>
          </div>
        </div>

        {/* MAP 2: PRO ROOM */}
        <div className="map-picker-card map2-picker">
          <div className="map-picker-top">
            <div className="map-chip map2-chip">
              <BrainCircuit size={15} />
              <span>MAP 2</span>
            </div>
            <span className="badge badge-amber-subtle">
              <Lock size={13} />
              <span>Khóa cho đến khi vượt qua Map 1</span>
              <span className="sr-only">Locked until Map 1 is survived</span>
            </span>
          </div>

          <div className="map-card-hero">
            <div className="map-icon-halo map2-halo">
              <BrainCircuit size={32} className="text-teal" />
            </div>
            <h3 className="map-title-lg">MAP 2 — PRO ROOM</h3>
            <p className="map-tagline-lg">Đầu Tư Giá Trị Kỷ Luật &amp; Phân Bổ Danh Mục Chiến Lược</p>
          </div>

          <div className="map-specs-box">
            <div className="spec-row">
              <span className="spec-icon-label">
                <Clock size={15} className="text-muted" /> Cơ Chế:
              </span>
              <strong>
                Theo lượt · 12 quý vĩ mô
                <span className="sr-only">Turn-based · 12 quarters</span>
              </strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Coins size={15} className="text-muted" /> Vốn Khởi Điểm:
              </span>
              <strong>
                100.000.000 ₫ tiền ảo
                <span className="sr-only">100.000.000 VND virtual cash</span>
              </strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Target size={15} className="text-muted" /> Mục Tiêu:
              </span>
              <strong>Tạo Alpha bền vững, sụt giảm Drawdown &lt; 15%</strong>
            </div>
            <div className="spec-row">
              <span className="spec-icon-label">
                <Sparkles size={15} className="text-muted" /> Cố Vấn:
              </span>
              <strong>
                Cố vấn AI Graham &amp; Buffett
                <span className="sr-only">Graham &amp; Buffett AI Advisor</span>
              </strong>
            </div>
          </div>

          <div className="map-picker-actions">
            <button
              type="button"
              className="btn btn-secondary btn-md btn-block"
              onClick={() => navigate("/simulation/map-2")}
              data-testid="enter-pro-room-button"
            >
              <span>Vào Bàn Chiến Lược Map 2 (Pro Room) →</span>
              <span className="sr-only">Start Map 2 (Pro Room)</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBriefingMap("map2-pro")}
            >
              <span>Xem Giáo Trình &amp; Chiến Lược Map 2</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Roadmap Footer */}
      <div className="simulation-stepper-card">
        <div className="stepper-track">
          <div className="stepper-node active">
            <div className="node-circle">1</div>
            <span className="node-title">Map 1: FOMO Arena</span>
            <span className="node-desc">Vượt qua bão tâm lý ngắn hạn</span>
          </div>
          <div className="stepper-arrow">
            <span className="key-pill">🔑 Chìa Khóa Mở Khóa</span>
            <div className="arrow-line" />
          </div>
          <div className="stepper-node locked">
            <div className="node-circle">
              <Lock size={14} />
            </div>
            <span className="node-title">Map 2: Pro Room</span>
            <span className="node-desc">Chiến lược phân bổ danh mục đa quý</span>
          </div>
        </div>
      </div>

      {/* Briefing Modal */}
      {briefingMap && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="map-chip">
                  {briefingMap === "map1-fomo" ? "HƯỚNG DẪN MAP 1" : "HƯỚNG DẪN MAP 2"}
                </span>
                <h3>
                  {briefingMap === "map1-fomo"
                    ? "FOMO Arena: Nhiệm Vụ Thực Chiến"
                    : "Pro Room: Chiến Lược Phân Bổ"}
                </h3>
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
              {briefingMap === "map1-fomo" ? (
                <>
                  <p className="briefing-lead">
                    Bạn được cấp <strong>10.000.000 ₫</strong> vốn ảo.
                    Mục tiêu là sống sót qua 7 vòng giao dịch liên tiếp (mỗi vòng 45 giây) mà không bị cháy tài khoản.
                  </p>
                  <div className="briefing-rules">
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Cảnh Giác Bẫy Đám Đông:</strong> Tin đồn bất ngờ và các đợt bơm giá sốc được thiết kế để thử thách kỷ luật cắt lỗ.
                      </div>
                    </div>
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Cơ Chế Khớp Lệnh:</strong> Lệnh Thị trường (Market) và Giới hạn (Limit) khớp chính xác theo thanh khoản sổ lệnh.
                      </div>
                    </div>
                    <div className="rule-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <div>
                        <strong>Tiêu Chí Đánh Giá:</strong> Bạn sẽ được xếp hạng dựa trên <em>Điểm Kháng FOMO</em> và <em>Hiệu suất PnL</em>.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                        <strong>Điều Kiện Mở Khóa:</strong> Hoàn thành sống sót tại Map 1 để nhận chứng chỉ kích hoạt Pro Room.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setBriefingMap(null)}
              >
                Đóng
              </button>
              {briefingMap === "map1-fomo" ? (
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  onClick={() => {
                    setBriefingMap(null);
                    navigate("/simulation/map-1");
                  }}
                >
                  <span>Vào Đấu Trường FOMO Arena →</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-md"
                  onClick={() => {
                    setBriefingMap(null);
                    navigate("/simulation/map-2");
                  }}
                >
                  <span>Vào Bàn Chiến Lược Pro Room →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
