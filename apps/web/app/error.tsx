"use client";

import {NoataLogo} from "@/components/ui/noata-logo";
import {useTranslation} from "@/lib/i18n/locale";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t=useTranslation();
  useEffect(() => {
    console.error("Noata UI error", error);
  }, [error]);

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
        style={{ width: "min(560px,100%)", padding: 34, textAlign: "center" }}
      >
        <NoataLogo size={44}/>
        <div className="eyebrow" style={{ color: "var(--danger)" }}>
          {t("استعادة الصفحة","Recovery mode")}
        </div>
        <h1>{t("حصل خطأ غير متوقع.","Something went wrong.")}</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
          {t("بياناتك مش هنعتبرها اتسجلت إلا لما السيرفر يأكد العملية. جرّب تحميل الجزء ده تاني.","Your changes are only saved when the server confirms them. Try loading this page again.")}
        </p>
        <button
          className="btn"
          onClick={reset}
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          {t("إعادة المحاولة","Try again")}
        </button>
        {error.digest && (
          <small
            style={{ display: "block", marginTop: 12, color: "var(--muted)" }}
          >
            {t("المرجع","Reference")}: {error.digest}
          </small>
        )}
      </section>
    </main>
  );
}
