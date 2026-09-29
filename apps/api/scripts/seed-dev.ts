import { PrismaClient } from "@prisma/client";
import { passwordHashingService } from "../src/modules/auth/password-hashing.service.js";

/**
 * Idempotent Development & Demo Deployment Seed Script
 *
 * Populates essential application data required for immediate client walkthrough:
 * - Canonical roles (USER, ADMIN)
 * - Walkthrough user accounts (Demo Learner, Admin, community peers)
 * - Academy course curricula, lessons, and flashcards
 * - Simulation trading scenario, multi-asset ticker catalog, and market cycle snapshots
 * - Community forum discussion threads
 *
 * Safe & Idempotent:
 * - Can be executed repeatedly without duplication or data loss.
 * - Complies strictly with guard-seed-safety (zero prohibited fixture aliases or credential logging).
 */
async function main() {
  const seedPassword = process.env.DEV_SEED_USER_PASSWORD || "DevSeedPassword123!";
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("[SEED_DEV] Error: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const passwordHash = await passwordHashingService.hashPassword(seedPassword);

    await prisma.$transaction(async (tx) => {
      // 1. Roles
      const userRole = await tx.role.upsert({
        where: { name: "USER" },
        update: {},
        create: {
          name: "USER",
          description: "Standard registered user with default non-privileged access",
        },
      });

      const adminRole = await tx.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: {
          name: "ADMIN",
          description: "Administrative operator role for server-controlled governance operations",
        },
      });

      // 2. Demo & Development Accounts
      const userFixtures = [
        {
          email: "alex.demo2026@aura.internal",
          displayName: "Alex Rivera",
          roleId: userRole.id,
        },
        {
          email: "admin.aura2026@aura.internal",
          displayName: "Aura System Admin",
          roleId: adminRole.id,
        },
        {
          email: "dev.user1@aura.internal",
          displayName: "Dev User 1",
          roleId: userRole.id,
        },
        {
          email: "dev.user2@aura.internal",
          displayName: "Dev User 2",
          roleId: userRole.id,
        },
      ];

      const createdUserMap = new Map<string, string>();

      for (const fixture of userFixtures) {
        const u = await tx.user.upsert({
          where: { email: fixture.email },
          update: {
            displayName: fixture.displayName,
            status: "ACTIVE",
          },
          create: {
            email: fixture.email,
            displayName: fixture.displayName,
            status: "ACTIVE",
          },
        });

        createdUserMap.set(fixture.email, u.id);

        await tx.credential.upsert({
          where: { userId: u.id },
          update: {
            passwordHash,
            version: 1,
          },
          create: {
            userId: u.id,
            type: "PASSWORD",
            passwordHash,
            version: 1,
          },
        });

        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: u.id,
              roleId: fixture.roleId,
            },
          },
          update: {},
          create: {
            userId: u.id,
            roleId: fixture.roleId,
          },
        });
      }

      console.log(`[SEED_DEV] Roles & ${userFixtures.length} user fixtures ensured.`);

      // 3. Academy Curricula & Lessons
      const course1 = await tx.academyCourse.upsert({
        where: { slug: "investing-101" },
        update: {
          title: "Stock Investing 101",
          description: "Master fundamental stock analysis, market dynamics, and portfolio construction.",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
        create: {
          slug: "investing-101",
          title: "Stock Investing 101",
          description: "Master fundamental stock analysis, market dynamics, and portfolio construction.",
          level: "BEGINNER",
          status: "PUBLISHED",
          order: 1,
        },
      });

      const lesson1 = await tx.academyLesson.upsert({
        where: { courseId_slug: { courseId: course1.id, slug: "market-basics" } },
        update: {
          title: "Market Basics & Order Mechanics",
          order: 1,
          status: "PUBLISHED",
          content: "# Financial Market Foundations\n\nFinancial markets connect capital allocators with productive enterprise. In this lesson, learn how exchange matching engines process market and limit orders.",
        },
        create: {
          courseId: course1.id,
          slug: "market-basics",
          title: "Market Basics & Order Mechanics",
          order: 1,
          status: "PUBLISHED",
          content: "# Financial Market Foundations\n\nFinancial markets connect capital allocators with productive enterprise. In this lesson, learn how exchange matching engines process market and limit orders.",
        },
      });

      await tx.academyLesson.upsert({
        where: { courseId_slug: { courseId: course1.id, slug: "order-books" } },
        update: {
          title: "Order Book Depth & Spread Analysis",
          order: 2,
          status: "PUBLISHED",
          content: "# Order Execution Mechanics\n\nMarket orders execute immediately against standing book liquidity, whereas limit orders offer liquidity at defined price thresholds.",
        },
        create: {
          courseId: course1.id,
          slug: "order-books",
          title: "Order Book Depth & Spread Analysis",
          order: 2,
          status: "PUBLISHED",
          content: "# Order Execution Mechanics\n\nMarket orders execute immediately against standing book liquidity, whereas limit orders offer liquidity at defined price thresholds.",
        },
      });

      // Flashcards for lesson 1
      await tx.academyFlashcard.upsert({
        where: { lessonId_order: { lessonId: lesson1.id, order: 1 } },
        update: {
          front: "What is the primary role of capital markets?",
          back: "Efficient allocation of capital from savers/investors to productive businesses.",
        },
        create: {
          lessonId: lesson1.id,
          order: 1,
          front: "What is the primary role of capital markets?",
          back: "Efficient allocation of capital from savers/investors to productive businesses.",
        },
      });

      const course2 = await tx.academyCourse.upsert({
        where: { slug: "advanced-derivatives" },
        update: {
          title: "Options & Derivatives Trading",
          description: "Strategic option contracts, risk hedging, and volatility positioning.",
          level: "ADVANCED",
          status: "PUBLISHED",
          order: 2,
        },
        create: {
          slug: "advanced-derivatives",
          title: "Options & Derivatives Trading",
          description: "Strategic option contracts, risk hedging, and volatility positioning.",
          level: "ADVANCED",
          status: "PUBLISHED",
          order: 2,
        },
      });

      await tx.academyLesson.upsert({
        where: { courseId_slug: { courseId: course2.id, slug: "options-greeks" } },
        update: {
          title: "The Options Greeks: Delta, Gamma, Theta",
          order: 1,
          status: "PUBLISHED",
          content: "# Option Contracts & The Greeks\n\nAn option is a standardized derivative contract. The Greeks measure position sensitivity to underlying asset price, time decay, and implied volatility.",
        },
        create: {
          courseId: course2.id,
          slug: "options-greeks",
          title: "The Options Greeks: Delta, Gamma, Theta",
          order: 1,
          status: "PUBLISHED",
          content: "# Option Contracts & The Greeks\n\nAn option is a standardized derivative contract. The Greeks measure position sensitivity to underlying asset price, time decay, and implied volatility.",
        },
      });

      console.log("[SEED_DEV] Academy courses and lessons ensured.");

      // 4. Simulation Engine: Scenario, Assets & Market Snapshots
      const scenario = await tx.simulationScenario.upsert({
        where: { key: "MVP_SCENARIO" },
        update: { name: "Standard Market Session", status: "ACTIVE" },
        create: { key: "MVP_SCENARIO", name: "Standard Market Session", status: "ACTIVE" },
      });

      const assetList = [
        { symbol: "AURA", name: "Aura Capital Inc.", order: 1, p1: "150.000000", p2: "152.500000", p3: "155.000000" },
        { symbol: "AAPL", name: "Apple Inc.", order: 2, p1: "220.000000", p2: "224.300000", p3: "228.000000" },
        { symbol: "MSFT", name: "Microsoft Corporation", order: 3, p1: "440.000000", p2: "448.200000", p3: "452.000000" },
        { symbol: "NVDA", name: "NVIDIA Corporation", order: 4, p1: "125.000000", p2: "128.900000", p3: "131.500000" },
      ];

      for (const assetSpec of assetList) {
        const asset = await tx.simulationAsset.upsert({
          where: { symbol: assetSpec.symbol },
          update: { name: assetSpec.name, displayOrder: assetSpec.order, status: "ACTIVE" },
          create: { symbol: assetSpec.symbol, name: assetSpec.name, displayOrder: assetSpec.order, status: "ACTIVE" },
        });

        const cycles = [
          { cycle: 1, price: assetSpec.p1 },
          { cycle: 2, price: assetSpec.p2 },
          { cycle: 3, price: assetSpec.p3 },
        ];

        for (const c of cycles) {
          await tx.simulationMarketSnapshot.upsert({
            where: { scenarioId_cycle_assetId: { scenarioId: scenario.id, cycle: c.cycle, assetId: asset.id } },
            update: { price: c.price, occurredAt: new Date() },
            create: { scenarioId: scenario.id, assetId: asset.id, cycle: c.cycle, price: c.price, occurredAt: new Date() },
          });
        }
      }

      console.log("[SEED_DEV] Simulation scenario, assets, and cycle snapshots ensured.");

      // 5. Community Discussions
      const alexId = createdUserMap.get("alex.demo2026@aura.internal");
      const dev1Id = createdUserMap.get("dev.user1@aura.internal");
      const dev2Id = createdUserMap.get("dev.user2@aura.internal");

      if (alexId && dev1Id && dev2Id) {
        const seedPosts = [
          {
            authorId: alexId,
            content: "# Market Volatility Analysis\n\nDiscussing risk management in volatile market cycles. In high volatility regimes, position sizing and risk discipline are critical to long-term compounding.",
          },
          {
            authorId: dev1Id,
            content: "Simulation Trading Order Execution Notes: Using limit orders during high volatility cycles helped preserve capital and avoid slippage in the technology scenario!",
          },
          {
            authorId: dev2Id,
            content: "When growth equities experience multiple expansion, value sectors often provide defensive rebalancing opportunities. Always track your risk-adjusted metrics.",
          },
        ];

        for (const postItem of seedPosts) {
          const existing = await tx.communityPost.findFirst({
            where: { authorId: postItem.authorId, content: postItem.content },
          });

          if (!existing) {
            await tx.communityPost.create({
              data: {
                authorId: postItem.authorId,
                content: postItem.content,
                status: "VISIBLE",
              },
            });
          }
        }
      }

      console.log("[SEED_DEV] Community discussions ensured.");
    });

    console.log("[SEED_DEV] SUCCESS: All development and demo seed data successfully populated.");
    process.exit(0);
  } catch (err: unknown) {
    console.error("[SEED_DEV] FAILED:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
