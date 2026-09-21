import type { CommunityModerationStatus } from "./community.types.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";

/**
 * Custom error thrown when an unapproved moderation status transition is attempted.
 */
export class InvalidModerationTransitionError extends AppError {
  constructor(from: CommunityModerationStatus, to: CommunityModerationStatus) {
    super(
      `Invalid moderation status transition from ${from} to ${to}`,
      ERROR_CODES.VALIDATION_ERROR,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

/**
 * Moderation Option A approved status transitions (FR-001..FR-003, AC-001, AC-002):
 * - VISIBLE -> HIDDEN (server-controlled moderation)
 * - VISIBLE -> REMOVED (owner deletion or server-controlled moderation)
 * - HIDDEN -> VISIBLE (server-controlled moderation restoration)
 * - HIDDEN -> REMOVED (server-controlled moderation deletion)
 * - REMOVED is terminal (no transitions permitted out of REMOVED)
 */
export const ALLOWED_STATUS_TRANSITIONS: Readonly<
  Record<CommunityModerationStatus, ReadonlySet<CommunityModerationStatus>>
> = {
  VISIBLE: new Set(["HIDDEN", "REMOVED"]),
  HIDDEN: new Set(["VISIBLE", "REMOVED"]),
  REMOVED: new Set([]), // Terminal
};

/**
 * Returns true if the transition from `from` to `to` is canonically approved.
 */
export function isValidModerationTransition(
  from: CommunityModerationStatus,
  to: CommunityModerationStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.has(to) ?? false;
}

/**
 * Asserts that the transition from `from` to `to` is valid; throws InvalidModerationTransitionError if not.
 */
export function assertValidModerationTransition(
  from: CommunityModerationStatus,
  to: CommunityModerationStatus,
): void {
  if (!isValidModerationTransition(from, to)) {
    throw new InvalidModerationTransitionError(from, to);
  }
}

/**
 * Returns true if the given moderation status is terminal (cannot transition to any other status).
 */
export function isTerminalModerationStatus(status: CommunityModerationStatus): boolean {
  return status === "REMOVED";
}

/**
 * Returns true if the content is visible to ordinary learners in feed, detail, or comment listings.
 */
export function isVisibleToLearner(status: CommunityModerationStatus): boolean {
  return status === "VISIBLE";
}

/**
 * Returns true if an ordinary learner owner is permitted to remove content in the given status.
 * Under Phase 6 Moderation Option A, learners may only remove their own VISIBLE content.
 */
export function canLearnerRemoveContent(status: CommunityModerationStatus): boolean {
  return status === "VISIBLE";
}
