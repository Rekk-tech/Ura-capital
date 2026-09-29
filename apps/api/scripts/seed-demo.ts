import { PrismaClient } from "@prisma/client";
import { passwordHashingService } from "../src/modules/auth/password-hashing.service.js";

async function main() {
  console.log("[DEMO_SEED] Starting idempotent demo seed pack deployment...");

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  const demoPassword = process.env.DEV_SEED_USER_PASSWORD || "DevSeedPassword123!";
  const passwordHash = await passwordHashingService.hashPassword(demoPassword);

  try {
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

      await tx.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: {
          name: "ADMIN",
          description: "Administrative operator role for server-controlled governance operations",
        },
      });

      // 2. Demo Users
      const demoUsers = [
        { email: "dev.user1@aura.internal", displayName: "Dev User 1" },
        { email: "dev.user2@aura.internal", displayName: "Dev User 2" },
        { email: "alex.demo2026@aura.internal", displayName: "Alex Morgan" },
      ];

      const createdUserMap = new Map<string, string>();

      for (const u of demoUsers) {
        const user = await tx.user.upsert({
          where: { email: u.email },
          update: { displayName: u.displayName, status: "ACTIVE" },
          create: { email: u.email, displayName: u.displayName, status: "ACTIVE" },
        });

        createdUserMap.set(u.email, user.id);

        await tx.credential.upsert({
          where: { userId: user.id },
          update: { passwordHash, version: 1 },
          create: { userId: user.id, type: "PASSWORD", passwordHash, version: 1 },
        });

        await tx.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: userRole.id } },
          update: {},
          create: { userId: user.id, roleId: userRole.id },
        });
      }

      console.log(`[DEMO_SEED] Roles & ${demoUsers.length} users ensured.`);

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
          content: "# Financial Market Foundations\n\nFinancial markets connect capital allocators with productive enterprise...",
        },
        create: {
          courseId: course1.id,
          slug: "market-basics",
          title: "Market Basics & Order Mechanics",
          order: 1,
          status: "PUBLISHED",
          content: "# Financial Market Foundations\n\nFinancial markets connect capital allocators with productive enterprise...",
        },
      });

      await tx.academyLesson.upsert({
        where: { courseId_slug: { courseId: course1.id, slug: "order-books" } },
        update: {
          title: "Order Book Depth & Spread Analysis",
          order: 2,
          status: "PUBLISHED",
          content: "# Order Execution Mechanics\n\nMarket orders execute immediately against standing book liquidity...",
        },
        create: {
          courseId: course1.id,
          slug: "order-books",
          title: "Order Book Depth & Spread Analysis",
          order: 2,
          status: "PUBLISHED",
          content: "# Order Execution Mechanics\n\nMarket orders execute immediately against standing book liquidity...",
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
          content: "# Option Contracts & The Greeks\n\nAn option is a standardized derivative contract. The Greeks measure position sensitivity to price, time, and volatility...",
        },
        create: {
          courseId: course2.id,
          slug: "options-greeks",
          title: "The Options Greeks: Delta, Gamma, Theta",
          order: 1,
          status: "PUBLISHED",
          content: "# Option Contracts & The Greeks\n\nAn option is a standardized derivative contract. The Greeks measure position sensitivity to price, time, and volatility...",
        },
      });

      console.log("[DEMO_SEED] Academy courses and lessons ensured.");

      // 4. Simulation Engine: Scenario, Assets & Market Snapshots
      const scenario = await tx.simulationScenario.upsert({
        where: { key: "MVP_SCENARIO" },
        update: { name: "Standard Market Session", status: "ACTIVE" },
        create: { key: "MVP_SCENARIO", name: "Standard Market Session", status: "ACTIVE" },
      });

      const assetSpecs = [
        { symbol: "AURA", name: "Aura Capital Inc.", order: 1, p1: "150.000000", p2: "152.500000", p3: "155.000000" },
        { symbol: "AAPL", name: "Apple Inc.", order: 2, p1: "220.000000", p2: "224.300000", p3: "228.000000" },
        { symbol: "MSFT", name: "Microsoft Corporation", order: 3, p1: "440.000000", p2: "448.200000", p3: "452.000000" },
        { symbol: "NVDA", name: "NVIDIA Corporation", order: 4, p1: "125.000000", p2: "128.900000", p3: "131.500000" },
      ];

      for (const spec of assetSpecs) {
        const asset = await tx.simulationAsset.upsert({
          where: { symbol: spec.symbol },
          update: { name: spec.name, displayOrder: spec.order, status: "ACTIVE" },
          create: { symbol: spec.symbol, name: spec.name, displayOrder: spec.order, status: "ACTIVE" },
        });

        // Snapshots for cycles 1, 2, 3
        const cycles = [
          { cycle: 1, price: spec.p1 },
          { cycle: 2, price: spec.p2 },
          { cycle: 3, price: spec.p3 },
        ];

        for (const c of cycles) {
          await tx.simulationMarketSnapshot.upsert({
            where: { scenarioId_cycle_assetId: { scenarioId: scenario.id, cycle: c.cycle, assetId: asset.id } },
            update: { price: c.price, occurredAt: new Date() },
            create: { scenarioId: scenario.id, assetId: asset.id, cycle: c.cycle, price: c.price, occurredAt: new Date() },
          });
        }
      }

      console.log("[DEMO_SEED] Simulation scenario, assets, and cycle snapshots ensured.");

      // 5. Community Discussions
      const alexId = createdUserMap.get("alex.demo2026@aura.internal");
      const dev1Id = createdUserMap.get("dev.user1@aura.internal");
      const dev2Id = createdUserMap.get("dev.user2@aura.internal");

      if (alexId && dev1Id && dev2Id) {
        const demoPosts = [
          {
            authorId: alexId,
            content: "# Market Volatility Analysis\n\nDiscussing risk management in volatile market cycles. In high volatility regimes, position sizing and risk discipline are critical.",
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

        for (const p of demoPosts) {
          const existing = await tx.communityPost.findFirst({
            where: { authorId: p.authorId, content: p.content },
          });

          if (!existing) {
            await tx.communityPost.create({
              data: {
                authorId: p.authorId,
                content: p.content,
                status: "VISIBLE",
              },
            });
          }
        }
      }

      console.log("[DEMO_SEED] Community discussions ensured.");
    });

    console.log("[DEMO_SEED] SUCCESS: All demo fixtures successfully deployed.");
    process.exit(0);
  } catch (err: unknown) {
    console.error("[DEMO_SEED] FAILED:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
