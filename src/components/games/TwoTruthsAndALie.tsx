import { useState } from "react";

import { Input } from "@/components/ui/input";
import { FeedbackBanner, GameFrame, GameIntro, GameSummary, PromptCard } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const ROUNDS = 6;

type Phase = "write" | "pass" | "guess" | "reveal";

/** Write three statements, hide one lie, and see if your partner can spot it. */
export function TwoTruthsAndALie({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [round, setRound] = useState(1);
  const [teller, setTeller] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<Phase>("write");
  const [lines, setLines] = useState(["", "", ""]);
  const [lie, setLie] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [done, setDone] = useState(false);

  const guesser: 0 | 1 = teller === 0 ? 1 : 0;
  const ready = lines.every((l) => l.trim().length > 1) && lie !== null;

  function submitGuess(i: number) {
    if (guess !== null) return;
    setGuess(i);
    if (i === lie) {
      fx.win();
      setScores((s) => [s[0] + (guesser === 0 ? 1 : 0), s[1] + (guesser === 1 ? 1 : 0)]);
    } else {
      fx.fail();
      setScores((s) => [s[0] + (teller === 0 ? 1 : 0), s[1] + (teller === 1 ? 1 : 0)]);
    }
    setPhase("reveal");
  }

  function next() {
    if (round >= ROUNDS) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setTeller((t) => (t === 0 ? 1 : 0));
    setLines(["", "", ""]);
    setLie(null);
    setGuess(null);
    setPhase("write");
  }

  function rematch() {
    setRound(1);
    setTeller(0);
    setLines(["", "", ""]);
    setLie(null);
    setGuess(null);
    setScores([0, 0]);
    setPhase("write");
    setDone(false);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Two true statements, one convincing lie. Can they tell which is which?"
          steps={[
            "On your turn, write three statements about yourself and mark the lie.",
            "Hand the phone over — your partner picks the one they think is false.",
            "A correct catch scores the guesser; a good bluff scores you.",
          ]}
          onStart={startPlaying}
          startLabel="Start bluffing"
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
          headline={scores[0] === scores[1] ? "Perfectly matched bluffers" : `${players[winner]!.name} comes out ahead`}
          detail={`Points ${scores[0]}–${scores[1]}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} two truths`, myScore: scores[0], theirScore: scores[1] })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={round - 1}
      total={ROUNDS}
      header={<ScoreBar players={players} scores={scores} activeSlot={phase === "guess" ? guesser : teller} />}
    >
      {phase === "write" ? (
        <div className="mt-3 flex flex-1 flex-col gap-3">
          <p className="text-sm font-bold text-muted-foreground">
            {players[teller]!.name} — write three statements, then tap the lie.
          </p>
          {lines.map((line, i) => (
            <div key={i} className="space-y-1.5">
              <Input
                value={line}
                onChange={(e) => setLines((l) => l.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder={`Statement ${i + 1}`}
                maxLength={90}
                className="h-14 rounded-2xl text-base"
                aria-label={`Statement ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => setLie(i)}
                className={cn(
                  "press min-h-11 w-full rounded-xl px-3 text-xs font-bold",
                  lie === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {lie === i ? "This one is the lie" : "Mark as the lie"}
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={!ready}
            onClick={() => setPhase("pass")}
            className="press mt-auto h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-45"
          >
            Hide and pass over
          </button>
        </div>
      ) : null}

      {phase === "pass" ? (
        <div className="mt-3 flex flex-1 flex-col justify-center gap-4">
          <PromptCard tone="card">
            <span className="text-4xl" aria-hidden>
              🤫
            </span>
            <p className="font-display mt-3 text-xl font-bold">Pass to {players[guesser]!.name}</p>
            <p className="mt-2 text-sm text-muted-foreground">The statements stay hidden until they tap below.</p>
          </PromptCard>
          <button
            type="button"
            onClick={() => setPhase("guess")}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            I'm {players[guesser]!.name}
          </button>
        </div>
      ) : null}

      {phase === "guess" || phase === "reveal" ? (
        <div className="mt-3 flex flex-1 flex-col gap-3">
          <p className="text-sm font-bold text-muted-foreground">
            {phase === "guess"
              ? `${players[guesser]!.name} — which one is the lie?`
              : guess === lie
                ? `${players[guesser]!.name} caught the lie`
                : `${players[teller]!.name} got away with it`}
          </p>
          {lines.map((line, i) => (
            <button
              key={i}
              type="button"
              onClick={() => submitGuess(i)}
              disabled={phase === "reveal"}
              className={cn(
                "press min-h-16 w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-bold shadow-soft",
                phase === "guess" && "border-border bg-card",
                phase === "reveal" && i === lie && "border-primary bg-primary/12 text-primary",
                phase === "reveal" && i !== lie && "border-border bg-card opacity-60",
              )}
            >
              {line}
              {phase === "reveal" && i === lie ? (
                <span className="mt-1 block text-xs font-bold opacity-80">the lie</span>
              ) : null}
            </button>
          ))}
          {phase === "reveal" ? (
            <div className="mt-auto space-y-2">
              <FeedbackBanner tone={guess === lie ? "success" : "muted"}>
                {guess === lie ? "Point to the guesser" : "Point to the bluffer"}
              </FeedbackBanner>
              <button
                type="button"
                onClick={next}
                className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
              >
                {round >= ROUNDS ? "See results" : "Next round"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </GameFrame>
  );
}
