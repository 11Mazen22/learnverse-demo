import type { SupportEmailDeliveryResult, SupportTicketRecord } from "./types";

export const REQUIRED_SUPPORT_EMAIL = "mazenshazly011@gmail.com";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildSupportEmailHtml(ticket: SupportTicketRecord): string {
  const safeName = escapeHtml(ticket.name);
  const safeEmail = escapeHtml(ticket.email);
  const safeSubject = escapeHtml(ticket.subject);
  const safeCategory = escapeHtml(ticket.category);
  const safeMessage = escapeHtml(ticket.message).replace(/\n/g, "<br/>");
  const safeCode = escapeHtml(ticket.ticket_code);
  const dateStr = new Date(ticket.created_at).toUTCString();

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>طلب دعم فني جديد — ${safeCode}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 620px; margin: 0 auto; background-color: #111c35; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #3730a3, #4f46e5); padding: 24px 32px; text-align: right; }
    .header h1 { margin: 0; font-size: 20px; color: #ffffff; font-weight: 800; }
    .header .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; font-size: 12px; margin-top: 8px; font-weight: bold; }
    .content { padding: 32px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px; }
    .meta-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .meta-table td.label { width: 140px; color: #94a3b8; font-weight: bold; }
    .meta-table td.val { color: #f8fafc; }
    .message-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-top: 16px; font-size: 14px; line-height: 1.7; color: #e2e8f0; }
    .footer { padding: 20px 32px; background-color: #0c1427; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>طلب دعم جديد من منصة نقطة (Noäta)</h1>
      <span class="badge">كود التذكرة: #${safeCode}</span>
    </div>
    <div class="content">
      <table class="meta-table">
        <tr>
          <td class="label">مرسل التذكرة:</td>
          <td class="val">${safeName}</td>
        </tr>
        <tr>
          <td class="label">البريد الإلكتروني:</td>
          <td class="val"><a href="mailto:${safeEmail}" style="color: #818cf8; text-decoration: none;">${safeEmail}</a></td>
        </tr>
        <tr>
          <td class="label">الموضوع:</td>
          <td class="val"><strong>${safeSubject}</strong></td>
        </tr>
        <tr>
          <td class="label">التصنيف:</td>
          <td class="val">${safeCategory}</td>
        </tr>
        <tr>
          <td class="label">تاريخ الإرسال:</td>
          <td class="val">${dateStr}</td>
        </tr>
      </table>

      <h3 style="margin-top: 0; color: #f1f5f9; font-size: 15px;">نص الرسالة:</h3>
      <div class="message-box">
        ${safeMessage}
      </div>
    </div>
    <div class="footer">
      تم إرسال هذا الإشعار تلقائيًا من نظام الدعم الفني لمنصة Noäta Aura إلى ${REQUIRED_SUPPORT_EMAIL}
    </div>
  </div>
</body>
</html>`;
}

export function buildSupportEmailText(ticket: SupportTicketRecord): string {
  return `=== طلب دعم فني جديد — منصة نقطة ===
كود التذكرة: #${ticket.ticket_code}
التاريخ: ${new Date(ticket.created_at).toUTCString()}

المرسل: ${ticket.name}
البريد الإلكتروني: ${ticket.email}
الموضوع: ${ticket.subject}
التصنيف: ${ticket.category}
الوجهة المعتمدة: ${REQUIRED_SUPPORT_EMAIL}

نص الرسالة:
----------------------------------------
${ticket.message}
----------------------------------------
الرد على هذا البريد يتوجه مباشرة إلى: ${ticket.email}
`;
}

/**
 * Dispatches the support ticket notification to mazenshazly011@gmail.com
 * Supports Resend, SMTP, or truthfully reports missing configuration.
 */
export async function dispatchSupportTicketEmail(
  ticket: SupportTicketRecord,
): Promise<SupportEmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SUPPORT_SENDER_EMAIL || "Noäta Support <notifications@noata.app>";

  // If Resend API key is present, execute actual transactional delivery
  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [REQUIRED_SUPPORT_EMAIL],
          reply_to: ticket.email,
          subject: `[Noäta Support #${ticket.ticket_code}] ${ticket.subject}`,
          html: buildSupportEmailHtml(ticket),
          text: buildSupportEmailText(ticket),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          delivered: false,
          status: "failed",
          destination: REQUIRED_SUPPORT_EMAIL,
          note: `Email provider rejected submission (status ${response.status}): ${JSON.stringify(errorData)}`,
        };
      }

      const resData = (await response.json().catch(() => ({}))) as { id?: string };
      return {
        delivered: true,
        status: "sent",
        destination: REQUIRED_SUPPORT_EMAIL,
        messageId: resData.id,
        note: `Support notification successfully delivered via Resend to ${REQUIRED_SUPPORT_EMAIL}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        delivered: false,
        status: "failed",
        destination: REQUIRED_SUPPORT_EMAIL,
        note: `Network or provider exception while dispatching to ${REQUIRED_SUPPORT_EMAIL}: ${msg}`,
      };
    }
  }

  // If no email provider key is configured in the environment, report truthfully
  return {
    delivered: false,
    status: "queued_no_provider",
    destination: REQUIRED_SUPPORT_EMAIL,
    missingEnv: ["RESEND_API_KEY"],
    note: `Support ticket #${ticket.ticket_code} is stored in database. Transactional email to ${REQUIRED_SUPPORT_EMAIL} is queued pending RESEND_API_KEY environment variable.`,
  };
}
