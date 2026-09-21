import type { PrismaClient, Prisma } from "@prisma/client";
import {
  type IUserRepository,
  PrismaUserRepository,
} from "../../modules/users/user.repository.js";
import {
  type ICredentialRepository,
  PrismaCredentialRepository,
} from "../../modules/auth/credential.repository.js";
import {
  type IRoleRepository,
  PrismaRoleRepository,
} from "../../modules/auth/role.repository.js";
import {
  type IRefreshSessionRepository,
  PrismaRefreshSessionRepository,
} from "../../modules/auth/refresh-session.repository.js";
import {
  type IAuditRepository,
  PrismaAuditRepository,
} from "../../modules/auth/audit.repository.js";
import {
  type IAcademyCourseRepository,
  type IAcademyQuizRepository,
  type IAcademyProgressRepository,
  type IAcademyRewardRepository,
  PrismaAcademyCourseRepository,
  PrismaAcademyQuizRepository,
  PrismaAcademyProgressRepository,
  PrismaAcademyRewardRepository,
} from "../../modules/academy/academy.repository.js";
import {
  type ISimulationScenarioRepository,
  type ISimulationAssetRepository,
  type ISimulationMarketSnapshotRepository,
  type ISimulationSessionRepository,
  type ISimulationPortfolioRepository,
  type ISimulationOrderRepository,
  type ISimulationTradeRepository,
  PrismaSimulationScenarioRepository,
  PrismaSimulationAssetRepository,
  PrismaSimulationMarketSnapshotRepository,
  PrismaSimulationSessionRepository,
  PrismaSimulationPortfolioRepository,
  PrismaSimulationOrderRepository,
  PrismaSimulationTradeRepository,
} from "../../modules/simulation/simulation.repository.js";
import {
  type ICommunityPostRepository,
  type ICommunityCommentRepository,
  type ICommunityPostLikeRepository,
  PrismaCommunityPostRepository,
  PrismaCommunityCommentRepository,
  PrismaCommunityPostLikeRepository,
} from "../../modules/community/community.repository.js";
import {
  type ISubscriptionRepository,
  type ISubscriptionProviderEventRepository,
  type ISubscriptionTransitionRepository,
  PrismaSubscriptionRepository,
  PrismaSubscriptionProviderEventRepository,
  PrismaSubscriptionTransitionRepository,
} from "../../modules/subscription/subscription.repository.js";

/**
 * Shared container representing all domain repository instances bound to a specific
 * persistence client (either the root PrismaClient or a scoped Prisma.TransactionClient).
 */
export interface IRepositoryContainer {
  readonly userRepo: IUserRepository;
  readonly credentialRepo: ICredentialRepository;
  readonly roleRepo: IRoleRepository;
  readonly refreshSessionRepo: IRefreshSessionRepository;
  readonly sessionRepo: IRefreshSessionRepository;
  readonly auditRepo: IAuditRepository;
  readonly academyCourseRepo: IAcademyCourseRepository;
  readonly academyQuizRepo: IAcademyQuizRepository;
  readonly academyProgressRepo: IAcademyProgressRepository;
  readonly academyRewardRepo: IAcademyRewardRepository;
  // Phase 5 Simulation repositories
  readonly simulationScenarioRepo: ISimulationScenarioRepository;
  readonly simulationAssetRepo: ISimulationAssetRepository;
  readonly simulationSnapshotRepo: ISimulationMarketSnapshotRepository;
  readonly simulationMarketSnapshotRepo: ISimulationMarketSnapshotRepository;
  readonly simulationSessionRepo: ISimulationSessionRepository;
  readonly simulationPortfolioRepo: ISimulationPortfolioRepository;
  readonly simulationOrderRepo: ISimulationOrderRepository;
  readonly simulationTradeRepo: ISimulationTradeRepository;
  // Phase 6 Community repositories
  readonly communityPostRepo: ICommunityPostRepository;
  readonly communityCommentRepo: ICommunityCommentRepository;
  readonly communityPostLikeRepo: ICommunityPostLikeRepository;
  // Phase 7 Subscription repositories
  readonly subscriptionRepo: ISubscriptionRepository;
  readonly subscriptionProviderEventRepo: ISubscriptionProviderEventRepository;
  readonly subscriptionTransitionRepo: ISubscriptionTransitionRepository;
}

/**
 * Factory function to instantiate repositories bound to a given database client.
 * When called with a TransactionClient, all created repositories will participate in that transaction.
 * When called without arguments or with root PrismaClient, repositories use root client.
 */
export function createRepositoryContainer(
  client?: PrismaClient | Prisma.TransactionClient,
): IRepositoryContainer {
  const refreshSessionRepo = new PrismaRefreshSessionRepository(client);
  const simulationSnapshotRepo = new PrismaSimulationMarketSnapshotRepository(client);
  return {
    userRepo: new PrismaUserRepository(client),
    credentialRepo: new PrismaCredentialRepository(client),
    roleRepo: new PrismaRoleRepository(client),
    refreshSessionRepo,
    sessionRepo: refreshSessionRepo,
    auditRepo: new PrismaAuditRepository(client),
    academyCourseRepo: new PrismaAcademyCourseRepository(client),
    academyQuizRepo: new PrismaAcademyQuizRepository(client),
    academyProgressRepo: new PrismaAcademyProgressRepository(client),
    academyRewardRepo: new PrismaAcademyRewardRepository(client),
    // Phase 5 Simulation repositories
    simulationScenarioRepo: new PrismaSimulationScenarioRepository(client),
    simulationAssetRepo: new PrismaSimulationAssetRepository(client),
    simulationSnapshotRepo,
    simulationMarketSnapshotRepo: simulationSnapshotRepo,
    simulationSessionRepo: new PrismaSimulationSessionRepository(client),
    simulationPortfolioRepo: new PrismaSimulationPortfolioRepository(client),
    simulationOrderRepo: new PrismaSimulationOrderRepository(client),
    simulationTradeRepo: new PrismaSimulationTradeRepository(client),
    // Phase 6 Community repositories
    communityPostRepo: new PrismaCommunityPostRepository(client),
    communityCommentRepo: new PrismaCommunityCommentRepository(client),
    communityPostLikeRepo: new PrismaCommunityPostLikeRepository(client),
    // Phase 7 Subscription repositories
    subscriptionRepo: new PrismaSubscriptionRepository(client),
    subscriptionProviderEventRepo: new PrismaSubscriptionProviderEventRepository(client),
    subscriptionTransitionRepo: new PrismaSubscriptionTransitionRepository(client),
  };
}

/**
 * Default singleton root repository container for non-transactional application use.
 */
export const rootRepositoryContainer = createRepositoryContainer();

export const userRepository = rootRepositoryContainer.userRepo;
export const credentialRepository = rootRepositoryContainer.credentialRepo;
export const roleRepository = rootRepositoryContainer.roleRepo;
export const refreshSessionRepository = rootRepositoryContainer.refreshSessionRepo;
export const auditRepository = rootRepositoryContainer.auditRepo;
export const academyCourseRepository = rootRepositoryContainer.academyCourseRepo;
export const academyQuizRepository = rootRepositoryContainer.academyQuizRepo;
export const academyProgressRepository = rootRepositoryContainer.academyProgressRepo;
export const academyRewardRepository = rootRepositoryContainer.academyRewardRepo;

// Phase 5 Simulation repository singletons
export const simulationScenarioRepository = rootRepositoryContainer.simulationScenarioRepo;
export const simulationAssetRepository = rootRepositoryContainer.simulationAssetRepo;
export const simulationSnapshotRepository = rootRepositoryContainer.simulationSnapshotRepo;
export const simulationMarketSnapshotRepository = rootRepositoryContainer.simulationMarketSnapshotRepo;
export const simulationSessionRepository = rootRepositoryContainer.simulationSessionRepo;
export const simulationPortfolioRepository = rootRepositoryContainer.simulationPortfolioRepo;
export const simulationOrderRepository = rootRepositoryContainer.simulationOrderRepo;
export const simulationTradeRepository = rootRepositoryContainer.simulationTradeRepo;

// Phase 6 Community repository singletons
export const communityPostRepository = rootRepositoryContainer.communityPostRepo;
export const communityCommentRepository = rootRepositoryContainer.communityCommentRepo;
export const communityPostLikeRepository = rootRepositoryContainer.communityPostLikeRepo;

// Phase 7 Subscription repository singletons
export const subscriptionRepository = rootRepositoryContainer.subscriptionRepo;
export const subscriptionProviderEventRepository = rootRepositoryContainer.subscriptionProviderEventRepo;
export const subscriptionTransitionRepository = rootRepositoryContainer.subscriptionTransitionRepo;

