import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HapticManager, SoundManager } from "./feedback";
import type { ActivityItem, GuestProfile, Player, Settings } from "./types";

const GUEST_KEY = "koupl.guest.v1";
const SETTINGS_KEY = "koupl.settings.v1";
const ACTIVITY_KEY = "koupl.activity.v1";
const FAVORITES_KEY = "koupl.favorites.v1";
const STREAK_KEY = "koupl.couple-streak.v1";
/** Last good profile/partner, so one-phone play keeps real names when offline. */
const PROFILE_CACHE_KEY = "koupl.profile-cache.v1";
/** Results finished offline while signed in, waiting to be uploaded. */
const PENDING_KEY = "koupl.activity.pending.v1";

type PendingActivity = Omit<ActivityItem, "id"> & {
  local_id: string;
  user_id: string;
  failed?: boolean;
};

export type SyncStatus = "local" | "pending" | "failed" | "synced";

export type CoupleStreak = {
  current: number;
  best: number;
  leaderId: string | null;
  leaderName: string | null;
};

const EMPTY_STREAK: CoupleStreak = { current: 0, best: 0, leaderId: null, leaderName: null };

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
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(fallback) || Array.isArray(parsed)) {
      return (Array.isArray(parsed) ? parsed : fallback) as T;
    }
    return { ...fallback, ...(parsed as object) } as T;
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
  favorites: string[];
  coupleStreak: CoupleStreak;
  setSettings: (patch: Partial<Settings>) => void;
  saveGuest: (patch: Partial<GuestProfile>) => void;
  clearGuest: () => void;
  startDemo: () => void;
  updateProfile: (patch: Partial<ProfileRow>) => Promise<void>;
  linkPartner: (code: string) => Promise<{ name: string } | null>;
  unlinkPartner: () => Promise<void>;
  logActivity: (item: Omit<ActivityItem, "id" | "created_at">) => Promise<void>;
  clearActivity: () => Promise<void>;
  toggleFavorite: (gameId: string) => void;
  recordCoupleResult: (winner: Player | null) => CoupleStreak;
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [coupleStreak, setCoupleStreak] = useState<CoupleStreak>(EMPTY_STREAK);
  const flushingRef = useRef(false);

  /* -------- hydration from localStorage -------- */
  useEffect(() => {
    const g = readLocal<GuestProfile | null>(GUEST_KEY, null as unknown as GuestProfile) as
      | GuestProfile
      | null;
    setGuestState(g && g.name ? g : null);
    setSettingsState(readLocal<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS));
    setActivity(readLocal<ActivityItem[]>(ACTIVITY_KEY, [] as ActivityItem[]));
    setFavorites(readLocal<string[]>(FAVORITES_KEY, [] as string[]));
    setCoupleStreak(readLocal<CoupleStreak>(STREAK_KEY, EMPTY_STREAK));
    setHydrated(true);
  }, []);

  /* -------- theme -------- */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  useEffect(() => {
    SoundManager.setEnabled(settings.sound);
    HapticManager.setEnabled(settings.haptics);
  }, [settings.haptics, settings.sound]);

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
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (error) {
      // Offline / network failure: fall back to the last profile we saw for this user.
      const cached = readLocal<{ profile: ProfileRow | null; partner: { display_name: string; avatar: string } | null } | null>(
        PROFILE_CACHE_KEY,
        null as never,
      );
      if (cached?.profile && cached.profile.id === uid) {
        setProfile(cached.profile);
        setPartnerRow(cached.partner ?? null);
      }
      return;
    }
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
      writeLocal(PROFILE_CACHE_KEY, { profile: data, partner: p ?? null });
    } else {
      setPartnerRow(null);
      writeLocal(PROFILE_CACHE_KEY, { profile: data, partner: null });
    }
  }, []);

  const refreshActivity = useCallback(async () => {
    if (!userId) return;
    setActivityLoading(true);
    const { data, error } = await supabase
      .from("activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) {
      // Offline: keep whatever is already shown instead of wiping the list.
      setActivityLoading(false);
      return;
    }
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
      if (patch.sound !== undefined) SoundManager.setEnabled(patch.sound);
      if (patch.haptics !== undefined) HapticManager.setEnabled(patch.haptics);
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

  const syncPendingState = useCallback(() => {
    setPending(readLocal<PendingActivity[]>(PENDING_KEY, []));
  }, []);

  useEffect(() => {
    syncPendingState();
  }, [syncPendingState, userId]);

  /** Upload results finished offline while signed in. Never blocks gameplay. */
  const flushPending = useCallback(
    async (onlyId?: string) => {
      if (!userId || flushingRef.current) return;
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      const queue = readLocal<PendingActivity[]>(PENDING_KEY, []);
      const mine = queue.filter(
        (p) => p.user_id === userId && (!onlyId || p.local_id === onlyId),
      );
      if (mine.length === 0) return;
      if (offline) {
        if (onlyId) toast.error("You're offline — it will upload when you reconnect");
        return;
      }
      flushingRef.current = true;
      const done = new Set<string>();
      const failed = new Set<string>();
      try {
        for (const p of mine) {
          const { error } = await supabase.from("activity").insert({
            game_id: p.game_id,
            mode: p.mode,
            summary: p.summary,
            my_score: p.my_score,
            their_score: p.their_score,
            created_at: p.created_at,
            user_id: userId,
          });
          if (error) {
            failed.add(p.local_id);
            break;
          }
          done.add(p.local_id);
        }
      } finally {
        flushingRef.current = false;
      }
      const rest = readLocal<PendingActivity[]>(PENDING_KEY, [])
        .filter((p) => !done.has(p.local_id))
        .map((p) => (failed.has(p.local_id) ? { ...p, failed: true } : p));
      writeLocal(PENDING_KEY, rest);
      setPending(rest);
      if (onlyId) {
        if (done.size) toast.success("Result uploaded");
        else toast.error("Upload failed — try again in a moment");
      }
      if (done.size > 0) await refreshActivity();
    },
    [userId, refreshActivity],
  );

  useEffect(() => {
    if (!userId) return;
    void flushPending();
    const onOnline = () => void flushPending();
    const onVisible = () => {
      if (document.visibilityState === "visible") void flushPending();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, flushPending]);

  const retryUpload = useCallback((localId: string) => flushPending(localId), [flushPending]);

  const logActivity = useCallback(
    async (item: Omit<ActivityItem, "id" | "created_at">) => {
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const createdAt = new Date().toISOString();
      if (userId) {
        const { error } = await supabase.from("activity").insert({ ...item, user_id: userId });
        if (!error) {
          await refreshActivity();
          return;
        }
        // Couldn't upload: keep it on this device and queue it (shown as pending/failed).
        const online = typeof navigator === "undefined" || navigator.onLine !== false;
        const queue = readLocal<PendingActivity[]>(PENDING_KEY, []);
        const next = [
          ...queue,
          { ...item, local_id: localId, created_at: createdAt, user_id: userId, failed: online },
        ].slice(-100);
        writeLocal(PENDING_KEY, next);
        setPending(next);
        return;
      }
      setActivity((prev) => {
        const next = [{ ...item, id: localId, created_at: createdAt }, ...prev].slice(0, 60);
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

  const toggleFavorite = useCallback((gameId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId];
      writeLocal(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const recordCoupleResult = useCallback((winner: Player | null) => {
    let result = EMPTY_STREAK;
    setCoupleStreak((previous) => {
      const current = winner
        ? previous.leaderId === winner.id
          ? previous.current + 1
          : 1
        : 0;
      result = {
        current,
        best: Math.max(previous.best, current),
        leaderId: winner?.id ?? null,
        leaderName: winner?.name ?? null,
      };
      writeLocal(STREAK_KEY, result);
      return result;
    });
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPartnerRow(null);
  }, []);

  const buzz = useCallback(
    (ms = 12) => {
      SoundManager.play(ms >= 18 ? "win-round" : "tap");
      void HapticManager.play(ms >= 18 ? "success" : "selection");
    },
    [],
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
    favorites,
    coupleStreak,
    setSettings,
    saveGuest,
    clearGuest,
    startDemo,
    updateProfile,
    linkPartner,
    unlinkPartner,
    logActivity,
    clearActivity,
    toggleFavorite,
    recordCoupleResult,
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
