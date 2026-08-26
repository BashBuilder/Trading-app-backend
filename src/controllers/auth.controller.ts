import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import { db } from "../config/firebase";
import { generateAccessToken, generateRefreshToken } from "../config/jwt";
import { emailService } from "../services/email.service";
import { throttle } from "../lib/throttle";
import {
  OTP_PURPOSES,
  OtpPurpose,
  buildOtpRecord,
  generateOtp,
  secondsUntilResendAllowed,
  verifyOtpRecord,
} from "../services/otp.service";

const usersCollection = db.collection("users");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Strips fields that should never leave the server (password hash, raw OTP data). */
function sanitizeUser(id: string, data: FirebaseFirestore.DocumentData) {
  const { password, otp, ...rest } = data;
  return { uid: id, ...rest };
}

async function findUserByEmail(email: string) {
  const snapshot = await usersCollection
    .where("email", "==", normalizeEmail(email))
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0];
}

async function issueOtpAndSend(
  userDoc: FirebaseFirestore.QueryDocumentSnapshot,
  purpose: OtpPurpose,
) {
  const user = userDoc.data();
  const otp = generateOtp();
  await userDoc.ref.update({ otp: buildOtpRecord(purpose, otp) });

  if (purpose === OTP_PURPOSES.VERIFY_EMAIL) {
    await emailService.sendVerificationOtp(user.email, user.firstName, otp);
  } else {
    await emailService.sendPasswordResetOtp(user.email, user.firstName, otp);
  }
}

export const authController = {
  // ✅ REGISTER
  register: async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const emailNormalized = normalizeEmail(email);
      if (!EMAIL_REGEX.test(emailNormalized)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        });
      }

      const existing = await findUserByEmail(emailNormalized);
      if (existing) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOtp();

      const userRef = await usersCollection.add({
        firstName,
        lastName,
        email: emailNormalized,
        password: hashedPassword,
        role: "user",
        emailVerified: false,
        createdAt: new Date(),
        otp: buildOtpRecord(OTP_PURPOSES.VERIFY_EMAIL, otp),
      });

      try {
        await emailService.sendVerificationOtp(emailNormalized, firstName, otp);
      } catch (err) {
        // Account is created either way — the user can request a new code.
        console.error("Failed to send verification email:", err);
      }

      return res.status(201).json({
        success: true,
        message: "Account created. Check your email for a verification code.",
        email: emailNormalized,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ VERIFY OTP (email verification or pre-check for password reset)
  verifyOtp: async (req: Request, res: Response) => {
    try {
      const { email, otp, purpose } = req.body;
      const resolvedPurpose: OtpPurpose = purpose || OTP_PURPOSES.VERIFY_EMAIL;

      if (!email || !otp) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      const userDoc = await findUserByEmail(email);
      if (!userDoc) {
        return res.status(400).json({ message: "Invalid code" });
      }

      const user = userDoc.data();
      const result = verifyOtpRecord(user.otp, resolvedPurpose, otp);

      if (!result.ok) {
        if (result.reason === "mismatch") {
          await userDoc.ref.update({
            "otp.attempts": admin.firestore.FieldValue.increment(1),
          });
        }
        const messages: Record<string, string> = {
          not_found: "Request a new code first",
          expired: "This code has expired. Request a new one.",
          too_many_attempts: "Too many attempts. Request a new code.",
          mismatch: "Invalid code",
        };
        return res.status(400).json({ message: messages[result.reason] });
      }

      if (resolvedPurpose === OTP_PURPOSES.VERIFY_EMAIL) {
        await userDoc.ref.update({
          emailVerified: true,
          otp: admin.firestore.FieldValue.delete(),
        });

        try {
          await emailService.sendWelcome(user.email, user.firstName);
        } catch (err) {
          console.error("Failed to send welcome email:", err);
        }

        // Auto-login right after verification.
        const accessToken = generateAccessToken(userDoc.id);
        const refreshToken = generateRefreshToken(userDoc.id);

        return res.json({
          success: true,
          message: "Email verified",
          user: sanitizeUser(userDoc.id, { ...user, emailVerified: true }),
          accessToken,
          refreshToken,
        });
      }

      // reset_password purpose: code is valid, but only consumed by /reset-password
      // so it can be checked again atomically alongside the new password.
      return res.json({ success: true, message: "Code verified" });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ RESEND OTP
  resendOtp: async (req: Request, res: Response) => {
    try {
      const { email, purpose } = req.body;
      const resolvedPurpose: OtpPurpose = purpose || OTP_PURPOSES.VERIFY_EMAIL;
      const generic = {
        success: true,
        message: "If an account exists for this email, a code has been sent.",
      };

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const rl = throttle({
        action: `resend-otp:${resolvedPurpose}`,
        identifier: normalizeEmail(email),
        limit: 5,
        windowSeconds: 15 * 60,
      });
      if (!rl.allowed) {
        return res.status(429).json({
          message: `Too many requests. Try again in ${rl.retryAfter}s.`,
        });
      }

      const userDoc = await findUserByEmail(email);
      if (!userDoc) return res.json(generic); // avoid leaking whether the email exists

      const user = userDoc.data();
      if (
        resolvedPurpose === OTP_PURPOSES.VERIFY_EMAIL &&
        user.emailVerified
      ) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const cooldown = secondsUntilResendAllowed(user.otp?.lastSentAt);
      if (user.otp?.purpose === resolvedPurpose && cooldown > 0) {
        return res
          .status(429)
          .json({ message: `Please wait ${cooldown}s before requesting another code.` });
      }

      await issueOtpAndSend(userDoc, resolvedPurpose);
      return res.json(generic);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ FORGOT PASSWORD
  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const generic = {
        success: true,
        message: "If an account exists for this email, a reset code has been sent.",
      };

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const rl = throttle({
        action: "forgot-password",
        identifier: normalizeEmail(email),
        limit: 5,
        windowSeconds: 15 * 60,
      });
      if (!rl.allowed) {
        return res.status(429).json({
          message: `Too many requests. Try again in ${rl.retryAfter}s.`,
        });
      }

      const userDoc = await findUserByEmail(email);
      if (!userDoc) return res.json(generic);

      const user = userDoc.data();
      const cooldown = secondsUntilResendAllowed(user.otp?.lastSentAt);
      if (user.otp?.purpose === OTP_PURPOSES.RESET_PASSWORD && cooldown > 0) {
        return res.json(generic); // still generic — don't confirm account existence via timing
      }

      await issueOtpAndSend(userDoc, OTP_PURPOSES.RESET_PASSWORD);
      return res.json(generic);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ RESET PASSWORD
  resetPassword: async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res
          .status(400)
          .json({ message: "Email, code and new password are required" });
      }
      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
        });
      }

      const userDoc = await findUserByEmail(email);
      if (!userDoc) {
        return res.status(400).json({ message: "Invalid code" });
      }

      const user = userDoc.data();
      const result = verifyOtpRecord(user.otp, OTP_PURPOSES.RESET_PASSWORD, otp);

      if (!result.ok) {
        if (result.reason === "mismatch") {
          await userDoc.ref.update({
            "otp.attempts": admin.firestore.FieldValue.increment(1),
          });
        }
        const messages: Record<string, string> = {
          not_found: "Request a new code first",
          expired: "This code has expired. Request a new one.",
          too_many_attempts: "Too many attempts. Request a new code.",
          mismatch: "Invalid code",
        };
        return res.status(400).json({ message: messages[result.reason] });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await userDoc.ref.update({
        password: hashedPassword,
        otp: admin.firestore.FieldValue.delete(),
      });

      try {
        await emailService.sendPasswordChanged(user.email, user.firstName);
      } catch (err) {
        console.error("Failed to send password-changed email:", err);
      }

      return res.json({
        success: true,
        message: "Password reset successfully. You can now log in.",
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ LOGIN
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const rl = throttle({
        action: "login",
        identifier: normalizeEmail(email),
        limit: 10,
        windowSeconds: 15 * 60,
      });
      if (!rl.allowed) {
        return res.status(429).json({
          message: `Too many login attempts. Try again in ${rl.retryAfter}s.`,
        });
      }

      const userDoc = await findUserByEmail(email);
      if (!userDoc) {
        return res.status(400).json({ message: "User not found" });
      }

      const user = userDoc.data();
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          message: "Please verify your email before logging in",
          emailVerified: false,
          email: user.email,
        });
      }

      if (user.active === false) {
        return res.status(403).json({
          message:
            "This account has been deactivated. Reactivate it to log back in.",
          deactivated: true,
        });
      }

      const accessToken = generateAccessToken(userDoc.id);
      const refreshToken = generateRefreshToken(userDoc.id);

      return res.json({
        user: sanitizeUser(userDoc.id, user),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ LOGOUT (client deletes token)
  logout: async (_req: Request, res: Response) => {
    return res.json({ message: "Logged out successfully" });
  },

  // ✅ DEACTIVATE ACCOUNT (requires an authenticated session + password confirmation)
  deactivateAccount: async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const userRef = usersCollection.doc(req.user.uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userDoc.data()!;
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect password" });
      }

      await userRef.update({
        active: false,
        deactivatedAt: new Date(),
      });

      return res.json({
        success: true,
        message: "Your account has been deactivated.",
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ REACTIVATE ACCOUNT (same credentials as login, for a previously deactivated account)
  reactivateAccount: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      const userDoc = await findUserByEmail(email);
      if (!userDoc) {
        return res.status(400).json({ message: "User not found" });
      }

      const user = userDoc.data();
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      await userDoc.ref.update({
        active: true,
        deactivatedAt: admin.firestore.FieldValue.delete(),
      });

      const accessToken = generateAccessToken(userDoc.id);
      const refreshToken = generateRefreshToken(userDoc.id);

      return res.json({
        success: true,
        message: "Account reactivated",
        user: sanitizeUser(userDoc.id, { ...user, active: true }),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },

  // ✅ GET USER (Protected route example)
  getUser: async (req: Request, res: Response) => {
    try {
      return res.json(req.user);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  },

  // ✅ REFRESH TOKEN
  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }

      const decoded: any = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string,
      );

      const newAccessToken = generateAccessToken(decoded.userId);

      return res.json({ accessToken: newAccessToken });
    } catch {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
  },

  getWebhook: async (req: Request, res: Response) => {
    console.log("Webhook query", req.query);
    console.log("Webhook hit with body:", req.body);
    return res.json({ message: "Webhook received" });
  },

  getAllUsers: async (_req: Request, res: Response) => {
    try {
      const snapshot = await usersCollection.get();
      const users = snapshot.docs.map((doc) => sanitizeUser(doc.id, doc.data()));
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  },
};
