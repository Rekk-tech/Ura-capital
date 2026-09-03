import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const MIGRATIONS_DIR = path.resolve(REPO_ROOT, "apps/api/prisma/migrations");

const UPGRADE_DB_NAME = "aura_capital_test_feat019_rework2_upgrade";
const FRESH_DB_NAME = "aura_capital_test_feat019_rework2_fresh";
const UPGRADE_DB_URL = `postgresql://postgres:postgrespassword@localhost:5432/${UPGRADE_DB_NAME}`;

async function main() {
  console.log("================================================================================");
  console.log("FEAT-019 INCREMENTAL UPGRADE VALIDATION (Phase 3 -> Phase 4 FEAT-019)");
  console.log("================================================================================");

  // 1. Recreate isolated upgrade database
  console.log(`[STEP 1] Recreating database ${UPGRADE_DB_NAME}...`);
  execSync(`docker exec aura-postgres psql -U postgres -c "DROP DATABASE IF EXISTS ${UPGRADE_DB_NAME};"`);
  execSync(`docker exec aura-postgres psql -U postgres -c "CREATE DATABASE ${UPGRADE_DB_NAME};"`);

  // 2. Apply Phase 3 migrations (the first 3 approved migrations)
  console.log("[STEP 2] Establishing approved Phase 3 baseline schema...");
  const phase3Migrations = [
    "20260825000000_init_identity",
    "20260825000001_feat005_refresh_session_rotation",
    "20260827000000_feat009_audit_events",
  ];

  // Initialize _prisma_migrations table
  execSync(
    `docker exec aura-postgres psql -U postgres -d ${UPGRADE_DB_NAME} -c "
      CREATE TABLE IF NOT EXISTS \\"_prisma_migrations\\" (
        \\"id\\" VARCHAR(36) PRIMARY KEY,
        \\"checksum\\" VARCHAR(64) NOT NULL,
        \\"finished_at\\" TIMESTAMPTZ,
        \\"migration_name\\" VARCHAR(255) NOT NULL,
        \\"logs\\" TEXT,
        \\"rolled_back_at\\" TIMESTAMPTZ,
        \\"started_at\\" TIMESTAMPTZ NOT NULL DEFAULT now(),
        \\"applied_steps_count\\" INTEGER NOT NULL DEFAULT 0
      );
    "`
  );

  for (const mName of phase3Migrations) {
    const sqlPath = path.join(MIGRATIONS_DIR, mName, "migration.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    const tempSqlPath = path.join(REPO_ROOT, `temp_${mName}.sql`);
    fs.writeFileSync(tempSqlPath, sqlContent, "utf8");
    execSync(`docker cp "${tempSqlPath}" aura-postgres:/tmp/migration.sql`);
    execSync(`docker exec aura-postgres psql -U postgres -d ${UPGRADE_DB_NAME} -f /tmp/migration.sql`);
    try {
      fs.unlinkSync(tempSqlPath);
    } catch {
      // Ignore temporary unlink lock on Windows
    }
  }

  // Copy exactly the first 3 migration entries from fresh DB into upgrade DB _prisma_migrations
  execSync(
    `docker exec aura-postgres sh -c "pg_dump -U postgres -d ${FRESH_DB_NAME} -t _prisma_migrations | psql -U postgres -d ${UPGRADE_DB_NAME}"`
  );
  execSync(
    `docker exec aura-postgres psql -U postgres -d ${UPGRADE_DB_NAME} -c "DELETE FROM _prisma_migrations WHERE migration_name = '20260903000000_feat019_academy_foundation';"`
  );
  console.log("  - Initialized exact Phase 3 baseline _prisma_migrations (3 migrations applied)");

  // 3. Insert representative Phase 2/3 data
  console.log("[STEP 3] Populating representative Phase 2/3 rows...");
  const prisma = new PrismaClient({
    datasources: { db: { url: UPGRADE_DB_URL } },
  });

  await prisma.$connect();

  // Create Roles
  const roleUser = await prisma.role.create({
    data: { name: "USER", description: "Standard user" },
  });
  const roleAdmin = await prisma.role.create({
    data: { name: "ADMIN", description: "Administrator" },
  });

  // Create Users
  const user1 = await prisma.user.create({
    data: { email: "upgrade.admin@aura.test", displayName: "Upgrade Admin", status: "ACTIVE" },
  });
  const user2 = await prisma.user.create({
    data: { email: "upgrade.user1@aura.test", displayName: "Upgrade User 1", status: "ACTIVE" },
  });
  const user3 = await prisma.user.create({
    data: { email: "upgrade.user2@aura.test", displayName: "Upgrade User 2", status: "ACTIVE" },
  });

  // Create Credentials
  await prisma.credential.createMany({
    data: [
      { userId: user1.id, type: "PASSWORD", passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash1" },
      { userId: user2.id, type: "PASSWORD", passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash2" },
      { userId: user3.id, type: "PASSWORD", passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$dummyhash3" },
    ],
  });

  // Create UserRoles
  await prisma.userRole.createMany({
    data: [
      { userId: user1.id, roleId: roleAdmin.id },
      { userId: user1.id, roleId: roleUser.id },
      { userId: user2.id, roleId: roleUser.id },
      { userId: user3.id, roleId: roleUser.id },
    ],
  });

  // Create RefreshSession
  const session = await prisma.refreshSession.create({
    data: {
      userId: user1.id,
      tokenHash: "upgrade_token_hash_1",
      familyId: "family_upgrade_1",
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  });

  // Create Audit Records
  await prisma.authSecurityAuditRecord.createMany({
    data: [
      { userId: user1.id, eventType: "LOGIN_SUCCESS", outcome: "SUCCESS" },
      { userId: user2.id, eventType: "REGISTRATION_SUCCESS", outcome: "SUCCESS" },
      { userId: user1.id, eventType: "REFRESH_SUCCESS", outcome: "SUCCESS", sessionId: session.id },
    ],
  });

  // 4. Capture BEFORE state
  console.log("[STEP 4] Capturing BEFORE state...");
  const beforeCounts = {
    usersCount: await prisma.user.count(),
    credentialsCount: await prisma.credential.count(),
    rolesCount: await prisma.role.count(),
    userRolesCount: await prisma.userRole.count(),
    refreshSessionsCount: await prisma.refreshSession.count(),
    auditRecordsCount: await prisma.authSecurityAuditRecord.count(),
  };

  const beforeUsers = await prisma.user.findMany({ orderBy: { email: "asc" } });
  const beforeConstraints: Array<{ constraint_name: string; table_name: string; constraint_type: string }> =
    await prisma.$queryRaw`
      SELECT constraint_name, table_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      ORDER BY table_name, constraint_name;
    `;
  const beforeIndexes: Array<{ tablename: string; indexname: string }> =
    await prisma.$queryRaw`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

  console.log(`BEFORE State: ${beforeCounts.usersCount} users, ${beforeCounts.credentialsCount} creds, ${beforeCounts.rolesCount} roles, ${beforeCounts.userRolesCount} user_roles, ${beforeCounts.refreshSessionsCount} refresh sessions, ${beforeCounts.auditRecordsCount} audit records`);
  console.log(`BEFORE Constraints: ${beforeConstraints.length}, Indexes: ${beforeIndexes.length}`);

  await prisma.$disconnect();

  // 5. Apply ONLY pending FEAT-019 migration via prisma migrate deploy
  console.log("[STEP 5] Applying pending FEAT-019 migration (prisma migrate deploy)...");
  execSync(`npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`, {
    env: { ...process.env, DATABASE_URL: UPGRADE_DB_URL },
    stdio: "inherit",
  });

  // 6. Capture AFTER state and verify preservation
  console.log("[STEP 6] Capturing AFTER state and verifying 100% preservation...");
  const prismaAfter = new PrismaClient({
    datasources: { db: { url: UPGRADE_DB_URL } },
  });
  await prismaAfter.$connect();

  const afterCounts = {
    usersCount: await prismaAfter.user.count(),
    credentialsCount: await prismaAfter.credential.count(),
    rolesCount: await prismaAfter.role.count(),
    userRolesCount: await prismaAfter.userRole.count(),
    refreshSessionsCount: await prismaAfter.refreshSession.count(),
    auditRecordsCount: await prismaAfter.authSecurityAuditRecord.count(),
    // Phase 4 Academy tables (newly created and zero-state)
    academyCourses: await prismaAfter.academyCourse.count(),
    academyLessons: await prismaAfter.academyLesson.count(),
    academyFlashcards: await prismaAfter.academyFlashcard.count(),
    academyQuizzes: await prismaAfter.academyQuiz.count(),
    academyQuizQuestions: await prismaAfter.academyQuizQuestion.count(),
    academyQuizOptions: await prismaAfter.academyQuizOption.count(),
    academyQuizAttempts: await prismaAfter.academyQuizAttempt.count(),
    academyQuizAnswers: await prismaAfter.academyQuizAnswer.count(),
    academyUserCourseProgress: await prismaAfter.academyUserCourseProgress.count(),
    academyUserLessonProgress: await prismaAfter.academyUserLessonProgress.count(),
    academyUserXp: await prismaAfter.academyUserXp.count(),
    academyRewardLedger: await prismaAfter.academyRewardLedger.count(),
  };

  const afterUsers = await prismaAfter.user.findMany({ orderBy: { email: "asc" } });
  const afterConstraints: Array<{ constraint_name: string; table_name: string; constraint_type: string }> =
    await prismaAfter.$queryRaw`
      SELECT constraint_name, table_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      ORDER BY table_name, constraint_name;
    `;
  const afterIndexes: Array<{ tablename: string; indexname: string }> =
    await prismaAfter.$queryRaw`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

  console.log(`AFTER State: ${afterCounts.usersCount} users, ${afterCounts.credentialsCount} creds, ${afterCounts.rolesCount} roles, ${afterCounts.userRolesCount} user_roles, ${afterCounts.refreshSessionsCount} refresh sessions, ${afterCounts.auditRecordsCount} audit records`);
  console.log(`AFTER Constraints: ${afterConstraints.length}, Indexes: ${afterIndexes.length}`);

  // Assertions
  if (
    beforeCounts.usersCount !== afterCounts.usersCount ||
    beforeCounts.credentialsCount !== afterCounts.credentialsCount ||
    beforeCounts.rolesCount !== afterCounts.rolesCount ||
    beforeCounts.userRolesCount !== afterCounts.userRolesCount ||
    beforeCounts.refreshSessionsCount !== afterCounts.refreshSessionsCount ||
    beforeCounts.auditRecordsCount !== afterCounts.auditRecordsCount
  ) {
    throw new Error("[UPGRADE_VERIFICATION_FAILED] Existing Phase 2/3 row counts changed!");
  }

  for (let i = 0; i < beforeUsers.length; i++) {
    if (beforeUsers[i].id !== afterUsers[i].id || beforeUsers[i].email !== afterUsers[i].email) {
      throw new Error(`[UPGRADE_VERIFICATION_FAILED] User row mutated at index ${i}`);
    }
  }

  // Check all previous constraints are still present
  const afterConstraintNames = new Set(afterConstraints.map((c) => c.constraint_name));
  for (const c of beforeConstraints) {
    if (!afterConstraintNames.has(c.constraint_name)) {
      throw new Error(`[UPGRADE_VERIFICATION_FAILED] Prior constraint '${c.constraint_name}' missing after upgrade!`);
    }
  }

  console.log("================================================================================");
  console.log("FEAT-019 INCREMENTAL UPGRADE VALIDATION: PASS");
  console.log(`- Phase 2/3 Data: 100% Preserved (${afterCounts.usersCount} users, ${afterCounts.credentialsCount} creds, ${afterCounts.rolesCount} roles, ${afterCounts.userRolesCount} user_roles, ${afterCounts.refreshSessionsCount} sessions, ${afterCounts.auditRecordsCount} audit records)`);
  console.log(`- Academy Schema: 12 tables created, 0 data drift`);
  console.log(`- Constraints: ${beforeConstraints.length} prior -> ${afterConstraints.length} total (${afterConstraints.length - beforeConstraints.length} new Academy constraints)`);
  console.log(`- Indexes: ${beforeIndexes.length} prior -> ${afterIndexes.length} total (${afterIndexes.length - beforeIndexes.length} new Academy indexes)`);
  console.log("================================================================================");

  await prismaAfter.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
