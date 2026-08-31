import { z } from "zod";
import {
  HealthStatusSchema,
  ErrorEnvelopeSchema,
  EnvConfigSchema,
  RegisterRequestSchema,
  SafeUserSchema,
  RegisterResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  AccessTokenClaimsSchema,
  AuthMeResponseSchema,
  RefreshResponseSchema,
} from "../schemas/index.js";

export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
export type EnvConfig = z.infer<typeof EnvConfigSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type SafeUser = z.infer<typeof SafeUserSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;
export type AuthMeResponse = z.infer<typeof AuthMeResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
