import { useEffect, useRef, useState } from "react";

import { GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const ROUNDS = 3;
const SECONDS = 8;

/** Simultaneous tap race — each half counts its own taps against the clock. */
export function TapRaceDash({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [round, setRound] = useState(1);
  const [wins, setWins] = useState<[number, number]>([0, 0]);
  const [taps, setTaps] = useState<[number, number]>([0, 0]);
  const [bestBurst, setBestBurst] = useState<[number, number]>([0, 0]);
  const [left, setLeft] = useState(SECONDS);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Tap “Go” to start the round.");
  const [done, setDone] = useState(false);
  const tick = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          window.clearInterval(tick.current!);
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [running]);

  const scoredRound = useRef(0);
  useEffect(() => {
    if (running || left !== 0) return;
    if (scoredRound.current === round) return;
    scoredRound.current = round;
    const t = taps;
    setBestBurst((b) => [Math.max(b[0], t[0]), Math.max(b[1], t[1])]);
    const winner = t[0] === t[1] ? null : t[0] > t[1] ? 0 : 1;
    if (winner === null) {
      setMessage(`Tied on ${t[0]} taps each.`);
      return;
    }
    setMessage(`${players[winner]!.name} wins with ${t[winner]} taps.`);
    setWins((w) => [w[0] + (winner === 0 ? 1 : 0), w[1] + (winner === 1 ? 1 : 0)]);
    fx.win();
  }, [running, left, players, fx, round, taps]);

  function start() {
    setTaps([0, 0]);
    setLeft(SECONDS);
    setMessage("Go!");
    setRunning(true);
  }

  function next() {
    if (round >= ROUNDS) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setLeft(SECONDS);
    setTaps([0, 0]);
    setMessage("Tap “Go” to start the round.");
  }

  function hit(slot: 0 | 1) {
    if (!running) return;
    fx.tap();
    setTaps((t) => [t[0] + (slot === 0 ? 1 : 0), t[1] + (slot === 1 ? 1 : 0)]);
  }

  function rematch() {
    setWins([0, 0]);
    setTaps([0, 0]);
    setBestBurst([0, 0]);
    setRound(1);
    setLeft(SECONDS);
    setDone(false);
    setMessage("Tap “Go” to start the round.");
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`Eight furious seconds. Most taps takes the round, best of ${ROUNDS}.`}
          steps={[
            "Hold the phone flat between you, a thumb on each half.",
            "When the countdown starts, tap your own half as fast as you can.",
            "Most taps wins the round. Three rounds decide the match.",
          ]}
          onStart={startPlaying}
          startLabel="Thumbs on"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner = wins[0] >= wins[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={wins}
          headline={wins[0] === wins[1] ? "Perfectly matched" : `${players[winner]!.name} taps fastest`}
          detail={`Rounds won ${wins[0]}–${wins[1]}.`}
          scored
          stats={[
            { label: `${players[0]!.name} best`, value: `${bestBurst[0]} taps` },
            { label: `${players[1]!.name} best`, value: `${bestBurst[1]} taps` },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({
              summary: `${wins[0]}–${wins[1]} tap race`,
              myScore: wins[0],
              theirScore: wins[1],
            })
          }
        />
      </GameFrame>
    );
  }

  const idle = !running;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={round - 1}
      total={ROUNDS}
      header={<ScoreBar players={players} scores={wins} activeSlot={null} />}
    >
      <div className="mt-3 grid flex-1 grid-rows-2 gap-3">
        {([1, 0] as const).map((slot) => (
          <button
            key={slot}
            type="button"
            aria-label={`${players[slot]!.name} tap pad`}
            onPointerDown={() => hit(slot)}
            className={cn(
              "press flex touch-none select-none flex-col items-center justify-center rounded-[1.75rem] shadow-float transition-colors",
              slot === 0 ? "bg-primary/12 text-primary" : "bg-sky/25 text-sky-foreground",
              slot === 1 && "rotate-180",
              running && "ring-2 ring-current",
            )}
          >
            <span className="font-display text-5xl font-bold tabular-nums">{taps[slot]}</span>
            <span className="mt-1 text-xs font-bold opacity-80">{players[slot]!.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <p
          aria-live="polite"
          className="rounded-2xl bg-muted px-4 py-3 text-center text-sm font-bold text-muted-foreground"
        >
          {running ? `${left}s left` : message}
        </p>
        {idle ? (
          <button
            type="button"
            onClick={left === 0 ? next : start}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {left === 0 ? (round >= ROUNDS ? "See results" : "Next round") : "Go"}
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
