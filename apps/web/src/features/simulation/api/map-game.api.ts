import { getApiBaseUrl } from "../../../api/config";
import type {
  Map1CurrentState,
  Map1DebriefReport,
  Map1OrderInput,
  Map2Allocation,
  Map2FinalReport,
  Map2QuarterHistoryRecord,
  Map2Session,
} from "../types/map-game.types";

export interface RequestOptions {
  signal?: AbortSignal;
}

export class MapGameApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = `${getApiBaseUrl()}/api/sim`) {
    this.baseUrl = baseUrl;
  }

  private async handleError(res: Response): Promise<never> {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) {
        errorDetail = typeof errJson.error === "string" ? errJson.error : errJson.error.message || errorDetail;
      } else if (errJson && errJson.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  // ==========================================
  // MAP 1 — FOMO ARENA
  // ==========================================

  async startMap1(
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: { sessionId: string; session: unknown } }> {
    const url = `${this.baseUrl}/map1/start`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: { sessionId: string; session: unknown } };
  }

  async getMap1State(
    sessionId: string,
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: Map1CurrentState }> {
    const url = `${this.baseUrl}/map1/${encodeURIComponent(sessionId)}/state`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: Map1CurrentState };
  }

  async submitMap1Order(
    sessionId: string,
    input: Map1OrderInput,
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: Map1CurrentState }> {
    const url = `${this.baseUrl}/map1/${encodeURIComponent(sessionId)}/order`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: Map1CurrentState };
  }

  async submitMap1Quiz(
    sessionId: string,
    body: {
      round: number;
      quizId?: string;
      selectedOption: string;
      trapId?: string;
    },
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: { success: boolean; isCorrect?: boolean; feedback?: string; message?: string } }> {
    const url = `${this.baseUrl}/map1/${encodeURIComponent(sessionId)}/quiz`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: { success: boolean; isCorrect?: boolean; feedback?: string; message?: string } };
  }

  async finishMap1(
    sessionId: string,
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: Map1DebriefReport }> {
    const url = `${this.baseUrl}/map1/${encodeURIComponent(sessionId)}/finish`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: Map1DebriefReport };
  }

  // ==========================================
  // MAP 2 — PRO ROOM
  // ==========================================

  async startMap2(
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: { sessionId: string; session: Map2Session } }> {
    const url = `${this.baseUrl}/map2/start`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: { sessionId: string; session: Map2Session } };
  }

  async getMap2Session(
    sessionId: string,
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: Map2Session }> {
    const url = `${this.baseUrl}/map2/${encodeURIComponent(sessionId)}/session`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: Map2Session };
  }

  async allocateMap2(
    sessionId: string,
    allocation: Map2Allocation,
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: { success: boolean; allocation: Map2Allocation } }> {
    const url = `${this.baseUrl}/map2/${encodeURIComponent(sessionId)}/allocate`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(allocation),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: { success: boolean; allocation: Map2Allocation } };
  }

  async submitMap2Quiz(
    sessionId: string,
    body: { quarter: number; quizId: string; selectedOption: string },
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: { success: boolean; isCorrect: boolean; creditScore: number; feedback: string } }> {
    const url = `${this.baseUrl}/map2/${encodeURIComponent(sessionId)}/quiz`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: { success: boolean; isCorrect: boolean; creditScore: number; feedback: string } };
  }

  async commitMap2Quarter(
    sessionId: string,
    body: {
      allocation?: Map2Allocation;
      quiz?: { quizId: string; selectedOption: string };
    },
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{
    data: {
      session: Map2Session;
      historyRecord: Map2QuarterHistoryRecord;
      isFinalQuarter: boolean;
    };
  }> {
    const url = `${this.baseUrl}/map2/${encodeURIComponent(sessionId)}/commit-quarter`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options?.signal,
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as {
      data: {
        session: Map2Session;
        historyRecord: Map2QuarterHistoryRecord;
        isFinalQuarter: boolean;
      };
    };
  }

  async getMap2Report(
    sessionId: string,
    accessToken?: string | null,
    options?: RequestOptions,
  ): Promise<{ data: Map2FinalReport }> {
    const url = `${this.baseUrl}/map2/${encodeURIComponent(sessionId)}/report`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: Map2FinalReport };
  }
}

export const mapGameApiClient = new MapGameApiClient();
