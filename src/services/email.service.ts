import { Resend } from "resend";
import {
  passwordChangedTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
  welcomeTemplate,
} from "../emails/templates";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Elite Scope <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

async function send(to: string, subject: string, html: string) {
  const resend = getClient();

  if (!resend) {
    // Don't crash auth flows just because email isn't configured in this
    // environment (e.g. local dev without a RESEND_API_KEY). Log loudly instead.
    console.warn(
      `[email.service] RESEND_API_KEY not set — skipped sending "${subject}" to ${to}`,
    );
    return { skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email.service] Resend error:", error);
    throw new Error("Failed to send email");
  }

  return data;
}

export const emailService = {
  sendVerificationOtp: (to: string, firstName: string, otp: string) => {
    const { subject, html } = verifyEmailTemplate({ firstName, otp });
    return send(to, subject, html);
  },

  sendWelcome: (to: string, firstName: string) => {
    const { subject, html } = welcomeTemplate({ firstName });
    return send(to, subject, html);
  },

  sendPasswordResetOtp: (to: string, firstName: string, otp: string) => {
    const { subject, html } = resetPasswordTemplate({ firstName, otp });
    return send(to, subject, html);
  },

  sendPasswordChanged: (to: string, firstName: string) => {
    const { subject, html } = passwordChangedTemplate({ firstName });
    return send(to, subject, html);
  },
};
