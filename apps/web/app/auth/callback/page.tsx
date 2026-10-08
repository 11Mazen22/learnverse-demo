"use client";

import {NoataLogo} from "@/components/ui/noata-logo";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("جاري تأكيد حسابك…");

  useEffect(() => {
    void (async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        setMessage("رابط التأكيد غير صالح أو منتهي.");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setMessage(error.message);
        return;
      }
      window.location.replace("/");
    })();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <section
        className="panel"
        style={{ width: "min(460px,100%)", padding: 32, textAlign: "center" }}
      >
        <NoataLogo size={44}/>
        <h1>Noata</h1>
        <p style={{ color: "var(--muted)" }}>{message}</p>
      </section>
    </main>
  );
}
