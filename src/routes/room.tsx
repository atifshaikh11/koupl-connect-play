import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Gamepad2,
  Link2,
  Play,
  Search,
  Share2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarBubble, BottomNav, GameArtwork, LoadingScreen, Wordmark } from "@/components/koupl/ui";
import { ChatDock, ChatPanel } from "@/components/koupl/RoomChat";
import { GameRenderer } from "@/components/games/GameRenderer";
import type { GameProps } from "@/components/games/shared";
import { useRoomChat } from "@/lib/koupl/useRoomChat";
import { GAMES, ONLINE_LABEL, gameById } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { useRoom } from "@/lib/koupl/useRoom";
import {
  COUPLE_ROOM_KEY,
  PENDING_JOIN_KEY,
  coupleState,
  inviteLink,
  useScopedGameRoom,
} from "@/lib/koupl/coupleRoom";
import type { GameResult, Player, PlayerSlot } from "@/lib/koupl/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/room")({
  // `?g=<gameId>` lets a game page hand the room a pre-picked game.
  validateSearch: (search: Record<string, unknown>): { g?: string } =>
    typeof search['g'] === "string" ? { g: search['g'] as string } : {},
  head: () => ({
    meta: [
      { title: "Couple Room — Koupl" },
      {
        name: "description",
        content:
          "One shared Couple Room for the two of you. Invite once, then play any of the 28 Koupl games together without swapping codes.",
      },
      { property: "og:title", content: "Couple Room — Koupl" },
      {
        property: "og:description",
        content: "Invite your partner once and play every Koupl game in the same live room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoupleRoom,
});

function CoupleRoom() {
  const app = useApp();
  const navigate = useNavigate();
  const { g: wantedGame } = Route.useSearch();
  const userId = app.session?.user.id ?? null;
  const room = useRoom(COUPLE_ROOM_KEY, userId);
  const chat = useRoomChat(room.room?.id ?? null, {
    id: userId,
    name: app.me.name,
    avatar: app.me.avatar,
  });
  const scopedRoom = useScopedGameRoom(room);

  const [joinCode, setJoinCode] = useState("");
  const [q, setQ] = useState("");
  const [showGames, setShowGames] = useState(false);
  const [onlineNow, setOnlineNow] = useState(true);
  const starting = useRef(false);
  const [readyBusy, setReadyBusy] = useState(false);
  const preselected = useRef(false);
  const joinedPending = useRef(false);
  const shownError = useRef<string | null>(null);

  const state = coupleState(room.room);
  const amHost = !!room.room && room.room.host_id === userId;
  const partnerIn = !!room.room?.guest_id;
  const activeGame = state.activeGame ? gameById(state.activeGame) : null;
  const inGame = !!activeGame && !!state.started && partnerIn;
  const myReady = amHost ? !!state.hostReady : !!state.guestReady;
  const partnerReady = amHost ? !!state.guestReady : !!state.hostReady;
  const bothReady = !!state.hostReady && !!state.guestReady;
  const reconnecting = room.connection === "connecting" || room.connection === "reconnecting";

  /* connection indicator */
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

  /* an invite link handled before sign-in finishes joining here */
  useEffect(() => {
    if (!userId || room.room || joinedPending.current) return;
    const pending = window.localStorage.getItem(PENDING_JOIN_KEY);
    if (!pending) return;
    joinedPending.current = true;
    window.localStorage.removeItem(PENDING_JOIN_KEY);
    void room.join(pending).then((row) => {
      if (row) toast.success("You're in the Couple Room");
    });
  }, [userId, room]);

  /* surface room problems once */
  useEffect(() => {
    if (!room.error || shownError.current === room.error) return;
    shownError.current = room.error;
    toast.error(room.error);
  }, [room.error]);

  /* android/browser back while playing returns to the room, not out of it */
  const patchRef = useRef(room.patchState);
  patchRef.current = room.patchState;
  useEffect(() => {
    if (!inGame) return;
    // Only once per game session: `room` is a fresh object each render, so it
    // must stay out of the dependency list or every render pushes history.
    window.history.pushState({ koupl: "game" }, "");
    const onPop = () => {
      void patchRef.current({ started: false });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [inGame]);

  const partnerName = app.partner?.name ?? "Partner";
  const partnerAvatar = app.partner?.avatar ?? "🐼";

  const players: [Player, Player] = useMemo(() => {
    const me = app.me;
    const them: Player = { id: "partner", name: partnerName, avatar: partnerAvatar };
    return amHost ? [me, them] : [them, me];
  }, [app.me, amHost, partnerName, partnerAvatar]);

  const mySlot: PlayerSlot | null = useMemo(() => {
    if (!room.room || !activeGame) return null;
    // Shared-screen games are played on one device, so both halves stay live.
    if (activeGame.online === "local") return null;
    return amHost ? 0 : 1;
  }, [room.room, activeGame, amHost]);

  const list = useMemo(
    () =>
      GAMES.filter(
        (g) =>
          q.trim() === "" ||
          `${g.title} ${g.tagline} ${g.description}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [q],
  );

  function chooseGame(id: string) {
    void room.patchState({
      activeGame: id,
      started: false,
      seed: Math.random(),
      hostReady: false,
      guestReady: false,
      game: {},
    });
    setShowGames(false);
    app.buzz(10);
  }

  /* a game chosen on its detail page becomes the room's active game once */
  useEffect(() => {
    if (!wantedGame || preselected.current || !room.room) return;
    if (!gameById(wantedGame)) return;
    preselected.current = true;
    if (coupleState(room.room).activeGame === wantedGame) return;
    void patchRef.current({
      activeGame: wantedGame,
      started: false,
      seed: Math.random(),
      hostReady: false,
      guestReady: false,
      game: {},
    });
  }, [wantedGame, room.room]);

  function backToRoom() {
    void room.patchState({ started: false, game: {}, hostReady: false, guestReady: false });
  }

  function finish(result: GameResult) {
    void app.logActivity({
      game_id: activeGame?.id ?? "unknown",
      mode: "room",
      summary: result.summary,
      my_score: result.myScore,
      their_score: result.theirScore,
    });
    app.buzz(20);
    backToRoom();
    toast.success("Result saved — you're back in the Couple Room");
  }

  if (!app.hydrated || app.loading || room.restoring) return <LoadingScreen />;

  /* ---------------- signed-out ---------------- */
  if (!userId) {
    return (
      <Shell>
        <div className="surface mt-10 p-6 text-center">
          <h1 className="font-display text-2xl font-bold">Couple Room</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account to open one shared room with your partner and play every game
            together from two phones.
          </p>
          <Button className="mt-5 h-13 w-full rounded-2xl" onClick={() => void navigate({ to: "/auth" })}>
            Sign in to play together
          </Button>
          <Link to="/games" className="mt-3 inline-block text-sm font-bold text-muted-foreground">
            Play on one phone instead
          </Link>
        </div>
      </Shell>
    );
  }

  /* ---------------- no room yet ---------------- */
  if (!room.room) {
    return (
      <Shell>
        <div className="surface mt-8 p-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-secondary text-3xl" aria-hidden>
            💞
          </div>
          <h1 className="font-display mt-3 text-2xl font-bold">Couple Room</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One room, one invite. Stay connected while you switch between all 28 games.
          </p>
          <Button
            className="mt-5 h-14 w-full rounded-2xl text-base"
            disabled={room.busy}
            onClick={() => void room.create()}
          >
            Create Couple Room
          </Button>
          <div className="mt-5 text-left">
            <p className="mb-2 text-xs font-bold text-muted-foreground">Have an invite code?</p>
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
              <p className="mt-2 text-center text-xs font-bold text-destructive" role="alert">
                {room.error}
              </p>
            ) : null}
          </div>
        </div>
      </Shell>
    );
  }

  /* ---------------- playing ---------------- */
  if (inGame && activeGame) {
    const base: GameProps = {
      game: activeGame,
      players,
      mySlot,
      room: scopedRoom,
      onFinish: finish,
      onExit: backToRoom,
    };
    return (
      <>
        <GameRenderer base={base} seed={typeof state.seed === "number" ? state.seed : 0.42} />
        <button
          type="button"
          onClick={backToRoom}
          className="press fixed left-4 top-4 z-40 flex min-h-11 items-center gap-1 rounded-full border border-border bg-card/95 px-3 text-xs font-bold backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Room
        </button>
        <ChatDock chat={chat} myId={userId} />
      </>
    );
  }

  /* ---------------- hub ---------------- */
  const link = inviteLink(room.room.invite_token ?? room.room.code);
  const shareText = inviteMessage(link, room.room.code);

  return (
    <Shell>
      {/* header */}
      <div className="surface mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarBubble emoji={players[0].avatar} size="md" />
            <span className="font-display text-sm text-muted-foreground">&amp;</span>
            <AvatarBubble emoji={players[1].avatar} size="md" />
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground">Room code</p>
            <p className="font-display text-xl font-bold tracking-[0.2em]">{room.room.code}</p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm font-bold" aria-live="polite">
          <span
            className={cn("h-2.5 w-2.5 rounded-full", partnerIn ? "bg-success" : "bg-muted-foreground")}
            aria-hidden
          />
          {partnerIn
            ? room.partnerOnline
              ? `${partnerName} is online`
              : `${partnerName} joined · waiting for connection`
            : "Waiting for your partner to join…"}
          {onlineNow && !reconnecting ? (
            <Wifi className="ml-auto h-4 w-4 text-success" aria-hidden />
          ) : (
            <WifiOff className="ml-auto h-4 w-4 text-destructive" aria-hidden />
          )}
        </p>
        {reconnecting ? (
          <p className="mt-2 text-xs font-bold text-primary" role="status" aria-live="polite">
            Reconnecting… Your Couple Room will restore automatically.
          </p>
        ) : !onlineNow || room.connection === "offline" ? (
          <p className="mt-2 text-xs font-bold text-destructive" role="status">
            You’re offline. We’ll reconnect when your connection returns.
          </p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            className="h-12 rounded-2xl"
            onClick={() => {
              const text = `Join me in our Koupl Couple Room: ${link}`;
              if (navigator.share) void navigator.share({ title: "Koupl Couple Room", text, url: link });
              else {
                void navigator.clipboard?.writeText(link);
                toast.success("Invite link copied");
              }
            }}
          >
            <Share2 className="h-4 w-4" aria-hidden /> Invite Partner
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => {
              void navigator.clipboard?.writeText(link);
              toast.success("Invite link copied");
            }}
          >
            <Link2 className="h-4 w-4" aria-hidden /> Copy link
          </Button>
        </div>
        <button
          type="button"
          className="press mt-2 min-h-11 w-full rounded-2xl text-xs font-bold text-muted-foreground"
          onClick={() => {
            void navigator.clipboard?.writeText(room.room!.code);
            toast.success("Room code copied");
          }}
        >
          <Copy className="mr-1 inline h-3.5 w-3.5" aria-hidden /> Copy code instead
        </button>
      </div>

      {/* current game */}
      <div className="surface mt-4 p-4">
        <p className="text-xs font-bold text-muted-foreground">Current game</p>
        {activeGame ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <GameArtwork game={activeGame} className="h-12 w-12" />
              <div className="min-w-0">
                <p className="font-display truncate text-base font-bold">{activeGame.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ONLINE_LABEL[activeGame.online] ?? activeGame.tagline}
                </p>
              </div>
            </div>
            {partnerIn ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2" aria-live="polite">
                  <div className={cn("rounded-2xl border p-3", myReady ? "border-success bg-success/10" : "border-border bg-muted/40")}>
                    <p className="text-xs font-bold">You</p>
                    <p className={cn("mt-1 text-xs font-bold", myReady ? "text-success" : "text-muted-foreground")}>
                      {myReady ? "Ready ✓" : "Not ready"}
                    </p>
                  </div>
                  <div className={cn("rounded-2xl border p-3", partnerReady ? "border-success bg-success/10" : "border-border bg-muted/40")}>
                    <p className="truncate text-xs font-bold">Partner</p>
                    <p className={cn("mt-1 text-xs font-bold", partnerReady ? "text-success" : "text-muted-foreground")}>
                      {partnerReady ? "Ready ✓" : "Not ready"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={myReady ? "secondary" : "outline"}
                  className="mt-2 h-12 w-full rounded-2xl"
                  disabled={!onlineNow || reconnecting || !room.partnerOnline || readyBusy}
                  onClick={() => {
                    if (readyBusy) return;
                    setReadyBusy(true);
                    void room
                      .patchState(amHost ? { hostReady: !myReady } : { guestReady: !myReady })
                      .finally(() => setReadyBusy(false));
                  }}
                >
                  {myReady ? <Check className="h-5 w-5" aria-hidden /> : null}
                  {myReady ? "Set me not ready" : "Mark me ready"}
                </Button>
              </>
            ) : null}
            <Button
              size="lg"
              className="mt-2 h-14 w-full rounded-2xl text-base"
              disabled={!partnerIn || !room.partnerOnline || !bothReady || !amHost || !onlineNow || reconnecting}
              onClick={() => {
                if (starting.current) return;
                starting.current = true;
                void room.patchState({ started: true }).finally(() => {
                  starting.current = false;
                });
              }}
            >
              <Play className="h-5 w-5 fill-current" aria-hidden />
              {!partnerIn
                ? "Waiting for partner…"
                : !bothReady
                  ? "Both of you need to be ready"
                  : !amHost
                    ? "Waiting for host to start…"
                    : "Play Together"}
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No game picked yet. Choose one and your partner sees it instantly.
          </p>
        )}
        <Button
          variant="ghost"
          className="mt-2 h-12 w-full rounded-2xl font-bold"
          onClick={() => setShowGames((v) => !v)}
        >
          <Gamepad2 className="h-5 w-5" aria-hidden /> {showGames ? "Hide games" : "Games"}
        </Button>
      </div>

      {/* games grid */}
      {showGames ? (
        <div className="surface mt-4 p-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search 28 games"
              aria-label="Search games"
              className="h-12 rounded-2xl pl-11"
            />
          </div>
          <div className="mt-3 grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {list.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => chooseGame(g.id)}
                aria-pressed={state.activeGame === g.id}
                className={cn(
                  "press flex min-h-24 flex-col items-start gap-1 rounded-2xl border-2 bg-card p-3 text-left",
                  state.activeGame === g.id ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                <GameArtwork game={g} className="h-9 w-9" />
                <span className="font-display w-full truncate text-sm font-bold">{g.title}</span>
                <span className="w-full truncate text-xs text-muted-foreground">{g.tagline}</span>
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No games match that.</p>
          ) : null}
        </div>
      ) : null}

      {/* chat */}
      <div className="surface mt-4 flex flex-col p-4">
        <p className="mb-2 text-xs font-bold text-muted-foreground">Room chat</p>
        <ChatPanel chat={chat} myId={userId} />
      </div>

      <Button
        variant="ghost"
        className="mt-4 h-12 w-full rounded-2xl text-xs font-bold text-muted-foreground"
        onClick={() => {
          void room.leave();
          toast.success("You left the Couple Room");
        }}
      >
        Leave Couple Room
      </Button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="press min-h-11 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold"
          >
            Home
          </Link>
          <Wordmark className="text-lg" />
        </div>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
