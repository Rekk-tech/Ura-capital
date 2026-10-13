import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Cpu,
  X,
  RotateCcw,
  Send,
  Sparkles,
  ShieldAlert,
  Bot,
  User,
  Maximize2,
  Minimize2,
  Minus,
} from "lucide-react";
import { useAiCoach } from "../hooks/useAiCoach";
import { useAuth } from "../../auth/context/AuthContext";
import { useCurrentSubscriptionQuery } from "../../subscription/hooks/use-subscription";
import { AiCoachMembershipGate } from "./AiCoachMembershipGate";

export interface AiCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: "MAP1" | "MAP2" | "GENERAL";
}

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  isOpen,
  onClose,
  initialContext,
}) => {
  const {
    messages,
    isLoading,
    activeSuggestions,
    ask,
    resetConversation,
  } = useAiCoach(initialContext);

  const { user, accessToken, isAuthenticated } = useAuth();
  const subQueryResult = useCurrentSubscriptionQuery(
    accessToken ?? undefined,
    user?.id ?? undefined,
    isOpen
  );
  const subData = subQueryResult?.data;

  const isAdmin = user?.role === "ADMIN";
  const isPremium =
    subData?.data?.plan === "PREMIUM" && subData?.data?.status === "ACTIVE";
  const hasAccess = isAdmin || isPremium;

  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus trap & Escape key navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      if (hasAccess) {
        inputRef.current?.focus();
      }
    }, 150);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, isExpanded, onClose, hasAccess]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && hasAccess) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, hasAccess]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;

    ask(query);
    setInputValue("");
  };

  const handleChipClick = (suggestionText: string) => {
    if (isLoading) return;
    ask(suggestionText);
  };

  const dialogContent = (
    <div
      className={
        isExpanded
          ? "ai-coach-backdrop-expanded"
          : "ai-coach-docked-container"
      }
      onClick={(e) => {
        if (isExpanded && e.target === e.currentTarget) {
          setIsExpanded(false);
        }
      }}
      role={isExpanded ? "presentation" : undefined}
    >
      <div
        className={`ai-coach-dialog ${
          isExpanded ? "ai-coach-dialog-expanded" : "ai-coach-dialog-docked"
        }`}
        role="dialog"
        aria-modal={isExpanded ? "true" : "false"}
        aria-labelledby="ai-coach-title"
      >
        {/* Header */}
        <div className="ai-coach-header">
          <div className="ai-coach-brand">
            <div className="ai-coach-avatar">
              <Cpu size={22} aria-hidden="true" />
              <span className="ai-coach-online-dot" title="Trực tuyến" />
            </div>
            <div className="ai-coach-title-area">
              <h3 id="ai-coach-title">
                Aura Intelligence
                <span className="ai-coach-badge">
                  {isAdmin
                    ? "ADMIN VIP"
                    : isPremium
                    ? "PREMIUM VIP"
                    : "KHÓA HỘI VIÊN"}
                </span>
              </h3>
              <div className="ai-coach-subtitle">
                Cố vấn Học tập &amp; Trợ lý Đầu tư Thông minh • Trực Tuyến
              </div>
            </div>
          </div>

          <div className="ai-coach-header-actions">
            {hasAccess && (
              <button
                type="button"
                className="ai-coach-icon-btn"
                onClick={resetConversation}
                title="Khởi tạo lại cuộc trò chuyện"
                aria-label="Khởi tạo lại cuộc trò chuyện"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button
              type="button"
              className="ai-coach-icon-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={
                isExpanded
                  ? "Thu nhỏ về góc màn hình (Docked Mode)"
                  : "Mở rộng toàn màn hình (Study Mode)"
              }
              aria-label="Phóng to hoặc thu nhỏ cửa sổ cố vấn"
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              type="button"
              className="ai-coach-icon-btn"
              onClick={onClose}
              title="Thu nhỏ xuống thanh tác vụ"
              aria-label="Thu gọn cửa sổ cố vấn"
            >
              <Minus size={15} />
            </button>
            <button
              type="button"
              className="ai-coach-icon-btn ai-coach-close-btn"
              onClick={onClose}
              title="Đóng cửa sổ cố vấn"
              aria-label="Đóng cửa sổ cố vấn"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Conditional Content: Membership Gate for Free/Guest Users vs Full Co-pilot for VIP */}
        {!hasAccess ? (
          <AiCoachMembershipGate
            isAuthenticated={isAuthenticated}
            userEmail={user?.email}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Message Feed */}
            <div className="ai-coach-body" tabIndex={0} aria-label="Nội dung tư vấn AI">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-message ${
                    msg.role === "user" ? "ai-message-user" : "ai-message-coach"
                  }`}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background:
                        msg.role === "user" ? "#1d6ff2" : "#f1f5f9",
                      color: msg.role === "user" ? "#ffffff" : "#6366f1",
                    }}
                  >
                    {msg.role === "user" ? <User size={15} /> : <Bot size={15} />}
                  </div>

                  <div className="ai-message-bubble">
                    {msg.content.split("\n\n").map((paragraph, idx) => (
                      <p key={idx} style={{ margin: idx === 0 ? 0 : "0.55rem 0 0" }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="ai-message ai-message-coach">
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: "#f1f5f9",
                      color: "#6366f1",
                    }}
                  >
                    <Bot size={15} />
                  </div>
                  <div className="ai-typing-indicator" aria-label="Đang phân tích">
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                    <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "4px" }}>
                      Đang phân tích dữ liệu thị trường...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Quick-chips */}
            {activeSuggestions && activeSuggestions.length > 0 && (
              <div className="ai-suggestions-panel" aria-label="Gợi ý câu hỏi">
                {activeSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="ai-suggestion-chip"
                    onClick={() => handleChipClick(suggestion)}
                    disabled={isLoading}
                  >
                    <Sparkles size={12} className="text-purple" aria-hidden="true" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Footer & Input Form */}
            <div className="ai-coach-footer">
              <form className="ai-input-form" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  className="ai-input-field"
                  placeholder="Đặt câu hỏi về P/E, VN30, bẫy FOMO hoặc chiến lược danh mục..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  maxLength={1000}
                  aria-label="Nhập câu hỏi cho Cố vấn AI"
                />
                <button
                  type="submit"
                  className="ai-send-btn"
                  disabled={isLoading || !inputValue.trim()}
                  aria-label="Gửi câu hỏi"
                >
                  <span>Gửi</span>
                  <Send size={15} aria-hidden="true" />
                </button>
              </form>

              <div className="ai-disclaimer-bar">
                <ShieldAlert size={12} aria-hidden="true" />
                <span>
                  Mọi tư vấn chỉ mang tính chất giáo dục mô phỏng đầu tư, không cấu thành lời khuyên tài chính thực tế.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};
