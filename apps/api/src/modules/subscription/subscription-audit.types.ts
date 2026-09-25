import type { Prisma } from "@prisma/client";

import type { ProviderEventType } from "./provider/subscription-provider.types.js";
import type { SubscriptionPlan, SubscriptionStatus } from "./subscription.types.js";

export const SUBSCRIPTION_AUDIT_EVENT_TYPES = Object.freeze([
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_PLAN_CHANGED",
  "SUBSCRIPTION_PAST_DUE",
  "SUBSCRIPTION_CANCELLATION_REQUESTED",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_EXPIRED",
  "SUBSCRIPTION_RECONCILED",
] as const);

export type SubscriptionAuditEventType = (typeof SUBSCRIPTION_AUDIT_EVENT_TYPES)[number];

export const SUBSCRIPTION_AUDIT_METADATA_MAX_BYTES = 2048;

const AUDIT_METADATA_KEYS = new Set([
  "auditPending",
  "auditPendingVersion",
  "auditEventType",
  "auditSubscriptionId",
  "auditUserId",
  "auditProviderKey",
  "auditProviderEventId",
  "auditFromStatus",
  "auditToStatus",
  "auditFromPlan",
  "auditToPlan",
  "auditOriginSource",
  "auditTransactionStrategy",
  "auditReasonCode",
  "auditReconciled",
  "auditReconciledAt",
  "reconciliationReasonCode",
  "originEventType",
  "originSource",
  "originTransactionStrategy",
  "providerKey",
]);

const PROHIBITED_KEY_PARTS = [
  "authorization",
  "password",
  "credential",
  "accesstoken",
  "refreshtoken",
  "cookie",
  "jwt",
  "secret",
  "token",
  "apikey",
  "databaseurl",
  "redisurl",
  "rawbody",
  "rawpayload",
  "payment",
  "email",
  "clientrole",
  "isadmin",
  "admin",
  "role",
  "url",
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

export interface SubscriptionAuditMetadataValidationResult {
  valid: boolean;
  errors: string[];
  serializedBytes: number;
}

export function validateSubscriptionAuditMetadata(
  metadata: unknown,
): SubscriptionAuditMetadataValidationResult {
  const errors: string[] = [];
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { valid: false, errors: ["Audit metadata must be a flat object"], serializedBytes: 0 };
  }

  const record = metadata as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    const normalized = normalizeKey(key);
    if (PROHIBITED_KEY_PARTS.some((part) => normalized.includes(part))) {
      errors.push(`Audit metadata key '${key}' is prohibited`);
    }
    if (!AUDIT_METADATA_KEYS.has(key)) {
      errors.push(`Audit metadata key '${key}' is not allowlisted`);
    }
    if (!isScalar(value)) {
      errors.push(`Audit metadata key '${key}' must contain a scalar value`);
    }
  }

  const serializedBytes = Buffer.byteLength(JSON.stringify(record), "utf8");
  if (serializedBytes > SUBSCRIPTION_AUDIT_METADATA_MAX_BYTES) {
    errors.push(
      `Audit metadata exceeds ${SUBSCRIPTION_AUDIT_METADATA_MAX_BYTES} bytes`,
    );
  }

  return { valid: errors.length === 0, errors, serializedBytes };
}

export interface DeriveSubscriptionAuditEventInput {
  providerEventType: ProviderEventType;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus;
  fromPlan: SubscriptionPlan | null;
  toPlan: SubscriptionPlan;
  previousCancelAtPeriodEnd: boolean;
  cancelAtPeriodEnd: boolean;
}

export function deriveSubscriptionAuditEventType(
  input: DeriveSubscriptionAuditEventInput,
): Exclude<SubscriptionAuditEventType, "SUBSCRIPTION_RECONCILED"> | null {
  if (input.toStatus === "CANCELLED") return "SUBSCRIPTION_CANCELLED";
  if (input.toStatus === "EXPIRED") return "SUBSCRIPTION_EXPIRED";
  if (input.toStatus === "PAST_DUE") return "SUBSCRIPTION_PAST_DUE";
  if (!input.previousCancelAtPeriodEnd && input.cancelAtPeriodEnd) {
    return "SUBSCRIPTION_CANCELLATION_REQUESTED";
  }
  if (
    input.providerEventType === "SUBSCRIPTION_ACTIVATED" ||
    (input.toStatus === "ACTIVE" && input.fromStatus !== "ACTIVE")
  ) {
    return "SUBSCRIPTION_ACTIVATED";
  }
  if (input.fromPlan !== input.toPlan) return "SUBSCRIPTION_PLAN_CHANGED";
  return null;
}

export interface AuditPendingFacts {
  auditEventType: Exclude<SubscriptionAuditEventType, "SUBSCRIPTION_RECONCILED">;
  subscriptionId: string;
  userId: string;
  providerKey: string;
  providerEventId: string;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus;
  fromPlan: SubscriptionPlan | null;
  toPlan: SubscriptionPlan;
}

export function createAuditPendingMetadata(facts: AuditPendingFacts): Prisma.JsonObject {
  const metadata: Prisma.JsonObject = {
    auditPending: true,
    auditPendingVersion: 1,
    auditEventType: facts.auditEventType,
    auditSubscriptionId: facts.subscriptionId,
    auditUserId: facts.userId,
    auditProviderKey: facts.providerKey,
    auditProviderEventId: facts.providerEventId,
    auditFromStatus: facts.fromStatus,
    auditToStatus: facts.toStatus,
    auditFromPlan: facts.fromPlan,
    auditToPlan: facts.toPlan,
    auditOriginSource: "PROVIDER_WEBHOOK",
    auditTransactionStrategy: "STATE_FIRST",
    auditReasonCode: "ORIGIN_AUDIT_PERSISTENCE_FAILED",
  };

  const validation = validateSubscriptionAuditMetadata(metadata);
  if (!validation.valid) {
    throw new Error("Invalid server-generated subscription audit-pending metadata");
  }
  return metadata;
}

export interface ParsedAuditPendingEvidence extends AuditPendingFacts {
  originSource: "PROVIDER_WEBHOOK";
  transactionStrategy: "STATE_FIRST";
}

export function parseAuditPendingMetadata(metadata: unknown): ParsedAuditPendingEvidence | null {
  const validation = validateSubscriptionAuditMetadata(metadata);
  if (!validation.valid) return null;

  const value = metadata as Record<string, unknown>;
  const eventType = value.auditEventType;
  const fromStatus = value.auditFromStatus;
  const toStatus = value.auditToStatus;
  const fromPlan = value.auditFromPlan;
  const toPlan = value.auditToPlan;
  const isApprovedOriginEvent =
    typeof eventType === "string" &&
    eventType !== "SUBSCRIPTION_RECONCILED" &&
    SUBSCRIPTION_AUDIT_EVENT_TYPES.includes(eventType as SubscriptionAuditEventType);

  if (
    value.auditPending !== true ||
    value.auditPendingVersion !== 1 ||
    !isApprovedOriginEvent ||
    typeof value.auditSubscriptionId !== "string" ||
    !UUID_PATTERN.test(value.auditSubscriptionId) ||
    typeof value.auditUserId !== "string" ||
    !UUID_PATTERN.test(value.auditUserId) ||
    typeof value.auditProviderKey !== "string" ||
    !SAFE_REFERENCE_PATTERN.test(value.auditProviderKey) ||
    typeof value.auditProviderEventId !== "string" ||
    !SAFE_REFERENCE_PATTERN.test(value.auditProviderEventId) ||
    ![null, "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"].includes(
      fromStatus as string | null,
    ) ||
    !["ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"].includes(toStatus as string) ||
    ![null, "FREE", "PREMIUM"].includes(fromPlan as string | null) ||
    !["FREE", "PREMIUM"].includes(toPlan as string) ||
    value.auditOriginSource !== "PROVIDER_WEBHOOK" ||
    value.auditTransactionStrategy !== "STATE_FIRST" ||
    value.auditReasonCode !== "ORIGIN_AUDIT_PERSISTENCE_FAILED"
  ) {
    return null;
  }

  return {
    auditEventType: eventType as ParsedAuditPendingEvidence["auditEventType"],
    subscriptionId: value.auditSubscriptionId,
    userId: value.auditUserId,
    providerKey: value.auditProviderKey,
    providerEventId: value.auditProviderEventId,
    fromStatus: fromStatus as SubscriptionStatus | null,
    toStatus: toStatus as SubscriptionStatus,
    fromPlan: fromPlan as SubscriptionPlan | null,
    toPlan: toPlan as SubscriptionPlan,
    originSource: "PROVIDER_WEBHOOK",
    transactionStrategy: "STATE_FIRST",
  };
}

export function markAuditPendingResolved(
  metadata: unknown,
  reconciledAt: Date,
): Prisma.JsonObject {
  const value = metadata as Prisma.JsonObject;
  const resolved: Prisma.JsonObject = {
    ...value,
    auditPending: false,
    auditReconciled: true,
    auditReconciledAt: reconciledAt.toISOString(),
  };
  const validation = validateSubscriptionAuditMetadata(resolved);
  if (!validation.valid) {
    throw new Error("Invalid server-generated subscription audit resolution metadata");
  }
  return resolved;
}
