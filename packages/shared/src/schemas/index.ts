import { z } from "zod";

export const HealthStatusSchema = z.object({
  status: z.literal("healthy"),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string().datetime(),
  uptime: z.number().nonnegative(),
});

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
    details: z.record(z.unknown()).optional(),
  }),
});

const booleanFromString = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    if (lower === "false" || lower === "0") return false;
    if (lower === "true" || lower === "1") return true;
  }
  return val;
}, z.boolean().default(false));

export const EnvConfigSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default("localhost"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    REDIS_URL: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    AI_DAILY_QUOTA: z.coerce.number().int().positive().default(50),

    // Phase 2 Auth & Security Configuration (Explicitly required, no fallback)
    AUTH_ACCESS_TOKEN_SECRET: z
      .string({ required_error: "AUTH_ACCESS_TOKEN_SECRET is required" })
      .min(32, "AUTH_ACCESS_TOKEN_SECRET is required and must be at least 32 characters long"),
    AUTH_REFRESH_TOKEN_SECRET: z
      .string({ required_error: "AUTH_REFRESH_TOKEN_SECRET is required" })
      .min(32, "AUTH_REFRESH_TOKEN_SECRET is required and must be at least 32 characters long"),
    AUTH_ACCESS_TOKEN_TTL_MINUTES: z.coerce
      .number()
      .int()
      .min(5, "AUTH_ACCESS_TOKEN_TTL_MINUTES must be between 5 and 15 minutes")
      .max(15, "AUTH_ACCESS_TOKEN_TTL_MINUTES must be between 5 and 15 minutes")
      .default(15),
    AUTH_ACCESS_TOKEN_ISSUER: z
      .string({ required_error: "AUTH_ACCESS_TOKEN_ISSUER is required" })
      .min(1, "AUTH_ACCESS_TOKEN_ISSUER is required and must not be empty"),
    AUTH_ACCESS_TOKEN_AUDIENCE: z
      .string({ required_error: "AUTH_ACCESS_TOKEN_AUDIENCE is required" })
      .min(1, "AUTH_ACCESS_TOKEN_AUDIENCE is required and must not be empty"),
    AUTH_REFRESH_TOKEN_TTL_DAYS: z.coerce
      .number()
      .int()
      .min(1, "AUTH_REFRESH_TOKEN_TTL_DAYS must be between 1 and 30 days")
      .max(30, "AUTH_REFRESH_TOKEN_TTL_DAYS must be between 1 and 30 days")
      .default(7),
    AUTH_REFRESH_COOKIE_NAME: z.string().default("aura_refresh_token"),
    AUTH_REFRESH_COOKIE_SECURE: booleanFromString,
    AUTH_REFRESH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
    AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

    // FEAT-010A Rate Limiting Configuration
    AUTH_RATE_LIMIT_ENABLED: z.preprocess((val) => {
      if (typeof val === "string") {
        const lower = val.trim().toLowerCase();
        if (lower === "false" || lower === "0") return false;
        if (lower === "true" || lower === "1") return true;
      }
      if (typeof val === "boolean") return val;
      if (process.env.NODE_ENV === "test") return false;
      return true;
    }, z.boolean().default(true)),
    AUTH_RATE_LIMIT_KEY_SECRET: z.string().optional(),
    AUTH_RATE_LIMIT_TRUST_PROXY: z.preprocess((val) => {
      if (typeof val === "string") {
        const lower = val.trim().toLowerCase();
        if (lower === "false" || lower === "0") return false;
        if (lower === "true" || lower === "1") return true;
      }
      if (val === undefined || val === null || val === "") return false;
      return val;
    }, z.boolean().default(false)),
  })
  .superRefine((data, ctx) => {
    // Production requirement: Refresh cookie MUST be Secure in production
    if (data.NODE_ENV === "production" && data.AUTH_REFRESH_COOKIE_SECURE !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AUTH_REFRESH_COOKIE_SECURE"],
        message: "AUTH_REFRESH_COOKIE_SECURE must be true in production environment",
      });
    }

    // FEAT-010A: Validate rate-limit HMAC secret when rate limiting is enabled
    if (data.AUTH_RATE_LIMIT_ENABLED && data.NODE_ENV !== "test") {
      if (!data.AUTH_RATE_LIMIT_KEY_SECRET || data.AUTH_RATE_LIMIT_KEY_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["AUTH_RATE_LIMIT_KEY_SECRET"],
          message: "AUTH_RATE_LIMIT_KEY_SECRET is required and must be at least 32 characters when rate limiting is enabled",
        });
      }

      // Must not reuse JWT/auth secrets
      if (data.AUTH_RATE_LIMIT_KEY_SECRET) {
        const reusedSecrets = [
          data.JWT_SECRET,
          data.AUTH_ACCESS_TOKEN_SECRET,
          data.AUTH_REFRESH_TOKEN_SECRET,
        ];
        if (reusedSecrets.includes(data.AUTH_RATE_LIMIT_KEY_SECRET)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["AUTH_RATE_LIMIT_KEY_SECRET"],
            message: "AUTH_RATE_LIMIT_KEY_SECRET must not reuse JWT_SECRET, AUTH_ACCESS_TOKEN_SECRET, or AUTH_REFRESH_TOKEN_SECRET",
          });
        }
      }
    }
  });

// FEAT-003 Registration Schemas
export const RegisterRequestSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(12, "Password must be at least 12 characters long")
    .max(128, "Password must not exceed 128 characters"),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name must not be empty if provided")
    .max(100, "Display name must not exceed 100 characters")
    .optional(),
});

export const SafeUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.string().datetime(),
});

export const RegisterResponseSchema = z.object({
  user: SafeUserSchema,
});

// FEAT-004 Login & Access Token Schemas
export const LoginRequestSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .max(128, "Password must not exceed 128 characters"),
});

export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
  user: SafeUserSchema,
});

export const AccessTokenClaimsSchema = z
  .object({
    sub: z.string().uuid(),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
    iss: z.string().min(1),
    aud: z.string().min(1),
    typ: z.literal("access"),
  })
  .strict();

export const AuthMeResponseSchema = z.object({
  user: SafeUserSchema,
});

// FEAT-005 Refresh Schemas
export const RefreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
  user: SafeUserSchema,
});
