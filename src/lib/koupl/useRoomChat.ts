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
