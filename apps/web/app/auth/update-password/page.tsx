"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("استخدم كلمة مرور 8 حروف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setStatus("كلمتا المرور غير متطابقتين.");
      return;
    }
    setBusy(true);
    setStatus("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }
    setStatus("تم تغيير كلمة المرور ✓");
    setTimeout(() => window.location.replace("/"), 700);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        className="panel"
        style={{ width: "min(460px,100%)", padding: 30 }}
      >
        <div className="brand-mark" style={{ marginBottom: 18 }}>
          N
        </div>
        <h1>كلمة مرور جديدة</h1>
        <p style={{ color: "var(--muted)" }}>
          اختار كلمة مرور قوية ومختلفة عن القديمة.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <input
            className="search"
            style={{ width: "100%" }}
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            type="password"
            minLength={8}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
          />
          {status && (
            <small
              style={{
                color: status.includes("✓")
                  ? "var(--success)"
                  : "var(--danger)",
              }}
            >
              {status}
            </small>
          )}
          <button
            disabled={busy}
            className="btn"
            style={{ background: "var(--accent)", color: "var(--surface)" }}
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </main>
  );
}
