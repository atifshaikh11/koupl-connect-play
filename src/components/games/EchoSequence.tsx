import { useEffect, useRef, useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const PADS = [
  { tone: "bg-primary", label: "Coral" },
  { tone: "bg-sky", label: "Sky" },
  { tone: "bg-success", label: "Mint" },
  { tone: "bg-sunny", label: "Sun" },
] as const;

type Phase = "watch" | "repeat" | "result";

/** Simon-style memory duel: the sequence grows until someone slips. */
export function EchoSequence({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [seq, setSeq] = useState<number[]>([]);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<Phase>("watch");
  const [lit, setLit] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [best, setBest] = useState<[number, number]>([0, 0]);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [message, setMessage] = useState("Watch the sequence…");
  const [done, setDone] = useState(false);
  const [slipped, setSlipped] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  function playback(list: number[]) {
    setPhase("watch");
    setMessage(`${players[turn]!.name} — watch closely`);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    list.forEach((pad, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(pad);
          fx.tap();
        }, 600 + i * 620),
      );
      timers.current.push(window.setTimeout(() => setLit(null), 600 + i * 620 + 380));
    });
    timers.current.push(
      window.setTimeout(
        () => {
          setPhase("repeat");
          setStep(0);
          setMessage("Repeat it back");
        },
        600 + list.length * 620 + 150,
      ),
    );
  }

  function beginTurn(nextTurn: 0 | 1, list: number[]) {
    const grown = [...list, Math.floor(Math.random() * PADS.length)];
    setSeq(grown);
    setTurn(nextTurn);
    playback(grown);
  }

  function press(i: number) {
    if (phase !== "repeat") return;
    if (seq[step] !== i) {
      fx.fail();
      const other: 0 | 1 = turn === 0 ? 1 : 0;
      setScores((s) => [s[0] + (other === 0 ? 1 : 0), s[1] + (other === 1 ? 1 : 0)]);
      setMessage(`${players[turn]!.name} broke the chain at ${seq.length} — point to ${players[other]!.name}`);
      setSlipped(true);
      setPhase("result");
      return;
    }
    fx.tap();
    setLit(i);
    window.setTimeout(() => setLit(null), 160);
    const nextStep = step + 1;
    if (nextStep >= seq.length) {
      setBest((b) => {
        const copy: [number, number] = [...b];
        copy[turn] = Math.max(copy[turn], seq.length);
        return copy;
      });
      setMessage(`Nailed ${seq.length} — passing over`);
      setSlipped(false);
      setPhase("result");
      return;
    }
    setStep(nextStep);
  }

  function next() {
    if (slipped) {
      if (scores[0] >= 3 || scores[1] >= 3) {
        setDone(true);
        return;
      }
      setSlipped(false);
      setSeq([]);
      beginTurn(turn === 0 ? 1 : 0, []);
      return;
    }
    beginTurn(turn === 0 ? 1 : 0, seq);
  }

  function rematch() {
    setScores([0, 0]);
    setBest([0, 0]);
    setSeq([]);
    setSlipped(false);
    setDone(false);
    beginTurn(0, []);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Repeat a growing colour sequence. First to three slips loses."
          steps={[
            "Watch the pads light up in order.",
            "Tap them back in exactly the same order.",
            "Every clean turn adds one more pad. Miss and your partner scores.",
          ]}
          onStart={() => {
            startPlaying();
            beginTurn(0, []);
          }}
          startLabel="Start the chain"
        />
      </GameFrame>
    );
  }

  if (done) {
    const winner = scores[0] > scores[1] ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={scores}
          headline={`${players[winner]!.name} has the sharper memory`}
          detail={`Slips ${scores[1]}–${scores[0]} against them.`}
          scored
          stats={[
            { label: `${players[0]!.name} longest`, value: `${best[0]}` },
            { label: `${players[1]!.name} longest`, value: `${best[1]}` },
          ]}
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} echo sequence`, myScore: scores[0], theirScore: scores[1] })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={<ScoreBar players={players} scores={scores} activeSlot={turn} />}
    >
      <div className="mt-4 grid flex-1 place-content-center">
        <div className="grid grid-cols-2 gap-3">
          {PADS.map((pad, i) => (
            <button
              key={pad.label}
              type="button"
              aria-label={pad.label}
              onClick={() => press(i)}
              disabled={phase !== "repeat"}
              className={cn(
                "press h-[clamp(88px,30vw,124px)] w-[clamp(88px,30vw,124px)] rounded-3xl shadow-float transition-opacity",
                pad.tone,
                lit === i ? "opacity-100 ring-4 ring-white" : "opacity-45",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <FeedbackBanner tone={phase === "repeat" ? "primary" : "muted"}>
          {message} · length {seq.length}
        </FeedbackBanner>
        {phase === "result" ? (
          <button
            type="button"
            onClick={next}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {scores[0] >= 3 || scores[1] >= 3 ? "See results" : "Pass the phone"}
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
