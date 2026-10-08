"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { NoataBrand } from "@/components/ui/noata-logo";
import { createClient } from "@/lib/supabase/client";
import { localizeAuthError } from "@/lib/i18n/auth-errors";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    void createClient().auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      const allowed = !error && Boolean(data.user);
      setAuthorized(allowed);
      setCheckingSession(false);
      if (!allowed) setStatus({ tone: "error", text: "رابط الاستعادة غير مكتمل أو انتهت صلاحيته. اطلب رابطًا جديدًا من صفحة الدخول." });
    }).catch(() => {
      if (!mounted) return;
      setCheckingSession(false);
      setStatus({ tone: "error", text: "تعذّر التحقق من جلسة الاستعادة. حاول فتح الرابط مرة أخرى." });
    });
    return () => { mounted = false; };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!authorized || checkingSession) {
      setStatus({ tone: "error", text: "تحقّق من بريدك وافتح رابط الاستعادة قبل تغيير كلمة المرور." });
      return;
    }
    if (password.length < 8) {
      setStatus({ tone: "error", text: "استخدم كلمة مرور من 8 أحرف على الأقل." });
      return;
    }
    if (password !== confirm) {
      setStatus({ tone: "error", text: "كلمتا المرور غير متطابقتين." });
      return;
    }
    setBusy(true);
    setStatus(null);
    let error: { code?: string; message?: string; status?: number } | null = null;
    try {
      const result = await createClient().auth.updateUser({ password });
      error = result.error;
    } catch {
      setStatus({ tone: "error", text: "تعذّر الاتصال بالخادم. تحقّق من اتصالك وحاول مرة أخرى." });
      setBusy(false);
      return;
    }
    if (error) {
      setStatus({ tone: "error", text: localizeAuthError(error) });
      setBusy(false);
      return;
    }
    setStatus({ tone: "success", text: "تم تغيير كلمة المرور بنجاح. جارٍ تحويلك…" });
    setTimeout(() => window.location.replace("/"), 900);
  }

  return (
    <main id="noata-main" className="auth-shell is-centered">
      <form onSubmit={submit} className="auth-card" aria-labelledby="pw-title">
        <div className="auth-card-brand"><NoataBrand size={40} /></div>
        <p className="auth-eyebrow">أمان الحساب</p>
        <h1 id="pw-title">عيّن كلمة مرور جديدة</h1>
        <p className="auth-lead">اختر كلمة مرور قوية ومختلفة عن كلمتك السابقة.</p>
        <div className="auth-form">
          <label className="auth-field">
            <span>كلمة المرور الجديدة</span>
            <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" dir="ltr" placeholder="8 أحرف على الأقل" />
          </label>
          <label className="auth-field">
            <span>تأكيد كلمة المرور</span>
            <input type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" dir="ltr" placeholder="أعد كتابة كلمة المرور" />
          </label>
          {status && (
            <p className={"auth-alert " + (status.tone === "error" ? "is-error" : "is-success")} role={status.tone === "error" ? "alert" : "status"}>
              {status.text}
            </p>
          )}
          <button disabled={busy || checkingSession || !authorized} className="auth-primary">
            {checkingSession ? "جارٍ التحقق من الرابط…" : busy ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
          </button>
          {!checkingSession && !authorized && (
            <Link className="auth-link" href="/login">اطلب رابط استعادة جديدًا</Link>
          )}
        </div>
      </form>
    </main>
  );
}
