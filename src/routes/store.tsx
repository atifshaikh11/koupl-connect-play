import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Download,
  Flag,
  Gamepad2,
  Heart,
  Info,
  MoreVertical,
  Shield,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { GAMES } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { cn } from "@/lib/utils";

import shotHome from "@/assets/store/shot-home.png";
import shotGames from "@/assets/store/shot-games.png";
import shotDetail from "@/assets/store/shot-detail.png";
import shotPlay from "@/assets/store/shot-play.png";
import shotActivity from "@/assets/store/shot-activity.png";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Koupl — Games for Couples on the App Store page" },
      {
        name: "description",
        content:
          "See Koupl on its store page: screenshots, features, ratings and everything the couples game app includes.",
      },
      { property: "og:title", content: "Koupl — Games for Couples" },
      {
        property: "og:description",
        content:
          "Eight playful games for two — quizzes, dares, deep talk and arcade classics. Free, no ads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

const SHOTS = [
  { src: shotHome, alt: "Koupl home screen with tonight's picks and daily prompt" },
  { src: shotGames, alt: "Koupl games library with dark poster tiles" },
  { src: shotDetail, alt: "Truth or Dare game detail with how to play steps" },
  { src: shotPlay, alt: "This or That round in progress with score cards" },
  { src: shotActivity, alt: "Activity history with games, wins and draws" },
];

const FEATURES = [
  {
    icon: Gamepad2,
    title: "8 original games",
    body: "Never Have I Ever, Truth or Dare, Four in a Row, Basketball Rivalry and more — all built for two.",
  },
  {
    icon: Users,
    title: "One phone or two",
    body: "Pass-and-play on the sofa, or share a room code and play live on your own phones.",
  },
  {
    icon: Sparkles,
    title: "Fresh every day",
    body: "A daily conversation prompt plus hundreds of original questions across every mood.",
  },
  {
    icon: Shield,
    title: "Private by default",
    body: "Your answers stay between the two of you. Guest mode works with no account at all.",
  },
];

const RATING_BARS: Array<[stars: number, pct: number]> = [
  [5, 82],
  [4, 11],
  [3, 4],
  [2, 1],
  [1, 2],
];

const REVIEWS = [
  {
    name: "Maya R.",
    stars: 5,
    title: "Our Friday night ritual",
    body: "We started with This or That as a joke and ended up talking for two hours. The prompts are genuinely good.",
    date: "Aug 28, 2026",
  },
  {
    name: "Daniel K.",
    stars: 5,
    title: "Long-distance approved",
    body: "Room codes just work. We play Four in a Row and Basketball Rivalry over video call every week.",
    date: "Aug 14, 2026",
  },
  {
    name: "Priya S.",
    stars: 4,
    title: "Cute and easy",
    body: "Loved the demo mode — we were playing in ten seconds. Would love even more deep-talk questions.",
    date: "Jul 30, 2026",
  },
];

function AppIcon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-[28%] bg-gradient-to-br from-primary to-[oklch(0.62_0.19_20)] shadow-[0_12px_32px_-8px_color-mix(in_oklab,var(--primary)_55%,transparent)]",
        className,
      )}
    >
      <Heart className="h-1/2 w-1/2 fill-primary-foreground text-primary-foreground" />
    </div>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < value ? "fill-amber-400 text-amber-400" : "fill-night-muted/30 text-night-muted/30",
          )}
        />
      ))}
    </div>
  );
}

function StorePage() {
  const navigate = useNavigate();
  const { profile } = useApp();
  const started = Boolean(profile);

  return (
    <div className="min-h-dvh bg-night pb-16 text-night-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-night-soft bg-night/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => void navigate({ to: started ? "/" : "/welcome" })}
          className="grid h-10 w-10 place-items-center rounded-full bg-night-soft transition-transform active:scale-90"
          aria-label="Back to app"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-night-soft"
            aria-label="Share"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href).catch(() => {});
            }}
          >
            <Flag className="h-5 w-5 rotate-0" />
          </button>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-night-soft"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg">
        {/* App header */}
        <section className="flex gap-4 px-5 pt-5">
          <AppIcon className="h-20 w-20 shrink-0" />
          <div className="min-w-0 pt-1">
            <h1 className="font-display text-2xl leading-tight font-bold tracking-tight">
              Koupl — Games for Couples
            </h1>
            <p className="mt-0.5 text-sm font-medium text-primary">Koupl Studio</p>
            <p className="mt-0.5 text-xs text-night-muted">Free · No ads · No in-app purchases</p>
          </div>
        </section>

        {/* Stats strip */}
        <section className="mt-5 flex items-stretch justify-between gap-2 overflow-x-auto px-5 text-center">
          {[
            { top: "4.9 ★", bottom: "12K reviews" },
            { top: "10K+", bottom: "Downloads" },
            { top: "12+", bottom: "Rated for 12+" },
          ].map((s) => (
            <div
              key={s.bottom}
              className="flex min-w-[30%] flex-col items-center justify-center gap-0.5 rounded-2xl bg-night-soft px-4 py-3"
            >
              <span className="font-display text-base font-bold">{s.top}</span>
              <span className="text-[11px] text-night-muted">{s.bottom}</span>
            </div>
          ))}
        </section>

        {/* Install */}
        <div className="px-5 pt-5">
          <Link
            to={started ? "/" : "/welcome"}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-display text-base font-bold text-primary-foreground shadow-[0_10px_28px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-transform active:scale-[0.98]"
          >
            {started ? (
              <>
                <Gamepad2 className="h-5 w-5" /> Open — you already have it
              </>
            ) : (
              <>
                <Download className="h-5 w-5" /> Install — free
              </>
            )}
          </Link>
        </div>

        {/* Screenshots */}
        <section className="mt-7">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SHOTS.map((s) => (
              <img
                key={s.alt}
                src={s.src}
                alt={s.alt}
                loading="lazy"
                className="h-96 w-auto shrink-0 snap-center rounded-[1.75rem] border border-night-soft bg-night-soft object-cover shadow-lg"
              />
            ))}
          </div>
        </section>

        {/* Tags */}
        <div className="mt-5 flex flex-wrap gap-2 px-5">
          {["Couples", "Party", "Quiz", "Date night", "Two players", "Offline friendly"].map((t) => (
            <span key={t} className="rounded-full border border-night-soft px-3.5 py-1.5 text-xs font-medium text-night-muted">
              {t}
            </span>
          ))}
        </div>

        {/* About */}
        <section className="px-5 pt-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">About this game</h2>
            <Info className="h-4 w-4 text-night-muted" />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-night-muted">
            Koupl turns any evening into date night. Eight original games for two — confessions,
            dares, quizzes, deep-talk prompts and quick arcade battles — with turn-taking, scoring,
            reactions and instant rematches. Play on one phone or connect two with a short room
            code. No account needed to start.
          </p>
        </section>

        {/* Features */}
        <section className="mt-6 space-y-3 px-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-3xl bg-night-soft p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm font-bold">{f.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-night-muted">{f.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* What's new */}
        <section className="px-5 pt-7">
          <h2 className="font-display text-lg font-bold">What's new</h2>
          <p className="mt-1 text-xs text-night-muted">Updated Sep 2026</p>
          <ul className="mt-3 space-y-2 text-sm text-night-muted">
            {[
              "Resume mid-game — progress now saves automatically",
              "Bigger question banks for every prompt game",
              "New game detail pages with how-to-play guides",
              "Demo mode: try everything without an account",
            ].map((n) => (
              <li key={n} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {n}
              </li>
            ))}
          </ul>
        </section>

        {/* Ratings & reviews */}
        <section className="px-5 pt-8">
          <h2 className="font-display text-lg font-bold">Ratings and reviews</h2>
          <div className="mt-4 flex items-center gap-6">
            <div className="text-center">
              <p className="font-display text-5xl font-bold">4.9</p>
              <Stars value={5} className="mt-2 justify-center" />
              <p className="mt-1 text-xs text-night-muted">12,408 reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {RATING_BARS.map(([stars, pct]) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-3 text-right text-xs text-night-muted">{stars}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-night-soft">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {REVIEWS.map((r) => (
              <article key={r.name} className="rounded-3xl bg-night-soft p-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 font-display text-sm font-bold text-primary">
                    {r.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.name}</p>
                    <div className="flex items-center gap-2">
                      <Stars value={r.stars} />
                      <span className="text-[11px] text-night-muted">{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-sm font-semibold">{r.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-night-muted">{r.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* In this app */}
        <section className="pt-8">
          <h2 className="px-5 font-display text-lg font-bold">Games in this app</h2>
          <div className="mt-4 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GAMES.map((g) => (
              <Link
                key={g.id}
                to="/game/$gameId"
                params={{ gameId: g.id }}
                className="w-32 shrink-0 snap-start"
              >
                <div className="grid aspect-square w-full place-items-center rounded-3xl bg-night-soft text-5xl shadow-inner">
                  <span aria-hidden>{g.emoji}</span>
                </div>
                <p className="mt-2 truncate text-sm font-semibold">{g.title}</p>
                <p className="text-xs text-night-muted">{g.minutes}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <footer className="mt-10 px-5 text-center text-[11px] leading-relaxed text-night-muted">
          <p>Koupl Studio · Games · Casual</p>
          <p className="mt-1">
            Ratings and reviews shown are illustrative. All game content is original to Koupl.
          </p>
        </footer>
      </main>
    </div>
  );
}
