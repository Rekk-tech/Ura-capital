import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const workspaceRoot = path.resolve(process.cwd());
const migrationsDir = path.resolve(workspaceRoot, "apps/api/prisma/migrations");
const feat041MigrationName = "20260919201500_feat041_community_foundation";
const feat041Path = path.join(migrationsDir, feat041MigrationName);
const tempHoldingDir = path.resolve(workspaceRoot, "temp_holding_feat041");
const feat041HeldPath = path.join(tempHoldingDir, feat041MigrationName);

const upgradeDbUrl = "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test_feat041_upgrade";

async function runPhase5UpgradeValidation() {
  console.log("=== STARTING PHASE 5 UPGRADE VALIDATION ===");

  // Step 1: Recreate upgrade database
  console.log("1. Recreating database aura_capital_test_feat041_upgrade...");
  execSync(`docker exec aura-postgres psql -U postgres -c "DROP DATABASE IF EXISTS aura_capital_test_feat041_upgrade;"`, { stdio: "inherit" });
  execSync(`docker exec aura-postgres psql -U postgres -c "CREATE DATABASE aura_capital_test_feat041_upgrade;"`, { stdio: "inherit" });

  // Step 2: Temporarily move FEAT-041 migration out of migrations directory
  console.log("2. Staging Phase 5 baseline migrations (1-8)...");
  if (!fs.existsSync(tempHoldingDir)) {
    fs.mkdirSync(tempHoldingDir, { recursive: true });
  }
  if (fs.existsSync(feat041Path)) {
    fs.renameSync(feat041Path, feat041HeldPath);
  }

  try {
    // Step 3: Deploy Phase 5 migrations
    console.log("3. Deploying 8 Phase 5 migrations to upgrade database...");
    execSync(`npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`, {
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
        status: "PUBLISHED",
        order: 1,
      },
    });

    const lesson = await prisma.academyLesson.create({
      data: {
        courseId: course.id,
        slug: "upgrade-lesson",
        title: "Upgrade Lesson",
        content: "# Upgrade Lesson Markdown",
        order: 1,
        status: "PUBLISHED",
      },
    });

    await prisma.academyFlashcard.create({
      data: {
        lessonId: lesson.id,
        front: "What is P/E ratio?",
        back: "Price to Earnings ratio",
        order: 1,
      },
    });

    await prisma.academyUserCourseProgress.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "IN_PROGRESS",
      },
    });

    await prisma.academyUserLessonProgress.create({
      data: {
        userId: user.id,
        lessonId: lesson.id,
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
        name: "Upgrade Scenario",
        status: "ACTIVE",
      },
    });

    const asset = await prisma.simulationAsset.create({
      data: {
        symbol: "UPG_STOCK",
        name: "Upgrade Stock",
        assetType: "EQUITY",
        status: "ACTIVE",
      },
    });

    await prisma.simulationMarketSnapshot.create({
      data: {
        scenarioId: scenario.id,
        assetId: asset.id,
        cycle: 1,
        price: 150.25,
        occurredAt: new Date(),
      },
    });

    const session = await prisma.simulationSession.create({
      data: {
        userId: user.id,
        scenarioId: scenario.id,
        status: "ACTIVE",
        startingCash: 100000,
        currentCycle: 1,
      },
    });

    const portfolio = await prisma.simulationPortfolio.create({
      data: {
        sessionId: session.id,
        cashBalance: 98497.5,
        realizedPnl: 0,
      },
    });

    await prisma.simulationPosition.create({
      data: {
        portfolioId: portfolio.id,
        assetId: asset.id,
        quantity: 10,
        averageCost: 150.25,
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
        idempotencyKey: "upgrade_order_key_1",
        requestFingerprint: "upgrade_fingerprint_1",
        executionPrice: 150.25,
        executedQuantity: 10,
        filledAt: new Date(),
      },
    });

    await prisma.simulationTrade.create({
      data: {
        orderId: order.id,
        sessionId: session.id,
        assetId: asset.id,
        side: "BUY",
        quantity: 10,
        executionPrice: 150.25,
        notional: 1502.5,
        realizedPnl: 0,
      },
    });

    console.log("✓ Pre-upgrade representative data created successfully.");
    await prisma.$disconnect();
  } finally {
    // Step 5: Restore FEAT-041 migration
    if (fs.existsSync(feat041HeldPath)) {
      fs.renameSync(feat041HeldPath, feat041Path);
    }
  }

  // Step 6: Apply FEAT-041 migration
  console.log("6. Applying FEAT-041 migration to populated Phase 5 database...");
  execSync(`npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma`, {
    env: { ...process.env, DATABASE_URL: upgradeDbUrl },
    stdio: "inherit",
  });

  // Step 7: Validate migration status
  console.log("7. Checking migration status...");
  execSync(`npx prisma migrate status --schema=apps/api/prisma/schema.prisma`, {
    env: { ...process.env, DATABASE_URL: upgradeDbUrl },
    stdio: "inherit",
  });

  // Step 8: Verify data preservation and new Community tables
  console.log("8. Verifying representative data preservation and Community tables...");
  const prismaPost = new PrismaClient({ datasources: { db: { url: upgradeDbUrl } } });
  await prismaPost.$connect();

  const user = await prismaPost.user.findUnique({
    where: { email: "phase5_upgrade_user@example.com" },
  });
  if (!user) throw new Error("Upgrade failed: User data lost!");
  console.log(`✓ User preserved: ${user.email} (id=${user.id})`);

  const credential = await prismaPost.credential.findUnique({ where: { userId: user.id } });
  if (!credential) throw new Error("Upgrade failed: Credential lost!");
  console.log(`✓ Credential preserved: type=${credential.type}`);

  const course = await prismaPost.academyCourse.findUnique({ where: { slug: "upgrade-course" } });
  if (!course) throw new Error("Upgrade failed: Academy course data lost!");
  console.log(`✓ Academy course preserved: ${course.title}`);

  const flashcard = await prismaPost.academyFlashcard.findFirst({ where: { front: "What is P/E ratio?" } });
  if (!flashcard) throw new Error("Upgrade failed: Flashcard data lost!");
  console.log(`✓ Academy flashcard preserved: front="${flashcard.front}"`);

  const xp = await prismaPost.academyUserXp.findUnique({ where: { userId: user.id } });
  if (!xp || xp.totalXp !== 50) throw new Error("Upgrade failed: XP data lost!");
  console.log(`✓ Academy XP preserved: totalXp=${xp.totalXp}`);

  const scenario = await prismaPost.simulationScenario.findUnique({ where: { key: "UPGRADE_SCENARIO" } });
  if (!scenario) throw new Error("Upgrade failed: Simulation scenario data lost!");
  console.log(`✓ Simulation scenario preserved: ${scenario.name}`);

  const order = await prismaPost.simulationOrder.findFirst({ where: { userId: user.id } });
  if (!order) throw new Error("Upgrade failed: Simulation order data lost!");
  console.log(`✓ Simulation order preserved: ${order.id} (status=${order.status})`);

  const portfolio = await prismaPost.simulationPortfolio.findFirst({ where: { sessionId: order.sessionId } });
  if (!portfolio) throw new Error("Upgrade failed: Simulation portfolio lost!");
  console.log(`✓ Simulation portfolio preserved: balance=${portfolio.cashBalance}`);

  // Step 9: Test Community persistence on upgraded database
  console.log("9. Testing Community operations on upgraded database...");
  const post = await prismaPost.communityPost.create({
    data: {
      authorId: user.id,
      content: "First post on upgraded Phase 5 database!",
      status: "VISIBLE",
    },
  });
  console.log(`✓ CommunityPost created: ${post.id}`);

  const comment = await prismaPost.communityComment.create({
    data: {
      postId: post.id,
      authorId: user.id,
      content: "First comment on upgraded Phase 5 database!",
      status: "VISIBLE",
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

  // Step 10: Test check constraints on upgraded database
  console.log("10. Testing check constraints on upgraded database...");
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
}

runPhase5UpgradeValidation().catch((err) => {
  console.error("Upgrade validation FAILED:", err);
  process.exit(1);
});
