import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { ActivityItem, GuestProfile, Player, Settings } from "./types";

const GUEST_KEY = "koupl.guest.v1";
const SETTINGS_KEY = "koupl.settings.v1";
const ACTIVITY_KEY = "koupl.activity.v1";

export type ProfileRow = {
  id: string;
  display_name: string;
  avatar: string;
  relationship_status: string;
  partner_id: string | null;
  invite_code: string;
  sound_enabled: boolean;
  haptics_enabled: boolean;
  notifications_enabled: boolean;
  theme: string;
};

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  haptics: true,
  notifications: true,
  theme: "light",
};

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function randomCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

type Ctx = {
  hydrated: boolean;
  loading: boolean;
  session: Session | null;
  profile: ProfileRow | null;
  guest: GuestProfile | null;
  isGuest: boolean;
  onboarded: boolean;
  me: Player;
  partner: Player | null;
  inviteCode: string;
  settings: Settings;
  activity: ActivityItem[];
  activityLoading: boolean;
  setSettings: (patch: Partial<Settings>) => void;
  saveGuest: (patch: Partial<GuestProfile>) => void;
  clearGuest: () => void;
  startDemo: () => void;
  updateProfile: (patch: Partial<ProfileRow>) => Promise<void>;
  linkPartner: (code: string) => Promise<{ name: string } | null>;
  unlinkPartner: () => Promise<void>;
  logActivity: (item: Omit<ActivityItem, "id" | "created_at">) => Promise<void>;
  clearActivity: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  signOut: () => Promise<void>;
  buzz: (ms?: number) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [partnerRow, setPartnerRow] = useState<{ display_name: string; avatar: string } | null>(
    null,
  );
  const [guest, setGuestState] = useState<GuestProfile | null>(null);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  /* -------- hydration from localStorage -------- */
  useEffect(() => {
    const g = readLocal<GuestProfile | null>(GUEST_KEY, null as unknown as GuestProfile) as
      | GuestProfile
      | null;
    setGuestState(g && g.name ? g : null);
    setSettingsState(readLocal<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS));
    setActivity(readLocal<ActivityItem[]>(ACTIVITY_KEY, [] as ActivityItem[]));
    setHydrated(true);
  }, []);

  /* -------- theme -------- */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  /* -------- auth session -------- */
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (!data) {
      setProfile(null);
      return;
    }
    setProfile(data as ProfileRow);
    setSettingsState((prev) => ({
      ...prev,
      sound: data.sound_enabled,
      haptics: data.haptics_enabled,
      notifications: data.notifications_enabled,
      theme: data.theme === "dark" ? "dark" : "light",
    }));
    if (data.partner_id) {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, avatar")
        .eq("id", data.partner_id)
        .maybeSingle();
      setPartnerRow(p ?? null);
    } else {
      setPartnerRow(null);
    }
  }, []);

  const refreshActivity = useCallback(async () => {
    if (!userId) return;
    setActivityLoading(true);
    const { data } = await supabase
      .from("activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    setActivity((data ?? []) as ActivityItem[]);
    setActivityLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setPartnerRow(null);
      return;
    }
    void loadProfile(userId);
    void refreshActivity();
  }, [userId, loadProfile, refreshActivity]);

  /* -------- actions -------- */
  const setSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...patch };
        writeLocal(SETTINGS_KEY, next);
        return next;
      });
      if (userId) {
        void supabase
          .from("profiles")
          .update({
            ...(patch.sound !== undefined ? { sound_enabled: patch.sound } : {}),
            ...(patch.haptics !== undefined ? { haptics_enabled: patch.haptics } : {}),
            ...(patch.notifications !== undefined
              ? { notifications_enabled: patch.notifications }
              : {}),
            ...(patch.theme !== undefined ? { theme: patch.theme } : {}),
          })
          .eq("id", userId);
      }
    },
    [userId],
  );

  const saveGuest = useCallback((patch: Partial<GuestProfile>) => {
    setGuestState((prev) => {
      const next: GuestProfile = {
        name: "Player",
        avatar: "🦊",
        relationship: "dating",
        partnerName: "",
        partnerAvatar: "🐼",
        code: randomCode(),
        ...(prev ?? {}),
        ...patch,
      };
      writeLocal(GUEST_KEY, next);
      return next;
    });
  }, []);

  const clearGuest = useCallback(() => {
    setGuestState(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(GUEST_KEY);
  }, []);

  /** One-tap demo: a ready-made couple plus a little history to look at. */
  const startDemo = useCallback(() => {
    const demoGuest: GuestProfile = {
      name: "Sam",
      avatar: "🦊",
      relationship: "dating",
      partnerName: "Alex",
      partnerAvatar: "🐼",
      code: randomCode(),
    };
    setGuestState(demoGuest);
    writeLocal(GUEST_KEY, demoGuest);

    const now = Date.now();
    const demoActivity: ActivityItem[] = [
      {
        id: "demo-1",
        game_id: "this-or-that",
        mode: "local",
        summary: "8 of 10 matched",
        my_score: 8,
        their_score: 8,
        created_at: new Date(now - 3 * 3_600_000).toISOString(),
      },
      {
        id: "demo-2",
        game_id: "couple-quiz",
        mode: "local",
        summary: "Sam 5 — Alex 6",
        my_score: 5,
        their_score: 6,
        created_at: new Date(now - 26 * 3_600_000).toISOString(),
      },
      {
        id: "demo-3",
        game_id: "four-in-a-row",
        mode: "local",
        summary: "Sam wins",
        my_score: 1,
        their_score: 0,
        created_at: new Date(now - 3 * 86_400_000).toISOString(),
      },
    ];
    setActivity(demoActivity);
    writeLocal(ACTIVITY_KEY, demoActivity);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<ProfileRow>) => {
      if (!userId) return;
      await supabase.from("profiles").update(patch).eq("id", userId);
      await loadProfile(userId);
    },
    [userId, loadProfile],
  );

  const linkPartner = useCallback(
    async (code: string) => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("link_partner", { p_code: code.trim() });
      if (error) throw new Error(error.message);
      const row = Array.isArray(data) ? data[0] : null;
      await loadProfile(userId);
      return row ? { name: row.display_name as string } : null;
    },
    [userId, loadProfile],
  );

  const unlinkPartner = useCallback(async () => {
    if (!userId) return;
    await supabase.from("profiles").update({ partner_id: null }).eq("id", userId);
    await loadProfile(userId);
  }, [userId, loadProfile]);

  const logActivity = useCallback(
    async (item: Omit<ActivityItem, "id" | "created_at">) => {
      if (userId) {
        await supabase.from("activity").insert({ ...item, user_id: userId });
        await refreshActivity();
        return;
      }
      setActivity((prev) => {
        const next = [
          {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 60);
        writeLocal(ACTIVITY_KEY, next);
        return next;
      });
    },
    [userId, refreshActivity],
  );

  const clearActivity = useCallback(async () => {
    if (userId) {
      await supabase.from("activity").delete().eq("user_id", userId);
      await refreshActivity();
      return;
    }
    setActivity([]);
    writeLocal(ACTIVITY_KEY, []);
  }, [userId, refreshActivity]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPartnerRow(null);
  }, []);

  const buzz = useCallback(
    (ms = 12) => {
      if (!settings.haptics) return;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(ms);
        } catch {
          /* ignore */
        }
      }
    },
    [settings.haptics],
  );

  const me: Player = useMemo(() => {
    if (profile)
      return { id: profile.id, name: profile.display_name, avatar: profile.avatar };
    if (guest) return { id: "guest-me", name: guest.name, avatar: guest.avatar };
    return { id: "guest-me", name: "You", avatar: "🦊" };
  }, [profile, guest]);

  const partner: Player | null = useMemo(() => {
    if (profile?.partner_id && partnerRow)
      return {
        id: profile.partner_id,
        name: partnerRow.display_name,
        avatar: partnerRow.avatar,
      };
    if (guest?.partnerName)
      return { id: "guest-partner", name: guest.partnerName, avatar: guest.partnerAvatar };
    return null;
  }, [profile, partnerRow, guest]);

  const value: Ctx = {
    hydrated,
    loading: loading || (!!userId && !profile),
    session,
    profile,
    guest,
    isGuest: !session,
    onboarded: !!profile || !!guest,
    me,
    partner,
    inviteCode: profile?.invite_code ?? guest?.code ?? "",
    settings,
    activity,
    activityLoading,
    setSettings,
    saveGuest,
    clearGuest,
    updateProfile,
    linkPartner,
    unlinkPartner,
    logActivity,
    clearActivity,
    refreshActivity,
    signOut,
    buzz,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
