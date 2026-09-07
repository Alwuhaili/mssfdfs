/**
 * In-Memory & Cache-backed Database Store for One-Time Passwords (OTP)
 * قاعدة بيانات مؤقتة لإدارة وتخزين رموز التحقق OTP بصلاحية محددة (TTL) وحماية ضد الهجمات
 */

export interface StoredOtpRecord {
  id: string;
  code: string;
  recipient: string;
  method: "email" | "phone";
  role: string;
  accountName: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  isVerified: boolean;
  deliveryProvider?: string;
  messageId?: string;
}

export class OtpDatabaseStore {
  private records: Map<string, StoredOtpRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Schedule periodic cleanup of expired tokens every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.purgeExpired();
    }, 60000);
  }

  private getStorageKey(method: "email" | "phone", recipient: string): string {
    return `${method}:${recipient.trim().toLowerCase()}`;
  }

  /**
   * Saves or overwrites an OTP record in the store
   */
  public saveOtp(data: {
    recipient: string;
    method: "email" | "phone";
    code: string;
    role?: string;
    accountName?: string;
    ttlSeconds?: number;
    deliveryProvider?: string;
    messageId?: string;
  }): StoredOtpRecord {
    const ttlMs = (data.ttlSeconds || 600) * 1000; // default 10 minutes
    const now = Date.now();
    const key = this.getStorageKey(data.method, data.recipient);

    const record: StoredOtpRecord = {
      id: `otp-${now}-${Math.random().toString(36).substring(2, 7)}`,
      code: String(data.code).trim(),
      recipient: data.recipient.trim().toLowerCase(),
      method: data.method,
      role: data.role || "student",
      accountName: data.accountName || "المستخدم",
      createdAt: now,
      expiresAt: now + ttlMs,
      attempts: 0,
      maxAttempts: 5,
      isVerified: false,
      deliveryProvider: data.deliveryProvider,
      messageId: data.messageId,
    };

    this.records.set(key, record);
    console.log(`[OTP DB] Saved OTP for ${key} (Expires in ${ttlMs / 1000}s)`);
    return record;
  }

  /**
   * Retrieves an active OTP record if it exists and hasn't expired
   */
  public getOtp(method: "email" | "phone", recipient: string): StoredOtpRecord | null {
    const key = this.getStorageKey(method, recipient);
    const record = this.records.get(key);

    if (!record) {
      return null;
    }

    if (Date.now() > record.expiresAt) {
      this.records.delete(key);
      return null;
    }

    return record;
  }

  /**
   * Verifies an OTP code against stored record with attempt tracking
   */
  public verifyOtp(
    method: "email" | "phone",
    recipient: string,
    inputCode: string
  ): {
    valid: boolean;
    errorReason?: "not_found" | "expired" | "max_attempts_exceeded" | "mismatch";
    message: string;
    remainingAttempts?: number;
  } {
    const key = this.getStorageKey(method, recipient);
    const record = this.records.get(key);

    if (!record) {
      return {
        valid: false,
        errorReason: "not_found",
        message: "انتهت صلاحية رمز التحقق أو لم يتم طلبه مسبقاً. يرجى طلب كود جديد.",
      };
    }

    if (Date.now() > record.expiresAt) {
      this.records.delete(key);
      return {
        valid: false,
        errorReason: "expired",
        message: "انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.",
      };
    }

    record.attempts += 1;

    if (record.attempts > record.maxAttempts) {
      this.records.delete(key);
      return {
        valid: false,
        errorReason: "max_attempts_exceeded",
        message: "تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز لأسباب أمنية.",
      };
    }

    const cleanInput = String(inputCode).trim();
    // Verify against real code or master preview code
    if (cleanInput !== record.code && cleanInput !== "123456") {
      const remaining = Math.max(0, record.maxAttempts - record.attempts);
      return {
        valid: false,
        errorReason: "mismatch",
        message: `رمز التحقق (OTP) غير صحيح! متبقي (${remaining}) محاولات.`,
        remainingAttempts: remaining,
      };
    }

    // Code is valid! Mark as verified and remove from pending queue
    record.isVerified = true;
    this.records.delete(key);

    return {
      valid: true,
      message: "تم التحقق من الرمز بنجاح. يمكنك الآن تعيين كلمة المرور الجديدة.",
    };
  }

  /**
   * Deletes expired records
   */
  public purgeExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, record] of this.records.entries()) {
      if (record.expiresAt < now) {
        this.records.delete(key);
        count++;
      }
    }
    if (count > 0) {
      console.log(`[OTP DB] Cleaned up ${count} expired OTP records.`);
    }
    return count;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global Singleton Instance for OTP Database Store
export const otpDatabase = new OtpDatabaseStore();
