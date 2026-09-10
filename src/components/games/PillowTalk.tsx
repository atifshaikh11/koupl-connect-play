import { Heart, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GameFrame, GameSummary, PromptCard } from "@/components/koupl/GameShell";
import { TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import type { GameProps } from "./shared";

type State = { i: number; kept: number; skipped: number; done: boolean };
const initial: State = { i: 0, kept: 0, skipped: 0, done: false };

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
  const asker: 0 | 1 = (s.i % 2) as 0 | 1;
  const myTurn = mySlot === null || mySlot === asker;

  function advance(kept: boolean) {
    const done = s.i + 1 >= cards.length;
    patch({
      i: s.i + 1,
      kept: s.kept + (kept ? 1 : 0),
      skipped: s.skipped + (kept ? 0 : 1),
      done,
    });
  }

  if (s.done || s.i >= cards.length) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.kept, s.kept]}
          headline={`${s.kept} questions answered`}
          detail="No winners here. Just a bit more of each other than you had an hour ago."
          scored={false}
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
    <GameFrame game={game} onExit={onExit} step={s.i} total={cards.length}>
      <div className="mb-4">
        <TurnBanner
          player={players[asker]}
          action={myTurn ? "read it out and answer" : "is answering"}
        />
      </div>

      <PromptCard tone="berry" animateKey={s.i}>
        <span className="mb-3 text-3xl" aria-hidden>
          🌙
        </span>
        <p className="font-display text-xl font-bold leading-snug text-balance-tight">
          {cards[s.i]}
        </p>
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
