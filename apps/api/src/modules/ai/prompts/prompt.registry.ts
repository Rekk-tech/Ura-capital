import { AIGatewayConfigurationError } from "../core/ai-gateway.errors.js";
import type { PromptDefinition } from "./prompt.types.js";
import { AIAssistPromptV1 } from "./definitions/ai-assist.prompt.js";
import { IntentClassifierPromptV1 } from "./definitions/intent-classifier.prompt.js";

/**
 * Server-owned, code-versioned immutable prompt registry (FR-004, AC-004).
 * Callers cannot construct arbitrary system prompts or select unapproved versions at runtime.
 */
class PromptRegistry {
  private readonly definitions = new Map<string, Map<string, PromptDefinition>>();
  private readonly defaultVersions = new Map<string, string>();

  constructor() {
    this.register(AIAssistPromptV1);
    this.register(IntentClassifierPromptV1);
  }

  /**
   * Internal registration at module load time.
   */
  private register(def: PromptDefinition): void {
    let versions = this.definitions.get(def.promptId);
    if (!versions) {
      versions = new Map<string, PromptDefinition>();
      this.definitions.set(def.promptId, versions);
    }

    if (versions.has(def.version)) {
      throw new AIGatewayConfigurationError(
        `Duplicate prompt registration for ${def.promptId}@${def.version}`,
      );
    }

    versions.set(def.version, Object.freeze({ ...def }));

    if (def.isDefault || !this.defaultVersions.has(def.promptId)) {
      this.defaultVersions.set(def.promptId, def.version);
    }
  }

  /**
   * Deterministic prompt lookup by ID and optional version (FR-004, AC-004).
   * Fails closed with AIGatewayConfigurationError if prompt or version is unknown.
   */
  getPrompt(promptId: string, version?: string): PromptDefinition {
    const versions = this.definitions.get(promptId);
    if (!versions) {
      throw new AIGatewayConfigurationError(`Unknown prompt identifier: '${promptId}'`);
    }

    const targetVersion = version ?? this.defaultVersions.get(promptId);
    if (!targetVersion) {
      throw new AIGatewayConfigurationError(
        `No default version configured for prompt '${promptId}'`,
      );
    }

    const prompt = versions.get(targetVersion);
    if (!prompt) {
      throw new AIGatewayConfigurationError(
        `Unknown version '${targetVersion}' for prompt '${promptId}'`,
      );
    }

    return prompt;
  }

  /**
   * Checks whether a prompt identifier (and optional version) is registered.
   */
  hasPrompt(promptId: string, version?: string): boolean {
    const versions = this.definitions.get(promptId);
    if (!versions) return false;
    if (version !== undefined) {
      return versions.has(version);
    }
    return true;
  }

  /**
   * Returns all registered prompt definitions across all versions.
   */
  listPrompts(): readonly PromptDefinition[] {
    const list: PromptDefinition[] = [];
    for (const versionMap of this.definitions.values()) {
      for (const def of versionMap.values()) {
        list.push(def);
      }
    }
    return Object.freeze(list);
  }
}

/** Global singleton prompt registry */
export const promptRegistry = new PromptRegistry();
