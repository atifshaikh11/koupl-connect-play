import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Smartphone, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarBubble, LoadingScreen, Wordmark } from "@/components/koupl/ui";
import { DualChoiceGame, type DualRound } from "@/components/games/DualChoiceGame";
import { FourInARow } from "@/components/games/FourInARow";
import { BasketballRivalry } from "@/components/games/BasketballRivalry";
import { PillowTalk } from "@/components/games/PillowTalk";
import { TruthOrDare } from "@/components/games/TruthOrDare";
import { CoupleQuiz } from "@/components/games/CoupleQuiz";
import type { GameProps } from "@/components/games/shared";
import {
  COUPLE_QUIZ,
  DARES,
  NEVER_HAVE_I_EVER,
  PILLOW_TALK,
  THIS_OR_THAT,
  TRUTHS,
  WHOS_MORE_LIKELY,
  gameById,
  shuffle,
} from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { clearSavedGame, useRoom } from "@/lib/koupl/useRoom";
import type { GameResult, Player, PlayerSlot } from "@/lib/koupl/types";

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

const ROUNDS = 10;

function Play() {
  const { game } = Route.useLoaderData();
  const navigate = useNavigate();
  const app = useApp();
  const room = useRoom(game.id, app.session?.user.id ?? null);

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"local" | "online">("local");
  const [joinCode, setJoinCode] = useState("");
  const [seed, setSeed] = useState(() => Math.random());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(!!window.localStorage.getItem(`koupl.game.${game.id}`));
  }, [game.id]);

  const partnerName = app.partner?.name ?? "Player 2";
  const partnerAvatar = app.partner?.avatar ?? "🐼";

  const players: [Player, Player] = useMemo(() => {
    const me = app.me;
    const them: Player = { id: "them", name: partnerName, avatar: partnerAvatar };
    if (mode === "online" && room.room && room.room.host_id !== app.session?.user.id) {
      return [them, me];
    }
    return [me, them];
  }, [app.me, app.session?.user.id, mode, partnerName, partnerAvatar, room.room]);

  const mySlot: PlayerSlot | null = useMemo(() => {
    if (mode !== "online" || !room.room || !app.session) return null;
    return room.room.host_id === app.session.user.id ? 0 : 1;
  }, [mode, room.room, app.session]);

  function finish(result: GameResult) {
    void app.logActivity({
      game_id: game.id,
      mode: mode === "online" ? "room" : "local",
      summary: result.summary,
      my_score: result.myScore,
      their_score: result.theirScore,
    });
    clearSavedGame(game.id);
    app.buzz(20);
    void navigate({ to: "/activity" });
  }

  function exit() {
    if (mode === "online") void room.leave();
    void navigate({ to: "/games" });
  }

  if (!app.hydrated) return <LoadingScreen />;

  /* ---------------- lobby ---------------- */
  if (!started) {
    const waiting = mode === "online" && room.room && !room.room.guest_id;
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6">
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => void navigate({ to: "/games" })}
              className="press rounded-full border border-border bg-card px-4 py-2 text-sm font-bold"
            >
              Back
            </button>
            <Wordmark className="text-lg" />
          </div>

          <div className="animate-rise text-center">
            <span className="animate-float inline-block text-6xl" aria-hidden>
              {game.emoji}
            </span>
            <h1 className="font-display mt-3 text-3xl font-bold">{game.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground text-balance-tight">
              {game.description}
            </p>
            <div className="mt-3 flex justify-center gap-2 text-[11px] font-bold text-muted-foreground">
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

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={mode === "local"}
              onClick={() => setMode("local")}
              className={`press flex flex-col items-center gap-1 rounded-2xl border-2 bg-card p-4 ${
                mode === "local" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <Smartphone className="h-6 w-6" aria-hidden />
              <span className="text-sm font-bold">One phone</span>
              <span className="text-[11px] text-muted-foreground">Pass it back and forth</span>
            </button>
            <button
              type="button"
              aria-pressed={mode === "online"}
              onClick={() => {
                if (!app.session) {
                  toast.error("Create an account to play from two phones");
                  return;
                }
                setMode("online");
              }}
              className={`press flex flex-col items-center gap-1 rounded-2xl border-2 bg-card p-4 ${
                mode === "online" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <Users className="h-6 w-6" aria-hidden />
              <span className="text-sm font-bold">Two phones</span>
              <span className="text-[11px] text-muted-foreground">Live room</span>
            </button>
          </div>

          {mode === "online" ? (
            <div className="surface mt-4 p-4">
              {room.room ? (
                <div className="text-center">
                  <p className="text-xs font-bold text-muted-foreground">Room code</p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <p className="font-display text-3xl font-bold tracking-[0.25em]">
                      {room.room.code}
                    </p>
                    <button
                      type="button"
                      aria-label="Copy room code"
                      className="press flex h-10 w-10 items-center justify-center rounded-full border border-border"
                      onClick={() => {
                        void navigator.clipboard?.writeText(room.room!.code);
                        toast.success("Room code copied");
                      }}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                    {waiting ? "Waiting for your partner to join…" : "Both players are in."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  <Button
                    className="h-13 rounded-2xl text-base"
                    disabled={room.busy}
                    onClick={() => void room.create()}
                  >
                    Create a room
                  </Button>
                  <div className="flex gap-2">
                    <Input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Room code"
                      maxLength={6}
                      aria-label="Room code"
                      className="h-12 flex-1 rounded-2xl text-center font-bold tracking-[0.2em]"
                    />
                    <Button
                      variant="secondary"
                      className="h-12 rounded-2xl"
                      disabled={joinCode.length < 4 || room.busy}
                      onClick={() => void room.join(joinCode)}
                    >
                      Join
                    </Button>
                  </div>
                  {room.error ? (
                    <p className="text-center text-xs font-bold text-destructive" role="alert">
                      {room.error}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-auto pt-8">
            <Button
              size="lg"
              className="h-16 w-full rounded-3xl text-lg"
              disabled={mode === "online" && (!room.room || !room.room.guest_id)}
              onClick={() => setStarted(true)}
            >
              {mode === "online" && waiting ? "Waiting for partner…" : "Start game"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- game ---------------- */
  const base: GameProps = {
    game,
    players,
    mySlot,
    room: mode === "online" ? room : null,
    onFinish: finish,
    onExit: exit,
  };

  switch (game.id) {
    case "never-have-i-ever": {
      const rounds: DualRound[] = shuffle(NEVER_HAVE_I_EVER, seed)
        .slice(0, ROUNDS)
        .map((p, i) => ({
          key: `nhie-${i}`,
          prompt: p,
          options: [
            { label: "I have 🙋", value: "have" },
            { label: "Never 🙅", value: "never" },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="primary"
          matchCopy={{
            hit: "Same answer — point for the pair.",
            miss: "Different answers. Story time.",
          }}
        />
      );
    }
    case "whos-more-likely": {
      const rounds: DualRound[] = shuffle(WHOS_MORE_LIKELY, seed)
        .slice(0, ROUNDS)
        .map((p, i) => ({
          key: `wml-${i}`,
          prompt: p,
          options: [
            { label: `${players[0].avatar}  ${players[0].name}`, value: "p0" },
            { label: `${players[1].avatar}  ${players[1].name}`, value: "p1" },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="berry"
          matchCopy={{
            hit: "You both pointed the same way.",
            miss: "You each pointed at the other. Bold.",
          }}
          summaryNoun="agreements"
        />
      );
    }
    case "this-or-that": {
      const rounds: DualRound[] = shuffle(THIS_OR_THAT, seed)
        .slice(0, ROUNDS)
        .map((c, i) => ({
          key: `tot-${i}`,
          prompt: `${c.a} or ${c.b}?`,
          options: [
            { label: c.a, value: c.a },
            { label: c.b, value: c.b },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="mint"
          matchCopy={{ hit: "Same pick. Frighteningly aligned.", miss: "Split decision." }}
        />
      );
    }
    case "four-in-a-row":
      return <FourInARow {...base} />;
    case "basketball-rivalry":
      return <BasketballRivalry {...base} />;
    case "pillow-talk":
      return <PillowTalk {...base} cards={shuffle(PILLOW_TALK, seed).slice(0, 12)} />;
    case "truth-or-dare":
      return (
        <TruthOrDare
          {...base}
          truths={shuffle(TRUTHS, seed)}
          dares={shuffle(DARES, seed)}
        />
      );
    case "couple-quiz":
      return <CoupleQuiz {...base} questions={shuffle(COUPLE_QUIZ, seed).slice(0, 10)} />;
    default:
      return null;
  }
}
