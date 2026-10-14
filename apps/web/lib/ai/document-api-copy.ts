/** API errors follow the saved UI locale; credentials and private URLs are never localized or echoed. */
const english:Record<string,string>={
  "حفظ المستندات غير مفعّل في هذه البيئة.": "Document storage is not enabled in this environment.",
  "مستند غير صالح.": "Invalid document.",
  "سجّل الدخول.": "Please sign in.",
  "تعذّر قراءة المستند.": "Could not read the document.",
  "المستند غير متاح.": "This document is unavailable.",
  "انتهت مدة حفظ المستند.": "The document retention period has expired.",
  "تعذّر فتح المستند.": "Could not open the document.",
  "طلب غير مسموح.": "This request is not allowed.",
  "ملف فارغ.": "The file is empty.",
  "الملف كبير جدًا.": "The file is too large.",
  "مرفق غير صالح.": "Invalid attachment.",
  "صيغة أو حجم غير مدعوم.": "Unsupported file format or size.",
  "محتوى الملف غير صالح.": "Invalid file content.",
  "تعذّر التحقق من المحادثة.": "Could not verify the conversation.",
  "المحادثة غير متاحة.": "This conversation is unavailable.",
  "تعذّر التحقق من حدود الرفع.": "Could not check upload limits.",
  "الحد الأقصى ٤٠ مستندًا لكل محادثة.": "A conversation can contain up to 40 documents.",
  "تعذّر تسجيل المستند أو تجاوزت مساحة حسابك.": "Could not register the document, or your account storage limit was reached.",
  "تعذّر حفظ المستند الأصلي.": "Could not save the original document.",
  "تعذّر قراءة المرفق.": "Could not read the attachment.",
  "طلب غير صالح.": "Invalid request.",
  "تعذّر قراءة المستندات.": "Could not read the documents.",
  "تعذّر حذف الملفات. لم تُحذف سجلاتها؛ حاول مرة أخرى.": "Could not delete the files. Their records were retained; please retry.",
  "حُذفت الملفات لكن تعذّر تنظيف سجلاتها.": "The files were deleted, but their records could not be cleared."
};
export function requestLocale(headers:Pick<Headers,"get">):"ar"|"en"{
 const saved=headers.get("cookie")?.match(/(?:^|;\s*)noata_locale=(en|ar)(?:;|$)/)?.[1];
 if(saved)return saved as "ar"|"en";
 return /^en(?:[-,;]|$)/i.test(headers.get("accept-language")??"")?"en":"ar";
}
export function documentApiBody(body:unknown,headers:Pick<Headers,"get">):unknown{
 if(requestLocale(headers)!=="en"||!body||typeof body!=="object"||Array.isArray(body))return body;
 const x=body as Record<string,unknown>;
 return typeof x.error==="string"?{...x,error:english[x.error]??"The document operation could not be completed."}:body;
}
