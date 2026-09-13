import {
  ACADEMY_XP_POLICY,
  ACADEMY_REWARD_TYPES,
  ACADEMY_SOURCE_TYPES,
  ACADEMY_RESOURCE_TYPES,
  type AcademyCompletionFact,
  type LearnerXpDto,
  type RewardReconciliationResult,
  deriveRewardIdempotencyKey,
} from "@aura/shared";
import type {
  IAcademyRewardRepository,
  IAcademyProgressRepository,
} from "./academy.repository.js";
import type { ITransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { transactionRunner as defaultTransactionRunner } from "../../infrastructure/database/transaction-runner.js";
import { toLearnerXpDto } from "./academy.dto.js";
import { sanitizeRewardMetadata } from "./academy.validation.js";

export class AcademyRewardService {
  constructor(
    private readonly rewardRepo: IAcademyRewardRepository,
    private readonly progressRepo: IAcademyProgressRepository,
    private readonly txRunner: ITransactionRunner = defaultTransactionRunner,
  ) {}

  /**
   * Reads authenticated current-user total XP with server-authoritative projection.
   * AC-013, AC-016, AC-026: Minimal safe DTO with totalXp only. Zero level leakage.
   * Zero automatic backfill on read.
   */
  async getMyXp(userId: string): Promise<LearnerXpDto> {
    const userXp = await this.rewardRepo.getUserXp(userId);
    return toLearnerXpDto(userXp?.totalXp ?? 0);
  }

  /**
   * Reconciles server-authoritative XP reward for an Academy completion fact.
   *
   * Architectural & Domain Guarantees:
   * 1. Server Authority (AC-002): Client has zero authority over XP amount or identity.
   * 2. Durable Eligibility (AC-002, AC-003, AC-025): Verified against durable PostgreSQL
   *    completion records (status === 'COMPLETED' or completedAt !== null).
   *    fact.isFirstCompletion is only an execution hint, NOT durable authority.
   * 3. Policy (AC-004, AC-005, AC-010):
   *    - Lesson completion: +10 XP (ACADEMY_SOURCE_TYPES.LESSON_COMPLETION, rewardType 'XP')
   *    - Course completion: +50 XP (ACADEMY_SOURCE_TYPES.COURSE_COMPLETION, rewardType 'XP')
   *    - Failed/repeated quiz: 0 XP
   * 4. Atomic Transaction (AC-006, AC-007):
   *    Ledger creation and XP aggregate mutation occur in one UnitOfWork / TransactionRunner boundary.
   *    Any failure rolls back both.
   * 5. Idempotent Replay & Concurrency (AC-008, AC-009, AC-017):
   *    PostgreSQL advisory lock + unique constraints ensure single ledger row and single XP increment.
   *    Replays return existing reward outcome without duplicate XP increments.
   * 6. Level Mechanics Deferred (AC-026):
   *    totalXp is the sole Phase-4 progression authority; level is never mutated via invented formula.
   */
  async reconcileRewardForCompletion(
    userId: string,
    fact: AcademyCompletionFact,
    metadata?: Record<string, unknown>,
  ): Promise<RewardReconciliationResult | null> {
    if (!fact || fact.userId !== userId) {
      return null;
    }

    // 1. Verify durable eligibility and determine canonical policy values
    let amount: number;
    let sourceType: string;
    const rewardType = ACADEMY_REWARD_TYPES.XP;

    if (fact.resourceType === ACADEMY_RESOURCE_TYPES.LESSON) {
      const lessonProgress = await this.progressRepo.findLessonProgress(
        userId,
        fact.resourceId,
      );
      const isEligible =
        lessonProgress !== null &&
        (lessonProgress.status === "COMPLETED" ||
          lessonProgress.completedAt !== null);

      if (!isEligible) {
        return null;
      }
      amount = ACADEMY_XP_POLICY.LESSON_FIRST_COMPLETION_XP; // 10
      sourceType = ACADEMY_SOURCE_TYPES.LESSON_COMPLETION;
    } else if (fact.resourceType === ACADEMY_RESOURCE_TYPES.COURSE) {
      const courseProgress = await this.progressRepo.findCourseProgress(
        userId,
        fact.resourceId,
      );
      const isEligible =
        courseProgress !== null &&
        (courseProgress.status === "COMPLETED" ||
          courseProgress.completedAt !== null);

      if (!isEligible) {
        return null;
      }
      amount = ACADEMY_XP_POLICY.COURSE_FIRST_COMPLETION_XP; // 50
      sourceType = ACADEMY_SOURCE_TYPES.COURSE_COMPLETION;
    } else {
      return null;
    }

    // 2. Canonical deterministic idempotency identity
    const idempotencyKey = deriveRewardIdempotencyKey(
      userId,
      sourceType,
      fact.resourceId,
      rewardType,
    );

    const sanitizedMeta = sanitizeRewardMetadata(metadata);

    // 3. Coordinate atomic ledger insertion and XP aggregate mutation in one transaction
    return await this.txRunner.run(async (ctx) => {
      const repo = ctx.repositories.academyRewardRepo;

      // Safe concurrency-locked insert with existing duplicate detection
      const ledgerResult = await repo.recordRewardSafe({
        userId,
        sourceType,
        sourceId: fact.resourceId,
        rewardType,
        amount,
        idempotencyKey,
        status: "APPLIED",
        metadata: sanitizedMeta,
      });

      if (ledgerResult.isDuplicate) {
        // Idempotent replay: return existing ledger outcome with zero XP increment
        const existingXp = await repo.getUserXp(userId);
        return {
          rewardLedgerId: ledgerResult.reward.id,
          userId,
          sourceType,
          sourceId: fact.resourceId,
          rewardType,
          amount: ledgerResult.reward.amount,
          isDuplicate: true,
          totalXp: existingXp?.totalXp ?? 0,
        };
      }

      // New reward granted: atomically increment totalXp exactly once
      const updatedXp = await repo.upsertUserXp(userId, amount);

      return {
        rewardLedgerId: ledgerResult.reward.id,
        userId,
        sourceType,
        sourceId: fact.resourceId,
        rewardType,
        amount,
        isDuplicate: false,
        totalXp: updatedXp.totalXp,
      };
    });
  }

  /**
   * Reconciles rewards for a batch of completion facts sequentially.
   */
  async reconcileRewardsForFacts(
    userId: string,
    facts: AcademyCompletionFact[],
    metadata?: Record<string, unknown>,
  ): Promise<RewardReconciliationResult[]> {
    const results: RewardReconciliationResult[] = [];
    for (const fact of facts) {
      const outcome = await this.reconcileRewardForCompletion(
        userId,
        fact,
        metadata,
      );
      if (outcome) {
        results.push(outcome);
      }
    }
    return results;
  }
}
