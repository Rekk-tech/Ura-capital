import {
  SubscriptionMeResponseSchema,
  SubscriptionPlansResponseSchema,
  type SubscriptionMeResponse,
  type SubscriptionPlansResponse,
} from "@aura/shared";
import {
  SubscriptionApiError,
  type CancelSubscriptionResult,
} from "../features/subscription/types/subscription-ui.types";

export interface SubscriptionRequestOptions {
  signal?: AbortSignal;
}

export interface ISubscriptionApiClient {
  getPlans(
    accessToken: string,
    options?: SubscriptionRequestOptions,
  ): Promise<SubscriptionPlansResponse>;
  getCurrent(
    accessToken: string,
    options?: SubscriptionRequestOptions,
  ): Promise<SubscriptionMeResponse>;
  cancel(
    accessToken: string,
    options?: SubscriptionRequestOptions,
  ): Promise<CancelSubscriptionResult>;
}

const SAFE_ERROR_MESSAGES: Readonly<Record<number, string>> = Object.freeze({
  400: "The subscription request was not accepted.",
  401: "Sign in to view your subscription.",
  403: "Subscription access is not available for this account.",
  404: "The subscription service is not available in this environment.",
  409: "Your subscription changed while this request was in progress. Refresh and try again.",
  429: "Too many subscription requests. Please wait before trying again.",
  503: "Subscription services are temporarily unavailable. Your current access has not been changed.",
});

const APPROVED_STATUSES = new Set(["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]);
const APPROVED_PLANS = new Set(["FREE", "PREMIUM"]);

function getRetryAfter(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;

  const seconds = Number.parseInt(value, 10);
  return Number.isInteger(seconds) && seconds > 0 && seconds <= 86_400
    ? seconds
    : undefined;
}

function getSafeErrorCode(status: number): string {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "TOO_MANY_REQUESTS";
  if (status === 503) return "SERVICE_UNAVAILABLE";
  return status >= 500 ? "SERVICE_ERROR" : "REQUEST_REJECTED";
}

function parseCancelResult(payload: unknown): CancelSubscriptionResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid response");
  }

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response");
  }

  const candidate = data as Record<string, unknown>;
  if (
    typeof candidate.status !== "string" ||
    !APPROVED_STATUSES.has(candidate.status) ||
    typeof candidate.planKey !== "string" ||
    !APPROVED_PLANS.has(candidate.planKey) ||
    typeof candidate.cancelAtPeriodEnd !== "boolean" ||
    typeof candidate.currentPeriodEnd !== "string" ||
    Number.isNaN(Date.parse(candidate.currentPeriodEnd))
  ) {
    throw new Error("Invalid response");
  }

  return {
    status: candidate.status as CancelSubscriptionResult["status"],
    planKey: candidate.planKey as CancelSubscriptionResult["planKey"],
    cancelAtPeriodEnd: candidate.cancelAtPeriodEnd,
    currentPeriodEnd: candidate.currentPeriodEnd,
  };
}

export class SubscriptionApiClient implements ISubscriptionApiClient {
  constructor(private baseUrl = "/api/subscriptions") {}

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getPlans(
    accessToken: string,
    options?: SubscriptionRequestOptions,
  ): Promise<SubscriptionPlansResponse> {
    const response = await fetch(`${this.baseUrl}/plans`, {
      method: "GET",
      headers: this.authHeaders(accessToken),
      signal: options?.signal,
    });

    if (!response.ok) throw this.toSafeError(response);
    const result = SubscriptionPlansResponseSchema.safeParse(await this.readJson(response));
    if (!result.success) throw this.invalidResponseError();
    return result.data;
  }

  async getCurrent(
    accessToken: string,
    options?: SubscriptionRequestOptions,
  ): Promise<SubscriptionMeResponse> {
    const response = await fetch(`${this.baseUrl}/me`, {
      method: "GET",
      headers: this.authHeaders(accessToken),
      signal: options?.signal,
    });

    if (!response.ok) throw this.toSafeError(response);
    const result = SubscriptionMeResponseSchema.safeParse(await this.readJson(response));
    if (!result.success) throw this.invalidResponseError();
    return result.data;
  }

  async cancel(
    accessToken: string,
    options?: SubscriptionRequestOptions,
  ): Promise<CancelSubscriptionResult> {
    const response = await fetch(`${this.baseUrl}/cancel`, {
      method: "POST",
      headers: {
        ...this.authHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: options?.signal,
    });

    if (!response.ok) throw this.toSafeError(response);

    try {
      return parseCancelResult(await this.readJson(response));
    } catch {
      throw this.invalidResponseError();
    }
  }

  private authHeaders(accessToken: string): Record<string, string> {
    return {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw this.invalidResponseError();
    }
  }

  private toSafeError(response: Response): SubscriptionApiError {
    const retryAfter = getRetryAfter(response);
    const baseMessage =
      SAFE_ERROR_MESSAGES[response.status] ??
      "Subscription data could not be loaded. Please try again.";
    const message =
      response.status === 429 && retryAfter
        ? `${baseMessage} Try again in ${retryAfter} seconds.`
        : baseMessage;

    return new SubscriptionApiError(
      response.status,
      getSafeErrorCode(response.status),
      message,
      retryAfter,
    );
  }

  private invalidResponseError(): SubscriptionApiError {
    return new SubscriptionApiError(
      502,
      "INVALID_RESPONSE",
      "Subscription data is temporarily unavailable. Please try again.",
    );
  }
}

export const subscriptionApi = new SubscriptionApiClient();
