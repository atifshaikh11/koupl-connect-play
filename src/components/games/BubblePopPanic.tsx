import { useEffect, useMemo, useRef, useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const DURATION = 15;
const ROUNDS = 2;

type Bubble = { id: number; x: number; y: number; bad: boolean; size: number };

function makeBubble(id: number): Bubble {
  return {
    id,
    x: 6 + Math.random() * 78,
    y: 6 + Math.random() * 74,
    bad: Math.random() < 0.22,
    size: 44 + Math.random() * 26,
  };
}

/** Timed tapping panic: pop the coral bubbles, avoid the dark ones. */
export function BubblePopPanic({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(DURATION);
  const [points, setPoints] = useState(0);
  const [totals, setTotals] = useState<[number, number]>([0, 0]);
  const [best, setBest] = useState<[number, number]>([0, 0]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [done, setDone] = useState(false);
  const nextId = useRef(0);

  useEffect(() => {
    if (!running) return;
    const tick = window.setInterval(() => setLeft((l) => l - 1), 1000);
    const spawn = window.setInterval(() => {
      setBubbles((b) => {
        const trimmed = b.length > 5 ? b.slice(1) : b;
        return [...trimmed, makeBubble(nextId.current++)];
      });
    }, 520);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(spawn);
    };
  }, [running]);

  useEffect(() => {
    if (!running || left > 0) return;
    setRunning(false);
    setBubbles([]);
    const score = Math.max(points, 0);
    setTotals((t) => [t[0] + (turn === 0 ? score : 0), t[1] + (turn === 1 ? score : 0)]);
    setBest((b) => {
      const copy: [number, number] = [...b];
      copy[turn] = Math.max(copy[turn], score);
      return copy;
    });
    fx.win();
  }, [left, running, points, turn, fx]);

  function pop(b: Bubble) {
    setBubbles((list) => list.filter((x) => x.id !== b.id));
    if (b.bad) {
      fx.fail();
      setPoints((p) => p - 2);
    } else {
      fx.tap();
      setPoints((p) => p + 1);
    }
  }

  function start() {
    setPoints(0);
    setLeft(DURATION);
    setBubbles([makeBubble(nextId.current++), makeBubble(nextId.current++)]);
    setRunning(true);
  }

  function next() {
    if (turn === 1 && round >= ROUNDS) {
      setDone(true);
      return;
    }
    if (turn === 1) setRound((r) => r + 1);
    setTurn((t) => (t === 0 ? 1 : 0));
    setPoints(0);
    setLeft(DURATION);
  }

  function rematch() {
    setRound(1);
    setTurn(0);
    setTotals([0, 0]);
    setBest([0, 0]);
    setPoints(0);
    setLeft(DURATION);
    setDone(false);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`${DURATION} frantic seconds each. Pop coral bubbles, never the dark ones.`}
          steps={[
            "Tap start, then pop every coral bubble you can reach.",
            "Dark bubbles cost you two points — leave them alone.",
            "Two turns each. Highest combined score wins.",
          ]}
          onStart={startPlaying}
          startLabel="Get ready"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner = totals[0] >= totals[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={totals}
          headline={totals[0] === totals[1] ? "Dead heat" : `${players[winner]!.name} pops faster`}
          detail={`Total pops ${totals[0]}–${totals[1]}.`}
          scored
          stats={[
            { label: `${players[0]!.name} best round`, value: `${best[0]}` },
            { label: `${players[1]!.name} best round`, value: `${best[1]}` },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${totals[0]}–${totals[1]} bubble pop`, myScore: totals[0], theirScore: totals[1] })
          }
        />
      </GameFrame>
    );
  }

  const finished = !running && left <= 0;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={round - 1}
      total={ROUNDS}
      header={<ScoreBar players={players} scores={totals} activeSlot={turn} />}
    >
      <div className="relative mt-3 flex-1 overflow-hidden rounded-[1.75rem] bg-night shadow-float">
        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-label={b.bad ? "Dark bubble" : "Coral bubble"}
            onClick={() => pop(b)}
            className={cn(
              "animate-pop-in absolute rounded-full",
              b.bad ? "bg-night-soft ring-2 ring-night-muted" : "bg-primary",
            )}
            style={{ left: `${b.x}%`, top: `${b.y}%`, height: b.size, width: b.size }}
          />
        ))}
        {!running ? (
          <div className="absolute inset-0 grid place-content-center gap-3 px-6 text-center">
            <p className="font-display text-xl font-bold text-night-foreground">
              {finished ? `${points} points` : `${players[turn]!.name}'s turn`}
            </p>
            <p className="text-sm text-night-muted">
              {finished ? "Pass the phone over." : "Tap start when your thumb is ready."}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        <FeedbackBanner tone={running ? "primary" : "muted"}>
          {running ? `${left}s left · ${points} points` : `${players[turn]!.name} — round ${round}`}
        </FeedbackBanner>
        {!running ? (
          <button
            type="button"
            onClick={finished ? next : start}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {finished
              ? turn === 1 && round >= ROUNDS
                ? "See results"
                : "Pass the phone"
              : "Start my 15 seconds"}
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
