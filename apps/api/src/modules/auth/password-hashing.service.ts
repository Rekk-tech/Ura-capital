import * as argon2 from "@node-rs/argon2";

export interface Argon2idOptions {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
}

export const APPROVED_ARGON2ID_PARAMS: Argon2idOptions = {
  memoryCost: 19456, // 19 MiB minimum baseline
  timeCost: 2, // 2 iterations
  parallelism: 1, // 1 thread
};

// Numeric constant for Argon2id algorithm (Algorithm.Argon2id = 2) to comply with isolatedModules
export const ARGON2ID_ALGORITHM = 2;

export interface IPasswordHashingService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(hash: string, password: string): Promise<boolean>;
}

export class Argon2idPasswordHashingService implements IPasswordHashingService {
  constructor(private readonly options: Argon2idOptions = APPROVED_ARGON2ID_PARAMS) {}

  /**
   * Hashes a password using Argon2id with approved parameters and unique per-password salt.
   * Returns standard encoded format: $argon2id$v=19$m=19456,t=2,p=1$...
   */
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      algorithm: ARGON2ID_ALGORITHM,
      memoryCost: this.options.memoryCost,
      timeCost: this.options.timeCost,
      parallelism: this.options.parallelism,
    });
  }

  /**
   * Verifies an encoded Argon2id hash against a plaintext password candidate.
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}

export const passwordHashingService = new Argon2idPasswordHashingService();
