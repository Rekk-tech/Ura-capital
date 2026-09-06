import { PrismaClient } from "@prisma/client";
import { logger } from "../logging/logger.js";
import { getEnv } from "../config/env.js";

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const env = getEnv();
    const dbUrl =
      (env.NODE_ENV === "test" || process.env.NODE_ENV === "test" || process.env.VITEST) &&
      process.env.TEST_DATABASE_URL
        ? process.env.TEST_DATABASE_URL
        : env.DATABASE_URL;

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
      log:
        env.NODE_ENV === "development"
          ? [
              { emit: "event", level: "query" },
              { emit: "event", level: "error" },
              { emit: "event", level: "warn" },
            ]
          : [{ emit: "event", level: "error" }],
    });

    prismaInstance.$on("error" as never, () => {
      logger.error("Prisma Database Error Event", {
        category: "DATABASE_ERROR",
        error: "Database infrastructure error event",
      });
    });
  }

  return prismaInstance;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
