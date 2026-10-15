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
    "Xin chào! Tôi là Aura Intelligence — Cố vấn học tập & trợ lý đầu tư của bạn tại Aura Capital. Hãy chọn một chủ đề bên dưới hoặc đặt câu hỏi bất kỳ để bắt đầu!",
  timestamp: new Date(),
  suggestions: [
    "📊 Chỉ số P/E & P/B",
    "📈 Lãi suất & Vĩ mô",
    "🛡️ Kiểm soát FOMO",
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
      } catch {
        // High-fidelity pedagogical fallback for guest/offline visitors on Landing Page
        const lower = trimmed.toLowerCase();
        let fallbackAnswer = "";
        let fallbackSuggestions: string[] = [];

        if (lower.includes("p/e") || lower.includes("pe") || lower.includes("p/b") || lower.includes("dinh gia")) {
          fallbackAnswer =
            "Chỉ số P/E (Price-to-Earnings) phản ánh mức giá bạn sẵn sàng trả cho 1 đồng lợi nhuận của doanh nghiệp. P/E thấp có thể là cơ hội định giá hấp dẫn, nhưng hãy cẩn trọng với 'bẫy giá rẻ' (value trap) khi lợi nhuận doanh nghiệp đang trên đà sụt giảm.\n\n" +
            "Chỉ số P/B (Price-to-Book) so sánh thị giá với giá trị sổ sách, đặc biệt hiệu quả khi phân tích ngành Ngân hàng và Tài chính. Trong triết lý của Benjamin Graham, việc kết hợp P/E < 15 và P/B < 1.5 tạo ra một 'Biên an toàn' vững chắc.\n\n" +
            "💡 Đăng ký tài khoản miễn phí để lưu lịch sử trao đổi và phân tích chuyên sâu cùng Aura Intelligence!";
          fallbackSuggestions = [
            "Làm thế nào để nhận biết bẫy giá rẻ (Value Trap)?",
            "Cách định giá cổ phiếu ngân hàng qua chỉ số P/B",
            "Khái niệm Biên an toàn (Margin of Safety) của Benjamin Graham",
          ];
        } else if (lower.includes("fomo") || lower.includes("map 1") || lower.includes("bay")) {
          fallbackAnswer =
            "Trong Đấu trường FOMO Arena (Map 1), áp lực thời gian 45 giây và biến động giá chóng mặt thường kích hoạt tâm lý sợ bỏ lỡ cơ hội (FOMO) của nhà đầu tư mới.\n\n" +
            "Chiến thuật sống sót cốt lõi:\n" +
            "1. Tuyệt đối không dùng Margin x5 khi thị trường đang hưng phấn tột độ ở vùng đỉnh.\n" +
            "2. Kỷ luật cắt lỗ nghiêm ngặt: Thoát lệnh khi vị thế vi phạm ngưỡng -7% để bảo toàn 93% vốn.\n" +
            "3. Nhận diện bẫy 'Múa bên trăng' (trắng bên mua): Khi tin xấu xuất hiện và thanh khoản đóng băng, không bắt dao rơi!\n\n" +
            "💡 Đăng ký tài khoản miễn phí để vào sàn đấu Map 1 với 100.000.000 ₫ vốn học tập!";
          fallbackSuggestions = [
            "Làm thế nào để giữ kỷ luật cắt lỗ 7%?",
            "Dấu hiệu phân phối đỉnh của cá mập trong Map 1",
            "Chiến lược quản trị tâm lý khi thị trường rơi tự do",
          ];
        } else if (lower.includes("map 2") || lower.includes("graham") || lower.includes("buffett") || lower.includes("phan bo")) {
          fallbackAnswer =
            "Tại Phòng Đầu Tư Vĩ Mô Pro Room (Map 2), mục tiêu là tối ưu hóa tỷ suất sinh lời điều chỉnh theo rủi ro (Sharpe Ratio) qua 12 quý kinh tế dài hạn.\n\n" +
            "Chiến lược phân bổ giá trị khuyến nghị:\n" +
            "• Cổ phiếu Tăng trưởng ($EQ_GROWTH): 30% - 35% trong giai đoạn lãi suất thấp để đón sóng mở rộng kinh tế.\n" +
            "• Cổ phiếu Giá trị ($EQ_VALUE): 25% - 30% gồm ngân hàng và tiêu dùng có dòng tiền vững mạnh.\n" +
            "• Trái phiếu Chính phủ ($BOND) & Tiền mặt ($CASH): Giữ tối thiểu 35% - 40% để tạo khiên chắn phòng thủ.\n\n" +
            "💡 Đăng ký tài khoản miễn phí để mở khóa phòng đầu tư Pro Room!";
          fallbackSuggestions = [
            "Tại sao nên giữ tỷ trọng tiền mặt khi lãi suất tăng?",
            "Cách tái cân bằng danh mục định kỳ mỗi quý",
            "Quy tắc quản trị vốn hàng đầu của Warren Buffett",
          ];
        } else {
          fallbackAnswer =
            `Chào bạn! Cố vấn Aura Intelligence luôn sẵn sàng đồng hành cùng bạn.\n\n` +
            `Với câu hỏi về "${trimmed}", bạn có thể tiếp cận theo 3 trụ cột của Aura Capital:\n` +
            `1. Nền tảng kiến thức (Aura Academy): Định giá cơ bản (P/E, P/B, ROE).\n` +
            `2. Tâm lý thực chiến (FOMO Arena - Map 1): Kiểm soát cảm xúc và kỷ luật cắt lỗ.\n` +
            `3. Tầm nhìn vĩ mô (Pro Room - Map 2): Phân bổ đa tài sản theo chu kỳ kinh tế.\n\n` +
            `💡 Đăng nhập hoặc tạo tài khoản để trải nghiệm đầy đủ năng lực AI Gateway!`;
          fallbackSuggestions = [
            "Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán",
            "Làm thế nào để tránh bẫy FOMO ở Đấu trường Map 1?",
            "Chiến lược phân bổ tài sản Graham 60/40 ở Map 2",
          ];
        }

        const coachMsgId = `coach-fb-${Date.now()}`;
        const coachMessage: CoachMessage = {
          id: coachMsgId,
          role: "coach",
          content: fallbackAnswer,
          timestamp: new Date(),
          suggestions: fallbackSuggestions,
        };
        setMessages((prev) => [...prev, coachMessage]);
        if (fallbackSuggestions.length > 0) {
          setActiveSuggestions(fallbackSuggestions);
        }
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
