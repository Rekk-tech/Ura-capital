import { useState, useCallback } from "react";
import { askAiCoach, AICoachResponse } from "../../../api/ai.api";
import { useAuth } from "../../auth/context/AuthContext";

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  intent?: string;
}

const INITIAL_GREETING: CoachMessage = {
  id: "greeting",
  role: "coach",
  content:
    "Xin chào! Tôi là Aura Intelligence — Cố vấn Học tập & Trợ lý Đầu tư Thông minh của bạn tại Aura Capital.\n\n" +
    "Tôi có thể hỗ trợ bạn giải thích các chỉ số tài chính (P/E, P/B, ROE), phân tích biến động vĩ mô (Lãi suất, Lạm phát, VN30), hoặc tư vấn kỷ luật kiểm soát tâm lý tránh bẫy FOMO.\n\n" +
    "Hãy chọn một chủ đề gợi ý bên dưới hoặc đặt câu hỏi bất kỳ!",
  timestamp: new Date(),
  suggestions: [
    "Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán",
    "Làm thế nào để tránh bẫy FOMO ở Đấu trường Map 1?",
    "Chiến lược phân bổ tài sản Graham 60/40 ở Map 2",
    "Tác động của Lãi suất và Lạm phát tới chỉ số VN30",
  ],
};

export function useAiCoach(defaultContext?: "MAP1" | "MAP2" | "GENERAL") {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([INITIAL_GREETING]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>(
    INITIAL_GREETING.suggestions || [],
  );

  const ask = useCallback(
    async (queryText: string, contextOverride?: "MAP1" | "MAP2" | "GENERAL") => {
      const trimmed = queryText.trim();
      if (!trimmed || isLoading) return;

      const userMsgId = `user-${Date.now()}`;
      const userMessage: CoachMessage = {
        id: userMsgId,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response: AICoachResponse = await askAiCoach(
          {
            query: trimmed,
            mapContext: contextOverride || defaultContext || "GENERAL",
          },
          accessToken,
        );

        const coachMsgId = `coach-${Date.now()}`;
        const coachMessage: CoachMessage = {
          id: coachMsgId,
          role: "coach",
          content: response.answer,
          timestamp: new Date(),
          suggestions: response.suggestions,
          intent: response.intent,
        };

        setMessages((prev) => [...prev, coachMessage]);
        if (response.suggestions && response.suggestions.length > 0) {
          setActiveSuggestions(response.suggestions);
        }
      } catch (err: unknown) {
        const fallbackText =
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi kết nối với Cố vấn AI. Vui lòng thử lại sau.";
        setError(fallbackText);

        const errorMsgId = `coach-err-${Date.now()}`;
        const errorMessage: CoachMessage = {
          id: errorMsgId,
          role: "coach",
          content: `⚠️ ${fallbackText}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, defaultContext, isLoading],
  );

  const resetConversation = useCallback(() => {
    setMessages([
      {
        ...INITIAL_GREETING,
        timestamp: new Date(),
      },
    ]);
    setActiveSuggestions(INITIAL_GREETING.suggestions || []);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    activeSuggestions,
    ask,
    resetConversation,
  };
}
