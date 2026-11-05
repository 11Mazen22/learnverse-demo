"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";
import { supabaseConfiguration } from "./config";
import { localized, useLocale } from "@/lib/i18n/locale";

export type VerifiedRole = "student" | "teacher" | "admin";

export type VerifiedProfile = {
  displayName: string;
  role: VerifiedRole;
};

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

type VerifiedAccountValue = {
  user: User | null;
  loading: boolean;
  error: string;
  profile: VerifiedProfile | null;
  profileLoading: boolean;
  profileError: string;
  role: VerifiedRole | null;
  refresh: () => Promise<void>;
  revision: { current: number };
};

const VerifiedAccountContext = createContext<VerifiedAccountValue | null>(null);

/** One account observer for the entire app; database RLS remains mandatory. */
export function VerifiedAccountProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const client = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [profile, setProfile] = useState<VerifiedProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFailed, setProfileFailed] = useState(false);
  const revision = useRef(0),
    candidate = useRef<string | null>(null),
    mounted = useRef(false);
  const refresh = useCallback(async () => {
    const token = ++revision.current;
    const watchdog = setTimeout(() => {
      if (!mounted.current || token !== revision.current) return;
      // Supabase client initialization itself can stall before it returns a
      // promise (for example, a browser lock or broken local transport). The
      // normal boundedRead cannot cover code that never reaches it, so fail
      // closed instead of leaving every private route on an endless spinner.
      ++revision.current;
      candidate.current = null;
      setUser(null);
      setFailed(true);
      setLoading(false);
    }, 12000);
    setLoading(true);
    setFailed(false);
    setUser(null);
    if (supabaseConfiguration.error) {
      clearTimeout(watchdog);
      if (mounted.current && token === revision.current) {
        setFailed(true);
        setLoading(false);
      }
      return;
    }
    try {
      const result = await boundedRead(client.auth.getUser());
      if (!mounted.current || token !== revision.current) return;
      if (result.error && result.error.name !== "AuthSessionMissingError")
        throw result.error;
      candidate.current = result.data.user?.id ?? null;
      setUser(result.data.user);
    } catch {
      if (mounted.current && token === revision.current)
        setFailed(true);
    } finally {
      clearTimeout(watchdog);
      if (mounted.current && token === revision.current) setLoading(false);
    }
  }, [client]);
  useEffect(() => {
    mounted.current = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
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
  }, [client, refresh]);

  useEffect(() => {
    let alive = true;
    const token = revision.current;
    setProfile(null);
    setProfileFailed(false);

    if (loading) {
      setProfileLoading(true);
      return () => {
        alive = false;
      };
    }
    if (!user) {
      setProfileLoading(false);
      return () => {
        alive = false;
      };
    }

    setProfileLoading(true);
    void (async () => {
      try {
        const result = await boundedRead(
          client
            .from("profiles")
            .select("display_name,role")
            .eq("id", user.id)
            .maybeSingle(),
        );
        if (!alive || token !== revision.current) return;
        if (result.error || !result.data) throw result.error ?? Error("Profile unavailable");
        if (!(["student", "teacher", "admin"] as const).includes(result.data.role)) {
          throw Error("Invalid profile role");
        }
        setProfile({
          displayName: result.data.display_name || "",
          role: result.data.role,
        });
      } catch {
        if (alive && token === revision.current) setProfileFailed(true);
      } finally {
        if (alive && token === revision.current) setProfileLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [client, loading, user]);

  const error = failed ? localized(locale,
    "تعذّر التحقق من حسابك. أعد المحاولة عند عودة الاتصال.",
    "Could not verify your account. Try again when your connection returns.") : "";
  const profileError = profileFailed ? localized(
    locale,
    "تعذّر التحقق من دور الحساب. لن نعرض أي مساحة مقيّدة حتى تنجح المحاولة.",
    "Could not verify the account role. Restricted workspaces stay hidden until verification succeeds.",
  ) : "";
  const value = useMemo<VerifiedAccountValue>(
    () => ({
      user,
      loading,
      error,
      profile,
      profileLoading,
      profileError,
      role: profile?.role ?? null,
      refresh,
      revision,
    }),
    [user, loading, error, profile, profileLoading, profileError, refresh],
  );
  return <VerifiedAccountContext.Provider value={value}>{children}</VerifiedAccountContext.Provider>;
}

export function useVerifiedAccount() {
  const account = useContext(VerifiedAccountContext);
  if (!account) throw Error("useVerifiedAccount must be used inside VerifiedAccountProvider");
  return account;
}
