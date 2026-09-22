import { describe, expect, it } from "vitest";

import {
  createSubscriptionProvider,
  MockSubscriptionProvider,
  SubscriptionProviderConfigurationError,
  validateSubscriptionProviderEnvironment,
  type SubscriptionProviderEnvironmentInput,
} from "../../src/modules/subscription/provider/index.js";

const TEST_SECRET = "mock-webhook-secret-at-least-32-characters";

function testEnvironment(
  overrides: Partial<SubscriptionProviderEnvironmentInput> = {},
): SubscriptionProviderEnvironmentInput {
  return {
    nodeEnv: "test",
    providerMode: "mock",
    isCi: false,
    databaseUrl: "postgresql://localhost:5432/aura_capital_test_feat051",
    runId: "run-a",
    workerId: "worker-1",
    mockWebhookSecret: TEST_SECRET,
    ...overrides,
  };
}

describe("FEAT-051 subscription provider environment isolation", () => {
  it("allows explicit local-development mock mode on an approved local target", () => {
    const config = validateSubscriptionProviderEnvironment(
      testEnvironment({
        nodeEnv: "development",
        databaseUrl: "postgresql://localhost:5432/aura_capital_dev_feat051",
      }),
    );

    expect(config.environment).toBe("development");
    expect(config.namespace).toBe("aura:development:subscription-provider:run-a:worker-1");
  });

  it("allows explicit isolated test mock mode", () => {
    const config = validateSubscriptionProviderEnvironment(testEnvironment());

    expect(config.environment).toBe("test");
    expect(config.isCi).toBe(false);
  });

  it("allows explicit CI test mock mode", () => {
    const config = validateSubscriptionProviderEnvironment(testEnvironment({ isCi: true }));

    expect(config.environment).toBe("test");
    expect(config.isCi).toBe(true);
  });

  it.each(["production", "staging", "preview", ""])(
    "fails closed for prohibited or unknown NODE_ENV=%s",
    (nodeEnv) => {
      expect(() =>
        validateSubscriptionProviderEnvironment(testEnvironment({ nodeEnv })),
      ).toThrow(SubscriptionProviderConfigurationError);
    },
  );

  it("rejects CI combined with development mode", () => {
    expect(() =>
      validateSubscriptionProviderEnvironment(
        testEnvironment({
          nodeEnv: "development",
          isCi: true,
          databaseUrl: "postgresql://localhost:5432/aura_capital_dev_feat051",
        }),
      ),
    ).toThrow(SubscriptionProviderConfigurationError);
  });

  it.each([undefined, "", "production", "stripe", "paddle"])(
    "rejects missing, production, or unknown provider mode %s without mock fallback",
    (providerMode) => {
      expect(() =>
        validateSubscriptionProviderEnvironment(testEnvironment({ providerMode })),
      ).toThrow(SubscriptionProviderConfigurationError);
    },
  );

  it("rejects development and test database target mismatches", () => {
    expect(() =>
      validateSubscriptionProviderEnvironment(
        testEnvironment({
          nodeEnv: "development",
          databaseUrl: "postgresql://localhost:5432/aura_capital_test_feat051",
        }),
      ),
    ).toThrow(SubscriptionProviderConfigurationError);

    expect(() =>
      validateSubscriptionProviderEnvironment(
        testEnvironment({ databaseUrl: "postgresql://localhost:5432/aura_capital_dev_feat051" }),
      ),
    ).toThrow(SubscriptionProviderConfigurationError);
  });

  it("rejects production-like targets before provider creation", () => {
    expect(() =>
      createSubscriptionProvider({
        environment: testEnvironment({
          databaseUrl:
            "postgresql://billing_admin:raw-password@billing.internal:5432/aura_capital_production",
        }),
      }),
    ).toThrow(SubscriptionProviderConfigurationError);
  });

  it.each([
    { runId: undefined },
    { runId: "unsafe/run" },
    { workerId: undefined },
    { workerId: "unsafe worker" },
    { mockWebhookSecret: undefined },
    { mockWebhookSecret: "too-short" },
  ])("rejects incomplete or unsafe isolation configuration", (overrides) => {
    expect(() =>
      validateSubscriptionProviderEnvironment(testEnvironment(overrides)),
    ).toThrow(SubscriptionProviderConfigurationError);
  });

  it("returns only a mock provider after all safety predicates pass", () => {
    const provider = createSubscriptionProvider({ environment: testEnvironment() });

    expect(provider).toBeInstanceOf(MockSubscriptionProvider);
    expect(provider.providerKey).toBe("MOCK");
  });

  it("does not expose raw target or secret in configuration failures", () => {
    const secret = "secret-value-that-must-never-appear-123456789";
    const databaseUrl =
      "postgresql://billing_admin:raw-password@billing.internal:5432/aura_capital_production";

    try {
      validateSubscriptionProviderEnvironment(
        testEnvironment({ databaseUrl, mockWebhookSecret: secret }),
      );
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SubscriptionProviderConfigurationError);
      const message = (error as Error).message;
      expect(message).not.toContain(secret);
      expect(message).not.toContain(databaseUrl);
      expect(message).not.toContain("billing.internal");
      expect(message).not.toContain("raw-password");
    }
  });
});
