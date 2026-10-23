import React from "react";
import { Link } from "react-router-dom";
import { Users, ShieldCheck, Gamepad2, ArrowRight, CheckCircle2 } from "lucide-react";
import { BrokerRoomDto } from "@aura/shared";

interface RoomCardProps {
  room: BrokerRoomDto;
  onEnroll?: (room: BrokerRoomDto) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onEnroll }) => {
  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
  };

  const coverUrl =
    room.coverImageUrl ||
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80";
  const brokerDisplayName = (room.brokerName || "Chuyên Gia").replace(/^V+u\s+/i, "Vũ ");

  return (
    <div className="exclusive-room-card" data-testid={`room-card-${room.id}`}>
      <div className="room-cover-wrap">
        <img src={coverUrl} alt={room.title} className="room-cover-img" />
        <div className="room-badge-overlay">
          {room.simulationScenarioKey === "MAP1_FOMO" && (
            <span className="simulation-tag tag-fomo">
              <Gamepad2 size={12} /> Map 1: FOMO Arena
            </span>
          )}
          {room.simulationScenarioKey === "MAP2_MACRO" && (
            <span className="simulation-tag tag-macro">
              <Gamepad2 size={12} /> Map 2: Pro Room
            </span>
          )}
        </div>
      </div>

      <div className="room-body">
        <div className="room-broker-row">
          <div className="room-broker-info">
            <span className="room-broker-name">{brokerDisplayName}</span>
            <span className="room-broker-firm">
              <ShieldCheck size={12} className="text-cyan" /> {room.brokerFirm}
            </span>
          </div>
          <span className="room-members-count">
            <Users size={12} /> {room.memberCount} học viên
          </span>
        </div>

        <h3 className="room-title">
          <Link to={`/broker-hub/rooms/${room.id}`}>{room.title}</Link>
        </h3>

        <p className="room-desc">{room.description}</p>

        <div className="room-footer">
          <div className="room-pricing-box">
            <span className="room-fee-label">Phí gia nhập 1 lần:</span>
            <div className="room-fee-amount">
              {formatVnd(room.entranceFeeVnd)}
              <span className="room-fee-sub"> / vĩnh viễn</span>
            </div>
          </div>

          <div className="room-cta-box">
            {room.isEnrolled ? (
              <Link to={`/broker-hub/rooms/${room.id}`} className="btn btn-sm btn-outline-emerald">
                <CheckCircle2 size={14} style={{ marginRight: "4px" }} /> Đã Tham Gia
              </Link>
            ) : onEnroll ? (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => onEnroll(room)}
              >
                Tham Gia Ngay <ArrowRight size={13} style={{ marginLeft: "4px" }} />
              </button>
            ) : (
              <Link to={`/broker-hub/rooms/${room.id}`} className="btn btn-sm btn-primary">
                Xem & Tham Gia <ArrowRight size={13} style={{ marginLeft: "4px" }} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
