import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Share2, Smartphone, Users, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarBubble, LoadingScreen, Wordmark } from "@/components/koupl/ui";
import { ChatDock, ChatPanel } from "@/components/koupl/RoomChat";
import { useLocalChat, useRoomChat } from "@/lib/koupl/useRoomChat";
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
  const roomChat = useRoomChat(room.room?.id ?? null, {
    id: app.session?.user.id ?? null,
    name: app.me.name,
    avatar: app.me.avatar,
  });

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"local" | "online">("local");
  const [joinCode, setJoinCode] = useState("");
  const [seed, setSeed] = useState(() => Math.random());
  const [saved, setSaved] = useState(false);
  const [onlineNow, setOnlineNow] = useState(true);

  useEffect(() => {
    setSaved(!!window.localStorage.getItem(`koupl.game.${game.id}`));
  }, [game.id]);

  useEffect(() => {
    const update = () => setOnlineNow(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const lobbyState = (room.room?.state ?? {}) as {
    hostReady?: boolean;
    guestReady?: boolean;
    started?: boolean;
  };
  const amHost = room.room?.host_id === app.session?.user.id;
  const myReady = amHost ? !!lobbyState.hostReady : !!lobbyState.guestReady;
  const bothReady = !!lobbyState.hostReady && !!lobbyState.guestReady;

  useEffect(() => {
    if (mode === "online" && lobbyState.started) setStarted(true);
  }, [lobbyState.started, mode]);

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

  const localChat = useLocalChat(game.id, players);
  const online = mode === "online" && !!room.room;
  const chat = online ? roomChat : localChat;
  const chatMyId = online ? (app.session?.user.id ?? null) : (localChat.localSender?.id ?? null);

  function finish(result: GameResult) {
    void app.logActivity({
      game_id: game.id,
      mode: mode === "online" ? "room" : "local",
      summary: result.summary,
      my_score: result.myScore,
      their_score: result.theirScore,
    });
    clearSavedGame(game.id);
    if (mode === "online") void room.leave();
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
              className="press min-h-11 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold"
            >
              Back
            </button>
            <Wordmark className="text-lg" />
          </div>

          <div className="animate-rise text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-secondary text-4xl" aria-hidden>{game.emoji}</div>
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

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={mode === "local"}
              onClick={() => setMode("local")}
               className={`press flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card p-4 ${
                mode === "local" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <Smartphone className="h-6 w-6" aria-hidden />
              <span className="text-sm font-bold">One phone</span>
              <span className="text-xs text-muted-foreground">Pass it back and forth</span>
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
               className={`press flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-card p-4 ${
                mode === "online" ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <Users className="h-6 w-6" aria-hidden />
              <span className="text-sm font-bold">Two phones</span>
              <span className="text-xs text-muted-foreground">Live room</span>
            </button>
          </div>

          {mode === "online" ? (
            <div className="surface mt-4 p-4">
              <div className="mb-3 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground" aria-live="polite">
                {onlineNow ? <Wifi className="h-4 w-4 text-success" aria-hidden /> : <WifiOff className="h-4 w-4 text-destructive" aria-hidden />}
                {onlineNow ? "Connected" : "You’re offline — reconnect to continue"}
              </div>
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
                      className="press flex h-11 w-11 items-center justify-center rounded-full border border-border"
                      onClick={() => {
                        void navigator.clipboard?.writeText(room.room!.code);
                        toast.success("Room code copied");
                      }}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-2 min-h-11 rounded-2xl"
                    onClick={() => {
                      const text = `Join my ${game.title} room on Koupl with code ${room.room?.code ?? ""}`;
                      if (navigator.share) void navigator.share({ title: "Join my Koupl room", text });
                      else {
                        void navigator.clipboard?.writeText(text);
                        toast.success("Invite copied");
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" aria-hidden /> Share invite
                  </Button>
                  <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                    {waiting ? "Waiting for your partner to join…" : "Both players are in."}
                  </p>
                  {!waiting ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
                      <div className="rounded-2xl bg-muted p-3">
                        <span className={lobbyState.hostReady ? "text-success" : "text-muted-foreground"}>{lobbyState.hostReady ? "Ready" : "Not ready"}</span>
                      </div>
                      <div className="rounded-2xl bg-muted p-3">
                        <span className={lobbyState.guestReady ? "text-success" : "text-muted-foreground"}>{lobbyState.guestReady ? "Ready" : "Not ready"}</span>
                      </div>
                    </div>
                  ) : null}
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

          {mode === "local" || room.room ? (
            <div className="surface mt-4 flex flex-col p-4">
              <p className="mb-2 text-xs font-bold text-muted-foreground">
                {online ? "Chat — talk before you start" : "Notes — leave each other a message"}
              </p>
              <ChatPanel chat={chat} myId={chatMyId} />
            </div>
          ) : null}


          <div className="mt-auto space-y-2 pt-8">
            {mode === "online" && room.room?.guest_id ? (
              <Button
                variant={myReady ? "secondary" : "outline"}
                className="h-12 w-full rounded-2xl"
                onClick={() => void room.patchState(amHost ? { hostReady: !myReady } : { guestReady: !myReady })}
              >
                {myReady ? <Check className="h-5 w-5" aria-hidden /> : null}
                {myReady ? "You’re ready" : "Mark me ready"}
              </Button>
            ) : null}
            <Button
              size="lg"
              className="h-16 w-full rounded-3xl text-lg"
              disabled={mode === "online" && (!room.room || !room.room.guest_id || !bothReady || !amHost || !onlineNow)}
              onClick={() => {
                if (mode === "online") void room.patchState({ started: true });
                setStarted(true);
              }}
            >
              {mode === "online" && waiting
                ? "Waiting for partner…"
                : mode === "online" && !bothReady
                  ? "Both players need to be ready"
                  : mode === "online" && !amHost
                    ? "Waiting for host to start…"
                : saved && mode === "local"
                  ? "Resume game"
                  : "Start game"}
            </Button>
            {saved && mode === "local" ? (
              <Button
                variant="ghost"
                className="h-12 w-full rounded-2xl font-bold"
                onClick={() => {
                  clearSavedGame(game.id);
                  setSaved(false);
                  setSeed(Math.random());
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

  /* ---------------- game ---------------- */
  const base: GameProps = {
    game,
    players,
    mySlot,
    room: mode === "online" ? room : null,
    onFinish: finish,
    onExit: exit,
  };

  const gameScreen = ((): ReactNode => {
    switch (game.id) {
    case "never-have-i-ever": {
      const rounds: DualRound[] = shuffle(NEVER_HAVE_I_EVER, seed)
        .slice(0, ROUNDS)
        .map((p, i) => ({
          key: `nhie-${i}`,
          prompt: p,
          options: [
            { label: "I have", value: "have" },
            { label: "Never", value: "never" },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="primary"
          layout="confess"
          objective="Ten confessions. Answer honestly at the same time — every matching answer scores a point for the two of you."
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
            { label: players[0].name, value: "p0" },
            { label: players[1].name, value: "p1" },
          ],
        }));
      return (
        <DualChoiceGame
          {...base}
          rounds={rounds}
          tone="berry"
          layout="point"
          objective="Ten rounds of finger-pointing. Point at the same person and you both score."
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
          layout="split"
          objective="Ten split-second choices. Pick your side in secret, reveal together, and see how aligned your tastes really are."
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
  })();

  return (
    <>
      {gameScreen}
      <ChatDock chat={chat} myId={chatMyId} />
    </>
  );
}
