import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Clock, Play, Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvatarBubble, FavoriteButton, GameArtwork, SectionHeading } from "@/components/koupl/ui";
import { CATEGORY_LABEL, GAMES, HOW_TO, gameById } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { cn } from "@/lib/utils";
import type { GameDef } from "@/lib/koupl/types";

export const Route = createFileRoute("/game/$gameId")({
  loader: ({ params }) => {
    const game = gameById(params.gameId);
    if (!game) throw notFound();
    return { game };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Game not found — Koupl" }, { name: "robots", content: "noindex" }],
      };
    }
    const { game } = loaderData;
    const title = `${game.title} — Koupl`;
    return {
      meta: [
        { title },
        { name: "description", content: game.description },
        { property: "og:title", content: title },
        { property: "og:description", content: game.description },
      ],
    };
  },
  component: GameDetail,
});

const GLOW: Record<GameDef["accent"], string> = {
  primary: "bg-primary",
  berry: "bg-berry",
  sunny: "bg-sunny",
  mint: "bg-mint",
  sky: "bg-sky",
};

function GameDetail() {
  const { game } = Route.useLoaderData();
  const navigate = useNavigate();
  const app = useApp();
  const steps = HOW_TO[game.id] ?? [];
  const related = GAMES.filter((g) => g.id !== game.id && g.category === game.category).slice(0, 4);
  const partner = app.partner;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md pb-32">
        {/* Poster hero */}
        <div className="relative overflow-hidden rounded-b-[2.5rem] bg-night px-5 pb-8 pt-5 text-night-foreground shadow-float">
          <span
            aria-hidden
            className={cn(
              "absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl",
              GLOW[game.accent],
            )}
          />
          <span
            aria-hidden
            className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-primary opacity-20 blur-3xl"
          />

          <div className="relative flex items-center justify-between">
            <button
              type="button"
              onClick={() => void navigate({ to: "/games" })}
              aria-label="Go back"
              className="press flex h-11 w-11 items-center justify-center rounded-full bg-night-soft text-night-foreground"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-night-soft px-3 py-2 text-xs font-bold uppercase text-night-muted">
                {CATEGORY_LABEL[game.category]}
              </span>
              <FavoriteButton gameId={game.id} inverse />
            </div>
          </div>

          <div className="relative mt-6 flex flex-col items-center text-center">
            <GameArtwork game={game} className="animate-float h-24 w-24 bg-night-soft text-night-foreground" />
            <h1 className="font-display mt-4 text-3xl font-bold leading-tight text-balance-tight">
              {game.title}
            </h1>
            <p className="mt-1 text-sm text-night-muted">{game.tagline}</p>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: Clock, label: game.minutes },
              { icon: Users, label: game.players },
              { icon: Trophy, label: game.scored ? "Scored" : "Just talk" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/8 px-2 py-3"
              >
                <Icon className="h-4 w-4 text-night-muted" aria-hidden />
                <span className="text-center text-xs font-bold leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4">
          {/* Players */}
          <div className="surface mt-5 flex items-center justify-center gap-5 p-4">
            <div className="text-center">
              <AvatarBubble emoji={app.me.avatar} size="md" />
              <p className="mt-1 max-w-20 truncate text-xs font-bold">{app.me.name}</p>
            </div>
            <span className="font-display text-lg text-muted-foreground">vs</span>
            <div className="text-center">
              <AvatarBubble emoji={partner?.avatar ?? "🐼"} size="md" />
              <p className="mt-1 max-w-20 truncate text-xs font-bold">
                {partner?.name ?? "Player 2"}
              </p>
            </div>
          </div>

          <section className="mt-6">
            <SectionHeading title="What it is" />
            <p className="text-sm leading-relaxed text-muted-foreground">{game.description}</p>
          </section>

          {steps.length ? (
            <section className="mt-6">
              <SectionHeading title="How to play" />
              <ol className="grid gap-2">
                {steps.map((s, i) => (
                  <li key={s} className="surface flex items-start gap-3 p-3">
                    <span className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-sm leading-snug">{s}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {related.length ? (
            <section className="mt-6">
              <SectionHeading title="If you like this" />
              <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
                {related.map((g) => (
                  <Link
                    key={g.id}
                    to="/game/$gameId"
                    params={{ gameId: g.id }}
                    className="press surface flex w-40 shrink-0 snap-start flex-col gap-2 p-3"
                  >
                    <GameArtwork game={g} className="h-11 w-11" />
                    <span className="font-display truncate text-sm font-bold">{g.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{g.tagline}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Sticky play bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3">
          <Button
            size="lg"
            className="h-15 w-full rounded-3xl text-lg font-bold"
            onClick={() => void navigate({ to: "/room", search: { g: game.id } })}
          >
            <Users className="mr-1 h-5 w-5" aria-hidden /> Play Together
          </Button>
          <button
            type="button"
            onClick={() => void navigate({ to: "/play/$gameId", params: { gameId: game.id } })}
            className="press mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-bold"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden /> Play on one phone
          </button>
        </div>
      </div>
    </div>
  );
}
