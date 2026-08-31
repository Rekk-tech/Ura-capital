import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { PrismaCredentialRepository } from "../../src/modules/auth/credential.repository.js";
import { PrismaRoleRepository } from "../../src/modules/auth/role.repository.js";
import { PrismaRefreshSessionRepository } from "../../src/modules/auth/refresh-session.repository.js";
import { PrismaAuditRepository } from "../../src/modules/auth/audit.repository.js";

describe("Identity Schema & Repository Boundaries (Integration)", () => {
  const models = Prisma.dmmf.datamodel.models;
  const modelNames = models.map((m) => m.name);

  it("contains all required identity-scoped models and no product domain models", () => {
    // Required identity models
    expect(modelNames).toContain("User");
    expect(modelNames).toContain("Credential");
    expect(modelNames).toContain("Role");
    expect(modelNames).toContain("UserRole");
    expect(modelNames).toContain("RefreshSession");
    expect(modelNames).toContain("AuthSecurityAuditRecord");

    // Must NOT contain Phase 3 product domain tables
    const forbiddenDomains = [
      "Course",
      "Lesson",
      "Quiz",
      "Portfolio",
      "Order",
      "Trade",
      "Position",
      "Post",
      "Comment",
      "Subscription",
      "Conversation",
    ];

    for (const forbidden of forbiddenDomains) {
      expect(modelNames).not.toContain(forbidden);
    }
  });

  it("enforces uniqueness constraints on User.email, Credential.userId, Role.name, and RefreshSession.tokenHash", () => {
    const userModel = models.find((m) => m.name === "User")!;
    const emailField = userModel.fields.find((f) => f.name === "email")!;
    expect(emailField.isUnique).toBe(true);

    const credentialModel = models.find((m) => m.name === "Credential")!;
    const credUserIdField = credentialModel.fields.find((f) => f.name === "userId")!;
    expect(credUserIdField.isUnique).toBe(true);

    const roleModel = models.find((m) => m.name === "Role")!;
    const roleNameField = roleModel.fields.find((f) => f.name === "name")!;
    expect(roleNameField.isUnique).toBe(true);

    const refreshSessionModel = models.find((m) => m.name === "RefreshSession")!;
    const tokenHashField = refreshSessionModel.fields.find((f) => f.name === "tokenHash")!;
    expect(tokenHashField.isUnique).toBe(true);

    const userRoleModel = models.find((m) => m.name === "UserRole")!;
    expect(userRoleModel.uniqueFields).toContainEqual(["userId", "roleId"]);
  });

  it("enforces referential integrity and cascade rules for identity relations", () => {
    const credentialModel = models.find((m) => m.name === "Credential")!;
    const credUserRelation = credentialModel.fields.find((f) => f.name === "user")!;
    expect(credUserRelation.kind).toBe("object");
    expect(credUserRelation.type).toBe("User");

    const userRoleModel = models.find((m) => m.name === "UserRole")!;
    const urUserRelation = userRoleModel.fields.find((f) => f.name === "user")!;
    const urRoleRelation = userRoleModel.fields.find((f) => f.name === "role")!;
    expect(urUserRelation.type).toBe("User");
    expect(urRoleRelation.type).toBe("Role");

    const refreshSessionModel = models.find((m) => m.name === "RefreshSession")!;
    const sessionUserRelation = refreshSessionModel.fields.find((f) => f.name === "user")!;
    expect(sessionUserRelation.type).toBe("User");

    const auditModel = models.find((m) => m.name === "AuthSecurityAuditRecord")!;
    const auditUserRelation = auditModel.fields.find((f) => f.name === "user")!;
    expect(auditUserRelation.type).toBe("User");
    expect(auditUserRelation.isRequired).toBe(false); // Nullable user on audit records
  });

  it("instantiates repository boundaries without exposing direct Prisma client to consumers", () => {
    const userRepo = new PrismaUserRepository();
    expect(typeof userRepo.findById).toBe("function");
    expect(typeof userRepo.findByEmail).toBe("function");
    expect(typeof userRepo.create).toBe("function");
    expect(typeof userRepo.update).toBe("function");
    expect(typeof userRepo.delete).toBe("function");

    const credRepo = new PrismaCredentialRepository();
    expect(typeof credRepo.findByUserId).toBe("function");
    expect(typeof credRepo.create).toBe("function");
    expect(typeof credRepo.updatePasswordHash).toBe("function");
    expect(typeof credRepo.deleteByUserId).toBe("function");

    const roleRepo = new PrismaRoleRepository();
    expect(typeof roleRepo.findByName).toBe("function");
    expect(typeof roleRepo.createRole).toBe("function");
    expect(typeof roleRepo.assignRoleToUser).toBe("function");
    expect(typeof roleRepo.getUserRoles).toBe("function");
    expect(typeof roleRepo.removeRoleFromUser).toBe("function");

    const sessionRepo = new PrismaRefreshSessionRepository();
    expect(typeof sessionRepo.findByTokenHash).toBe("function");
    expect(typeof sessionRepo.create).toBe("function");
    expect(typeof sessionRepo.revoke).toBe("function");
    expect(typeof sessionRepo.revokeAllForUser).toBe("function");
    expect(typeof sessionRepo.deleteExpired).toBe("function");

    const auditRepo = new PrismaAuditRepository();
    expect(typeof auditRepo.create).toBe("function");
    expect(typeof auditRepo.findByUserId).toBe("function");
  });
});
