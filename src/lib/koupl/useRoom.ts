import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { SharedState } from "./types";

export type RoomRow = {
  id: string;
  code: string;
  host_id: string;
  guest_id: string | null;
  game_id: string;
  status: string;
  state: Record<string, unknown>;
};

export type RoomApi = {
  room: RoomRow | null;
  error: string | null;
  busy: boolean;
  create: () => Promise<RoomRow | null>;
  join: (code: string) => Promise<RoomRow | null>;
  leave: () => Promise<void>;
  patchState: (patch: Record<string, unknown>) => Promise<void>;
};

/** Live two-player room backed by the database with realtime updates. */
export function useRoom(gameId: string, userId: string | null): RoomApi {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const roomIdRef = useRef<string | null>(null);

  roomIdRef.current = room?.id ?? null;

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const savedCode = window.localStorage.getItem(`koupl.room.${gameId}`);
    if (!savedCode) return;
    let active = true;
    void supabase
      .from("rooms")
      .select("*")
      .eq("code", savedCode)
      .in("status", ["waiting", "playing"])
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setRoom(data as RoomRow);
      });
    return () => {
      active = false;
    };
  }, [gameId, userId]);

  useEffect(() => {
    if (!room?.id) return;
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => setRoom(payload.new as RoomRow),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.id]);

  const create = useCallback(async () => {
    if (!userId) return null;
    setBusy(true);
    setError(null);
    const code = randomRoomCode();
    const { data, error: err } = await supabase
      .from("rooms")
      .insert({ code, host_id: userId, game_id: gameId, status: "waiting", state: {} })
      .select()
      .single();
    setBusy(false);
    if (err) {
      setError(err.message);
      return null;
    }
    setRoom(data as RoomRow);
    if (typeof window !== "undefined") window.localStorage.setItem(`koupl.room.${gameId}`, data.code);
    return data as RoomRow;
  }, [gameId, userId]);

  const join = useCallback(async (code: string) => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("join_room", { p_code: code.trim() });
    setBusy(false);
    const row = Array.isArray(data) ? (data[0] as RoomRow | undefined) : undefined;
    if (err || !row) {
      setError(err?.message ?? "Room not found");
      return null;
    }
    setRoom(row);
    if (typeof window !== "undefined") window.localStorage.setItem(`koupl.room.${gameId}`, row.code);
    return row;
  }, []);

  const leave = useCallback(async () => {
    const id = roomIdRef.current;
    setRoom(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(`koupl.room.${gameId}`);
    if (!id || !userId) return;
    await supabase.from("rooms").update({ status: "closed" }).eq("id", id);
  }, [gameId, userId]);

  const patchState = useCallback(async (patch: Record<string, unknown>) => {
    const id = roomIdRef.current;
    if (!id) return;
    setRoom((prev) => (prev ? { ...prev, state: { ...prev.state, ...patch } } : prev));
    const { data } = await supabase.from("rooms").select("state").eq("id", id).single();
    const current = (data?.state ?? {}) as Record<string, unknown>;
    const merged = { ...current, ...patch };
    await supabase
      .from("rooms")
      .update({ state: merged as never })
      .eq("id", id);
  }, []);

  return { room, error, busy, create, join, leave, patchState };
}

export function randomRoomCode(len = 5) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/**
 * Game state container. Backed by the room row when online, by React state when
 * playing on one device — games use the identical API either way.
 */
export function useSharedState<T extends Record<string, unknown>>(
  initial: T,
  room: RoomApi | null,
  /** When set, a one-device game survives a refresh. */
  persistKey?: string,
): SharedState<T> {
  const storageKey = persistKey ? `koupl.game.${persistKey}` : null;
  const [local, setLocal] = useState<T>(initial);
  const [ready, setReady] = useState(!storageKey);
  const online = !!room?.room;

  // Restore a saved one-device game after hydration.
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setLocal({ ...initial, ...(JSON.parse(raw) as Partial<T>) });
    } catch {
      /* ignore unreadable state */
    }
    setReady(true);
    // Only on mount: the saved game belongs to this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const save = useCallback(
    (next: T) => {
      if (!storageKey || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const remote = (room?.room?.state ?? {}) as Partial<T>;
  const value = online ? ({ ...initial, ...remote } as T) : local;

  const patch = useCallback(
    (next: Partial<T> | ((prev: T) => Partial<T>)) => {
      if (online && room) {
        const resolved = typeof next === "function" ? next(value) : next;
        void room.patchState(resolved as Record<string, unknown>);
      } else {
        setLocal((prev) => {
          const merged = { ...prev, ...(typeof next === "function" ? next(prev) : next) };
          save(merged);
          return merged;
        });
      }
    },
    [online, room, value, save],
  );

  const reset = useCallback(
    (next: T) => {
      if (online && room) void room.patchState(next as Record<string, unknown>);
      else {
        setLocal(next);
        save(next);
      }
    },
    [online, room, save],
  );

  return { value, patch, reset, ready: online || ready };
}

/** Forget a saved one-device game (used when a game is finished or abandoned). */
export function clearSavedGame(persistKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`koupl.game.${persistKey}`);
  } catch {
    /* ignore */
  }
}
