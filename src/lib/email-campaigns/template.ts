/**
 * Weekly edition email template. Plain HTML string builder — email clients
 * want table layouts and inline styles, and a single template doesn't
 * justify a rendering dependency.
 *
 * The HTML includes ActiveCampaign's required personalization tags
 * (%SENDER-INFO-SINGLELINE%, %UNSUBSCRIBELINK%) — AC injects the compliant
 * sender address and unsubscribe link at send time.
 */

export interface WeeklyEditionContent {
  title: string;
  intro: string;
  quotes: Array<{ text: string; author: string }>;
  reflection: string;
  question: string;
}

// Brand tokens (from globals.css)
const NAVY = "#2E2A58";
const CREAM = "#fdfbf7";
const TEAL = "#204147";
const PURPLE = "#cbbbe3";
const YELLOW = "#f9d97a";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderWeeklyEditionHtml(content: WeeklyEditionContent): string {
  const quotesHtml = content.quotes
    .map(
      (q) => `
        <tr>
          <td style="padding: 0 0 24px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left: 3px solid ${PURPLE};">
              <tr>
                <td style="padding: 4px 0 4px 20px;">
                  <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 19px; line-height: 1.6; color: ${NAVY};">&ldquo;${escapeHtml(q.text)}&rdquo;</p>
                  <p style="margin: 8px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: ${TEAL}; opacity: 0.75;">&mdash; ${escapeHtml(q.author)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(content.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${CREAM};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: ${TEAL};">Entiremind</p>
              <div style="width: 40px; height: 3px; background-color: ${YELLOW}; margin: 16px auto 0 auto;"></div>
            </td>
          </tr>

          <!-- Title + intro -->
          <tr>
            <td style="padding: 0 0 12px 0;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; line-height: 1.3; font-weight: 500; color: ${NAVY}; text-align: center;">${escapeHtml(content.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 0 36px 0;">
              <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.7; color: ${TEAL}; text-align: center;">${escapeHtml(content.intro)}</p>
            </td>
          </tr>

          <!-- 3 quotes -->
          ${quotesHtml}

          <!-- Reflection -->
          <tr>
            <td style="padding: 12px 0 0 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px;">
                <tr>
                  <td style="padding: 28px;">
                    <p style="margin: 0 0 12px 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: ${TEAL}; opacity: 0.6;">A reflection</p>
                    <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 17px; line-height: 1.7; color: ${NAVY};">${escapeHtml(content.reflection)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Question -->
          <tr>
            <td align="center" style="padding: 36px 24px 44px 24px;">
              <p style="margin: 0 0 12px 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: ${TEAL}; opacity: 0.6;">To sit with this week</p>
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; line-height: 1.6; font-style: italic; color: ${NAVY};">${escapeHtml(content.question)}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 0 0 0; border-top: 1px solid ${PURPLE};">
              <p style="margin: 16px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: ${TEAL}; opacity: 0.7;">You're receiving this because you joined Entiremind.</p>
              <p style="margin: 8px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: ${TEAL}; opacity: 0.7;">%SENDER-INFO-SINGLELINE%</p>
              <p style="margin: 8px 0 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px;"><a href="%UNSUBSCRIBELINK%" style="color: ${TEAL};">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderWeeklyEditionPlainText(
  content: WeeklyEditionContent,
): string {
  const quotes = content.quotes
    .map((q) => `"${q.text}"\n— ${q.author}`)
    .join("\n\n");

  return [
    "ENTIREMIND",
    "",
    content.title,
    "",
    content.intro,
    "",
    quotes,
    "",
    "A REFLECTION",
    content.reflection,
    "",
    "TO SIT WITH THIS WEEK",
    content.question,
    "",
    "---",
    "You're receiving this because you joined Entiremind.",
    "Unsubscribe: %UNSUBSCRIBELINK%",
  ].join("\n");
}
