import { z } from "zod";
import type { SubscriptionPlan, SubscriptionStatus } from "./subscription.types.js";

/**
 * Forbidden authoritative fields that clients are strictly forbidden from supplying.
 * Any request attempting client authority tampering will be rejected with HTTP 400.
 */
export const FORBIDDEN_CLIENT_AUTHORITY_KEYS = Object.freeze([
  "userId",
  "user_id",
  "status",
  "entitlements",
  "entitlement",
  "providerCustomerId",
  "providerSubscriptionId",
  "currentPeriodStart",
  "currentPeriodEnd",
  "cancelAtPeriodEnd",
  "isPremium",
  "isAdmin",
  "role",
  "roles",
  "audit",
  "auditFields",
  "transition",
  "transitionFields",
  "id",
  "createdAt",
  "updatedAt",
]);

/**
 * Checkout intent schema:
 * Only server-catalog selectable plan ("PREMIUM") is accepted.
 * Extraneous and authoritative fields are strictly rejected.
 */
export const CheckoutIntentInputSchema = z
  .object({
    plan: z.literal("PREMIUM").optional(),
  })
  .strict();

export type CheckoutIntentInput = z.infer<typeof CheckoutIntentInputSchema>;

/**
 * Cancel intent schema:
 * Optional reason (max 500 characters).
 * Extraneous and authoritative fields are strictly rejected.
 */
export const CancelIntentInputSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export type CancelIntentInput = z.infer<typeof CancelIntentInputSchema>;

/**
 * Safe provider-neutral checkout session response DTO.
 * Excludes provider secrets, payment credentials, and internal customer IDs.
 */
export interface CheckoutSessionResponseDto {
  checkoutReference: string;
  state: "PENDING";
  expiresAt: string;
}

/**
 * Safe subscription cancellation response DTO.
 * Reflects updated cancelAtPeriodEnd flag while preserving period-end entitlement.
 */
export interface CancelSubscriptionResponseDto {
  subscriptionId: string;
  status: SubscriptionStatus;
  planKey: SubscriptionPlan;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}
