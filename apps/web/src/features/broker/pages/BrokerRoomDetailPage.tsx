import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Award,
  Users,
  BookOpen,
  Newspaper,
  Gamepad2,
  Lock,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { brokerApi } from "../../../api/broker.api";
import { useAuth } from "../../auth/context/AuthContext";
import { BrokerRoomDto, RoomResourceDto } from "@aura/shared";
import { RoomEnrollmentModal } from "../components/RoomEnrollmentModal";

export const BrokerRoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();

  const [room, setRoom] = useState<(BrokerRoomDto & { resources: RoomResourceDto[]; isEnrolled: boolean }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lectures" | "briefs" | "simulation" | "discussion">("lectures");
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const loadRoom = async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const data = await brokerApi.getRoomDetail(roomId, user?.id);
      setRoom(data);
    } catch {
      // Room not found
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoom();
  }, [roomId, user?.id]);

  if (isLoading) {
    return (
      <main className="room-detail-container text-center" id="main-content">
        <div className="loading-spinner" />
        <p>Đang tải thông tin phòng học...</p>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="room-detail-container text-center" id="main-content">
        <h2>Không tìm thấy phòng đầu tư</h2>
        <p className="text-muted">Phòng bạn đang tìm kiếm có thể đã bị đóng hoặc đổi đường dẫn.</p>
        <Link to="/broker-hub" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Quay lại Broker Hub
        </Link>
      </main>
    );
  }

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const lectures = room.resources.filter((r) => r.category === "LECTURE" || r.category === "VALUATION_MODEL");
  const briefs = room.resources.filter((r) => r.category === "MARKET_BRIEF");
  const simExercises = room.resources.filter((r) => r.category === "SIMULATION_EXERCISE");

  return (
    <main className="room-detail-container" id="main-content">
      {/* Breadcrumb & Navigation */}
      <div className="room-breadcrumb">
        <Link to="/broker-hub" className="back-link">
          <ArrowLeft size={16} /> Quay lại Danh Bạ Broker Hub
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="room-hero-card">
        <div className="room-hero-grid">
          <div className="room-hero-info">
            <div className="room-hero-tags">
              <span className="style-tag">{room.investmentStyle}</span>
              <span className="members-tag">
                <Users size={12} /> {room.memberCount} học viên
              </span>
              {room.isEnrolled && (
                <span className="enrolled-badge">
                  <CheckCircle2 size={12} /> Đã Mở Khóa Quyền Truy Cập
                </span>
              )}
            </div>

            <h1 className="room-hero-title">{room.title}</h1>
            <p className="room-hero-desc">{room.description}</p>

            <div className="room-author-strip">
              <div className="author-avatar">
                {room.brokerAvatarUrl ? (
                  <img src={room.brokerAvatarUrl} alt={room.brokerName} />
                ) : (
                  room.brokerName.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="author-info">
                <div className="author-name-row">
                  <span className="author-name">{room.brokerName}</span>
                  <span className="author-badge">
                    <Award size={12} /> {room.brokerBadge}
                  </span>
                </div>
                <span className="author-firm">
                  <ShieldCheck size={13} className="text-cyan" /> {room.brokerFirm}
                </span>
              </div>
            </div>
          </div>

          <div className="room-hero-cta-card">
            <div className="cta-pricing-row">
              <span className="cta-label">Phí Tham Gia Trọn Đời:</span>
              <span className="cta-price">{formatVnd(room.entranceFeeVnd)}</span>
            </div>

            <p className="cta-sub">Thanh toán 1 lần duy nhất • Quyền truy cập vĩnh viễn</p>

            {room.isEnrolled ? (
              <div className="enrolled-status-box">
                <CheckCircle2 size={20} className="text-emerald" />
                <span>Bạn đang là thành viên chính thức của phòng này.</span>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => setIsEnrollModalOpen(true)}
                data-testid="enroll-room-btn"
              >
                <Lock size={16} style={{ marginRight: "6px" }} />
                Tham Gia Phòng ({formatVnd(room.entranceFeeVnd)})
              </button>
            )}

            <div className="aura-escrow-badge">
              <ShieldCheck size={14} className="text-cyan" />
              <span>Bảo chứng bởi Aura Capital (Hoàn tiền 100% nếu có lừa đảo)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="room-workspace-layout">
        <div className="room-main-column">
          {/* Tabs bar */}
          <div className="room-tabs-bar">
            <button
              type="button"
              className={`room-tab-btn ${activeTab === "lectures" ? "active" : ""}`}
              onClick={() => setActiveTab("lectures")}
            >
              <BookOpen size={16} /> Bài Giảng & Slide ({lectures.length})
            </button>
            <button
              type="button"
              className={`room-tab-btn ${activeTab === "briefs" ? "active" : ""}`}
              onClick={() => setActiveTab("briefs")}
            >
              <Newspaper size={16} /> Nhận Định Thị Trường ({briefs.length})
            </button>
            <button
              type="button"
              className={`room-tab-btn ${activeTab === "simulation" ? "active" : ""}`}
              onClick={() => setActiveTab("simulation")}
            >
              <Gamepad2 size={16} /> Bài Tập Mô Phỏng ({simExercises.length})
            </button>
            <button
              type="button"
              className={`room-tab-btn ${activeTab === "discussion" ? "active" : ""}`}
              onClick={() => setActiveTab("discussion")}
            >
              <MessageSquare size={16} /> Thảo Luận Phòng
            </button>
          </div>

          {/* Tab 1: Lectures */}
          {activeTab === "lectures" && (
            <div className="resource-list-view">
              {lectures.length > 0 ? (
                lectures.map((res) => (
                  <div key={res.id} className="resource-item-card">
                    <div className="resource-header">
                      <span className="category-pill">{res.category}</span>
                      {res.isPinned && <span className="pinned-pill">Ghim Đầu</span>}
                      <span className="date-pill">{new Date(res.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>

                    <h3 className="resource-title">{res.title}</h3>

                    {room.isEnrolled ? (
                      <div className="resource-content-box">
                        <p>{res.content}</p>
                      </div>
                    ) : (
                      <div className="locked-content-box">
                        <Lock size={20} className="text-muted" />
                        <p>Nội dung chuyên sâu dành riêng cho học viên đã tham gia phòng.</p>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-cyan"
                          onClick={() => setIsEnrollModalOpen(true)}
                        >
                          Mở Khóa Toàn Bộ Bài Giảng
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-tab-box">
                  <BookOpen size={36} className="text-muted" />
                  <p>Chuyên gia đang chuẩn bị bài giảng tiếp theo cho phòng.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Market Briefs */}
          {activeTab === "briefs" && (
            <div className="resource-list-view">
              {briefs.length > 0 ? (
                briefs.map((res) => (
                  <div key={res.id} className="resource-item-card">
                    <div className="resource-header">
                      <span className="category-pill">Bản Tin Đầu Ngày</span>
                      <span className="date-pill">{new Date(res.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <h3 className="resource-title">{res.title}</h3>
                    <div className="resource-content-box">
                      <p>{res.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-tab-box">
                  <Newspaper size={36} className="text-muted" />
                  <p>Chưa có bản tin nhận định thị trường mới.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Simulation Exercises */}
          {activeTab === "simulation" && (
            <div className="simulation-exercises-view">
              <div className="sim-intro-callout">
                <Gamepad2 size={24} className="text-cyan" />
                <div>
                  <h4>Đấu Trường Thực Chiến Gắn Liền Với Bài Giảng</h4>
                  <p>Chuyên gia thiết kế các tình huống kéo xả, bẫy tâm lý và chu kỳ vĩ mô trên hệ sinh thái Simulation của Aura Capital để học viên rèn luyện trước khi vào tiền thật.</p>
                </div>
              </div>

              {simExercises.length > 0 ? (
                simExercises.map((res) => (
                  <div key={res.id} className="sim-exercise-card">
                    <div className="sim-exercise-header">
                      <h3 className="sim-title">{res.title}</h3>
                      <span className="sim-tag">Map: {res.simulationKey || "FOMO Arena"}</span>
                    </div>
                    <p className="sim-desc">{res.content}</p>
                    <div className="sim-actions">
                      {res.simulationKey === "MAP2_MACRO" ? (
                        <Link to="/simulation/map-2" className="btn btn-sm btn-primary">
                          Vào Thử Thách Map 2 (Pro Room) &rarr;
                        </Link>
                      ) : (
                        <Link to="/simulation/map-1" className="btn btn-sm btn-primary">
                          Vào Thử Thách Map 1 (FOMO Arena) &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-tab-box">
                  <Gamepad2 size={36} className="text-muted" />
                  <p>Bài tập mô phỏng sẽ được công bố sau buổi học chiến lược.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Discussion */}
          {activeTab === "discussion" && (
            <div className="room-discussion-view">
              <div className="discussion-info-banner">
                <MessageSquare size={16} />
                <span>Kênh trao đổi nội bộ văn minh. Mọi bình luận đều được kiểm duyệt tự động để ngăn chặn spam và phím hàng ảo.</span>
              </div>
              <div className="discussion-placeholder text-center">
                <p className="text-muted">Không gian thảo luận chiến lược đang hoạt động sôi nổi giữa các học viên và chuyên gia.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <aside className="room-sidebar-column">
          {/* Broker Passport summary widget */}
          <div className="sidebar-passport-box">
            <h4 className="sidebar-heading">Bảo Chứng Chuyên Môn</h4>
            <div className="passport-row">
              <ShieldCheck size={16} className="text-cyan" />
              <div>
                <strong>Số CCHN UBCKNN</strong>
                <p>UBCKNN-CCHN-2019-4820</p>
              </div>
            </div>
            <div className="passport-row">
              <Award size={16} className="text-amber" />
              <div>
                <strong>Công ty chứng khoán</strong>
                <p>{room.brokerFirm}</p>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="sidebar-disclaimer-box">
            <div className="disclaimer-header">
              <AlertTriangle size={16} className="text-amber" />
              <h5>Tuyên Bố Pháp Lý Bắt Buộc</h5>
            </div>
            <p className="disclaimer-text">
              Nội dung trong phòng sinh hoạt được cung cấp cho mục đích nghiên cứu học thuật và đào tạo kiến thức tài chính; <strong>không cấu thành dịch vụ ủy thác quản lý danh mục đầu tư</strong> hoặc cam kết chia sẻ lợi nhuận theo pháp luật chứng khoán Việt Nam.
            </p>
          </div>
        </aside>
      </div>

      {/* Enrollment Modal */}
      <RoomEnrollmentModal
        isOpen={isEnrollModalOpen}
        room={room}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={() => {
          setIsEnrollModalOpen(false);
          loadRoom();
        }}
      />
    </main>
  );
};
