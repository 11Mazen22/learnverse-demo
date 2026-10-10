"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/components/ui/confirm-dialog";

export const UNSAVED_WORK_COPY = {
  title: "لديك عمل لم يُحفظ بعد",
  description:
    "إذا غادرت هذه الصفحة الآن فقد تفقد ما كتبته. هل تريد المتابعة على أي حال؟",
  confirmLabel: "مغادرة الصفحة",
  cancelLabel: "البقاء والمتابعة",
} as const;

/**
 * Guards in-app navigation with the Noata confirmation modal. The browser's
 * native unload prompt is only used for hard exits (tab close / reload),
 * where browsers do not allow custom UI.
 */
export function useUnsavedWork(dirty: boolean) {
  const router = useRouter();
  const bypass = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    bypass.current = false;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (bypass.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const destination = new URL(link.href, location.href);
      if (
        destination.origin === location.origin &&
        destination.pathname === location.pathname &&
        destination.search === location.search
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void confirmAction({ ...UNSAVED_WORK_COPY, tone: "danger" }).then(
        (leave) => {
          if (!leave) return;
          bypass.current = true;
          if (destination.origin === location.origin)
            router.push(destination.pathname + destination.search + destination.hash);
          else location.assign(destination.href);
        },
      );
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, router]);
}
