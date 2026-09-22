import type {
  EffectiveSubscriptionStatus,
  SubscriptionMeDto,
  SubscriptionPlanDto,
  SubscriptionPlanKey,
} from "@aura/shared";

export type {
  EffectiveSubscriptionStatus,
  SubscriptionMeDto,
  SubscriptionPlanDto,
  SubscriptionPlanKey,
};

export interface CancelSubscriptionResult {
  status: Exclude<EffectiveSubscriptionStatus, "NONE">;
  planKey: SubscriptionPlanKey;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}
export class SubscriptionApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "SubscriptionApiError";
  }
}
