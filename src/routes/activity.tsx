import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Cloud, CloudOff, RotateCw, Smartphone, Trash2 } from "lucide-react";
import { RecentResultsCard } from "@/components/koupl/RecentResultsCard";
import type { SyncStatus } from "@/lib/koupl/store";
import { Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip, EmptyState, Screen } from "@/components/koupl/ui";
import { gameById } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

function SyncBadge({ status, onRetry }: { status: SyncStatus | null; onRetry: () => void }) {
  if (!status) return null;
  if (status === "failed")
    return (
      <div className="mt-1 flex items-center gap-2 text-xs font-bold text-destructive">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden /> Upload failed
        <button
          type="button"
          onClick={onRetry}
          className="press inline-flex min-h-8 items-center gap-1 rounded-full border border-destructive/40 px-2.5 text-destructive"
        >
          <RotateCw className="h-3 w-3" aria-hidden /> Retry
        </button>
      </div>
    );
  const map = {
    pending: { icon: CloudOff, text: "Waiting to upload", cls: "text-muted-foreground" },
    synced: { icon: Cloud, text: "Synced", cls: "text-primary" },
    local: { icon: Smartphone, text: "Saved on this phone", cls: "text-muted-foreground" },
  } as const;
  const { icon: Icon, text, cls } = map[status];
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs font-bold ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {text}
    </p>
  );
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

      <Tabs defaultValue="history" className="px-4 pt-6">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl">
          <TabsTrigger value="history" className="rounded-xl">Game history</TabsTrigger>
          <TabsTrigger value="story" className="rounded-xl">Our Story</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-4">
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
                  <SyncBadge
                    status={app.syncStatus(a.id)}
                    onRetry={() => void app.retryUpload(a.id)}
                  />
                </div>
                <Chip tone={result === "You won" ? "success" : "muted"}>{result}</Chip>
              </li>
            );
          })}
        </ul>
      )}
        </TabsContent>
        <TabsContent value="story" className="mt-4 space-y-3">
          {totalGames === 0 ? (
            <EmptyState emoji="💞" title="Your story starts with a game" body="Real shared milestones will appear here as you play together." />
          ) : (
            <>
              <div className="surface flex gap-3 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary"><Heart className="h-6 w-6" /></span>
                <div><p className="font-display font-bold">First game together</p><p className="mt-1 text-sm text-muted-foreground">{gameById(app.activity[app.activity.length - 1]!.game_id)?.title ?? "A Koupl game"} · {timeAgo(app.activity[app.activity.length - 1]!.created_at)}</p></div>
              </div>
              {totalGames >= 10 ? (
                <div className="surface flex gap-3 p-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sunny/25 text-sunny-foreground"><Sparkles className="h-6 w-6" /></span>
                  <div><p className="font-display font-bold">10 games together</p><p className="mt-1 text-sm text-muted-foreground">A real milestone from your shared game history.</p></div>
                </div>
              ) : (
                <p className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">{10 - totalGames} more finished {10 - totalGames === 1 ? "game" : "games"} until your next shared milestone.</p>
              )}
              <p className="px-2 text-xs leading-relaxed text-muted-foreground">Only finished-game milestones are shown. Private answers and conversations are never added unless they are explicitly saved.</p>
            </>
          )}
        </TabsContent>
      </Tabs>
    </Screen>
  );
}
