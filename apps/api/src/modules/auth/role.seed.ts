import { CANONICAL_ROLES, type RoleCode, isRoleCode } from "./authorization.constants.js";
import {
  type IRoleRepository,
  type RoleEntity,
  type UserRoleEntity,
  roleRepository,
} from "./role.repository.js";
import {
  type IAuditRepository,
} from "./audit.repository.js";
import { type IUserRepository, userRepository } from "../users/user.repository.js";
import { type AuditService, auditService as defaultAuditService } from "./audit.service.js";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_OUTCOMES,
  type OperationSource,
  OPERATION_SOURCES,
} from "./audit-event.constants.js";
import {
  type ITransactionRunner,
  transactionRunner as defaultTransactionRunner,
} from "../../infrastructure/database/transaction-runner.js";
import {
  createRepositoryContainer,
} from "../../infrastructure/database/repository-factory.js";

export interface SeedRolesResult {
  roles: RoleEntity[];
}

export interface AssignRoleInput {
  userId: string;
  roleCode: RoleCode;
  operatorUserId?: string | null;
  operationSource?: OperationSource;
  requestId?: string | null;
  userAgent?: string | null;
}

export interface RemoveRoleInput {
  userId: string;
  roleCode: RoleCode;
  operatorUserId?: string | null;
  operationSource?: OperationSource;
  requestId?: string | null;
  userAgent?: string | null;
}

export type RoleAssignmentRepoFactory = (client?: unknown) => {
  roleRepo: IRoleRepository;
  auditRepo: IAuditRepository;
};

export const defaultRoleAssignmentRepoFactory: RoleAssignmentRepoFactory = (client) => {
  const container = createRepositoryContainer(client as Parameters<typeof createRepositoryContainer>[0]);
  return {
    roleRepo: container.roleRepo,
    auditRepo: container.auditRepo,
  };
};

/**
 * Idempotently seeds canonical roles (USER, ADMIN) into PostgreSQL.
 * Safe to run repeatedly across test, CI, development, and production environments.
 * Strictly creates roles only: creates NO users, NO credentials, and NO default admin assignments.
 */
export async function seedCanonicalRoles(
  roleRepo: IRoleRepository = roleRepository,
): Promise<SeedRolesResult> {
  const seededRoles: RoleEntity[] = [];

  for (const roleCode of CANONICAL_ROLES) {
    const description = roleCode === "ADMIN" ? "Administrator with full system privileges" : "Standard platform user";
    const role = await roleRepo.ensureRoleExists(roleCode, description);
    seededRoles.push(role);
  }

  return { roles: seededRoles };
}

/**
 * Server-side operational role provisioning boundary for explicitly assigning canonical roles to existing users.
 * Strictly requires an existing user in PostgreSQL and an allowlisted canonical RoleCode.
 * Transactionally coupled: UserRole and ROLE_ASSIGNED audit row commit inside ONE PostgreSQL transaction.
 * If audit insert fails, the entire transaction rolls back and the grant never commits.
 * Has NO public HTTP API authority and accepts NO browser/client input.
 */
export async function assignRoleToExistingUser(
  input: AssignRoleInput,
  userRepo: IUserRepository = userRepository,
  roleRepo: IRoleRepository = roleRepository,
  txRunner: ITransactionRunner = defaultTransactionRunner,
  repoFactory: RoleAssignmentRepoFactory = defaultRoleAssignmentRepoFactory,
): Promise<UserRoleEntity> {
  // 1. Validate canonical role allowlist
  if (!isRoleCode(input.roleCode)) {
    throw new Error(`[INVALID_ROLE_CODE] Cannot assign non-canonical role: ${String(input.roleCode)}`);
  }

  // 2. Validate target user exists in PostgreSQL
  const user = await userRepo.findById(input.userId);
  if (!user) {
    throw new Error(`[USER_NOT_FOUND] Cannot assign role to non-existent user: ${input.userId}`);
  }

  // 3. Ensure role entity exists in PostgreSQL
  const role = await roleRepo.findByName(input.roleCode);
  if (!role) {
    throw new Error(`[ROLE_NOT_FOUND] Target role ${input.roleCode} is not initialized in database`);
  }

  // 4. Idempotency check: if user already has this role, return existing assignment
  const existingRoles = await roleRepo.getUserRoles(user.id);
  const alreadyAssigned = existingRoles.find((r) => r.id === role.id);
  if (alreadyAssigned) {
    return {
      id: `${user.id}:${role.id}`,
      userId: user.id,
      roleId: role.id,
      createdAt: new Date(),
    };
  }

  // 5. Atomic persistence of UserRole assignment + ROLE_ASSIGNED audit record inside a single database transaction runner
  return await txRunner.run(async (ctx) => {
    const repos = typeof repoFactory === "function" ? repoFactory(ctx.tx) : ctx.repositories;
    const userRole = await repos.roleRepo.assignRoleToUser(user.id, role.id, ctx.tx);

    await repos.auditRepo.create(
      {
        eventType: AUDIT_EVENT_TYPES.ROLE_ASSIGNED,
        outcome: AUDIT_OUTCOMES.SUCCESS,
        actorUserId: input.operatorUserId || null,
        subjectUserId: user.id,
        requestId: input.requestId || null,
        userAgent: input.userAgent || null,
        metadata: {
          roleCode: input.roleCode,
          operationSource: input.operationSource || OPERATION_SOURCES.OPERATOR,
        },
      },
      ctx.tx,
    );

    return userRole;
  });
}

/**
 * Server-side operational role removal boundary for removing canonical roles from users.
 * Security-state-first: role removal remains committed even if audit recording encounters an error.
 */
export async function removeRoleFromExistingUser(
  input: RemoveRoleInput,
  userRepo: IUserRepository = userRepository,
  roleRepo: IRoleRepository = roleRepository,
  auditSvc?: AuditService,
): Promise<{ removed: boolean }> {
  const actualAuditSvc = auditSvc ?? (roleRepo === roleRepository ? defaultAuditService : undefined);

  if (!isRoleCode(input.roleCode)) {
    throw new Error(`[INVALID_ROLE_CODE] Cannot remove non-canonical role: ${String(input.roleCode)}`);
  }

  const user = await userRepo.findById(input.userId);
  if (!user) {
    throw new Error(`[USER_NOT_FOUND] Cannot remove role from non-existent user: ${input.userId}`);
  }

  const role = await roleRepo.findByName(input.roleCode);
  if (!role) {
    return { removed: false };
  }

  await roleRepo.removeRoleFromUser(user.id, role.id);

  if (actualAuditSvc) {
    await actualAuditSvc.recordRoleRemoved({
      targetUserId: user.id,
      roleCode: input.roleCode,
      operatorUserId: input.operatorUserId || null,
      operationSource: input.operationSource || OPERATION_SOURCES.OPERATOR,
      requestId: input.requestId,
      userAgent: input.userAgent,
    });
  }

  return { removed: true };
}
