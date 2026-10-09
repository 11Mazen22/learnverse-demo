"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NoataBrand } from "@/components/ui/noata-logo";
import { createClient } from "@/lib/supabase/client";
import { localizeAuthError, safeNextPath } from "@/lib/i18n/auth-errors";
import { normalizedAuthFlow, RECOVERY_GRANT_KEY, recoveryGrantValue, AUTH_COMPLETION_KEY, authCompletionValue } from "@/lib/auth/flows";

function reasonFromCode(code: string | null | undefined) {
  if (code === "otp_expired" || code === "flow_state_expired" || code === "expired_token")
    return "expired";
  if (code === "bad_code_verifier" || code === "flow_state_not_found")
    return "same_browser";
  return "invalid";
}

export default function AuthCallbackPage() {
  const exchangeStarted = useRef(false);
  const [state, setState] = useState<{ status: "loading" | "error"; message: string }>({
    status: "loading", message: "جارٍ تأكيد الرابط وتسجيل دخولك بأمان…",
  });

  useEffect(() => {
    if (exchangeStarted.current) return;
    exchangeStarted.current = true;
    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const flow = normalizedAuthFlow(params.get("flow"));
      const providerError = params.get("error_code") || hash.get("error_code");
      if (providerError || params.has("error") || hash.has("error")) {
        window.location.replace("/auth/error?reason=" + (providerError ? reasonFromCode(providerError) : "cancelled"));
        return;
      }
      const code = params.get("code");
      if (!code) {
        window.location.replace("/auth/error?reason=invalid");
        return;
      }
      try {
        const { data, error } = await createClient().auth.exchangeCodeForSession(code);
        // Do not use history.replaceState here: Next's App Router patches it
        // and can remount the callback without the code before navigation,
        // misclassifying a successfully verified link as invalid. Every final
        // window.location.replace below removes the one-time code from history.
        if (error) {
          window.location.replace("/auth/error?reason=" + reasonFromCode(error.code));
          return;
        }
        if (!data?.user) {
          window.location.replace("/auth/error?reason=service");
          return;
        }
        if (flow === "recovery") {
          try {
            sessionStorage.setItem(RECOVERY_GRANT_KEY, recoveryGrantValue(data.user.id, Date.now()));
          } catch {
            window.location.replace("/auth/error?reason=same_browser");
            return;
          }
          window.location.replace("/auth/update-password");
          return;
        }
        if (flow === "signup") {
          try {
            sessionStorage.setItem(AUTH_COMPLETION_KEY, authCompletionValue("verified", data.user.id, Date.now()));
          } catch {
            window.location.replace(safeNextPath(params.get("next")));
            return;
          }
          window.location.replace("/auth/complete?type=verified");
          return;
        }
        window.location.replace(safeNextPath(params.get("next")));
      } catch {
        // Discard an unexchanged one-time code without triggering a Next router
        // reconciliation against an empty /auth/callback query.
        window.location.replace("/auth/error?reason=service");
      }
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
            <h1>تعذّر إكمال التحقق</h1>
            <p className="auth-alert is-error" role="alert">{state.message}</p>
            <Link className="auth-primary" href="/auth/error?reason=service">عرض خيارات استعادة الوصول</Link>
          </>
        )}
      </section>
    </main>
  );
}
