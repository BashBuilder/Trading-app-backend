import {
  APP_URL,
  renderButton,
  renderChip,
  renderEmailLayout,
  renderOtpBlock,
} from "./layout";
import { OTP_EXPIRY_MINUTES } from "../services/otp.service";

export function verifyEmailTemplate(opts: { firstName: string; otp: string }) {
  const { firstName, otp } = opts;
  const subject = `${otp} is your Elite Scope verification code`;

  const html = renderEmailLayout({
    previewText: `Your verification code is ${otp}`,
    heading: `Verify your email, ${firstName}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">
        Thanks for creating an Elite Scope account. Enter this code in the app to verify your email address:
      </p>
      ${renderOtpBlock(otp)}
      <p style="margin:0;">
        This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. If you didn't create an account, you can safely ignore this email.
      </p>
    `,
  });

  return { subject, html };
}

export function welcomeTemplate(opts: { firstName: string }) {
  const { firstName } = opts;
  const subject = "Welcome to Elite Scope";

  const html = renderEmailLayout({
    previewText: "Your account is verified — here's what's next.",
    heading: `You're all set, ${firstName}`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">
        Your email is verified and your Elite Scope account is ready. Here's what you get:
      </p>
      <div style="margin:0 0 20px 0;">
        ${renderChip("Live signal feeds")}
        ${renderChip("AI-scored setups")}
        ${renderChip("Market regime tracking")}
      </div>
      <p style="margin:0 0 4px 0;">
        Open the app and head to your dashboard to see today's active opportunities.
      </p>
      ${renderButton("Open Elite Scope", APP_URL)}
    `,
  });

  return { subject, html };
}

export function resetPasswordTemplate(opts: {
  firstName: string;
  otp: string;
}) {
  const { firstName, otp } = opts;
  const subject = `${otp} is your Elite Scope password reset code`;

  const html = renderEmailLayout({
    previewText: `Your password reset code is ${otp}`,
    heading: `Reset your password, ${firstName}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">
        We received a request to reset your Elite Scope password. Enter this code in the app to continue:
      </p>
      ${renderOtpBlock(otp)}
      <p style="margin:0;">
        This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>. If you didn't request this, your password is still safe — just ignore this email.
      </p>
    `,
    footerNote:
      "For your security, never share this code with anyone, including Elite Scope staff.",
  });

  return { subject, html };
}

export function passwordChangedTemplate(opts: { firstName: string }) {
  const { firstName } = opts;
  const subject = "Your Elite Scope password was changed";

  const html = renderEmailLayout({
    previewText: "Your password was just changed.",
    heading: `Password updated, ${firstName}`,
    bodyHtml: `
      <p style="margin:0 0 12px 0;">
        This is a confirmation that your Elite Scope account password was successfully changed on
        ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.
      </p>
      <p style="margin:0;">
        If this wasn't you, please contact support immediately so we can secure your account.
      </p>
    `,
    footerNote: "Sent for your security — no action needed if this was you.",
  });

  return { subject, html };
}

export function forwardContactTemplate(opts: {
  from: string;
  subject: string;
  body: string;
}) {
  const { from, subject, body } = opts;

  const html = renderEmailLayout({
    previewText: "You have a new contact email from support@elitescope.org",
    heading: `${from} sent you a message`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;">
        You have new contact email from ${from}. Here are the details:
      </p>
      <div style="margin:0 0 20px 0;">
        <strong>Subject:</strong> ${subject}<br/>
        <strong>Message:</strong> ${body}
      </div>
      <p style="margin:0 0 4px 0;">
        Please respond to the sender directly to continue the conversation.
      </p>
      ${renderButton("Open Elite Scope", APP_URL)}
    `,
  });

  return { subject, html };
}
