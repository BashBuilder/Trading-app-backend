const BRAND_NAME = process.env.EMAIL_BRAND_NAME || "Elite Scope";
const LOGO_URL = process.env.EMAIL_LOGO_URL || "";
const APP_URL = process.env.APP_URL || "https://elitescope.app";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@elitescope.app";

const COLORS = {
  bg: "#03070f",
  card: "#0f1424",
  cardBorder: "#1e2438",
  chip: "#151b30",
  text: "#e2e8f0",
  muted: "#8b93a8",
  faint: "#5b6478",
  indigo: "#6366f1",
  indigoSoft: "rgba(99,102,241,0.15)",
};

/**
 * The logo badge falls back to a CSS/text wordmark when EMAIL_LOGO_URL isn't
 * configured — most email clients block remote images by default anyway
 * (and can't load a locally-bundled app asset), so the fallback is not just
 * a safety net, it's what most recipients will actually see unless they
 * explicitly allow images.
 */
function renderLogo(): string {
  if (LOGO_URL) {
    return `
      <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="40" height="40"
        style="display:block;border-radius:12px;" />
    `;
  }
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="40" height="40" align="center" valign="middle"
          style="background-color:${COLORS.indigoSoft};border-radius:12px;font-size:20px;">
          &#128200;
        </td>
      </tr>
    </table>
  `;
}

export function renderEmailLayout(opts: {
  previewText: string;
  heading: string;
  bodyHtml: string;
  footerNote?: string;
}): string {
  const { previewText, heading, bodyHtml, footerNote } = opts;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${BRAND_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <!-- Preheader (hidden preview text) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${previewText}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:${COLORS.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="max-width:480px;">

            <!-- Brand header -->
            <tr>
              <td style="padding-bottom:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:10px;">${renderLogo()}</td>
                    <td style="color:${COLORS.text};font-size:16px;font-weight:700;letter-spacing:0.3px;">
                      ${BRAND_NAME}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background-color:${COLORS.card};border:1px solid ${COLORS.cardBorder};border-radius:20px;padding:32px 28px;">
                <h1 style="margin:0 0 16px 0;color:${COLORS.text};font-size:20px;font-weight:700;">
                  ${heading}
                </h1>
                <div style="color:${COLORS.muted};font-size:14px;line-height:22px;">
                  ${bodyHtml}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px 8px 0 8px;text-align:center;">
                <p style="margin:0;color:${COLORS.faint};font-size:12px;line-height:18px;">
                  ${footerNote || `This email was sent by ${BRAND_NAME}. If you didn't expect it, you can safely ignore it.`}
                </p>
                <p style="margin:8px 0 0 0;color:${COLORS.faint};font-size:12px;">
                  Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:${COLORS.indigo};text-decoration:none;">${SUPPORT_EMAIL}</a>
                </p>
                <p style="margin:12px 0 0 0;color:${COLORS.faint};font-size:11px;">
                  &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderOtpBlock(code: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td align="center" style="background-color:${COLORS.chip};border:1px solid ${COLORS.cardBorder};border-radius:14px;padding:20px;">
          <span style="font-family:Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:${COLORS.text};">
            ${code}
          </span>
        </td>
      </tr>
    </table>
  `;
}

export function renderButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="border-radius:14px;background-color:${COLORS.indigo};">
          <a href="${href}" target="_blank"
            style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:14px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function renderChip(label: string): string {
  return `
    <span style="display:inline-block;background-color:${COLORS.chip};border:1px solid ${COLORS.cardBorder};color:${COLORS.text};font-size:12px;border-radius:999px;padding:6px 12px;margin:0 6px 6px 0;">
      &#10003; ${label}
    </span>
  `;
}

export { APP_URL, BRAND_NAME, COLORS };
