import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string | null;
  sender_name: string;
  sender_avatar: string;
  body: string;
  created_at: string;
};

export type ChatApi = {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  send: (body: string) => Promise<void>;
  /** Messages that arrived since the panel was last marked as read. */
  unread: number;
  markRead: () => void;
  /** One-phone mode only: which player the next message is from. */
  localSender?: { id: string; name: string; avatar: string };
  /** One-phone mode only: switch who is typing. */
  switchLocalSender?: () => void;
};

const MAX_LEN = 500;


/** Realtime chat for a two-player room. Idle when there is no room. */
export function useRoomChat(
  roomId: string | null,
  me: { id: string | null; name: string; avatar: string },
): ChatApi {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(0);
  const meRef = useRef(me);
  meRef.current = me;

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setSeen(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      const { data, error: err } = await supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      setLoading(false);
      if (err) {
        setError("Chat is unavailable right now.");
        return;
      }
      const rows = (data ?? []) as ChatMessage[];
      setMessages(rows);
      setSeen(rows.length);
    })();

    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  const send = useCallback(
    async (raw: string) => {
      const body = raw.trim().slice(0, MAX_LEN);
      const sender = meRef.current;
      if (!roomId || !body || !sender.id) return;
      setError(null);
      const { error: err } = await supabase.from("room_messages").insert({
        room_id: roomId,
        sender_id: sender.id,
        sender_name: sender.name,
        sender_avatar: sender.avatar,
        body,
      });
      if (err) setError("Message didn't send. Try again.");
    },
    [roomId],
  );

  const markRead = useCallback(() => setSeen(messages.length), [messages.length]);

  return {
    messages,
    loading,
    error,
    send,
    unread: Math.max(0, messages.length - seen),
    markRead,
  };
}

/* --------------------------------------------------------------------------
 * One-phone fallback: a shared notes thread saved on this device so the chat
 * UI still works for guests and pass-and-play sessions.
 * ------------------------------------------------------------------------ */

function localKey(gameId: string) {
  return `koupl.chat.${gameId}`;
}

/** Device-local chat between the two players sharing one phone. */
export function useLocalChat(
  gameId: string,
  players: [
    { name: string; avatar: string },
    { name: string; avatar: string },
  ],
): ChatApi {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [seen, setSeen] = useState(0);
  const [slot, setSlot] = useState<0 | 1>(0);
  const playersRef = useRef(players);
  playersRef.current = players;

  useEffect(() => {
    let rows: ChatMessage[] = [];
    try {
      const raw = window.localStorage.getItem(localKey(gameId));
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) rows = parsed as ChatMessage[];
    } catch {
      rows = [];
    }
    setMessages(rows);
    setSeen(rows.length);
    setLoading(false);
  }, [gameId]);

  const persist = useCallback(
    (rows: ChatMessage[]) => {
      try {
        window.localStorage.setItem(localKey(gameId), JSON.stringify(rows.slice(-200)));
      } catch {
        /* storage full or unavailable — chat stays in memory */
      }
    },
    [gameId],
  );

  const send = useCallback(
    async (raw: string) => {
      const body = raw.trim().slice(0, MAX_LEN);
      if (!body) return;
      const who = playersRef.current[slot];
      const row: ChatMessage = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        room_id: gameId,
        sender_id: slot === 0 ? "p0" : "p1",
        sender_name: who.name,
        sender_avatar: who.avatar,
        body,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, row];
        persist(next);
        return next;
      });
      setSeen((s) => s + 1);
    },
    [gameId, persist, slot],
  );

  const markRead = useCallback(() => setSeen(messages.length), [messages.length]);
  const switchLocalSender = useCallback(() => setSlot((s) => (s === 0 ? 1 : 0)), []);

  return {
    messages,
    loading,
    error: null,
    send,
    unread: Math.max(0, messages.length - seen),
    markRead,
    localSender: {
      id: slot === 0 ? "p0" : "p1",
      name: players[slot].name,
      avatar: players[slot].avatar,
    },
    switchLocalSender,
  };
}
