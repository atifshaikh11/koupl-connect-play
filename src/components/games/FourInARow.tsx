import { Button } from "@/components/ui/button";
import { GameFrame, GameSummary } from "@/components/koupl/GameShell";
import { ScoreBar, TurnBanner } from "@/components/koupl/ui";
import { useSharedState } from "@/lib/koupl/useRoom";
import { cn } from "@/lib/utils";
import type { GameProps } from "./shared";

const COLS = 7;
const ROWS = 6;
const EMPTY = ".".repeat(COLS * ROWS);

type State = {
  board: string;
  turn: 0 | 1;
  winner: number | null;
  draw: boolean;
  s0: number;
  s1: number;
  roundOver: boolean;
};

const initial: State = {
  board: EMPTY,
  turn: 0,
  winner: null,
  draw: false,
  s0: 0,
  s1: 0,
  roundOver: false,
};

const idx = (r: number, c: number) => r * COLS + c;

function findWinner(b: string): number | null {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = b[idx(r, c)];
      if (v === ".") continue;
      for (const [dr, dc] of dirs) {
        let n = 1;
        while (n < 4) {
          const rr = r + dr! * n;
          const cc = c + dc! * n;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || b[idx(rr, cc)] !== v) break;
          n++;
        }
        if (n === 4) return Number(v);
      }
    }
  }
  return null;
}

export function FourInARow({ game, players, mySlot, room, onFinish, onExit }: GameProps) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const myTurn = mySlot === null || mySlot === s.turn;
  const finished = s.winner !== null || s.draw;

  function drop(col: number) {
    if (finished || !myTurn) return;
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (s.board[idx(r, col)] === ".") {
        row = r;
        break;
      }
    }
    if (row < 0) return;
    const arr = s.board.split("");
    arr[idx(row, col)] = String(s.turn);
    const board = arr.join("");
    const winner = findWinner(board);
    const draw = !winner && !board.includes(".");
    patch({
      board,
      winner,
      draw,
      turn: (s.turn === 0 ? 1 : 0) as 0 | 1,
      ...(winner === 0 ? { s0: s.s0 + 1 } : {}),
      ...(winner === 1 ? { s1: s.s1 + 1 } : {}),
    });
  }

  if (s.roundOver) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={
            s.s0 === s.s1
              ? "Dead even"
              : `${players[s.s0 > s.s1 ? 0 : 1].name} takes the series`
          }
          detail="Loser owes the winner one small favour. Those are the rules now."
          scored
          onRematch={() => reset({ ...initial, s0: s.s0, s1: s.s1 })}
          onExit={() =>
            onFinish({
              summary: `${s.s0}–${s.s1} on the board`,
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
      header={
        <ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={finished ? null : s.turn} />
      }
    >
      <div className="mt-1">
        {finished ? (
          <div
            className="rounded-full bg-success/15 px-4 py-2 text-center text-sm font-bold text-success"
            aria-live="polite"
          >
            {s.draw ? "Board full — it's a draw" : `${players[s.winner!]!.name} connects four!`}
          </div>
        ) : (
          <TurnBanner
            player={players[s.turn]}
            action={myTurn ? "drop a disc" : "thinking about it"}
          />
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-sky/25 p-2.5 shadow-float">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              type="button"
              aria-label={`Drop in column ${c + 1}`}
              disabled={finished || !myTurn}
              onClick={() => drop(c)}
              className="press flex flex-col gap-1.5 rounded-xl disabled:cursor-not-allowed"
            >
              {Array.from({ length: ROWS }).map((__, r) => {
                const v = s.board[idx(r, c)];
                return (
                  <span
                    key={r}
                    className={cn(
                      "aspect-square w-full rounded-full transition-colors",
                      v === "0"
                        ? "animate-drop bg-primary"
                        : v === "1"
                          ? "animate-drop bg-sunny"
                          : "bg-card",
                    )}
                  />
                );
              })}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-5">
        {finished ? (
          <Button
            size="lg"
            className="h-14 rounded-2xl text-base"
            onClick={() =>
              patch({ board: EMPTY, winner: null, draw: false, turn: 0 })
            }
          >
            Next round
          </Button>
        ) : null}
        <Button
          size="lg"
          variant="ghost"
          className="h-12 rounded-2xl text-base"
          onClick={() => patch({ roundOver: true })}
        >
          Finish series
        </Button>
      </div>
    </GameFrame>
  );
}
