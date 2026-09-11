import { useState } from "react";

import { FeedbackBanner, GameFrame, GameIntro, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { cn } from "@/lib/utils";
import { useSharedState } from "@/lib/koupl/useRoom";
import { useGameFx, useIntro } from "./shared";
import type { GameProps } from "./shared";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

type Cell = 0 | 1 | null;
type State = {
  board: Cell[];
  turn: 0 | 1;
  s0: number;
  s1: number;
  round: number;
  winLine: number[] | null;
  over: boolean;
};

const ROUNDS = 5;
const initial: State = {
  board: Array(9).fill(null),
  turn: 0,
  s0: 0,
  s1: 0,
  round: 1,
  winLine: null,
  over: false,
};

function findWin(board: Cell[]): { slot: 0 | 1; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    const v = board[a];
    if (v !== null && v === board[b] && v === board[c]) return { slot: v, line: [...line] };
  }
  return null;
}

/** Three in a row, played as a five-round series. */
export function GridClash({ game, players, mySlot, room, onFinish, onExit }: GameProps) {
  const fx = useGameFx();
  const [s, patch] = useSharedState<State>(game.id, room, initial);
  const { showIntro, startPlaying } = useIntro(s.round === 1 && s.board.every((c) => c === null));
  const [note, setNote] = useState<string | null>(null);

  const myTurn = mySlot === null || mySlot === s.turn;
  const roundOver = s.winLine !== null || s.board.every((c) => c !== null);

  function place(i: number) {
    if (roundOver || s.board[i] !== null || !myTurn) return;
    const board = [...s.board];
    board[i] = s.turn;
    const win = findWin(board);
    if (win) {
      fx.win();
      setNote(`${players[win.slot]!.name} takes the round`);
      patch({
        board,
        winLine: win.line,
        s0: s.s0 + (win.slot === 0 ? 1 : 0),
        s1: s.s1 + (win.slot === 1 ? 1 : 0),
      });
      return;
    }
    fx.tap();
    if (board.every((c) => c !== null)) {
      setNote("Drawn round — nobody scores");
      patch({ board });
      return;
    }
    patch({ board, turn: s.turn === 0 ? 1 : 0 });
  }

  function nextRound() {
    setNote(null);
    if (s.round >= ROUNDS) {
      patch({ over: true });
      return;
    }
    patch({
      board: Array(9).fill(null),
      winLine: null,
      round: s.round + 1,
      turn: (s.round % 2) as 0 | 1,
    });
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
          objective={`Classic three-in-a-row, played as a ${ROUNDS}-round series.`}
          steps={[
            "Take turns claiming a square.",
            "Line up three of yours in any direction to win the round.",
            `Whoever wins the most of ${ROUNDS} rounds takes the match.`,
          ]}
          onStart={startPlaying}
          startLabel="Claim a square"
        />
      </GameFrame>
    );
  }

  if (s.over) {
    const winner = s.s0 >= s.s1 ? 0 : 1;
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={s.s0 === s.s1 ? "All square" : `${players[winner]!.name} owns the grid`}
          detail={`Rounds won ${s.s0}–${s.s1}.`}
          scored
          onRematch={rematch}
          onExit={() =>
            onFinish({ summary: `${s.s0}–${s.s1} grid clash`, myScore: s.s0, theirScore: s.s1 })
          }
        />
      </GameFrame>
    );
  }

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      step={s.round - 1}
      total={ROUNDS}
      header={<ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={s.turn} />}
    >
      <TurnBanner
        player={players[s.turn]!}
        label={roundOver ? "Round over" : myTurn ? "your square" : "waiting for them"}
      />

      <div className="mt-4 grid flex-1 place-content-center">
        <div className="grid grid-cols-3 gap-2">
          {s.board.map((cell, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Square ${i + 1}`}
              onClick={() => place(i)}
              disabled={roundOver || cell !== null || !myTurn}
              className={cn(
                "press flex h-[clamp(76px,26vw,104px)] w-[clamp(76px,26vw,104px)] items-center justify-center rounded-2xl border-2 bg-card font-display text-3xl font-bold transition-colors",
                s.winLine?.includes(i) ? "border-success bg-success/15" : "border-border",
                cell === 0 && "text-primary",
                cell === 1 && "text-sky-foreground",
              )}
            >
              {cell === null ? "" : cell === 0 ? "●" : "▲"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {note ? <FeedbackBanner tone={s.winLine ? "good" : "neutral"} message={note} /> : null}
        {roundOver ? (
          <button
            type="button"
            onClick={nextRound}
            className="press h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
          >
            {s.round >= ROUNDS ? "See results" : "Next round"}
          </button>
        ) : null}
      </div>
    </GameFrame>
  );
}
