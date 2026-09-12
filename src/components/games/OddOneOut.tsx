import { useEffect, useMemo, useRef, useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const ROUNDS = 8;
const HUES = [4, 205, 152, 40, 280];

type Round = { size: number; odd: number; hue: number; delta: number };

function makeRound(index: number): Round {
  const size = Math.min(3 + Math.floor(index / 2), 6);
  return {
    size,
    odd: Math.floor(Math.random() * size * size),
    hue: HUES[Math.floor(Math.random() * HUES.length)]!,
    delta: Math.max(16 - index * 1.6, 5),
  };
}

/** Spot the single off-shade tile before your partner does. */
export function OddOneOut({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("Both of you look — first correct tap scores.");
  const [round, setRound] = useState<Round>(() => makeRound(0));
  const [tapper, setTapper] = useState<0 | 1>(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(performance.now());
  const [bestMs, setBestMs] = useState<[number | null, number | null]>([null, null]);

  useEffect(() => {
    startedAt.current = performance.now();
  }, [round]);

  const tiles = useMemo(() => Array.from({ length: round.size * round.size }), [round]);

  function tap(i: number, slot: 0 | 1) {
    if (locked) return;
    if (i !== round.odd) {
      fx.fail();
      const other: 0 | 1 = slot === 0 ? 1 : 0;
      setMessage(`${players[slot]!.name} guessed wrong — point to ${players[other]!.name}`);
      setScores((s) => [s[0] + (other === 0 ? 1 : 0), s[1] + (other === 1 ? 1 : 0)]);
      setLocked(true);
      return;
    }
    const ms = Math.round(performance.now() - startedAt.current);
    fx.win();
    setBestMs((b) => {
      const next: [number | null, number | null] = [...b];
      const cur = next[slot];
      if (cur === null || ms < cur) next[slot] = ms;
      return next;
    });
    setScores((s) => [s[0] + (slot === 0 ? 1 : 0), s[1] + (slot === 1 ? 1 : 0)]);
    setMessage(`${players[slot]!.name} spotted it in ${(ms / 1000).toFixed(1)}s`);
    setLocked(true);
  }

  function next() {
    if (index + 1 >= ROUNDS) {
      setDone(true);
      return;
    }
    const i = index + 1;
    setIndex(i);
    setRound(makeRound(i));
    setLocked(false);
    setMessage("Both of you look — first correct tap scores.");
  }

  function rematch() {
    setIndex(0);
    setScores([0, 0]);
    setBestMs([null, null]);
    setRound(makeRound(0));
    setLocked(false);
    setDone(false);
    setMessage("Both of you look — first correct tap scores.");
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="One tile is a slightly different shade. Find it first."
          steps={[
            "The grid fills with one colour — except a single tile.",
            "Tap the odd tile, then say whose finger got there first.",
            "Wrong tap hands the point over. Eight rounds, closest eye wins.",
          ]}
          onStart={startPlaying}
          startLabel="Sharpen up"
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
          headline={scores[0] === scores[1] ? "Equally eagle-eyed" : `${players[winner]!.name} spots it faster`}
          detail={`Rounds won ${scores[0]}–${scores[1]}.`}
          scored
          stats={[
            { label: `${players[0]!.name} best`, value: bestMs[0] ? `${(bestMs[0] / 1000).toFixed(1)}s` : "—" },
            { label: `${players[1]!.name} best`, value: bestMs[1] ? `${(bestMs[1] / 1000).toFixed(1)}s` : "—" },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} odd one out`, myScore: scores[0], theirScore: scores[1] })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={index}
      total={ROUNDS}
      header={<ScoreBar players={players} scores={scores} activeSlot={null} />}
    >
      <div className="mt-4 grid flex-1 place-content-center">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${round.size}, minmax(0, 1fr))` }}
        >
          {tiles.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Tile ${i + 1}`}
              onClick={() => tap(i, tapper)}
              disabled={locked}
              className={cn(
                "rounded-xl transition-transform active:scale-95",
                locked && i === round.odd && "ring-4 ring-night",
              )}
              style={{
                width: `min(${76 / round.size}vw, ${300 / round.size}px)`,
                height: `min(${76 / round.size}vw, ${300 / round.size}px)`,
                background: `hsl(${round.hue} 70% ${i === round.odd ? 62 - round.delta : 62}%)`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <FeedbackBanner tone={locked ? "success" : "primary"}>{message}</FeedbackBanner>
        {locked ? (
          <button
            type="button"
            onClick={next}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {index + 1 >= ROUNDS ? "See results" : "Next grid"}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {([0, 1] as const).map((slot) => (
              <button
                key={slot}
                type="button"
                aria-pressed={tapper === slot}
                onClick={() => setTapper(slot)}
                className={cn(
                  "press h-12 rounded-2xl text-sm font-bold transition-opacity",
                  slot === 0 ? "bg-primary/12 text-primary" : "bg-sky/25 text-sky-foreground",
                  tapper === slot ? "opacity-100 ring-2 ring-current" : "opacity-55",
                )}
              >
                {players[slot]!.name} taps
              </button>
            ))}
          </div>
        )}
      </div>
    </GameFrame>
  );
}
