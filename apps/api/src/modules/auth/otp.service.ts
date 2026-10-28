import crypto from "node:crypto";
import { getRedisClient } from "../../infrastructure/redis/redis.js";
import { logger } from "../../infrastructure/logging/logger.js";

export interface PendingRegistrationPayload {
  email: string;
  passwordHash: string;
  displayName?: string | null;
  otp: string;
  createdAt: number;
}

export interface IOtpService {
  generateOtp(): string;
  storeRegistrationOtp(email: string, passwordHash: string, displayName?: string | null): Promise<string>;
  verifyAndConsumeRegistrationOtp(email: string, submittedOtp: string): Promise<PendingRegistrationPayload | null>;
  clearRegistrationOtp(email: string): Promise<void>;
}

export class OtpService implements IOtpService {
  private readonly ttlSeconds: number;
  private readonly memoryStore = new Map<string, { payload: PendingRegistrationPayload; expiresAt: number }>();

  constructor(ttlSeconds = 300) {
    this.ttlSeconds = ttlSeconds;
  }

  private getKey(email: string): string {
    return `auth:otp:register:${email.trim().toLowerCase()}`;
  }

  generateOtp(): string {
    // Generate secure 6-digit numeric OTP [100000..999999]
    return crypto.randomInt(100000, 1000000).toString();
  }

  async storeRegistrationOtp(
    email: string,
    passwordHash: string,
    displayName?: string | null,
  ): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();
    const otp = this.generateOtp();
    const payload: PendingRegistrationPayload = {
      email: normalizedEmail,
      passwordHash,
      displayName: displayName ?? null,
      otp,
      createdAt: Date.now(),
    };

    const key = this.getKey(normalizedEmail);

    try {
      const redis = getRedisClient();
      await redis.set(key, JSON.stringify(payload), "EX", this.ttlSeconds);
      logger.info("Registration OTP saved to Redis with 300s TTL", { email: normalizedEmail });
    } catch (err: unknown) {
      logger.warn("Redis unavailable for OTP, falling back to memory store", { error: err, email: normalizedEmail });
      this.memoryStore.set(key, {
        payload,
        expiresAt: Date.now() + this.ttlSeconds * 1000,
      });
    }

    return otp;
  }

  async verifyAndConsumeRegistrationOtp(
    email: string,
    submittedOtp: string,
  ): Promise<PendingRegistrationPayload | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const key = this.getKey(normalizedEmail);
    const trimmedOtp = submittedOtp.trim();

    let rawData: string | null = null;

    try {
      const redis = getRedisClient();
      rawData = await redis.get(key);
      if (rawData) {
        const parsed = JSON.parse(rawData) as PendingRegistrationPayload;
        if (parsed.otp === trimmedOtp) {
          // Atomic consume: delete OTP key so it cannot be replayed
          await redis.del(key);
          return parsed;
        }
        return null;
      }
    } catch (err: unknown) {
      logger.warn("Redis read failed for OTP, checking memory store fallback", { error: err, email: normalizedEmail });
    }

    // Check memory fallback
    const memEntry = this.memoryStore.get(key);
    if (memEntry) {
      if (Date.now() > memEntry.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }
      if (memEntry.payload.otp === trimmedOtp) {
        this.memoryStore.delete(key);
        return memEntry.payload;
      }
    }

    return null;
  }

  async clearRegistrationOtp(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const key = this.getKey(normalizedEmail);

    try {
      const redis = getRedisClient();
      await redis.del(key);
    } catch {
      // ignore
    }
    this.memoryStore.delete(key);
  }
}

export const otpService = new OtpService();

