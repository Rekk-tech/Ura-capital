import React, { useState } from "react";
import { Radio } from "lucide-react";

export const VoiceRoomWidget: React.FC = () => {
  const [joined, setJoined] = useState(false);

  return (
    <div className="voice-room-card">
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          right: "-20px",
          bottom: "-20px",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          pointerEvents: "none",
          background: "radial-gradient(circle, rgba(225, 29, 72, 0.25) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Header Tag */}
      <div className="voice-room-badge">
        <Radio size={12} />
        <span>VOICE ROOM TRỰC TIẾP</span>
      </div>

      {/* Room Title */}
      <h4 className="voice-room-title">
        Đọc vị Dòng Tiền & Cân Bằng Chu Kỳ Q4
      </h4>
      <p className="voice-room-host">
        Host: Trưởng bộ phận Phân Tích
      </p>

      {/* Avatar Stack & Action */}
      <div className="voice-room-footer">
        <div className="voice-avatar-stack">
          <div className="voice-avatar-circle" style={{ background: "#2563EB" }}>
            M
          </div>
          <div className="voice-avatar-circle" style={{ background: "#7C3AED" }}>
            LI
          </div>
          <div className="voice-avatar-circle" style={{ background: "#D97706", color: "#0B1B3A" }}>
            +42
          </div>
        </div>

        <button
          type="button"
          onClick={() => setJoined((prev) => !prev)}
          className="btn-join-voice"
        >
          {joined ? "Đang Nghe" : "Tham Gia"}
        </button>
      </div>
    </div>
  );
};
