import { useMemo, useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const SIZE = 20;
const ROUNDS = 6;

function shuffled(): number[] {
  const nums = Array.from({ length: SIZE }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j]!, nums[i]!];
  }
  return nums;
}

/** Alternating speed hunt: find 1 → 5 in a scrambled grid, fewest wrong taps wins. */
export function NumberHunt({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [seed, setSeed] = useState(0);
  const [target, setTarget] = useState(1);
  const [misses, setMisses] = useState<[number, number]>([0, 0]);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [message, setMessage] = useState("Find 1, then 2, then 3, 4, 5.");
  const [between, setBetween] = useState(false);
  const [done, setDone] = useState(false);

  const grid = useMemo(() => shuffled(), [seed]);

  function tap(n: number) {
    if (between) return;
    if (n !== target) {
      fx.fail();
      setMisses((m) => [m[0] + (turn === 0 ? 1 : 0), m[1] + (turn === 1 ? 1 : 0)]);
      setMessage(`Not ${n} — still looking for ${target}`);
      return;
    }
    fx.tap();
    if (target >= 5) {
      fx.win();
      setScores((s) => [s[0] + (turn === 0 ? 1 : 0), s[1] + (turn === 1 ? 1 : 0)]);
      setMessage(`${players[turn]!.name} cleared the run`);
      setBetween(true);
      return;
    }
    setTarget(target + 1);
    setMessage(`Nice — now find ${target + 1}`);
  }

  function next() {
    if (round >= ROUNDS) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setTurn((t) => (t === 0 ? 1 : 0));
    setSeed((s) => s + 1);
    setTarget(1);
    setBetween(false);
    setMessage("Find 1, then 2, then 3, 4, 5.");
  }

  function rematch() {
    setRound(1);
    setTurn(0);
    setSeed((s) => s + 1);
    setTarget(1);
    setScores([0, 0]);
    setMisses([0, 0]);
    setBetween(false);
    setDone(false);
    setMessage("Find 1, then 2, then 3, 4, 5.");
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Find 1 to 5 in order in a scrambled grid — clean runs score."
          steps={[
            "On your turn, tap the numbers 1 through 5 in order.",
            "Wrong taps are counted against you.",
            "Six turns in total. Most clean runs wins, misses break ties.",
          ]}
          onStart={startPlaying}
          startLabel="Start hunting"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner =
      scores[0] === scores[1] ? (misses[0] <= misses[1] ? 0 : 1) : scores[0] > scores[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={scores}
          headline={`${players[winner]!.name} has the quicker eyes`}
          detail={`Clean runs ${scores[0]}–${scores[1]}.`}
          scored
          stats={[
            { label: `${players[0]!.name} misses`, value: `${misses[0]}` },
            { label: `${players[1]!.name} misses`, value: `${misses[1]}` },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} number hunt`, myScore: scores[0], theirScore: scores[1] })
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
      header={<ScoreBar players={players} scores={scores} activeSlot={turn} />}
    >
      <div className="mt-4 grid flex-1 place-content-center">
        <div className="grid grid-cols-4 gap-2">
          {grid.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => tap(n)}
              disabled={between || n < target}
              className={cn(
                "press flex h-[clamp(58px,18vw,74px)] w-[clamp(58px,18vw,74px)] items-center justify-center rounded-2xl bg-card font-display text-lg font-bold shadow-soft",
                n < target && "opacity-35",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <FeedbackBanner tone={between ? "success" : "primary"}>
          {players[turn]!.name} — {message}
        </FeedbackBanner>
        {between ? (
          <button
            type="button"
            onClick={next}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {round >= ROUNDS ? "See results" : "Pass the phone"}
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
