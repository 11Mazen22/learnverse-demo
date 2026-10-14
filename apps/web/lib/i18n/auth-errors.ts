/**
 * Maps Supabase Auth errors to friendly copy in the selected interface language.
 */
type AuthLikeError = { code?: string | null; message?: string | null; status?: number | null } | null | undefined;

const BY_CODE: Record<string, string> = {
  invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة. راجعهما وحاول مرة أخرى.",
  email_not_confirmed: "لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد التي أرسلناها لك ثم سجّل الدخول.",
  user_already_exists: "هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول أو استعادة كلمة المرور.",
  email_exists: "هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول أو استعادة كلمة المرور.",
  weak_password: "كلمة المرور ضعيفة. استخدم 12 حرفًا على الأقل مع مزيج من الحروف والأرقام.",
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
  STAGING_CONFIGURATION_MISMATCH: "إعدادات الاتصال ببيئة Noata التجريبية غير مطابقة. لم تُرسل بياناتك؛ حاول لاحقًا بعد تصحيح الربط.",
  SUPABASE_CONFIGURATION_INVALID: "إعدادات اتصال Noata غير معتمدة أو غير مكتملة. لم تُرسل بياناتك؛ يُرجى تصحيح الربط قبل المحاولة.",
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
  [/STAGING_CONFIGURATION_MISMATCH|unapproved.*project|project.*mismatch/i, BY_CODE.STAGING_CONFIGURATION_MISMATCH],
];

export const GENERIC_AUTH_ERROR = "حدث خطأ غير متوقع. حاول مرة أخرى بعد لحظات.";

const EN_BY_CODE: Record<string,string> = {
 invalid_credentials:"Incorrect email or password. Check both and try again.",
 email_not_confirmed:"Your email is not confirmed yet. Open your confirmation email, then sign in.",
 user_already_exists:"This email is already registered. Sign in or recover your password.",
 email_exists:"This email is already registered. Sign in or recover your password.",
 weak_password:"Use a stronger password with at least 12 characters and a mix of letters and numbers.",
 same_password:"Your new password must differ from your current one.",
 over_email_send_rate_limit:"Several emails were sent recently. Wait a minute before trying again.",
 over_request_rate_limit:"Too many attempts in a short time. Wait a moment and try again.",
 too_many_requests:"Too many attempts in a short time. Wait a moment and try again.",
 otp_expired:"This link has expired. Request a new link.",
 flow_state_expired:"Your verification session has expired. Start signing in again.",
 flow_state_not_found:"Could not complete verification in this browser. Start signing in again.",
 bad_code_verifier:"Open the verification link in the same browser where you requested it.",
 session_expired:"Your session has expired. Sign in again to continue.",
 session_not_found:"Your session has expired. Sign in again to continue.",
 refresh_token_not_found:"Your session has expired. Sign in again to continue.",
 provider_disabled:"This sign-in method is currently unavailable. Use email instead.",
 STAGING_CONFIGURATION_MISMATCH:"Noata's staging connection settings do not match. Your data was not sent. Try again after the configuration is corrected.",
 SUPABASE_CONFIGURATION_INVALID:"Noata's connection settings are incomplete or unauthorized. Your data was not sent. The configuration must be corrected before trying again.",
 validation_failed:"Check the information you entered and try again.",
 email_address_invalid:"Enter a valid email address.",
 signup_disabled:"New account registration is temporarily unavailable.",
 user_banned:"This account is suspended. Contact support for help.",
 identity_already_exists:"This account is already linked to another user.",
 email_conflict_identity_not_deletable:"This email belongs to another account. Sign in using the method you originally used."
};
function arabicAuthError(error:AuthLikeError):string {
  if (!error) return GENERIC_AUTH_ERROR;
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  const message = error.message ?? "";
  for (const [pattern, copy] of BY_MESSAGE) if (pattern.test(message)) return copy;
  if (error.status === 429) return BY_CODE.over_request_rate_limit;
  if (error.status === 503 || error.status === 502 || error.status === 504) return "خدمة تسجيل الدخول غير متاحة مؤقتًا في بيئة الاختبار. لن نعيد محاولة تسجيل الدخول دون إذنك.";
  if (error.status === 500) return "تعذّر إكمال طلب تسجيل الدخول على الخادم. يُرجى المحاولة لاحقًا.";
  return GENERIC_AUTH_ERROR;
}

export function localizeAuthError(error: AuthLikeError,locale:"ar"|"en"="ar"):string {
 const copy=arabicAuthError(error);
 if(locale==="ar")return copy;
 const code=Object.keys(BY_CODE).find(key=>BY_CODE[key]===copy);
 if(code)return EN_BY_CODE[code];
 if(error?.status===503||error?.status===502||error?.status===504)return "The sign-in service is temporarily unavailable. Please try again later.";
 if(error?.status===500)return "The server could not complete your sign-in request. Please try again later.";
 if(/fetch|network/i.test(error?.message??""))return "Could not connect to the server. Check your internet connection and try again.";
 return "An unexpected error occurred. Please try again shortly.";
}

export function safeNextPath(raw: string | null | undefined, fallback = "/") {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !/[\\\u0000-\u0020\u007f]/.test(raw)
    ? raw
    : fallback;
}
