import { Heart, Moon, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GameFrame,
  GameIntro,
  GameSummary,
  PromptCard,
  StatPill,
} from "@/components/koupl/GameShell";
import { TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { HOW_TO } from "@/lib/koupl/games";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro, type GameProps } from "./shared";

type State = {
  i: number;
  kept: number;
  skipped: number;
  /** Comma separated indexes of cards marked as keepers. */
  loved: string;
  done: boolean;
};
const initial: State = { i: 0, kept: 0, skipped: 0, loved: "", done: false };

/** The deck warms up gradually — labelled so the pace feels intentional. */
function chapter(i: number, total: number) {
  const p = i / total;
  if (p < 0.34) return { label: "Warm up", tone: "sky" as const };
  if (p < 0.7) return { label: "Going deeper", tone: "berry" as const };
  return { label: "Closest", tone: "primary" as const };
}

export function PillowTalk({
  game,
  players,
  mySlot,
  room,
  onFinish,
  onExit,
  cards,
}: GameProps & { cards: string[] }) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(s.i === 0 && s.kept === 0 && s.skipped === 0);
  const asker: 0 | 1 = (s.i % 2) as 0 | 1;
  const myTurn = mySlot === null || mySlot === asker;
  const loved = s.loved ? s.loved.split(",") : [];
  const isLoved = loved.includes(String(s.i));
  const { label, tone } = chapter(s.i, cards.length);

  function toggleLove() {
    fx.tap();
    const next = isLoved
      ? loved.filter((v) => v !== String(s.i))
      : [...loved, String(s.i)];
    patch({ loved: next.join(",") });
  }

  function advance(kept: boolean) {
    const done = s.i + 1 >= cards.length;
    fx.tap();
    patch({
      i: s.i + 1,
      kept: s.kept + (kept ? 1 : 0),
      skipped: s.skipped + (kept ? 0 : 1),
      done,
    });
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`${cards.length} questions that start light and get closer. No score, no timer — take turns and actually listen.`}
          steps={HOW_TO[game.id] ?? []}
          onStart={startPlaying}
          startLabel="Open the deck"
        />
      </GameFrame>
    );
  }

  if (s.done || s.i >= cards.length) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.kept, s.kept]}
          headline={`${s.kept} question${s.kept === 1 ? "" : "s"} answered`}
          detail="No winners here. Just a bit more of each other than you had an hour ago."
          scored={false}
          stats={[
            { label: "Answered", value: s.kept },
            { label: "Skipped", value: s.skipped },
            { label: "Kept", value: loved.length },
          ]}
          onRematch={() => reset(initial)}
          onExit={() =>
            onFinish({
              summary: `${s.kept} questions answered`,
              myScore: s.kept,
              theirScore: s.kept,
            })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame game={game} onExit={onExit} step={s.i} total={cards.length} stepNoun="Card">
      <div className="mb-3">
        <TurnBanner
          player={players[asker]}
          action={myTurn ? "read it out and answer" : "is answering"}
        />
      </div>

      <div className="mb-3 flex items-center justify-center gap-2">
        <StatPill label="Chapter" value={label} tone="primary" />
        <StatPill label="Answered" value={s.kept} tone="success" />
        <StatPill label="Skipped" value={s.skipped} />
      </div>

      <PromptCard tone={tone} animateKey={s.i} className="min-h-60 flex-1">
        <Moon className="mb-3 h-8 w-8" aria-hidden />
        <p className="font-display text-xl font-bold leading-snug text-balance-tight">
          {cards[s.i]}
        </p>
        <button
          type="button"
          aria-label={isLoved ? "Remove from keepers" : "Keep this question"}
          aria-pressed={isLoved}
          onClick={toggleLove}
          className={cn(
            "press mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-xs font-bold",
            isLoved ? "bg-current/20" : "bg-current/10",
          )}
        >
          <Heart className={cn("h-4 w-4", isLoved && "fill-current")} aria-hidden />
          {isLoved ? "Kept" : "Keep this one"}
        </button>
      </PromptCard>

      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button
          size="lg"
          className="h-14 rounded-2xl text-base"
          disabled={!myTurn}
          onClick={() => advance(true)}
        >
          <Heart className="mr-1 h-5 w-5" aria-hidden /> Answered — next
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="h-12 rounded-2xl text-base"
          disabled={!myTurn}
          onClick={() => advance(false)}
        >
          <SkipForward className="mr-1 h-5 w-5" aria-hidden /> Skip this one
        </Button>
      </div>
    </GameFrame>
  );
}
