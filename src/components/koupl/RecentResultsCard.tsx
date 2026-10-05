import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { MessageCircleHeart, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { gameById } from "@/lib/koupl/games";
import { useApp } from "@/lib/koupl/store";
import { generateConversationPrompts } from "@/lib/koupl/prompts.functions";

export function RecentResultsCard() {
  const app = useApp();
  const getPrompts = useServerFn(generateConversationPrompts);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const recent = app.activity.filter((a) => a.mode === "local").slice(0, 5);
  if (recent.length === 0) return null;

  const partnerName = app.partner?.name ?? "";
  const rows = recent.map((a) => {
    const g = gameById(a.game_id);
    const result =
      a.my_score === a.their_score ? "Draw" : a.my_score > a.their_score ? "Win" : "Loss";
    return { title: g?.title ?? a.game_id, emoji: g?.emoji ?? "🎮", summary: a.summary, result };
  });

  async function share() {
    const text = [
      `💞 Our latest Koupl games${partnerName ? ` — ${app.me.name} & ${partnerName}` : ""}`,
      ...rows.map((r) => `${r.emoji} ${r.title}: ${r.summary || r.result}`),
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Our Koupl results", text });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
    await navigator.clipboard.writeText(text).catch(() => undefined);
    toast.success("Results copied");
  }

  async function ask() {
    setBusy(true);
    try {
      const res = await getPrompts({
        data: {
          me: app.me.name.slice(0, 40),
          partner: partnerName.slice(0, 40),
          games: rows.map((r) => ({
            title: r.title.slice(0, 60),
            summary: (r.summary || "").slice(0, 120),
            result: r.result,
          })),
        },
      });
      if (res.error) toast.error(res.error);
      setPrompts(res.prompts);
    } catch {
      toast.error("You need to be online to get prompts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface mb-4 p-4" aria-labelledby="recent-results-title">
      <h2 id="recent-results-title" className="font-display text-base font-bold">
        Recent One Phone games
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 rounded-2xl" onClick={() => void share()}>
          <Share2 className="h-4 w-4" aria-hidden /> Share results
        </Button>
        {app.session ? (
          <Button className="h-11 rounded-2xl" disabled={busy} onClick={() => void ask()}>
            <Sparkles className="h-4 w-4" aria-hidden /> {busy ? "Thinking…" : "Talk prompts"}
          </Button>
        ) : (
          <Button asChild variant="secondary" className="h-11 rounded-2xl">
            <Link to="/auth">Sign in for prompts</Link>
          </Button>
        )}
      </div>
      {prompts.length > 0 ? (
        <ul className="mt-3 grid gap-2" aria-live="polite">
          {prompts.map((p) => (
            <li key={p} className="flex gap-2 rounded-2xl bg-muted p-3 text-sm">
              <MessageCircleHeart className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
