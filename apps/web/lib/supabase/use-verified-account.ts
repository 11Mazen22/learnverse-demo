"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";
import { localized, useLocale } from "@/lib/i18n/locale";

export async function boundedRead<T>(
  work: PromiseLike<T>,
  milliseconds = 10000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(Error("Session read timed out")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Client visibility only; server authorization and database RLS remain mandatory. */
export function useVerifiedAccount() {
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const revision = useRef(0),
    candidate = useRef<string | null>(null),
    mounted = useRef(false);
  const refresh = useCallback(async () => {
    const token = ++revision.current;
    setLoading(true);
    setFailed(false);
    setUser(null);
    try {
      const result = await boundedRead(createClient().auth.getUser());
      if (!mounted.current || token !== revision.current) return;
      if (result.error && result.error.name !== "AuthSessionMissingError")
        throw result.error;
      candidate.current = result.data.user?.id ?? null;
      setUser(result.data.user);
    } catch {
      if (mounted.current && token === revision.current)
        setFailed(true);
    } finally {
      if (mounted.current && token === revision.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        ++revision.current;
        candidate.current = null;
        setUser(null);
        setFailed(false);
        setLoading(false);
      } else if (session?.user.id && session.user.id !== candidate.current) {
        ++revision.current;
        candidate.current = session.user.id;
        setUser(null);
        setLoading(true);
        queueMicrotask(() => {
          if (mounted.current) void refresh();
        });
      }
    });
    void refresh();
    return () => {
      mounted.current = false;
      ++revision.current;
      subscription.unsubscribe();
    };
  }, [refresh]);
  const error = failed ? localized(locale,
    "تعذّر التحقق من حسابك. أعد المحاولة عند عودة الاتصال.",
    "Could not verify your account. Try again when your connection returns.") : "";
  return { user, loading, error, refresh, revision };
}
