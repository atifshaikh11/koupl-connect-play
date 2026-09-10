import { Button } from "@/components/ui/button";
import { GameFrame, GameSummary, StatPill } from "@/components/koupl/GameShell";
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
  round: number;
  lastMove: number;
  /** Comma separated cell indexes of the winning line. */
  line: string;
  roundOver: boolean;
};

const initial: State = {
  board: EMPTY,
  turn: 0,
  winner: null,
  draw: false,
  s0: 0,
  s1: 0,
  round: 1,
  lastMove: -1,
  line: "",
  roundOver: false,
};

const idx = (r: number, c: number) => r * COLS + c;

function findWin(b: string): { player: number; cells: number[] } | null {
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
        const cells = [idx(r, c)];
        for (let n = 1; n < 4; n++) {
          const rr = r + dr! * n;
          const cc = c + dc! * n;
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || b[idx(rr, cc)] !== v) break;
          cells.push(idx(rr, cc));
        }
        if (cells.length === 4) return { player: Number(v), cells };
      }
    }
  }
  return null;
}

export function FourInARow({ game, players, mySlot, room, onFinish, onExit }: GameProps) {
  const { value: s, patch, reset } = useSharedState<State>(initial, room, game.id);
  const myTurn = mySlot === null || mySlot === s.turn;
  const finished = s.winner !== null || s.draw;
  const line = s.line ? s.line.split(",").map(Number) : [];

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
    const cell = idx(row, col);
    arr[cell] = String(s.turn);
    const board = arr.join("");
    const win = findWin(board);
    const draw = !win && !board.includes(".");
    patch({
      board,
      lastMove: cell,
      winner: win ? win.player : null,
      line: win ? win.cells.join(",") : "",
      draw,
      turn: (s.turn === 0 ? 1 : 0) as 0 | 1,
      ...(win?.player === 0 ? { s0: s.s0 + 1 } : {}),
      ...(win?.player === 1 ? { s1: s.s1 + 1 } : {}),
    });
  }

  function nextRound() {
    patch({
      board: EMPTY,
      winner: null,
      draw: false,
      line: "",
      lastMove: -1,
      round: s.round + 1,
      // Loser of the last round starts the next one.
      turn: (s.winner === 0 ? 1 : 0) as 0 | 1,
    });
  }

  if (s.roundOver) {
    return (
      <GameFrame game={game} onExit={onExit}>
        <GameSummary
          players={players}
          scores={[s.s0, s.s1]}
          headline={
            s.s0 === s.s1 ? "Dead even" : `${players[s.s0 > s.s1 ? 0 : 1].name} takes the series`
          }
          detail="Loser owes the winner one small favour. Those are the rules now."
          scored
          stats={[{ label: "Rounds", value: s.round }]}
          onRematch={() => reset({ ...initial })}
          onExit={() =>
            onFinish({
              summary: `${s.s0}–${s.s1} across ${s.round} round${s.round === 1 ? "" : "s"}`,
              myScore: mySlot === 1 ? s.s1 : s.s0,
              theirScore: mySlot === 1 ? s.s0 : s.s1,
            })
          }
        />
      </GameFrame>
    );
  }

  const fullCols = Array.from({ length: COLS }, (_, c) => s.board[idx(0, c)] !== ".");

  return (
    <GameFrame
      game={game}
      onExit={onExit}
      header={
        <ScoreBar players={players} scores={[s.s0, s.s1]} activeSlot={finished ? null : s.turn} />
      }
    >
      <div className="mt-1 flex items-center justify-between gap-2">
        <StatPill label="Round" value={s.round} />
        <div className="min-w-0 flex-1">
          {finished ? (
            <div
              className="animate-pop-in truncate rounded-full bg-success/15 px-4 py-2 text-center text-sm font-bold text-success"
              aria-live="polite"
            >
              {s.draw ? "Board full — draw" : `Four in a row for ${players[s.winner!]!.name}!`}
            </div>
          ) : (
            <TurnBanner
              player={players[s.turn]}
              action={myTurn ? "drop a disc" : "thinking about it"}
            />
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[1.75rem] bg-sky/25 p-2.5 shadow-float ring-1 ring-inset ring-sky/30">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: COLS }).map((_, c) => (
            <button
              key={c}
              type="button"
              aria-label={`Drop in column ${c + 1}`}
              disabled={finished || !myTurn || fullCols[c]}
              onClick={() => drop(c)}
              className="press group flex flex-col gap-1.5 rounded-xl py-0.5 disabled:cursor-not-allowed"
            >
              {Array.from({ length: ROWS }).map((__, r) => {
                const cell = idx(r, c);
                const v = s.board[cell];
                const inLine = line.includes(cell);
                return (
                  <span
                    key={r}
                    className={cn(
                      "aspect-square w-full rounded-full shadow-inner transition-all",
                      v === "0"
                        ? "animate-drop bg-primary"
                        : v === "1"
                          ? "animate-drop bg-sunny"
                          : "bg-card/80 group-enabled:group-hover:bg-card",
                      inLine && "ring-2 ring-success ring-offset-1 ring-offset-sky/25",
                      s.lastMove === cell && !inLine && "ring-2 ring-foreground/25",
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
          <Button size="lg" className="h-14 rounded-2xl text-base" onClick={nextRound}>
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
