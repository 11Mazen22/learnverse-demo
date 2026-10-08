import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateArabicPdf, PDF_MAX_CHARACTERS } from "@/lib/pdf/arabic-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = PDF_MAX_CHARACTERS * 4 + 4096;

function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Authenticated, size-limited Arabic PDF generation. The document is built in memory and never stored. */
export async function POST(request: NextRequest) {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return fail(415, "نوع المحتوى غير مدعوم.");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return fail(413, "المستند أكبر من الحد المسموح.");
  let user = null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return fail(503, "تعذر التحقق من الحساب الآن. حاول مرة أخرى.");
  }
  if (!user) return fail(401, "سجّل الدخول لتصدير ملف PDF.");
  let body: { title?: unknown; markdown?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail(400, "طلب غير صالح.");
  }
  const title = typeof body.title === "string" ? body.title : "مستند Noata";
  const markdown = typeof body.markdown === "string" ? body.markdown : "";
  try {
    const { bytes, pageCount } = await generateArabicPdf({ title, markdown, author: "Noata" });
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"noata-document.pdf\"; filename*=UTF-8''" + encodeURIComponent((title.slice(0, 60) || "noata-document") + ".pdf"),
        "Cache-Control": "no-store",
        "X-Noata-Pages": String(pageCount),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/\u0623\u0637\u0648\u0644|\u0644\u0627 \u064a\u0648\u062c\u062f|maximum PDF length/.test(message)) return fail(422, message);
    return fail(500, "تعذر إنشاء ملف PDF.");
  }
}
