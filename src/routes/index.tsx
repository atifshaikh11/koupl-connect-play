import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Link2, Sparkles } from "lucide-react";
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
  LoadingScreen,
  MiniTile,
  Screen,
  SectionHeading,
} from "@/components/koupl/ui";
import { DAILY_PROMPTS, GAMES, gameById } from "@/lib/koupl/games";
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
    <Screen>
      <header className="mb-5 flex items-center gap-3">
        <AvatarBubble emoji={app.me.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-muted-foreground">{greeting()},</p>
          <p className="font-display truncate text-xl font-bold">{app.me.name}</p>
        </div>
        <Wordmark className="text-lg" />
      </header>

      {/* Partner connection */}
      <section aria-labelledby="partner-h" className="surface mb-5 p-4">
        <h2 id="partner-h" className="sr-only">
          Partner connection
        </h2>
        {app.partner ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <AvatarBubble emoji={app.me.avatar} size="md" className="ring-2 ring-card" />
              <AvatarBubble emoji={app.partner.avatar} size="md" className="ring-2 ring-card" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-base font-bold">
                You &amp; {app.partner.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {app.session ? "Connected account" : "Playing on this device"}
              </p>
            </div>
            <Chip tone="success">Ready</Chip>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
              👤
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold">No partner yet</p>
              <p className="text-xs text-muted-foreground">
                Connect with a code, or add them in your profile.
              </p>
            </div>
          </div>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="mt-3 h-12 w-full rounded-2xl font-bold">
              <Link2 className="mr-1 h-4 w-4" aria-hidden />
              {app.partner ? "Manage connection" : "Connect partner"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">Connect your partner</DialogTitle>
              <DialogDescription>
                Share your code with them, or enter theirs.
              </DialogDescription>
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
      </section>

      {/* Continue */}
      {lastPlayed ? (
        <section aria-labelledby="continue-h" className="mb-6">
          <h2 id="continue-h" className="font-display mb-2 text-sm font-bold">
            Pick up where you left off
          </h2>
          <Link
            to="/play/$gameId"
            params={{ gameId: lastPlayed.id }}
            className="press flex items-center gap-4 rounded-3xl bg-primary p-4 text-primary-foreground shadow-float"
          >
            <span className="text-4xl" aria-hidden>
              {lastPlayed.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display block truncate text-lg font-bold">
                {lastPlayed.title}
              </span>
              <span className="block truncate text-xs opacity-85">
                Last time: {app.activity[0]!.summary || "no score"}
              </span>
            </span>
            <span className="rounded-full bg-primary-foreground/20 px-3 py-1.5 text-xs font-bold">
              Play
            </span>
          </Link>
        </section>
      ) : null}

      {/* Featured */}
      <section aria-labelledby="featured-h" className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 id="featured-h" className="font-display text-sm font-bold">
            Tonight's picks
          </h2>
          <Link to="/games" className="text-xs font-bold text-primary">
            See all
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {featured.map((g) => (
            <GameCard key={g.id} game={g} compact />
          ))}
        </div>
      </section>

      {/* Daily prompt */}
      <section aria-labelledby="daily-h" className="mb-6">
        <h2 id="daily-h" className="sr-only">
          Daily prompt
        </h2>
        <div className="rounded-3xl bg-berry p-5 text-berry-foreground shadow-float">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest opacity-85">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Prompt of the day
          </p>
          <p className="font-display mt-2 text-lg font-bold leading-snug text-balance-tight">
            {dailyPrompt}
          </p>
        </div>
      </section>

      {/* Discover */}
      <section aria-labelledby="discover-h">
        <h2 id="discover-h" className="font-display mb-2 text-sm font-bold">
          Discover more
        </h2>
        <div className="grid gap-3">
          {discover.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>
    </Screen>
  );
}
