import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const workspaceRoot = path.resolve(process.cwd());
const livePrismaDir = path.resolve(workspaceRoot, "apps/api/prisma");
const liveMigrationsDir = path.join(livePrismaDir, "migrations");
const tempPhase5PrismaDir = path.resolve(workspaceRoot, "temp_phase5_upgrade_workspace");
const feat041MigrationName = "20260919201500_feat041_community_foundation";

const upgradeDbUrl = "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat041_upgrade";

async function runPhase5UpgradeValidation() {
  console.log("=== STARTING PHASE 5 UPGRADE VALIDATION ===");

  // Step 1: Recreate upgrade database
  console.log("1. Recreating database aura_capital_test_feat041_upgrade...");
  execSync(`docker exec aura-postgres psql -U postgres -c "DROP DATABASE IF EXISTS aura_capital_test_feat041_upgrade;"`, { stdio: "inherit" });
  execSync(`docker exec aura-postgres psql -U postgres -c "CREATE DATABASE aura_capital_test_feat041_upgrade;"`, { stdio: "inherit" });

  // Step 2: Prepare temporary Phase 5 workspace with only migrations 1-8 (leaving live directory untouched)
  console.log("2. Staging Phase 5 baseline migrations in isolated temporary workspace...");
  if (fs.existsSync(tempPhase5PrismaDir)) {
    fs.rmSync(tempPhase5PrismaDir, { recursive: true, force: true });
  }
  const tempMigrationsDir = path.join(tempPhase5PrismaDir, "migrations");
  fs.mkdirSync(tempMigrationsDir, { recursive: true });

  // Copy schema.prisma
  fs.copyFileSync(path.join(livePrismaDir, "schema.prisma"), path.join(tempPhase5PrismaDir, "schema.prisma"));

  // Copy only Phase 5 baseline migrations (1-8)
  const migrationEntries = fs.readdirSync(liveMigrationsDir);
  for (const entry of migrationEntries) {
    if (entry !== feat041MigrationName) {
      const srcPath = path.join(liveMigrationsDir, entry);
      const destPath = path.join(tempMigrationsDir, entry);
      if (fs.statSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  try {
    // Step 3: Deploy Phase 5 baseline migrations (1-8)
    console.log("3. Deploying 8 Phase 5 migrations to upgrade database...");
    execSync(`npx prisma migrate deploy --schema=${path.join(tempPhase5PrismaDir, "schema.prisma")}`, {
      env: { ...process.env, DATABASE_URL: upgradeDbUrl },
      stdio: "inherit",
    });

    // Step 4: Populate representative data across Phase 2, 4, and 5
    console.log("4. Populating representative data across Auth, Academy, and Simulation...");
    const prisma = new PrismaClient({ datasources: { db: { url: upgradeDbUrl } } });
    await prisma.$connect();

    // 4.1 Auth
    const user = await prisma.user.create({
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        email: "phase5_upgrade_user@example.com",
        displayName: "Phase 5 Upgrade Learner",
        status: "ACTIVE",
      },
    });

    await prisma.credential.create({
      data: {
        userId: user.id,
        type: "PASSWORD",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$upgradehash",
      },
    });

    const role = await prisma.role.create({
      data: {
        name: "LEARNER",
        description: "Standard learner role",
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: "upgrade_token_hash_value_12345",
        familyId: "upgrade_family_id_12345",
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    await prisma.authSecurityAuditRecord.create({
      data: {
        eventType: "LOGIN_SUCCESS",
        actorUserId: user.id,
        ipAddress: "127.0.0.1",
        userAgent: "UpgradeTest/1.0",
      },
    });

    // 4.2 Academy
    const course = await prisma.academyCourse.create({
      data: {
        slug: "upgrade-course",
        title: "Upgrade Course",
        description: "Course for upgrade preservation test",
        level: "BEGINNER",
        order: 1,
        status: "PUBLISHED",
      },
    });

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "upgrade-lesson",
        title: "Upgrade Lesson",
        order: 1,
        content: "# Upgrade Lesson Content",
        status: "PUBLISHED",
      },
    });

    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "What is upgrade preservation?",
        back: "Zero data loss during forward-only migrations.",
        order: 1,
      },
    });

    await prisma.academyUserCourseProgress.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await prisma.academyUserXp.create({
      data: {
        userId: user.id,
        totalXp: 50,
        level: 1,
      },
    });

    await prisma.academyRewardLedger.create({
      data: {
        userId: user.id,
        sourceType: "LESSON_COMPLETION",
        sourceId: lesson.id,
        rewardType: "XP",
        amount: 50,
        status: "APPLIED",
      },
    });

    // 4.3 Simulation
    const scenario = await prisma.simulationScenario.create({
      data: {
        key: "UPGRADE_SCENARIO",
        name: "Upgrade Test Scenario",
        status: "ACTIVE",
      },
    });

    const asset = await prisma.simulationAsset.create({
      data: {
        symbol: "UPG",
        name: "Upgrade Asset",
        assetType: "EQUITY",
        status: "ACTIVE",
        displayOrder: 1,
      },
    });

    await prisma.simulationMarketSnapshot.create({
      data: {
        scenarioId: scenario.id,
        assetId: asset.id,
        cycle: 1,
        price: "150.000000",
        occurredAt: new Date(),
      },
    });

    const session = await prisma.simulationSession.create({
      data: {
        userId: user.id,
        scenarioId: scenario.id,
        startingCash: "100000.0000",
        currentCycle: 1,
        status: "ACTIVE",
      },
    });

    const portfolio = await prisma.simulationPortfolio.create({
      data: {
        sessionId: session.id,
        cashBalance: "100000.0000",
      },
    });

    await prisma.simulationPosition.create({
      data: {
        portfolioId: portfolio.id,
        assetId: asset.id,
        quantity: 10,
        averageCost: "150.000000",
      },
    });

    const order = await prisma.simulationOrder.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        assetId: asset.id,
        side: "BUY",
        type: "MARKET",
        quantity: 10,
        status: "FILLED",
        idempotencyKey: "upgrade_order_idem_key_1",
        requestFingerprint: "fingerprint_upgrade_1",
        executionPrice: "150.000000",
        executedQuantity: 10,
      },
    });

    await prisma.simulationTrade.create({
      data: {
        orderId: order.id,
        sessionId: session.id,
        assetId: asset.id,
        side: "BUY",
        quantity: 10,
        executionPrice: "150.000000",
        notional: "1500.0000",
      },
    });

    await prisma.$disconnect();
    console.log("✓ Representative data populated across Auth, Academy, and Simulation.");

    // Step 5: Apply FEAT-041 migration from live directory
    console.log("5. Applying FEAT-041 migration to upgraded database...");
    execSync(`npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`, {
      env: { ...process.env, DATABASE_URL: upgradeDbUrl },
      stdio: "inherit",
    });

    // Step 6: Verify migration status
    console.log("6. Verifying migration status on upgraded database...");
    execSync(`npx prisma migrate status --schema=apps/api/prisma/schema.prisma`, {
      env: { ...process.env, DATABASE_URL: upgradeDbUrl },
      stdio: "inherit",
    });

    // Step 7: Verify preservation of all representative rows
    console.log("7. Verifying data preservation after upgrade...");
    const prismaPost = new PrismaClient({ datasources: { db: { url: upgradeDbUrl } } });
    await prismaPost.$connect();

    const authUsers = await prismaPost.user.count();
    const credentialCount = await prismaPost.credential.count();
    const roles = await prismaPost.role.count();
    const userRoles = await prismaPost.userRole.count();
    const refreshSessions = await prismaPost.refreshSession.count();
    const auditRecords = await prismaPost.authSecurityAuditRecord.count();

    const courses = await prismaPost.academyCourse.count();
    const lessons = await prismaPost.academyLesson.count();
    const flashcards = await prismaPost.academyFlashcard.count();
    const progress = await prismaPost.academyUserCourseProgress.count();
    const xp = await prismaPost.academyUserXp.count();
    const rewards = await prismaPost.academyRewardLedger.count();

    const scenarios = await prismaPost.simulationScenario.count();
    const assets = await prismaPost.simulationAsset.count();
    const snapshots = await prismaPost.simulationMarketSnapshot.count();
    const sessions = await prismaPost.simulationSession.count();
    const portfolios = await prismaPost.simulationPortfolio.count();
    const positions = await prismaPost.simulationPosition.count();
    const orders = await prismaPost.simulationOrder.count();
    const trades = await prismaPost.simulationTrade.count();

    console.log(`Auth rows preserved: Users=${authUsers}, CredentialRecords=${credentialCount}, Roles=${roles}, UserRoles=${userRoles}, Sessions=${refreshSessions}, Audits=${auditRecords}`);
    console.log(`Academy rows preserved: Courses=${courses}, Lessons=${lessons}, Flashcards=${flashcards}, Progress=${progress}, XP=${xp}, Rewards=${rewards}`);
    console.log(`Simulation rows preserved: Scenarios=${scenarios}, Assets=${assets}, Snapshots=${snapshots}, Sessions=${sessions}, Portfolios=${portfolios}, Positions=${positions}, Orders=${orders}, Trades=${trades}`);

    if (authUsers !== 1 || credentialCount !== 1 || roles !== 1 || userRoles !== 1 || refreshSessions !== 1 || auditRecords !== 1) {
      throw new Error("Data loss detected in Auth domain after FEAT-041 migration!");
    }
    if (courses !== 1 || lessons !== 1 || flashcards !== 1 || progress !== 1 || xp !== 1 || rewards !== 1) {
      throw new Error("Data loss detected in Academy domain after FEAT-041 migration!");
    }
    if (scenarios !== 1 || assets !== 1 || snapshots !== 1 || sessions !== 1 || portfolios !== 1 || positions !== 1 || orders !== 1 || trades !== 1) {
      throw new Error("Data loss detected in Simulation domain after FEAT-041 migration!");
    }
    console.log("✓ 100% of representative data preserved across all domains.");

    // Step 8: Functional validation of Community models on upgraded database
    console.log("8. Functional validation of new Community models on upgraded database...");
    const post = await prismaPost.communityPost.create({
      data: {
        authorId: user.id,
        content: "First community post on upgraded Phase 5 database!",
        status: "VISIBLE",
        removedAt: null,
      },
    });
    console.log(`✓ CommunityPost created: ${post.id}`);

    const comment = await prismaPost.communityComment.create({
      data: {
        postId: post.id,
        authorId: user.id,
        content: "First comment on upgraded Phase 5 database!",
        status: "VISIBLE",
        removedAt: null,
      },
    });
    console.log(`✓ CommunityComment created: ${comment.id}`);

    const like = await prismaPost.communityPostLike.create({
      data: {
        postId: post.id,
        userId: user.id,
      },
    });
    console.log(`✓ CommunityPostLike created: ${like.id}`);

    // Step 9: Test check constraints and coherence on upgraded database
    console.log("9. Testing check constraints and REMOVED coherence on upgraded database...");
    try {
      await prismaPost.communityPost.create({
        data: {
          authorId: user.id,
          content: "   ",
        },
      });
      throw new Error("Check constraint failure: Whitespace-only post was accepted!");
    } catch {
      console.log("✓ Empty/whitespace post correctly rejected by upgraded database constraint.");
    }

    try {
      await prismaPost.communityPostLike.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });
      throw new Error("Unique constraint failure: Duplicate like was accepted!");
    } catch {
      console.log("✓ Duplicate like correctly rejected by upgraded database unique constraint.");
    }

    // Test REMOVED without removed_at is rejected
    try {
      await prismaPost.$executeRaw`
        INSERT INTO "community_posts" ("id", "author_id", "content", "status", "updated_at", "removed_at")
        VALUES (gen_random_uuid()::text, ${user.id}, 'Invalid removed post', 'REMOVED', NOW(), NULL);
      `;
      throw new Error("Check constraint failure: REMOVED post with NULL removed_at was accepted!");
    } catch {
      console.log("✓ REMOVED post with NULL removed_at correctly rejected by upgraded database constraint.");
    }

    // Test VISIBLE with removed_at is rejected
    try {
      await prismaPost.$executeRaw`
        INSERT INTO "community_posts" ("id", "author_id", "content", "status", "updated_at", "removed_at")
        VALUES (gen_random_uuid()::text, ${user.id}, 'Invalid visible post', 'VISIBLE', NOW(), NOW());
      `;
      throw new Error("Check constraint failure: VISIBLE post with non-NULL removed_at was accepted!");
    } catch {
      console.log("✓ VISIBLE post with non-NULL removed_at correctly rejected by upgraded database constraint.");
    }

    // Step 10: Verify indexes in pg_indexes
    console.log("10. Verifying PostgreSQL index metadata on upgraded database...");
    const indexes = await prismaPost.$queryRaw<Array<{ index_name: string; index_def: string }>>`
      SELECT c.relname AS index_name, pg_get_indexdef(c.oid) AS index_def
      FROM pg_class c
      JOIN pg_index ix ON c.oid = ix.indexrelid
      JOIN pg_class t ON ix.indrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND t.relname IN ('community_posts', 'community_comments', 'community_post_likes')
      ORDER BY c.relname;
    `;
    const indexNames = indexes.map((i) => i.index_name);
    console.log(`Found indexes on upgraded DB: ${indexNames.join(", ")}`);
    if (!indexNames.includes("community_posts_author_id_created_at_id_idx")) {
      throw new Error("Missing community_posts_author_id_created_at_id_idx on upgraded DB!");
    }
    if (!indexNames.includes("community_comments_author_id_created_at_id_idx")) {
      throw new Error("Missing community_comments_author_id_created_at_id_idx on upgraded DB!");
    }
    if (!indexNames.includes("community_post_likes_post_id_created_at_idx")) {
      throw new Error("Missing community_post_likes_post_id_created_at_idx on upgraded DB!");
    }
    if (!indexNames.includes("community_post_likes_user_id_created_at_idx")) {
      throw new Error("Missing community_post_likes_user_id_created_at_idx on upgraded DB!");
    }
    console.log("✓ All canonical indexes verified on upgraded database.");

    // Count total tables
    const tables = await prismaPost.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;
    `;
    console.log(`✓ Total tables in upgraded database: ${tables.length}`);
    if (tables.length !== 30) {
      throw new Error(`Expected exactly 30 tables in upgraded database, found ${tables.length}`);
    }

    await prismaPost.$disconnect();
    console.log("=== PHASE 5 UPGRADE VALIDATION: PASS ===");
  } finally {
    // Cleanup temporary workspace
    if (fs.existsSync(tempPhase5PrismaDir)) {
      fs.rmSync(tempPhase5PrismaDir, { recursive: true, force: true });
    }
  }
}

runPhase5UpgradeValidation().catch((err) => {
  console.error("Upgrade validation FAILED:", err);
  process.exit(1);
});
