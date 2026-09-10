import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip, EmptyState, Screen } from "@/components/koupl/ui";
import { gameById } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Koupl" },
      {
        name: "description",
        content: "Your history of finished Koupl games, with scores and results for each night.",
      },
      { property: "og:title", content: "Activity — Koupl" },
      {
        property: "og:description",
        content: "Every game you've finished together, with scores.",
      },
    ],
  }),
  component: Activity,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function Activity() {
  const app = useApp();

  const totalGames = app.activity.length;
  const wins = app.activity.filter((a) => a.my_score > a.their_score).length;

  return (
    <Screen className="px-0 pt-0">
      <header className="rounded-b-[2rem] bg-night px-4 pb-5 pt-6 text-night-foreground">
        <div className="flex items-start">
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold">Activity</h1>
            <p className="mt-1 text-sm text-night-muted">Everything you've finished.</p>
          </div>
          {totalGames ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear history"
              className="rounded-full text-night-muted hover:bg-white/10 hover:text-night-foreground"
              onClick={() => {
                void app.clearActivity();
                toast.success("History cleared");
              }}
            >
              <Trash2 className="h-5 w-5" aria-hidden />
            </Button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Games", value: totalGames },
            { label: "Your wins", value: wins },
            {
              label: "Draws",
              value: app.activity.filter((a) => a.my_score === a.their_score).length,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 p-3 text-center">
              <p className="font-display text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs font-bold text-night-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="px-4 pt-6">
      {app.activityLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : totalGames === 0 ? (
        <EmptyState
          emoji="🕹️"
          title="Nothing here yet"
          body="Finish a game and it'll show up here with the score."
          action={
            <Button asChild className="mt-2 h-12 rounded-2xl">
              <Link to="/games">Browse games</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {app.activity.map((a) => {
            const g = gameById(a.game_id);
            const result =
              a.my_score === a.their_score
                ? "Draw"
                : a.my_score > a.their_score
                  ? "You won"
                  : "They won";
            return (
              <li key={a.id} className="surface flex items-center gap-3 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-2xl">
                  {g?.emoji ?? "🎮"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display truncate text-sm font-bold">
                    {g?.title ?? a.game_id}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.summary || "Finished"} · {timeAgo(a.created_at)}
                  </p>
                </div>
                <Chip tone={result === "You won" ? "success" : "muted"}>{result}</Chip>
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </Screen>
  );
}
