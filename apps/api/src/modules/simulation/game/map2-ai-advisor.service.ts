import type { AIGatewayConfig } from "../../ai/core/ai-gateway.config.js";

export interface AIAdvisorQuarterInput {
  quarterNumber: number;
  interestRate: number;
  inflation: number;
  gdpGrowth: number;
  allocGrowth: number;
  allocValue: number;
  allocBond: number;
  allocCash: number;
  pnlPercent: number;
  currentNav: number;
  quarterEventDescription: string;
}

export class Map2AIAdvisorService {
  /**
   * Generate value-investing quarterly advisor note (< 80 words)
   * Follows Benjamin Graham & Warren Buffett principles from AURA_MAP1_MAP2_GAME_SPEC §2.8
   */
  async generateQuarterlyDebrief(input: AIAdvisorQuarterInput): Promise<string> {
    try {
      // If AI Gateway or GEMINI_API_KEY is available in environment, we call it
      if (process.env.GEMINI_API_KEY && process.env.NODE_ENV !== "test") {
        const dynamicNote = await this.tryCallAIGateway(input);
        if (dynamicNote) return dynamicNote;
      }
    } catch {
      // Graceful fallback to deterministic value-investing rule engine
    }

    return this.generateDeterministicValueAdvice(input);
  }

  /**
   * High-fidelity rule-based value investing advisor engine (Graham & Buffett philosophy)
   * Enforces < 80 words, causal macro explanations, positive reinforcement, and risk warning.
   */
  generateDeterministicValueAdvice(input: AIAdvisorQuarterInput): string {
    const {
      quarterNumber,
      interestRate,
      allocGrowth,
      allocValue,
      allocBond,
      allocCash,
      pnlPercent,
    } = input;
    void interestRate;

    const defensiveWeight = allocValue + allocBond + allocCash;
    const isPnlPositive = pnlPercent >= 0;

    // Phase 1: Boom (Q1-Q3, Low rate 5%)
    if (quarterNumber <= 3) {
      if (allocGrowth > 50) {
        return `Quý ${quarterNumber} vĩ mô thuận lợi, bạn tận dụng tốt đà tăng trưởng của nhóm cổ phiếu tăng trưởng (+${pnlPercent}%). Tuy nhiên, hãy nhớ nguyên tắc biên an toàn của Graham: đừng quên dự phòng tiền mặt và trái phiếu trước khi chu kỳ đảo chiều.`;
      }
      return `Quyết định phân bổ thận trọng giúp danh mục đạt biến động ổn định ${pnlPercent}%. Mặc dù tốc độ sinh lời thấp hơn thị trường bùng nổ, bạn đang giữ kỷ luật phòng thủ vững chắc để đối phó rủi ro lãi suất tương lai.`;
    }

    // Phase 2: Stagflation (Q4-Q6, High rate 8.5%, Inflation 6%)
    if (quarterNumber <= 6) {
      if (allocGrowth > 40) {
        return `Lãi suất 8.5% làm chi phí vốn tăng vọt, gây áp lực chiết khấu lớn lên cổ phiếu tăng trưởng (${pnlPercent}%). Điểm tích cực là bạn đang trải nghiệm chu kỳ thật; hãy chủ động tái cơ cấu sang nhóm giá trị có dòng tiền và cổ tức thực.`;
      }
      return `Rất xuất sắc! Tỷ trọng phòng thủ ${defensiveWeight}% đã bảo vệ danh mục kiên cường trước làn sóng siết tiền tệ. Giữ vững tiền mặt lúc này chính là 'đạn dược' để mua tài sản giá rẻ ở pha suy thoái kế tiếp.`;
    }

    // Phase 3: Recession & Bottom (Q7-Q9, Rate 7.0%, GDP 3%)
    if (quarterNumber <= 9) {
      if (allocCash >= 25 && isPnlPositive) {
        return `Kinh tế tạo đáy là thời điểm vàng của nhà đầu tư giá trị. Bạn đã bảo toàn được vốn và có dư địa giải ngân dần vào doanh nghiệp tốt dưới giá trị thực. Hãy kiên nhẫn tích sản, không cần vội vã dự đoán chính xác đáy.`;
      }
      return `Thị trường suy thoái thử thách tâm lý với biến động ${pnlPercent}%. Theo Warren Buffett, thị trường chuyển tiền từ kẻ thiếu kiên nhẫn sang người kỷ luật. Giữ vững niềm tin vào bảng cân đối tài chính lành mạnh của doanh nghiệp bạn nắm giữ.`;
    }

    // Phase 4: Recovery (Q10-Q12, Rate 6.0%, GDP 6%)
    if (allocGrowth >= 30) {
      return `Kinh tế phục hồi xác nhận thành quả tái thiết danh mục (${pnlPercent}%). Điểm tích cực là bạn đã đồng hành trọn vẹn chu kỳ; lưu ý tái cân bằng định kỳ để tránh lòng tham cuốn trôi lợi nhuận đã tích lũy.`;
    }

    return `Danh mục hoàn thành quý ${quarterNumber} với mức biến động ${pnlPercent}%. Bạn đã thực thi kỷ luật quản trị vốn gương mẫu, kiên định bảo toàn tài sản vượt qua toàn bộ biến động vĩ mô khốc liệt.`;
  }

  private async tryCallAIGateway(input: AIAdvisorQuarterInput): Promise<string | null> {
    try {
      const { AIGatewayService } = await import("../../ai/core/ai-gateway.service.js");
      const { GeminiAdapter } = await import("../../ai/infrastructure/gemini/gemini.adapter.js");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        return null;
      }

      const config: AIGatewayConfig = {
        enabled: true,
        provider: "gemini",
        modelId: process.env.GEMINI_MODEL_ID ?? "gemini-2.5-flash",
        apiVersion: process.env.GEMINI_API_VERSION ?? "v1beta",
        maxInputTokens: 2048,
        maxOutputTokens: 512,
        timeoutMs: 10000,
        apiKey,
      };

      const adapter = new GeminiAdapter({ config });
      const gateway = new AIGatewayService({ provider: adapter, config });

      const prompt = `DỮ LIỆU ĐẦU VÀO CỦA QUÝ ${input.quarterNumber}:
- Vĩ mô: Lãi suất ${input.interestRate}%, Lạm phát ${input.inflation}%, GDP ${input.gdpGrowth}%.
- Phân bổ: Growth ${input.allocGrowth}%, Value ${input.allocValue}%, Bond ${input.allocBond}%, Cash ${input.allocCash}%.
- Hiệu suất quý: NAV biến động ${input.pnlPercent}% (NAV hiện tại: ${input.currentNav.toLocaleString("vi-VN")} VND).
- Sự kiện phát sinh: ${input.quarterEventDescription}.

NHIỆM VỤ: Nhận xét ngắn gọn (<80 từ) về hành động phân bổ trong bối cảnh vĩ mô quý này theo phong cách Benjamin Graham & Warren Buffett, chỉ ra 1 điểm tích cực và 1 điểm rủi ro cần lưu ý cho quý tới.`;

      const result = await gateway.generate({
        messages: [
          {
            role: "system",
            content:
              "BẠN LÀ: Cố vấn tài chính trưởng của CrediFin Pro Room. PHONG CÁCH: Khách quan, kỷ luật, tư duy đầu tư giá trị (Benjamin Graham & Warren Buffett). Tối đa 3-4 câu ngắn gọn (<80 từ).",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        outputMode: { kind: "TEXT" },
      });

      const responseText = result.content?.trim();
      if (responseText && responseText.length > 20) {
        return responseText;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const map2AIAdvisorService = new Map2AIAdvisorService();
