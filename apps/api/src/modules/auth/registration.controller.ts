import type { Request, Response, NextFunction } from "express";
import {
  RegisterRequestSchema,
  RequestOtpRequestSchema,
  VerifyOtpRequestSchema,
} from "./registration.schema.js";
import {
  type IRegistrationService,
  registrationService,
} from "./registration.service.js";
import { AppError } from "../../shared/errors/error-envelope.js";
import { ERROR_CODES, HTTP_STATUS } from "@aura/shared";
import { ZodError } from "zod";

export class RegistrationController {
  constructor(private readonly service: IRegistrationService = registrationService) {}

  /**
   * FEAT-090: POST /auth/register/request-otp
   */
  async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = RequestOtpRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstIssue = parseResult.error.issues[0];
        const errorMessage = firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Invalid request OTP payload";

        throw new AppError(
          errorMessage,
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const response = await this.service.requestOtp(parseResult.data, {
        requestId: req.id,
        userAgent: (req.headers["user-agent"] as string) || null,
      });

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * FEAT-090: POST /auth/register/verify-otp
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = VerifyOtpRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstIssue = parseResult.error.issues[0];
        const errorMessage = firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Mã OTP không hợp lệ";

        throw new AppError(
          errorMessage,
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const response = await this.service.verifyOtp(parseResult.data, {
        requestId: req.id,
        userAgent: (req.headers["user-agent"] as string) || null,
      });

      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = RegisterRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstIssue = parseResult.error.issues[0];
        const errorMessage = firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Invalid registration payload";

        throw new AppError(
          errorMessage,
          ERROR_CODES.VALIDATION_ERROR,
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const response = await this.service.register(parseResult.data, {
        requestId: req.id,
        userAgent: (req.headers["user-agent"] as string) || null,
      });
      res.status(HTTP_STATUS.CREATED).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const errorMessage = firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Validation failed";
        next(new AppError(errorMessage, ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST));
        return;
      }
      next(error);
    }
  }
}

export const registrationController = new RegistrationController();
