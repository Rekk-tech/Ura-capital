import { describe, it, expect } from "vitest";
import {
  Argon2idPasswordHashingService,
  APPROVED_ARGON2ID_PARAMS,
} from "../../src/modules/auth/password-hashing.service.js";

describe("Argon2id Password Hashing (Unit)", () => {
  const service = new Argon2idPasswordHashingService();

  it("hashes password with approved Argon2id baseline parameters", async () => {
    const password = "correct horse battery staple";
    const hash = await service.hashPassword(password);

    expect(hash).toBeDefined();
    // Check Argon2id format: $argon2id$v=19$m=19456,t=2,p=1$...
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).toContain(`m=${APPROVED_ARGON2ID_PARAMS.memoryCost}`);
    expect(hash).toContain(`t=${APPROVED_ARGON2ID_PARAMS.timeCost}`);
    expect(hash).toContain(`p=${APPROVED_ARGON2ID_PARAMS.parallelism}`);
    expect(hash).not.toEqual(password);
  });

  it("verifies matching password and rejects non-matching password", async () => {
    const password = "SuperSecret!Password99";
    const hash = await service.hashPassword(password);

    const isMatch = await service.verifyPassword(hash, password);
    expect(isMatch).toBe(true);

    const isNonMatch = await service.verifyPassword(hash, "wrong-password-12345");
    expect(isNonMatch).toBe(false);
  });

  it("produces distinct hashes for the same password due to unique per-password salt", async () => {
    const password = "identical-password-value-123";
    const hash1 = await service.hashPassword(password);
    const hash2 = await service.hashPassword(password);

    expect(hash1).not.toEqual(hash2);

    // Both distinct hashes should still successfully verify the password
    expect(await service.verifyPassword(hash1, password)).toBe(true);
    expect(await service.verifyPassword(hash2, password)).toBe(true);
  });

  it("handles malformed hash strings gracefully during verification without throwing unhandled exceptions", async () => {
    const isMatch = await service.verifyPassword("invalid-hash-format", "password123456");
    expect(isMatch).toBe(false);
  });
});
