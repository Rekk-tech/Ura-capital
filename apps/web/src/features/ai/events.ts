export type AiCoachContext = "MAP1" | "MAP2" | "GENERAL";

export const AURA_OPEN_AI_COACH_EVENT = "aura:open-ai-coach";

/**
 * Universally triggers the Aura Intelligence AI Learning Coach Co-Pilot.
 * Can be invoked from any component or page across the platform.
 */
export function openAiCoach(context: AiCoachContext = "GENERAL"): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(AURA_OPEN_AI_COACH_EVENT, { detail: { context } })
    );
  }
}
