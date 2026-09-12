import { useMemo, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { FeedbackBanner, GameFrame, GameIntro, GameSummary, PromptCard } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const PROMPTS = [
  "How much do you enjoy surprise plans?",
  "How tidy do you keep your side of the room?",
  "How much do you like spicy food?",
  "How easily do you fall asleep in a car?",
  "How much do you enjoy big group dinners?",
  "How likely are you to reply to a message within a minute?",
  "How much do you enjoy early mornings?",
  "How much do you like being the one who drives?",
  "How much do you enjoy horror films?",
  "How likely are you to re-watch a favourite series?",
  "How much do you enjoy planning holidays?",
  "How comfortable are you singing in front of people?",
];

const ROUNDS = 6;

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

type Phase = "answer" | "pass" | "guess" | "reveal";

/** Slider-based empathy game: rate yourself, then guess their rating. */
export function RateMyGuess({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const deck = useMemo(() => shuffle(PROMPTS).slice(0, ROUNDS), []);
  const [round, setRound] = useState(0);
  const [subject, setSubject] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<Phase>("answer");
  const [mine, setMine] = useState(50);
  const [theirGuess, setTheirGuess] = useState(50);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [closest, setClosest] = useState(100);
  const [done, setDone] = useState(false);

  const guesser: 0 | 1 = subject === 0 ? 1 : 0;
  const gap = Math.abs(mine - theirGuess);
  const points = gap <= 5 ? 3 : gap <= 15 ? 2 : gap <= 30 ? 1 : 0;

  function reveal() {
    const g = Math.abs(mine - theirGuess);
    const p = g <= 5 ? 3 : g <= 15 ? 2 : g <= 30 ? 1 : 0;
    if (p > 0) fx.win();
    else fx.fail();
    setClosest((c) => Math.min(c, g));
    setScores((s) => [s[0] + (guesser === 0 ? p : 0), s[1] + (guesser === 1 ? p : 0)]);
    setPhase("reveal");
  }

  function next() {
    if (round + 1 >= deck.length) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setSubject((s) => (s === 0 ? 1 : 0));
    setMine(50);
    setTheirGuess(50);
    setPhase("answer");
  }

  function rematch() {
    setRound(0);
    setSubject(0);
    setMine(50);
    setTheirGuess(50);
    setScores([0, 0]);
    setClosest(100);
    setPhase("answer");
    setDone(false);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Rate yourself on a slider, then see how closely your partner can guess it."
          steps={[
            "The subject sets their honest rating and hides it.",
            "Their partner slides to the number they think was chosen.",
            "Within 5 scores 3 points, within 15 scores 2, within 30 scores 1.",
          ]}
          onStart={startPlaying}
          startLabel="Start rating"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner = scores[0] >= scores[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={scores}
          headline={scores[0] === scores[1] ? "You read each other equally well" : `${players[winner]!.name} knows them better`}
          detail={`Points ${scores[0]}–${scores[1]}.`}
          scored
          stats={[{ label: "Closest guess", value: `${closest} apart` }]}
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} rate my guess`, myScore: scores[0], theirScore: scores[1] })
          }
        />
      </GameFrame>
    );
  }

  const prompt = deck[round] ?? PROMPTS[0]!;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={round}
      total={deck.length}
      header={<ScoreBar players={players} scores={scores} activeSlot={phase === "answer" ? subject : guesser} />}
    >
      <div className="mt-3 flex flex-1 flex-col gap-4">
        <PromptCard tone="sky" animateKey={round} className="flex-1">
          <p className="font-display text-xl font-bold leading-snug text-balance-tight">{prompt}</p>
          <p className="mt-3 text-sm opacity-80">
            {phase === "answer"
              ? `${players[subject]!.name} answers about themselves`
              : phase === "pass"
                ? `Pass to ${players[guesser]!.name}`
                : phase === "guess"
                  ? `${players[guesser]!.name} guesses their number`
                  : "Revealed"}
          </p>
        </PromptCard>

        {phase === "answer" || phase === "guess" ? (
          <div className="surface space-y-4 p-4">
            <p className="font-display text-center text-4xl font-bold tabular-nums">
              {phase === "answer" ? mine : theirGuess}
            </p>
            <Slider
              value={[phase === "answer" ? mine : theirGuess]}
              onValueChange={(v) => (phase === "answer" ? setMine(v[0]!) : setTheirGuess(v[0]!))}
              min={0}
              max={100}
              step={1}
              aria-label="Rating"
            />
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>Not at all</span>
              <span>Completely</span>
            </div>
          </div>
        ) : null}

        {phase === "reveal" ? (
          <div className="surface flex items-center justify-around p-4 text-center">
            <div>
              <p className="text-xs font-bold text-muted-foreground">{players[subject]!.name} said</p>
              <p className="font-display text-3xl font-bold tabular-nums">{mine}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">{players[guesser]!.name} guessed</p>
              <p className="font-display text-3xl font-bold tabular-nums">{theirGuess}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {phase === "reveal" ? (
          <FeedbackBanner tone={points > 0 ? "success" : "muted"}>
            {points > 0 ? `${gap} apart — ${points} point${points > 1 ? "s" : ""}` : `${gap} apart — no points`}
          </FeedbackBanner>
        ) : null}
        <button
          type="button"
          onClick={
            phase === "answer"
              ? () => setPhase("pass")
              : phase === "pass"
                ? () => setPhase("guess")
                : phase === "guess"
                  ? reveal
                  : next
          }
          className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
        >
          {phase === "answer"
            ? "Lock it in"
            : phase === "pass"
              ? `I'm ${players[guesser]!.name}`
              : phase === "guess"
                ? "Reveal"
                : round + 1 >= deck.length
                  ? "See results"
                  : "Next round"}
        </button>
      </div>
    </GameFrame>
  );
}
