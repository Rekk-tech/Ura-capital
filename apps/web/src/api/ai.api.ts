import { getApiBaseUrl } from "./config";

export interface AICoachResponse {
  answer: string;
  intent: string;
  confidence: number;
  suggestions: string[];
  disclaimer: string;
  source: "gemini" | "deterministic_engine";
}

export interface AICoachRequestPayload {
  query: string;
  topic?: string;
  mapContext?: "MAP1" | "MAP2" | "GENERAL";
}

export interface AskAiCoachOptions {
  signal?: AbortSignal;
}

export class AiCoachApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = "AiCoachApiError";
  }
}

export async function askAiCoach(
  payload: AICoachRequestPayload,
  accessToken?: string | null,
  options?: AskAiCoachOptions,
): Promise<AICoachResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/ai/coach`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
    signal: options?.signal,
  });

  if (!response.ok) {
    let errorMessage = "Không thể kết nối với Cố vấn Aura Intelligence. Vui lòng thử lại.";
    let errorCode: string | undefined;

    try {
      const errorJson = await response.json() as {
        error?: { message?: string; code?: string };
        message?: string;
      };
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
      errorCode = errorJson.error?.code;
    } catch {
      // JSON parse fallback
    }

    if (response.status === 401) {
      errorMessage = "Vui lòng đăng nhập để trao đổi cùng Cố vấn Aura Intelligence.";
    }

    throw new AiCoachApiError(errorMessage, response.status, errorCode);
  }

  const json = await response.json() as {
    success: boolean;
    data: AICoachResponse;
  };

  return json.data;
}

export const aiApi = {
  askCoach: askAiCoach,
};
