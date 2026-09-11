import { useEffect, useRef, useState } from "react";

import { GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const ROUNDS = 7;
type Phase = "waiting" | "go" | "result";

export function ReactionClash({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [round, setRound] = useState(1);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [message, setMessage] = useState("Get ready…");
  const [best, setBest] = useState<[number | null, number | null]>([null, null]);
  const [done, setDone] = useState(false);
  const goAt = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (showIntro || done || phase !== "waiting") return;
    setMessage("Wait for the flash…");
    const delay = 1200 + Math.random() * 2600;
    timer.current = window.setTimeout(() => {
      goAt.current = performance.now();
      setPhase("go");
      fx.tap();
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [phase, showIntro, done, fx]);

  function tap(slot: 0 | 1) {
    if (phase === "result" || done) return;
    if (phase === "waiting") {
      if (timer.current) window.clearTimeout(timer.current);
      fx.fail();
      award(slot === 0 ? 1 : 0, `${players[slot]!.name} jumped early — point to ${players[slot === 0 ? 1 : 0]!.name}`);
      return;
    }
    const ms = Math.round(performance.now() - goAt.current);
    fx.win();
    setBest((b) => {
      const next: [number | null, number | null] = [...b];
      const cur = next[slot];
      if (cur === null || ms < cur) next[slot] = ms;
      return next;
    });
    award(slot, `${players[slot]!.name} in ${ms}ms`);
  }

  function award(slot: 0 | 1, msg: string) {
    setScores((s) => [s[0] + (slot === 0 ? 1 : 0), s[1] + (slot === 1 ? 1 : 0)] as [number, number]);
    setMessage(msg);
    setPhase("result");
  }

  function next() {
    if (round >= ROUNDS) {
      setDone(true);
      return;
    }
    setRound((r) => r + 1);
    setPhase("waiting");
  }

  function rematch() {
    setScores([0, 0]);
    setBest([null, null]);
    setRound(1);
    setDone(false);
    setPhase("waiting");
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="The screen flashes at a random moment. First thumb down wins the round."
          steps={[
            "Each of you puts a thumb on your own half of the screen.",
            "When both halves flash, tap as fast as you can.",
            "Tap too early and the point goes to your partner. Best of seven.",
          ]}
          onStart={startPlaying}
          startLabel="Thumbs ready"
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
          headline={
            scores[0] === scores[1] ? "Dead heat" : `${players[winner]!.name} has the faster thumbs`
          }
          detail={`Seven flashes, ${scores[0]}–${scores[1]}.`}
          scored
          stats={[
            { label: `${players[0]!.name} best`, value: best[0] ? `${best[0]}ms` : "—" },
            { label: `${players[1]!.name} best`, value: best[1] ? `${best[1]}ms` : "—" },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({
              summary: `${scores[0]}–${scores[1]} reaction clash`,
              myScore: scores[0],
              theirScore: scores[1],
            })
          }
        />
      </GameFrame>
    );
  }

  const live = phase === "go";

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={round - 1}
      total={ROUNDS}
      header={<ScoreBar players={players} scores={scores} activeSlot={null} />}
    >
      <div className="mt-3 grid flex-1 grid-rows-2 gap-3">
        {([1, 0] as const).map((slot) => (
          <button
            key={slot}
            type="button"
            aria-label={`${players[slot]!.name} tap area`}
            onPointerDown={() => tap(slot)}
            disabled={phase === "result"}
            className={cn(
              "press relative flex touch-none select-none flex-col items-center justify-center rounded-[1.75rem] text-center shadow-float transition-colors",
              live
                ? "bg-success text-white"
                : slot === 0
                  ? "bg-primary/12 text-primary"
                  : "bg-sky/25 text-sky-foreground",
              slot === 1 && "rotate-180",
            )}
          >
            <span className="font-display text-3xl font-bold">{live ? "TAP" : "wait"}</span>
            <span className="mt-1 text-xs font-bold opacity-80">{players[slot]!.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <p
          aria-live="polite"
          className="rounded-2xl bg-muted px-4 py-3 text-center text-sm font-bold text-muted-foreground"
        >
          {message}
        </p>
        {phase === "result" ? (
          <button
            type="button"
            onClick={next}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {round >= ROUNDS ? "See results" : "Next flash"}
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
