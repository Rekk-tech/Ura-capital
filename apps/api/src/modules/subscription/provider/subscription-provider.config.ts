import { isIsolatedTestDatabaseUrl, isLocalDevelopmentDatabaseUrl } from "@aura/shared";

import { SubscriptionProviderConfigurationError } from "./subscription-provider.errors.js";

export interface SubscriptionProviderEnvironmentInput {
  nodeEnv?: string | undefined;
  providerMode?: string | undefined;
  isCi?: boolean | undefined;
  databaseUrl?: string | undefined;
  runId?: string | undefined;
  workerId?: string | undefined;
  mockWebhookSecret?: string | undefined;
}

export interface SafeMockProviderConfiguration {
  mode: "mock";
  environment: "development" | "test";
  isCi: boolean;
  namespace: string;
  verificationSecret: string;
  readonly activationProof: symbol;
}

const SAFE_NAMESPACE_PART = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const MOCK_ACTIVATION_PROOF = Symbol("safe-subscription-mock-activation");

function requireNamespacePart(value: string | undefined): string {
  if (!value || !SAFE_NAMESPACE_PART.test(value)) {
    throw new SubscriptionProviderConfigurationError();
  }
  return value;
}

export function validateSubscriptionProviderEnvironment(
  input: SubscriptionProviderEnvironmentInput,
): SafeMockProviderConfiguration {
  const nodeEnv = input.nodeEnv?.trim().toLowerCase();
  const providerMode = input.providerMode?.trim().toLowerCase();
  const isCi = input.isCi === true;

  if (providerMode !== "mock") {
    throw new SubscriptionProviderConfigurationError();
  }

  const runId = requireNamespacePart(input.runId);
  const workerId = requireNamespacePart(input.workerId);

  if (!input.mockWebhookSecret || input.mockWebhookSecret.length < 32) {
    throw new SubscriptionProviderConfigurationError();
  }

  if (nodeEnv === "development") {
    if (isCi || !isLocalDevelopmentDatabaseUrl(input.databaseUrl)) {
      throw new SubscriptionProviderConfigurationError();
    }
  } else if (nodeEnv === "test") {
    if (!isIsolatedTestDatabaseUrl(input.databaseUrl)) {
      throw new SubscriptionProviderConfigurationError();
    }
  } else {
    throw new SubscriptionProviderConfigurationError();
  }

  return {
    mode: "mock",
    environment: nodeEnv,
    isCi,
    namespace: `aura:${nodeEnv}:subscription-provider:${runId}:${workerId}`,
    verificationSecret: input.mockWebhookSecret,
    activationProof: MOCK_ACTIVATION_PROOF,
  };
}

export function assertSafeMockProviderConfiguration(
  config: SafeMockProviderConfiguration,
): void {
  if (config.activationProof !== MOCK_ACTIVATION_PROOF) {
    throw new SubscriptionProviderConfigurationError();
  }
}

export function readSubscriptionProviderEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): SubscriptionProviderEnvironmentInput {
  return {
    nodeEnv: env.NODE_ENV,
    providerMode: env.SUBSCRIPTION_PROVIDER_MODE,
    isCi: env.CI === "true",
    databaseUrl: env.DATABASE_URL,
    runId: env.SUBSCRIPTION_PROVIDER_RUN_ID,
    workerId: env.SUBSCRIPTION_PROVIDER_WORKER_ID,
    mockWebhookSecret: env.SUBSCRIPTION_MOCK_WEBHOOK_SECRET,
  };
}
