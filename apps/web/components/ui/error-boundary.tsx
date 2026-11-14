"use client";

import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitleAr?: string;
  fallbackTitleEn?: string;
  onReset?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  isEn: boolean;
};

/**
 * Accessible workspace error boundary preventing single-module runtime crashes
 * from tearing down the shell or losing route navigation.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    isEn: false,
  };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    const isEn =
      typeof document !== "undefined" && document.documentElement.lang === "en";
    return { hasError: true, isEn };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Error details intentionally stay out of untrusted DOM fallback text.
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { isEn } = this.state;
    const title = isEn
      ? this.props.fallbackTitleEn ?? "Something interrupted this view"
      : this.props.fallbackTitleAr ?? "حدث خلل غير متوقع في هذا القسم";
    const description = isEn
      ? "Your saved account data is safe. You can retry this section or return to the home workspace."
      : "بيانات حسابك المحفوظة آمنة. يمكنك إعادة محاولة تحميل هذا القسم أو العودة إلى المساحة الرئيسية.";

    return (
      <section
        className="nk-card nk-card--pad-lg nk-error-boundary"
        role="alert"
        aria-live="assertive"
      >
        <div style={{ display: "grid", gap: "12px", maxWidth: "560px" }}>
          <h2 style={{ margin: 0, color: "var(--ink)", fontSize: "1.25rem" }}>
            {title}
          </h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
            {description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              className="nk-btn nk-btn--primary nk-btn--md"
              onClick={this.handleReset}
            >
              {isEn ? "Try again" : "إعادة المحاولة"}
            </button>
            <Link href="/" className="nk-btn nk-btn--secondary nk-btn--md">
              {isEn ? "Back to home" : "العودة للرئيسية"}
            </Link>
          </div>
        </div>
      </section>
    );
  }
}
