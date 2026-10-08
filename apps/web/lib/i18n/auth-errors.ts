/**
 * Maps Supabase Auth error codes/messages to friendly Arabic copy so raw
 * English server strings never reach the interface.
 */
type AuthLikeError = { code?: string | null; message?: string | null; status?: number | null } | null | undefined;

const BY_CODE: Record<string, string> = {
  invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة. راجعهما وحاول مرة أخرى.",
  email_not_confirmed: "لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد التي أرسلناها لك ثم سجّل الدخول.",
  user_already_exists: "هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول أو استعادة كلمة المرور.",
  email_exists: "هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول أو استعادة كلمة المرور.",
  weak_password: "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل مع مزيج من الحروف والأرقام.",
  same_password: "كلمة المرور الجديدة يجب أن تختلف عن الحالية.",
  over_email_send_rate_limit: "أرسلنا رسائل كثيرة مؤخرًا. انتظر دقيقة قبل المحاولة مجددًا.",
  over_request_rate_limit: "محاولات كثيرة في وقت قصير. انتظر قليلًا ثم أعد المحاولة.",
  too_many_requests: "محاولات كثيرة في وقت قصير. انتظر قليلًا ثم أعد المحاولة.",
  otp_expired: "انتهت صلاحية الرابط. اطلب رابطًا جديدًا وسيصلك خلال لحظات.",
  flow_state_expired: "انتهت جلسة التحقق. ابدأ تسجيل الدخول من جديد.",
  flow_state_not_found: "تعذّر إكمال التحقق من هذا المتصفح. ابدأ تسجيل الدخول من جديد.",
  bad_code_verifier: "تعذّر إكمال التحقق من هذا المتصفح. افتح الرابط من نفس المتصفح الذي طلبته منه.",
  session_expired: "انتهت جلستك لحمايتك. سجّل الدخول مرة أخرى للمتابعة.",
  session_not_found: "انتهت جلستك لحمايتك. سجّل الدخول مرة أخرى للمتابعة.",
  refresh_token_not_found: "انتهت جلستك لحمايتك. سجّل الدخول مرة أخرى للمتابعة.",
  provider_disabled: "تسجيل الدخول بهذه الطريقة غير مفعّل حاليًا. استخدم البريد الإلكتروني.",
  validation_failed: "تحقّق من البيانات المدخلة وحاول مرة أخرى.",
  email_address_invalid: "صيغة البريد الإلكتروني غير صحيحة.",
  signup_disabled: "إنشاء الحسابات الجديدة متوقف مؤقتًا.",
  user_banned: "هذا الحساب موقوف. تواصل مع فريق الدعم للمساعدة.",
  identity_already_exists: "هذا الحساب مرتبط بالفعل بمستخدم آخر.",
  email_conflict_identity_not_deletable: "هذا البريد مرتبط بحساب آخر. سجّل الدخول بالطريقة التي أنشأت بها حسابك.",
};

const BY_MESSAGE: [RegExp, string][] = [
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already (been )?registered|already exists/i, BY_CODE.user_already_exists],
  [/password should be|weak password|password is too/i, BY_CODE.weak_password],
  [/different from the old password/i, BY_CODE.same_password],
  [/rate limit|too many/i, BY_CODE.over_request_rate_limit],
  [/expired|invalid.*(link|token)/i, BY_CODE.otp_expired],
  [/provider is not enabled|unsupported provider/i, BY_CODE.provider_disabled],
  [/code verifier|flow state/i, BY_CODE.bad_code_verifier],
  [/session/i, BY_CODE.session_expired],
  [/invalid.*email|unable to validate email/i, BY_CODE.email_address_invalid],
  [/signups? not allowed/i, BY_CODE.signup_disabled],
  [/fetch|network|failed to fetch/i, "تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت وحاول مجددًا."],
];

export const GENERIC_AUTH_ERROR = "حدث خطأ غير متوقع. حاول مرة أخرى بعد لحظات.";

export function localizeAuthError(error: AuthLikeError): string {
  if (!error) return GENERIC_AUTH_ERROR;
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  const message = error.message ?? "";
  for (const [pattern, copy] of BY_MESSAGE) if (pattern.test(message)) return copy;
  if (error.status === 429) return BY_CODE.over_request_rate_limit;
  return GENERIC_AUTH_ERROR;
}

export function safeNextPath(raw: string | null | undefined, fallback = "/") {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")
    ? raw
    : fallback;
}
