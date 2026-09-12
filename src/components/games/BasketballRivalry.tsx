import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { GameFrame, GameIntro, GameSummary, StatPill } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { HOW_TO } from "@/lib/koupl/games";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro, type GameProps } from "./shared";

const SHOTS_EACH = 10;
const TARGET_HALF = 9; // percentage points either side of centre
const PERFECT_HALF = 3; // dead-centre bonus zone

type State = {
  turn: 0 | 1;
  shots0: number;
  shots1: number;
  s0: number;
  s1: number;
  streak0: number;
  streak1: number;
  best0: number;
  best1: number;
  /** "2" perfect, "1" swish, "0" miss — one char per shot. */
  log0: string;
  log1: string;
  done: boolean;
  lastResult: "" | "perfect" | "swish" | "miss";
  shotSeq: number;
};

const initial: State = {
  turn: 0,
  shots0: 0,
  shots1: 0,
  s0: 0,
  s1: 0,
  streak0: 0,
  streak1: 0,
  best0: 0,
  best1: 0,
  log0: "",
  log1: "",
  done: false,
  lastResult: "",
  shotSeq: 0,
};

/** Original CSS basketball — no emoji, scales with its container. */
function Ball({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block h-20 w-20 overflow-hidden rounded-full bg-[radial-gradient(circle_at_32%_28%,var(--color-sunny),var(--color-primary))] shadow-float",
        className,
      )}
    >
      <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-night/50" />
      <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-night/50" />
      <span className="absolute -left-6 inset-y-0 w-12 rounded-full border-[2px] border-night/50" />
      <span className="absolute -right-6 inset-y-0 w-12 rounded-full border-[2px] border-night/50" />
    </span>
  );
}

export function BasketballRivalry({
  game,
  players,
  mySlot,
  room,
  onFinish,
  onExit,
}: GameProps) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const [pos, setPos] = useState(50);
  const [flight, setFlight] = useState<"" | "make" | "miss">("");
  const [locked, setLocked] = useState(false);
  const frame = useRef<number | null>(null);
  const shotTimer = useRef<number | null>(null);
  const stateRef = useRef(s);
  stateRef.current = s;
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(s.shots0 === 0 && s.shots1 === 0);

  useEffect(
    () => () => {
      if (shotTimer.current !== null) window.clearTimeout(shotTimer.current);
    },
    [],
  );

  const myTurn = mySlot === null || mySlot === s.turn;
  const shotsTaken = s.turn === 0 ? s.shots0 : s.shots1;
  const streak = s.turn === 0 ? s.streak0 : s.streak1;
  const speed = 0.9 + Math.min(shotsTaken, 8) * 0.14;

  useEffect(() => {
    if (s.done || locked || showIntro) return;
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
  }, [s.done, locked, speed, showIntro]);

  function shoot() {
    if (!myTurn || locked || s.done) return;
    const off = Math.abs(pos - 50);
    const perfect = off <= PERFECT_HALF;
    const hit = off <= TARGET_HALF;
    setLocked(true);
    setFlight(hit ? "make" : "miss");
    if (hit) fx.win();
    else fx.fail();
    shotTimer.current = window.setTimeout(() => {
      const current = stateRef.current;
      const base = perfect ? 2 : hit ? 1 : 0;
      const currentStreak = current.turn === 0 ? current.streak0 : current.streak1;
      const nextStreak = hit ? currentStreak + 1 : 0;
      // Every third consecutive make adds a bonus point.
      const bonus = hit && nextStreak > 0 && nextStreak % 3 === 0 ? 1 : 0;
      const gained = base + bonus;
      const mark = perfect ? "2" : hit ? "1" : "0";
      const isP0 = current.turn === 0;
      const nextShots0 = isP0 ? current.shots0 + 1 : current.shots0;
      const nextShots1 = isP0 ? current.shots1 : current.shots1 + 1;
      patch({
        shots0: nextShots0,
        shots1: nextShots1,
        s0: current.s0 + (isP0 ? gained : 0),
        s1: current.s1 + (isP0 ? 0 : gained),
        streak0: isP0 ? nextStreak : current.streak0,
        streak1: isP0 ? current.streak1 : nextStreak,
        best0: isP0 ? Math.max(current.best0, nextStreak) : current.best0,
        best1: isP0 ? current.best1 : Math.max(current.best1, nextStreak),
        log0: isP0 ? current.log0 + mark : current.log0,
        log1: isP0 ? current.log1 : current.log1 + mark,
        turn: (isP0 ? 1 : 0) as 0 | 1,
        lastResult: perfect ? "perfect" : hit ? "swish" : "miss",
        shotSeq: current.shotSeq + 1,
        done: nextShots0 >= SHOTS_EACH && nextShots1 >= SHOTS_EACH,
      });
      setFlight("");
      setLocked(false);
    }, 620);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`${SHOTS_EACH} shots each, taken in turns. Stop the marker dead centre for a double, and every third make in a row adds a bonus point.`}
          steps={HOW_TO[game.id] ?? []}
          onStart={startPlaying}
          startLabel="Step to the line"
        />
      </GameFrame>
    );
  }

  if (s.done) {
    const made = (log: string) => [...log].filter((c) => c !== "0").length;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={
            s.s0 === s.s1 ? "Tied on the buzzer" : `${players[s.s0 > s.s1 ? 0 : 1].name} wins`
          }
          detail={`${SHOTS_EACH} shots each. Dead-centre shots score double, every third make in a row adds a bonus.`}
          scored
          stats={[
            { label: `${players[0].name} made`, value: `${made(s.log0)}/${SHOTS_EACH}` },
            { label: `${players[1].name} made`, value: `${made(s.log1)}/${SHOTS_EACH}` },
            { label: "Best streak", value: Math.max(s.best0, s.best1) },
          ]}
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

  const log = s.turn === 0 ? s.log0 : s.log1;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={s.shots0 + s.shots1}
      total={SHOTS_EACH * 2}
      stepNoun="Shot"
      header={<ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={s.turn} />}
    >
      <div className="mt-2">
        <TurnBanner
          player={players[s.turn]}
          action={myTurn ? `shot ${shotsTaken + 1} of ${SHOTS_EACH}` : "is lining it up"}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <StatPill label="Streak" value={streak} tone={streak >= 2 ? "success" : "muted"} />
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: SHOTS_EACH }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                log[i] === "2"
                  ? "bg-success"
                  : log[i] === "1"
                    ? "bg-primary"
                    : log[i] === "0"
                      ? "bg-muted-foreground/40"
                      : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Court */}
      <div className="relative mt-4 flex flex-1 flex-col justify-center overflow-hidden rounded-[1.75rem] bg-night px-5 pb-6 pt-8 text-night-foreground shadow-float">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-24 h-24 rounded-[100%] border border-night-foreground/10"
        />
        {/* backboard + hoop */}
        <div className="relative mx-auto w-40">
          <div className="h-14 w-full rounded-xl border-2 border-night-foreground/25 bg-night-soft" />
          <div
            className={cn(
              "mx-auto -mt-2 h-2 w-20 rounded-full bg-primary transition-transform",
              flight === "make" && "scale-x-110",
            )}
          />
          <div
            className={cn(
              "mx-auto h-6 w-20 [clip-path:polygon(0_0,100%_0,72%_100%,28%_100%)] bg-[repeating-linear-gradient(135deg,transparent_0_5px,var(--night-foreground)_5px_6px)] opacity-40 transition-all",
              flight === "make" && "h-8 opacity-70",
            )}
          />
        </div>

        <div className="relative mt-6 flex h-24 justify-center">
          <Ball
            key={`${s.shotSeq}-${flight}`}
            className={cn(
              flight === "make"
                ? "animate-shot"
                : flight === "miss"
                  ? "animate-brick"
                  : "animate-float",
            )}
          />
        </div>

        <p className="relative mt-4 h-6 text-center text-sm font-bold" aria-live="polite">
          {s.lastResult === "perfect" ? (
            <span className="text-success">Nothing but net! +2</span>
          ) : s.lastResult === "swish" ? (
            <span className="text-success">Swish! +1</span>
          ) : s.lastResult === "miss" ? (
            <span className="text-night-muted">Rimmed out.</span>
          ) : (
            <span className="text-night-muted">Tap when the marker hits the middle.</span>
          )}
        </p>

        <div
          className={cn(
            "relative mt-4 h-12 w-full overflow-hidden rounded-full border border-night-foreground/15 bg-night-soft",
            flight === "miss" && "animate-shake",
          )}
        >
          <div
            className="absolute inset-y-0 bg-success/25"
            style={{ left: `${50 - TARGET_HALF}%`, width: `${TARGET_HALF * 2}%` }}
          />
          <div
            className="absolute inset-y-0 bg-success/45"
            style={{ left: `${50 - PERFECT_HALF}%`, width: `${PERFECT_HALF * 2}%` }}
          />
          <div
            className="absolute inset-y-1.5 w-2 -translate-x-1/2 rounded-full bg-primary shadow-float"
            style={{ left: `${pos}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-5">
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
