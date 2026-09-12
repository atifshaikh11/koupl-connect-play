import { useEffect, useRef, useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const FRAMES = 5;
const PINS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Timing-meter bowling: stop the marker in the sweet spot to knock pins down. */
export function BowlingRoll({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [frame, setFrame] = useState(1);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [pos, setPos] = useState(0);
  const [rolling, setRolling] = useState(true);
  const [down, setDown] = useState<number[]>([]);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [strikes, setStrikes] = useState<[number, number]>([0, 0]);
  const [message, setMessage] = useState("Stop the marker in the middle.");
  const raf = useRef(0);
  const rollLocked = useRef(false);
  const dir = useRef(1);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!rolling || showIntro || done) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      setPos((p) => {
        let next = p + dir.current * dt * 115;
        if (next > 100) {
          next = 100;
          dir.current = -1;
        }
        if (next < 0) {
          next = 0;
          dir.current = 1;
        }
        return next;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [rolling, showIntro, done]);

  function roll() {
    if (!rolling || rollLocked.current) return;
    rollLocked.current = true;
    setRolling(false);
    const off = Math.abs(pos - 50);
    let knocked: number;
    if (off < 4) knocked = 10;
    else if (off < 10) knocked = 8;
    else if (off < 18) knocked = 6;
    else if (off < 28) knocked = 4;
    else if (off < 40) knocked = 2;
    else knocked = 0;

    const idx = [...PINS].sort(() => Math.random() - 0.5).slice(0, knocked);
    setDown(idx);
    if (knocked === 10) {
      fx.win();
      setStrikes((s) => [s[0] + (turn === 0 ? 1 : 0), s[1] + (turn === 1 ? 1 : 0)]);
      setMessage("Strike! All ten down.");
    } else if (knocked === 0) {
      fx.fail();
      setMessage("Gutter ball — nothing down.");
    } else {
      fx.tap();
      setMessage(`${knocked} pins down.`);
    }
    setScores((s) => [s[0] + (turn === 0 ? knocked : 0), s[1] + (turn === 1 ? knocked : 0)]);
  }

  function next() {
    const lastRoll = turn === 1 && frame >= FRAMES;
    if (lastRoll) {
      setDone(true);
      return;
    }
    if (turn === 1) setFrame((f) => f + 1);
    setTurn((t) => (t === 0 ? 1 : 0));
    setDown([]);
    setPos(0);
    dir.current = 1;
    setRolling(true);
    rollLocked.current = false;
    setMessage("Stop the marker in the middle.");
  }

  function rematch() {
    setFrame(1);
    setTurn(0);
    setScores([0, 0]);
    setStrikes([0, 0]);
    setDown([]);
    setPos(0);
    dir.current = 1;
    setRolling(true);
    rollLocked.current = false;
    setDone(false);
    setMessage("Stop the marker in the middle.");
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`${FRAMES} frames each. Stop the power marker dead centre for a strike.`}
          steps={[
            "A marker slides along the power bar.",
            "Tap “Roll” to stop it — the closer to centre, the more pins fall.",
            "Take turns for five frames. Highest pin total wins.",
          ]}
          onStart={startPlaying}
          startLabel="Grab a ball"
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
          headline={scores[0] === scores[1] ? "Level lanes" : `${players[winner]!.name} bowls better`}
          detail={`Pins ${scores[0]}–${scores[1]}.`}
          scored
          stats={[
            { label: `${players[0]!.name} strikes`, value: `${strikes[0]}` },
            { label: `${players[1]!.name} strikes`, value: `${strikes[1]}` },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} bowling`, myScore: scores[0], theirScore: scores[1] })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={frame - 1}
      total={FRAMES}
      header={<ScoreBar players={players} scores={scores} activeSlot={turn} />}
    >
      <div className="mt-3 flex flex-1 flex-col justify-center gap-6 rounded-[1.75rem] bg-night p-5 shadow-float">
        <div className="mx-auto grid w-[176px] grid-cols-4 gap-2">
          {PINS.map((p) => (
            <span
              key={p}
              aria-hidden
              className={cn(
                "mx-auto h-8 w-6 rounded-t-full rounded-b-md transition-all",
                down.includes(p) ? "scale-75 bg-night-foreground/15" : "bg-night-foreground",
                p === 0 && "col-start-2",
                p === 1 && "col-start-3",
              )}
            />
          ))}
        </div>

        <div className="relative h-5 w-full overflow-hidden rounded-full bg-night-foreground/15">
          <span
            aria-hidden
            className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 rounded-full bg-success/70"
          />
          <span
            aria-hidden
            className="absolute inset-y-0 w-3 -translate-x-1/2 rounded-full bg-primary"
            style={{ left: `${pos}%` }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <FeedbackBanner tone={rolling ? "primary" : "success"}>
          {players[turn]!.name} — {message}
        </FeedbackBanner>
        <button
          type="button"
          onClick={rolling ? roll : next}
          className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
        >
          {rolling ? "Roll" : turn === 1 && frame >= FRAMES ? "See results" : "Pass the phone"}
        </button>
      </div>
    </GameFrame>
  );
}
