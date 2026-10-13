import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  Send,
  RotateCcw,
  Zap,
  BrainCircuit,
  Bot,
  User,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../auth/context/AuthContext";
import { useCurrentSubscriptionQuery } from "../../subscription/hooks/use-subscription";
import { useAiCoach } from "../hooks/useAiCoach";
import { AiCoachMembershipGate } from "../components/AiCoachMembershipGate";

interface PresetCategory {
  title: string;
  icon: React.ReactNode;
  prompts: string[];
}

const PRESET_CATEGORIES: PresetCategory[] = [
  {
    title: "Định Giá & Báo Cáo Tài Chính",
    icon: <DollarSign size={16} className="text-emerald-500" />,
    prompts: [
      "Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán",
      "Mô hình chiết khấu dòng tiền DCF hoạt động như thế nào?",
      "Cách phân tích biên lợi nhuận gộp và ROE của doanh nghiệp",
    ],
  },
  {
    title: "Đấu Trường FOMO (Map 1)",
    icon: <Zap size={16} className="text-amber-500" />,
    prompts: [
      "Làm thế nào để tránh bẫy FOMO ở Đấu trường Map 1?",
      "Chiến lược nhận diện phiên phân phối đỉnh của tay to",
      "Kỷ luật cắt lỗ 7% để bảo toàn vốn trước khi cháy tài khoản",
    ],
  },
  {
    title: "Chiến Lược Vĩ Mô Pro Room (Map 2)",
    icon: <Compass size={16} className="text-blue-500" />,
    prompts: [
      "Chiến lược phân bổ tài sản Graham 60/40 ở Map 2",
      "Cách Warren Buffett chọn cổ phiếu có hào kinh tế rộng",
      "Tác động của Lãi suất và Lạm phát tới chỉ số VN30",
    ],
  },
  {
    title: "Tâm Lý & Quản Trị Rủi Ro",
    icon: <ShieldCheck size={16} className="text-indigo-500" />,
    prompts: [
      "Cách vượt qua nỗi sợ hãi khi danh mục sụt giảm 15%",
      "Quy tắc phân bổ tỷ trọng lệnh tối đa 10% NAV",
      "Sự khác biệt giữa đầu cơ cảm xúc và đầu tư có hệ thống",
    ],
  },
];

export const AiStudioPage: React.FC = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const subQueryResult = useCurrentSubscriptionQuery(
    accessToken ?? undefined,
    user?.id ?? undefined,
    Boolean(accessToken)
  );
  const subData = subQueryResult?.data;

  const isAdmin = user?.role === "ADMIN";
  const isPremium =
    (subData?.data?.plan === "PREMIUM" || subData?.data?.planKey === "PREMIUM") &&
    subData?.data?.status === "ACTIVE";
  const hasAccess = isAdmin || isPremium;

  const {
    messages,
    isLoading,
    activeSuggestions,
    ask,
    resetConversation,
  } = useAiCoach("GENERAL");

  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isAdmin && subQueryResult.isLoading) {
    return (
      <main className="ai-studio-page container" id="main-content" style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <Sparkles size={32} className="spin-animation text-primary" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Đang xác thực quyền truy cập Aura Intelligence...</h2>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    const query = inputQuery.trim();
    setInputQuery("");
    ask(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    if (isLoading) return;
    ask(prompt);
  };

  return (
    <main className="ai-studio-page container" id="main-content" style={{ padding: "2rem 1rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* 1. Header Banner with Model-Based Guardrail Status */}
      <header className="ai-studio-header" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <span className="badge badge-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <Sparkles size={13} />
                <span>AURA INTELLIGENCE STUDIO</span>
              </span>
              <span
                data-testid="guardrail-status-badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "999px",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                <ShieldCheck size={13} />
                <span>AI Guardrail Engine: ACTIVE</span>
              </span>
            </div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, margin: "0 0 0.35rem" }}>
              Aura Intelligence AI Studio
            </h1>
            <p className="text-muted" style={{ margin: 0, fontSize: "0.95rem" }}>
              Không gian phân tích tài chính chuyên sâu, cố vấn chiến lược mô phỏng và giải đáp thắc mắc đầu tư 24/7.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                padding: "0.5rem 0.85rem",
                borderRadius: "10px",
                background: "var(--color-bg-secondary, rgba(255, 255, 255, 0.05))",
                border: "1px solid var(--color-border, #e2e8f0)",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Clock size={14} className="text-muted" />
              <span>Hạn mức: <strong>{hasAccess ? "50 req/phút" : "0 req/phút"}</strong></span>
            </div>
            {hasAccess && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={resetConversation}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                title="Làm mới cuộc trò chuyện"
              >
                <RotateCcw size={14} />
                <span>Làm mới</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Studio Content Area */}
      {!hasAccess ? (
        /* Gating View for Free / Guest Users */
        <div style={{ maxWidth: "800px", margin: "2rem auto" }}>
          <AiCoachMembershipGate
            isAuthenticated={isAuthenticated}
            userEmail={user?.email}
          />
        </div>
      ) : (
        /* VIP & Admin Studio Console */
        <div
          className="ai-studio-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Left Panel: Financial Presets & Tactics */}
          <aside
            className="ai-studio-sidebar card"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div>
              <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BrainCircuit size={18} className="text-primary" />
                <span>Chủ Đề Phân Tích Mẫu</span>
              </h2>
              <p className="text-muted" style={{ fontSize: "0.8rem", margin: 0 }}>
                Chọn chủ đề mẫu để AI Coach hỗ trợ tức thì theo chuẩn phân tích tài chính.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {PRESET_CATEGORIES.map((cat, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                    {cat.icon}
                    <span>{cat.title}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {cat.prompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSelectPrompt(p)}
                        disabled={isLoading}
                        style={{
                          textAlign: "left",
                          fontSize: "0.78rem",
                          padding: "0.45rem 0.65rem",
                          borderRadius: "8px",
                          background: "var(--color-bg-secondary, rgba(255, 255, 255, 0.03))",
                          border: "1px solid var(--color-border, #e2e8f0)",
                          color: "var(--color-text, #334155)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-primary, #3b82f6)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-border, #e2e8f0)";
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Panel: Interactive Conversational Stream */}
          <section
            className="ai-studio-chat card"
            style={{
              padding: "0",
              display: "flex",
              flexDirection: "column",
              height: "720px",
              overflow: "hidden",
            }}
          >
            {/* Guardrail Security Banner */}
            <div
              style={{
                padding: "0.6rem 1.25rem",
                background: "rgba(37, 99, 235, 0.05)",
                borderBottom: "1px solid var(--color-border, #e2e8f0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.78rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Mọi câu hỏi được kiểm duyệt bởi <strong>Model-Based Safety Guardrails</strong></span>
              </div>
              <span className="text-muted">Bộ lọc: Tài chính • Đầu tư • Đấu trường</span>
            </div>

            {/* Messages Scroll Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                    maxWidth: msg.role === "user" ? "80%" : "90%",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.role === "coach" && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={18} />
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div
                      style={{
                        padding: "0.85rem 1.1rem",
                        borderRadius: "14px",
                        background:
                          msg.role === "user"
                            ? "linear-gradient(135deg, #1d6ff2, #2563eb)"
                            : "var(--color-bg-secondary, #f8fafc)",
                        color: msg.role === "user" ? "#ffffff" : "var(--color-text, #1e293b)",
                        border:
                          msg.role === "user"
                            ? "none"
                            : "1px solid var(--color-border, #e2e8f0)",
                        lineHeight: 1.6,
                        fontSize: "0.92rem",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>

                    {msg.role === "coach" && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.72rem",
                          color: "var(--text-muted, #94a3b8)",
                        }}
                      >
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span>Đã kiểm duyệt an toàn nội dung</span>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "#334155",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <User size={18} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                    alignSelf: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={18} />
                  </div>
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "14px",
                      background: "var(--color-bg-secondary, #f8fafc)",
                      border: "1px solid var(--color-border, #e2e8f0)",
                      fontSize: "0.85rem",
                      color: "var(--text-muted, #64748b)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Sparkles size={16} className="spin-animation text-primary" />
                    <span>Aura Intelligence đang phân tích dữ liệu &amp; đối soát an toàn...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            {activeSuggestions.length > 0 && !isLoading && (
              <div
                style={{
                  padding: "0.5rem 1.25rem",
                  background: "var(--color-bg-secondary, rgba(255, 255, 255, 0.02))",
                  borderTop: "1px solid var(--color-border, #e2e8f0)",
                  display: "flex",
                  gap: "0.5rem",
                  overflowX: "auto",
                }}
              >
                {activeSuggestions.slice(0, 3).map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectPrompt(sug)}
                    style={{
                      whiteSpace: "nowrap",
                      fontSize: "0.75rem",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "999px",
                      background: "rgba(37, 99, 235, 0.08)",
                      border: "1px solid rgba(37, 99, 235, 0.2)",
                      color: "var(--color-primary, #2563eb)",
                      cursor: "pointer",
                    }}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form Bar */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: "1rem 1.25rem",
                borderTop: "1px solid var(--color-border, #e2e8f0)",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-end",
                background: "var(--color-bg, #ffffff)",
              }}
            >
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi tài chính, định giá, hoặc chiến thuật thi đấu... (Enter để gửi, Shift+Enter xuống dòng)"
                rows={2}
                disabled={isLoading}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border, #cbd5e1)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="btn btn-primary"
                style={{
                  height: "46px",
                  padding: "0 1.25rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Send size={16} />
                <span>Gửi</span>
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};
