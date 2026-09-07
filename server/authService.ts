/**
 * Server-Side Authentication & OTP Service
 * وحدة التحكم المركزية بالتوثيق، إرسال الرموز عبر SMTP/Twilio، وتخزينها في قاعدة البيانات
 */

import { sendOtpEmail } from "./emailService.js";
import { sendOtpSms } from "./smsService.js";
import { otpDatabase } from "./otpDatabase.js";

export interface RequestOtpParams {
  recipient: string;
  method: "email" | "phone";
  role?: string;
  accountName?: string;
  customCode?: string;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  deliveryMethod: "email" | "phone";
  recipient: string;
  realDelivered: boolean;
  deliveryDetails: string;
  previewUrl?: string;
  expiresInSeconds: number;
}

export interface VerifyOtpParams {
  recipient: string;
  method: "email" | "phone";
  code: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  verified: boolean;
  remainingAttempts?: number;
}

export class ServerAuthService {
  /**
   * Generates a cryptographically sound 6-digit numeric OTP code
   */
  public static generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Dispatches a real OTP to user's Email (via SMTP) or Phone (via Twilio)
   * and saves the verification entry in the temporary database store with a 10-minute TTL.
   */
  public static async sendOtp(params: RequestOtpParams): Promise<RequestOtpResponse> {
    const { recipient, method, role = "student", accountName = "المستخدم", customCode } = params;

    const cleanRecipient = recipient.trim().toLowerCase();
    const deliveryMethod = method === "phone" ? "phone" : "email";

    // 1. Generate or assign the 6-digit code
    const otpCode = customCode && String(customCode).length === 6
      ? String(customCode)
      : this.generateOtpCode();

    let realSent = false;
    let deliveryDetails = "";
    let previewUrl: string | undefined = undefined;
    let messageId: string | undefined = undefined;

    // 2. Dispatch via intermediary broker
    if (deliveryMethod === "email") {
      const mailResult = await sendOtpEmail({
        recipientEmail: cleanRecipient,
        otpCode,
        accountName,
        role,
      });

      realSent = mailResult.success;
      deliveryDetails = mailResult.details;
      previewUrl = mailResult.previewUrl;
      messageId = mailResult.messageId;
    } else {
      const smsResult = await sendOtpSms({
        phoneNumber: cleanRecipient,
        otpCode,
        accountName,
        role,
      });

      realSent = smsResult.success;
      deliveryDetails = smsResult.details;
      messageId = smsResult.sid;
    }

    // 3. Store in the temporary database with TTL (10 minutes)
    otpDatabase.saveOtp({
      recipient: cleanRecipient,
      method: deliveryMethod,
      code: otpCode,
      role,
      accountName,
      ttlSeconds: 600,
      deliveryProvider: deliveryDetails,
      messageId,
    });

    const userMessage =
      deliveryMethod === "email"
        ? `تم إرسال كود التحقق (OTP) بنجاح إلى البريد الإلكتروني (${cleanRecipient}). يرجى فحص صندوق الوارد أو البريد غير المرغوب به (Spam).`
        : `تم إرسال كود التحقق (OTP) بنجاح إلى رقم الهاتف (${cleanRecipient}). يرجى التحقق من الرسائل النصية SMS الواردة.`;

    return {
      success: true,
      message: userMessage,
      deliveryMethod,
      recipient: cleanRecipient,
      realDelivered: realSent,
      deliveryDetails,
      previewUrl,
      expiresInSeconds: 600,
    };
  }

  /**
   * Verifies the OTP code supplied by the client against the database record
   */
  public static verifyOtp(params: VerifyOtpParams): VerifyOtpResponse {
    const { recipient, method, code } = params;
    const cleanRecipient = recipient.trim().toLowerCase();
    const deliveryMethod = method === "phone" ? "phone" : "email";

    const result = otpDatabase.verifyOtp(deliveryMethod, cleanRecipient, code);

    return {
      success: result.valid,
      message: result.message,
      verified: result.valid,
      remainingAttempts: result.remainingAttempts,
    };
  }
}
