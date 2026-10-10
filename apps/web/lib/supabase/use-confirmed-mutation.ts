"use client";
import { useEffect, useRef, useState } from "react";
import { useVerifiedAccount } from "./use-verified-account";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

/** Serialize writes and reject continuations after logout, account changes, or unmount. */
export function useConfirmedMutation() {
  const locale=useLocale(),t=useTranslation();
  const account = useVerifiedAccount();
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const lock = useRef(false),
    mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    lock.current = false;
    setBusy(false);
    setStatus("");
  }, [account.user]);
  async function run(
    work: (assertCurrent: () => void) => Promise<string | void>,
    success = t("تم حفظ التغيير ✓","Change saved ✓"),
  ) {
    if (lock.current || account.loading || !account.user) return false;
    const token = account.revision.current;
    const current = () => mounted.current && token === account.revision.current;
    const assertCurrent = () => {
      if (!current()) throw new DOMException("Account changed", "AbortError");
    };
    lock.current = true;
    setBusy(true);
    setStatus("");
    try {
      assertCurrent();
      const message = await work(assertCurrent);
      assertCurrent();
      setStatus(message ?? success);
      return true;
    } catch (error) {
      if (current())
        setStatus(
          locale==="ar"&&error instanceof Error && error.message.startsWith("تعذّر")
            ? error.message
            : t("لم يتأكد حفظ التغيير. حدّث البيانات قبل إعادة المحاولة.","Could not confirm that the change was saved. Refresh the data before trying again."),
        );
      return false;
    } finally {
      if (current()) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  return { account, busy, status, setStatus, run };
}
