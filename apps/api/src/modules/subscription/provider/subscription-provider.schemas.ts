import { z } from "zod";

import {
  PROVIDER_EVENT_TYPES,
  type NormalizedProviderEvent,
  type ProviderCancelCommand,
  type ProviderCheckoutCommand,
  type ProviderCheckoutSession,
  type ProviderSubscriptionReference,
  type ProviderSubscriptionSnapshot,
  type VerifiedProviderWebhook,
} from "./subscription-provider.types.js";
import { SubscriptionProviderResponseError } from "./subscription-provider.errors.js";

const safeReferenceSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

const userIdSchema = z.string().uuid();

export const ProviderCheckoutCommandSchema = z
  .object({
    requestId: safeReferenceSchema,
    userId: userIdSchema,
    planKey: z.literal("PREMIUM"),
    idempotencyKey: safeReferenceSchema,
  })
  .strict();

export const ProviderCheckoutSessionSchema = z
  .object({
    checkoutReference: safeReferenceSchema,
    state: z.literal("PENDING"),
    expiresAt: z.date(),
  })
  .strict();

export const ProviderCancelCommandSchema = z
  .object({
    requestId: safeReferenceSchema,
    userId: userIdSchema,
    externalSubscriptionId: safeReferenceSchema,
    cancelAtPeriodEnd: z.boolean(),
    idempotencyKey: safeReferenceSchema,
  })
  .strict();

export const ProviderSubscriptionReferenceSchema = z
  .object({
    userId: userIdSchema,
    externalSubscriptionId: safeReferenceSchema,
  })
  .strict();

export const ProviderSubscriptionSnapshotSchema = z
  .object({
    userId: userIdSchema,
    externalSubscriptionId: safeReferenceSchema,
    planKey: z.enum(["FREE", "PREMIUM"]),
    status: z.enum(["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]),
    currentPeriodStart: z.date(),
    currentPeriodEnd: z.date(),
    cancelAtPeriodEnd: z.boolean(),
    providerSequence: safeReferenceSchema.nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.currentPeriodEnd <= value.currentPeriodStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPeriodEnd"],
        message: "Period end must be after period start",
      });
    }
  });

export const MockProviderWebhookBodySchema = z
  .object({
    providerEventId: safeReferenceSchema,
    eventType: z.enum(PROVIDER_EVENT_TYPES),
    occurredAt: z.string().datetime({ offset: true }),
    subscription: z
      .object({
        userId: userIdSchema,
        externalSubscriptionId: safeReferenceSchema,
        planKey: z.enum(["FREE", "PREMIUM"]),
        status: z.enum(["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"]),
        currentPeriodStart: z.string().datetime({ offset: true }),
        currentPeriodEnd: z.string().datetime({ offset: true }),
        cancelAtPeriodEnd: z.boolean(),
        providerSequence: safeReferenceSchema.nullable(),
      })
      .strict(),
  })
  .strict();

export const VerifiedProviderWebhookSchema = z
  .object({
    verified: z.literal(true),
    providerEventId: safeReferenceSchema,
    eventType: z.enum(PROVIDER_EVENT_TYPES),
    occurredAt: z.date(),
    payloadDigest: z.string().regex(/^[a-f0-9]{64}$/),
    payload: z.unknown(),
  })
  .strict();

function parseProviderValue<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new SubscriptionProviderResponseError();
  }
  return result.data;
}

export function parseCheckoutCommand(value: unknown): ProviderCheckoutCommand {
  return parseProviderValue(ProviderCheckoutCommandSchema, value);
}

export function parseCheckoutSession(value: unknown): ProviderCheckoutSession {
  return parseProviderValue(ProviderCheckoutSessionSchema, value);
}

export function parseCancelCommand(value: unknown): ProviderCancelCommand {
  return parseProviderValue(ProviderCancelCommandSchema, value);
}

export function parseSubscriptionReference(value: unknown): ProviderSubscriptionReference {
  return parseProviderValue(ProviderSubscriptionReferenceSchema, value);
}

export function parseSubscriptionSnapshot(value: unknown): ProviderSubscriptionSnapshot {
  return parseProviderValue(ProviderSubscriptionSnapshotSchema, value);
}

export function parseVerifiedWebhook(value: unknown): VerifiedProviderWebhook {
  const result = VerifiedProviderWebhookSchema.safeParse(value);
  if (!result.success || result.data.payload === undefined) {
    throw new SubscriptionProviderResponseError();
  }

  return {
    verified: result.data.verified,
    providerEventId: result.data.providerEventId,
    eventType: result.data.eventType,
    occurredAt: result.data.occurredAt,
    payloadDigest: result.data.payloadDigest,
    payload: result.data.payload,
  };
}

export function normalizeVerifiedWebhook(value: VerifiedProviderWebhook): NormalizedProviderEvent {
  const verified = parseVerifiedWebhook(value);
  const payloadResult = MockProviderWebhookBodySchema.safeParse(verified.payload);
  if (!payloadResult.success) {
    throw new SubscriptionProviderResponseError();
  }

  const body = payloadResult.data;
  if (
    body.providerEventId !== verified.providerEventId ||
    body.eventType !== verified.eventType ||
    new Date(body.occurredAt).getTime() !== verified.occurredAt.getTime()
  ) {
    throw new SubscriptionProviderResponseError();
  }

  const subscription = parseSubscriptionSnapshot({
    ...body.subscription,
    currentPeriodStart: new Date(body.subscription.currentPeriodStart),
    currentPeriodEnd: new Date(body.subscription.currentPeriodEnd),
  });

  return {
    providerEventId: verified.providerEventId,
    eventType: verified.eventType,
    occurredAt: verified.occurredAt,
    payloadDigest: verified.payloadDigest,
    subscription,
  };
}
