import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "../logging/logger.js";

export interface SendOtpOptions {
  to: string;
  otp: string;
  displayName?: string | null;
}

export interface IEmailService {
  sendOtpEmail(options: SendOtpOptions): Promise<boolean>;
}

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private readonly isConfigured: boolean;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true";

    if (host && user && pass) {
      this.isConfigured = true;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      logger.info("SMTP email transport configured successfully", { host, port });
    } else {
      this.isConfigured = false;
      logger.info("SMTP credentials not provided; email service running in Local/Dev console mode");
    }
  }

  async sendOtpEmail(options: SendOtpOptions): Promise<boolean> {
    const { to, otp, displayName } = options;
    const sender = process.env.SMTP_FROM || '"Aura Capital" <no-reply@auracapital.io>';
    const subject = `[Aura Capital] Mã xác thực đăng ký tài khoản: ${otp}`;
    const greeting = displayName ? `Xin chào ${displayName},` : "Xin chào nhà đầu tư,";

    // 1. Dual-Mode Fallback: Local / Dev Console logger if SMTP is not provided
    if (!this.isConfigured || !this.transporter) {
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

      // Print to stdout for developer convenience
      console.log(banner);

      logger.info("OTP dispatched via local dev logger", { to, otp: "******" });
      return true;
    }

    // 2. Production SMTP Dispatch
    try {
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

      await this.transporter.sendMail({
        from: sender,
        to,
        subject,
        html,
        text: `${greeting}\n\nMã xác thực đăng ký tài khoản Aura Capital của bạn là: ${otp} (Hiệu lực: 5 phút).\nTuyệt đối không chia sẻ mã này cho người khác.`,
      });

      logger.info("OTP email successfully sent via SMTP transport", { to });
      return true;
    } catch (err: unknown) {
      logger.error("Failed to send OTP email via SMTP transport", { error: err, to });
      throw err;
    }
  }
}

export const emailService = new EmailService();

