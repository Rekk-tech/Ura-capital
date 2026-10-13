import { describe, it, expect, vi, beforeEach } from "vitest";
import { askAiCoach } from "./ai.api";

describe("aiApi.askCoach (Unit Tests)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends query to /api/ai/coach and parses response correctly", async () => {
    const mockResponse = {
      success: true,
      data: {
        answer: "Chỉ số P/E đo lường mức giá bạn sẵn sàng trả cho 1 đồng lợi nhuận.",
        intent: "CONCEPT_EXPLANATION",
        confidence: 0.95,
        suggestions: ["Làm thế nào để nhận biết bẫy giá rẻ?"],
        disclaimer: "Tất cả phản hồi mang tính chất giáo dục mô phỏng.",
        source: "deterministic_engine",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await askAiCoach({ query: "Chỉ số P/E là gì?" }, "mock-access-token");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/ai/coach"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer mock-access-token",
        }),
      }),
    );
    expect(result.answer).toBe(mockResponse.data.answer);
    expect(result.intent).toBe("CONCEPT_EXPLANATION");
  });

  it("throws AiCoachApiError with Vietnamese copy on 401 Unauthorized", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Unauthorized" }),
    });

    await expect(askAiCoach({ query: "Hello" }, null)).rejects.toThrow(
      "Vui lòng đăng nhập để trao đổi cùng Cố vấn Aura Intelligence.",
    );
  });

  it("throws AiCoachApiError when backend returns validation error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: "Query is required", code: "VALIDATION_ERROR" },
      }),
    });

    await expect(askAiCoach({ query: "" }, "token")).rejects.toThrow(
      "Query is required",
    );
  });
});
