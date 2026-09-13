import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { LoadingScreen, Wordmark } from "@/components/koupl/ui";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/koupl/store";
import { COUPLE_ROOM_KEY, PENDING_JOIN_KEY } from "@/lib/koupl/coupleRoom";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "Join your Couple Room — Koupl" },
      {
        name: "description",
        content: "Open your partner's Koupl invite to join your shared Couple Room and play together.",
      },
      { property: "og:title", content: "Join your Couple Room — Koupl" },
      {
        property: "og:description",
        content: "One invite link keeps the two of you in the same room across every Koupl game.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinRoom,
});

function JoinRoom() {
  const { code } = Route.useParams();
  const app = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const tried = useRef(false);

  const raw = code.trim();
  // Long values are opaque invite tokens; short ones are the typed fallback code.
  const isToken = raw.length >= 8;
  const clean = isToken ? raw.toLowerCase() : raw.toUpperCase();

  useEffect(() => {
    if (!app.hydrated || app.loading || tried.current) return;
    tried.current = true;

    if (!app.session) {
      // Remember the invite so signing in lands straight in the room.
      window.localStorage.setItem(PENDING_JOIN_KEY, clean);
      void navigate({ to: "/auth" });
      return;
    }

    void (async () => {
      const { data, error: err } = isToken
        ? await supabase.rpc("join_room_by_token", {
            p_token: clean,
            p_game_id: COUPLE_ROOM_KEY,
          })
        : await supabase.rpc("join_room", {
            p_code: clean,
            p_game_id: COUPLE_ROOM_KEY,
          });
      const row = Array.isArray(data) ? data[0] : null;
      if (err || !row) {
        setError(err?.message ?? "That invite is no longer active.");
        return;
      }
      window.localStorage.setItem(`koupl.room.${COUPLE_ROOM_KEY}`, row.code);
      void navigate({ to: "/room" });
    })();
  }, [app.hydrated, app.loading, app.session, clean, navigate]);

  if (!error) return <LoadingScreen />;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-5 pt-10 text-center">
        <Wordmark className="text-lg" />
        <div className="surface mt-8 p-6">
          <div className="text-4xl" aria-hidden>
            💔
          </div>
          <h1 className="font-display mt-3 text-2xl font-bold">Invite didn’t work</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ask your partner to send a fresh invite from their Couple Room.
          </p>
          <Button className="mt-5 h-13 w-full rounded-2xl" onClick={() => void navigate({ to: "/room" })}>
            Go to Couple Room
          </Button>
        </div>
      </div>
    </div>
  );
}
