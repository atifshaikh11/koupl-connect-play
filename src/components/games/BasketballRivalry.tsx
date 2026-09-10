import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { GameFrame, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { cn } from "@/lib/utils";
import type { GameProps } from "./shared";

const SHOTS_EACH = 10;
const TARGET_HALF = 9; // percentage points either side of centre

type State = {
  turn: 0 | 1;
  shots0: number;
  shots1: number;
  s0: number;
  s1: number;
  done: boolean;
  lastResult: "" | "swish" | "miss";
};

const initial: State = {
  turn: 0,
  shots0: 0,
  shots1: 0,
  s0: 0,
  s1: 0,
  done: false,
  lastResult: "",
};

export function BasketballRivalry({
  game,
  players,
  mySlot,
  room,
  onFinish,
  onExit,
}: GameProps) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room);
  const [pos, setPos] = useState(50);
  const [locked, setLocked] = useState(false);
  const frame = useRef<number | null>(null);

  const myTurn = mySlot === null || mySlot === s.turn;
  const shotsTaken = s.turn === 0 ? s.shots0 : s.shots1;
  const speed = 0.9 + Math.min(shotsTaken, 8) * 0.14;

  useEffect(() => {
    if (s.done || locked) return;
    let t = 0;
    const tick = () => {
      t += speed;
      setPos(50 + 46 * Math.sin(t / 16));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [s.done, locked, speed]);

  function shoot() {
    if (!myTurn || locked || s.done) return;
    const hit = Math.abs(pos - 50) <= TARGET_HALF;
    setLocked(true);
    window.setTimeout(() => {
      const nextShots0 = s.turn === 0 ? s.shots0 + 1 : s.shots0;
      const nextShots1 = s.turn === 1 ? s.shots1 + 1 : s.shots1;
      const done = nextShots0 >= SHOTS_EACH && nextShots1 >= SHOTS_EACH;
      patch({
        shots0: nextShots0,
        shots1: nextShots1,
        s0: s.s0 + (hit && s.turn === 0 ? 1 : 0),
        s1: s.s1 + (hit && s.turn === 1 ? 1 : 0),
        turn: (s.turn === 0 ? 1 : 0) as 0 | 1,
        lastResult: hit ? "swish" : "miss",
        done,
      });
      setLocked(false);
    }, 620);
  }

  if (s.done) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={
            s.s0 === s.s1 ? "Tied on the buzzer" : `${players[s.s0 > s.s1 ? 0 : 1].name} wins`
          }
          detail={`${SHOTS_EACH} shots each. Bragging rights last until the rematch.`}
          scored
          onRematch={() => reset(initial)}
          onExit={() =>
            onFinish({
              summary: `${s.s0}–${s.s1} from the line`,
              myScore: mySlot === 1 ? s.s1 : s.s0,
              theirScore: mySlot === 1 ? s.s0 : s.s1,
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
      step={s.shots0 + s.shots1}
      total={SHOTS_EACH * 2}
      header={<ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={s.turn} />}
    >
      <div className="mt-1">
        <TurnBanner
          player={players[s.turn]}
          action={myTurn ? `shot ${shotsTaken + 1} of ${SHOTS_EACH}` : "is lining it up"}
        />
      </div>

      <div className="mt-6 flex flex-col items-center gap-6">
        <div
          className={cn(
            "flex h-36 w-36 items-center justify-center rounded-full bg-sunny/30 text-7xl",
            s.lastResult === "swish" && "animate-pop-in",
            s.lastResult === "miss" && "animate-wiggle",
          )}
          aria-hidden
        >
          🏀
        </div>
        <p className="h-6 text-sm font-bold" aria-live="polite">
          {s.lastResult === "swish" ? (
            <span className="text-success">Swish! +1</span>
          ) : s.lastResult === "miss" ? (
            <span className="text-muted-foreground">Rimmed out.</span>
          ) : (
            <span className="text-muted-foreground">Tap when the marker hits the middle.</span>
          )}
        </p>

        <div className="relative h-12 w-full overflow-hidden rounded-full border border-border bg-muted">
          <div
            className="absolute inset-y-0 bg-success/25"
            style={{ left: `${50 - TARGET_HALF}%`, width: `${TARGET_HALF * 2}%` }}
          />
          <div
            className="absolute inset-y-1.5 w-2 -translate-x-1/2 rounded-full bg-primary"
            style={{ left: `${pos}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button
          size="lg"
          className="h-20 w-full rounded-3xl text-xl"
          disabled={!myTurn || locked}
          onClick={shoot}
        >
          {myTurn ? "Shoot" : `${players[s.turn].name}'s turn`}
        </Button>
      </div>
    </GameFrame>
  );
}
