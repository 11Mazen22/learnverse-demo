export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  selected_model: string;
  updated_at: string;
  temporary: boolean;
};
export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};
export const AI_FUNCTION =
  process.env.NEXT_PUBLIC_NOATA_AI_FUNCTION || "noata-ai-v2";
export const TOOLS = [
  {
    action: "image",
    label: "ارسم فكرة",
    description: "إنشاء صورة",
    icon: "image",
  },
  {
    action: "translate",
    label: "ترجم النص",
    description: "العربية والإنجليزية",
    icon: "book",
  },
  {
    action: "poem",
    label: "اكتب شعرًا",
    description: "صياغة عربية إبداعية",
    icon: "edit",
  },
  {
    action: "moderate",
    label: "راجع المحتوى",
    description: "مراجعة ملاءمة النص",
    icon: "check",
  },
  {
    action: "sadiq_validate",
    label: "تحقّق من معلومة",
    description: "تحقّق بالمساعد صادق",
    icon: "search",
  },
  {
    action: "sadiq_research",
    label: "ابحث بتعمّق",
    description: "بحث بالمساعد صادق",
    icon: "book",
  },
];
export function titleFrom(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? clean.slice(0, 48) + "…" : clean || "محادثة جديدة";
}
export function validateAttachment(file: {
  name: string;
  type: string;
  size: number;
}) {
  if (
    ![
      "image/png",
      "image/jpeg",
      "image/webp",
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
    ].includes(file.type.split(";")[0])
  )
    return "اختار صورة PNG أو JPG أو WebP، أو ملف صوتي مدعوم.";
  if (file.size > 10 * 1024 * 1024)
    return "حجم الملف لازم يكون أقل من 10 ميجابايت.";
  if (file.size === 0) return "الملف فارغ. اختار ملف تاني.";
  return "";
}
export function safeHref(href: string | null) {
  return href &&
    href.startsWith("/") &&
    !href.startsWith("//") &&
    !href.includes("\\")
    ? href
    : "/notifications";
}
export function parseStreamFrames(buffer: string) {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const rest = blocks.pop() ?? "";
  const data = blocks
    .flatMap((block) =>
      block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim()),
    )
    .filter(Boolean);
  return { data, rest };
}
export function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|quota|rate/i.test(message))
    return "وصلت لحد الاستخدام الحالي. جرّب بعد شوية.";
  if (/401|jwt|sign in|auth|session/i.test(message))
    return "الجلسة انتهت. سجّل الدخول تاني علشان نكمل.";
  if (/abort/i.test(message))
    return "تم إيقاف الطلب. تقدر تكمّل أو تحاول تاني.";
  if (/timeout|timed out/i.test(message))
    return "الرد أخد وقت أطول من المتوقع. حاول تاني.";
  return "تعذّر إكمال الطلب. راجع اتصالك وحاول تاني. انسخ أي نص مهم قبل المغادرة.";
}
