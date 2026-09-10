import { useState } from "react";
import { Hourglass } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AvatarBubble, ScoreBar, TurnBanner } from "@/components/koupl/ui";
import {
  ChoiceButton,
  GameFrame,
  GameSummary,
  PromptCard,
  StatPill,
} from "@/components/koupl/GameShell";
import { useSharedState } from "@/lib/koupl/useRoom";
import { cn } from "@/lib/utils";
import { REACTIONS, type GameProps } from "./shared";

export type DualRound = {
  key: string;
  prompt: ReactNode;
  options: { label: string; value: string }[];
};

type State = {
  i: number;
  a0: string | null;
  a1: string | null;
  score: number;
  streak: number;
  best: number;
  done: boolean;
  reaction: string | null;
};

const initial: State = {
  i: 0,
  a0: null,
  a1: null,
  score: 0,
  streak: 0,
  best: 0,
  done: false,
  reaction: null,
};

/**
 * Engine for every "both players secretly choose, then reveal" game.
 * Works identically on one shared device and across a live room.
 */
export function DualChoiceGame({
  game,
  players,
  mySlot,
  room,
  onFinish,
  onExit,
  rounds,
  tone = "primary",
  matchCopy,
  summaryNoun = "matches",
}: GameProps & {
  rounds: DualRound[];
  tone?: "primary" | "berry" | "sunny" | "mint" | "sky";
  matchCopy: { hit: string; miss: string };
  summaryNoun?: string;
}) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const [passed, setPassed] = useState(false);

  const round = rounds[Math.min(s.i, rounds.length - 1)]!;
  const bothIn = s.a0 !== null && s.a1 !== null;
  const matched = bothIn && s.a0 === s.a1;
  const shownScore = s.score + (matched ? 1 : 0);

  // Whose input is being collected right now.
  const pendingSlot: 0 | 1 | null = s.a0 === null ? 0 : s.a1 === null ? 1 : null;
  const localTurn = mySlot === null;
  const myAnswer = mySlot === null ? null : mySlot === 0 ? s.a0 : s.a1;
  const canAnswer = localTurn ? pendingSlot !== null : myAnswer === null;
  const answeringSlot: 0 | 1 = localTurn ? ((pendingSlot ?? 0) as 0 | 1) : (mySlot as 0 | 1);

  function choose(value: string) {
    const key = answeringSlot === 0 ? "a0" : "a1";
    patch({ [key]: value } as Partial<State>);
    setPassed(false);
  }

  function next() {
    const gained = matched ? 1 : 0;
    const streak = matched ? s.streak + 1 : 0;
    const best = Math.max(s.best, streak);
    if (s.i + 1 >= rounds.length) {
      patch({ score: s.score + gained, streak, best, done: true });
      return;
    }
    patch({
      i: s.i + 1,
      a0: null,
      a1: null,
      score: s.score + gained,
      streak,
      best,
      reaction: null,
    });
  }

  if (s.done) {
    const total = rounds.length;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.score, s.score]}
          headline={`${s.score} of ${total} ${summaryNoun}`}
          detail={
            s.score / total > 0.66
              ? "Alarmingly in sync. Slightly suspicious, honestly."
              : s.score / total > 0.33
                ? "A solid amount of overlap, plus enough friction to stay interesting."
                : "Opposites, confirmed. That's what makes it fun."
          }
          scored
          stats={[
            { label: "Best run", value: s.best },
            { label: "Rounds", value: total },
          ]}
          onRematch={() => {
            reset(initial);
            setPassed(false);
          }}
          onExit={() =>
            onFinish({
              summary: `${s.score}/${total} ${summaryNoun}`,
              myScore: s.score,
              theirScore: s.score,
            })
          }
        />
      </GameFrame>
    );
  }

  const waitingForPartner = !localTurn && myAnswer !== null && !bothIn;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={s.i}
      total={rounds.length}
      header={
        <ScoreBar
          players={players}
          scores={[shownScore, shownScore]}
          activeSlot={bothIn ? null : answeringSlot}
        />
      }
    >
      <PromptCard tone={tone} animateKey={round.key}>
        <p className="font-display text-xl font-bold leading-snug text-balance-tight">
          {round.prompt}
        </p>
      </PromptCard>

      <div className="mt-5 flex flex-1 flex-col justify-end gap-3">
        {bothIn ? (
          <div className="animate-rise space-y-4">
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-center text-sm font-bold",
                matched ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
              aria-live="polite"
            >
              {matched ? matchCopy.hit : matchCopy.miss}
            </div>
            <div className="flex gap-3">
              {([0, 1] as const).map((slot) => {
                const answer = slot === 0 ? s.a0 : s.a1;
                const label = round.options.find((o) => o.value === answer)?.label ?? "—";
                return (
                  <div key={slot} className="surface flex-1 p-3 text-center">
                    <AvatarBubble emoji={players[slot].avatar} size="sm" />
                    <p className="mt-1 truncate text-[11px] font-bold text-muted-foreground">
                      {players[slot].name}
                    </p>
                    <p className="font-display mt-1 text-sm font-bold">{label}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2">
              {REACTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-label={`React ${r}`}
                  onClick={() => patch({ reaction: r })}
                  className={cn(
                    "press h-11 w-11 rounded-full border border-border bg-card text-xl",
                    s.reaction === r && "border-primary bg-primary/10",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button size="lg" className="h-14 w-full rounded-2xl text-base" onClick={next}>
              {s.i + 1 >= rounds.length ? "See results" : "Next round"}
            </Button>
          </div>
        ) : waitingForPartner ? (
          <div className="surface animate-pop-in p-6 text-center" aria-live="polite">
            <span className="animate-float inline-block text-4xl" aria-hidden>
              ⏳
            </span>
            <p className="mt-2 text-sm font-bold">Locked in.</p>
            <p className="text-sm text-muted-foreground">
              Waiting for {players[mySlot === 0 ? 1 : 0].name} to choose…
            </p>
          </div>
        ) : localTurn && !passed && s.a0 !== null && s.a1 === null ? (
          <div className="surface animate-pop-in p-6 text-center">
            <AvatarBubble emoji={players[1].avatar} size="lg" />
            <p className="font-display mt-3 text-lg font-bold">Pass to {players[1].name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No peeking at the first answer.
            </p>
            <Button
              size="lg"
              className="mt-4 h-14 w-full rounded-2xl text-base"
              onClick={() => setPassed(true)}
            >
              I'm ready
            </Button>
          </div>
        ) : (
          <>
            <TurnBanner player={players[answeringSlot]} action="choose in secret" />
            <div className="grid gap-3">
              {round.options.map((o) => (
                <ChoiceButton key={o.value} onClick={() => choose(o.value)} disabled={!canAnswer}>
                  {o.label}
                </ChoiceButton>
              ))}
            </div>
          </>
        )}
      </div>
    </GameFrame>
  );
}
