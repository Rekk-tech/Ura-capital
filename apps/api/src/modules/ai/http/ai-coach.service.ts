import { logger } from "../../../infrastructure/logging/logger.js";
import { classifyIntentDeterministic } from "../intent/index.js";
import { aiGuardrailService, AIGuardrailService } from "./ai-guardrail.service.js";

export interface AICoachRequest {
  query: string;
  topic?: string;
  mapContext?: "MAP1" | "MAP2" | "GENERAL";
}

export interface AICoachResponse {
  answer: string;
  intent: string;
  confidence: number;
  suggestions: string[];
  disclaimer: string;
  source: "gemini" | "deterministic_engine";
}

const MANDATORY_DISCLAIMER =
  "Tất cả phản hồi từ Cố vấn Aura Intelligence chỉ mang tính chất giáo dục mô phỏng đầu tư, không cấu thành lời khuyên đầu tư tài chính thực tế.";

interface KnowledgePattern {
  keywords: string[];
  intent: string;
  answer: string;
  suggestions: string[];
}

const KNOWLEDGE_BASE: KnowledgePattern[] = [
  {
    keywords: ["p/e", "pe", "p/b", "pb", "dinh gia", "dinh-gia", "valuation", "eps", "roe"],
    intent: "CONCEPT_EXPLANATION",
    answer:
      "Chỉ số P/E (Price-to-Earnings) phản ánh số tiền nhà đầu tư sẵn sàng trả cho 1 đồng lợi nhuận của doanh nghiệp. P/E thấp có thể là cơ hội định giá hấp dẫn, nhưng hãy cẩn trọng với 'bẫy giá rẻ' (value trap) khi lợi nhuận doanh nghiệp đang trên đà sụt giảm.\n\n" +
      "Chỉ số P/B (Price-to-Book) so sánh thị giá với giá trị sổ sách, đặc biệt hiệu quả khi phân tích ngành Ngân hàng và Tài chính. Trong triết lý đầu tư giá trị của Benjamin Graham, việc kết hợp P/E < 15 và P/B < 1.5 tạo ra một 'Biên an toàn' (Margin of Safety) bảo vệ vốn trước những biến động khó lường.",
    suggestions: [
      "Làm thế nào để nhận biết bẫy giá rẻ (Value Trap)?",
      "Cách định giá cổ phiếu ngân hàng qua chỉ số P/B",
      "Khái niệm Biên an toàn (Margin of Safety) của Benjamin Graham",
    ],
  },
  {
    keywords: ["fomo", "arena", "map 1", "map1", "bay fomo", "du dinh", "bull trap", "mắt bão", "mua ben trang", "thanh khoan", "cat lo"],
    intent: "TACTICAL_DEBRIEF",
    answer:
      "Trong Đấu trường FOMO Arena (Map 1), áp lực thời gian 45 giây và biến động giá chóng mặt thường kích hoạt tâm lý sợ bỏ lỡ cơ hội (FOMO) của nhà đầu tư mới.\n\n" +
      "Chiến thuật sống sót cốt lõi:\n" +
      "1. Tuyệt đối không dùng Margin x5 khi thị trường đang hưng phấn tột độ ở vùng đỉnh.\n" +
      "2. Kỷ luật cắt lỗ nghiêm ngặt: Kích hoạt thoát lệnh khi vị thế vi phạm ngưỡng -7% để bảo vệ 93% vốn còn lại.\n" +
      "3. Nhận diện bẫy 'Múa bên trăng' (trắng bên mua): Khi tin xấu xuất hiện và thanh khoản đóng băng, việc mua đuổi bắt đáy chỉ khiến tài khoản rơi vào vòng xoáy thanh lý cưỡng bức.",
    suggestions: [
      "Làm thế nào để giữ kỷ luật cắt lỗ 7%?",
      "Dấu hiệu phân phối đỉnh của cá mập trong Map 1",
      "Chiến lược quản trị tâm lý khi thị trường rơi tự do",
    ],
  },
  {
    keywords: ["pro room", "map 2", "map2", "phan bo", "allocation", "graham", "buffett", "tai san", "60/40", "trai phieu", "bond", "cash", "tien mat"],
    intent: "VALUE_INVESTING_ADVISORY",
    answer:
      "Tại Phòng Đầu Tư Vĩ Mô Pro Room (Map 2), mục tiêu là tối ưu hóa tỷ suất sinh lời điều chỉnh theo rủi ro (Sharpe Ratio) qua 12 quý kinh tế dài hạn.\n\n" +
      "Chiến lược phân bổ giá trị khuyến nghị:\n" +
      "• Cổ phiếu Tăng trưởng ($EQ_GROWTH): 30% - 35% trong giai đoạn lãi suất thấp để đón sóng mở rộng kinh tế.\n" +
      "• Cổ phiếu Giá trị ($EQ_VALUE): 25% - 30% gồm ngân hàng và tiêu dùng có dòng tiền vững mạnh.\n" +
      "• Trái phiếu Chính phủ ($BOND) & Tiền mặt ($CASH): Giữ tối thiểu 35% - 40% để tạo khiên chắn phòng thủ. Khi lãi suất đảo chiều tăng, lượng tiền mặt này chính là 'đạn dược' để gom tài sản chiết khấu cao.",
    suggestions: [
      "Tại sao nên giữ tỷ trọng tiền mặt khi lãi suất tăng?",
      "Cách tái cân bằng danh mục định kỳ mỗi quý",
      "Quy tắc quản trị vốn hàng đầu của Warren Buffett",
    ],
  },
  {
    keywords: ["lai suat", "interest rate", "lam phat", "cpi", "gdp", "vi mo", "macro", "vn30", "chu ky"],
    intent: "MACRO_ANALYSIS",
    answer:
      "Lãi suất được xem là 'trọng lực' của mọi định giá tài sản tài chính. Khi Ngân hàng Trung ương tăng lãi suất điều hành để kiểm soát lạm phát (CPI), chi phí vốn của doanh nghiệp tăng cao và định giá P/E của thị trường chịu áp lực co hẹp.\n\n" +
      "Ngược lại, khi GDP tăng trưởng mạnh mẽ và chu kỳ tiền tệ nới lỏng, dòng tiền rẻ sẽ thúc đẩy VN30 thiết lập đỉnh mới. Nhà đầu tư thông minh luôn theo dõi sát diễn biến lạm phát để đi trước chu kỳ lãi suất ít nhất 1-2 quý.",
    suggestions: [
      "Mối quan hệ giữa Lãi suất và Thị trường Chứng khoán",
      "Làm sao để đầu tư an toàn trong thời kỳ lạm phát cao?",
      "Nhận biết 4 giai đoạn của chu kỳ kinh tế vĩ mô",
    ],
  },
  {
    keywords: ["margin", "don bay", "margin call", "force sell", "thanh ly", "rui ro", "quan tri von"],
    intent: "RISK_MANAGEMENT",
    answer:
      "Đòn bẩy Margin là công cụ khuếch đại: nó nhân đôi lợi nhuận khi bạn đúng, nhưng sẽ xóa sạch tài khoản khi bạn sai. Warren Buffett từng cảnh báo: 'Chỉ có 3 thứ khiến một người thông minh phá sản: Ladies, Liquor và Leverage (Đòn bẩy)'.\n\n" +
      "Nguyên tắc vàng: Không bao giờ sử dụng Margin quá 1:1 cho các vị thế chưa có lãi đệm, và luôn duy trì tỷ lệ ký quỹ an toàn trên 150% để tránh nguy cơ Force Sell ngoài ý muốn.",
    suggestions: [
      "Cách tính toán tỷ lệ Margin an toàn",
      "Làm gì khi nhận được thông báo Margin Call?",
      "Xây dựng hệ thống quản trị rủi ro cá nhân",
    ],
  },
];

export class AICoachService {
  constructor(
    private readonly guardrailService: AIGuardrailService = aiGuardrailService,
  ) {}

  /**
   * Process learner query and generate educational coaching response
   */
  async consult(request: AICoachRequest): Promise<AICoachResponse> {
    const trimmedQuery = request.query?.trim() || "";

    // 1. Model-Based & Adversarial Guardrails Evaluation
    const guardrailResult = await this.guardrailService.evaluate(trimmedQuery);
    if (!guardrailResult.isAllowed) {
      return {
        answer:
          guardrailResult.educationalRefusal ||
          "Hệ thống an toàn của Aura Intelligence ghi nhận yêu cầu không phù hợp với mục tiêu giáo dục đầu tư tài chính.",
        intent: "UNSUPPORTED_OR_REFUSED",
        confidence: 1.0,
        suggestions: [
          "Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán",
          "Chiến lược phòng ngừa bẫy FOMO ở Đấu trường Map 1",
          "Phân bổ danh mục 60/40 theo Benjamin Graham ở Pro Room",
        ],
        disclaimer: MANDATORY_DISCLAIMER,
        source: "deterministic_engine",
      };
    }

    // 2. Classify intent via deterministic intent classifier
    const intentResult = classifyIntentDeterministic(trimmedQuery);

    // 3. Check for external Gemini availability if API key is present
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.length > 10 && process.env.NODE_ENV !== "test") {
      try {
        const geminiResponse = await this.callGeminiAPI(trimmedQuery, request.mapContext, geminiKey);
        if (geminiResponse) {
          return {
            answer: geminiResponse,
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            suggestions: this.getSuggestionsForContext(request.mapContext),
            disclaimer: MANDATORY_DISCLAIMER,
            source: "gemini",
          };
        }
      } catch (err: unknown) {
        logger.warn("Aura AI Gemini API call failed, falling back to deterministic knowledge engine", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 4. Deterministic Knowledge Engine matching
    const lower = trimmedQuery.toLowerCase();
    for (const item of KNOWLEDGE_BASE) {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        return {
          answer: item.answer,
          intent: item.intent,
          confidence: 0.95,
          suggestions: request.mapContext
            ? this.getSuggestionsForContext(request.mapContext)
            : item.suggestions,
          disclaimer: MANDATORY_DISCLAIMER,
          source: "deterministic_engine",
        };
      }
    }

    // 5. Default high-fidelity educational response
    return {
      answer:
        `Chào bạn! Cố vấn Aura Intelligence luôn sẵn sàng đồng hành cùng bạn trên hành trình chinh phục thị trường tài chính.\n\n` +
        `Với câu hỏi về "${trimmedQuery}", bạn có thể tiếp cận theo 3 trụ cột cốt lõi của Aura Capital:\n` +
        `1. **Nền tảng kiến thức (Aura Academy)**: Hiểu rõ bản chất doanh nghiệp và các chỉ số định giá cơ bản (P/E, P/B, ROE).\n` +
        `2. **Tâm lý thực chiến (FOMO Arena - Map 1)**: Kiểm soát cảm xúc, tránh bẫy đu đỉnh và giữ vững kỷ luật cắt lỗ.\n` +
        `3. **Tầm nhìn vĩ mô (Pro Room - Map 2)**: Phân bổ đa tài sản linh hoạt theo chu kỳ lãi suất và lạm phát dài hạn.\n\n` +
        `Bạn muốn tìm hiểu sâu hơn về khía cạnh nào dưới đây?`,
      intent: intentResult.intent || "GENERAL_FINANCIAL_INQUIRY",
      confidence: 0.85,
      suggestions: this.getSuggestionsForContext(request.mapContext),
      disclaimer: MANDATORY_DISCLAIMER,
      source: "deterministic_engine",
    };
  }

  private getSuggestionsForContext(mapContext?: "MAP1" | "MAP2" | "GENERAL"): string[] {
    if (mapContext === "MAP1") {
      return [
        "Cách kiềm chế tâm lý FOMO khi cổ phiếu tăng trần?",
        "Nguyên tắc cắt lỗ 7% bảo vệ vốn ra sao?",
        "Cách xử lý khi thị trường mất thanh khoản (Múa bên trăng)",
      ];
    }
    if (mapContext === "MAP2") {
      return [
        "Chiến lược phân bổ 60/40 giữa Cổ phiếu và Trái phiếu",
        "Tác động của Lãi suất và Lạm phát tới VN30",
        "Khái niệm Biên an toàn (Margin of Safety) của Graham",
      ];
    }
    return [
      "Giải thích chỉ số P/E & P/B trong đầu tư chứng khoán",
      "Cách nhận biết và phòng tránh bẫy tâm lý FOMO",
      "Chiến lược phân bổ danh mục đầu tư giá trị dài hạn",
    ];
  }

  private async callGeminiAPI(
    prompt: string,
    mapContext?: string,
    apiKey?: string,
  ): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemPrompt =
      "Bạn là Cố vấn Aura Intelligence (AI Learning Coach) của nền tảng EdTech & Game tài chính Aura Capital. " +
      "Phong cách trả lời: Chuẩn mực tài chính, ngắn gọn, súc tích (dưới 150 từ), sư phạm, tích cực, nhấn mạnh kỷ luật và quản trị rủi ro. " +
      "Ngữ cảnh hiện tại: " + (mapContext || "Đầu tư tài chính tổng quan") + ". " +
      "Tuyệt đối không khuyến nghị mua bán mã chứng khoán cụ thể ngoài đời thực. Mọi ví dụ chỉ nhằm mục đích giáo dục mô phỏng.";

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt}\n\nCâu hỏi của học viên: ${prompt}` },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 350,
        temperature: 0.4,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  }
}

export const aiCoachService = new AICoachService();
