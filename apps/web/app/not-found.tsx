"use client";
import {useTranslation} from "@/lib/i18n/locale";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
 const t=useTranslation();
  return (
    <AppShell active="">
      <section className="hero" style={{ textAlign: "center", padding: 48 }}>
        <div className="eyebrow">404 · {t("صفحة غير موجودة","Page not found")}</div>
        <h1>{t("الصفحة دي مش موجودة.","This page does not exist.")}</h1>
        <p>{t("ممكن الرابط اتغيّر أو المحتوى لسه مش منشور.","The link may have changed, or the content has not been published yet.")}</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-primary" href="/">
            {t("الرئيسية","Home")}
          </a>
          <a className="btn btn-secondary" href="/learn">
            {t("التعلّم","Learning")}
          </a>
        </div>
      </section>
    </AppShell>
  );
}
