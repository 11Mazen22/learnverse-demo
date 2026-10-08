"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NoataBrand } from "@/components/ui/noata-logo";
import { createClient } from "@/lib/supabase/client";
import { localizeAuthError, safeNextPath } from "@/lib/i18n/auth-errors";

export default function AuthCallbackPage() {
  const [state, setState] = useState<{ status: "loading" | "error"; message: string }>({
    status: "loading",
    message: "جارٍ تأكيد حسابك وتسجيل دخولك…",
  });

  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const providerError = params.get("error_code") || hash.get("error_code");
      if (providerError) {
        setState({
          status: "error",
          message: localizeAuthError({
            code: providerError,
            message: params.get("error_description") || hash.get("error_description"),
          }),
        });
        return;
      }
      const code = params.get("code");
      if (!code) {
        setState({ status: "error", message: "رابط التأكيد غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا." });
        return;
      }
      const { error } = await createClient().auth.exchangeCodeForSession(code);
      if (error) {
        setState({ status: "error", message: localizeAuthError(error) });
        return;
      }
      window.location.replace(safeNextPath(params.get("next")));
    })();
  }, []);

  return (
    <main id="noata-main" className="auth-shell is-centered">
      <section className="auth-card auth-status" aria-live="polite">
        <NoataBrand size={44} />
        {state.status === "loading" ? (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            <h1>لحظة من فضلك</h1>
            <p className="auth-lead">{state.message}</p>
          </>
        ) : (
          <>
            <h1>تعذّر إكمال تسجيل الدخول</h1>
            <p className="auth-alert is-error" role="alert">{state.message}</p>
            <Link className="auth-primary" href="/login">العودة إلى تسجيل الدخول</Link>
          </>
        )}
      </section>
    </main>
  );
}
