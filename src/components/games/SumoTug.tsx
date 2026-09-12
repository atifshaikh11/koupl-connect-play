import { useState } from "react";

import { GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { clamp } from "./engine";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const TARGET = 3;
const PULL = 1.6;
const DRIFT = 0.35;

/** Tug of war: every tap drags the rope marker towards your side. */
export function SumoTug({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  // 50 = centre, 0 = player 1 (top) wins, 100 = player 0 (bottom) wins.
  const [pos, setPos] = useState(50);
  const [wins, setWins] = useState<[number, number]>([0, 0]);
  const [message, setMessage] = useState("Tap your side to pull.");
  const [between, setBetween] = useState(false);
  const [done, setDone] = useState(false);

  function pull(slot: 0 | 1) {
    if (between || done) return;
    fx.tap();
    const next = clamp(pos + (slot === 0 ? PULL : -PULL) + (Math.random() - 0.5) * DRIFT, 0, 100);
    setPos(next);
    if (next < 100 && next > 0) return;
    const winner: 0 | 1 = next >= 100 ? 0 : 1;
    fx.win();
    setBetween(true);
    setMessage(`${players[winner]!.name} pulls it over the line!`);
    const updated: [number, number] = [
      wins[0] + (winner === 0 ? 1 : 0),
      wins[1] + (winner === 1 ? 1 : 0),
    ];
    setWins(updated);
    if (updated[0] >= TARGET || updated[1] >= TARGET) setDone(true);
  }

  function nextRound() {
    setPos(50);
    setBetween(false);
    setMessage("Tap your side to pull.");
  }

  function rematch() {
    setWins([0, 0]);
    setDone(false);
    nextRound();
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`Drag the rope across your line. First to ${TARGET} pulls wins the match.`}
          steps={[
            "Phone flat, one player per half.",
            "Every tap on your half drags the marker towards you.",
            `Push it all the way over to win a pull. First to ${TARGET}.`,
          ]}
          onStart={startPlaying}
          startLabel="Take the rope"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner = wins[0] > wins[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={wins}
          headline={`${players[winner]!.name} is stronger today`}
          detail={`Pulls won ${wins[0]}–${wins[1]}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({
              summary: `${wins[0]}–${wins[1]} tug of war`,
              myScore: wins[0],
              theirScore: wins[1],
            })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={<ScoreBar players={players} scores={wins} activeSlot={null} />}
    >
      <div className="relative mt-3 flex flex-1 flex-col gap-3">
        {([1, 0] as const).map((slot) => (
          <button
            key={slot}
            type="button"
            aria-label={`${players[slot]!.name} pull`}
            onPointerDown={() => pull(slot)}
            disabled={between}
            className={cn(
              "press flex flex-1 touch-none select-none items-center justify-center rounded-[1.75rem] shadow-float",
              slot === 0 ? "bg-primary/12 text-primary" : "bg-sky/25 text-sky-foreground",
              slot === 1 && "rotate-180",
            )}
          >
            <span className="font-display text-2xl font-bold">Pull</span>
          </button>
        ))}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-1/2 h-2 -translate-y-1/2 rounded-full bg-night/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-night shadow-float transition-[top] duration-75"
          style={{ top: `${pos}%` }}
        />
      </div>

      <div className="mt-3 space-y-2">
        <p
          aria-live="polite"
          className="rounded-2xl bg-muted px-4 py-3 text-center text-sm font-bold text-muted-foreground"
        >
          {message}
        </p>
        {between ? (
          <button
            type="button"
            onClick={nextRound}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            Next pull
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
