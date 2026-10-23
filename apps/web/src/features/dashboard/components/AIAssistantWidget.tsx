import React, { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export const AIAssistantWidget: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([
    {
      role: "assistant",
      text: "Chào Tuấn! Danh mục giả lập của bạn đang có tỷ trọng tiền mặt an toàn (66%). Hãy duy trì kỷ luật cắt lỗ ở mức -5% cho mỗi vị thế mở.",
    },
  ]);

  const quickPrompts = [
    "Đánh giá rủi ro danh mục hôm nay",
    "Gợi ý chiến lược cắt lỗ kỷ luật HPG",
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      {
        role: "assistant",
        text: text.includes("HPG")
          ? "Với HPG (giá mua 28.500, lãi +6.49%), bạn có thể nâng mức chặn lãi trailing stop lên 29.800 để bảo toàn lợi nhuận nếu thị trường điều chỉnh."
          : "Hệ thống ghi nhận tỷ lệ Sharpe danh mục hiện tại là 1.82. Bạn đang kiểm soát rủi ro rất tốt trong chu kỳ biến động hiện tại.",
      },
    ]);
    setInputMessage("");
  };

  return (
    <div className="overview-ai-card">
      <div>
        {/* Header */}
        <div className="ai-card-header">
          <div className="ai-header-left">
            <div className="ai-sparkle-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="ai-header-title">
                <span>Trợ Lý AI Aura</span>
                <span className="ai-live-dot" />
              </div>
              <p className="ai-header-sub">Cố vấn 24/7 &amp; Quản trị rủi ro</p>
            </div>
          </div>
          <span className="ai-credit-pill">
            Credit: Tin AI
          </span>
        </div>

        {/* AI Dialog Bubble */}
        <div className="ai-speech-bubble">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: idx < messages.length - 1 ? "8px" : "0",
                color: msg.role === "assistant" ? "#E2E8F0" : "#93C5FD",
                textAlign: msg.role === "assistant" ? "left" : "right",
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Quick Reflex Prompts */}
        <div style={{ marginTop: "12px" }}>
          <p className="ai-prompts-title">
            Gợi ý câu hỏi phản xạ nhanh:
          </p>
          <div>
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-prompt-btn"
                onClick={() => handleSend(prompt)}
              >
                <span>{prompt}</span>
                <ArrowRight size={12} style={{ color: "#64748B", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="ai-chat-input-wrap"
      >
        <input
          type="text"
          className="ai-chat-input"
          placeholder="Hỏi AI về chiến lược hoặc bài học..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button
          type="submit"
          className="ai-chat-send-btn"
          aria-label="Gửi tin nhắn cho AI"
        >
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
};
