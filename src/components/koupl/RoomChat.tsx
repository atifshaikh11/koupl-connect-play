import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatApi } from "@/lib/koupl/useRoomChat";

function timeOf(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const QUICK = ["Ready when you are 💫", "One sec!", "Good luck 😄", "That was so you 😂"];

/** Message list + composer. Used inline in the lobby and inside the in-game sheet. */
export function ChatPanel({
  chat,
  myId,
  className,
  compact,
}: {
  chat: ChatApi;
  myId: string | null;
  className?: string;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.messages.length]);

  function submit() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    void chat.send(body);
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        className={cn(
          "min-h-0 flex-1 space-y-2 overflow-y-auto pr-1",
          compact ? "max-h-[46vh]" : "max-h-56",
        )}
        aria-live="polite"
      >
        {chat.loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-2/3 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : chat.messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No messages yet — say hi before you start 👋
          </p>
        ) : (
          chat.messages.map((m) => {
            const mine = !!myId && m.sender_id === myId;
            return (
              <div
                key={m.id}
                className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}
              >
                {!mine ? (
                  <span className="text-lg leading-none" aria-hidden>
                    {m.sender_avatar}
                  </span>
                ) : null}
                <div
                  className={cn(
                    "animate-pop-in max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground",
                  )}
                >
                  {!mine ? (
                    <p className="text-[10px] font-bold opacity-70">{m.sender_name}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className="mt-0.5 text-[10px] opacity-60">{timeOf(m.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {chat.error ? (
        <p className="mt-2 text-center text-[11px] font-bold text-destructive" role="alert">
          {chat.error}
        </p>
      ) : null}

      {chat.messages.length === 0 && !chat.loading ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void chat.send(q)}
              className="press rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      {chat.localSender && chat.switchLocalSender ? (
        <button
          type="button"
          onClick={chat.switchLocalSender}
          className="press mt-3 self-start rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold"
        >
          Typing as {chat.localSender.avatar} {chat.localSender.name} — tap to switch
        </button>
      ) : null}

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="Message your partner"
          aria-label="Message your partner"
          className="h-12 flex-1 rounded-2xl"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!draft.trim()}
          className="h-12 w-12 shrink-0 rounded-2xl"
        >
          <Send className="h-5 w-5" aria-hidden />
        </Button>
      </form>

    </div>
  );
}

/** Floating chat button + bottom sheet, for use while a game is on screen. */
export function ChatDock({ chat, myId }: { chat: ChatApi; myId: string | null }) {
  const [open, setOpen] = useState(false);

  const markRead = chat.markRead;
  const unread = chat.unread;
  useEffect(() => {
    if (open && unread > 0) markRead();
  }, [open, unread, markRead]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={chat.unread ? `Open chat, ${chat.unread} new messages` : "Open chat"}
        className="press fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
        {chat.unread ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-berry px-1.5 text-[11px] font-bold text-berry-foreground">
            {chat.unread > 9 ? "9+" : chat.unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="animate-rise relative mx-auto flex max-h-[78dvh] w-full max-w-md flex-col rounded-t-3xl bg-background p-4 pb-6 shadow-float">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-base font-bold">Chat</p>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setOpen(false)}
                className="press flex h-9 w-9 items-center justify-center rounded-full border border-border"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <ChatPanel chat={chat} myId={myId} compact className="min-h-0 flex-1" />
          </div>
        </div>
      ) : null}
    </>
  );
}
