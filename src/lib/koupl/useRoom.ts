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
  /** Pull the authoritative row again (reconnect / tab focus / refresh). */
  refresh: () => Promise<void>;
  clearError: () => void;
};

/** Live two-player room backed by the database with realtime updates. */
export function useRoom(gameId: string, userId: string | null): RoomApi {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const roomIdRef = useRef<string | null>(null);

  roomIdRef.current = room?.id ?? null;

  // Restore the room this device was last in, so a refresh never loses it.
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const savedCode = window.localStorage.getItem(`koupl.room.${gameId}`);
    if (!savedCode) return;
    let active = true;
    void supabase
      .from("rooms")
      .select("*")
      .eq("code", savedCode)
      .eq("game_id", gameId)
      .in("status", ["waiting", "playing"])
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const row = data as RoomRow | null;
        const member = !!row && (row.host_id === userId || row.guest_id === userId);
        if (member) setRoom(row);
        else window.localStorage.removeItem(`koupl.room.${gameId}`);
      });
    return () => {
      active = false;
    };
  }, [gameId, userId]);

  useEffect(() => {
    if (!room?.id) return;
    const id = room.id;
    const channel = supabase
      .channel(`room-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${id}` },
        (payload) => {
          const next = payload.new as RoomRow;
          // The other player closed the room — drop out cleanly instead of
          // holding on to a dead room row.
          if (next.status === "closed") {
            setRoom(null);
            setError("The room was closed.");
            if (typeof window !== "undefined")
              window.localStorage.removeItem(`koupl.room.${gameId}`);
            return;
          }
          setRoom(next);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${id}` },
        () => {
          setRoom(null);
          if (typeof window !== "undefined")
            window.localStorage.removeItem(`koupl.room.${gameId}`);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.id, gameId]);

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

  const join = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase();
      if (clean.length < 4) {
        setError("Enter the full room code.");
        return null;
      }
      setBusy(true);
      setError(null);
      const { data, error: err } = await supabase.rpc("join_room", { p_code: clean });
      setBusy(false);
      const row = Array.isArray(data) ? (data[0] as RoomRow | undefined) : undefined;
      if (err || !row) {
        setError(err?.message ?? "No open room with that code.");
        return null;
      }
      if (row.game_id !== gameId) {
        setError("That room is for a different game.");
        return null;
      }
      setRoom(row);
      if (typeof window !== "undefined")
        window.localStorage.setItem(`koupl.room.${gameId}`, row.code);
      return row;
    },
    [gameId],
  );

  /**
   * Re-read the authoritative row. Realtime can miss updates while the tab is
   * backgrounded or the connection drops, so we resync on focus/reconnect.
   */
  const refresh = useCallback(async () => {
    const id = roomIdRef.current;
    if (!id || !userId) return;
    const { data } = await supabase.from("rooms").select("*").eq("id", id).maybeSingle();
    const row = data as RoomRow | null;
    if (!row || row.status === "closed") {
      setRoom(null);
      setError("The room was closed.");
      if (typeof window !== "undefined") window.localStorage.removeItem(`koupl.room.${gameId}`);
      return;
    }
    if (row.host_id !== userId && row.guest_id !== userId) {
      setRoom(null);
      setError("You're no longer in that room.");
      if (typeof window !== "undefined") window.localStorage.removeItem(`koupl.room.${gameId}`);
      return;
    }
    setRoom(row);
  }, [gameId, userId]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("online", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [refresh]);

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
    const { data, error: err } = await supabase.rpc("patch_room_state", {
      p_room_id: id,
      p_patch: patch as never,
    });
    const updated = Array.isArray(data) ? (data[0] as RoomRow | undefined) : undefined;
    if (updated) setRoom(updated);
    if (err) setError(err.message);
  }, []);

  return { room, error, busy, create, join, leave, patchState, refresh, clearError };
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
