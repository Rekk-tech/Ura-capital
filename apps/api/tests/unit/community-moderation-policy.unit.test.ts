import { describe, it, expect } from "vitest";
import {
  ALLOWED_STATUS_TRANSITIONS,
  isValidModerationTransition,
  assertValidModerationTransition,
  isTerminalModerationStatus,
  isVisibleToLearner,
  canLearnerRemoveContent,
  InvalidModerationTransitionError,
} from "../../src/modules/community/community-moderation.policy.js";
import type { CommunityModerationStatus } from "../../src/modules/community/community.types.js";

describe("FEAT-045 Community Moderation Policy (Unit)", () => {
  // AC-001: The complete status set remains VISIBLE, HIDDEN, REMOVED
  it("enforces that the complete status set remains VISIBLE, HIDDEN, and REMOVED (AC-001)", () => {
    const statuses: CommunityModerationStatus[] = ["VISIBLE", "HIDDEN", "REMOVED"];
    expect(Object.keys(ALLOWED_STATUS_TRANSITIONS).sort()).toEqual(statuses.sort());
  });

  // AC-002: Approved transitions are enforced and REMOVED is terminal
  describe("Status Transitions & Terminal REMOVED (AC-002)", () => {
    it("allows VISIBLE -> HIDDEN and VISIBLE -> REMOVED", () => {
      expect(isValidModerationTransition("VISIBLE", "HIDDEN")).toBe(true);
      expect(isValidModerationTransition("VISIBLE", "REMOVED")).toBe(true);
      expect(() => assertValidModerationTransition("VISIBLE", "HIDDEN")).not.toThrow();
      expect(() => assertValidModerationTransition("VISIBLE", "REMOVED")).not.toThrow();
    });

    it("allows HIDDEN -> VISIBLE and HIDDEN -> REMOVED", () => {
      expect(isValidModerationTransition("HIDDEN", "VISIBLE")).toBe(true);
      expect(isValidModerationTransition("HIDDEN", "REMOVED")).toBe(true);
      expect(() => assertValidModerationTransition("HIDDEN", "VISIBLE")).not.toThrow();
      expect(() => assertValidModerationTransition("HIDDEN", "REMOVED")).not.toThrow();
    });

    it("enforces that REMOVED is terminal with zero outbound transitions", () => {
      expect(isTerminalModerationStatus("REMOVED")).toBe(true);
      expect(isTerminalModerationStatus("VISIBLE")).toBe(false);
      expect(isTerminalModerationStatus("HIDDEN")).toBe(false);

      expect(isValidModerationTransition("REMOVED", "VISIBLE")).toBe(false);
      expect(isValidModerationTransition("REMOVED", "HIDDEN")).toBe(false);
      expect(isValidModerationTransition("REMOVED", "REMOVED")).toBe(false);

      expect(() => assertValidModerationTransition("REMOVED", "VISIBLE")).toThrow(
        InvalidModerationTransitionError,
      );
      expect(() => assertValidModerationTransition("REMOVED", "HIDDEN")).toThrow(
        InvalidModerationTransitionError,
      );
    });

    it("disallows identity transitions (VISIBLE -> VISIBLE, HIDDEN -> HIDDEN)", () => {
      expect(isValidModerationTransition("VISIBLE", "VISIBLE")).toBe(false);
      expect(isValidModerationTransition("HIDDEN", "HIDDEN")).toBe(false);
    });
  });

  // AC-009, AC-010: Ordinary reads return only visible content
  describe("Learner Visibility Predicates (AC-009, AC-010)", () => {
    it("returns true only for VISIBLE status", () => {
      expect(isVisibleToLearner("VISIBLE")).toBe(true);
      expect(isVisibleToLearner("HIDDEN")).toBe(false);
      expect(isVisibleToLearner("REMOVED")).toBe(false);
    });
  });

  // AC-003: Owner deletes can request only the server-owned remove operation on VISIBLE content
  describe("Owner Removal Policy (AC-003)", () => {
    it("permits learner removal only on VISIBLE content in Phase 6 Option A", () => {
      expect(canLearnerRemoveContent("VISIBLE")).toBe(true);
      expect(canLearnerRemoveContent("HIDDEN")).toBe(false);
      expect(canLearnerRemoveContent("REMOVED")).toBe(false);
    });
  });
});
