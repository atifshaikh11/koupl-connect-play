import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { EmptyState, PosterTile, Screen, SectionHeading } from "@/components/koupl/ui";
import { CATEGORY_LABEL, GAMES } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/games")({
  validateSearch: (search: Record<string, unknown>): { c?: string | undefined } => ({
    c: typeof search['c'] === "string" ? search['c'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Games library — Koupl" },
      {
        name: "description",
        content:
          "Eight original two-player games for couples: Never Have I Ever, Couple Quiz, Four in a Row, Pillow Talk and more.",
      },
      { property: "og:title", content: "Games library — Koupl" },
      {
        property: "og:description",
        content: "Browse every Koupl game, from party decks to arcade duels.",
      },
    ],
  }),
  component: GamesLibrary,
});

const FILTERS = [
  "all",
  "favorites",
  "arcade",
  "reflex",
  "board",
  "sports",
  "puzzle",
  "competitive",
  "cooperative",
  "conversation",
  "quick",
] as const;

function GamesLibrary() {
  const { c } = Route.useSearch();
  const app = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(() =>
    FILTERS.includes(c as (typeof FILTERS)[number]) ? (c as (typeof FILTERS)[number]) : "all",
  );
  const [q, setQ] = useState("");

  useEffect(() => {
    setFilter(FILTERS.includes(c as (typeof FILTERS)[number]) ? (c as (typeof FILTERS)[number]) : "all");
  }, [c]);

  const list = GAMES.filter(
    (g) =>
      (filter === "all" || (filter === "favorites" ? app.favorites.includes(g.id) : g.category === filter)) &&
      (q.trim() === "" ||
        `${g.title} ${g.tagline} ${g.description}`.toLowerCase().includes(q.toLowerCase())),
  );

  const featured = list.filter((g) => g.featured);
  const rest = list.filter((g) => !g.featured);
  const battles = GAMES.filter((g) => g.battle);

  return (
    <Screen className="px-0 pt-0">
      <header className="rounded-b-[2rem] bg-night px-4 pb-5 pt-6 text-night-foreground">
        <h1 className="font-display text-3xl font-bold">Games</h1>
        <p className="mt-1 text-sm text-night-muted">Pick the mood. We’ll bring the game.</p>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-night-muted"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search games"
            aria-label="Search games"
            className="h-13 rounded-2xl border-white/10 bg-white/10 pl-11 text-base text-night-foreground placeholder:text-night-muted"
          />
        </div>

        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "press min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-night-muted",
              )}
            >
              {f === "all" ? "All" : f === "favorites" ? "Favorites" : CATEGORY_LABEL[f]}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-6">
        {battles.length && filter === "all" && q.trim() === "" ? (
          <section className="mb-6">
            <SectionHeading title="Quick Battle" action={<span className="text-xs font-bold text-muted-foreground">Under 90 seconds</span>} />
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {battles.map((g) => (
                <div key={g.id} className="w-40 shrink-0 snap-start">
                  <PosterTile game={g} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {list.length ? (
          <>
            {featured.length ? (
              <section className="mb-6">
                <SectionHeading title="Most played" />
                <div className="grid grid-cols-2 gap-3">
                  {featured.map((g) => (
                    <PosterTile key={g.id} game={g} />
                  ))}
                </div>
              </section>
            ) : null}

            {rest.length ? (
              <section>
                <SectionHeading title={featured.length ? "Everything else" : "All games"} />
                <div className="grid grid-cols-2 gap-3">
                  {rest.map((g) => (
                    <PosterTile key={g.id} game={g} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <EmptyState
            emoji="🔍"
            title={filter === "favorites" ? "No favorites yet" : "No games match"}
            body={filter === "favorites" ? "Tap the heart on a game to keep it close." : "Try a different word, or clear the filter to see everything."}
            action={
              <button
                type="button"
                className="press min-h-11 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground"
                onClick={() => {
                  setQ("");
                  setFilter("all");
                }}
              >
                Show all games
              </button>
            }
          />
        )}
      </div>
    </Screen>
  );
}
