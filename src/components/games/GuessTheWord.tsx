import { useMemo, useRef, useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const WORDS = [
  "PICNIC",
  "SUNSET",
  "COFFEE",
  "PILLOW",
  "TICKET",
  "GARDEN",
  "WINTER",
  "LAUGH",
  "BEACH",
  "CANDLE",
  "TRAVEL",
  "MEMORY",
  "KITCHEN",
  "SUNDAY",
  "LETTER",
  "HARBOUR",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LIVES = 6;
const ROUNDS = 4;

function pick(used: string[]) {
  const pool = WORDS.filter((w) => !used.includes(w));
  const list = pool.length ? pool : WORDS;
  return list[Math.floor(Math.random() * list.length)]!;
}

/** Letter-guessing duel: one partner guesses, the other watches the lives drain. */
export function GuessTheWord({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [used, setUsed] = useState<string[]>([]);
  const [word, setWord] = useState(() => pick([]));
  const [picked, setPicked] = useState<string[]>([]);
  const [lives, setLives] = useState(LIVES);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [over, setOver] = useState<null | "won" | "lost">(null);
  const [done, setDone] = useState(false);
  const pickedRef = useRef<string[]>([]);

  const letters = useMemo(() => word.split(""), [word]);
  const solved = letters.every((l) => picked.includes(l));

  function guess(letter: string) {
    if (over || pickedRef.current.includes(letter)) return;
    const next = [...pickedRef.current, letter];
    pickedRef.current = next;
    setPicked(next);
    if (word.includes(letter)) {
      fx.tap();
      if (letters.every((l) => next.includes(l))) {
        fx.win();
        const gained = Math.max(lives, 1);
        setScores((s) => [s[0] + (turn === 0 ? gained : 0), s[1] + (turn === 1 ? gained : 0)]);
        setOver("won");
      }
      return;
    }
    fx.fail();
    const remaining = lives - 1;
    setLives(remaining);
    if (remaining <= 0) setOver("lost");
  }

  function next() {
    if (turn === 1 && round >= ROUNDS) {
      setDone(true);
      return;
    }
    if (turn === 1) setRound((r) => r + 1);
    setTurn((t) => (t === 0 ? 1 : 0));
    const nextUsed = [...used, word];
    setUsed(nextUsed);
    setWord(pick(nextUsed));
    setPicked([]);
    pickedRef.current = [];
    setLives(LIVES);
    setOver(null);
  }

  function rematch() {
    setRound(1);
    setTurn(0);
    setUsed([]);
    setWord(pick([]));
    setPicked([]);
    pickedRef.current = [];
    setLives(LIVES);
    setScores([0, 0]);
    setOver(null);
    setDone(false);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Guess the hidden word letter by letter. Fewer mistakes, more points."
          steps={[
            "On your turn, tap letters to reveal the hidden word.",
            `You have ${LIVES} lives — every wrong letter costs one.`,
            "Solve it and bank the lives you had left as points.",
          ]}
          onStart={startPlaying}
          startLabel="Reveal the board"
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
          headline={scores[0] === scores[1] ? "Equally wordy" : `${players[winner]!.name} guesses better`}
          detail={`Points ${scores[0]}–${scores[1]}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} word guess`, myScore: scores[0], theirScore: scores[1] })
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
      <div className="mt-3 flex flex-1 flex-col justify-center gap-5">
        <div className="flex flex-wrap justify-center gap-2">
          {letters.map((l, i) => (
            <span
              key={`${l}-${i}`}
              className={cn(
                "font-display grid h-12 w-9 place-items-center rounded-xl text-xl font-bold shadow-soft",
                picked.includes(l) || over === "lost"
                  ? "bg-card text-foreground"
                  : "bg-muted text-transparent",
              )}
            >
              {picked.includes(l) || over === "lost" ? l : "•"}
            </span>
          ))}
        </div>

        <div className="flex justify-center gap-1.5" aria-label={`${lives} lives left`}>
          {Array.from({ length: LIVES }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn("h-2.5 w-6 rounded-full", i < lives ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {ALPHABET.map((l) => {
            const chosen = picked.includes(l);
            return (
              <button
                key={l}
                type="button"
                onClick={() => guess(l)}
                disabled={chosen || !!over}
                className={cn(
                  "press grid h-11 place-items-center rounded-xl text-sm font-bold shadow-soft",
                  chosen
                    ? word.includes(l)
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground opacity-60"
                    : "bg-card text-foreground",
                )}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <FeedbackBanner tone={over === "won" ? "success" : over ? "muted" : "primary"}>
          {over === "won"
            ? `${players[turn]!.name} solved it with ${lives} lives spare`
            : over === "lost"
              ? `Out of lives — the word was ${word}`
              : `${players[turn]!.name} is guessing · ${lives} lives`}
        </FeedbackBanner>
        {over ? (
          <button
            type="button"
            onClick={next}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {turn === 1 && round >= ROUNDS ? "See results" : "Pass the phone"}
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
