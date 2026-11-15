"use client";
import {
  purgeForeignOrExpiredStudyDrafts,
  wipeAllStudyDrafts,
} from "@/lib/study/draft-storage";
import {
  purgeForeignOrSignedOutShellPreferences,
  SIDEBAR_PREFS_EVENT,
} from "@/lib/shell/sidebar-preferences";
import { SIDEBAR_DEFAULT_WIDTH } from "@/lib/shell/sidebar-config";
import {
  MOTION_PREFERENCE_EVENT,
  purgeForeignOrSignedOutDevicePreferences,
  syncMotionDomAttributes,
} from "@/lib/appearance/device-preferences";
import { resolveAppearance } from "@/lib/appearance/mode";
import { clearCustomDesign } from "@/lib/appearance/theme";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { boundedRead } from "./bounded-read";
import { createClient } from "./client";
import { supabaseConfiguration } from "./config";
import { localized, useLocale } from "@/lib/i18n/locale";

export { boundedRead };

export type VerifiedRole = "student" | "teacher" | "admin";

export type VerifiedProfile = {
  displayName: string;
  role: VerifiedRole;
};

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
        if (typeof window !== "undefined") {
          wipeAllStudyDrafts(window.localStorage);
          purgeForeignOrSignedOutShellPreferences(window.localStorage, null);
          purgeForeignOrSignedOutDevicePreferences(null, window.localStorage);
          const root = document.documentElement;
          clearCustomDesign();
          root.dataset.palette = "classic";
          root.dataset.modeConstraint = "none";
          const osDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
          root.dataset.theme = resolveAppearance("system", "classic", osDark, "both");
          root.style.colorScheme = root.dataset.theme === "dark" ? "dark" : "light";
          syncMotionDomAttributes({ mode: "system", root });
          root.style.setProperty("--sidebar-user-w", `${SIDEBAR_DEFAULT_WIDTH}px`);
          root.removeAttribute("data-sidebar-collapsed");
          window.dispatchEvent(new Event("noata-palette-change"));
          window.dispatchEvent(new Event("noata-custom-theme-change"));
          window.dispatchEvent(new Event(MOTION_PREFERENCE_EVENT));
          window.dispatchEvent(new Event(SIDEBAR_PREFS_EVENT));
        }
        setUser(null);
        setFailed(false);
        setLoading(false);
      } else if (session?.user.id && session.user.id !== candidate.current) {
        ++revision.current;
        candidate.current = session.user.id;
        if (typeof window !== "undefined") {
          purgeForeignOrExpiredStudyDrafts(window.localStorage, session.user.id, revision.current);
          purgeForeignOrSignedOutShellPreferences(window.localStorage, session.user.id);
          purgeForeignOrSignedOutDevicePreferences(session.user.id, window.localStorage);
          window.dispatchEvent(new Event(SIDEBAR_PREFS_EVENT));
        }
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
