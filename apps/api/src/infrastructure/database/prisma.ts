import { PrismaClient } from "@prisma/client";
import { logger } from "../logging/logger.js";
import { getEnv } from "../config/env.js";

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const env = getEnv();

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
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
