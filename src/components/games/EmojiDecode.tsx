import { useMemo, useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary, PromptCard } from "@/components/koupl/GameShell";
import { ScoreBar } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

type Puzzle = { clue: string; answer: string; options: string[] };

const PUZZLES: Puzzle[] = [
  { clue: "🌧️ + 🎬", answer: "Rainy movie night", options: ["Rainy movie night", "Storm chasing", "Wet laundry"] },
  { clue: "🥐 + ☕ + 🗞️", answer: "Slow breakfast", options: ["Slow breakfast", "Office morning", "Train ride"] },
  { clue: "🎒 + 🗺️ + 🚌", answer: "Backpacking trip", options: ["Backpacking trip", "School run", "Moving house"] },
  { clue: "🕯️ + 🍝", answer: "Dinner date", options: ["Dinner date", "Power cut", "Cooking class"] },
  { clue: "🧺 + 🌳 + ☀️", answer: "Park picnic", options: ["Park picnic", "Laundry day", "Gardening"] },
  { clue: "📦 + 🔑 + 🏠", answer: "Moving in together", options: ["Moving in together", "Online shopping", "Locked out"] },
  { clue: "🎤 + 😬 + 🎶", answer: "Karaoke night", options: ["Karaoke night", "Concert queue", "Choir practice"] },
  { clue: "🛏️ + 📱 + 🌙", answer: "Late night scrolling", options: ["Late night scrolling", "Early alarm", "Reading club"] },
  { clue: "🐕 + 🥾 + ⛰️", answer: "Hike with the dog", options: ["Hike with the dog", "Dog grooming", "Camping alone"] },
  { clue: "🎂 + 🎈 + 🤫", answer: "Surprise party", options: ["Surprise party", "Bakery run", "Balloon shopping"] },
];

const ROUNDS = 8;

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Read the emoji clue, pick the phrase it hides — alternating turns. */
export function EmojiDecode({ game, players, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { showIntro, startPlaying } = useIntro(true);

  const deck = useMemo(() => shuffle(PUZZLES).slice(0, ROUNDS), []);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [done, setDone] = useState(false);

  const puzzle = deck[index] ?? PUZZLES[0]!;
  const options = useMemo(() => shuffle(puzzle.options), [puzzle]);

  function answer(option: string) {
    if (choice) return;
    setChoice(option);
    if (option === puzzle.answer) {
      fx.win();
      setScores((s) => [s[0] + (turn === 0 ? 1 : 0), s[1] + (turn === 1 ? 1 : 0)]);
    } else {
      fx.fail();
    }
  }

  function next() {
    if (index + 1 >= deck.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setTurn((t) => (t === 0 ? 1 : 0));
    setChoice(null);
  }

  function rematch() {
    setIndex(0);
    setTurn(0);
    setChoice(null);
    setScores([0, 0]);
    setDone(false);
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Decode the emoji clue into the phrase it's hiding."
          steps={[
            "A short emoji clue appears on your turn.",
            "Pick the phrase you think it describes.",
            "Correct decodes score a point. Turns alternate each round.",
          ]}
          onStart={startPlaying}
          startLabel="Start decoding"
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
          headline={scores[0] === scores[1] ? "Same wavelength" : `${players[winner]!.name} reads emoji better`}
          detail={`Correct decodes ${scores[0]}–${scores[1]}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${scores[0]}–${scores[1]} emoji decode`, myScore: scores[0], theirScore: scores[1] })
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
      total={deck.length}
      header={<ScoreBar players={players} scores={scores} activeSlot={turn} />}
    >
      <div className="mt-3 flex flex-1 flex-col gap-4">
        <PromptCard tone="berry" animateKey={index} className="flex-1">
          <span className="text-4xl leading-relaxed">{puzzle.clue}</span>
          <p className="mt-3 text-sm opacity-80">{players[turn]!.name}, what is it?</p>
        </PromptCard>

        <div className="space-y-2">
          {options.map((o) => {
            const isAnswer = o === puzzle.answer;
            const chosen = choice === o;
            return (
              <button
                key={o}
                type="button"
                onClick={() => answer(o)}
                disabled={!!choice}
                className={cn(
                  "press min-h-14 w-full rounded-2xl border-2 px-4 text-base font-bold shadow-soft",
                  !choice && "border-border bg-card",
                  choice && isAnswer && "border-success bg-success/15 text-success",
                  choice && chosen && !isAnswer && "border-primary bg-primary/10 text-primary",
                  choice && !chosen && !isAnswer && "border-border bg-card opacity-55",
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {choice ? (
          <>
            <FeedbackBanner tone={choice === puzzle.answer ? "success" : "muted"}>
              {choice === puzzle.answer ? "Decoded it — point banked" : `It was “${puzzle.answer}”`}
            </FeedbackBanner>
            <button
              type="button"
              onClick={next}
              className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
            >
              {index + 1 >= deck.length ? "See results" : "Pass the phone"}
            </button>
          </>
        ) : null}
      </div>
    </GameFrame>
  );
}
