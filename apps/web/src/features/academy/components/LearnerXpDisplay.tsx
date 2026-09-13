import type { FC } from "react";

export interface LearnerXpDisplayProps {
  totalXp?: number;
  className?: string;
  loading?: boolean;
}

/**
 * Lightweight, strictly read-only learner XP display component.
 * AC-015, AC-026: Renders server-provided total XP only.
 * Does NOT calculate XP, does NOT calculate level, does NOT grant rewards.
 */
export const LearnerXpDisplay: FC<LearnerXpDisplayProps> = ({
  totalXp = 0,
  className = "",
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium animate-pulse ${className}`}
        data-testid="learner-xp-loading"
      >
        <span className="text-amber-500">⚡</span>
        <span>Loading XP...</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold shadow-sm ${className}`}
      data-testid="learner-xp-display"
    >
      <span className="text-amber-500" aria-hidden="true">
        ⚡
      </span>
      <span data-testid="learner-xp-value">{totalXp} XP</span>
    </div>
  );
};
