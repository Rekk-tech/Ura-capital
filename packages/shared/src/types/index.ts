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

export * from "./product-audit.types.js";
export * from "./seed.types.js";

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

// FEAT-023 Quiz Definition & Safe Projection DTOs
export interface QuizOptionDto {
  id: string;
  text: string;
  order: number;
}

export interface QuizQuestionDto {
  id: string;
  prompt: string;
  type: "SINGLE_CHOICE";
  order: number;
  options: QuizOptionDto[];
}

export interface QuizDefinitionDto {
  id: string;
  courseSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  title: string;
  description: string | null;
  passingScore: number;
  totalQuestions: number;
  questions: QuizQuestionDto[];
}

export interface QuizDefinitionResponse {
  data: QuizDefinitionDto;
}
