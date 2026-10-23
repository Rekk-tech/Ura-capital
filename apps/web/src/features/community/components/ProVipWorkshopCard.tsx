import React, { useState } from "react";
import { Sparkles, Calendar, CheckCircle } from "lucide-react";

export const ProVipWorkshopCard: React.FC = () => {
  const [registered, setRegistered] = useState(false);

  return (
    <div className="pro-vip-workshop-card">
      <div>
        <span className="pro-vip-tag">
          <Sparkles size={11} style={{ color: "#D97706" }} />
          HỘI THẢO PRO VIP
        </span>
      </div>

      <h4 className="pro-vip-title">
        Chiến Thuật Chu Kỳ Tín Dụng 2026-2027
      </h4>
      <p className="pro-vip-sub">
        <Calendar size={12} style={{ color: "#D97706", flexShrink: 0 }} />
        <span>Trực tiếp Thứ Năm tuần này cùng Chuyên gia Vĩ mô</span>
      </p>

      <button
        type="button"
        onClick={() => setRegistered(true)}
        className="btn-pro-vip-cta"
        style={{
          background: registered ? "#059669" : undefined,
        }}
      >
        {registered ? (
          <>
            <CheckCircle size={14} />
            <span>Đã Giữ Chỗ Thành Công</span>
          </>
        ) : (
          <span>Đăng Ký Giữ Chỗ Ngay</span>
        )}
      </button>
    </div>
  );
};
