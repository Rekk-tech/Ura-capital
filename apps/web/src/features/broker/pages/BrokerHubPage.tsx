import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Users,
  Award,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { brokerApi } from "../../../api/broker.api";
import { BrokerProfileDto, BrokerRoomDto } from "@aura/shared";
import { BrokerCard } from "../components/BrokerCard";
import { RoomCard } from "../components/RoomCard";
import { BrokerRegisterModal } from "../components/BrokerRegisterModal";
import { RoomEnrollmentModal } from "../components/RoomEnrollmentModal";

export const BrokerHubPage: React.FC = () => {
  const [brokers, setBrokers] = useState<BrokerProfileDto[]>([]);
  const [rooms, setRooms] = useState<BrokerRoomDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rooms" | "brokers">("rooms");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFirm, setSelectedFirm] = useState("ALL");
  const [selectedStyle, setSelectedStyle] = useState("ALL");

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedEnrollRoom, setSelectedEnrollRoom] = useState<BrokerRoomDto | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [brokersData, roomsData] = await Promise.all([
        brokerApi.getPublicBrokers(),
        brokerApi.getPublicRooms(),
      ]);
      setBrokers(brokersData);
      setRooms(roomsData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchSearch =
        searchQuery === "" ||
        (room.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.brokerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchFirm =
        selectedFirm === "ALL" ||
        (room.brokerFirm || "").toLowerCase().includes(selectedFirm.toLowerCase());

      const matchStyle =
        selectedStyle === "ALL" ||
        (room.investmentStyle || "").toLowerCase().includes(selectedStyle.toLowerCase());

      return matchSearch && matchFirm && matchStyle;
    });
  }, [rooms, searchQuery, selectedFirm, selectedStyle]);

  // Filtered brokers
  const filteredBrokers = useMemo(() => {
    return brokers.filter((broker) => {
      const matchSearch =
        searchQuery === "" ||
        (broker.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (broker.licenseNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (broker.firmName || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchFirm =
        selectedFirm === "ALL" ||
        (broker.firmName || "").toLowerCase().includes(selectedFirm.toLowerCase());

      const matchStyle =
        selectedStyle === "ALL" ||
        (broker.investmentStyle || "").toLowerCase().includes(selectedStyle.toLowerCase());

      return matchSearch && matchFirm && matchStyle;
    });
  }, [brokers, searchQuery, selectedFirm, selectedStyle]);

  return (
    <main className="broker-hub-container" id="main-content">
      {/* Hero Header */}
      <section className="broker-hub-hero">
        <div className="hero-content">
          <div className="hero-pill-badge">
            <ShieldCheck size={14} className="text-cyan" />
            <span>Phòng Đầu Tư Xác Thực & Creator Economy</span>
          </div>

          <h1 className="hero-heading">
            Aura Broker Hub — Thay Thế Hoàn Toàn Nhóm Zalo Phím Hàng Tự Phát
          </h1>

          <p className="hero-subtext">
            Nền tảng phòng học khép kín độc quyền dành riêng cho các Môi giới & Chuyên gia tài chính đã được <strong>Ủy ban Chứng khoán Nhà nước (UBCKNN)</strong> cấp chứng chỉ hành nghề. Minh bạch lý lịch, bảo chứng trung gian bởi Aura Capital.
          </p>

          <div className="hero-actions-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsRegisterModalOpen(true)}
              data-testid="register-broker-btn"
            >
              <Award size={16} style={{ marginRight: "6px" }} />
              Đăng Ký Làm Chuyên Gia Đối Tác
            </button>
            <a href="#how-it-works" className="btn btn-ghost">
              Tìm Hiểu Cơ Chế Bảo Chứng &rarr;
            </a>
          </div>
        </div>

        {/* 3 Pillars Callout */}
        <div className="hero-pillars-grid">
          <div className="pillar-item">
            <div className="pillar-icon bg-cyan-subtle">
              <ShieldCheck size={20} className="text-cyan" />
            </div>
            <div>
              <h4>100% Xác Thực CCHN</h4>
              <p>Bắt buộc kiểm tra số hiệu hành nghề UBCKNN & eKYC danh tính thật.</p>
            </div>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon bg-emerald-subtle">
              <CheckCircle size={20} className="text-emerald" />
            </div>
            <div>
              <h4>Phí Vào Phòng 1 Lần</h4>
              <p>Học viên chỉ trả 1 lần duy nhất, quyền truy cập vĩnh viễn, không trừ tiền định kỳ.</p>
            </div>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon bg-amber-subtle">
              <Sparkles size={20} className="text-amber" />
            </div>
            <div>
              <h4>Thực Chiến Simulation</h4>
              <p>Tích hợp bài tập Map 1 (FOMO Arena) & Map 2 (Macro) rèn luyện tâm lý.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="broker-catalog-section">
        {/* Filter Controls Bar */}
        <div className="catalog-controls-bar">
          <div className="catalog-tab-switch">
            <button
              type="button"
              className={`catalog-tab-btn ${activeTab === "rooms" ? "active" : ""}`}
              onClick={() => setActiveTab("rooms")}
            >
              Phòng Đầu Tư Độc Quyền ({filteredRooms.length})
            </button>
            <button
              type="button"
              className={`catalog-tab-btn ${activeTab === "brokers" ? "active" : ""}`}
              onClick={() => setActiveTab("brokers")}
            >
              Hồ Sơ Tín Nhiệm Chuyên Gia ({filteredBrokers.length})
            </button>
          </div>

          <div className="catalog-filters-group">
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm tên chuyên gia, phòng, CCHN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={selectedFirm}
              onChange={(e) => setSelectedFirm(e.target.value)}
              aria-label="Lọc theo công ty chứng khoán"
            >
              <option value="ALL">Tất Cả CTCK</option>
              <option value="SSI">SSI</option>
              <option value="VPS">VPS</option>
              <option value="TCBS">TCBS</option>
              <option value="VNDIRECT">VNDIRECT</option>
              <option value="HSC">HSC</option>
            </select>

            <select
              className="filter-select"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              aria-label="Lọc theo trường phái đầu tư"
            >
              <option value="ALL">Tất Cả Trường Phái</option>
              <option value="Tăng Trưởng">Tăng Trưởng (CANSLIM)</option>
              <option value="Kỹ Thuật">Kỹ Thuật (Price Action)</option>
              <option value="Giá Trị">Giá Trị (Value & Vĩ Mô)</option>
            </select>
          </div>
        </div>

        {/* Content Grids */}
        {isLoading ? (
          <div className="catalog-loading-state text-center">
            <div className="loading-spinner" />
            <p>Đang tải dữ liệu phòng đầu tư xác thực...</p>
          </div>
        ) : activeTab === "rooms" ? (
          filteredRooms.length > 0 ? (
            <div className="rooms-grid">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onEnroll={(r) => setSelectedEnrollRoom(r)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-catalog-state text-center">
              <Users size={40} className="text-muted" style={{ margin: "0 auto 1rem" }} />
              <h3>Chưa tìm thấy phòng phù hợp</h3>
              <p className="text-muted">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.</p>
            </div>
          )
        ) : filteredBrokers.length > 0 ? (
          <div className="brokers-grid">
            {filteredBrokers.map((broker) => (
              <BrokerCard
                key={broker.id}
                broker={broker}
                onViewRooms={() => {
                  setSelectedFirm(broker.firmName.split(" ")[0] || "ALL");
                  setActiveTab("rooms");
                }}
              />
            ))}
          </div>
        ) : (
          <div className="empty-catalog-state text-center">
            <Users size={40} className="text-muted" style={{ margin: "0 auto 1rem" }} />
            <h3>Chưa tìm thấy chuyên gia phù hợp</h3>
            <p className="text-muted">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.</p>
          </div>
        )}
      </section>

      {/* Trust & Compliance Banner */}
      <section className="broker-compliance-footer" id="how-it-works">
        <div className="compliance-card">
          <div className="compliance-header">
            <ShieldCheck size={24} className="text-cyan" />
            <h3>Tiêu Chuẩn Giám Sát Tuân Thủ Của Aura Capital</h3>
          </div>
          <p className="compliance-desc">
            Nhằm dẹp bỏ vấn nạn lùa gà và các hội nhóm phím hàng đầu cơ rác, mọi chuyên gia mở phòng trên Aura Capital đều phải ký cam kết đạo đức nghề nghiệp:
          </p>
          <ul className="compliance-list">
            <li>
              <strong>Không cam kết lợi nhuận 100%:</strong> Hệ thống tích hợp bộ lọc từ khóa tự động quét và kiểm duyệt nội dung theo thời gian thực.
            </li>
            <li>
              <strong>Không huy động vốn ủy thác trái phép:</strong> Phòng học hoạt động theo mô hình chia sẻ tri thức và kịch bản mô phỏng đào tạo, không cầm tiền của học viên.
            </li>
            <li>
              <strong>Đánh giá thực tế (Verified Reviews):</strong> Chỉ học viên đã nộp phí và trải nghiệm phòng học tối thiểu 7 ngày mới có quyền chấm điểm sao và để lại nhận xét.
            </li>
          </ul>
        </div>
      </section>

      {/* Modals */}
      <BrokerRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          setIsRegisterModalOpen(false);
          loadData();
        }}
      />

      <RoomEnrollmentModal
        isOpen={Boolean(selectedEnrollRoom)}
        room={selectedEnrollRoom}
        onClose={() => setSelectedEnrollRoom(null)}
        onSuccess={() => {
          setSelectedEnrollRoom(null);
          loadData();
        }}
      />
    </main>
  );
};
