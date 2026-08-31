import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { assertSafeTestDatabase, sanitizeDiagnosticMessage } from "../helpers/test-db-guard.js";
import { mapDatabaseError } from "../../src/infrastructure/database/error-mapper.js";
import { PrismaUserRepository } from "../../src/modules/users/user.repository.js";
import { PrismaCredentialRepository } from "../../src/modules/auth/credential.repository.js";
import { PrismaRoleRepository } from "../../src/modules/auth/role.repository.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resetFixtureTables(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "constraint_fixture_restrict_children";`;
  await prisma.$executeRaw`DELETE FROM "constraint_fixture_cascade_children";`;
  await prisma.$executeRaw`DELETE FROM "constraint_fixture_nullable_children";`;
  await prisma.$executeRaw`DELETE FROM "constraint_fixture_parents";`;
}

async function dropFixtureTables(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`DROP TABLE IF EXISTS "constraint_fixture_restrict_children";`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS "constraint_fixture_cascade_children";`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS "constraint_fixture_nullable_children";`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS "constraint_fixture_parents";`;
}

async function createFixtureTables(prisma: PrismaClient): Promise<void> {
  await dropFixtureTables(prisma);

  await prisma.$executeRaw`
    CREATE TABLE "constraint_fixture_parents" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "constraint_fixture_parents_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "constraint_fixture_parents_code_key" UNIQUE ("code"),
      CONSTRAINT "constraint_fixture_parents_status_check" CHECK ("status" IN ('ACTIVE', 'ARCHIVED'))
    );
  `;

  await prisma.$executeRaw`
    CREATE TABLE "constraint_fixture_restrict_children" (
      "id" TEXT NOT NULL,
      "parent_id" TEXT NOT NULL,
      "ordinal" INTEGER NOT NULL,
      "label" TEXT NOT NULL,
      CONSTRAINT "constraint_fixture_restrict_children_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "constraint_fixture_restrict_children_parent_ordinal_key" UNIQUE ("parent_id", "ordinal"),
      CONSTRAINT "constraint_fixture_restrict_children_parent_id_fkey"
        FOREIGN KEY ("parent_id") REFERENCES "constraint_fixture_parents"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `;

  await prisma.$executeRaw`
    CREATE TABLE "constraint_fixture_cascade_children" (
      "id" TEXT NOT NULL,
      "parent_id" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      CONSTRAINT "constraint_fixture_cascade_children_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "constraint_fixture_cascade_children_parent_id_fkey"
        FOREIGN KEY ("parent_id") REFERENCES "constraint_fixture_parents"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  await prisma.$executeRaw`
    CREATE TABLE "constraint_fixture_nullable_children" (
      "id" TEXT NOT NULL,
      "parent_id" TEXT,
      "label" TEXT NOT NULL,
      CONSTRAINT "constraint_fixture_nullable_children_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "constraint_fixture_nullable_children_parent_id_fkey"
        FOREIGN KEY ("parent_id") REFERENCES "constraint_fixture_parents"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    );
  `;
}

async function createFixtureParent(prisma: PrismaClient, code: string): Promise<string> {
  const id = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "constraint_fixture_parents" ("id", "code", "status")
    VALUES (${id}, ${code}, 'ACTIVE');
  `;
  return id;
}

describe("FEAT-014 Core Domain Constraint Baseline (PostgreSQL)", () => {
  const testDbUrl =
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword@localhost:5432/aura_capital_test";

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
      await createFixtureTables(prisma);
    } catch (err: unknown) {
      const errorMessage = sanitizeDiagnosticMessage(err instanceof Error ? err.message : String(err));
      throw new Error(
        `[DB_CONNECTION_FAILED] Required PostgreSQL test database is unreachable. Error: ${errorMessage}`,
      );
    }
  });

  beforeEach(async () => {
    await prisma.authSecurityAuditRecord.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.credential.deleteMany();
    await prisma.refreshSession.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await resetFixtureTables(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      try {
        await resetFixtureTables(prisma);
        await dropFixtureTables(prisma);
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  it("proves approved schema primary keys are server-generated UUID values", async () => {
    const userRepo = new PrismaUserRepository(prisma);
    const user = await userRepo.create({
      email: "feat014.uuid@aura.local",
      displayName: "FEAT-014 UUID",
    });

    expect(user.id).toMatch(UUID_PATTERN);
  });

  it("rejects missing required values with PostgreSQL NOT NULL constraints", async () => {
    const id = crypto.randomUUID();

    await expect(
      prisma.$executeRaw`
        INSERT INTO "constraint_fixture_parents" ("id", "code", "status")
        VALUES (${id}, ${null}, 'ACTIVE');
      `,
    ).rejects.toThrow();
  });

  it("rejects duplicate unique values at the database layer", async () => {
    await createFixtureParent(prisma, "unique-code");

    await expect(createFixtureParent(prisma, "unique-code")).rejects.toThrow();
  });

  it("rejects duplicate composite unique pairs at the database layer", async () => {
    const parentId = await createFixtureParent(prisma, "composite-parent");

    await prisma.$executeRaw`
      INSERT INTO "constraint_fixture_restrict_children" ("id", "parent_id", "ordinal", "label")
      VALUES (${crypto.randomUUID()}, ${parentId}, ${1}, 'first');
    `;

    await expect(
      prisma.$executeRaw`
        INSERT INTO "constraint_fixture_restrict_children" ("id", "parent_id", "ordinal", "label")
        VALUES (${crypto.randomUUID()}, ${parentId}, ${1}, 'duplicate');
      `,
    ).rejects.toThrow();
  });

  it("rejects invalid foreign keys and accepts valid foreign keys", async () => {
    const parentId = await createFixtureParent(prisma, "valid-fk-parent");
    const invalidParentId = crypto.randomUUID();

    await expect(
      prisma.$executeRaw`
        INSERT INTO "constraint_fixture_restrict_children" ("id", "parent_id", "ordinal", "label")
        VALUES (${crypto.randomUUID()}, ${invalidParentId}, ${1}, 'invalid');
      `,
    ).rejects.toThrow();

    await prisma.$executeRaw`
      INSERT INTO "constraint_fixture_restrict_children" ("id", "parent_id", "ordinal", "label")
      VALUES (${crypto.randomUUID()}, ${parentId}, ${1}, 'valid');
    `;

    const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "constraint_fixture_restrict_children"
      WHERE "parent_id" = ${parentId};
    `;
    expect(count[0]?.count).toBe(1n);
  });

  it("enforces one-to-one uniqueness on the approved Credential user relationship", async () => {
    const userRepo = new PrismaUserRepository(prisma);
    const credentialRepo = new PrismaCredentialRepository(prisma);
    const user = await userRepo.create({
      email: "feat014.credential@aura.local",
      displayName: "FEAT-014 Credential",
    });

    await credentialRepo.create({
      userId: user.id,
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$feat014hash",
    });

    await expect(
      credentialRepo.create({
        userId: user.id,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$duplicate",
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });

  it("enforces cascade deletion only for strictly dependent fixture records", async () => {
    const parentId = await createFixtureParent(prisma, "cascade-parent");

    await prisma.$executeRaw`
      INSERT INTO "constraint_fixture_cascade_children" ("id", "parent_id", "label")
      VALUES (${crypto.randomUUID()}, ${parentId}, 'cascade-child');
    `;

    await prisma.$executeRaw`DELETE FROM "constraint_fixture_parents" WHERE "id" = ${parentId};`;

    const count = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "constraint_fixture_cascade_children"
      WHERE "parent_id" = ${parentId};
    `;
    expect(count[0]?.count).toBe(0n);
  });

  it("enforces restrict/no-action behavior for independently meaningful fixture records", async () => {
    const parentId = await createFixtureParent(prisma, "restrict-parent");

    await prisma.$executeRaw`
      INSERT INTO "constraint_fixture_restrict_children" ("id", "parent_id", "ordinal", "label")
      VALUES (${crypto.randomUUID()}, ${parentId}, ${1}, 'restrict-child');
    `;

    await expect(
      prisma.$executeRaw`DELETE FROM "constraint_fixture_parents" WHERE "id" = ${parentId};`,
    ).rejects.toThrow();

    const parent = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "constraint_fixture_parents" WHERE "id" = ${parentId};
    `;
    expect(parent[0]?.id).toBe(parentId);
  });

  it("enforces set-null behavior only for optional historical fixture references", async () => {
    const parentId = await createFixtureParent(prisma, "nullable-parent");
    const childId = crypto.randomUUID();

    await prisma.$executeRaw`
      INSERT INTO "constraint_fixture_nullable_children" ("id", "parent_id", "label")
      VALUES (${childId}, ${parentId}, 'nullable-child');
    `;

    await prisma.$executeRaw`DELETE FROM "constraint_fixture_parents" WHERE "id" = ${parentId};`;

    const child = await prisma.$queryRaw<Array<{ parent_id: string | null }>>`
      SELECT "parent_id" FROM "constraint_fixture_nullable_children" WHERE "id" = ${childId};
    `;
    expect(child[0]?.parent_id).toBeNull();
  });

  it("enforces closed-set enum/status integrity with a database check constraint fixture", async () => {
    await expect(
      prisma.$executeRaw`
        INSERT INTO "constraint_fixture_parents" ("id", "code", "status")
        VALUES (${crypto.randomUUID()}, 'invalid-status', 'DISABLED');
      `,
    ).rejects.toThrow();

    await createFixtureParent(prisma, "valid-status");
    const rows = await prisma.$queryRaw<Array<{ status: string }>>`
      SELECT "status" FROM "constraint_fixture_parents" WHERE "code" = 'valid-status';
    `;
    expect(rows[0]?.status).toBe("ACTIVE");
  });

  it("proves duplicate/concurrent persistence is ultimately protected by PostgreSQL uniqueness", async () => {
    const userRepo = new PrismaUserRepository(prisma);
    const attempts = await Promise.allSettled([
      userRepo.create({ email: "feat014.race@aura.local", displayName: "Race 1" }),
      userRepo.create({ email: "FEAT014.RACE@aura.local", displayName: "Race 2" }),
    ]);

    const fulfilled = attempts.filter((result) => result.status === "fulfilled");
    const rejected = attempts.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const count = await prisma.user.count({ where: { email: "feat014.race@aura.local" } });
    expect(count).toBe(1);
  });

  it("maps constraint failures to safe errors without exposing raw database internals", async () => {
    const roleRepo = new PrismaRoleRepository(prisma);
    const role = await roleRepo.createRole("FEAT014_SAFE_ERROR", "Safe error role");

    let mappedMessage = "";
    try {
      await roleRepo.createRole(role.name, "Duplicate safe error role");
    } catch (err: unknown) {
      const mapped = mapDatabaseError(err);
      mappedMessage = mapped.message;
    }

    expect(mappedMessage).toBe("A resource with these unique identifiers already exists.");
    expect(mappedMessage).not.toMatch(/postgres(?:ql)?:\/\//i);
    expect(mappedMessage).not.toMatch(/\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i);
    expect(mappedMessage).not.toMatch(/password|secret|token|cookie/i);
  });
});
