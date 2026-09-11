import { useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useSharedState } from "@/lib/koupl/useRoom";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const ROWS = [3, 5, 7];
const TARGET = 3;

type State = {
  rows: number[];
  turn: 0 | 1;
  taken: number[];
  s0: number;
  s1: number;
  roundOver: boolean;
  over: boolean;
};

const initial: State = {
  rows: [...ROWS],
  turn: 0,
  taken: [],
  s0: 0,
  s1: 0,
  roundOver: false,
  over: false,
};

/** Take-away duel: whoever is forced to take the final stick loses the round. */
export function LastStick({ game, players, mySlot, room, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const { value: s, patch } = useSharedState<State>(initial, room, game.id);
  const rows = s.rows as number[];
  const taken = s.taken as number[];
  const { showIntro, startPlaying } = useIntro(s.s0 + s.s1 === 0 && taken.length === 0);
  const [note, setNote] = useState<string | null>(null);

  const myTurn = mySlot === null || mySlot === s.turn;
  const activeRow = taken.length ? taken[0] : null;

  function take(row: number, count: number) {
    if (s.roundOver || !myTurn) return;
    if (activeRow !== null && activeRow !== row) return;
    const next = [...rows];
    next[row] = (next[row] ?? 0) - count;
    fx.tap();
    patch({ rows: next, taken: [row] });
  }

  function endTurn() {
    if (!taken.length || !myTurn) return;
    const left = rows.reduce((a, b) => a + b, 0);
    if (left === 0) {
      // The player who took the last stick loses the round.
      const loser = s.turn;
      const winner: 0 | 1 = loser === 0 ? 1 : 0;
      fx.win();
      setNote(`${players[loser]!.name} took the last stick — round to ${players[winner]!.name}`);
      const s0 = s.s0 + (winner === 0 ? 1 : 0);
      const s1 = s.s1 + (winner === 1 ? 1 : 0);
      patch({ s0, s1, roundOver: true, taken: [], over: s0 >= TARGET || s1 >= TARGET });
      return;
    }
    setNote(null);
    patch({ turn: s.turn === 0 ? 1 : 0, taken: [] });
  }

  function nextRound() {
    setNote(null);
    patch({ rows: [...ROWS], taken: [], turn: s.turn, roundOver: false });
  }

  function rematch() {
    setNote(null);
    patch({ ...initial });
  }

  if (showIntro) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameIntro
          game={game}
          objective={`Never take the final stick. First to ${TARGET} rounds wins.`}
          steps={[
            "On your turn, remove as many sticks as you like — but from one row only.",
            "Tap “End turn” when you're happy.",
            "Whoever is forced to take the very last stick loses the round.",
          ]}
          onStart={startPlaying}
          startLabel="Take sticks"
        />
      </GameFrame>
    );
  }

  if (s.over) {
    const winner = s.s0 > s.s1 ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={`${players[winner]!.name} out-thinks the sticks`}
          detail={`Rounds ${s.s0}–${s.s1}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${s.s0}–${s.s1} last stick`, myScore: s.s0, theirScore: s.s1 })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={<ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={s.turn} />}
    >
      <TurnBanner
        player={players[s.turn]!}
        action={s.roundOver ? "round over" : myTurn ? "take from one row" : "is thinking"}
      />

      <div className="mt-4 flex flex-1 flex-col justify-center gap-5">
        {rows.map((count, row) => (
          <div key={row} className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Take ${i + 1} from row ${row + 1}`}
                onClick={() => take(row, i + 1)}
                disabled={s.roundOver || !myTurn || (activeRow !== null && activeRow !== row)}
                className={cn(
                  "press h-14 w-5 rounded-full bg-night shadow-soft transition-opacity",
                  activeRow !== null && activeRow !== row && "opacity-30",
                )}
              />
            ))}
            {count === 0 ? (
              <span className="text-xs font-bold text-muted-foreground">row cleared</span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {note ? <FeedbackBanner tone="success">{note}</FeedbackBanner> : null}
        {s.roundOver ? (
          <button
            type="button"
            onClick={nextRound}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            Next round
          </button>
        ) : (
          <button
            type="button"
            onClick={endTurn}
            disabled={!taken.length || !myTurn}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-45"
          >
            End turn
          </button>
        )}
      </div>
    </GameFrame>
  );
}
