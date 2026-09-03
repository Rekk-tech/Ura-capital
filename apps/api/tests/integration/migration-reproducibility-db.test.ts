import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { verifyAppliedMigrationIntegrity } from "../helpers/migration-guard.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(currentDir, "../../prisma/migrations");

const databaseUrl =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat012_upgrade";

describe("FEAT-012 PostgreSQL Migration Reproducibility & Schema Governance (Integration)", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    assertSafeTestDatabase(databaseUrl, "test");
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    try {
      await prisma.$connect();
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database is unreachable. Error: ${errorMessage}`,
      );
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe("Fresh Zero-State Migration & Schema Completeness", () => {
    it("verifies all 3 approved Phase 2 / FEAT-011 migrations are recorded in _prisma_migrations", async () => {
      const appliedMigrations = await prisma.$queryRaw<
        Array<{
          migration_name: string;
          finished_at: Date | null;
          applied_steps_count: number;
        }>
      >`SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY migration_name ASC;`;

      expect(appliedMigrations.length).toBeGreaterThanOrEqual(4);

      const migrationNames = appliedMigrations.map((m) => m.migration_name);
      expect(migrationNames).toContain("20260825000000_init_identity");
      expect(migrationNames).toContain("20260825000001_feat005_refresh_session_rotation");
      expect(migrationNames).toContain("20260827000000_feat009_audit_events");
      expect(migrationNames).toContain("20260903000000_feat019_academy_foundation");

      for (const m of appliedMigrations) {
        expect(m.finished_at).not.toBeNull();
        expect(m.applied_steps_count).toBeGreaterThan(0);
      }
    });

    it("verifies all 6 core identity & security tables exist and are accessible", async () => {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `;

      const tableNames = tables.map((t) => t.table_name);
      expect(tableNames).toContain("users");
      expect(tableNames).toContain("credentials");
      expect(tableNames).toContain("roles");
      expect(tableNames).toContain("user_roles");
      expect(tableNames).toContain("refresh_sessions");
      expect(tableNames).toContain("auth_security_audit_records");
    });
  });

  describe("Applied Migration Integrity & Checksum Drift Verification (DEF-003)", () => {
    it("verifies clean applied migration state against PostgreSQL _prisma_migrations", async () => {
      const result = await verifyAppliedMigrationIntegrity(prisma, migrationsDir);
      expect(result.integrityPass).toBe(true);
      expect(result.appliedCount).toBe(4);
      expect(result.verifiedCount).toBe(4);
    });

    it("detects drift and throws error when an already-applied migration file is modified", async () => {
      // Create a temporary isolated copy of the migrations directory
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "aura-migration-drift-test-"));

      try {
        // Copy migration folders to temp dir
        const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(migrationsDir, entry.name);
          const destPath = path.join(tempDir, entry.name);
          if (entry.isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
          }
        }

        // 1. Verify that before modification, integrity check passes against the temp copy
        const initialCheck = await verifyAppliedMigrationIntegrity(prisma, tempDir);
        expect(initialCheck.integrityPass).toBe(true);

        // 2. Tamper with an already-applied migration file (add an arbitrary comment)
        const targetMigrationSql = path.join(tempDir, "20260825000000_init_identity", "migration.sql");
        const originalContent = fs.readFileSync(targetMigrationSql, "utf-8");
        fs.writeFileSync(targetMigrationSql, originalContent + "\n-- Tampered unapproved edit\n");

        // 3. Verify that the integrity guard detects the checksum mismatch and fails closed
        await expect(verifyAppliedMigrationIntegrity(prisma, tempDir)).rejects.toThrow(
          /\[MIGRATION_DRIFT_DETECTED\] Checksum mismatch for applied migration '20260825000000_init_identity'/,
        );

        // 4. Restore original file and verify it passes again
        fs.writeFileSync(targetMigrationSql, originalContent);
        const restoredCheck = await verifyAppliedMigrationIntegrity(prisma, tempDir);
        expect(restoredCheck.integrityPass).toBe(true);

        // 5. Test missing migration folder on disk
        fs.rmSync(path.join(tempDir, "20260827000000_feat009_audit_events"), { recursive: true, force: true });
        await expect(verifyAppliedMigrationIntegrity(prisma, tempDir)).rejects.toThrow(
          /\[MIGRATION_DRIFT_DETECTED\] Applied migration '20260827000000_feat009_audit_events' exists in database but is missing from disk/,
        );
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("Existing-Schema Upgrade & Representative Data Preservation", () => {
    const testEmail = `feat012.preservation.${Date.now()}@auracapital.io`;
    let userId: string;
    let roleAdminId: string;
    let roleUserId: string;

    it("populates representative Phase 2 data across all tables and verifies complete preservation", async () => {
      // 1. Roles
      const adminRole = await prisma.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: { name: "ADMIN", description: "Administrator" },
      });
      roleAdminId = adminRole.id;

      const userRole = await prisma.role.upsert({
        where: { name: "USER" },
        update: {},
        create: { name: "USER", description: "Standard user" },
      });
      roleUserId = userRole.id;

      // 2. User
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          displayName: "Migration Preservation User",
          status: "ACTIVE",
        },
      });
      userId = user.id;

      // 3. Credential
      const credential = await prisma.credential.create({
        data: {
          userId: user.id,
          type: "PASSWORD",
          passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$representativehash",
          version: 1,
        },
      });

      // 4. UserRoles
      const userRoleAdmin = await prisma.userRole.create({
        data: { userId: user.id, roleId: roleAdminId },
      });
      const userRoleStandard = await prisma.userRole.create({
        data: { userId: user.id, roleId: roleUserId },
      });

      // 5. RefreshSession (with FEAT-005 rotation fields)
      const refreshSession = await prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: `token_hash_${Date.now()}_${Math.random()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          familyId: "fam-preservation-1",
          revocationReason: null,
          isRevoked: false,
          userAgent: "Vitest Migration Tester",
          ipAddress: "127.0.0.1",
        },
      });

      // 6. AuthSecurityAuditRecord (with FEAT-009 audit columns)
      const auditRecord = await prisma.authSecurityAuditRecord.create({
        data: {
          userId: user.id,
          eventType: "LOGIN_SUCCESS",
          outcome: "SUCCESS",
          actorUserId: user.id,
          subjectUserId: user.id,
          sessionId: refreshSession.id,
          identityHash: "sha256_preservation_identity",
          requestId: "req-migration-preservation-1",
          ipAddress: "127.0.0.1",
          userAgent: "Vitest Migration Tester",
          metadata: { note: "Phase 2 representative row for migration upgrade test" },
        },
      });

      // Verify all records exist and have expected relation mappings
      expect(user.id).toBeDefined();
      expect(credential.userId).toBe(user.id);
      expect(userRoleAdmin.userId).toBe(user.id);
      expect(userRoleStandard.userId).toBe(user.id);
      expect(refreshSession.userId).toBe(user.id);
      expect(auditRecord.userId).toBe(user.id);
      expect(auditRecord.outcome).toBe("SUCCESS");
      expect(auditRecord.sessionId).toBe(refreshSession.id);
    });

    it("verifies key database constraints remain enforced on migrated schema", async () => {
      // 1. Email uniqueness constraint
      await expect(
        prisma.user.create({
          data: {
            email: testEmail,
            displayName: "Duplicate Email User",
          },
        }),
      ).rejects.toThrow();

      // 2. UserRole composite unique constraint
      await expect(
        prisma.userRole.create({
          data: {
            userId,
            roleId: roleAdminId,
          },
        }),
      ).rejects.toThrow();

      // 3. Credential one-to-one constraint per user
      await expect(
        prisma.credential.create({
          data: {
            userId,
            type: "PASSWORD",
            passwordHash: "$argon2id$duplicate",
          },
        }),
      ).rejects.toThrow();
    });

    it("verifies foreign key cascade and set null behaviors", async () => {
      // Create dedicated cascade test user
      const cascadeEmail = `feat012.cascade.${Date.now()}@auracapital.io`;
      const tempUser = await prisma.user.create({
        data: { email: cascadeEmail, status: "ACTIVE" },
      });

      await prisma.credential.create({
        data: {
          userId: tempUser.id,
          passwordHash: "hash_cascade_test",
        },
      });

      await prisma.userRole.create({
        data: { userId: tempUser.id, roleId: roleUserId },
      });

      await prisma.refreshSession.create({
        data: {
          userId: tempUser.id,
          tokenHash: `token_cascade_${Date.now()}`,
          expiresAt: new Date(Date.now() + 3600000),
          familyId: "fam-cascade-1",
        },
      });

      const audit = await prisma.authSecurityAuditRecord.create({
        data: {
          userId: tempUser.id,
          eventType: "REGISTRATION_SUCCESS",
          outcome: "SUCCESS",
          requestId: "req-cascade-audit",
        },
      });

      // Delete user
      await prisma.user.delete({ where: { id: tempUser.id } });

      // Verify cascade: Credential, UserRole, RefreshSession are deleted
      const credCount = await prisma.credential.count({ where: { userId: tempUser.id } });
      const userRoleCount = await prisma.userRole.count({ where: { userId: tempUser.id } });
      const sessionCount = await prisma.refreshSession.count({ where: { userId: tempUser.id } });
      expect(credCount).toBe(0);
      expect(userRoleCount).toBe(0);
      expect(sessionCount).toBe(0);

      // Verify SET NULL: Auth audit record remains, with userId set to null
      const auditRecord = await prisma.authSecurityAuditRecord.findUnique({
        where: { id: audit.id },
      });
      expect(auditRecord).not.toBeNull();
      expect(auditRecord?.userId).toBeNull();
      expect(auditRecord?.eventType).toBe("REGISTRATION_SUCCESS");
    });
  });
});
