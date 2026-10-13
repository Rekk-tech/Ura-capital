import React from "react";
import { createPortal } from "react-dom";
import { Cpu, Sparkles } from "lucide-react";

export interface AiCoachFabProps {
  onClick: () => void;
  badgeText?: string;
}

export const AiCoachFab: React.FC<AiCoachFabProps> = ({
  onClick,
  badgeText = "Trợ Lý AI",
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <button
      type="button"
      className="ai-coach-fab"
      onClick={onClick}
      aria-label="Mở Cố vấn Trợ lý AI Aura Intelligence"
      title="Mở Cố vấn Trợ lý AI Aura Intelligence (Hỏi đáp & Hỗ trợ đầu tư)"
      id="ai-coach-fab-trigger"
    >
      <div className="ai-coach-fab-glow" aria-hidden="true" />
      <div className="ai-coach-fab-avatar">
        <Cpu size={22} aria-hidden="true" />
        <span className="ai-coach-fab-online-dot" />
      </div>
      <div className="ai-coach-fab-content">
        <div className="ai-coach-fab-title">
          <span>{badgeText}</span>
          <Sparkles size={13} className="ai-coach-fab-sparkle" aria-hidden="true" />
        </div>
        <div className="ai-coach-fab-status">Cố vấn 24/7</div>
      </div>
    </button>,
    document.body
  );
};
