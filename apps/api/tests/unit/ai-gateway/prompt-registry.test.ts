import { describe, it, expect } from "vitest";
import {
  promptRegistry,
  AIAssistPromptV1,
  IntentClassifierPromptV1,
} from "../../../src/modules/ai/prompts/index.js";
import { AIGatewayConfigurationError } from "../../../src/modules/ai/core/ai-gateway.errors.js";
import { AI_INTENTS } from "@aura/shared";

describe("PromptRegistry Unit Tests (FEAT-060)", () => {
  it("should retrieve canonical AI assist prompt by ID", () => {
    const prompt = promptRegistry.getPrompt("ai-assist-prompt");
    expect(prompt).toBeDefined();
    expect(prompt.promptId).toBe("ai-assist-prompt");
    expect(prompt.version).toBe("1.0.0");
    expect(prompt.expectedOutputSchemaId).toBe("ai-assist-v1");
    expect(prompt.expectedOutputSchemaVersion).toBe("1.0");
  });

  it("should retrieve intent classifier prompt by ID", () => {
    const prompt = promptRegistry.getPrompt("intent-classifier-prompt");
    expect(prompt).toBeDefined();
    expect(prompt.promptId).toBe("intent-classifier-prompt");
    expect(prompt.version).toBe("1.0.0");
    expect(prompt.expectedOutputSchemaId).toBe("ai-intent-schema");
  });

  it("should return the approved default version when version is omitted", () => {
    const prompt = promptRegistry.getPrompt("ai-assist-prompt");
    expect(prompt.version).toBe("1.0.0");
    expect(prompt.isDefault).toBe(true);
  });

  it("should return the exact requested version when version is explicitly provided", () => {
    const prompt = promptRegistry.getPrompt("ai-assist-prompt", "1.0.0");
    expect(prompt.version).toBe("1.0.0");
  });

  it("should throw AIGatewayConfigurationError when looking up an unknown prompt ID", () => {
    expect(() => promptRegistry.getPrompt("non-existent-prompt")).toThrow(
      AIGatewayConfigurationError,
    );
    expect(() => promptRegistry.getPrompt("non-existent-prompt")).toThrow(
      /Unknown prompt identifier/,
    );
  });

  it("should throw AIGatewayConfigurationError when looking up an unknown version", () => {
    expect(() => promptRegistry.getPrompt("ai-assist-prompt", "9.9.9")).toThrow(
      AIGatewayConfigurationError,
    );
    expect(() => promptRegistry.getPrompt("ai-assist-prompt", "9.9.9")).toThrow(
      /Unknown version '9.9.9'/,
    );
  });

  it("should verify prompt definitions are frozen and immutable", () => {
    const prompt = promptRegistry.getPrompt("ai-assist-prompt");
    expect(Object.isFrozen(prompt)).toBe(true);
    expect(() => {
      // @ts-expect-error mutating frozen object
      prompt.systemInstructions = "tampered";
    }).toThrow();
  });

  it("should correctly check whether prompts exist via hasPrompt", () => {
    expect(promptRegistry.hasPrompt("ai-assist-prompt")).toBe(true);
    expect(promptRegistry.hasPrompt("ai-assist-prompt", "1.0.0")).toBe(true);
    expect(promptRegistry.hasPrompt("ai-assist-prompt", "2.0.0")).toBe(false);
    expect(promptRegistry.hasPrompt("unknown-prompt")).toBe(false);
  });

  it("should list all registered prompt definitions", () => {
    const all = promptRegistry.listPrompts();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const ids = all.map((p) => p.promptId);
    expect(ids).toContain("ai-assist-prompt");
    expect(ids).toContain("intent-classifier-prompt");
  });

  it("should verify AIAssistPromptV1 contains required anti-tampering guards and role specifications", () => {
    const instructions = AIAssistPromptV1.systemInstructions;
    expect(instructions).toContain("You are Aura");
    expect(instructions).toContain("Educational and simulation assistance ONLY");
    expect(instructions).toContain("PROHIBITED_FINANCIAL_ACTION");
    expect(instructions).toContain("UNSUPPORTED_REQUEST");
    expect(instructions).toContain("INSUFFICIENT_SAFE_CONTEXT");
    expect(instructions).toContain("SAFETY_POLICY");
    expect(instructions).toContain("Anti-Tampering");
    expect(instructions).toContain("<trusted_server_context>");
    expect(instructions).toContain("<untrusted_retrieved_content>");
    expect(instructions).toContain("<user_input>");
  });

  it("should verify IntentClassifierPromptV1 contains all 5 approved intents and fail-closed rules", () => {
    const instructions = IntentClassifierPromptV1.systemInstructions;
    expect(IntentClassifierPromptV1.supportedIntents).toEqual([
      AI_INTENTS.LEARNING_EXPLANATION,
      AI_INTENTS.ACADEMY_GUIDANCE,
      AI_INTENTS.SIMULATION_ANALYSIS,
      AI_INTENTS.PORTFOLIO_EDUCATION,
      AI_INTENTS.UNSUPPORTED_OR_REFUSED,
    ]);
    expect(instructions).toContain("LEARNING_EXPLANATION");
    expect(instructions).toContain("ACADEMY_GUIDANCE");
    expect(instructions).toContain("SIMULATION_ANALYSIS");
    expect(instructions).toContain("PORTFOLIO_EDUCATION");
    expect(instructions).toContain("UNSUPPORTED_OR_REFUSED");
    expect(instructions).toContain("Fail closed");
  });
});
