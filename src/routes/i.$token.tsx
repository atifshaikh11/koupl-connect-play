import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { GameArtwork, Wordmark } from "@/components/koupl/ui";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/koupl/store";
import { gameById } from "@/lib/koupl/games";
import { COUPLE_ROOM_KEY, forgetInvite, rememberInvite } from "@/lib/koupl/coupleRoom";

export const Route = createFileRoute("/i/$token")({
  head: () => ({
    meta: [
      { title: "Your game invite — Koupl" },
      {
        name: "description",
        content: "Your partner invited you to play a Koupl game together. Tap to join the room.",
      },
      { property: "og:title", content: "Your game invite — Koupl" },
      {
        property: "og:description",
        content: "One tap joins your partner's Koupl game — no codes, no setup.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePage,
});

type Phase = "checking" | "ready" | "needs-auth" | "joining" | "error";

const MESSAGES: Record<string, { title: string; body: string }> = {
  expired: {
    title: "Invite expired",
    body: "This invitation was valid for 2 hours. Ask your partner to create a new invite.",
  },
  used: {
    title: "Invite already used",
    body: "This invitation has already been opened. Ask your partner for a fresh one.",
  },
  full: {
    title: "Room full",
    body: "This Couple Room already has 2 players.",
  },
  invalid: {
    title: "Invite unavailable",
    body: "This invitation link is no longer active.",
  },
};

function InvitePage() {
  const { token } = Route.useParams();
  const app = useApp();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [gameId, setGameId] = useState<string | null>(null);
  const [problem, setProblem] = useState<string>("invalid");
  const redeemed = useRef(false);

  const game = gameId ? gameById(gameId) : null;

  /* peek first so the page can show the game before anything else happens */
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase.rpc("peek_room_invite", { p_token: token });
      if (!active) return;
      const row = Array.isArray(data) ? data[0] : null;
      if (error || !row) {
        setProblem("invalid");
        setPhase("error");
        return;
      }
      setGameId(row.game_id ?? null);
      if (row.status !== "ok") {
        setProblem(row.status ?? "invalid");
        setPhase("error");
        return;
      }
      setPhase("ready");
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const redeem = useCallback(async () => {
    if (redeemed.current) return;
    redeemed.current = true;
    setPhase("joining");
    const { data, error } = await supabase.rpc("redeem_room_invite", { p_token: token });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row || row.status !== "ok" || !row.room_code) {
      redeemed.current = false;
      setProblem(row?.status && row.status !== "auth" ? row.status : "invalid");
      setPhase("error");
      return;
    }
    forgetInvite();
    window.localStorage.setItem(`koupl.room.${COUPLE_ROOM_KEY}`, row.room_code);
    void navigate({ to: "/room", replace: true });
  }, [navigate, token]);

  /* signed in → join straight away; signed out → keep the ticket through auth */
  useEffect(() => {
    if (phase !== "ready" || !app.hydrated || app.loading) return;
    if (!app.session) {
      rememberInvite(token);
      setPhase("needs-auth");
      return;
    }
    void redeem();
  }, [phase, app.hydrated, app.loading, app.session, redeem, token]);

  const failure = MESSAGES[problem] ?? MESSAGES['invalid']!;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-5 pb-16 pt-10 text-center">
        <Wordmark className="text-lg" />

        <div className="surface mt-8 p-6">
          {phase === "error" ? (
            <>
              <div className="text-4xl" aria-hidden>
                💔
              </div>
              <h1 className="font-display mt-3 text-2xl font-bold">{failure.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{failure.body}</p>
              <Button
                className="mt-5 h-13 w-full rounded-2xl"
                onClick={() => void navigate({ to: "/room" })}
              >
                Go to Couple Room
              </Button>
            </>
          ) : (
            <>
              <div className="text-4xl" aria-hidden>
                ❤️
              </div>
              <p className="mt-3 text-sm font-bold text-muted-foreground">
                Your partner invited you to play
              </p>

              {game ? (
                <div className="mt-4 flex flex-col items-center">
                  <GameArtwork game={game} className="h-20 w-20" />
                  <h1 className="font-display mt-3 text-2xl font-bold">{game.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{game.tagline}</p>
                </div>
              ) : (
                <div className="mt-6 flex justify-center">
                  <span className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary" />
                </div>
              )}

              {phase === "needs-auth" ? (
                <Button
                  size="lg"
                  className="mt-6 h-14 w-full rounded-2xl text-base"
                  onClick={() => void navigate({ to: "/auth" })}
                >
                  Continue to Koupl
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="mt-6 h-14 w-full rounded-2xl text-base"
                  disabled={phase !== "ready"}
                  onClick={() => void redeem()}
                >
                  {phase === "joining" ? "Joining…" : "Join Game"}
                </Button>
              )}

              <p className="mt-3 text-xs text-muted-foreground">
                This invite works once and stays valid for 2 hours.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
