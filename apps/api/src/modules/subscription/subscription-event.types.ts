import type { SubscriptionProviderEventOutcome } from "./subscription.types.js";

export const MAX_WEBHOOK_PAYLOAD_BYTES = 65536; // 64 KB

export interface SubscriptionEventProcessingResult {
  outcome: SubscriptionProviderEventOutcome;
  duplicate: boolean;
  providerEventId: string;
  subscriptionId: string | null;
  status?: string | null;
  planKey?: string | null;
  reason?: string | null;
  auditPending?: boolean;
}

export interface ProcessWebhookInput {
  providerKey: string;
  signature: string;
  rawBody: string | Buffer;
}
