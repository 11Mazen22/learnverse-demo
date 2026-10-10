"use client";

import {NoataLogo} from "@/components/ui/noata-logo";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          RECOVERY MODE
        </div>
        <h1>حصل خطأ غير متوقع.</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
          بياناتك مش هنعتبرها اتسجلت إلا لما السيرفر يأكد العملية. جرّب تحميل
          الجزء ده تاني.
        </p>
        <button
          className="btn"
          onClick={reset}
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          Try again
        </button>
        {error.digest && (
          <small
            style={{ display: "block", marginTop: 12, color: "var(--muted)" }}
          >
            Reference: {error.digest}
          </small>
        )}
      </section>
    </main>
  );
}
