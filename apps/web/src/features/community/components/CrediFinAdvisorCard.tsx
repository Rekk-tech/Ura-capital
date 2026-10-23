import React from "react";
import { Sparkles, MessageCircle } from "lucide-react";
import { AURA_OPEN_AI_COACH_EVENT } from "../../ai/events";

export const CrediFinAdvisorCard: React.FC = () => {
  const handleOpenAiCoach = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(AURA_OPEN_AI_COACH_EVENT, {
          detail: { context: "INVESTMENT" },
        })
      );
    }
  };

  return (
    <div className="credifin-advisor-card">
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          pointerEvents: "none",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Header Tag */}
      <div className="credifin-card-tag">
        <Sparkles size={14} />
        <span>CREDIFIN AI ADVISOR</span>
      </div>

      {/* Prompt Text */}
      <p className="credifin-card-text">
        Cần đánh giá nhanh cấu trúc rủi ro danh mục hoặc phân tích tín hiệu cổ phiếu?
      </p>

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleOpenAiCoach}
        className="btn-credifin-chat"
      >
        <MessageCircle size={15} style={{ color: "#1D6FF2" }} />
        <span>Chat với AI Cố Vấn 24/7</span>
      </button>
    </div>
  );
};
