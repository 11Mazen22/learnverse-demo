"use client";

import { FormEvent, useState } from "react";
import { NoataBrand } from "@/components/ui/noata-logo";
import { createClient } from "@/lib/supabase/client";
import { localizeAuthError } from "@/lib/i18n/auth-errors";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
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
    const { error } = await createClient().auth.updateUser({ password });
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
          <button disabled={busy} className="auth-primary">
            {busy ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
          </button>
        </div>
      </form>
    </main>
  );
}
