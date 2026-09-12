import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvatarBubble, LoadingScreen, Wordmark } from "@/components/koupl/ui";
import { ChatDock, ChatPanel } from "@/components/koupl/RoomChat";
import { useLocalChat } from "@/lib/koupl/useRoomChat";
import { GameRenderer } from "@/components/games/GameRenderer";
import type { GameProps } from "@/components/games/shared";
import { gameById } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { clearSavedGame } from "@/lib/koupl/useRoom";
import type { GameResult, Player } from "@/lib/koupl/types";

export const Route = createFileRoute("/play/$gameId")({
  loader: ({ params }) => {
    const game = gameById(params.gameId);
    if (!game) throw notFound();
    return { game };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Game unavailable — Koupl" }, { name: "robots", content: "noindex" }],
      };
    }
    const { game } = loaderData;
    return {
      meta: [
        { title: `${game.title} — Koupl` },
        { name: "description", content: game.description },
        { property: "og:title", content: `${game.title} — Koupl` },
        { property: "og:description", content: game.description },
      ],
    };
  },
  component: Play,
});

/** One-phone (pass-and-play) session. Two-phone play lives in the Couple Room. */
function Play() {
  const { game } = Route.useLoaderData();
  const navigate = useNavigate();
  const app = useApp();

  const [started, setStarted] = useState(false);
  const [localSeed, setLocalSeed] = useState(() => Math.random());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(!!window.localStorage.getItem(`koupl.game.${game.id}`));
  }, [game.id]);

  const partnerName = app.partner?.name ?? "Player 2";
  const partnerAvatar = app.partner?.avatar ?? "🐼";
  const players: [Player, Player] = [
    app.me,
    { id: "them", name: partnerName, avatar: partnerAvatar },
  ];

  const chat = useLocalChat(game.id, players);

  function finish(result: GameResult) {
    void app.logActivity({
      game_id: game.id,
      mode: "local",
      summary: result.summary,
      my_score: result.myScore,
      their_score: result.theirScore,
    });
    clearSavedGame(game.id);
    app.buzz(20);
    void navigate({ to: "/activity" });
  }

  function exit() {
    void navigate({ to: "/games" });
  }

  if (!app.hydrated) return <LoadingScreen />;

  if (!started) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => void navigate({ to: "/games" })}
              className="press min-h-11 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold"
            >
              Back
            </button>
            <Wordmark className="text-lg" />
          </div>

          <div className="animate-rise text-center">
            <div
              className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-secondary text-4xl"
              aria-hidden
            >
              {game.emoji}
            </div>
            <h1 className="font-display mt-3 text-3xl font-bold">{game.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground text-balance-tight">
              {game.description}
            </p>
            <div className="mt-3 flex justify-center gap-2 text-xs font-bold text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1">{game.minutes}</span>
              <span className="rounded-full bg-muted px-3 py-1">{game.players}</span>
              <span className="rounded-full bg-muted px-3 py-1">
                {game.scored ? "Scored" : "No score"}
              </span>
            </div>
          </div>

          <div className="surface mt-6 flex items-center justify-center gap-6 p-5">
            <div className="text-center">
              <AvatarBubble emoji={players[0].avatar} size="lg" />
              <p className="mt-1 truncate text-xs font-bold">{players[0].name}</p>
            </div>
            <span className="font-display text-2xl text-muted-foreground">vs</span>
            <div className="text-center">
              <AvatarBubble emoji={players[1].avatar} size="lg" />
              <p className="mt-1 truncate text-xs font-bold">{players[1].name}</p>
            </div>
          </div>

          <div className="surface mt-4 flex items-center gap-3 p-4">
            <Smartphone className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              One phone, passed back and forth. For two phones, open your Couple Room.
            </p>
          </div>

          <Link
            to="/room"
            className="press surface mt-3 flex min-h-14 items-center gap-3 p-4 text-sm font-bold"
          >
            <Users className="h-5 w-5 text-primary" aria-hidden /> Play Together in Couple Room
          </Link>

          <div className="surface mt-4 flex flex-col p-4">
            <p className="mb-2 text-xs font-bold text-muted-foreground">
              Notes — leave each other a message
            </p>
            <ChatPanel chat={chat} myId={chat.localSender?.id ?? null} />
          </div>

          <div className="mt-auto space-y-2 pt-8">
            <Button
              size="lg"
              className="h-16 w-full rounded-3xl text-lg"
              onClick={() => setStarted(true)}
            >
              {saved ? "Resume game" : "Start game"}
            </Button>
            {saved ? (
              <Button
                variant="ghost"
                className="h-12 w-full rounded-2xl font-bold"
                onClick={() => {
                  clearSavedGame(game.id);
                  setSaved(false);
                  setLocalSeed(Math.random());
                  setStarted(true);
                }}
              >
                Start fresh instead
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const base: GameProps = {
    game,
    players,
    mySlot: null,
    room: null,
    onFinish: finish,
    onExit: exit,
  };

  return (
    <>
      <GameRenderer base={base} seed={localSeed} />
      <ChatDock chat={chat} myId={chat.localSender?.id ?? null} />
    </>
  );
}
