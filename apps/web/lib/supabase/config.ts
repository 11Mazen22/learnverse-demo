export const APPROVED_STAGING_URL = "https://vpfpjvhafkmygetjkfcp.supabase.co";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? APPROVED_STAGING_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const stagingFetch: typeof fetch = async (input, init) => {
  const target = new URL(input instanceof Request ? input.url : String(input));
  if (
    SUPABASE_URL.replace(/\/$/, "") !== APPROVED_STAGING_URL ||
    target.origin !== APPROVED_STAGING_URL ||
    !SUPABASE_PUBLISHABLE_KEY ||
    target.username || target.password
  ) {
    return Response.json(
      { message: "اتصال بيئة الاختبار غير مطابق للمشروع المعتمد. لم يتم إرسال الطلب.", code: "STAGING_CONFIGURATION_MISMATCH" },
      { status: 503 },
    );
  }
  return fetch(input, init);
};
