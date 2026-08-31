import type { PrismaClient, Prisma } from "@prisma/client";
import { getPrismaClient } from "./prisma.js";
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

/**
 * Shared container representing all domain repository instances bound to a specific
 * persistence client (either the root PrismaClient or a scoped Prisma.TransactionClient).
 */
export interface IRepositoryContainer {
  readonly userRepo: IUserRepository;
  readonly credentialRepo: ICredentialRepository;
  readonly roleRepo: IRoleRepository;
  readonly refreshSessionRepo: IRefreshSessionRepository;
  readonly auditRepo: IAuditRepository;
}

/**
 * Factory function to instantiate repositories bound to a given database client.
 * When called with a TransactionClient, all created repositories will participate in that transaction.
 * When called without arguments or with root PrismaClient, repositories use root client.
 */
export function createRepositoryContainer(
  client: PrismaClient | Prisma.TransactionClient = getPrismaClient(),
): IRepositoryContainer {
  return {
    userRepo: new PrismaUserRepository(client),
    credentialRepo: new PrismaCredentialRepository(client),
    roleRepo: new PrismaRoleRepository(client),
    refreshSessionRepo: new PrismaRefreshSessionRepository(client),
    auditRepo: new PrismaAuditRepository(client),
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

