import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../logging/logger.js";

export interface SendOtpOptions {
  to: string;
  otp: string;
  displayName?: string | null;
}

export interface IEmailService {
  readonly isConfigured: boolean;
  sendOtpEmail(options: SendOtpOptions): Promise<boolean>;
}

const cleanEnv = (val?: string): string | undefined => {
  if (!val) return undefined;
  const trimmed = val.trim();
  // Strip enclosing quotes if user supplied them in Render or .env
  return trimmed.replace(/^["']|["']$/g, "").trim();
};

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private resendApiKey: string | null = null;
  readonly isConfigured: boolean;

  constructor() {
    const resendKey = cleanEnv(process.env.RESEND_API_KEY);
    const host = cleanEnv(process.env.SMTP_HOST);
    const user = cleanEnv(process.env.SMTP_USER);
    const pass = cleanEnv(process.env.SMTP_PASS);
    const port = Number(cleanEnv(process.env.SMTP_PORT) || 587);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    if (resendKey) {
      this.resendApiKey = resendKey;
      this.isConfigured = true;
      logger.info("Email service configured with Resend HTTPS API (Port 443, Render Free resilient)");
    } else if (host && user && pass) {
      this.isConfigured = true;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      logger.info("SMTP email transport configured successfully with pool", { host, port, secure });
    } else {
      this.isConfigured = false;
      logger.info("No email credentials (RESEND_API_KEY or SMTP_*) provided; email service running in Local/Dev console mode");
    }
  }

  async sendOtpEmail(options: SendOtpOptions): Promise<boolean> {
    const { to, otp, displayName } = options;
    const sender = process.env.SMTP_FROM || process.env.RESEND_FROM || '"Aura Capital" <onboarding@resend.dev>';
    const subject = `[Aura Capital] Mã xác thực đăng ký tài khoản: ${otp}`;
    const greeting = displayName ? `Xin chào ${displayName},` : "Xin chào nhà đầu tư,";

    // 1. Dual-Mode Fallback: Local / Dev Console logger if no provider configured
    if (!this.isConfigured) {
      const banner = [
        "",
        "=================================================================",
        " [AURA CAPITAL EMAIL DISPATCH - LOCAL DEV / CONSOLE MODE]",
        ` To       : ${to}`,
        ` OTP Code : ${otp} (Hiệu lực: 5 phút / 300 giây)`,
        ` Time     : ${new Date().toISOString()}`,
        "=================================================================",
        "",
      ].join("\n");

      console.log(banner);
      logger.info("OTP dispatched via local dev logger", { to, otp: "******" });
      return true;
    }

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Mã Xác Thực Đăng Ký Aura Capital</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand { font-size: 20px; font-weight: 800; color: #1d6ff2; letter-spacing: -0.02em; margin-bottom: 20px; }
    .otp-box { background: #eff6ff; border: 1.5px dashed #3b82f6; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; }
    .note { font-size: 13px; color: #64748b; line-height: 1.6; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">AURA CAPITAL</div>
    <p style="font-size: 15px; font-weight: 600; margin-bottom: 8px;">${greeting}</p>
    <p style="font-size: 14px; color: #334155; line-height: 1.5;">
      Cảm ơn bạn đã đăng ký tham gia nền tảng đào tạo đầu tư tài chính Aura Capital. Vui lòng sử dụng mã xác thực dưới đây để hoàn tất việc kích hoạt tài khoản:
    </p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p class="note">
      ⏱️ <strong>Mã xác thực có hiệu lực trong vòng 5 phút</strong> (300 giây).<br>
      ⚠️ <em>Tuyệt đối không chia sẻ mã này cho bất kỳ ai để bảo vệ an toàn cho tài khoản của bạn.</em>
    </p>
    <div class="footer">
      © ${new Date().getFullYear()} Aura Capital Ecosystem. Hệ thống giả lập đào tạo tài chính chuẩn mực.
    </div>
  </div>
</body>
</html>
    `.trim();
    const text = `${greeting}\n\nMã xác thực đăng ký tài khoản Aura Capital của bạn là: ${otp} (Hiệu lực: 5 phút).\nTuyệt đối không chia sẻ mã này cho người khác.`;

    // 2. Resend HTTPS API Dispatch (Port 443 - Works 100% on Render Free)
    if (this.resendApiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: sender,
            to: [to],
            subject,
            html,
            text,
          }),
        });

        if (response.ok) {
          logger.info("OTP email successfully sent via Resend HTTPS API", { to });
          return true;
        }

        const errPayload = await response.json().catch(() => null);
        logger.error("Resend API rejected email dispatch", { status: response.status, errPayload, to });
        return false;
      } catch (err: unknown) {
        logger.error("Failed to dispatch OTP email via Resend HTTPS API", {
          error: err instanceof Error ? err.message : String(err),
          to,
        });
        return false;
      }
    }

    // 3. SMTP Transport Dispatch (Ports 587/465 - For VPS Docker Compose or Paid Cloud)
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: sender,
          to,
          subject,
          html,
          text,
        });

        logger.info("OTP email successfully sent via SMTP transport", { to });
        return true;
      } catch (err: unknown) {
        logger.error("Failed to send OTP email via SMTP transport", {
          error: err instanceof Error ? err.message : String(err),
          to,
        });
        return false;
      }
    }

    return false;
  }
}

export const emailService = new EmailService();

