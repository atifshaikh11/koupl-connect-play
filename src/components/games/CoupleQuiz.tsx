import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ChoiceButton,
  GameFrame,
  GameSummary,
  PromptCard,
  StatPill,
} from "@/components/koupl/GameShell";
import { AvatarBubble, ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/koupl/games";
import type { GameProps } from "./shared";

type State = {
  i: number;
  truth: string | null;
  guess: string | null;
  s0: number;
  s1: number;
  streak0: number;
  streak1: number;
  best0: number;
  best1: number;
  done: boolean;
};

const initial: State = {
  i: 0,
  truth: null,
  guess: null,
  s0: 0,
  s1: 0,
  streak0: 0,
  streak1: 0,
  best0: 0,
  best1: 0,
  done: false,
};

export function CoupleQuiz({
  game,
  players,
  mySlot,
  room,
  onFinish,
  onExit,
  questions,
}: GameProps & { questions: QuizQuestion[] }) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const [passed, setPassed] = useState(false);

  const total = questions.length;
  const q = questions[Math.min(s.i, total - 1)]!;
  const subject: 0 | 1 = (s.i % 2) as 0 | 1; // answers about themselves
  const guesser: 0 | 1 = subject === 0 ? 1 : 0;

  const phase: "truth" | "guess" | "reveal" =
    s.truth === null ? "truth" : s.guess === null ? "guess" : "reveal";
  const activeSlot = phase === "truth" ? subject : guesser;
  const myTurn = mySlot === null || mySlot === activeSlot;
  const correct = phase === "reveal" && s.truth === s.guess;
  const guesserStreak = guesser === 0 ? s.streak0 : s.streak1;

  function next() {
    const gained = s.truth === s.guess ? 1 : 0;
    const done = s.i + 1 >= total;
    const streak = gained ? guesserStreak + 1 : 0;
    patch({
      i: s.i + 1,
      truth: null,
      guess: null,
      s0: s.s0 + (guesser === 0 ? gained : 0),
      s1: s.s1 + (guesser === 1 ? gained : 0),
      streak0: guesser === 0 ? streak : s.streak0,
      streak1: guesser === 1 ? streak : s.streak1,
      best0: guesser === 0 ? Math.max(s.best0, streak) : s.best0,
      best1: guesser === 1 ? Math.max(s.best1, streak) : s.best1,
      done,
    });
    setPassed(false);
  }

  if (s.done) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={
            s.s0 === s.s1
              ? "Perfectly matched knowledge"
              : `${players[s.s0 > s.s1 ? 0 : 1].name} knows more`
          }
          detail={`${s.s0 + s.s1} correct guesses out of ${total}.`}
          scored
          stats={[{ label: "Best run", value: Math.max(s.best0, s.best1) }]}
          onRematch={() => {
            reset(initial);
            setPassed(false);
          }}
          onExit={() =>
            onFinish({
              summary: `${s.s0 + s.s1}/${total} correct guesses`,
              myScore: mySlot === 1 ? s.s1 : s.s0,
              theirScore: mySlot === 1 ? s.s0 : s.s1,
            })
          }
        />
      </GameFrame>
    );
  }

  const needsPass = mySlot === null && phase === "guess" && !passed;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={s.i}
      total={total}
      header={<ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={activeSlot} />}
    >
      <div className="mt-1">
        <TurnBanner
          player={players[activeSlot]}
          action={
            phase === "truth"
              ? "answer about yourself"
              : phase === "guess"
                ? `guess ${players[subject].name}'s answer`
                : "results"
          }
        />
      </div>

      {guesserStreak >= 2 && phase !== "reveal" ? (
        <div className="mt-2 flex justify-center">
          <StatPill label="Streak" value={guesserStreak} tone="success" />
        </div>
      ) : null}

      <div className="mt-4">
        <PromptCard tone="sky" animateKey={`${s.i}-${phase}`}>
          <p className="font-display text-xl font-bold leading-snug text-balance-tight">
            {phase === "truth"
              ? q.q
              : q.q.replace(/\bmy\b|\bme\b|\bI\b/gi, (m) =>
                  m.toLowerCase() === "i" ? "they" : m.toLowerCase() === "me" ? "them" : "their",
                )}
          </p>
        </PromptCard>
      </div>

      <div className="mt-5 flex flex-1 flex-col justify-end gap-3">
        {needsPass ? (
          <div className="surface animate-pop-in p-6 text-center">
            <AvatarBubble emoji={players[guesser].avatar} size="lg" />
            <p className="font-display mt-3 text-lg font-bold">Pass to {players[guesser].name}</p>
            <p className="mt-1 text-sm text-muted-foreground">The answer is hidden.</p>
            <Button
              size="lg"
              className="mt-4 h-14 w-full rounded-2xl text-base"
              onClick={() => setPassed(true)}
            >
              Ready to guess
            </Button>
          </div>
        ) : phase === "reveal" ? (
          <div className="animate-rise space-y-4">
            <div
              className={cn(
                "rounded-2xl px-4 py-3 text-center text-sm font-bold",
                correct ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
              )}
              aria-live="polite"
            >
              {correct
                ? `Correct — point to ${players[guesser].name}`
                : "Not quite."}
            </div>
            <div className="flex gap-3">
              <div className="surface flex-1 p-3 text-center">
                <AvatarBubble emoji={players[subject].avatar} size="sm" />
                <p className="mt-1 truncate text-[11px] font-bold text-muted-foreground">
                  Real answer
                </p>
                <p className="font-display mt-1 text-sm font-bold">{s.truth}</p>
              </div>
              <div
                className={cn(
                  "surface flex-1 p-3 text-center",
                  correct ? "ring-2 ring-success" : "ring-2 ring-transparent",
                )}
              >
                <AvatarBubble emoji={players[guesser].avatar} size="sm" />
                <p className="mt-1 truncate text-[11px] font-bold text-muted-foreground">
                  Guess
                </p>
                <p className="font-display mt-1 text-sm font-bold">{s.guess}</p>
              </div>
            </div>
            <Button size="lg" className="h-14 w-full rounded-2xl text-base" onClick={next}>
              {s.i + 1 >= total ? "See results" : "Next question"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {q.options.map((o) => (
              <ChoiceButton
                key={o}
                disabled={!myTurn}
                onClick={() => patch(phase === "truth" ? { truth: o } : { guess: o })}
              >
                {o}
              </ChoiceButton>
            ))}
            {!myTurn ? (
              <p className="text-center text-sm text-muted-foreground" aria-live="polite">
                Waiting for {players[activeSlot].name}…
              </p>
            ) : null}
          </div>
        )}
      </div>
    </GameFrame>
  );
}
