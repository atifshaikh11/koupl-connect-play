import { useEffect } from "react";
import {
  Anchor,
  Bike,
  Cake,
  Cherry,
  Cloud,
  Feather,
  Flame,
  Gem,
  Ghost,
  Leaf,
  Moon,
  Rocket,
  Snowflake,
  Star,
  Sun,
  Umbrella,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner, GameFrame, GameIntro, GameSummary, StatPill } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { cn } from "@/lib/utils";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const ICONS: LucideIcon[] = [
  Star,
  Moon,
  Sun,
  Cloud,
  Flame,
  Gem,
  Leaf,
  Rocket,
  Cake,
  Cherry,
  Ghost,
  Anchor,
  Bike,
  Feather,
  Snowflake,
  Umbrella,
];

const PAIRS = 8; // 4x4 board

type State = {
  deck: string;
  open: string;
  found: string;
  turn: 0 | 1;
  s0: number;
  s1: number;
  streak0: number;
  streak1: number;
  last: string;
  done: boolean;
};

const initial: State = {
  deck: "",
  open: "",
  found: "",
  turn: 0,
  s0: 0,
  s1: 0,
  streak0: 0,
  streak1: 0,
  last: "",
  done: false,
};

function makeDeck() {
  const cards: number[] = [];
  for (let i = 0; i < PAIRS; i++) cards.push(i, i);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards.join(",");
}

export function MemoryMatchDuel({ game, players, mySlot, room, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const { showIntro, startPlaying } = useIntro(!s.deck || s.s0 + s.s1 === 0);

  useEffect(() => {
    if (!s.deck) patch({ deck: makeDeck() });
  }, [s.deck, patch]);

  const deck = s.deck ? s.deck.split(",").map(Number) : [];
  const open = s.open ? s.open.split(",").map(Number) : [];
  const found = s.found ? s.found.split(",").map(Number) : [];
  const myTurn = mySlot === null || mySlot === s.turn;

  // Resolve a pair shortly after the second card is flipped.
  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open as [number, number];
    const match = deck[a] === deck[b];
    const t = window.setTimeout(() => {
      if (match) {
        const nextFound = [...found, a, b];
        const streak = (s.turn === 0 ? s.streak0 : s.streak1) + 1;
        const points = 1 + (streak >= 2 ? 1 : 0);
        patch({
          found: nextFound.join(","),
          open: "",
          s0: s.s0 + (s.turn === 0 ? points : 0),
          s1: s.s1 + (s.turn === 1 ? points : 0),
          streak0: s.turn === 0 ? streak : s.streak0,
          streak1: s.turn === 1 ? streak : s.streak1,
          last: streak >= 2 ? `Match + streak bonus (+${points})` : "Match — go again",
          done: nextFound.length >= PAIRS * 2,
        });
      } else {
        patch({
          open: "",
          turn: (s.turn === 0 ? 1 : 0) as 0 | 1,
          streak0: s.turn === 0 ? 0 : s.streak0,
          streak1: s.turn === 1 ? 0 : s.streak1,
          last: "No match — turn passes",
        });
      }
    }, 850);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.open]);

  useEffect(() => {
    if (open.length === 2) {
      const match = deck[open[0]!] === deck[open[1]!];
      if (match) fx.win();
      else fx.fail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.open]);

  function flip(i: number) {
    if (!myTurn || open.length >= 2 || open.includes(i) || found.includes(i)) return;
    fx.tap();
    patch({ open: [...open, i].join(",") });
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective="Sixteen face-down cards, eight pairs. Remember where things are and out-match your partner."
          steps={[
            "On your turn, flip two cards.",
            "Match a pair and you score, then flip again.",
            "Two matches in a row earns a bonus point. Most points when the board clears wins.",
          ]}
          onStart={startPlaying}
          startLabel="Deal the board"
        />
      </GameFrame>
    );
  }

  if (s.done) {
    const winner = s.s0 >= s.s1 ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={s.s0 === s.s1 ? "Identical memories" : `${players[winner]!.name} remembers better`}
          detail={`Board cleared ${s.s0}–${s.s1}.`}
          scored
          stats={[{ label: "Pairs", value: PAIRS }]}
          onRematch={() => reset({ ...initial, deck: makeDeck() })}
          onExit={() =>
            onFinish({
              summary: `${s.s0}–${s.s1} memory duel`,
              myScore: mySlot === 1 ? s.s1 : s.s0,
              theirScore: mySlot === 1 ? s.s0 : s.s1,
            })
          }
        />
      </GameFrame>
    );
  }

  const streak = s.turn === 0 ? s.streak0 : s.streak1;

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={<ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={s.turn} />}
    >
      <div className="mt-1">
        <TurnBanner player={players[s.turn]!} action={myTurn ? "flip two cards" : "is thinking"} />
      </div>

      {streak >= 1 ? (
        <div className="mt-2 flex justify-center">
          <StatPill label="Streak" value={streak} tone="success" />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {deck.map((sym, i) => {
          const isOpen = open.includes(i) || found.includes(i);
          const Icon = ICONS[sym] ?? Star;
          const matched = found.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-label={isOpen ? `Card ${i + 1} revealed` : `Flip card ${i + 1}`}
              disabled={!myTurn || isOpen}
              onClick={() => flip(i)}
              className={cn(
                "press grid aspect-square place-items-center rounded-2xl shadow-soft transition-all duration-200",
                matched
                  ? "bg-success/15 text-success"
                  : isOpen
                    ? "animate-flip-in bg-card text-primary ring-2 ring-primary"
                    : "bg-night text-night-muted",
              )}
            >
              {isOpen ? (
                <Icon className="h-7 w-7" strokeWidth={2.4} aria-hidden />
              ) : (
                <span
                  aria-hidden
                  className="h-6 w-6 rounded-full border-2 border-night-foreground/25"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-5">
        {s.last ? (
          <FeedbackBanner
            tone={s.last.startsWith("Match") ? "success" : "muted"}
            animateKey={s.last + s.found}
          >
            {s.last}
          </FeedbackBanner>
        ) : null}
        <Button
          variant="ghost"
          className="mt-2 h-12 w-full rounded-2xl"
          onClick={() => reset({ ...initial, deck: makeDeck() })}
        >
          Shuffle a new board
        </Button>
      </div>
    </GameFrame>
  );
}
