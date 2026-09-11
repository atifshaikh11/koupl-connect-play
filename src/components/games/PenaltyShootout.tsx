import { useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const SPOTS = ["Left", "Centre", "Right"] as const;
const ROUNDS = 5;
type Phase = "shoot" | "keep" | "reveal";

/** Pass-and-play penalties: shooter picks a corner, keeper dives after. */
export function PenaltyShootout({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [round, setRound] = useState(1);
  const [shooter, setShooter] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<Phase>("shoot");
  const [shot, setShot] = useState<number | null>(null);
  const [dive, setDive] = useState<number | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [saves, setSaves] = useState<[number, number]>([0, 0]);
  const [done, setDone] = useState(false);

  const keeper: 0 | 1 = shooter === 0 ? 1 : 0;
  const scored = shot !== null && dive !== null && shot !== dive;

  function pickShot(i: number) {
    setShot(i);
    fx.tap();
    setPhase("keep");
  }

  function pickDive(i: number) {
    setDive(i);
    const goal = shot !== i;
    if (goal) {
      fx.win();
      setScores((s) => [s[0] + (shooter === 0 ? 1 : 0), s[1] + (shooter === 1 ? 1 : 0)]);
    } else {
      fx.fail();
      setSaves((s) => [s[0] + (keeper === 0 ? 1 : 0), s[1] + (keeper === 1 ? 1 : 0)]);
    }
    setPhase("reveal");
  }

  function next() {
    const lastKick = round >= ROUNDS * 2;
    if (lastKick) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setShooter((s) => (s === 0 ? 1 : 0));
    setShot(null);
    setDive(null);
    setPhase("shoot");
  }

  function rematch() {
    setRound(1);
    setShooter(0);
    setScores([0, 0]);
    setSaves([0, 0]);
    setShot(null);
    setDive(null);
    setPhase("shoot");
    setDone(false);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`${ROUNDS} penalties each. Outguess the keeper to win the shootout.`}
          steps={[
            "The shooter secretly picks left, centre or right, then passes the phone.",
            "The keeper dives — same side saves it, different side is a goal.",
            "Swap after every kick. Most goals after ten kicks wins.",
          ]}
          onStart={startPlaying}
          startLabel="Step up"
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
          headline={scores[0] === scores[1] ? "Shootout tied" : `${players[winner]!.name} wins the shootout`}
          detail={`Goals ${scores[0]}–${scores[1]} after ${ROUNDS} kicks each.`}
          scored
          stats={[
            { label: `${players[0]!.name} saves`, value: `${saves[0]}` },
            { label: `${players[1]!.name} saves`, value: `${saves[1]}` },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} penalties`, myScore: scores[0], theirScore: scores[1] })
          }
        />
      </GameFrame>
    );
  }

  const active = phase === "keep" ? keeper : shooter;
  const prompt =
    phase === "shoot"
      ? `${players[shooter]!.name} — pick your corner`
      : phase === "keep"
        ? `${players[keeper]!.name} — dive!`
        : scored
          ? `Goal for ${players[shooter]!.name}`
          : `Saved by ${players[keeper]!.name}`;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={round - 1}
      total={ROUNDS * 2}
      header={<ScoreBar players={players} scores={scores} activeSlot={active} />}
    >
      <div className="mt-3 flex flex-1 flex-col">
        <div className="relative flex-1 overflow-hidden rounded-[1.75rem] bg-[hsl(150_38%_45%)] p-4 shadow-float">
          <div className="mx-auto h-28 w-full max-w-[300px] rounded-t-xl border-4 border-b-0 border-white/90" />
          <div className="mx-auto mt-3 grid max-w-[300px] grid-cols-3 gap-2">
            {SPOTS.map((label, i) => (
              <span
                key={label}
                aria-hidden
                className={cn(
                  "flex h-14 items-center justify-center rounded-2xl text-xs font-bold text-white/90 transition-colors",
                  phase === "reveal" && shot === i && "bg-white/90 text-night",
                  phase === "reveal" && dive === i && "ring-4 ring-night/60",
                  phase !== "reveal" && "bg-white/15",
                )}
              >
                {phase === "reveal" && shot === i ? "ball" : label}
              </span>
            ))}
          </div>
          <p className="mt-5 text-center text-sm font-bold text-white/95">
            {phase === "shoot" ? "Keeper: look away" : phase === "keep" ? "Shot is locked in" : ""}
          </p>
        </div>

        <div className="mt-3 space-y-2">
          <FeedbackBanner tone={phase === "reveal" ? (scored ? "success" : "muted") : "primary"}>
            {prompt}
          </FeedbackBanner>

          {phase === "reveal" ? (
            <button
              type="button"
              onClick={next}
              className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
            >
              {round >= ROUNDS * 2 ? "See results" : "Next kick"}
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {SPOTS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => (phase === "shoot" ? pickShot(i) : pickDive(i))}
                  className="press h-14 rounded-2xl bg-card text-sm font-bold shadow-soft"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </GameFrame>
  );
}
