import {
  SimulationAssetDto,
  SimulationMarketSnapshotDto,
  SimulationSessionDto,
  SimulationPortfolioValuationDto,
  SimulationOrderDto,
  SimulationTradeDto,
  SubmitOrderRequestDto,
  AppErrorResponse,
  SimulationApiError,
} from "../features/simulation/types/simulation-ui.types";

export interface ISimulationApiClient {
  listAssets(accessToken?: string): Promise<{ data: SimulationAssetDto[] }>;
  listSnapshots(scenarioKey: string, cycle: number, accessToken?: string): Promise<{ data: SimulationMarketSnapshotDto[] }>;
  listSessions(accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: SimulationSessionDto[] }>;
  createSession(data?: Record<string, never>, accessToken?: string): Promise<{ data: SimulationSessionDto }>;
  getSessionById(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }>;
  startSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }>;
  resetSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }>;
  completeSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }>;
  cancelSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }>;
  submitOrder(simulationId: string, data: SubmitOrderRequestDto, accessToken?: string): Promise<{ data: SimulationOrderDto }>;
  getPortfolioValuation(simulationId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: SimulationPortfolioValuationDto }>;
  getOrders(simulationId: string, accessToken?: string): Promise<{ data: SimulationOrderDto[] }>;
  getTrades(simulationId: string, accessToken?: string): Promise<{ data: SimulationTradeDto[] }>;
}

export class SimulationApiClient implements ISimulationApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "/api/simulation") {
    this.baseUrl = baseUrl;
  }

  async listAssets(accessToken?: string): Promise<{ data: SimulationAssetDto[] }> {
    const url = `${this.baseUrl}/assets`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationAssetDto[] };
  }

  async listSnapshots(scenarioKey: string, cycle: number, accessToken?: string): Promise<{ data: SimulationMarketSnapshotDto[] }> {
    const url = `${this.baseUrl}/scenarios/${encodeURIComponent(scenarioKey)}/snapshots/${cycle}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationMarketSnapshotDto[] };
  }

  async listSessions(accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: SimulationSessionDto[] }> {
    const url = `${this.baseUrl}/sessions`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationSessionDto[] };
  }

  async createSession(data?: Record<string, never>, accessToken?: string): Promise<{ data: SimulationSessionDto }> {
    const url = `${this.baseUrl}/sessions`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data ?? {}),
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationSessionDto };
  }

  async getSessionById(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationSessionDto };
  }

  async startSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/start`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "POST", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationSessionDto };
  }

  async resetSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/reset`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "POST", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationSessionDto };
  }

  async completeSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/complete`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "POST", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationSessionDto };
  }

  async cancelSession(simulationId: string, accessToken?: string): Promise<{ data: SimulationSessionDto }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/cancel`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "POST", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationSessionDto };
  }

  async submitOrder(simulationId: string, data: SubmitOrderRequestDto, accessToken?: string): Promise<{ data: SimulationOrderDto }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/orders`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationOrderDto };
  }

  async getPortfolioValuation(simulationId: string, accessToken?: string, options?: { signal?: AbortSignal }): Promise<{ data: SimulationPortfolioValuationDto }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/portfolio`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers, signal: options?.signal });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationPortfolioValuationDto };
  }

  async getOrders(simulationId: string, accessToken?: string): Promise<{ data: SimulationOrderDto[] }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/orders`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationOrderDto[] };
  }

  async getTrades(simulationId: string, accessToken?: string): Promise<{ data: SimulationTradeDto[] }> {
    const url = `${this.baseUrl}/sessions/${encodeURIComponent(simulationId)}/trades`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) await this.handleError(res);
    return (await res.json()) as { data: SimulationTradeDto[] };
  }

  private async handleError(res: Response): Promise<never> {
    let errorData: AppErrorResponse | null = null;
    try {
      errorData = (await res.json()) as AppErrorResponse;
    } catch {
      // Non-JSON or network error
    }

    const code = errorData?.error?.code ?? (
      res.status === 401 ? "UNAUTHENTICATED" :
      res.status === 403 ? "FORBIDDEN" :
      res.status === 404 ? "NOT_FOUND" :
      res.status === 409 ? "CONFLICT" :
      res.status === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR"
    );

    const message = errorData?.error?.message ?? (
      res.status === 401 ? "Authentication required" :
      res.status === 403 ? "Permission denied" :
      res.status === 404 ? "Resource not found" :
      res.status === 409 ? "State conflict" :
      res.status === 429 ? "Rate limit exceeded" : "An unexpected error occurred"
    );

    throw new SimulationApiError(res.status, code, message);
  }
}

export const simulationApi = new SimulationApiClient();
