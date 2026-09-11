import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FeedbackBanner,
  GameFrame,
  GameIntro,
  GameSummary,
  PromptCard,
  StatPill,
} from "@/components/koupl/GameShell";
import { AvatarBubble, ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { HOW_TO } from "@/lib/koupl/games";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/koupl/games";
import { useGameFx, useIntro, type GameProps } from "./shared";

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

const LETTERS = ["A", "B", "C", "D", "E"];

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
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(s.i === 0 && s.truth === null && s.guess === null);

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

  function answer(option: string) {
    if (phase === "truth") {
      fx.tap();
      patch({ truth: option });
      return;
    }
    if (option === s.truth) fx.win();
    else fx.fail();
    patch({ guess: option });
  }

  function next() {
    const gained = s.truth === s.guess ? 1 : 0;
    const done = s.i + 1 >= total;
    const streak = gained ? guesserStreak + 1 : 0;
    fx.tap();
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

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`${total} questions, roles swapping every round. One of you answers about yourself, the other tries to guess it.`}
          steps={HOW_TO[game.id] ?? []}
          onStart={startPlaying}
          startLabel="First question"
        />
      </GameFrame>
    );
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
      <div className="mt-2">
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

      <div className="mt-2 flex justify-center gap-2">
        <StatPill label="Phase" value={phase === "truth" ? "Answering" : phase === "guess" ? "Guessing" : "Reveal"} tone="primary" />
        {guesserStreak >= 2 && phase !== "reveal" ? (
          <StatPill label="Streak" value={guesserStreak} tone="success" />
        ) : null}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <PromptCard tone="sky" animateKey={`${s.i}-${phase}`} className="min-h-40 flex-1 py-7">
          <p className="font-display text-xl font-bold leading-snug text-balance-tight">
            {phase === "truth"
              ? q.q
              : q.q.replace(/\bmy\b|\bme\b|\bI\b/gi, (m) =>
                  m.toLowerCase() === "i" ? "they" : m.toLowerCase() === "me" ? "them" : "their",
                )}
          </p>
        </PromptCard>
      </div>

      <div className="mt-4 flex flex-col justify-end gap-3">
        {needsPass ? (
          <div className="surface animate-pop-in p-6 text-center">
            <AvatarBubble emoji={players[guesser].avatar} size="lg" />
            <p className="font-display mt-3 text-lg font-bold">Pass to {players[guesser].name}</p>
            <p className="mt-1 text-sm text-muted-foreground">The answer is hidden.</p>
            <Button
              size="lg"
              className="mt-4 h-14 w-full rounded-2xl text-base"
              onClick={() => {
                fx.tap();
                setPassed(true);
              }}
            >
              Ready to guess
            </Button>
          </div>
        ) : phase === "reveal" ? (
          <div className="animate-rise space-y-4">
            <FeedbackBanner tone={correct ? "success" : "muted"} animateKey={s.i}>
              {correct ? `Correct — point to ${players[guesser].name}` : "Not quite."}
            </FeedbackBanner>
            <div className="flex gap-3">
              <div className="surface animate-flip-in flex-1 p-3 text-center">
                <AvatarBubble emoji={players[subject].avatar} size="sm" />
                <p className="mt-1 truncate text-[11px] font-bold text-muted-foreground">
                  Real answer
                </p>
                <p className="font-display mt-1 text-sm font-bold">{s.truth}</p>
              </div>
              <div
                className={cn(
                  "surface animate-flip-in flex-1 p-3 text-center",
                  correct ? "ring-2 ring-success" : "ring-2 ring-transparent",
                )}
                style={{ animationDelay: "110ms" }}
              >
                <AvatarBubble emoji={players[guesser].avatar} size="sm" />
                <p className="mt-1 truncate text-[11px] font-bold text-muted-foreground">Guess</p>
                <p className="font-display mt-1 text-sm font-bold">{s.guess}</p>
              </div>
            </div>
            <Button size="lg" className="h-14 w-full rounded-2xl text-base" onClick={next}>
              {s.i + 1 >= total ? "See results" : "Next question"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {q.options.map((o, i) => (
              <button
                key={o}
                type="button"
                disabled={!myTurn}
                onClick={() => answer(o)}
                className="press surface flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left text-base font-bold disabled:opacity-55"
              >
                <span className="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/12 text-sm text-primary">
                  {LETTERS[i]}
                </span>
                <span className="min-w-0 flex-1">{o}</span>
              </button>
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
