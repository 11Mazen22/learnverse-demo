/**
 * Defence in depth for new password forms while Supabase's paid leaked-password
 * Auth protection is unavailable on Staging Free. This is NOT a server-side
 * leaked-password check; operators must still configure the Auth service.
 */
export const MIN_NEW_PASSWORD_LENGTH=12;
export function newPasswordProblem(password:string):string|null{
 if(password.length<MIN_NEW_PASSWORD_LENGTH||password.length>128)
   return "استخدم كلمة مرور من 12 إلى 128 حرفًا على الأقل.";
 if(/^\s+$/u.test(password) || /^(.)\1{11,}$/u.test(password))
   return "اختر كلمة مرور متنوعة يصعب تخمينها، وليست حرفًا واحدًا متكررًا.";
 if(/^(password|1234567890|qwerty|admin123)/iu.test(password))
   return "كلمة المرور دي سهلة التخمين. استخدم عبارة طويلة وفريدة.";
 return null;
}
