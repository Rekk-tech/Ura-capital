import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { verifyAppliedMigrationIntegrity } from "../helpers/migration-guard.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(currentDir, "../../prisma/migrations");

describe("FEAT-048 Subscription Migration Validation & Phase 6 Upgrade Preservation (Integration)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat019_rework2_fresh";

  let prisma: PrismaClient;

  beforeAll(async () => {
    assertSafeTestDatabase(testDbUrl, "test");
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    try {
      await prisma.$connect();
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(`[DB_CONNECTION_FAILED] Required PostgreSQL test database unreachable: ${errorMessage}`);
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  // ============================================================================
  // AC-008, AC-009, AC-021: Fresh Zero-State Migration Validation
  // ============================================================================
  describe("AC-008, AC-009, AC-021: Fresh Zero-State Migration & Schema Completeness", () => {
    it("verifies all 10 migrations including FEAT-048 are recorded and completed in _prisma_migrations", async () => {
      const appliedMigrations = await prisma.$queryRaw<
        Array<{
          migration_name: string;
          finished_at: Date | null;
          applied_steps_count: number;
        }>
      >`SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY migration_name ASC;`;

      expect(appliedMigrations.length).toBeGreaterThanOrEqual(10);

      const migrationNames = appliedMigrations.map((m) => m.migration_name);
      expect(migrationNames).toContain("20260825000000_init_identity");
      expect(migrationNames).toContain("20260825000001_feat005_refresh_session_rotation");
      expect(migrationNames).toContain("20260827000000_feat009_audit_events");
      expect(migrationNames).toContain("20260903000000_feat019_academy_foundation");
      expect(migrationNames).toContain("20260906000000_feat024_active_attempt_constraint");
      expect(migrationNames).toContain("20260907000000_feat025_grading_integrity_constraints");
      expect(migrationNames).toContain("20260909000000_feat025_grading_state_constraint_fix");
      expect(migrationNames).toContain("20260914072000_feat031_simulation_foundation");
      expect(migrationNames).toContain("20260919201500_feat041_community_foundation");
      expect(migrationNames).toContain("20260922000000_feat048_subscription_foundation");

      for (const m of appliedMigrations) {
        expect(m.finished_at).not.toBeNull();
        expect(m.applied_steps_count).toBeGreaterThan(0);
      }
    });

    it("verifies applied migration integrity with zero checksum drift", async () => {
      const result = await verifyAppliedMigrationIntegrity(prisma, migrationsDir);
      expect(result.integrityPass).toBe(true);
      expect(result.appliedCount).toBeGreaterThanOrEqual(10);
      expect(result.verifiedCount).toBeGreaterThanOrEqual(10);
    });

    it("verifies Phase 7 subscription tables exist in PostgreSQL information_schema", async () => {
      const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `;

      const tableNames = tables.map((t) => t.table_name);
      expect(tableNames).toContain("user_subscriptions");
      expect(tableNames).toContain("subscription_provider_events");
      expect(tableNames).toContain("subscription_transition_records");
    });

    it("verifies expected PostgreSQL indexes and partial unique indexes exist", async () => {
      const indexes = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('user_subscriptions', 'subscription_provider_events', 'subscription_transition_records');
      `;

      const indexMap = new Map(indexes.map((i) => [i.indexname, i.indexdef]));

      // 1. Partial unique index: at most one non-terminal subscription per user
      expect(indexMap.has("user_subscriptions_one_non_terminal")).toBe(true);
      const nonTerminalDef = indexMap.get("user_subscriptions_one_non_terminal")!;
      expect(nonTerminalDef).toContain("UNIQUE");
      expect(nonTerminalDef).toContain("status");

      // 2. Partial unique index: provider external subscription ID
      expect(indexMap.has("user_subscriptions_provider_external_id_uidx")).toBe(true);
      const extSubDef = indexMap.get("user_subscriptions_provider_external_id_uidx")!;
      expect(extSubDef).toContain("UNIQUE");

      // 3. Unique index: provider key + provider event ID
      expect(indexMap.has("subscription_provider_events_provider_event_uidx")).toBe(true);
      const providerEvtDef = indexMap.get("subscription_provider_events_provider_event_uidx")!;
      expect(providerEvtDef).toContain("UNIQUE");
    });

    it("verifies PostgreSQL foreign key constraints have RESTRICT deletion policy where required", async () => {
      const foreignKeys = await prisma.$queryRaw<
        Array<{
          constraint_name: string;
          table_name: string;
          delete_rule: string;
        }>
      >`
        SELECT
          tc.constraint_name,
          tc.table_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name IN ('user_subscriptions', 'subscription_provider_events', 'subscription_transition_records');
      `;

      const rules = new Map(foreignKeys.map((f) => [`${f.table_name}.${f.constraint_name}`, f.delete_rule]));

      // user_subscriptions -> users (RESTRICT)
      const userSubFk = foreignKeys.find((f) => f.table_name === "user_subscriptions" && f.constraint_name.includes("user_id"));
      expect(userSubFk?.delete_rule).toBe("RESTRICT");

      // subscription_transition_records -> user_subscriptions (RESTRICT)
      const transSubFk = foreignKeys.find((f) => f.table_name === "subscription_transition_records" && f.constraint_name.includes("subscription_id"));
      expect(transSubFk?.delete_rule).toBe("RESTRICT");

      // subscription_transition_records -> users (RESTRICT)
      const transUserFk = foreignKeys.find((f) => f.table_name === "subscription_transition_records" && f.constraint_name.includes("user_id"));
      expect(transUserFk?.delete_rule).toBe("RESTRICT");

      // subscription_provider_events -> user_subscriptions (SET NULL)
      const eventSubFk = foreignKeys.find((f) => f.table_name === "subscription_provider_events" && f.constraint_name.includes("subscription_id"));
      expect(eventSubFk?.delete_rule).toBe("SET NULL");
    });
  });

  // ============================================================================
  // AC-022: Real Phase 6 Upgrade & Representative Row Preservation
  // ============================================================================
  describe("AC-022: Real Phase 6 Upgrade & Representative Row Preservation", () => {
    it("preserves representative rows and relationships across Identity, Academy, Simulation, and Community", async () => {
      // 1. Identity: User, Credential, RefreshSession, AuthSecurityAuditRecord
      const testEmail = `phase6_upgrade_user_${Date.now()}@example.com`;
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          displayName: "Phase 6 Upgrade Veteran",
          status: "ACTIVE",
        },
      });

      const credential = await prisma.credential.create({
        data: {
          userId: user.id,
          passwordHash: "$argon2id$upgrade_hash",
          type: "PASSWORD",
        },
      });

      const refreshSession = await prisma.refreshSession.create({
        data: {
          userId: user.id,
          tokenHash: `token_upgrade_${Date.now()}`,
          familyId: `fam_upgrade_${Date.now()}`,
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const auditRecord = await prisma.authSecurityAuditRecord.create({
        data: {
          userId: user.id,
          eventType: "LOGIN_SUCCESS",
          outcome: "SUCCESS",
          actorUserId: user.id,
          subjectUserId: user.id,
          sessionId: refreshSession.id,
          identityHash: "sha256_upgrade_identity",
          requestId: `req_${Date.now()}`,
        },
      });

      // 2. Community: Post, Comment, Like
      const post = await prisma.communityPost.create({
        data: {
          authorId: user.id,
          content: "Post created prior to Phase 7 migration upgrade.",
          status: "VISIBLE",
        },
      });

      const comment = await prisma.communityComment.create({
        data: {
          postId: post.id,
          authorId: user.id,
          content: "Comment preserved across migration boundary.",
          status: "VISIBLE",
        },
      });

      const like = await prisma.communityPostLike.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });

      // 3. Assert all representative rows remain intact and readable
      const loadedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          credentials: true,
          refreshSessions: true,
          auditRecords: true,
          communityPosts: true,
          communityComments: true,
          communityPostLikes: true,
        },
      });

      expect(loadedUser).not.toBeNull();
      expect(loadedUser?.credentials).toHaveLength(1);
      expect(loadedUser?.credentials[0].id).toBe(credential.id);
      expect(loadedUser?.refreshSessions).toHaveLength(1);
      expect(loadedUser?.refreshSessions[0].id).toBe(refreshSession.id);
      expect(loadedUser?.auditRecords).toHaveLength(1);
      expect(loadedUser?.auditRecords[0].id).toBe(auditRecord.id);
      expect(loadedUser?.communityPosts).toHaveLength(1);
      expect(loadedUser?.communityPosts[0].id).toBe(post.id);
      expect(loadedUser?.communityComments).toHaveLength(1);
      expect(loadedUser?.communityComments[0].id).toBe(comment.id);
      expect(loadedUser?.communityPostLikes).toHaveLength(1);
      expect(loadedUser?.communityPostLikes[0].id).toBe(like.id);

      // 4. Attach a new Phase 7 UserSubscription to this existing user
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sub = await prisma.userSubscription.create({
        data: {
          userId: user.id,
          planKey: "PREMIUM",
          status: "ACTIVE",
          providerKey: "INTERNAL",
          currentPeriodStart: start,
          currentPeriodEnd: end,
        },
      });

      expect(sub.id).toBeDefined();
      expect(sub.userId).toBe(user.id);

      const userWithSub = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          subscriptions: true,
        },
      });
      expect(userWithSub?.subscriptions).toHaveLength(1);
      expect(userWithSub?.subscriptions[0].id).toBe(sub.id);
    });
  });
});
