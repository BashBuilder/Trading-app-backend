import crypto from "crypto";

export const OTP_PURPOSES = {
  VERIFY_EMAIL: "verify_email",
  RESET_PASSWORD: "reset_password",
} as const;

export type OtpPurpose = (typeof OTP_PURPOSES)[keyof typeof OTP_PURPOSES];

export const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
export const OTP_RESEND_COOLDOWN_SECONDS = Number(
  process.env.OTP_RESEND_COOLDOWN_SECONDS || 60,
);
export const OTP_MAX_ATTEMPTS = 5;

export type OtpRecord = {
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
};

/** Generates a 6-digit numeric OTP as a string, e.g. "042913". */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** OTPs are low-entropy by nature, so a fast SHA-256 hash (vs bcrypt) is fine here. */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function buildOtpRecord(purpose: OtpPurpose, code: string): OtpRecord {
  return {
    codeHash: hashOtp(code),
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date(),
  };
}

/** Firestore returns Timestamp objects for stored Dates — normalize to a JS Date. */
function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
}

export function verifyOtpRecord(
  record: OtpRecord | undefined | null,
  purpose: OtpPurpose,
  submittedCode: string,
): { ok: true } | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "mismatch" } {
  if (!record || record.purpose !== purpose) {
    return { ok: false, reason: "not_found" };
  }

  const expiresAt = toDate(record.expiresAt);
  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if ((record.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (hashOtp(submittedCode) !== record.codeHash) {
    return { ok: false, reason: "mismatch" };
  }

  return { ok: true };
}

export function secondsUntilResendAllowed(lastSentAt: any): number {
  const last = toDate(lastSentAt);
  if (!last) return 0;
  const elapsed = (Date.now() - last.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed));
}
