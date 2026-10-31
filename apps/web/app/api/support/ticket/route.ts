import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  dispatchSupportTicketEmail,
  REQUIRED_SUPPORT_EMAIL,
} from "@/lib/support/email-dispatcher";
import type {
  SupportCategory,
  SupportTicketRecord,
  SupportTicketSubmission,
} from "@/lib/support/types";

// In-memory rate limiter (bounded to 1000 entries)
const submissionLog = new Map<string, number[]>();

async function sha256Hex(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const timestamps = submissionLog.get(identifier) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= maxAttempts) return false;
  recent.push(now);
  submissionLog.set(identifier, recent);
  // Housekeeping
  if (submissionLog.size > 1000) {
    const oldestKey = submissionLog.keys().next().value;
    if (oldestKey) submissionLog.delete(oldestKey);
  }
  return true;
}

const VALID_CATEGORIES = new Set<SupportCategory>([
  "curriculum",
  "tracks",
  "lessons",
  "ai",
  "account",
  "bug",
  "general",
]);

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return NextResponse.json({ ok: false, error: "Content-Type must be application/json." }, { status: 415 });
    }
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== req.nextUrl.host)
          return NextResponse.json({ ok: false, error: "Origin not allowed." }, { status: 403 });
      } catch {
        return NextResponse.json({ ok: false, error: "Origin not allowed." }, { status: 403 });
      }
    }
    const body = (await req.json().catch(() => ({}))) as Partial<SupportTicketSubmission>;
    const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "anonymous").trim();

    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          ok: false,
          error: "لقد تجاوزت الحد المسموح به من الطلبات مؤقتًا. يرجى الانتظار 15 دقيقة قبل إرسال طلب جديد.",
          errorEn: "Too many support requests from this IP. Please wait 15 minutes before submitting again.",
        },
        { status: 429 },
      );
    }

    // Input validation
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const subject = String(body.subject || "").trim();
    const category = (String(body.category || "").trim() as SupportCategory);
    const message = String(body.message || "").trim();

    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { ok: false, error: "يرجى كتابة الاسم بشكل صحيح (بين حرفين و100 حرف)." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 255) {
      return NextResponse.json(
        { ok: false, error: "يرجى إدخال بريد إلكتروني صالح للتواصل." },
        { status: 400 },
      );
    }

    if (!subject || subject.length < 3 || subject.length > 200) {
      return NextResponse.json(
        { ok: false, error: "يرجى كتابة عنوان واضح للموضوع (بين 3 و200 حرف)." },
        { status: 400 },
      );
    }

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { ok: false, error: "يرجى اختيار تصنيف صالح لطلب الدعم." },
        { status: 400 },
      );
    }

    if (!message || message.length < 10 || message.length > 4000) {
      return NextResponse.json(
        { ok: false, error: "يرجى كتابة تفاصيل المشكلة أو الاستفسار (بين 10 و4000 حرف)." },
        { status: 400 },
      );
    }
    if (!checkRateLimit(`${ip}:${email}`, 3)) {
      return NextResponse.json(
        { ok: false, error: "يرجى الانتظار قبل إرسال طلب آخر.", errorEn: "Please wait before submitting another request." },
        { status: 429 },
      );
    }

    // Check authenticated user
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        userId = data.user.id;
      }
    } catch {
      // Guest submission is permitted
    }

    // Generate unique random ticket code
    const randomSuffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
    const ticketCode = `NOATA-${randomSuffix}`;
    const deliveryToken = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const deliveryTokenHash = await sha256Hex(deliveryToken);
    const now = new Date().toISOString();

    const ticketRecord: SupportTicketRecord = {
      id: crypto.randomUUID(),
      ticket_code: ticketCode,
      user_id: userId,
      name,
      email,
      subject,
      category,
      message,
      status: "open",
      email_delivery_status: "pending",
      email_destination: REQUIRED_SUPPORT_EMAIL,
      created_at: now,
      updated_at: now,
    };

    // Persistence is required before email delivery. Never report a saved ticket
    // after a missing migration, RLS denial, or network failure.
    const persistence = await (await createClient()).from("support_tickets").insert({
         id: ticketRecord.id,
        ticket_code: ticketRecord.ticket_code,
        user_id: ticketRecord.user_id,
        name: ticketRecord.name,
        email: ticketRecord.email,
        subject: ticketRecord.subject,
        category: ticketRecord.category,
        message: ticketRecord.message,
        status: ticketRecord.status,
        email_delivery_status: ticketRecord.email_delivery_status,
         email_destination: ticketRecord.email_destination,
         delivery_token_hash: deliveryTokenHash,
         created_at: ticketRecord.created_at,
         updated_at: ticketRecord.updated_at,
      });
    if (persistence.error) {
      return NextResponse.json(
        { ok: false, saved: false, error: "تعذّر حفظ طلب الدعم؛ لم نرسل إشعار نجاح.", errorEn: "The support request could not be saved." },
        { status: 503 },
      );
    }

    // Execute real transactional email notification to mazenshazly011@gmail.com
    const emailResult = await dispatchSupportTicketEmail(ticketRecord);

    const deliveryReceipt = await (await createClient()).rpc("record_support_ticket_delivery", {
      p_ticket_id: ticketRecord.id,
      p_delivery_token: deliveryToken,
      p_status: emailResult.status,
      p_provider_response: { messageId: emailResult.messageId || null, note: emailResult.note },
    });
    const deliveryStateSaved = !deliveryReceipt.error && deliveryReceipt.data === true;

    return NextResponse.json({
      ok: true,
      saved: true,
      ticketCode,
      messageAr: "تم استلام طلبك بنجاح وحفظه في سجل الدعم الفني.",
      messageEn: "Your support request has been received and saved.",
      emailDelivery: {
        delivered: emailResult.delivered,
        status: emailResult.status,
        destination: REQUIRED_SUPPORT_EMAIL,
        messageId: emailResult.messageId,
        missingEnv: emailResult.missingEnv,
        note: emailResult.note,
        statusSaved: deliveryStateSaved,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع أثناء معالجة طلبك." },
      { status: 500 },
    );
  }
}
