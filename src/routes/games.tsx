import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { EmptyState, GameCard, Screen } from "@/components/koupl/ui";
import { CATEGORY_LABEL, GAMES } from "@/lib/koupl/games";
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

const FILTERS = ["all", "party", "deep", "arcade", "quiz"] as const;

function GamesLibrary() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");

  const list = GAMES.filter(
    (g) =>
      (filter === "all" || g.category === filter) &&
      (q.trim() === "" ||
        `${g.title} ${g.tagline} ${g.description}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <Screen>
      <h1 className="font-display text-2xl font-bold">Games</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Eight ways to spend an evening together.
      </p>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games"
          aria-label="Search games"
          className="h-13 rounded-2xl pl-11 text-base"
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
              "press shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
              filter === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f === "all" ? "All" : CATEGORY_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {list.length ? (
          list.map((g) => <GameCard key={g.id} game={g} />)
        ) : (
          <EmptyState
            emoji="🔍"
            title="No games match"
            body="Try a different word, or clear the filter to see everything."
          />
        )}
      </div>
    </Screen>
  );
}
