import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Heart, Link2, Play, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AvatarBubble,
  FeatureTile,
  GameArtwork,
  LoadingScreen,
  MiniTile,
  Screen,
  SectionHeading,
} from "@/components/koupl/ui";
import { CATEGORY_LABEL, DAILY_PROMPTS, GAMES, gameById } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Koupl — Games for Couples" },
      {
        name: "description",
        content:
          "Play original two-player games with your partner: confessions, quizzes, deep questions and quick arcade duels.",
      },
      { property: "og:title", content: "Koupl — Games for Couples" },
      {
        property: "og:description",
        content: "A playful games app built for two. Play on one phone or connect with a code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Home() {
  const navigate = useNavigate();
  const app = useApp();
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (app.hydrated && !app.loading && !app.onboarded) void navigate({ to: "/welcome" });
  }, [app.hydrated, app.loading, app.onboarded, navigate]);

  const dailyPrompt = useMemo(() => {
    const day = Math.floor(Date.now() / 86_400_000);
    return DAILY_PROMPTS[day % DAILY_PROMPTS.length]!;
  }, []);

  const lastPlayed = app.activity[0] ? gameById(app.activity[0].game_id) : null;
  const featured = GAMES.filter((g) => g.featured);
  const discover = GAMES.filter((g) => !g.featured);
  const favorites = GAMES.filter((g) => app.favorites.includes(g.id));
  const recent = app.activity
    .map((item) => gameById(item.game_id))
    .filter((game, index, list) => game && list.findIndex((candidate) => candidate?.id === game.id) === index)
    .slice(0, 4);
  const quick = GAMES.filter((g) => g.quick).slice(0, 4);
  const played = app.activity.length;

  if (!app.hydrated || app.loading) return <LoadingScreen />;
  if (!app.onboarded) return <LoadingScreen />;

  async function connect() {
    if (!app.session) {
      void navigate({ to: "/auth" });
      return;
    }
    setLinking(true);
    try {
      const res = await app.linkPartner(code);
      toast.success(`Connected with ${res?.name ?? "your partner"}`);
      setCode("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't find that code");
    } finally {
      setLinking(false);
    }
  }

  return (
    <Screen className="px-0 pt-0">
      {/* ---------- dark hero ---------- */}
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-night px-5 pb-8 pt-8 text-night-foreground shadow-float">
        <span
          aria-hidden
          className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary opacity-30 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-berry opacity-25 blur-3xl"
        />

        <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-night-muted">
              {greeting()}
            </p>
            <h1 className="font-display mt-1 truncate text-3xl font-bold">{app.me.name}</h1>
          </div>
          <Link
            to="/profile"
            aria-label="Open your profile"
            className="press shrink-0 rounded-full"
          >
            <AvatarBubble
              emoji={app.me.avatar}
              size="md"
              className="bg-night-soft ring-2 ring-primary"
            />
          </Link>
        </header>

        {/* couple strip */}
        <div className="relative mt-6 flex items-center gap-3 rounded-3xl bg-night-soft/80 p-3 backdrop-blur">
          <div className="flex shrink-0 -space-x-3">
            <AvatarBubble
              emoji={app.me.avatar}
              size="md"
              className="bg-night ring-2 ring-night-soft"
            />
            <AvatarBubble
              emoji={app.partner?.avatar ?? "👤"}
              size="md"
              className="bg-night ring-2 ring-night-soft"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-sm font-bold">
              {app.partner ? `You & ${app.partner.name}` : "No partner yet"}
            </p>
            <p className="truncate text-xs text-night-muted">
              {app.partner
                ? `${played} ${played === 1 ? "game" : "games"} played together`
                : "Add them to start a streak"}
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="press min-h-11 shrink-0 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
              >
                <Link2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                {app.partner ? "Manage" : "Connect"}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-display">Connect your partner</DialogTitle>
                <DialogDescription>Share your code with them, or enter theirs.</DialogDescription>
              </DialogHeader>
              <div className="surface flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-muted-foreground">Your code</p>
                  <p className="font-display text-2xl font-bold tracking-[0.2em]">
                    {app.inviteCode || "——————"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Copy your code"
                  className="press flex h-11 w-11 items-center justify-center rounded-full border border-border"
                  onClick={() => {
                    void navigator.clipboard?.writeText(app.inviteCode);
                    toast.success("Code copied");
                  }}
                >
                  <Copy className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter their code"
                maxLength={8}
                className="h-14 rounded-2xl text-center text-lg font-bold tracking-[0.2em]"
              />
              <Button
                className="h-14 rounded-2xl text-base"
                disabled={code.length < 4 || linking}
                onClick={() => void connect()}
              >
                {linking ? "Connecting…" : app.session ? "Connect" : "Sign in to connect"}
              </Button>
              {!app.session ? (
                <p className="text-center text-xs text-muted-foreground">
                  Codes link two accounts. On one phone, you're already good to go.
                </p>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>

        {/* continue / start */}
        <Link
          to="/play/$gameId"
          params={{ gameId: lastPlayed?.id ?? featured[0]!.id }}
          className="press relative mt-3 flex items-center gap-3 rounded-3xl bg-primary p-4 text-primary-foreground"
        >
          <GameArtwork game={lastPlayed ?? featured[0]!} className="h-12 w-12 bg-primary-foreground/15 text-primary-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold uppercase opacity-80">
              {lastPlayed ? "Continue" : "Start here"}
            </span>
            <span className="font-display block truncate text-lg font-bold">
              {lastPlayed?.title ?? featured[0]!.title}
            </span>
          </span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
            <Play className="h-5 w-5 fill-current" aria-hidden />
          </span>
        </Link>
      </section>

      <div className="px-4 pt-6">
        {favorites.length ? (
          <section aria-labelledby="favorites-h" className="mb-7">
            <SectionHeading
              title="Your favorites"
              action={<Heart className="h-4 w-4 fill-primary text-primary" aria-hidden />}
            />
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {favorites.map((g) => <FeatureTile key={g.id} game={g} />)}
            </div>
          </section>
        ) : null}

        {recent.length ? (
          <section aria-labelledby="recent-h" className="mb-7">
            <SectionHeading title="Recently played" />
            <div className="grid grid-cols-2 gap-3">
              {recent.map((g) => g ? <MiniTile key={g.id} game={g} /> : null)}
            </div>
          </section>
        ) : null}

        {/* featured rail */}
        <section aria-labelledby="featured-h" className="mb-7">
          <SectionHeading
            title="Tonight's picks"
            action={
              <Link to="/games" className="shrink-0 text-xs font-bold text-primary">
                See all
              </Link>
            }
          />
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
            {featured.map((g) => (
              <FeatureTile key={g.id} game={g} />
            ))}
          </div>
        </section>

        {/* daily prompt */}
        <section aria-labelledby="daily-h" className="mb-7">
          <h2 id="daily-h" className="sr-only">
            Prompt of the day
          </h2>
          <div className="rounded-3xl bg-berry p-5 text-berry-foreground shadow-float">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase opacity-85">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Prompt of the day
            </p>
            <p className="font-display mt-2 text-lg font-bold leading-snug text-balance-tight">
              {dailyPrompt}
            </p>
          </div>
        </section>

        <section aria-labelledby="quick-h" className="mb-7">
          <SectionHeading
            title="Quick start"
            action={<Zap className="h-4 w-4 text-sunny-foreground" aria-hidden />}
          />
          <div className="grid grid-cols-2 gap-3">
            {quick.map((g) => <MiniTile key={g.id} game={g} />)}
          </div>
        </section>

        {/* categories */}
        <section aria-labelledby="cats-h" className="mb-7">
          <h2 id="cats-h" className="sr-only">
            Categories
          </h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
              <Link
                key={key}
                to="/games"
                search={{ c: key }}
                className="press shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* discovery grid */}
        <section aria-labelledby="discover-h">
          <SectionHeading title="More to try" />
          <div className="grid grid-cols-2 gap-3">
            {discover.map((g) => (
              <MiniTile key={g.id} game={g} />
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
